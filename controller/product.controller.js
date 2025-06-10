const { Product, ProductVariant } = require('../models/product.model');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const { uploadToCloudinary } = require('../utils/cloudinary');

// Filter products based on various criteria
exports.filterProducts = catchAsync(async (req, res, next) => {
    try {
        const filters = {};
        
        // Price range filtering
        if (req.query.minPrice || req.query.maxPrice) {
            filters.price = {};
            if (req.query.minPrice) filters.price.$gte = parseFloat(req.query.minPrice);
            if (req.query.maxPrice) filters.price.$lte = parseFloat(req.query.maxPrice);
        }

        // Category filtering
        if (req.query.category) {
            filters.category = req.query.category;
        }

        // Stock status filtering
        if (req.query.inStock) {
            const inStock = req.query.inStock.toLowerCase() === 'true';
            if (inStock) {
                filters.stock = { $gt: 0 };
            } else {
                filters.stock = { $eq: 0 };
            }
        }

        // Rating filtering
        if (req.query.minRating) {
            filters['ratings.average'] = { $gte: parseFloat(req.query.minRating) };
        }

        // Search by title or description
        if (req.query.search) {
            const searchRegex = new RegExp(req.query.search, 'i');
            filters.$or = [
                { name: searchRegex },
                { description: searchRegex }
            ];
        }

        // Sorting
        let sort = {};
        if (req.query.sort) {
            const sortField = req.query.sort.startsWith('-') ? req.query.sort.slice(1) : req.query.sort;
            const sortOrder = req.query.sort.startsWith('-') ? -1 : 1;
            sort[sortField] = sortOrder;
        } else {
            sort = { createdAt: -1 }; // Default sort by newest
        }

        // Pagination
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 12;
        const skip = (page - 1) * limit;

        // Query products
        const products = await Product.find(filters)
            .sort(sort)
            .skip(skip)
            .limit(limit)

        // Get total count for pagination
        const totalProducts = await Product.countDocuments(filters);

        res.status(200).json({
            status: 'success',
            results: products.length,
            page,
            totalPages: Math.ceil(totalProducts / limit),
            data: products
        });
    } catch (error) {
        next(new AppError(error.message, 500));
    }
});



// Create a new product with variants
exports.createProduct = catchAsync(async (req, res, next) => {
    try {
        if (!req.files || !req.files.imageCover) {
            return next(new AppError('Image cover is required', 400));
        }

        // Upload cover image first
        const coverResult = await uploadToCloudinary(req.files.imageCover[0], 'products/covers');
if(req.body.sku){
    const variant = await ProductVariant.findOne({ sku: req.body.sku });
    if (variant) {
        return res.status(400).json({
            success: false,
            status: 'error',
            message: 'Variant with this SKU already exists'
        });
    }
}
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
            hasVariants: false,
            images: productImages,
            imageCover: coverResult.url
        });

        // If variants are provided, create them
        if (req.body.variants) {
            // Update product with total variants count
            await Product.findByIdAndUpdate(product._id, {
            hasVariants: true,
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

        const products = await Product.find()
            .populate('productVariants')
            // .sort('-createdAt');

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

        res.status(200).json(product);
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
               updateData.images = [...(product.images || []), ...newImages];
           }
       
           const updatedProduct = await Product.findByIdAndUpdate(
               req.params.id,
               updateData,
               { new: true, runValidators: true }
           );
       
           res.status(200).json({
               status: 'success',
               product: updatedProduct 
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
