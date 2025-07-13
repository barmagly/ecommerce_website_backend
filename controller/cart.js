const CartModel = require("../models/cart.model");
const { Product, ProductVariant } = require("../models/product.model");
const Offer = require('../models/offer.model');
const Category = require('../models/category.model');

let getCurrentUserCart = async (req, res) => {
    try {
        if (req.user.role !== "user") {
            return res.status(403).json({ message: "Only Users can access their cart" });
        }
        let userCart = await CartModel.find({ userID: req.user._id }).populate({
            path: 'cartItems.prdID',
            model: 'Product',
            select: 'images imageCover name price stock maxQuantityPerOrder shippingCost deliveryDays shippingAddress category'
        })
        .populate({
            path: 'cartItems.variantId',
            model: 'ProductVariant',
            select: 'sku price quantity images'
        });

        console.log('userCart:', JSON.stringify(userCart, null, 2));
        userCart.forEach(cart => {
            cart.cartItems = cart.cartItems.filter(item => item.prdID);
        });
        await Promise.all(userCart.map(async (cart, cartIdx) => {
            await Promise.all(cart.cartItems.map(async (item, itemIdx) => {
                try {
                    let product = item.prdID;
                    let originalPrice = product?.price;
                    let price = originalPrice;
                    let now = new Date();
                    console.log(`🔎 [cart ${cartIdx} item ${itemIdx}] productId:`, product?._id, 'category:', product?.category);

                    let offer = await Offer.findOne({ type: 'product', refId: product?._id, startDate: { $lte: now }, $or: [ { endDate: { $gte: now } }, { endDate: null }, { endDate: { $exists: false } } ] });
                    console.log(`🔎 [cart ${cartIdx} item ${itemIdx}] product offer:`, offer);
                    if (!offer && product?.category) {
                        offer = await Offer.findOne({ type: 'category', refId: product.category, startDate: { $lte: now }, $or: [ { endDate: { $gte: now } }, { endDate: null }, { endDate: { $exists: false } } ] });
                        console.log(`🔎 [cart ${cartIdx} item ${itemIdx}] category offer:`, offer);
                    }
                    if (offer) {
                        price = Math.round(originalPrice - (originalPrice * offer.discount / 100));
                    }
                    item.prdID = {
                        ...product.toObject(),
                        price,
                        originalPrice
                    };
                } catch (err) {
                    console.error(`❌ Error processing cart item [cart ${cartIdx} item ${itemIdx}]`, err);
                    throw err;
                }
            }));
        }));
        res.status(200).json(userCart);
    } catch (error) {
        console.error('❌ getCurrentUserCart error:', error);
        res.status(500).json({ message: "Server error", error });
    }
};

