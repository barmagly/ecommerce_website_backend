const { Product, ProductVariant } = require('../models/product.model');
const Order = require('../models/order.model');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const { uploadToCloudinary } = require('../utils/cloudinary');

exports.getNewArrivals = catchAsync(async (req, res, next) => {
    try {
        const products = await Product.find()
            .sort({ createdAt: -1 })
            .limit(4)
            .populate('productVariants');

        res.status(200).json({
            status: 'success',
            results: products.length,
            data: products
        });
    } catch (error) {
        next(new AppError('Failed to fetch new arrivals', 500));
    }
});

exports.getBestSellers = catchAsync(async (req, res, next) => {
    try {
        const bestSellingItems = await Order.aggregate([
            { $match: { status: { $in: ['delivered', 'shipped','processing'] } } },
            { $unwind: '$cartItems' },
            {
                $group: {
                    _id: {
                        product: '$cartItems.product',
                        variant: '$cartItems.variantId'
                    },
                    totalSold: { $sum: '$cartItems.quantity' },
                    productName: { $first: '$cartItems.product.name' },
                    productPrice: { $first: '$cartItems.product.price' },
                    productImage: { $first: '$cartItems.product.imageCover' }
                }
            },
            { $sort: { totalSold: -1 } },
            { $limit: 4 },
            {
                $lookup: {
                    from: 'products',
                    localField: '_id.product',
                    foreignField: '_id',
                    as: 'productDetails'
                }
            },
            { $unwind: '$productDetails' },
            {
                $lookup: {
                    from: 'productvariants',
                    localField: '_id.variant',
                    foreignField: '_id',
                    as: 'variantDetails'
                }
            },
            {
                $project: {
                    _id: '$productDetails._id',
                    name:'$productDetails.name',
                    price: {
                        $cond: {
                            if: { $gt: [{ $size: '$variantDetails' }, 0] },
                            then: { $arrayElemAt: ['$variantDetails.price', 0] },
                            else: '$productDetails.price'
                        }
                    },
                    image: {
                        $cond: {
                            if: {
                                $and: [
                                    { $gt: [{ $size: '$variantDetails' }, 0] },
                                    { $gt: [{ $size: { $ifNull: [{ $arrayElemAt: ['$variantDetails.images', 0] }, []] } }, 0] }
                                ]
                            },
                            then: { $arrayElemAt: ['$variantDetails.images.url', 0] },
                            else: '$productDetails.imageCover'
                        }
                    },
                    totalSold: 1,
                    hasVariants: { $gt: [{ $size: { $ifNull: ['$productDetails.productVariants', []] } }, 0] },
                    variant: {
                        $cond: {
                            if: { $gt: [{ $size: '$variantDetails' }, 0] },
                            then: { $arrayElemAt: ['$variantDetails', 0] },
                            else: null
                        }
                    }
                }
            }
        ]);

        if (bestSellingItems.length === 0) {
            const defaultProducts = await Product.find()
                .sort({ createdAt: -1 })
                .limit(4)
                .populate('productVariants');
                
            return res.status(200).json({
                status: 'success',
                results: defaultProducts.length,
                data: defaultProducts
            });
        }

        res.status(200).json({
            status: 'success',
            results: bestSellingItems.length,
            data: bestSellingItems
        });
    } catch (error) {
        console.error('Error fetching best sellers:', error);
        next(new AppError('Failed to fetch best sellers: ' + error.message, 500));
    }
});

exports.getMostReviewed = catchAsync(async (req, res, next) => {
    try {
        const products = await Product.aggregate([
            {
                $addFields: {
                    reviewCount: { $ifNull: ['$ratings.count', 0] }
                }
            },
            { $sort: { reviewCount: -1 } },
            { $limit: 4 },
            {
                $lookup: {
                    from: 'productvariants',
                    localField: '_id',
                    foreignField: 'product',
                    as: 'productVariants'
                }
            }
        ]);

        res.status(200).json({
            status: 'success',
            results: products.length,
            data: products
        });
    } catch (error) {
        next(new AppError('Failed to fetch most reviewed products', 500));
    }
});

exports.filterProducts = catchAsync(async (req, res, next) => {
    try {
        const filters = {};
        
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
        // Debug logging
        console.log('Create Product Request Body:', req.body);
        console.log('Create Product Files:', req.files);
        console.log('Image Cover File:', req.files?.imageCover);
        console.log('Images Files:', req.files?.images);

        if (!req.files || !req.files.imageCover) {
            console.log('Missing imageCover file');
            return next(new AppError('Image cover is required', 400));
        }

        // Upload cover image first
        const coverResult = await uploadToCloudinary(req.files.imageCover[0], 'products/covers');
        console.log('Cover image uploaded:', coverResult.url);
        
        // Check if SKU already exists
        if (req.body.sku) {
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
            console.log('Processing additional images:', req.files.images.length);
            for (const file of req.files.images) {
                console.log('Uploading image:', file.originalname);
                const result = await uploadToCloudinary(file, 'products');
                productImages.push({
                    url: result.url,
                    alt: req.body.name || 'Product image',
                    isPrimary: productImages.length === 0 // First image is primary
                });
                console.log('Image uploaded:', result.url);
            }
        } else {
            console.log('No additional images provided');
        }

        // تحويل supplierPrice إلى رقم
        if (req.body.supplierPrice) req.body.supplierPrice = Number(req.body.supplierPrice);

        // Create the main product
        const product = await Product.create({
            ...req.body,
            hasVariants: false,
            images: productImages,
            imageCover: coverResult.url,
            supplierName: req.body.supplierName,
            supplierPrice: req.body.supplierPrice
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

        console.log('Sending products to frontend:', products.map(p => ({
            name: p.name,
            supplierName: p.supplierName,
            supplierPrice: p.supplierPrice
        })));

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
           // تحويل supplierPrice إلى رقم
           if (updateData.supplierPrice) updateData.supplierPrice = Number(updateData.supplierPrice);
           if (updateData.supplierName) updateData.supplierName = updateData.supplierName;
       
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
                       alt: req.body.name || product.name,
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

        // Delete all related variants first
        await ProductVariant.deleteMany({ product: req.params.id });

        // Delete the product itself
        await Product.findByIdAndDelete(req.params.id);

        // Return 204 No Content for successful deletion
        res.status(204).send();
    } catch (error) {
        console.error('Delete product error:', error);
        res.status(500).json({
            status: 'error',
            message: 'Failed to delete product',
            error: error.message
        });
    }
});

exports.getCategoryProducts = catchAsync(async(req,res,next)=>{
    try {
        
        const products = await Product.find({category:req.params.id})
        // console.log(products);
        if(!products)
        {
            return next(new AppError('no products for this category'))
        }

        res.status(200).json(
            products
        )
    } catch (error) {
         res.status(500).json({
            status: 'error',
            message: 'Failed to get the products of the category',
            error: error.message
        });
    }
})