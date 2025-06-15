const CartModel = require("../models/cart.model");
const { Product, ProductVariant } = require("../models/product.model");

let getCurrentUserCart = async (req, res) => {
    try {
        if (req.user.role !== "user") {
            return res.status(403).json({ message: "Only Users can access their cart" });
        }
        let userCart = await CartModel.find({ userID: req.user._id }).populate({
            path: 'cartItems.prdID',
            model: 'Product',
            select: 'images name price stock'
        })
        .populate({
            path: 'cartItems.variantId',
            model: 'ProductVariant',
            select: 'sku price quantity images'
        });

        res.status(200).json(userCart);
    } catch (error) {
        res.status(500).json({ message: "Server error", error });
    }
};

let clearCart = async (req, res) => {
    try {
        const { id } = req.params;
        let query = { _id: id };
        
        // If user is not admin, they can only delete their own cart
        if (req.user.role !== "admin") {
            query.userID = req.user._id;
        }

        let cart = await CartModel.findOneAndDelete(query);
        
        if (!cart) {
            return res.status(404).json({
                message: "Cart not found or you don't have permission to delete it",
            });
        }
        
        res.status(200).json({ message: "Cart deleted successfully" });
    } catch (error) {
        res.status(500).json({ message: "Server error", error });
    }
};

let addTOCart = async (req, res) => {
    try {
        if (req.user.role !== "user") {
            return res.status(403).json("Only Users can add to cart");
        }

        let { prdID, variantId = null, quantity } = req.body;
        
        let cart = await CartModel.findOne({ userID: req.user.id });

        if (!cart) {
            cart = new CartModel({ userID: req.user.id, cartItems: [] });
        }

        let existingItem = cart.cartItems.find((item) => {
            if (variantId) {
                return (
                    item.prdID.toString() === prdID.toString() &&
                    item.variantId &&
                    item.variantId.toString() === variantId.toString()
                );
            } else {
                return (
                    item.prdID.toString() === prdID.toString() && !item.variantId
                );
            }
        });
        
        if (existingItem) {
            existingItem.quantity += quantity;

            if (existingItem.quantity <= 0||quantity==0) {
                cart.cartItems = cart.cartItems.filter((item) => item !== existingItem);
            }
        } else {
            if (quantity > 0) {
                const newItem = {
                    prdID,
                    quantity,
                };

                if (variantId) {
                    newItem.variantId = variantId;
                }

                cart.cartItems.push(newItem);
            }
        }

        let subTotal = 0;
        for (const item of cart.cartItems) {
            try {
                const product = await Product.findById(item.prdID);
                if (product) {
                    let price;
                    if (item.variantId) {
                        const variant = await ProductVariant.findById(item.variantId);
                        price = variant
                            ? variant.price
                            : product.price;
                    } else {
                        price = product.price;
                    }
                    subTotal += price * item.quantity;
                }
            } catch (err) {
                console.error("Error calculating price for item:", err);
            }
        }

        cart.total = subTotal;
        await cart.save();        
        res.status(200).json(cart);
    } catch (error) {
        console.error("Server error:", error);
        res.status(500).json({ message: "Server error", error: error.message });
    }
};

let getAllCarts = async (req, res) => {
    try {
        if (req.user.role !== "admin") {
            return res.status(403).json({ message: "Only admins can access all carts" });
        }

        const carts = await CartModel.find()
            .populate({
                path: 'userID',
                select: 'name email avatar'
            })
            .populate({
                path: 'cartItems.prdID',
                select: 'name price images stock'
            })
            .populate({
                path: 'cartItems.variantId',
                select: 'sku price quantity images'
            });

        console.log("Populated Carts Data:", JSON.stringify(carts, null, 2));

        res.status(200).json({ carts });
    } catch (error) {
        res.status(500).json({ message: "Server error", error });
    }
};

let getOneCart = async (req, res) => {
    try {
        if (req.user.role !== "admin") {
            return res.status(403).json({ message: "Only admins can access cart details" });
        }

        const { id } = req.params;
        const cart = await CartModel.findById(id)
            .populate({
                path: 'userID',
                select: 'name email avatar'
            })
            .populate({
                path: 'cartItems.prdID',
                select: 'name price images stock'
            })
            .populate({
                path: 'cartItems.variantId',
                select: 'sku price quantity images'
            });

        if (!cart) {
            return res.status(404).json({ message: "Cart not found" });
        }

        res.status(200).json({ cart });
    } catch (error) {
        res.status(500).json({ message: "Server error", error });
    }
};

module.exports = {
    clearCart,
    addTOCart,
    getCurrentUserCart,
    getAllCarts,
    getOneCart
};
