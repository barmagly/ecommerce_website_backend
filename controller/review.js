const Review = require('../models/review.model.js');
const { Product, ProductVariant } = require('../models/product.model');
const Order = require('../models/order.model');
const getAllReviews = async (req, res, next) => {
    try {
        const reviews = await Review.find()
            .populate('userId productId')
            res.status(200).json({ status: 'success', reviews });
    } catch (err) {
        next({ message: "Failed to retrieve reviews", error: err.message });
    }
};

const getReviewById = async (req, res, next) => {
    try {
        const { reviewId } = req.params;
        
        if (!review) {
            return res.status(404).json({ message: "Review not found" });
        }
        const review = await Review.findById(reviewId)
            .populate('userId productId')
            
        
        res.status(200).json({ status: 'success', review });
    } catch (err) {
        next({ message: "Failed to retrieve review", error: err.message });
    }
};

const getProductReviews = async (req, res, next) => {
    try {
        const { productId } = req.params;
        const reviews = await Review.find({ productId })
            .populate('userId', 'name')
            .sort('-createdAt');
            
        res.status(200).json({ status: 'success', reviews });
    } catch (err) {
        next({ message: "Failed to retrieve product reviews", error: err.message });
    }
};

const createReview = async (req, res, next) => {
    try {
        const userId = req.user._id;
        const { productId, rating, comment } = req.body;

        // Validate rating
        if (rating < 0 || rating > 5) {
            return res.status(400).json({
                message: "Rating must be between 0 and 5"
            });
        }

        // Check if user has already reviewed this product
        const existingReview = await Review.findOne({
            userId,
            productId
        });

        if (existingReview) {
            return res.status(400).json({
                message: "You have already reviewed this product"
            });
        }
        
        const product = await Product.findById(productId);
        
        if (!product) {
            return res.status(404).json({ message: "Product not found" });
        }

        const review = await Review.create({
            userId,
            productId,
            rating,
            comment
        });

        // Update product ratings
        const productReviews = await Review.find({ productId });
        const ratingsCount = productReviews.length;
        
        // Calculate distribution
        const distribution = {
            1: 0,
            2: 0,
            3: 0,
            4: 0,
            5: 0
        };
        
        let totalRating = 0;
        productReviews.forEach(r => {
            distribution[r.rating]++;
            totalRating += r.rating;
        });

        const averageRating = Math.round((totalRating / ratingsCount) * 10) / 10;

        await Product.findByIdAndUpdate(productId, {
            $set: {
                'ratings.average': averageRating,
                'ratings.count': ratingsCount,
                'ratings.distribution': distribution
            }
        });

        const populatedReview = await review
            .populate('userId productId');

        res.status(201).json({ status: 'success', populatedReview });
    } catch (err) {
        next({ message: "Failed to create review", error: err.message });
    }
};

const updateReview = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { rating, comment } = req.body;
        const review = await Review.findOne({_id:id,userId: req.user._id});
        if (!review) {
            return res.status(404).json({ message: "Review not found" });
        }

        // Validate rating
        if (rating < 0 || rating > 5) {
            return res.status(400).json({
                message: "Rating must be between 0 and 5"
            });
        }

        const updatedReview = await Review.findOneAndUpdate(
            {_id:id,userId: req.user._id},
            { rating, comment },
            { new: true, runValidators: true }
        ).populate('userId')
         .populate('productId');

        // Update product ratings
        const productReviews = await Review.find({ productId: updatedReview.productId });
        const ratingsCount = productReviews.length;
        
        // Calculate distribution
        const distribution = {
            1: 0,
            2: 0,
            3: 0,
            4: 0,
            5: 0
        };
        
        let totalRating = 0;
        productReviews.forEach(r => {
            distribution[r.rating]++;
            totalRating += r.rating;
        });

        const averageRating = Math.round((totalRating / ratingsCount) * 10) / 10;

        await Product.findByIdAndUpdate(updatedReview.productId, {
            $set: {
                'ratings.average': averageRating,
                'ratings.count': ratingsCount,
                'ratings.distribution': distribution
            }
        });

        res.status(200).json({ status: 'success', review: updatedReview });
    } catch (err) {
        next({ message: "Failed to update review", error: err.message });
    }
};

const deleteReview = async (req, res, next) => {
    try {
        const { id } = req.params;
        const review = await Review.findOne({_id:id,userId: req.user._id});
        if (!review) {
            return res.status(404).json({ message: "Review not found" });
        }

        const productId = review.productId;

        await Review.findByIdAndDelete(id);

        // Update product ratings
        const productReviews = await Review.find({productId});
        const ratingsCount = productReviews.length;
        
        // Calculate distribution
        const distribution = {
            1: 0,
            2: 0,
            3: 0,
            4: 0,
            5: 0
        };
        
        let totalRating = 0;
        productReviews.forEach(r => {
            distribution[r.rating]++;
            totalRating += r.rating;
        });

        const averageRating = ratingsCount 
            ? Math.round((totalRating / ratingsCount) * 10) / 10
            : 0;

        await Product.findByIdAndUpdate(productId, {
            $set: {
                'ratings.average': averageRating,
                'ratings.count': ratingsCount,
                'ratings.distribution': distribution
            }
        });
        
        res.status(204).json({ status: 'success' });
    } catch (err) {
        next({ message: "Failed to delete review", error: err.message });
    }
};



const checkPurchase = async (req, res, next) => {
    try {
        const userId = req.user._id;
        const { productId } = req.params;

        // Verify product exists
        const product = await Product.findById(productId);
        if (!product) {
            return res.status(404).json({ message: "Product not found" });
        }

        // Check if user has purchased this product
        const order = await Order.findOne({
            userId,
            'items.productId': productId,
            status: { $in: ['delivered', 'completed'] }
        });

        res.status(200).json({
            status: 'success',
            hasPurchased: !!order
        });
    } catch (err) {
        next({ message: "Failed to check purchase status", error: err.message });
    }
};

module.exports = {
    getAllReviews,
    getReviewById,
    getProductReviews,
    createReview,
    updateReview,
    deleteReview,
    checkPurchase
};
