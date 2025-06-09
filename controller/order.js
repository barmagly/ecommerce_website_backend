const Order = require('../models/order.model');
const Cart = require('../models/cart.model');
const { Product, ProductVariant } = require('../models/product.model');
const { uploadToCloudinary } = require('../utils/cloudinary');
const multer = require('multer');
const { default: mongoose } = require('mongoose');

// Configure multer for file upload
const storage = multer.memoryStorage();
const upload = multer({ storage: storage }).single('image');

// Create order with optional image upload
const createOrder = async (req, res, next) => {
    try {
        // رفع الصورة إن وجدت
        let imageUrl = '';
        if (req.file) {
            const cloudinaryResponse = await uploadToCloudinary(req.file, 'orders');
            imageUrl = cloudinaryResponse.url;
        }

        const userId = req.user.id;

        // جلب السلة والتحقق منها
        const cart = await Cart.findOne({ userID: userId }).populate('cartItems.prdID');
        if (!cart || !cart.cartItems.length) {
            return res.status(400).json({
                status: 'error',
                message: 'السلة فارغة'
            });
        }

        // تجهيز بيانات الأصناف والتحقق من المخزون
        const orderItems = await Promise.all(cart.cartItems.map(async (item) => {
            const product = await Product.findById(item.prdID);
            if (!product) {
                throw new Error(`لم يتم العثور على المنتج: ${item.prdID}`);
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
                image: product.images?.find(img => img.isPrimary)?.url || product.images?.[0]?.url || ''
            };
        }));

        // بدء session للـ transaction
        const session = await mongoose.startSession();
        session.startTransaction();

        try {
            // إنشاء الطلب
            const [order] = await Order.create([
                {
                    user: userId,
                    cartItems: orderItems,
                    total: cart.total,
                    ...req.body,
                    image: imageUrl,
                    status: 'pending'
                }
            ], { session });

            // تحديث المخزون
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

            // حذف السلة
            await Cart.findOneAndDelete({ userID: userId }, { session });

            // إنهاء المعاملة
            await session.commitTransaction();

            // Populate الطلب
            const populatedOrder = await Order.findById(order._id)
                .populate('user')
                .populate('cartItems.product')
                .populate('cartItems.variantId');

            res.status(201).json({ status: 'success', order: populatedOrder });
        } catch (error) {
            await session.abortTransaction();
            throw error;
        } finally {
            session.endSession();
        }
    } catch (err) {
        res.status(500).json({
            status: 'error',
            message: err.message || 'فشل في إنشاء الطلب',
            error: err.message
        });
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
        const { status } = req.body;

        const order = await Order.findByIdAndUpdate(
            id,
            { status },
            { new: true, runValidators: true }
        ).populate('user').populate('items.product');

        if (!order) {
            return res.status(404).json({ message: "Order not found" });
        }

        res.status(200).json({ status: 'success', order });
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
            await session.abortTransaction();
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

        order.status = 'cancelled';
        await order.save();

        const populatedOrder = await order
            .populate('user')
            .populate('items.product');

        res.status(200).json({ status: 'success', populatedOrder });
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
    createOrder,
    createOrderWithCart,
    cancelOrder
}
