const Product = require('../models/product.model');
const asyncHandler = require('express-async-handler');

// @desc    Add color option to product
// @route   POST /api/products/:id/options/colors
// @access  Admin
exports.addColorOption = asyncHandler(async (req, res) => {
    const { name, code, image } = req.body;
    
    const product = await Product.findById(req.params.id);
    if (!product) {
        return res.status(404).json({
            status: 'error',
            message: 'Product not found'
        });
    }

    product.options.colors.push({ name, code, image });
    product.isParent = true;
    await product.save();

    res.status(201).json({
        status: 'success',
        data: product.options.colors
    });
});

// @desc    Add size option to product
// @route   POST /api/products/:id/options/sizes
// @access  Admin
exports.addSizeOption = asyncHandler(async (req, res) => {
    const { name, code, dimensions } = req.body;
    
    const product = await Product.findById(req.params.id);
    if (!product) {
        return res.status(404).json({
            status: 'error',
            message: 'Product not found'
        });
    }

    product.options.sizes.push({ name, code, dimensions });
    product.isParent = true;
    await product.save();

    res.status(201).json({
        status: 'success',
        data: product.options.sizes
    });
});

// @desc    Add product variant
// @route   POST /api/products/:id/variants
// @access  Admin
exports.addVariant = asyncHandler(async (req, res) => {
    const {
        sku,
        color,
        size,
        price,
        quantity,
        images
    } = req.body;

    const product = await Product.findById(req.params.id);
    if (!product) {
        return res.status(404).json({
            status: 'error',
            message: 'Product not found'
        });
    }

    // Validate color and size exist in options
    if (color) {
        const colorExists = product.options.colors.some(c => c.code === color.code);
        if (!colorExists) {
            return res.status(400).json({
                status: 'error',
                message: 'Color option does not exist for this product'
            });
        }
    }

    if (size) {
        const sizeExists = product.options.sizes.some(s => s.code === size.code);
        if (!sizeExists) {
            return res.status(400).json({
                status: 'error',
                message: 'Size option does not exist for this product'
            });
        }
    }

    // Check if variant with same color/size combination exists
    const variantExists = product.variants.some(v => 
        v.color.code === color.code && v.size.code === size.code
    );

    if (variantExists) {
        return res.status(400).json({
            status: 'error',
            message: 'Variant with this color and size combination already exists'
        });
    }

    // Add new variant
    product.variants.push({
        sku,
        color,
        size,
        price,
        quantity,
        images
    });

    product.isParent = true;
    await product.save();

    res.status(201).json({
        status: 'success',
        data: product.variants[product.variants.length - 1]
    });
});

// @desc    Update variant stock
// @route   PATCH /api/products/:id/variants/:variantId/stock
// @access  Admin
exports.updateVariantStock = asyncHandler(async (req, res) => {
    const { quantity } = req.body;

    const product = await Product.findById(req.params.id);
    if (!product) {
        return res.status(404).json({
            status: 'error',
            message: 'Product not found'
        });
    }

    const variant = product.variants.id(req.params.variantId);
    if (!variant) {
        return res.status(404).json({
            status: 'error',
            message: 'Variant not found'
        });
    }

    variant.quantity = quantity;
    // inStock will be updated automatically via schema middleware
    await product.save();

    res.status(200).json({
        status: 'success',
        data: variant
    });
});

// @desc    Get all variants of a product
// @route   GET /api/products/:id/variants
// @access  Admin
exports.getVariants = asyncHandler(async (req, res) => {
    const product = await Product.findById(req.params.id);
    if (!product) {
        return res.status(404).json({
            status: 'error',
            message: 'Product not found'
        });
    }

    res.status(200).json({
        status: 'success',
        data: {
            options: product.options,
            variants: product.variants
        }
    });
});

// @desc    Delete variant
// @route   DELETE /api/products/:id/variants/:variantId
// @access  Admin
exports.deleteVariant = asyncHandler(async (req, res) => {
    const product = await Product.findById(req.params.id);
    if (!product) {
        return res.status(404).json({
            status: 'error',
            message: 'Product not found'
        });
    }

    const variant = product.variants.id(req.params.variantId);
    if (!variant) {
        return res.status(404).json({
            status: 'error',
            message: 'Variant not found'
        });
    }

    variant.remove();
    
    // If this was the last variant, update isParent
    if (product.variants.length === 0) {
        product.isParent = false;
    }
    
    await product.save();

    res.status(204).send();
});
