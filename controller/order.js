const Order = require('../models/order.model');
const Cart = require('../models/cart.model');
const { Product, ProductVariant } = require('../models/product.model');
const { uploadToCloudinary } = require('../utils/cloudinary');
const multer = require('multer');
const { default: mongoose } = require('mongoose');
const { sendMail } = require('../utils/emailConfig');
const Offer = require('../models/offer.model');

const storage = multer.memoryStorage();
const upload = multer({ storage: storage }).single('image');

const createOrder = async (req, res, next) => {
    try {
        let imageUrl = '';
        if (req.file) {
            const cloudinaryResponse = await uploadToCloudinary(req.file, 'orders');
            imageUrl = cloudinaryResponse.url;
        }

        const userId = req.user.id;

        const cart = await Cart.findOne({ userID: userId }).populate('cartItems.prdID');
        if (!cart || !cart.cartItems.length) {
            return res.status(400).json({
                status: 'error',
                message: 'السلة فارغة'
            });
        }

        const validCartItems = cart.cartItems.filter(item => item.prdID && item.prdID._id);
        if (validCartItems.length === 0) {
            return res.status(400).json({
                status: 'error',
                message: 'السلة تحتوي على منتجات غير صالحة فقط'
            });
        }

        if (validCartItems.length < cart.cartItems.length) {
            cart.cartItems = validCartItems;
            let newTotal = 0;
            for (const item of validCartItems) {
                if (item.variantId) {
                    const variant = await ProductVariant.findById(item.variantId);
                    newTotal += (variant ? variant.price : item.prdID.price) * item.quantity;
                } else {
                    newTotal += item.prdID.price * item.quantity;
                }
            }
            cart.total = newTotal;
            await cart.save();
        }

        if (!req.body.city || req.body.city.trim() === '') {
            req.body.city = 'نجع حمادي';
        }

        const orderItems = await Promise.all(cart.cartItems.map(async (item, index) => {
            if (!item.prdID) {
                throw new Error(`Cart item at index ${index} has no product ID`);
            }

            const product = await Product.findById(item.prdID);
            if (!product) {
                throw new Error(`لم يتم العثور على المنتج: ${item.prdID} (Cart item index: ${index})`);
            }

            const customerAddressType = req.body.shippingAddressType || 'nag_hamadi';
            if (product.shippingAddress && product.shippingAddress.type === 'nag_hamadi' && customerAddressType === 'other_governorates') {
                throw new Error(`المنتج ${product.name} متاح للشحن في نجع حمادي فقط`);
            }

            let stockSource = product;
            let quantityField = 'stock';
            let originalPrice = product.price;
            let price = originalPrice;
            let now = new Date();

            let offer = await Offer.findOne({ type: 'product', refId: product._id, startDate: { $lte: now }, $or: [ { endDate: { $gte: now } }, { endDate: null }, { endDate: { $exists: false } } ] });
            if (!offer && product.category) {
                offer = await Offer.findOne({ type: 'category', refId: product.category, startDate: { $lte: now }, $or: [ { endDate: { $gte: now } }, { endDate: null }, { endDate: { $exists: false } } ] });
            }
            if (offer) {
                price = Math.round(originalPrice - (originalPrice * offer.discount / 100));
            }

            if (item.variantId) {
                const variant = await ProductVariant.findById(item.variantId);
                if (!variant) {
                    throw new Error(`لم يتم العثور على الـ variant للمنتج ${product.name}`);
                }

                if (variant.quantity < item.quantity) {
                    throw new Error(`المخزون غير كافٍ للـ variant الخاص بـ ${product.name}`);
                }

                stockSource = variant;
                quantityField = 'quantity';
                price = variant.price;
            } else {
                if (product.stock < item.quantity) {
                    throw new Error(`المخزون غير كافٍ للمنتج ${product.name}`);
                }
            }

            return {
                product: item.prdID,
                variantId: item.variantId || null,
                quantity: item.quantity,
                name: product.name,
                price,
                originalPrice,
                image: product.images?.find(img => img.isPrimary)?.url || product.images?.[0]?.url || product.imageCover || '',
                supplierName: product.supplierName || '',
                supplierPrice: product.supplierPrice || 0,
                shippingCost: product.shippingCost || 0,
                deliveryDays: product.deliveryDays || 2
            };
        }));

        const maxShippingCost = Math.max(...orderItems.map(item => item.shippingCost || 0));
        const maxDeliveryDays = Math.max(...orderItems.map(item => item.deliveryDays || 2));

        console.log('Order Items Shipping Costs:', orderItems.map(item => ({
            name: item.name,
            shippingCost: item.shippingCost
        })));
        console.log('Calculated Max Shipping Cost:', maxShippingCost);
        console.log('Calculated Max Delivery Days:', maxDeliveryDays);

        const session = await mongoose.startSession();
        session.startTransaction();

        try {
            const [order] = await Order.create([
                {
                    user: userId,
                    cartItems: orderItems,
                    total: cart.total,
                    shippingCost: maxShippingCost,
                    deliveryDays: maxDeliveryDays,
                    ...req.body,
                    image: imageUrl,
                    status: 'pending'
                }
            ], { session });

            for (const item of cart.cartItems) {
                if (item.variantId) {
                    await ProductVariant.findByIdAndUpdate(
                        item.variantId,
                        { $inc: { quantity: -item.quantity } },
                        { session }
                    );
                } else {
                    await Product.findByIdAndUpdate(
                        item.prdID,
                        { $inc: { stock: -item.quantity } },
                        { session }
                    );
                }
            }

            await Cart.findOneAndDelete({ userID: userId }, { session });

            await session.commitTransaction();

            const populatedOrder = await Order.findById(order._id)
                .populate('user')
                .populate('cartItems.product')
                .populate('cartItems.variantId');

            const orderRows = order.cartItems.map(item => {
                return `
                    <tr>
                        <td>
                            <img src="${item.image}" alt="${item.name}" style="width: 60px; height: auto; display: block; margin-bottom: 5px;" />
                            ${item.name}
                        </td>
                        <td>${item.quantity}</td>
                        <td>${item.price} ج.م</td>
                        <td>${item.price * item.quantity} ج.م</td>
                    </tr>
                `;
            }).join('');

            const logoUrl = 'https://res.cloudinary.com/disjyrtjb/image/upload/v1750329594/logo_thob50.png';
            const html = `
              <div style="font-family: Cairo, Arial, sans-serif; direction: rtl; background: #f9f9f9; padding: 24px;">
                <div style="max-width: 600px; margin: auto; background: #fff; border-radius: 8px; box-shadow: 0 2px 8px #eee; padding: 32px;">
                  <div style="text-align: center; margin-bottom: 24px;">
                    <img src='${logoUrl}' alt='Logo' style='max-width: 180px; margin-bottom: 8px;' />
                  </div>
                  <h2 style="color: #1976d2; text-align: center;">فاتورة طلبك</h2>
                  <hr style="margin: 16px 0;">
                  <div style="margin-bottom: 16px;">
                    <b>رقم الطلب:</b> ${order._id}<br>
                    <b>اسم العميل:</b> ${order.name}<br>
                    <b>البريد الإلكتروني:</b> ${order.email}<br>
                    <b>رقم الهاتف:</b> ${order.phone}<br>
                    <b>العنوان:</b> ${order.address}<br>
                    <b>المدينة:</b> ${order.city}<br>
                    <b>تاريخ الطلب:</b> ${order.createdAt ? new Date(order.createdAt).toLocaleDateString('ar-EG') : ''}
                  </div>
                  <table style="width: 100%; border-collapse: collapse; margin-bottom: 24px;">
                    <thead>
                      <tr style="background: #f2f2f2;">
                        <th style="padding: 8px; border: 1px solid #ddd;">المنتج</th>
                        <th style="padding: 8px; border: 1px solid #ddd;">الكمية</th>
                        <th style="padding: 8px; border: 1px solid #ddd;">السعر</th>
                        <th style="padding: 8px; border: 1px solid #ddd;">الإجمالي</th>
                      </tr>
                    </thead>
                    <tbody>
                      ${orderRows}
                    </tbody>
                  </table>
                  <h3 style="text-align: left; color: #388e3c;">الإجمالي: ${order.total} ج.م</h3>
                  <hr style="margin: 24px 0;">
                  <div style="text-align: center; color: #888;">
                    شكراً لتسوقك معنا!<br>
                    <a href="https://www.mizanoo.com" style="color: #1976d2;">Mizanoo</a>
                  </div>
                </div>
              </div>
            `;

            const attachments = [];
            if (order.paymentMethod === 'bank_transfer' && order.image) {
                attachments.push({ filename: 'instapay-receipt.jpg', path: order.image });
            }
            await sendMail(order.email, 'فاتورتك من المتجر', html, attachments);
            await sendMail('support@mizanoo.com', 'نسخة إدارية من فاتورة الطلب', html, attachments);

            res.status(201).json({ status: 'success', order: populatedOrder });

        } catch (error) {
            if (session && session.inTransaction()) {
                await session.abortTransaction();
            }
            throw error;
        } finally {
            session.endSession();
        }
    } catch (err) {
        console.error('Order creation error:', err);
        if (!res.headersSent) {
            res.status(500).json({
                status: 'error',
                message: err.message || 'فشل في إنشاء الطلب',
                error: err.message
            });
        }
    }
};

