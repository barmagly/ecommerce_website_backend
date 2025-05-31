const Product = require('../models/product.model');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');

// Add variant to product
exports.addVariant = catchAsync(async (req, res, next) => {
    const product = await Product.findById(req.params.productId);
    
    if (!product) {
        return next(new AppError('No product found with that ID', 404));
    }

    // Add new variant
    product.variants.push(req.body);
    await product.save();

    res.status(201).json({
        status: 'success',
        data: {
            variant: product.variants[product.variants.length - 1]
        }
    });
});

// Get all variants of a product
exports.getVariants = catchAsync(async (req, res, next) => {
    const product = await Product.findById(req.params.productId);
    
    if (!product) {
        return next(new AppError('No product found with that ID', 404));
    }

    res.status(200).json({
        status: 'success',
        results: product.variants.length,
        data: {
            variants: product.variants
        }
    });
});

// Update variant
exports.updateVariant = catchAsync(async (req, res, next) => {
    const product = await Product.findById(req.params.productId);
    
    if (!product) {
        return next(new AppError('No product found with that ID', 404));
    }

    const variant = product.variants.id(req.params.variantId);
    if (!variant) {
        return next(new AppError('No variant found with that ID', 404));
    }

    Object.assign(variant, req.body);
    await product.save();

    res.status(200).json({
        status: 'success',
        data: {
            variant
        }
    });
});

// Delete variant
exports.deleteVariant = catchAsync(async (req, res, next) => {
    const product = await Product.findById(req.params.productId);
    
    if (!product) {
        return next(new AppError('No product found with that ID', 404));
    }

    const variant = product.variants.id(req.params.variantId);
    if (!variant) {
        return next(new AppError('No variant found with that ID', 404));
    }

    variant.remove();
    await product.save();

    res.status(204).json({
        status: 'success',
        data: null
    });
});

// Update variant stock
exports.updateStock = catchAsync(async (req, res, next) => {
    const product = await Product.findById(req.params.productId);
    
    if (!product) {
        return next(new AppError('No product found with that ID', 404));
    }

    const variant = product.variants.id(req.params.variantId);
    if (!variant) {
        return next(new AppError('No variant found with that ID', 404));
    }

    if (typeof req.body.quantity !== 'number' || req.body.quantity < 0) {
        return next(new AppError('Please provide a valid quantity', 400));
    }

    variant.quantity = req.body.quantity;
    await product.save();

    res.status(200).json({
        status: 'success',
        data: {
            variant
        }
    });
});
