const { Product, ProductVariant } = require('../models/product.model');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const { uploadToCloudinary } = require('../utils/cloudinary');

// Create a new product with variants
exports.createProduct = catchAsync(async (req, res, next) => {
    if (!req.files || !req.files.imageCover) {
        return next(new AppError('Image cover is required', 400));
    }

    // Upload cover image first
    const coverResult = await uploadToCloudinary(req.files.imageCover[0], 'products/covers');
    
    // Upload additional images if provided
    let productImages = [];
    if (req.files.images) {
        for (const file of req.files.images) {
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
        images: productImages,
        imageCover: coverResult.url
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
        data: { product: updatedProduct }
    });
});

// Get all products
exports.getAllProducts = catchAsync(async (req, res) => {
    const products = await Product.find()
        .populate('productVariants')
        .sort('-createdAt');

    res.status(200).json({
        status: 'success',
        results: products.length,
        data: { products }
    });
});

// Get single product
exports.getProduct = catchAsync(async (req, res, next) => {
    const product = await Product.findById(req.params.id);
    
    if (!product) {
        return next(new AppError('No product found with that ID', 404));
    }

    res.status(200).json({
        status: 'success',
        data: { product }
    });
});

// Update product
exports.updateProduct = catchAsync(async (req, res, next) => {
    const product = await Product.findById(req.params.id);

    if (!product) {
        return next(new AppError('No product found with that ID', 404));
    }

    const updateData = { ...req.body };

    // Handle cover image update if provided
    if (req.files?.imageCover) {
        const coverResult = await uploadToCloudinary(req.files.imageCover[0], 'products/covers');
        updateData.imageCover = coverResult.url;
    }

    // Handle additional images update if provided
    if (req.files?.images) {
        const newImages = [];
        for (const file of req.files.images) {
            const result = await uploadToCloudinary(file, 'products');
            newImages.push({
                url: result.url,
                alt: req.body.title || product.title,
                isPrimary: newImages.length === 0
            });
        }
        // Combine existing and new images if requested
        updateData.images = req.body.keepExistingImages ? 
            [...(product.images || []), ...newImages] : 
            newImages;
    }

    const updatedProduct = await Product.findByIdAndUpdate(
        req.params.id,
        updateData,
        { new: true, runValidators: true }
    );

    res.status(200).json({
        status: 'success',
        data: { product: updatedProduct }
    });
});

// Delete product
exports.deleteProduct = catchAsync(async (req, res, next) => {
    const product = await Product.findByIdAndDelete(req.params.id);

    if (!product) {
        return next(new AppError('No product found with that ID', 404));
    }

    res.status(204).json({
        status: 'success',
        data: null
    });
});