const getAllOrders = async (req, res, next) => {
    try {
        if (req.user.role == 'admin') {
            const orders = await Order.find({});
            res.status(200).json({
                status: 'success',
                count: orders.length,
                orders: orders
            });
        }
        else if (req.user.role == 'user') {
            const orders = await Order.find({ user: req.user._id });
            res.status(200).json({
                status: 'success',
                count: orders.length,
                orders: orders,
            });
        }
    } catch (err) {
        res.status(500).json({
            status: 'error', message: "Failed to retrieve orders", error: err.message
        });
    }
};

const getOrderById = async (req, res, next) => {
    try {
        const { id } = req.params;
        const order = await Order.findById(id)
            .populate('user')
            .populate('items.product');

        if (!order) {
            return res.status(404).json({ message: "Order not found" });
        }

        res.status(200).json({ status: 'success', order });
    } catch (err) {
        res.status(500).json({
            status: 'error', message: "Failed to retrieve order", error: err.message
        });
    }
};

const getUserOrders = async (req, res, next) => {
    try {
        const { userId } = req.params;
        const orders = await Order.find({ user: userId })
            .populate('items.product')
            .sort('-createdAt');

        res.status(200).json({ status: 'success', orders });
    } catch (err) {
        res.status(500).json({
            status: 'error', message: "Failed to retrieve user orders", error: err.message
        });
    }
};

