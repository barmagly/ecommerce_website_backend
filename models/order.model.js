const mongoose = require('mongoose');

const orderItemSchema = new mongoose.Schema({
    product: {
        type: mongoose.Schema.ObjectId,
        ref: 'Product',
        required: true
    },
    variantId: {
        type: mongoose.Schema.ObjectId,
        ref: 'ProductVariant',
        required: false
    },
    quantity: {
        type: Number,
        required: true,
    },
    name: String,
    price: Number,
    image: String
});

const OrderSchema = new mongoose.Schema({
    total: Number,
    cartItems: [orderItemSchema], 
    user: {
        type: mongoose.Schema.ObjectId,
        ref: 'User',
        required: true
    },
    shippingAddress: {
        type: String,
        required: true
    },
    status: {
        type: String,
        enum: ["pending", "delivered", "cancelled", "shipped", "processing"],
        default: "pending"
    },
    isDelivered: {
        type: Boolean,
        default: false,
    },
    deliveredAt: Date,
    name: String,
    phone: String,
    address: String,
    city: String,
    postalCode: String,
    country: String,
    email: String,
    image: {
        type: String,
        default: ''
    },
    paymentMethod: {
        type: String,
        enum: ["credit_card", "debit_card", "paypal", "bank_transfer", "cash_on_delivery"],
        required: true
    },
    paymentStatus: {
        type: String,
        enum: ["pending", "completed", "failed", "refunded"],
        default: "pending"
    }
}, { timestamps: true });

const OrderModel = mongoose.model('order', OrderSchema);
module.exports = OrderModel;
