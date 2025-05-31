const Product = require('../models/product.model');

const getAllProducts = async (req, res, next) => {
    try {
        const products = await Product.find().populate('category');
        res.status(200).json({ status: 'success', data: products });
    } catch (err) {
        next({ message: "Failed to retrieve products", error: err.message });
    }
};

const getProductById = async (req, res, next) => {
    try {
        const { id } = req.params;
        if (!id.match(/^[0-9a-fA-F]{24}$/)) {
            return res.status(400).json({ message: "Invalid product ID format" });
        }

        const product = await Product.findById(id).populate('category');
        if (!product) {
            return res.status(404).json({ message: "Product not found" });
        }
        res.status(200).json({ status: 'success', data: product });
    } catch (err) {
        next({ message: "Failed to retrieve product", error: err.message });
    }
};

const createProduct = async (req, res, next) => {
    try {
        const product = await Product.create(req.body);
        res.status(201).json({ status: 'success', data: product });
    } catch (err) {
        next({ message: "Failed to create product", error: err.message });
    }
};

const updateProduct = async (req, res, next) => {
    try {
        const { id } = req.params;
        const product = await Product.findByIdAndUpdate(id, req.body, {
            new: true,
            runValidators: true
        });
        
        if (!product) {
            return res.status(404).json({ message: "Product not found" });
        }
        
        res.status(200).json({ status: 'success', data: product });
    } catch (err) {
        next({ message: "Failed to update product", error: err.message });
    }
};

const deleteProduct = async (req, res, next) => {
    try {
        const { id } = req.params;
        const product = await Product.findByIdAndDelete(id);
        
        if (!product) {
            return res.status(404).json({ message: "Product not found" });
        }
        
        res.status(204).json({ status: 'success', data: null });
    } catch (err) {
        next({ message: "Failed to delete product", error: err.message });
    }
};

const getProductsByCategory = async (req, res, next) => {
    try {
        const { categoryId } = req.params;
        const products = await Product.find({ category: categoryId });
        res.status(200).json({ status: 'success', data: products });
    } catch (err) {
        next({ message: "Failed to retrieve products by category", error: err.message });
    }
};

module.exports = {
    getAllProducts,
    getProductById,
    createProduct,
    updateProduct,
    deleteProduct,
    getProductsByCategory
};
