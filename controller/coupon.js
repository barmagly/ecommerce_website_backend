const Coupon = require('../models/coupon.model');
const Product = require('../models/product.model');
const ApiError = require('../utils/appError');
const catchAsyncError = require('../utils/catchAsync');

const getAllCoupons = catchAsyncError(async (req, res, next) => {
    const coupons = await Coupon.find()
        .populate('categories', 'name')
        .populate('products', 'name price');
    res.status(200).json({ success: true, coupons });
});

const getCouponById = catchAsyncError(async (req, res, next) => {
    const { id } = req.params;
    const coupon = await Coupon.findById(id)
        .populate('categories', 'name')
        .populate('products', 'name price');

    if (!coupon) {
        return next(new ApiError("الكوبون غير موجود", 404));
    }

    res.status(200).json({ success: true, coupon });
});

const createCoupon = catchAsyncError(async (req, res, next) => {
    const {
        code,
        name,
        expire,
        discount,
        type,
        minAmount,
        maxDiscount,
        usageLimit,
        isActive,
        startDate,
        categories,
        products,
        applyTo
    } = req.body;

    // Check if coupon code already exists
    const existingCoupon = await Coupon.findOne({ code });
    if (existingCoupon) {
        return next(new ApiError("هذا الكوبون موجود بالفعل", 400));
    }

    // Validate applyTo and related fields
    if (applyTo === 'categories' && (!categories || categories.length === 0)) {
        return next(new ApiError("يجب اختيار الفئات عند تطبيق الكوبون على فئات محددة", 400));
    }

    if (applyTo === 'products' && (!products || products.length === 0)) {
        return next(new ApiError("يجب اختيار المنتجات عند تطبيق الكوبون على منتجات محددة", 400));
    }

    const coupon = await Coupon.create({
        code,
        name,
        expire: expire === '' ? null : expire, // Set to null if empty string
        discount,
        type,
        minAmount,
        maxDiscount, // No longer needs conditional handling, it's optional in model
        usageLimit,
        isActive,
        startDate,
        categories,
        products,
        applyTo
    });

    const populatedCoupon = await Coupon.findById(coupon._id)
        .populate('categories', 'name')
        .populate('products', 'name price');

    res.status(201).json({ success: true, coupon: populatedCoupon });
});

const updateCoupon = catchAsyncError(async (req, res, next) => {
    const { id } = req.params;
    const coupon = await Coupon.findById(id);
    if (!coupon) {
        return next(new ApiError("الكوبون غير موجود", 404));
    }

    // Validate applyTo and related fields
    if (req.body.applyTo === 'categories' && (!req.body.categories || req.body.categories.length === 0)) {
        return next(new ApiError("يجب اختيار الفئات عند تطبيق الكوبون على فئات محددة", 400));
    }

    if (req.body.applyTo === 'products' && (!req.body.products || req.body.products.length === 0)) {
        return next(new ApiError("يجب اختيار المنتجات عند تطبيق الكوبون على منتجات محددة", 400));
    }

    let updateBody = { ...req.body };
    // Handle expire: set to null if it's an empty string
    if (updateBody.expire === '') {
        updateBody.expire = null;
    }
    // maxDiscount no longer needs conditional handling, it's optional in model
    // Remove: if (updateBody.type === 'percentage' && updateBody.maxDiscount === '') { updateBody.maxDiscount = undefined; }

    const updatedCoupon = await Coupon.findByIdAndUpdate(
        id,
        updateBody,
        { new: true, runValidators: true }
    ).populate('categories', 'name')
     .populate('products', 'name price');

    res.status(200).json({ success: true, coupon: updatedCoupon });
});

const deleteCoupon = catchAsyncError(async (req, res, next) => {
    const { id } = req.params;
    const coupon = await Coupon.findByIdAndDelete(id);

    if (!coupon) {
        return next(new ApiError("الكوبون غير موجود", 404));
    }

    res.status(204).json({ success: true, data: null });
});

const validateCoupon = catchAsyncError(async (req, res, next) => {
    const { code: rawCode } = req.params; // Get raw code from params
    if(!rawCode || typeof rawCode !== 'string') {
        return next(new ApiError('الكوبون غير صحيح', 400));
    }
    const code = req.params.name.toUpperCase(); // Trim and convert to uppercase
    const { productId } = req.query; // Optional: for product-specific validation
    const userId = req.user ? req.user._id : null; // Safely get userId

    const coupon = await Coupon.findOne({ code });

    if (!coupon) {
        return next(new ApiError('الكوبون غير موجود', 404));
    }

    // Check if coupon is active
    if (!coupon.isActive) {
        return next(new ApiError('الكوبون غير نشط', 400));
    }

    // Check if coupon has expired
    if (new Date() > coupon.expire) {
        return next(new ApiError('الكوبون منتهي الصلاحية', 400));
    }

    // Check if coupon has started
    if (new Date() < coupon.startDate) {
        return next(new ApiError('الكوبون لم يبدأ بعد', 400));
    }

    // Check usage limit
    if (coupon.usageLimit && coupon.usedCount >= coupon.usageLimit) {
        return next(new ApiError('لقد تم استخدام هذا الكوبون بالكامل', 400));
    }

    // Check if user has already used this coupon (only if userId is available)
    if (userId && coupon.usedBy.includes(userId)) {
        return next(new ApiError('لقد قمت باستخدام هذا الكوبون من قبل', 400));
    }

    // Placeholder for when the coupon is successfully applied in an order
    // In a real scenario, after a successful order, you would update:
    // coupon.usedCount += 1;
    // coupon.usedBy.push(userId);
    // await coupon.save();

    // Product-specific validation (if productId is provided)
    if (productId) {
        const product = await Product.findById(productId);
        if (!product) {
            return next(new ApiError('المنتج غير موجود', 404));
        }

        if (coupon.applyTo === 'products') {
            if (!coupon.products.includes(productId)) {
                return next(new ApiError('هذا الكوبون لا ينطبق على هذا المنتج', 400));
            }
        } else if (coupon.applyTo === 'categories') {
            if (!coupon.categories.includes(product.category.toString())) {
                return next(new ApiError('هذا الكوبون لا ينطبق على فئة هذا المنتج', 400));
            }
        }
    }

    res.status(200).json({
        success: true,
        data: { valid: true, coupon },
    });
});

module.exports = {
    getAllCoupons,
    getCouponById,
    createCoupon,
    updateCoupon,
    deleteCoupon,
    validateCoupon
};