const updateOrderStatus = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { status, paymentStatus } = req.body;

        const order = await Order.findById(id);
        if (!order) {
            return res.status(404).json({ message: "Order not found" });
        }

        const oldStatus = order.status;

        const session = await mongoose.startSession();
        session.startTransaction();

        try {
            order.status = status || order.status;
            order.paymentStatus = paymentStatus || order.paymentStatus;
            if (status === 'delivered') {
                order.isDelivered = true;
                order.deliveredAt = Date.now();
            } else if (status === 'cancelled') {
                order.isDelivered = false;
                order.deliveredAt = null;
            }
            await order.save({ session });

            if (status === 'cancelled' && oldStatus !== 'cancelled') {
                for (const item of order.cartItems) {
                    if (item.variantId) {
                        await ProductVariant.findByIdAndUpdate(
                            item.variantId,
                            { $inc: { quantity: item.quantity } },
                            { session }
                        );
                    } else if (item.product) {
                        await Product.findByIdAndUpdate(
                            item.product,
                            { $inc: { stock: item.quantity } },
                            { session }
                        );
                    }
                }
            }

            if (oldStatus === 'cancelled' && status !== 'cancelled') {
                for (const item of order.cartItems) {
                    if (item.variantId) {
                        await ProductVariant.findByIdAndUpdate(
                            item.variantId,
                            { $inc: { quantity: -item.quantity } },
                            { session }
                        );
                    } else if (item.product) {
                        await Product.findByIdAndUpdate(
                            item.product,
                            { $inc: { stock: -item.quantity } },
                            { session }
                        );
                    }
                }
            }

            await session.commitTransaction();

            await sendMail(order.email, 'تم تحديث حالة الطلب', `تم تحديث حالة طلبك رقم ${order._id} إلى: ${status}`);
            res.status(200).json({ status: 'success', order });

        } catch (error) {
            if (session && session.inTransaction()) {
                await session.abortTransaction();
            }
            throw error;
        } finally {
            session.endSession();
        }

    } catch (err) {
        res.status(500).json({
            status: 'error', message: "Failed to update order status", error: err.message
        });
    }
};

