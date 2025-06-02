const Order = require('../models/order.model');
const Cart = require('../models/cart.model');
const { Product } = require('../models/product.model');

const getAllOrders = async (req, res, next) => {
    try {
        const orders = await Order.find()
            .populate('user')
            .populate('items.product');
        res.status(200).json({ status: 'success', orders });
    } catch (err) {
        res.status(500).json({
            status: 'error', message: "Failed to retrieve orders", error: err.message });
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
            status: 'error', message: "Failed to retrieve order", error: err.message });
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
            status: 'error', message: "Failed to retrieve user orders", error: err.message });
    }
};

const createOrder = async (req, res, next) => {
    try {
        const userId= req.user._id; // Assuming user ID is available in req.user
        const { shippingAddress } = req.body;

        // Calculate total amount
       
        const cart = await Cart.findOne({ userID: userId })

        const order = await Order.create({
            user: userId, // Assuming user ID is available in req.user
            items: cart.cartItems,
            total: cart.total,
            shippingAddress,
            status: 'pending'
        });

        // Clear user's cart after successful order creation
        await Cart.findOneAndDelete({ userID: userId });

        for (const item of order.items) {
        const product = await Product.findById(item.product);
        if (product) {
        //   product. -= item.quantity;
          await product.save();
        }
      }

        const populatedOrder = await order
            .populate('user')
            .populate('items.product');

        res.status(201).json({ status: 'success', populatedOrder });
    } catch (err) {
        res.status(500).json({
            status: 'error', message: "Failed to create order", error: err.message });
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
            status: 'error', message: "Failed to update order status", error: err.message });
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
            status: 'error', message: "Failed to cancel order", error: err.message });
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
