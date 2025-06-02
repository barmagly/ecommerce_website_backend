const CartModel = require("../models/cart.model");
const {Product,ProductVariant} = require("../models/product.model");
//200 => ok              //201 => created
//202 => accepted        //400 => bad request
//401 => unauthorized    //403 => forbidden     //404 => not found

let getCurrentUserCart = async (req, res) => {
    try {
        if (req.user.role !== 'user') {
            return res.status(403).json("Only Users can delete cart");
        }
        let userCart = await CartModel.find({ userID: req.user.id });
        res.status(200).json(userCart);
    } catch (error) {
        res.status(500).json({ message: "Failed get user cart", error: error.message });
    }
}

let clearCart = async (req, res) => {
    try {
        if (req.user.role !== 'user') {
            return res.status(403).json("Only Users can delete cart");
        }
        const { id } = req.params
        let cart = await CartModel.findOneAndDelete({ _id: id, userID: req.user.id });
        if (!cart) {
            return res.status(403).json({ message: "Users can delete thier carts only or cart not found" });
        }
        res.status(200).json({ message: "cart deleted" });
    } catch (error) {
        res.status(500).json({ message: "Failed clear cart", error: error.message });
    }
}

let addTOCart = async (req, res) => {
    try {
        if (req.user.role !== 'user') {
            return res.status(403).json("Only Users can add to cart");
        }
        
        const { prdID, quantity } = req.body;
        let cart = await CartModel.findOne({ userID: req.user.id });

        if (!cart) {
            cart = new CartModel({userID: req.user.id,cartItems:[]});
        }
        let existingItem = cart.cartItems.find(item => item.prdID == prdID);
        if (existingItem) {
            existingItem.quantity += quantity;
        } else {
            cart.cartItems.push({ prdID, quantity });
        }
        if(quantity==0)
        {
            cart.cartItems = cart.cartItems.filter(item => item.prdID != prdID);
        }
        cart.total = await calculateSubTotal(cart.cartItems);
        await cart.save();
        res.status(200).json(cart);
    } catch (error) {
        res.status(500).json({ message: "Failed make cart operation", error: error.message });
    }
}
const calculateSubTotal = async (orderItems) => {
    let subTotal = 0;

    for (const item of orderItems) {

        const product = await Product.findById(item.prdID);
        if (!product) throw new Error("Product not found");
        subTotal += product.price.currentPrice * item.quantity;
    }

    return subTotal;
};

module.exports = {
    clearCart,
    addTOCart,
    getCurrentUserCart,
};