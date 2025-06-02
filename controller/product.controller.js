const { Product, ProductVariant } = require('../models/product.model');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const { uploadToCloudinary } = require('../utils/cloudinary');

// Create a new product with variants
exports.createProduct = catchAsync(async (req, res) => {

    try {

        // Upload images if provided
        let productImages = [];
        if (req.files && req.files.length > 0) {
            for (const file of req.files) {
                const result = await uploadToCloudinary(file, 'products');
                productImages.push({
                    url: result.url,
                    alt: req.body.title,
                    isPrimary: productImages.length === 0 // First image is primary
                });
            }
        }

        // Create the main product
        const product = await Product.create({
            ...req.body,
            isParent: true,
            totalVariants: 0,
            images: productImages
        });

        // If variants are provided, create them
        if (req.body.variants && Array.isArray(req.body.variants)) {
            const variants = req.body.variants.map(variant => ({
                ...variant,
                product: product._id
            }));
            const createdVariants = await ProductVariant.insertMany(variants);

            // Update product with total variants count
            await Product.findByIdAndUpdate(product._id, {
                totalVariants: createdVariants.length
            });
        }

        // Fetch the updated product with variants
        const updatedProduct = await Product.findById(product._id).populate('productVariants');

        res.status(201).json({
            status: 'success',
            product: updatedProduct
        });
    } catch (err) {
        res.status(500).json({
            status: 'error',
            message: 'Failed to create product',
            error: err.message
        });
    }
});

// Get all products
exports.getAllProducts = catchAsync(async (req, res, next) => {
    try {

        const products = await Product.finds()
            .populate('productVariants')
            .sort('-createdAt');

        res.status(200).json({
            status: 'success',
            results: products.length,
            products
        });
    } catch (err) {
        res.status(500).json({
            status: 'error',
            message: 'Failed to retrieve products',
            error: err.message
        });
    }
});

// Get single product
exports.getProduct = catchAsync(async (req, res, next) => {
    try {

        const product = await Product.findById(req.params.id);

        if (!product) {
            return next(new AppError('No product found with that ID', 404));
        }

        res.status(200).json({
            status: 'success',
            product
        });
    } catch (err) {
        res.status(500).json({
            status: 'error',
            message: 'Failed to get product',
            error: err.message
        });
    }
});

// Update product
exports.updateProduct = catchAsync(async (req, res, next) => {
    try {

        const product = await Product.findById(req.params.id);
        if (!product) {
            return next(new AppError('No product found with that ID', 404));
        }
        product = await Product.findByIdAndUpdate(req.params.id, req.body, {
            new: true,
            runValidators: true
        });


        res.status(200).json({
            status: 'success',
            product
        });
    } catch (error) {
        res.status(500).json({
            status: 'error',
            message: 'Failed to update product',
            error: error.message
        });
    }
});

// Delete product
exports.deleteProduct = catchAsync(async (req, res, next) => {
    try {
        
        const product = await Product.findById(req.params.id);
        if (!product) {
            return next(new AppError('No product found with that ID', 404));
        }
        product = await Product.findByIdAndDelete(req.params.id);
        
        
        res.status(204).json({
            status: 'success delete'
        });
    } catch (error) {  
        res.status(500).json({
            status: 'error',
            message: 'Failed to delete product',
            error: error.message
        });
    }
});
