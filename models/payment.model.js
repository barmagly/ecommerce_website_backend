const mongoose = require("mongoose");

const PaymentStatus = ["pending", "completed", "failed", "refunded"];
const PaymentMethod = ["credit_card", "debit_card", "paypal", "bank_transfer"];

const paymentSchema = new mongoose.Schema(
    {
        orderId: { type: mongoose.Schema.Types.ObjectId, ref: "order", required: true },
        userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
        amount: { type: Number, required: true },
        status: { type: String, enum: PaymentStatus, required: true },
        paymentMethod: { type: String, enum: PaymentMethod, required: true },
        transactionId: { type: String },
    },
    { timestamps: true }
);

const Payment = mongoose.model("Payment", paymentSchema);
module.exports = Payment;