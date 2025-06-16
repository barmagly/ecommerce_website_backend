const Review = require('../models/review.model.js');
const { Product, ProductVariant } = require('../models/product.model');
const Order = require('../models/order.model');
const mongoose = require('mongoose');

const getAllReviews = async (req, res, next) => {
    try {
        const reviews = await Review.find()
            .populate('user product')
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
            .populate('user product')
            
        
        res.status(200).json({ status: 'success', review });
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
            
        res.status(200).json({ status: 'success', reviews });
    } catch (err) {
        next({ message: "Failed to retrieve product reviews", error: err.message });
    }
};

const createReview = async (req, res, next) => {
    try {
        console.log('Creating review with data:', {
            user: req.user._id,
            body: req.body
        });

        const user = req.user._id;
        const { productId, rating, comment } = req.body;

        if (!productId || !rating || !comment) {
            return res.status(400).json({
                status: 'error',
                message: "Missing required fields: productId, rating, and comment are required"
            });
        }

        // Validate rating
        if (rating < 0 || rating > 5) {
            console.log('Invalid rating:', rating);
            return res.status(400).json({
                status: 'error',
                message: "Rating must be between 0 and 5"
            });
        }
        
        // Check if user has already reviewed this product
        const existingReview = await Review.findOne({
            user,
            product: productId
        });

        if (existingReview) {
            console.log('User already reviewed this product:', existingReview);
            return res.status(400).json({
                status: 'error',
                message: "You have already reviewed this product"
            });
        }
        
        const product = await Product.findById(productId);
        
        if (!product) {
            console.log('Product not found:', productId);
            return res.status(404).json({ 
                status: 'error',
                message: "Product not found" 
            });
        }

        console.log('Creating new review...');
        const review = await Review.create({
            user,
            product: productId,
            rating,
            comment
        });

        console.log('Review created:', review);

        // Update product ratings
        const productReviews = await Review.find({ product: productId });
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

        console.log('Updating product ratings:', {
            productId,
            averageRating,
            ratingsCount,
            distribution
        });

        await Product.findByIdAndUpdate(productId, {
            $set: {
                'ratings.average': averageRating,
                'ratings.count': ratingsCount,
                'ratings.distribution': distribution
            }
        });

        const populatedReview = await review
            .populate('user product');

        console.log('Sending response with populated review:', populatedReview);

        res.status(201).json({ 
            status: 'success', 
            message: 'Review created successfully',
            review: populatedReview 
        });
    } catch (err) {
        console.error('Error in createReview:', err);
        next({ 
            status: 500,
            message: "Failed to create review", 
            error: err.message,
            details: err
        });
    }
};

