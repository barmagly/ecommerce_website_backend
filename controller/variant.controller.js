const { Product, ProductVariant } = require('../models/product.model');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const { uploadToCloudinary } = require('../utils/cloudinary');

// Add variant to product
exports.addVariant = catchAsync(async (req, res, next) => {
    try {

        const product = await Product.findById(req.params.productId);

        if (!product) {
            return next(new AppError('No product found with that ID', 404));
        }
        const variantt = await ProductVariant.findOne({ sku: req.body.sku });
        if (variantt) {
            return res.status(400).json({
                success: false,
                status: 'error',
                message: 'Variant with this SKU already exists'
            });
        }
        // Upload images if provided
        let variantImages = [];

        if (req.files) {

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
        const variantData = {
            ...req.body,
            attributes: new Map(Object.entries(req.body.attributes)),
            product: product._id,
            images: variantImages
        };

        const variant = await ProductVariant.create(variantData);

        res.status(201).json({
            status: 'success',
            data: {
                variant
            }
        });
    } catch (error) {
        res.status(500).json({
            status: 'error',
            message: 'Failed to add variant',
            error: error.message
        });
    }
});

// Get all variants of a product
exports.getVariants = catchAsync(async (req, res, next) => {
    try {

        const variants = await ProductVariant.find({ product: req.params.productId });

        res.status(200).json({
            status: 'success',
            results: variants.length,
            data: {
                variants
            }
        });
    } catch (error) {
        res.status(500).json({
            status: 'error',
            message: 'Failed to retrieve variants',
            error: error.message
        });
    }
});

// Update variant
exports.updateVariant = catchAsync(async (req, res, next) => {
    try {

        const variant = await ProductVariant.findOne({
            _id: req.params.variantId,
            product: req.params.productId
        });

        if (!variant) {
            return next(new AppError('No variant found with that ID for this product', 404));
        }

        const updateData = { ...req.body };
        // const variantt = await ProductVariant.findOne({ sku: req.body.sku });
        // if (variantt) {
        //     return res.status(400).json({
        //         success: false,
        //         status: 'error',
        //         message: 'Variant with this SKU already exists'
        //     });
        // }
        // Handle color image update if provided

        // Handle variant images update if provided
        if (req.files?.images) {
            const newImages = [];
            for (const file of req.files.images) {
                const result = await uploadToCloudinary(file, 'variants');
                newImages.push({
                    url: result.url,
                    alt: req.body.sku || variant.sku,
                    isPrimary: newImages.length === 0
                });
            }
            // Combine existing and new images if requested
            updateData.images = [...(variant.images || []), ...newImages]
        }

        const updatedVariant = await ProductVariant.findOneAndUpdate(
            { _id: req.params.variantId, product: req.params.productId },
            updateData,
            { new: true, runValidators: true }
        );

        res.status(200).json({
            status: 'success',
            data: { variant: updatedVariant }
        });
    } catch (error) {
        res.status(500).json({
            status: 'error',
            message: 'Failed to update variant',
            error: error.message
        });
    }
});

// Delete variant
exports.deleteVariant = catchAsync(async (req, res, next) => {
    try {

        const variant = await ProductVariant.findById(req.params.variantId);
        if (!variant) {
            return next(new AppError('No variant found with that ID for this product', 404));
        }
        variant = await ProductVariant.findOneAndDelete({
            _id: req.params.variantId,
            product: req.params.productId
        });

        res.status(204).json({
            status: 'success',
            data: null
        });
    } catch (error) {
        res.status(500).json({
            status: 'error',
            message: 'Failed to delete variant',
            error: error.message
        });
    }
});

// Update variant stock
exports.updateStock = catchAsync(async (req, res, next) => {
    try {
        
        // const{quantity} = req.body;
        console.log(req.body);

        if (typeof req.body.quantity !== 'number' || req.body.quantity < 0) {
            return next(new AppError('Please provide a valid quantity', 400));
        }

        const variant = await ProductVariant.findById(req.params.variantId);
        if (!variant) {
            return next(new AppError('No variant found with that ID for this product', 404));
        }
        variant = await ProductVariant.findOneAndUpdate(
            {
                _id: req.params.variantId,
                product: req.params.productId
            },
            { quantity: req.body.quantity },
            { new: true, runValidators: true }
        );


        res.status(200).json({
            status: 'success',
            data: {
                variant: updatedVariant
            }
        });
    } catch (error) {
        res.status(500).json({
            status: 'error',
            message: 'Failed to update variant stock',
            error: error.message
        });
    }
});
