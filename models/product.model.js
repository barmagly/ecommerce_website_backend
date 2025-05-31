const mongoose = require('mongoose');

const productSchema = new mongoose.Schema(
    {
        title: {
            type: String,
            required: true,
            trim: true,
            minlength: [3, 'Too short product title'],
            maxlength: [200, 'Too long product title'],
        },
        slug: {
            type: String,
            required: false,
            lowercase: true,
        },
        description: {
            type: String,
            required: [true, 'Product description is required'],
            minlength: [20, 'Too short product description'],
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
            required: [true, 'Product must belong to a category'],
        },
        subcategory: {
            type: mongoose.Schema.ObjectId,
            ref: 'Category'
        },
        price: {
            type: Number,
            required: [true, 'Product price is required'],
            min: [0, 'Price cannot be negative']
        },
        quantity: {
            type: Number,
            required: [true, 'Product quantity is required'],
            min: [0, 'Quantity cannot be negative']
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
        // Base product attributes
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
        // Available options for variants
        options: {
            colors: [{
                name: String,
                code: String, // hex code or color value
                image: String // specific image for this color
            }],
            sizes: [{
                name: String,
                code: String, // e.g., 'S', 'M', 'L', '42', etc.
                dimensions: {
                    length: Number,
                    width: Number,
                    height: Number
                }
            }]
        },
        // Product variants
        variants: [{
            sku: {
                type: String,
                required: true,
                unique: true
            },
            color: {
                name: String,
                code: String
            },
            size: {
                name: String,
                code: String
            },
            price: {
                type: Number,
                required: true
            },
            quantity: {
                type: Number,
                required: true,
                min: [0, 'Quantity cannot be negative']
            },
            sold: {
                type: Number,
                default: 0
            },
            images: [{
                url: String,
                alt: String,
                isPrimary: Boolean
            }],
            inStock: {
                type: Boolean,
                default: function() {
                    return this.quantity > 0;
                }
            }
        }],
        // Track if this is a parent product
        isParent: {
            type: Boolean,
            default: false
        },
        images: [{
            url: {
                type: String,
                required: true
            },
            alt: String,
            isPrimary: {
                type: Boolean,
                default: false
            }
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
                height: Number
            },
            freeShipping: {
                type: Boolean,
                default: false
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
        seoMetadata: {
            metaTitle: String,
            metaDescription: String,
            keywords: [String]
        },
        status: {
            type: String,
            enum: ['draft', 'active', 'inactive', 'discontinued'],
            default: 'draft'
        },
        isVisible: {
            type: Boolean,
            default: true
        },
        tags: [String]
    },
    {
        timestamps: true,
        toJSON: { virtuals: true },
        toObject: { virtuals: true }
    }
);

// Virtual field for discounted percentage
productSchema.virtual('discountPercentage').get(function() {
    if (this.listPrice && this.price) {
        return Math.round(((this.listPrice - this.price) / this.listPrice) * 100);
    }
    return 0;
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

module.exports = mongoose.model('Product', productSchema);