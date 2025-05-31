const Coupon = require('../models/coupon.model');

const getAllCoupons = async (req, res, next) => {
    try {
        const coupons = await Coupon.find();
        res.status(200).json({ status: 'success', data: coupons });
    } catch (err) {
        next({ message: "Failed to retrieve coupons", error: err.message });
    }
};

const getCouponById = async (req, res, next) => {
    try {
        const { id } = req.params;
        const coupon = await Coupon.findById(id);
        
        if (!coupon) {
            return res.status(404).json({ message: "Coupon not found" });
        }
        
        res.status(200).json({ status: 'success', data: coupon });
    } catch (err) {
        next({ message: "Failed to retrieve coupon", error: err.message });
    }
};

const createCoupon = async (req, res, next) => {
    try {
        const {
            code,
            discountType,
            discountValue,
            minPurchase,
            maxDiscount,
            startDate,
            endDate,
            usageLimit
        } = req.body;

        // Check if coupon code already exists
        const existingCoupon = await Coupon.findOne({ code });
        if (existingCoupon) {
            return res.status(400).json({
                message: "Coupon code already exists"
            });
        }

        const coupon = await Coupon.create({
            code,
            discountType,
            discountValue,
            minPurchase,
            maxDiscount,
            startDate,
            endDate,
            usageLimit,
            usageCount: 0
        });

        res.status(201).json({ status: 'success', data: coupon });
    } catch (err) {
        next({ message: "Failed to create coupon", error: err.message });
    }
};

const updateCoupon = async (req, res, next) => {
    try {
        const { id } = req.params;
        const coupon = await Coupon.findByIdAndUpdate(
            id,
            req.body,
            { new: true, runValidators: true }
        );
        
        if (!coupon) {
            return res.status(404).json({ message: "Coupon not found" });
        }
        
        res.status(200).json({ status: 'success', data: coupon });
    } catch (err) {
        next({ message: "Failed to update coupon", error: err.message });
    }
};

const deleteCoupon = async (req, res, next) => {
    try {
        const { id } = req.params;
        const coupon = await Coupon.findByIdAndDelete(id);
        
        if (!coupon) {
            return res.status(404).json({ message: "Coupon not found" });
        }
        
        res.status(204).json({ status: 'success', data: null });
    } catch (err) {
        next({ message: "Failed to delete coupon", error: err.message });
    }
};

const validateCoupon = async (req, res, next) => {
    try {
        const { code, cartTotal } = req.body;
        
        const coupon = await Coupon.findOne({ code });
        
        if (!coupon) {
            return res.status(404).json({ message: "Invalid coupon code" });
        }

        // Check if coupon is active
        const now = new Date();
        if (now < coupon.startDate || now > coupon.endDate) {
            return res.status(400).json({ message: "Coupon has expired or not yet active" });
        }

        // Check usage limit
        if (coupon.usageLimit && coupon.usageCount >= coupon.usageLimit) {
            return res.status(400).json({ message: "Coupon usage limit reached" });
        }

        // Check minimum purchase requirement
        if (coupon.minPurchase && cartTotal < coupon.minPurchase) {
            return res.status(400).json({
                message: `Minimum purchase amount of ${coupon.minPurchase} required`
            });
        }

        // Calculate discount
        let discount = 0;
        if (coupon.discountType === 'percentage') {
            discount = (cartTotal * coupon.discountValue) / 100;
            if (coupon.maxDiscount) {
                discount = Math.min(discount, coupon.maxDiscount);
            }
        } else {
            discount = coupon.discountValue;
        }

        res.status(200).json({
            status: 'success',
            data: {
                valid: true,
                discount,
                coupon
            }
        });
    } catch (err) {
        next({ message: "Failed to validate coupon", error: err.message });
    }
};

module.exports = {
    getAllCoupons,
    getCouponById,
    createCoupon,
    updateCoupon,
    deleteCoupon,
    validateCoupon
};
