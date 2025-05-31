const Cart = require('../models/cart.model');

const getCart = async (req, res, next) => {
    try {
        const { userId } = req.params;
        const cart = await Cart.findOne({ user: userId }).populate('items.product');
        
        if (!cart) {
            return res.status(404).json({ message: "Cart not found" });
        }
        
        res.status(200).json({ status: 'success', data: cart });
    } catch (err) {
        next({ message: "Failed to retrieve cart", error: err.message });
    }
};

const addToCart = async (req, res, next) => {
    try {
        const { userId } = req.params;
        const { productId, quantity } = req.body;

        let cart = await Cart.findOne({ user: userId });
        
        if (!cart) {
            cart = await Cart.create({
                user: userId,
                items: [{ product: productId, quantity }]
            });
        } else {
            const itemIndex = cart.items.findIndex(item => item.product.toString() === productId);
            
            if (itemIndex > -1) {
                cart.items[itemIndex].quantity += quantity;
            } else {
                cart.items.push({ product: productId, quantity });
            }
            
            await cart.save();
        }

        const populatedCart = await cart.populate('items.product');
        res.status(200).json({ status: 'success', data: populatedCart });
    } catch (err) {
        next({ message: "Failed to add item to cart", error: err.message });
    }
};

const updateCartItem = async (req, res, next) => {
    try {
        const { userId, productId } = req.params;
        const { quantity } = req.body;

        const cart = await Cart.findOne({ user: userId });
        
        if (!cart) {
            return res.status(404).json({ message: "Cart not found" });
        }

        const itemIndex = cart.items.findIndex(item => item.product.toString() === productId);
        
        if (itemIndex === -1) {
            return res.status(404).json({ message: "Item not found in cart" });
        }

        cart.items[itemIndex].quantity = quantity;
        await cart.save();

        const populatedCart = await cart.populate('items.product');
        res.status(200).json({ status: 'success', data: populatedCart });
    } catch (err) {
        next({ message: "Failed to update cart item", error: err.message });
    }
};

const removeFromCart = async (req, res, next) => {
    try {
        const { userId, productId } = req.params;

        const cart = await Cart.findOne({ user: userId });
        
        if (!cart) {
            return res.status(404).json({ message: "Cart not found" });
        }

        cart.items = cart.items.filter(item => item.product.toString() !== productId);
        await cart.save();

        const populatedCart = await cart.populate('items.product');
        res.status(200).json({ status: 'success', data: populatedCart });
    } catch (err) {
        next({ message: "Failed to remove item from cart", error: err.message });
    }
};

const clearCart = async (req, res, next) => {
    try {
        const { userId } = req.params;

        const cart = await Cart.findOne({ user: userId });
        
        if (!cart) {
            return res.status(404).json({ message: "Cart not found" });
        }

        cart.items = [];
        await cart.save();
        
        res.status(200).json({ status: 'success', data: cart });
    } catch (err) {
        next({ message: "Failed to clear cart", error: err.message });
    }
};

module.exports = {
    getCart,
    addToCart,
    updateCartItem,
    removeFromCart,
    clearCart
};
