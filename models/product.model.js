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
    color: {
        name: String,
        code: String,
        image: String
    },
    size: {
        name: String,
        code: String,
        dimensions: {
            length: Number,
            width: Number,
            height: Number
        }
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
        default: function() {
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
productVariantSchema.pre('save', function(next) {
    // Update inStock based on quantity
    this.inStock = this.quantity > 0;
    next();
});

// Product Schema
const productSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
        trim: true,
        minlength: [3, 'Too short product title'],
        maxlength: [200, 'Too long product title']
    },
    slug: {
        type: String,
        required: false,
        lowercase: true
    },
    description: {
        type: String,
        required: [true, 'Product description is required'],
        minlength: [20, 'Too short product description']
    },
    bulletPoints: [{
        type: String,
        maxlength: [200, 'Bullet point too long']
    }],
    brand: {
        type: String,
        required: [true, 'Brand is required']
    },
    model: String,
    category: {
        type: mongoose.Schema.ObjectId,
        ref: 'Category',
        required: [true, 'Product must belong to a category']
    },
    subcategory: {
        type: mongoose.Schema.ObjectId,
        ref: 'Category'
    },
    basePrice: {
        type: Number,
        required: [true, 'Base product price is required'],
        min: [0, 'Price cannot be negative']
    },
    baseAttributes: {
        material: String,
        weight: Number,
        dimensions: {
            length: Number,
            width: Number,
            height: Number,
            unit: {
                type: String,
                enum: ['cm', 'inch'],
                default: 'cm'
            }
        }
    },
    options: {
        colors: [{
            name: String,
            code: String,
            image: String
        }],
        sizes: [{
            name: String,
            code: String,
            dimensions: {
                length: Number,
                width: Number,
                height: Number
            }
        }]
    },
    totalVariants: {
        type: Number,
        default: 0
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
            1: { type: Number, default: 0 },
            2: { type: Number, default: 0 },
            3: { type: Number, default: 0 },
            4: { type: Number, default: 0 },
            5: { type: Number, default: 0 }
        }
    },
    isParent: {
        type: Boolean,
            default: false
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
    shipping: {
        weight: Number,
        dimensions: {
            length: Number,
            width: Number,
            height: Number,
            unit: {
                type: String,
                enum: ['cm', 'inch'],
                default: 'cm'
            }
        },
        freeShipping: {
            type: Boolean,
            default: false
        },
        shippingClass: {
            type: String,
            enum: ['light', 'medium', 'heavy', 'custom'],
            default: 'medium'
        },
        shippingCost: {
            type: Number,
            default: 0
        },
        estimatedDays: {
            min: Number,
            max: Number
        }
    },
    warranty: {
        available: {
            type: Boolean,
            default: false
        },
        duration: String,
        coverage: String
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
    seo: {
        metaTitle: String,
        metaDescription: String,
        keywords: [String]
    }
},
{
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// Update inStock when quantity changes
productSchema.pre('save', function(next) {
    this.inStock = this.quantity > 0;
    next();
});

// Ensure primary image is unique
productSchema.pre('save', function(next) {
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
productSchema.pre('save', function(next) {
    if (this.title) {
        this.slug = this.title.toLowerCase().replace(/ /g, '-');
    }
    next();
});

// Create models
const Product = mongoose.model('Product', productSchema);
const ProductVariant = mongoose.model('ProductVariant', productVariantSchema);

module.exports = { Product, ProductVariant };