const createOrderWithCart = async (req, res, next) => {
    try {
        const userId = req.user._id;

        const requiredFields = ['name', 'phone', 'address', 'city', 'email'];
        const missingFields = requiredFields.filter(field => !req.body[field]);
        if (missingFields.length > 0) {
            return res.status(400).json({
                status: 'error',
                message: `Missing required fields: ${missingFields.join(', ')}`
            });
        }

        const cart = await Cart.findOne({ userID: userId }).populate('cartItems.prdID');
        if (!cart || !cart.cartItems.length) {
            return res.status(400).json({
                status: 'error',
                message: 'Cart is empty'
            });
        }

        for (const item of cart.cartItems) {
            const variant = await Product.findById(item.product);
            if (!variant) {
                throw new Error(`Variant not found for product ${item.product}`);
            }
            if (variant.stock < item.quantity) {
                throw new Error(`Insufficient stock for product ${variant.name}`);
            }
        }

        const session = await mongoose.startSession();
        session.startTransaction();

        try {
            const order = await Order.create([
                {
                    user: userId,
                    items: cart.cartItems,
                    total: cart.total,
                    ...req.body,
                    status: 'pending'
                }
            ], { session });

            for (const item of cart.cartItems) {
                const variant = await Product.findById(item.product);
                variant.stock -= item.quantity;
                await variant.save({ session });
            }

            await Cart.findOneAndDelete({ userID: userId }, { session });

            await session.commitTransaction();
            session.endSession();
            const populatedOrder = await order
                .populate('user')
                .populate('items.product');

            res.status(201).json({ status: 'success', populatedOrder });
        } catch (error) {
            if (session && session.inTransaction()) {
                await session.abortTransaction();
            }
            session.endSession();
            throw error;
        }
    } catch (err) {
        res.status(500).json({
            status: 'error',
            message: err.message || 'Failed to create order',
            error: err.message
        });
    }
};

const cancelOrder = async (req, res, next) => {
    try {
        const { id } = req.params;
        const order = await Order.findById(id);

        if (!order) {
            return res.status(404).json({ message: "Order not found" });
        }

        if (order.status === 'cancelled') {
            return res.status(200).json({ status: 'success', message: 'تم إلغاء الطلب مسبقاً', order });
        }
        if (order.status !== 'pending') {
            return res.status(400).json({
                status: 'error',
                message: 'لا يمكن إلغاء هذا الطلب إلا إذا كان في حالة قيد الانتظار (pending)',
                order
            });
        }

        const session = await mongoose.startSession();
        session.startTransaction();

        try {
            order.status = 'cancelled';
            await order.save({ session });

            for (const item of order.cartItems) {
                if (item.variantId) {
                    await ProductVariant.findByIdAndUpdate(
                        item.variantId,
                        { $inc: { quantity: item.quantity } },
                        { session }
                    );
                } else if (item.product) {
                    await Product.findByIdAndUpdate(
                        item.product,
                        { $inc: { stock: item.quantity } },
                        { session }
                    );
                }
            }

            await session.commitTransaction();
            session.endSession();

            const populatedOrder = await Order.findById(order._id)
                .populate('user')
                .populate('cartItems.product')
                .populate('cartItems.variantId');

            res.status(200).json({ status: 'success', order: populatedOrder });
            await sendMail(order.user.email, 'تم إلغاء الطلب', `تم إلغاء طلبك رقم ${order._id}.`);

        } catch (error) {
            if (session && session.inTransaction()) {
                await session.abortTransaction();
            }
            throw error;
        } finally {
            session.endSession();
        }

    } catch (err) {
        res.status(500).json({
            status: 'error', message: "Failed to cancel order", error: err.message
        });
    }
};

