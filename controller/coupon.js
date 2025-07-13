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

    const existingCoupon = await Coupon.findOne({ code });
    if (existingCoupon) {
        return next(new ApiError("هذا الكوبون موجود بالفعل", 400));
    }
    if (applyTo === 'categories' && (!categories || categories.length === 0)) {
        return next(new ApiError("يجب اختيار الفئات عند تطبيق الكوبون على فئات محددة", 400));
    }

    if (applyTo === 'products' && (!products || products.length === 0)) {
        return next(new ApiError("يجب اختيار المنتجات عند تطبيق الكوبون على منتجات محددة", 400));
    }

    const coupon = await Coupon.create({
        code,
        name,
        expire: expire === '' ? null : expire, 
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

    if (req.body.applyTo === 'categories' && (!req.body.categories || req.body.categories.length === 0)) {
        return next(new ApiError("يجب اختيار الفئات عند تطبيق الكوبون على فئات محددة", 400));
    }

    if (req.body.applyTo === 'products' && (!req.body.products || req.body.products.length === 0)) {
        return next(new ApiError("يجب اختيار المنتجات عند تطبيق الكوبون على منتجات محددة", 400));
    }

    let updateBody = { ...req.body };
    if (updateBody.expire === '') {
        updateBody.expire = null;
    }

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
    const { name: rawCode } = req.params; 
    if(!rawCode || typeof rawCode !== 'string') {
        return next(new ApiError('الكوبون غير صحيح', 400));
    }
    const code = req.params.name.toUpperCase(); 
    const { productId } = req.query; 
    const userId = req.user ? req.user._id : null;

    const coupon = await Coupon.findOne({ code });

    if (!coupon) {
        return next(new ApiError('الكوبون غير موجود', 404));
    }

    if (!coupon.isActive) {
        return next(new ApiError('الكوبون غير نشط', 400));
    }
    if (new Date() > coupon.expire) {
        return next(new ApiError('الكوبون منتهي الصلاحية', 400));
    }
    if (new Date() < coupon.startDate) {
        return next(new ApiError('الكوبون لم يبدأ بعد', 400));
    }
    if (coupon.usageLimit && coupon.usedCount >= coupon.usageLimit) {
        return next(new ApiError('لقد تم استخدام هذا الكوبون بالكامل', 400));
    }

    if (userId && coupon.usedBy.includes(userId)) {
        return next(new ApiError('لقد قمت باستخدام هذا الكوبون من قبل', 400));
    }
    coupon.usedCount += 1;
    coupon.usedBy.push(userId);
    await coupon.save();

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
