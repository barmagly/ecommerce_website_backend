const mongoose = require('mongoose');

const couponSchema = new mongoose.Schema(
    {
        code: {
            type: String,
            trim: true,
            required: [true, 'Coupon code required'],
            unique: true,
            uppercase: true,
        },
        name: {
            type: String,
            trim: true,
        },
        expire: {
            type: Date,
            default: null,
        },
        discount: {
            type: Number,
            required: [true, 'Coupon discount value required'],
        },
        type: {
            type: String,
            enum: ['percentage', 'fixed'],
            default: 'percentage',
        },
        minAmount: {
            type: Number,
            default: 0,
        },
        maxDiscount: {
            type: Number,
        },
        usageLimit: {
            type: Number,
        },
        usedCount: {
            type: Number,
            default: 0,
        },
        isActive: {
            type: Boolean,
            default: true,
        },
        startDate: {
            type: Date,
            required: [true, 'Coupon start date required'],
        },
        categories: [{
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Category'
        }],
        products: [{
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Product'
        }],
        applyTo: {
            type: String,
            enum: ['all', 'categories', 'products'],
            default: 'all'
        },
        usedBy: [{
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        }]
    },
    { timestamps: true }
);

const Coupon = mongoose.model('Coupon', couponSchema);
module.exports = Coupon;