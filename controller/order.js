const Order = require('../models/order.model');
const Cart = require('../models/cart.model');

const getAllOrders = async (req, res, next) => {
    try {
        const orders = await Order.find()
            .populate('user')
            .populate('items.product');
        res.status(200).json({ status: 'success', data: orders });
    } catch (err) {
        next({ message: "Failed to retrieve orders", error: err.message });
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

        res.status(200).json({ status: 'success', data: order });
    } catch (err) {
        next({ message: "Failed to retrieve order", error: err.message });
    }
};

const getUserOrders = async (req, res, next) => {
    try {
        const { userId } = req.params;
        const orders = await Order.find({ user: userId })
            .populate('items.product')
            .sort('-createdAt');
            
        res.status(200).json({ status: 'success', data: orders });
    } catch (err) {
        next({ message: "Failed to retrieve user orders", error: err.message });
    }
};

const createOrder = async (req, res, next) => {
    try {
        const { userId, items, shippingAddress, paymentMethod } = req.body;

        // Calculate total amount
        const total = items.reduce((sum, item) => {
            return sum + (item.price * item.quantity);
        }, 0);

        const order = await Order.create({
            user: userId,
            items,
            total,
            shippingAddress,
            paymentMethod,
            status: 'pending'
        });

        // Clear user's cart after successful order creation
        await Cart.findOneAndUpdate(
            { user: userId },
            { $set: { items: [] } }
        );

        const populatedOrder = await order
            .populate('user')
            .populate('items.product');

        res.status(201).json({ status: 'success', data: populatedOrder });
    } catch (err) {
        next({ message: "Failed to create order", error: err.message });
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

        res.status(200).json({ status: 'success', data: order });
    } catch (err) {
        next({ message: "Failed to update order status", error: err.message });
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

        res.status(200).json({ status: 'success', data: populatedOrder });
    } catch (err) {
        next({ message: "Failed to cancel order", error: err.message });
    }
};

module.exports = {
    getAllOrders,
    getOrderById,
    getUserOrders,
    createOrder,
    updateOrderStatus,
    cancelOrder
};
