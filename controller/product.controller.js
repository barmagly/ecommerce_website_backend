const { Product, ProductVariant } = require('../models/product.model');
const Order = require('../models/order.model');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const { uploadToCloudinary } = require('../utils/cloudinary');
const Offer = require('../models/offer.model');

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

        if (req.query.category) {
            filters.category = req.query.category;
        }
        if (req.query.inStock) {
            const inStock = req.query.inStock.toLowerCase() === 'true';
            if (inStock) {
                filters.stock = { $gt: 0 };
            } else {
                filters.stock = { $eq: 0 };
            }
        }

        if (req.query.minRating) {
            filters['ratings.average'] = { $gte: parseFloat(req.query.minRating) };
        }
        if (req.query.search) {
            const searchRegex = new RegExp(req.query.search, 'i');
            filters.$or = [
                { name: searchRegex },
                { description: searchRegex }
            ];
        }

        let sort = {};
        if (req.query.sort) {
            const sortField = req.query.sort.startsWith('-') ? req.query.sort.slice(1) : req.query.sort;
            const sortOrder = req.query.sort.startsWith('-') ? -1 : 1;
            sort[sortField] = sortOrder;
        } else {
            sort = { createdAt: -1 };
        }

        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 12;
        const skip = (page - 1) * limit;

        const products = await Product.find(filters)
            .sort(sort)
            .skip(skip)
            .limit(limit)
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

