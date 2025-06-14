const mongoose = require('mongoose');

// Product Variant Schema
const productVariantSchema = new mongoose.Schema({
    sku: {
        type: String,
        required: true,
        unique: true
    },
    product: {
        type: mongoose.Schema.ObjectId,
        ref: 'Product',
        required: true
    },
    attributes: {   
        type: Map,
        of: String, // Using Map to store dynamic attributes
        required: true      
    },
    price: {
        type: Number,
        required: true,
        min: [0, 'Price cannot be negative']
    },
    quantity: {
        type: Number,
        required: true,
        min: [0, 'Quantity cannot be negative'],
        default: 0
    },
    sold: {
        type: Number,
        default: 0
    },
    inStock: {
        type: Boolean,
        default: function () {
            return this.quantity > 0;
        }
    },
    images: [{
        url: String,
        alt: String,
        isPrimary: Boolean
    }]
}, { timestamps: true });

// Pre-save middleware for variant
productVariantSchema.pre('save', function (next) {
    // Update inStock based on quantity
    this.inStock = this.quantity > 0;
    next();
});

const attributeSchema = new mongoose.Schema({
  name: { type: String, required: true },
  values: { type: [String], required: true }
}, { _id: false });


// Product Schema
const productSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true,
        minlength: [3, 'Too short product title'],
        maxlength: [200, 'Too long product title']
    },
    description: {
        type: String,
        required: [true, 'Product description is required'],
        minlength: [20, 'Too short product description']
    },
    brand: {
        type: String,
        required: [true, 'Brand is required']
    },
    category: {
        type: mongoose.Schema.ObjectId,
        ref: 'Category',
        required: [true, 'Product must belong to a category']
    },
    price: {
        type: Number,
        required: function () {
            return !this.hasVariants;
        }
    },
    hasVariants: {
        type: Boolean,
        default: false
    },
    stock: {
        type: Number,
        required: function () {
            return !this.hasVariants;
        }
    },
    sku: {
        type: String,
        required: function () {
            return !this.hasVariants;
        },       
        unique: true,
        trim: true
    },
    ratings: {
        average: {
            type: Number,
            default: 0,
            min: [0, 'Rating cannot be below 0'],
            max: [5, 'Rating cannot exceed 5'],
            set: val => Math.round(val * 10) / 10
        },
        count: {
            type: Number,
            default: 0
        },
        distribution: {
            type: Map,
            of: Number,
            default: { '1': 0, '2': 0, '3': 0, '4': 0, '5': 0 }
        }
    },
    images: [{
        url: String,
        alt: String,
        isPrimary: Boolean
    }],
    imageCover: {
        type: String,
        required: [true, 'Product image cover is required']
    },
    features: [{
        name: String,
        value: String
    }],
    specifications: [{
        group: String,
        items: [{
            name: String,
            value: String
        }]
    }],
     attributes: [attributeSchema],
},
    {
        timestamps: true,
        toJSON: { virtuals: true },
        toObject: { virtuals: true }
    });

// Update inStock when quantity changes
productSchema.pre('save', function (next) {
    this.inStock = this.quantity > 0;
    next();
});

// Ensure primary image is unique
productSchema.pre('save', function (next) {
    const primaryImages = this.images.filter(img => img.isPrimary);
    if (primaryImages.length > 1) {
        const firstPrimary = primaryImages[0];
        this.images.forEach(img => {
            if (img !== firstPrimary) {
                img.isPrimary = false;
            }
        });
    }
    next();
});

// Virtual populate variants
productSchema.virtual('productVariants', {
    ref: 'ProductVariant',
    foreignField: 'product',
    localField: '_id'
});

// Pre-save middleware to generate slug and update inStock
productSchema.pre('save', function (next) {
    if (this.title) {
        this.slug = this.title.toLowerCase().replace(/ /g, '-');
    }
    next();
});

// Create models
const Product = mongoose.model('Product', productSchema);
const ProductVariant = mongoose.model('ProductVariant', productVariantSchema);

module.exports = { Product, ProductVariant };