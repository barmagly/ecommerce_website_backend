const Category = require('../models/category.model');

const getAllCategories = async (req, res, next) => {
    try {
        const categories = await Category.find();
        res.status(200).json({ status: 'success', categories });
    } catch (err) {
        res.status(500).json({
            status: 'error', message: "Failed to retrieve categories", error: err.message
        });
    }
};

const getCategoryById = async (req, res, next) => {
    try {
        const { id } = req.params;
        if (!id.match(/^[0-9a-fA-F]{24}$/)) {
            return res.status(400).json({ message: "Invalid category ID format" });
        }

        const category = await Category.findById(id);
        if (!category) {
            return res.status(404).json({ message: "Category not found" });
        }
        res.status(200).json({ status: 'success', category });
    } catch (err) {
        res.status(500).json({
            status: 'error', message: "Failed to retrieve category", error: err.message
        });
    }
};

const createCategory = async (req, res, next) => {
    try {
        const category = await Category.create(req.body);
        res.status(201).json({ status: 'success', category });
    } catch (err) {
        res.status(500).json({
            status: 'error', message: "Failed to create category", error: err.message });
    }
};

const updateCategory = async (req, res, next) => {
    try {
        const { id } = req.params;
        const category = await Category.findById(id);
        if (!category) {
            return res.status(404).json({ message: "Category not found" });
        }
        category = await Category.findByIdAndUpdate(id, req.body, {
            new: true,
            runValidators: true
        });


        res.status(200).json({ status: 'success', category });
    } catch (err) {
       res.status(500).json({
            status: 'error', message: "Failed to update category", error: err.message });
    }
};

const deleteCategory = async (req, res, next) => {
    try {
        const { id } = req.params;
        const category = await Category.findById(id);
        if (!category) {
            return res.status(404).json({ message: "Category not found" });
        }
        await Category.findByIdAndDelete(id);


        res.status(204).json({ status: 'success delete' });
    } catch (err) {
        res.status(500).json({
            status: 'error', message: "Failed to delete category", error: err.message });
    }
};

module.exports = {
    getAllCategories,
    getCategoryById,
    createCategory,
    updateCategory,
    deleteCategory
};