const sendOrderConfirmationEmail = async (req, res) => {
  try {
    const Order = require('../models/order.model');
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ message: 'Order not found' });

    const { email, isAdminCopy } = req.body;
    const subject = isAdminCopy ? 'نسخة إدارية من فاتورة الطلب' : 'فاتورتك من المتجر';
    const html = `
      <div style="font-family: Cairo, Arial, sans-serif; direction: rtl; background: #f9f9f9; padding: 24px;">
        <div style="max-width: 600px; margin: auto; background: #fff; border-radius: 8px; box-shadow: 0 2px 8px #eee; padding: 32px;">
          <div style="text-align: center; margin-bottom: 24px;">
            <img src='https://res.cloudinary.com/disjyrtjb/image/upload/v1750329594/logo_thob50.png' alt='Logo' style='max-width: 180px; margin-bottom: 8px;' />
          </div>
          <h2 style="color: #1976d2; text-align: center;">فاتورة طلبك</h2>
          <hr style="margin: 16px 0;">
          <div style="margin-bottom: 16px;">
            <b>رقم الطلب:</b> ${order._id}<br>
            <b>اسم العميل:</b> ${order.name}<br>
            <b>البريد الإلكتروني:</b> ${order.email}<br>
            <b>رقم الهاتف:</b> ${order.phone}<br>
            <b>العنوان:</b> ${order.address}<br>
            <b>المدينة:</b> ${order.city}<br>
            <b>تاريخ الطلب:</b> ${order.createdAt ? new Date(order.createdAt).toLocaleDateString('ar-EG') : ''}
          </div>
          <table style="width: 100%; border-collapse: collapse; margin-bottom: 24px;">
            <thead>
              <tr style="background: #f2f2f2;">
                <th style="padding: 8px; border: 1px solid #ddd;">المنتج</th>
                <th style="padding: 8px; border: 1px solid #ddd;">الكمية</th>
                <th style="padding: 8px; border: 1px solid #ddd;">السعر</th>
                <th style="padding: 8px; border: 1px solid #ddd;">الإجمالي</th>
              </tr>
            </thead>
            <tbody>
              ${order.cartItems.map(item => `
                <tr>
                  <td style="padding: 8px; border: 1px solid #ddd;">${item.name}</td>
                  <td style="padding: 8px; border: 1px solid #ddd;">${item.quantity}</td>
                  <td style="padding: 8px; border: 1px solid #ddd;">${item.price} ج.م</td>
                  <td style="padding: 8px; border: 1px solid #ddd;">${item.price * item.quantity} ج.م</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
          <h3 style="text-align: left; color: #388e3c;">الإجمالي: ${order.total} ج.م</h3>
          <hr style="margin: 24px 0;">
          <div style="text-align: center; color: #888;">
            شكراً لتسوقك معنا!<br>
            <a href="https://www.mizanoo.com/" style="color: #1976d2;">Mizanoo</a>
          </div>
        </div>
      </div>
    `;

    const attachments = [];
    if (order.paymentMethod === 'bank_transfer' && order.image) {
        attachments.push({ filename: 'instapay-receipt.jpg', path: order.image });
    }
    await sendMail(email, subject, html, attachments);
    res.json({ message: 'تم إرسال الفاتورة بنجاح' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'فشل في إرسال البريد الإلكتروني' });
  }
};

module.exports = {
    getAllOrders,
    getOrderById,
    getUserOrders,
    updateOrderStatus,
    createOrder,
    createOrderWithCart,
    cancelOrder,
    sendOrderConfirmationEmail
}
