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
        const limit = Number(req.query.limit) || 20;
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
            { $limit: limit },
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
                    shippingCost: '$productDetails.shippingCost',
                    deliveryDays: '$productDetails.deliveryDays',
                    shippingAddress: '$productDetails.shippingAddress',
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
                .limit(limit)
                .populate('productVariants')
                .lean();
                
            // Ensure shipping information is included
            const productsWithShipping = defaultProducts.map(p => ({
                ...p,
                shippingCost: p.shippingCost || 0,
                deliveryDays: p.deliveryDays || 2,
                shippingAddress: p.shippingAddress || { type: 'nag_hamadi', details: '' }
            }));
                
            return res.status(200).json({
                status: 'success',
                results: productsWithShipping.length,
                data: productsWithShipping
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
        const limit = Number(req.query.limit) || 20;
        const products = await Product.aggregate([
            {
                $addFields: {
                    reviewCount: { $ifNull: ['$ratings.count', 0] }
                }
            },
            { $sort: { reviewCount: -1 } },
            { $limit: limit },
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
            supplierPrice: req.body.supplierPrice,
            shippingAddress: {
                type: req.body.shippingAddressType || 'nag_hamadi',
                details: req.body.shippingAddressDetails || ''
            },
            shippingCost: req.body.shippingCost || 0,
            deliveryDays: req.body.deliveryDays || 2
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

        let products = await Product.find()
            .populate('category')
            .populate('productVariants')
            .sort('-createdAt');

        // Ensure all required fields are present and set fallbacks
        products = products.map(p => ({
            _id: p._id,
            name: p.name || 'منتج بدون اسم',
            description: p.description || '',
            brand: p.brand || '',
            category: p.category || null,
            price: p.price || 0,
            supplierName: p.supplierName || '',
            supplierPrice: p.supplierPrice || 0,
            hasVariants: p.hasVariants || false,
            stock: p.stock || 0,
            sku: p.sku || '',
            imageCover: p.imageCover || 'https://via.placeholder.com/300x200?text=No+Image',
            images: (p.images && p.images.length > 0) ? p.images : [{ url: p.imageCover || 'https://via.placeholder.com/300x200?text=No+Image' }],
            ratings: p.ratings || { average: 0, count: 0 },
            features: p.features || [],
            specifications: p.specifications || [],
            attributes: p.attributes || [],
            productVariants: p.productVariants || [],
            shippingCost: p.shippingCost || 0,
            deliveryDays: p.deliveryDays || 2,
            shippingAddress: p.shippingAddress || { type: 'nag_hamadi', details: '' },
            createdAt: p.createdAt,
            updatedAt: p.updatedAt
        }));

        console.log('Sending products to frontend:', products.map(p => ({
            name: p.name,
            brand: p.brand,
            category: p.category,
            stock: p.stock,
            sku: p.sku,
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
        
        // Convert supplierPrice to number
        if (updateData.supplierPrice) updateData.supplierPrice = Number(updateData.supplierPrice);
        if (updateData.price) updateData.price = Number(updateData.price);
        if (updateData.stock) updateData.stock = Number(updateData.stock);
        
        // Handle cover image update if provided
        if (req.files?.imageCover) {
            const coverResult = await uploadToCloudinary(req.files.imageCover[0], 'products/covers');
            updateData.imageCover = coverResult.url;
        }

        // Handle images update
        if (req.files?.images || req.body.images) {
            const newImages = [];
            
            // Process new uploaded files
            if (req.files?.images) {
                for (const file of req.files.images) {
                    const result = await uploadToCloudinary(file, 'products');
                    newImages.push({
                        url: result.url,
                        alt: req.body.name || product.name,
                        isPrimary: newImages.length === 0
                    });
                }
            }
            
            // Process existing image URLs from form data
            if (req.body.images) {
                const existingImages = Array.isArray(req.body.images) ? req.body.images : [req.body.images];
                existingImages.forEach((imageUrl, index) => {
                    if (typeof imageUrl === 'string' && imageUrl.trim()) {
                        newImages.push({
                            url: imageUrl,
                            alt: req.body.name || product.name,
                            isPrimary: newImages.length === 0
                        });
                    }
                });
            }
            
            // Handle deleted images
            if (req.body.deletedImages) {
                const deletedImages = JSON.parse(req.body.deletedImages);
                // Filter out deleted images from existing images
                const existingImages = product.images || [];
                const remainingImages = existingImages.filter(img => 
                    !deletedImages.includes(img.url)
                );
                // Combine remaining existing images with new images
                updateData.images = [...remainingImages, ...newImages];
            } else {
                // If no deleted images specified, use only the new images
                updateData.images = newImages;
            }
        }

        // Handle features if provided
        if (req.body.features) {
            const features = [];
            // Handle FormData array format: features[0][name], features[0][value], etc.
            const featureEntries = Object.entries(req.body);
            const featureIndices = new Set();
            
            featureEntries.forEach(([key, value]) => {
                const match = key.match(/^features\[(\d+)\]\[(\w+)\]$/);
                if (match) {
                    const [, index, field] = match;
                    featureIndices.add(parseInt(index));
                }
            });
            
            featureIndices.forEach(index => {
                const name = req.body[`features[${index}][name]`];
                const value = req.body[`features[${index}][value]`];
                if (name && value) {
                    features.push({ name, value });
                }
            });
            
            updateData.features = features;
        }

        // Handle specifications if provided
        if (req.body.specifications) {
            const specifications = [];
            const specEntries = Object.entries(req.body);
            const specIndices = new Set();
            
            // Find all specification group indices
            specEntries.forEach(([key, value]) => {
                const match = key.match(/^specifications\[(\d+)\]\[(\w+)\]$/);
                if (match) {
                    const [, index] = match;
                    specIndices.add(parseInt(index));
                }
            });
            
            specIndices.forEach(specIndex => {
                const group = req.body[`specifications[${specIndex}][group]`];
                if (group) {
                    const spec = { group, items: [] };
                    
                    // Find all items for this specification group
                    const itemIndices = new Set();
                    specEntries.forEach(([key, value]) => {
                        const match = key.match(new RegExp(`^specifications\\[${specIndex}\\]\\[items\\]\\[(\\d+)\\]\\[(\\w+)\\]$`));
                        if (match) {
                            const [, itemIndex] = match;
                            itemIndices.add(parseInt(itemIndex));
                        }
                    });
                    
                    itemIndices.forEach(itemIndex => {
                        const name = req.body[`specifications[${specIndex}][items][${itemIndex}][name]`];
                        const value = req.body[`specifications[${specIndex}][items][${itemIndex}][value]`];
                        if (name && value) {
                            spec.items.push({ name, value });
                        }
                    });
                    
                    specifications.push(spec);
                }
            });
            
            updateData.specifications = specifications;
        }

        // Handle attributes if provided
        if (req.body.attributes) {
            const attributes = [];
            const attrEntries = Object.entries(req.body);
            const attrIndices = new Set();
            
            attrEntries.forEach(([key, value]) => {
                const match = key.match(/^attributes\[(\d+)\]\[(\w+)\]$/);
                if (match) {
                    const [, index] = match;
                    attrIndices.add(parseInt(index));
                }
            });
            
            attrIndices.forEach(index => {
                const name = req.body[`attributes[${index}][name]`];
                const values = req.body[`attributes[${index}][values]`];
                if (name && values) {
                    attributes.push({
                        name,
                        values: values.split(',').map(v => v.trim()).filter(Boolean)
                    });
                }
            });
            
            updateData.attributes = attributes;
        }

        // Handle product variants if provided
        if (req.body.productVariants) {
            try {
                const variantsData = JSON.parse(req.body.productVariants);
                updateData.productVariants = variantsData;
            } catch (e) {
                console.error('Error parsing product variants:', e);
            }
        }

        // Handle shipping address if provided
        if (req.body.shippingAddressType) {
            updateData.shippingAddress = {
                type: req.body.shippingAddressType,
                details: req.body.shippingAddressDetails || ''
            };
        }
        if (req.body.shippingCost !== undefined) {
            updateData.shippingCost = req.body.shippingCost;
        }
        if (req.body.deliveryDays !== undefined) {
            updateData.deliveryDays = req.body.deliveryDays;
        }

        const updatedProduct = await Product.findByIdAndUpdate(
            req.params.id,
            updateData,
            { new: true, runValidators: true }
        ).populate('category').populate('productVariants');

        res.status(200).json({
            status: 'success',
            product: updatedProduct 
        });
    } catch (error) {
        console.error('Update product error:', error);
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