exports.createProduct = catchAsync(async (req, res, next) => {
    try {
        console.log('Create Product Request Body:', req.body);
        console.log('Create Product Files:', req.files);
        console.log('Image Cover File:', req.files?.imageCover);
        console.log('Images Files:', req.files?.images);

        if (!req.files || !req.files.imageCover) {
            console.log('Missing imageCover file');
            return next(new AppError('Image cover is required', 400));
        }

        const coverResult = await uploadToCloudinary(req.files.imageCover[0], 'products/covers');
        console.log('Cover image uploaded:', coverResult.url);
        
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

        let productImages = [];
        if (req.files.images) {
            console.log('Processing additional images:', req.files.images.length);
            for (const file of req.files.images) {
                console.log('Uploading image:', file.originalname);
                const result = await uploadToCloudinary(file, 'products');
                productImages.push({
                    url: result.url,
                    alt: req.body.name || 'Product image',
                    isPrimary: productImages.length === 0 
                });
                console.log('Image uploaded:', result.url);
            }
        } else {
            console.log('No additional images provided');
        }

        if (req.body.supplierPrice) req.body.supplierPrice = Number(req.body.supplierPrice);

        if (req.body.maxQuantityPerOrder && req.body.maxQuantityPerOrder !== '') {
            req.body.maxQuantityPerOrder = Number(req.body.maxQuantityPerOrder);
        } else {
            delete req.body.maxQuantityPerOrder;
        }

        const product = await Product.create({
            ...req.body,
            hasVariants: false,
            images: productImages,
            imageCover: coverResult.url,
            supplierName: req.body.supplierName,
            supplierPrice: req.body.supplierPrice,
            shippingAddress: {
                type: req.body.shippingAddress || 'other_governorates',
                details: ''
            },
            shippingCost: req.body.shippingCost || 0,
            deliveryDays: req.body.deliveryDays || 2
        });

        if (req.body.variants) {
            await Product.findByIdAndUpdate(product._id, {
            hasVariants: true,
            });
        }

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

exports.getAllProducts = catchAsync(async (req, res, next) => {
    try {
        const { discounted } = req.query;
        const page = parseInt(req.query.page, 10) || 1;
        const limit = parseInt(req.query.limit, 10) || 20;
        const skip = (page - 1) * limit;

        const filter = { ...req.query };
        delete filter.discounted;
        delete filter.page;
        delete filter.limit;

        let products = [];
        let totalItems = 0;

        if (discounted === 'true') {
            const [productOffers, categoryOffers] = await Promise.all([
                Offer.find({ type: 'product' }),
                Offer.find({ type: 'category' })
            ]);

            const productOfferMap = {};
            productOffers.forEach(o => { productOfferMap[o.refId.toString()] = o; });

            const categoryOfferMap = {};
            categoryOffers.forEach(o => { categoryOfferMap[o.refId.toString()] = o; });

            const allProducts = await Product.find().populate('category productVariants');
            const discountedProducts = allProducts.filter(p => productOfferMap[p._id.toString()] || categoryOfferMap[p.category.toString()]);

            totalItems = discountedProducts.length;

            products = discountedProducts
                .slice(skip, skip + limit)
                .map(p => {
                    const offer = productOfferMap[p._id.toString()] || categoryOfferMap[p.category.toString()];
                    if (offer) {
                        return {
                            ...p.toObject(),
                            originalPrice: p.price,
                            price: Math.round(p.price * (1 - offer.discount / 100)),
                            discount: offer.discount,
                            offerId: offer._id,
                            offerDescription: offer.description,
                        };
                    }
                    return p;
                });
        } else {
            totalItems = await Product.countDocuments(filter);
            products = await Product.find(filter)
                .skip(skip)
                .limit(limit)
                .populate('category productVariants');
        }

        const totalPages = Math.ceil(totalItems / limit) || 1;

        res.json({
            results: products.length,
            page,
            limit,
            totalPages,
            totalItems,
            products
        });
    } catch (err) {
        res.status(500).json({ message: 'حدث خطأ أثناء جلب المنتجات', error: err.message });
    }
});

exports.getProduct = catchAsync(async (req, res, next) => {
    try {
        const product = await Product.findById(req.params.id);
        if (!product) {
            return next(new AppError('No product found with that ID', 404));
        }
        const productOffer = await Offer.findOne({ type: 'product', refId: product._id });
        const categoryOffer = await Offer.findOne({ type: 'category', refId: product.category });
        let offer = productOffer || categoryOffer;
        let productObj = product.toObject();
        if (offer) {
            productObj.originalPrice = product.price;
            productObj.price = Math.round(product.price * (1 - offer.discount / 100));
            productObj.discount = offer.discount;
            productObj.offerId = offer._id;
            productObj.offerDescription = offer.description;
        }
        res.status(200).json(productObj);
    } catch (err) {
        res.status(500).json({
            status: 'error',
            message: 'Failed to get product',
            error: err.message
        });
    }
});

exports.updateProduct = catchAsync(async (req, res, next) => {
    try {
        const product = await Product.findById(req.params.id);
        
        if (!product) {
            return next(new AppError('No product found with that ID', 404));
        }

        const updateData = { ...req.body };
        
        if (updateData.supplierPrice) updateData.supplierPrice = Number(updateData.supplierPrice);
        if (updateData.price) updateData.price = Number(updateData.price);
        if (updateData.stock) updateData.stock = Number(updateData.stock);
        if (updateData.shippingAddress) {
            console.log(updateData.shippingAddress);
            if (typeof updateData.shippingAddress === 'string') {
                try {
                    updateData.shippingAddress = JSON.parse(updateData.shippingAddress);
                } catch (e) {
                    updateData.shippingAddress = { type: updateData.shippingAddress };
                }
            }
        }
        if (updateData.maxQuantityPerOrder && updateData.maxQuantityPerOrder !== '') {
            updateData.maxQuantityPerOrder = Number(updateData.maxQuantityPerOrder);
        } else {
            delete updateData.maxQuantityPerOrder;
        }

        if (req.files?.imageCover) {
            const coverResult = await uploadToCloudinary(req.files.imageCover[0], 'products/covers');
            updateData.imageCover = coverResult.url;
        }
        if (req.files?.images || req.body.images) {
            const newImages = [];
            
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
            
            if (req.body.deletedImages) {
                const deletedImages = JSON.parse(req.body.deletedImages);
                const existingImages = product.images || [];
                const remainingImages = existingImages.filter(img => 
                    !deletedImages.includes(img.url)
                );
                updateData.images = [...remainingImages, ...newImages];
                updateData.images = updateData.images.filter(
                  (img, idx, arr) => arr.findIndex(i => i.url === img.url) === idx
                );
            } else {
                updateData.images = newImages;
            }
        }

        if (req.body.features) {
            const features = [];
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

        const updatedProduct = await Product.findByIdAndUpdate(req.params.id, updateData, { new: true, runValidators: true });
        res.status(200).json({
            status: 'success',
            product: updatedProduct
        });
    } catch (err) {
        res.status(500).json({
            status: 'error',
            message: 'Failed to update product',
            error: err.message
        });
    }
});

exports.getCategoryProducts = catchAsync(async (req, res, next) => {
    try {
        const categoryId = req.params.id;
        const products = await Product.find({ category: categoryId });
        res.status(200).json({
            status: 'success',
            results: products.length,
            products
        });
    } catch (err) {
        res.status(500).json({
            status: 'error',
            message: 'Failed to get products by category',
            error: err.message
        });
    }
});

exports.deleteProduct = catchAsync(async (req, res, next) => {
    try {
        const product = await Product.findByIdAndDelete(req.params.id);
        if (!product) {
            return res.status(404).json({
                status: 'error',
                message: 'No product found with that ID'
            });
        }
        res.status(204).json({
            status: 'success',
            data: null
        });
    } catch (err) {
        res.status(500).json({
            status: 'error',
            message: 'Failed to delete product',
            error: err.message
        });
    }
});