const mongoose = require('mongoose');
const orderItemSchema = new mongoose.Schema({
    product: {
        type: mongoose.Schema.ObjectId,
        ref: 'Product',
        required: true
    },
    quantity: {
        type: Number,
        required: true,
    }
})

const OrderSchema = new mongoose.Schema({
    total: Number,
    items: [orderItemSchema],
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
}, { timestamps: true });

const OrderModel = mongoose.model('order', OrderSchema);
module.exports = OrderModel;