const updateReview = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { rating, comment } = req.body;
        const review = await Review.findOne({_id:id,user: req.user._id});
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
            {_id:id,user: req.user._id},
            { rating, comment },
            { new: true, runValidators: true }
        ).populate('user')
         .populate('product');

        // Update product ratings
        const productReviews = await Review.find({ product: updatedReview.product });
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

        await Product.findByIdAndUpdate(updatedReview.product, {
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
        console.log('Attempting to delete review with ID:', id);
        
        if (!id) {
            console.log('No review ID provided');
            return res.status(400).json({
                status: 'error',
                message: "Review ID is required"
            });
        }

        if (!mongoose.Types.ObjectId.isValid(id)) {
            console.log('Invalid review ID format');
            return res.status(400).json({
                status: 'error',
                message: "Invalid review ID format"
            });
        }

        // First check if review exists
        console.log('Finding review...');
        let review;
        try {
            review = await Review.findById(id).populate('user product');
            console.log('Found review:', review ? 'yes' : 'no');
            if (review) {
                console.log('Review details:', {
                    id: review._id,
                    userId: review.user?._id,
                    productId: review.product?._id,
                    rating: review.rating
                });
            }
        } catch (findError) {
            console.error('Error finding review:', findError);
            return res.status(500).json({
                status: 'error',
                message: "Error finding review",
                error: process.env.NODE_ENV === 'development' ? findError.message : undefined
            });
        }
        
        if (!review) {
            console.log('Review not found');
            return res.status(404).json({ 
                status: 'error',
                message: "Review not found" 
            });
        }

        // Then check if user owns the review or is an admin
        if (!req.user) {
            console.log('No authenticated user found');
            return res.status(401).json({
                status: 'error',
                message: "Authentication required"
            });
        }

        console.log('Checking user authorization...');
        console.log('Review userId:', review.user?._id);
        console.log('Current user ID:', req.user._id);
        console.log('User role:', req.user.role);

        // Check if the review belongs to the user or if user is admin
        const isOwner = review.user?._id.toString() === req.user._id.toString();
        const isAdmin = req.user.role === 'admin';

        if (!isOwner && !isAdmin) {
            console.log('User not authorized to delete review');
            return res.status(403).json({ 
                status: 'error',
                message: "You are not authorized to delete this review" 
            });
        }

        // Store productId before deletion
        const productId = review.product?._id;
        console.log('Product ID for rating update:', productId);

        // Delete the review first
        console.log('Deleting review...');
        let deletedReview;
        try {
            deletedReview = await Review.findOneAndDelete({ _id: id });
            console.log('Delete operation result:', deletedReview ? 'success' : 'failed');
        } catch (deleteError) {
            console.error('Error deleting review:', deleteError);
            return res.status(500).json({
                status: 'error',
                message: "Error deleting review",
                error: process.env.NODE_ENV === 'development' ? deleteError.message : undefined
            });
        }

        if (!deletedReview) {
            console.log('Failed to delete review');
            return res.status(404).json({
                status: 'error',
                message: "Failed to delete review"
            });
        }

        // Only update product ratings if we have a valid product ID
        if (productId) {
            console.log('Updating product ratings...');
            let productReviews;
            try {
                productReviews = await Review.find({ product: productId });
                console.log('Found product reviews:', productReviews.length);
            } catch (findReviewsError) {
                console.error('Error finding product reviews:', findReviewsError);
                // Continue with empty reviews array
                productReviews = [];
            }

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

            console.log('Updating product with new ratings...');
            try {
                const updatedProduct = await Product.findByIdAndUpdate(
                    productId,
                    {
                        $set: {
                            'ratings.average': averageRating,
                            'ratings.count': ratingsCount,
                            'ratings.distribution': distribution
                        }
                    },
                    { new: true }
                );
                console.log('Product update result:', updatedProduct ? 'success' : 'failed');
            } catch (productError) {
                console.error('Error updating product ratings:', productError);
                // Don't fail the whole operation if product update fails
            }
        } else {
            console.log('Skipping product rating update - no valid product ID');
        }
        
        console.log('Review deleted successfully');
        res.status(200).json({ 
            status: 'success',
            message: "Review deleted successfully" 
        });
    } catch (err) {
        console.error('Error in deleteReview:', err);
        console.error('Error stack:', err.stack);
        res.status(500).json({ 
            status: 'error',
            message: "Internal server error while deleting review",
            error: process.env.NODE_ENV === 'development' ? err.message : undefined
        });
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
            user: userId,
            'cartItems.product': productId,
            status: { $in: ['delivered', 'shipped'] }
        });
        
        res.status(200).json({
            status: 'success',
            hasPurchased: !!order
        });
    } catch (err) {
        next({ message: "Failed to check purchase status", error: err.message });
    }
};

const updateReviewStatus = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        if (!status) {
            return res.status(400).json({
                status: 'error',
                message: "Status is required"
            });
        }

        const validStatuses = ['pending', 'approved', 'rejected'];
        if (!validStatuses.includes(status)) {
            return res.status(400).json({
                status: 'error',
                message: "Invalid status. Must be one of: pending, approved, rejected"
            });
        }

        const review = await Review.findById(id);
        if (!review) {
            return res.status(404).json({
                status: 'error',
                message: "Review not found"
            });
        }

        review.status = status;
        await review.save();

        res.status(200).json({
            status: 'success',
            message: "Review status updated successfully",
            review
        });
    } catch (err) {
        next({ message: "Failed to update review status", error: err.message });
    }
};

module.exports = {
    getAllReviews,
    getReviewById,
    getProductReviews,
    createReview,
    updateReview,
    deleteReview,
    checkPurchase,
    updateReviewStatus
};
