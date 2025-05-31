const Review = require('../models/review.model.js');
const Product = require('../models/product.model');

const getAllReviews = async (req, res, next) => {
    try {
        const reviews = await Review.find()
            .populate('user', 'name')
            .populate('product', 'name');
        res.status(200).json({ status: 'success', data: reviews });
    } catch (err) {
        next({ message: "Failed to retrieve reviews", error: err.message });
    }
};

const getReviewById = async (req, res, next) => {
    try {
        const { id } = req.params;
        const review = await Review.findById(id)
            .populate('user', 'name')
            .populate('product', 'name');
            
        if (!review) {
            return res.status(404).json({ message: "Review not found" });
        }
        
        res.status(200).json({ status: 'success', data: review });
    } catch (err) {
        next({ message: "Failed to retrieve review", error: err.message });
    }
};

const getProductReviews = async (req, res, next) => {
    try {
        const { productId } = req.params;
        const reviews = await Review.find({ product: productId })
            .populate('user', 'name')
            .sort('-createdAt');
            
        res.status(200).json({ status: 'success', data: reviews });
    } catch (err) {
        next({ message: "Failed to retrieve product reviews", error: err.message });
    }
};

const createReview = async (req, res, next) => {
    try {
        const { userId, productId, rating, comment } = req.body;

        // Check if user has already reviewed this product
        const existingReview = await Review.findOne({
            user: userId,
            product: productId
        });

        if (existingReview) {
            return res.status(400).json({
                message: "You have already reviewed this product"
            });
        }

        const review = await Review.create({
            user: userId,
            product: productId,
            rating,
            comment
        });

        // Update product average rating
        const productReviews = await Review.find({ product: productId });
        const avgRating = productReviews.reduce((sum, review) => sum + review.rating, 0) / productReviews.length;

        await Product.findByIdAndUpdate(productId, {
            averageRating: avgRating,
            numberOfReviews: productReviews.length
        });

        const populatedReview = await review
            .populate('user', 'name')
            .populate('product', 'name');

        res.status(201).json({ status: 'success', data: populatedReview });
    } catch (err) {
        next({ message: "Failed to create review", error: err.message });
    }
};

const updateReview = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { rating, comment } = req.body;

        const review = await Review.findByIdAndUpdate(
            id,
            { rating, comment },
            { new: true, runValidators: true }
        ).populate('user', 'name')
         .populate('product', 'name');

        if (!review) {
            return res.status(404).json({ message: "Review not found" });
        }

        // Update product average rating
        const productReviews = await Review.find({ product: review.product });
        const avgRating = productReviews.reduce((sum, review) => sum + review.rating, 0) / productReviews.length;

        await Product.findByIdAndUpdate(review.product, {
            averageRating: avgRating
        });

        res.status(200).json({ status: 'success', data: review });
    } catch (err) {
        next({ message: "Failed to update review", error: err.message });
    }
};

const deleteReview = async (req, res, next) => {
    try {
        const { id } = req.params;

        const review = await Review.findById(id);
        if (!review) {
            return res.status(404).json({ message: "Review not found" });
        }

        const productId = review.product;

        await Review.findByIdAndDelete(id);

        // Update product average rating
        const productReviews = await Review.find({ product: productId });
        const avgRating = productReviews.length 
            ? productReviews.reduce((sum, review) => sum + review.rating, 0) / productReviews.length
            : 0;

        await Product.findByIdAndUpdate(productId, {
            averageRating: avgRating,
            numberOfReviews: productReviews.length
        });
        
        res.status(204).json({ status: 'success', data: null });
    } catch (err) {
        next({ message: "Failed to delete review", error: err.message });
    }
};

module.exports = {
    getAllReviews,
    getReviewById,
    getProductReviews,
    createReview,
    updateReview,
    deleteReview
};
