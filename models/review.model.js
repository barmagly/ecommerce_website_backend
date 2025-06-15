const mongoose = require('mongoose');
const { Product, ProductVariant } = require('../models/product.model');

const reviewSchema = new mongoose.Schema(
    {
        comment: {
            type: String,
        },
        rating: {
            type: Number,
            min: [1, 'Min ratings value is 1.0'],
            max: [5, 'Max ratings value is 5.0'],
            required: [true, 'review ratings required'],
        },
        user: {
            type: mongoose.Schema.ObjectId,
            ref: 'User',
            required: [true, 'Review must belong to user'],
        },
        product: {
            type: mongoose.Schema.ObjectId,
            ref: 'Product',
            required: [true, 'Review must belong to product'],
        },
    },
    { timestamps: true }
);

// Ensure a user can only review a product once
reviewSchema.index({ product: 1, user: 1 }, { unique: true });

module.exports = mongoose.model('Review', reviewSchema);