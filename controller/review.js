const Review = require('../models/review.model.js');
const { Product, ProductVariant } = require('../models/product.model');
const getAllReviews = async (req, res, next) => {
    try {
        const reviews = await Review.find()
            .populate('userId productId')
            res.status(200).json({ status: 'success', data: reviews });
    } catch (err) {
        next({ message: "Failed to retrieve reviews", error: err.message });
    }
};

const getReviewById = async (req, res, next) => {
    try {
        const { reviewId } = req.params;
        console.log(req.params);
        
        const review = await Review.findById(reviewId)
            .populate('userId productId')
            
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
        const reviews = await Review.find({ productId })
            .populate('userId', 'name')
            .sort('-createdAt');
            
        res.status(200).json({ status: 'success', data: reviews });
    } catch (err) {
        next({ message: "Failed to retrieve product reviews", error: err.message });
    }
};

const createReview = async (req, res, next) => {
    try {
        const userId= req.user._id; // Assuming user ID is stored in req.user
        const { productId, rating, comment } = req.body;

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
        
        const product = await Product.findById(productId );
        
        if (!product) {
            return res.status(404).json({ message: "Product not found" });
        }

        const review = await Review.create({
            userId,
            productId,
            rating,
            comment
        });

        // Update product average rating
        const productReviews = await Review.find({ productId });
        const avgRating = productReviews.reduce((sum, review) => sum + review.rating, 0) / productReviews.length;

        await Product.findByIdAndUpdate(productId, {
            averageRating: avgRating,
            numberOfReviews: productReviews.length
        });

        const populatedReview = await review
            .populate('userId productId');

        res.status(201).json({ status: 'success', data: populatedReview });
    } catch (err) {
        next({ message: "Failed to create review", error: err.message });
    }
};

const updateReview = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { rating, comment } = req.body;
        const review = await Review.findOneAndUpdate(
            {_id:id,userId: req.user._id}, // Ensure the user is updating their own review
            { rating, comment },
            { new: true, runValidators: true }
        ).populate('userId')
         .populate('productId');

        if (!review) {
            return res.status(404).json({ message: "Review not found" });
        }

        // Update product average rating
        const productReviews = await Review.find({ productId: review.productId });
        const avgRating = productReviews.reduce((sum, review) => sum + review.rating, 0) / productReviews.length;

        await Product.findByIdAndUpdate(review.productId, {
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
        console.log(req.user);
        
        const review = await Review.findOne({_id:id,userId: req.user._id}); // Ensure the user is deleting their own review
        if (!review) {
            return res.status(404).json({ message: "Review not found" });
        }

        const productId = review.productId;

        await Review.findByIdAndDelete(id);

        // Update product average rating
        const productReviews = await Review.find({productId});
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
