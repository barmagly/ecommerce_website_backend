const Order = require('../models/order.model');
const Cart = require('../models/cart.model');
const { Product, ProductVariant } = require('../models/product.model');
const { uploadToCloudinary } = require('../utils/cloudinary');
const multer = require('multer');
const { default: mongoose } = require('mongoose');
const { sendMail } = require('../utils/emailConfig');

// Configure multer for file upload
const storage = multer.memoryStorage();
const upload = multer({ storage: storage }).single('image');

// Create order with optional image upload
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

        // Clean up invalid cart items (those with null or missing product IDs)
        const validCartItems = cart.cartItems.filter(item => item.prdID && item.prdID._id);
        if (validCartItems.length === 0) {
            return res.status(400).json({
                status: 'error',
                message: 'السلة تحتوي على منتجات غير صالحة فقط'
            });
        }

        // If some items were removed, update the cart
        if (validCartItems.length < cart.cartItems.length) {
            cart.cartItems = validCartItems;
            // Recalculate total
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

        const orderItems = await Promise.all(cart.cartItems.map(async (item, index) => {
            // Validate that prdID exists and is not null
            if (!item.prdID) {
                throw new Error(`Cart item at index ${index} has no product ID`);
            }

            const product = await Product.findById(item.prdID);
            if (!product) {
                throw new Error(`لم يتم العثور على المنتج: ${item.prdID} (Cart item index: ${index})`);
            }

            // التحقق من نطاق الشحن
            const customerAddressType = req.body.shippingAddressType || 'nag_hamadi';
            if (product.shippingAddress && product.shippingAddress.type === 'nag_hamadi' && customerAddressType === 'other_governorates') {
                throw new Error(`المنتج ${product.name} متاح للشحن في نجع حمادي فقط`);
            }

            let stockSource = product;
            let quantityField = 'stock';
            let price = product.price;

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
                image: product.images?.find(img => img.isPrimary)?.url || product.images?.[0]?.url || '',
                supplierName: product.supplierName || '',
                supplierPrice: product.supplierPrice || 0,
                shippingCost: product.shippingCost || 0,
                deliveryDays: product.deliveryDays || 2
            };
        }));

        // Calculate maximum shipping cost and maximum delivery days
        const maxShippingCost = Math.max(...orderItems.map(item => item.shippingCost || 0));
        const maxDeliveryDays = Math.max(...orderItems.map(item => item.deliveryDays || 2));

        // Debug logging
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

            const htmlContent = `
                <div style="font-family: Arial, sans-serif; direction: rtl; text-align: right;">
                    <h2 style="color: #333;">تفاصيل الطلب رقم: ${order._id}</h2>
                    <p>شكراً لك على طلبك من متجرنا!</p>
            
                    <table border="1" cellpadding="8" cellspacing="0" style="border-collapse: collapse; width: 100%; text-align: center;">
                        <thead style="background-color: #f2f2f2;">
                            <tr>
                                <th>المنتج</th>
                                <th>الكمية</th>
                                <th>السعر الفردي</th>
                                <th>الإجمالي</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${orderRows}
                        </tbody>
                    </table>
            
                    <p style="margin-top: 15px;"><strong>الإجمالي الكلي:</strong> ${order.total} ج.م</p>
            
                    <hr style="margin: 30px 0;" />
            
                    <p style="text-align: center; color: #777;">مع تحيات فريق <strong style="color: #0d6efd;">ميزانو</strong> 👨‍💻💙</p>
                </div>
            `;

            await sendMail(req.user.email, 'تم إنشاء طلبك بنجاح', htmlContent);
            // Send response once all operations succeed
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

        // Start transaction for stock restoration
        const session = await mongoose.startSession();
        session.startTransaction();

        try {
            // Update order status
            order.status = status || order.status; // Update status if provided
            order.paymentStatus = paymentStatus || order.paymentStatus; // Update payment method if provided
            if (status === 'delivered') {
                order.isDelivered = true;
                order.deliveredAt = Date.now();
            } else if (status === 'cancelled') {
                order.isDelivered = false;
                order.deliveredAt = null; // Reset deliveredAt if cancelled
            }
            await order.save({ session });

            // If order is being cancelled, restore stock
            if (status === 'cancelled' && order.status !== 'cancelled') {
                console.log('Restoring stock for cancelled order:', order._id);

                for (const item of order.cartItems) {
                    if (item.variantId) {
                        // Restore quantity to variant
                        await ProductVariant.findByIdAndUpdate(
                            item.variantId,
                            { $inc: { quantity: item.quantity } },
                            { session }
                        );
                        console.log(`Restored ${item.quantity} units to variant ${item.variantId}`);
                    } else {
                        // Restore quantity to main product
                        await Product.findByIdAndUpdate(
                            item.product,
                            { $inc: { stock: item.quantity } },
                            { session }
                        );
                        console.log(`Restored ${item.quantity} units to product ${item.product}`);
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

        // Validate required fields
        const requiredFields = ['name', 'phone', 'address', 'city', 'email'];
        const missingFields = requiredFields.filter(field => !req.body[field]);
        if (missingFields.length > 0) {
            return res.status(400).json({
                status: 'error',
                message: `Missing required fields: ${missingFields.join(', ')}`
            });
        }

        // Get cart and validate
        const cart = await Cart.findOne({ userID: userId }).populate('cartItems.prdID');
        if (!cart || !cart.cartItems.length) {
            return res.status(400).json({
                status: 'error',
                message: 'Cart is empty'
            });
        }

        // Validate stock for each item
        for (const item of cart.cartItems) {
            const variant = await Product.findById(item.product);
            if (!variant) {
                throw new Error(`Variant not found for product ${item.product}`);
            }
            if (variant.stock < item.quantity) {
                throw new Error(`Insufficient stock for product ${variant.name}`);
            }
        }

        // Start transaction
        const session = await mongoose.startSession();
        session.startTransaction();

        try {
            // Create order
            const order = await Order.create([
                {
                    user: userId,
                    items: cart.cartItems,
                    total: cart.total,
                    ...req.body,
                    status: 'pending'
                }
            ], { session });

            // Update variant stock
            for (const item of cart.cartItems) {
                const variant = await Product.findById(item.product);
                variant.stock -= item.quantity;
                await variant.save({ session });
            }

            // Clear cart
            await Cart.findOneAndDelete({ userID: userId }, { session });

            // Commit transaction
            await session.commitTransaction();
            session.endSession();

            // Populate and return order
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

        if (order.status !== 'pending') {
            return res.status(400).json({
                message: "Only pending orders can be cancelled"
            });
        }

        // Start transaction for stock restoration
        const session = await mongoose.startSession();
        session.startTransaction();

        try {
            // Update order status
            order.status = 'cancelled';
            await order.save({ session });

            // Restore stock quantities
            console.log('Restoring stock for cancelled order:', order._id);

            for (const item of order.cartItems) {
                if (item.variantId) {
                    // Restore quantity to variant
                    await ProductVariant.findByIdAndUpdate(
                        item.variantId,
                        { $inc: { quantity: item.quantity } },
                        { session }
                    );
                    console.log(`Restored ${item.quantity} units to variant ${item.variantId}`);
                } else {
                    // Restore quantity to main product
                    await Product.findByIdAndUpdate(
                        item.product,
                        { $inc: { stock: item.quantity } },
                        { session }
                    );
                    console.log(`Restored ${item.quantity} units to product ${item.product}`);
                }
            }

            await session.commitTransaction();

            const populatedOrder = await order
                .populate('user')
                .populate('cartItems.product')
                .populate('cartItems.variantId');

            res.status(200).json({ status: 'success', populatedOrder });
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

module.exports = {
    getAllOrders,
    getOrderById,
    getUserOrders,
    updateOrderStatus,
    // updateUserOrderStatus,
    createOrder,
    createOrderWithCart,
    cancelOrder
}
