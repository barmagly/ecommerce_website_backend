const mongoose = require('mongoose');

function round2(val) {
  return Math.round(Number(val) * 100) / 100;
}

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
    price: { type: Number, set: round2 },
    image: String,
    supplierName: String,
    supplierPrice: { type: Number, set: round2 }
});

const OrderSchema = new mongoose.Schema({
    total: { type: Number, set: round2 },
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
    shippingAddressType: {
        type: String,
        enum: ['nag_hamadi', 'other_governorates'],
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
        enum: ["pending", "paid", "failed", "refunded"],
        default: "pending"
    },
    shippingCost: { type: Number, default: 0, set: round2 },
    deliveryDays: { type: Number, default: 2 },
}, { timestamps: true });

OrderSchema.pre('save', function(next) {
  if (this.cartItems && Array.isArray(this.cartItems)) {
    this.cartItems.forEach(item => {
      if (item.price != null) item.price = round2(item.price);
      if (item.supplierPrice != null) item.supplierPrice = round2(item.supplierPrice);
    });
  }
  if (this.total != null) this.total = round2(this.total);
  if (this.shippingCost != null) this.shippingCost = round2(this.shippingCost);
  next();
});

const OrderModel = mongoose.model('order', OrderSchema);
module.exports = OrderModel;
