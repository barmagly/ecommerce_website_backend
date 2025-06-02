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
            name,
            expire,
            discount
        } = req.body;

        // Check if coupon code already exists
        const existingCoupon = await Coupon.findOne({ name });
        if (existingCoupon) {
            return res.status(400).json({
                message: "Coupon code already exists"
            });
        }

        const coupon = await Coupon.create({
            name,
            expire,
            discount
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
        const { name } = req.params;
        
        const coupon = await Coupon.findOne({ name });
        
        if (!coupon) {
            return res.status(404).json({ message: "Invalid coupon code" });
        }

        // Check if coupon is active
        const now = new Date();
        if (now > coupon.expire) {
            return res.status(400).json({ message: "Coupon has expired" });
        }

        res.status(200).json({
            status: 'success',
            data: {
                valid: true,
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
