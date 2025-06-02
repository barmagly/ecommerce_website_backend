const { Product, ProductVariant } = require('../models/product.model');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const { uploadToCloudinary } = require('../utils/cloudinary');

// Add variant to product
exports.addVariant = catchAsync(async (req, res, next) => {
    const product = await Product.findById(req.params.productId);
    
    if (!product) {
        return next(new AppError('No product found with that ID', 404));
    }

    // Upload images if provided
    let variantImages = [];
    let colorImageUrl;

    if (req.files) {
        // Handle color image
        if (req.files.colorImage && req.files.colorImage[0]) {
            const colorResult = await uploadToCloudinary(req.files.colorImage[0], 'colors');
            colorImageUrl = colorResult.url;
        }

        // Handle product variant images
        if (req.files.images) {
            for (const file of req.files.images) {
                const result = await uploadToCloudinary(file, 'variants');
                variantImages.push({
                    url: result.url,
                    alt: req.body.sku,
                    isPrimary: variantImages.length === 0 // First image is primary
                });
            }
        }
    }

    // Create new variant with color image
    const variantData = {
        ...req.body,
        product: product._id,
        images: variantImages
    };

    // Add color image URL if it was uploaded
    if (colorImageUrl && req.body.color) {
        variantData.color = {
            ...req.body.color,
            image: colorImageUrl
        };
    }

    const variant = await ProductVariant.create(variantData);

    res.status(201).json({
        status: 'success',
        data: {
            variant
        }
    });
});

// Get all variants of a product
exports.getVariants = catchAsync(async (req, res, next) => {
    const variants = await ProductVariant.find({ product: req.params.productId });

    res.status(200).json({
        status: 'success',
        results: variants.length,
        data: {
            variants
        }
    });
});

// Update variant
exports.updateVariant = catchAsync(async (req, res, next) => {
    const variant = await ProductVariant.findOneAndUpdate(
        { 
            _id: req.params.variantId,
            product: req.params.productId
        },
        req.body,
        { new: true, runValidators: true }
    );

    if (!variant) {
        return next(new AppError('No variant found with that ID for this product', 404));
    }

    res.status(200).json({
        status: 'success',
        data: {
            variant
        }
    });
});

// Delete variant
exports.deleteVariant = catchAsync(async (req, res, next) => {
    const variant = await ProductVariant.findOneAndDelete({
        _id: req.params.variantId,
        product: req.params.productId
    });

    if (!variant) {
        return next(new AppError('No variant found with that ID for this product', 404));
    }

    res.status(204).json({
        status: 'success',
        data: null
    });
});

// Update variant stock
exports.updateStock = catchAsync(async (req, res, next) => {
    if (typeof req.body.quantity !== 'number' || req.body.quantity < 0) {
        return next(new AppError('Please provide a valid quantity', 400));
    }

    const variant = await ProductVariant.findOneAndUpdate(
        { 
            _id: req.params.variantId,
            product: req.params.productId
        },
        { quantity: req.body.quantity },
        { new: true, runValidators: true }
    );

    if (!variant) {
        return next(new AppError('No variant found with that ID for this product', 404));
    }

    res.status(200).json({
        status: 'success',
        data: {
            variant
        }
    });
});