let clearCart = async (req, res) => {
    try {
        const { id } = req.params;
        let query = { _id: id };
        
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
        
        console.log("Cart API Request Body:", req.body);
        console.log("Extracted values:", { prdID, variantId, quantity });
        console.log("User ID:", req.user._id);
        
        if (!prdID) {
            console.log("Validation failed: prdID is missing");
            return res.status(400).json({ message: "Product ID is required" });
        }
        
        if (quantity === undefined || quantity === null) {
            console.log("Validation failed: quantity is missing");
            return res.status(400).json({ message: "Quantity is required" });
        }
        
        if (quantity < 0) {
            console.log("Validation failed: quantity is negative:", quantity);
            return res.status(400).json({ message: "Quantity cannot be negative" });
        }
        
        if (quantity > 0) {
            const product = await Product.findById(prdID);
            if (product && product.maxQuantityPerOrder) {
                let currentQuantity = 0;
                const existingCart = await CartModel.findOne({ userID: req.user._id });
                if (existingCart) {
                    const existingItem = existingCart.cartItems.find(item => {
                        if (!item.prdID || !prdID) return false;
                        const itemPrdIDStr = item.prdID.toString();
                        const requestPrdIDStr = prdID.toString();
                        
                        if (variantId) {
                            return itemPrdIDStr === requestPrdIDStr && 
                                   item.variantId && 
                                   item.variantId.toString() === variantId.toString();
                        } else {
                            return itemPrdIDStr === requestPrdIDStr && !item.variantId;
                        }
                    });
                    if (existingItem) {
                        currentQuantity = existingItem.quantity;
                    }
                }
                
                const newTotalQuantity = currentQuantity + quantity;
                if (newTotalQuantity > product.maxQuantityPerOrder) {
                    return res.status(400).json({ 
                        message: `لا يمكن شراء أكثر من ${product.maxQuantityPerOrder} قطع من هذا المنتج في الطلب الواحد`,
                        maxQuantity: product.maxQuantityPerOrder,
                        currentQuantity: currentQuantity,
                        requestedQuantity: quantity
                    });
                }
            }
        }
        
        let cart = await CartModel.findOne({ userID: req.user._id });

        if (!cart) {
            cart = new CartModel({ userID: req.user._id, cartItems: [] });
        } else {
            cart.cartItems = cart.cartItems.filter(item => item.prdID && item.prdID.toString);
        }

        let existingItem = cart.cartItems.find((item) => {
            console.log('🔍 Checking item:', {
                itemPrdID: item.prdID ? item.prdID.toString() : 'null',
                requestPrdID: prdID ? prdID.toString() : 'null',
                itemVariantId: item.variantId ? item.variantId.toString() : 'null',
                requestVariantId: variantId ? variantId.toString() : 'null',
                prdMatch: item.prdID && item.prdID.toString() === prdID.toString(),
                variantMatch: variantId 
                    ? (item.variantId && item.variantId.toString() === variantId.toString())
                    : !item.variantId
            });
            
            if (!item.prdID || !prdID) {
                console.log('❌ Skipping item - missing prdID');
                return false;
            }
            
            const itemPrdIDStr = item.prdID.toString();
            const requestPrdIDStr = prdID.toString();
            
            if (variantId) {
                if (!item.variantId) {
                    console.log('❌ Skipping item - no variantId but request has variantId');
                    return false;
                }
                const match = itemPrdIDStr === requestPrdIDStr && item.variantId.toString() === variantId.toString();
                console.log('✅ Variant item match:', match);
                return match;
            } else {
                const match = itemPrdIDStr === requestPrdIDStr && !item.variantId;
                console.log('✅ Non-variant item match:', match);
                return match;
            }
        });

        console.log('🔍 Found existing item:', existingItem ? {
            prdID: existingItem.prdID.toString(),
            variantId: existingItem.variantId ? existingItem.variantId.toString() : null,
            quantity: existingItem.quantity
        } : 'No existing item found');

        console.log('Cart before update:', JSON.stringify(cart.cartItems, null, 2));
        if (existingItem) {
            console.log('📝 Updating existing item quantity from', existingItem.quantity, 'to', quantity === 0 ? 0 : existingItem.quantity + quantity);
            if (quantity === 0) {
                existingItem.quantity = 0;
            } else {
                existingItem.quantity += quantity;
            }
            console.log('📝 New quantity:', existingItem.quantity);

            if (existingItem.quantity <= 0) {
                console.log('🗑️ Attempting to remove item with prdID:', prdID, 'variantId:', variantId);
                console.log('📋 Current cart items before removal:', cart.cartItems.map(item => ({
                    prdID: item.prdID.toString(),
                    variantId: item.variantId ? item.variantId.toString() : null,
                    quantity: item.quantity
                })));
                
                cart.cartItems = cart.cartItems.filter((item) => {
                    const prdMatch = item.prdID && item.prdID.toString() !== prdID.toString();
                    
                    const variantMatch = variantId
                        ? !(item.variantId && item.variantId.toString() === variantId.toString())
                        : !!(item.variantId); 
                    
                    const shouldKeep = prdMatch || variantMatch;
                    console.log(`🔍 Item ${item.prdID.toString()} (variant: ${item.variantId ? item.variantId.toString() : 'null'}): prdMatch=${prdMatch}, variantMatch=${variantMatch}, keep=${shouldKeep}`);
                    
                    return shouldKeep;
                });
                
                console.log('📋 Cart items after removal:', cart.cartItems.map(item => ({
                    prdID: item.prdID.toString(),
                    variantId: item.variantId ? item.variantId.toString() : null,
                    quantity: item.quantity
                })));
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
        console.log('Cart after update:', JSON.stringify(cart.cartItems, null, 2));

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
        console.log('Cart before update:', JSON.stringify(cart.cartItems, null, 2));
        await cart.save();
        console.log('Cart saved!');
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
                select: 'name email phone avatar'
            })
            .populate({
                path: 'cartItems.prdID',
                select: 'name price images stock maxQuantityPerOrder shippingCost deliveryDays shippingAddress'
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
                select: 'name email phone avatar'
            })
            .populate({
                path: 'cartItems.prdID',
                select: 'name price images stock maxQuantityPerOrder shippingCost deliveryDays shippingAddress'
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
