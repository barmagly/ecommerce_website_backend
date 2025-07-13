const mongoose = require('mongoose');

function round2(val) {
  return Math.round(Number(val) * 100) / 100;
}

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
        of: String, 
        required: true      
    },
    price: {
        type: Number,
        required: true,
        min: [0, 'Price cannot be negative'],
        set: round2
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

productVariantSchema.pre('save', function (next) {
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
        // required: [true, 'Brand is required']
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
        },
        set: round2
    },
    supplierName: {
        type: String,
        required: function () {
            return !this.hasVariants;
        },
        trim: true,
        minlength: [2, 'Supplier name must be at least 2 characters']
    },
    supplierPrice: {
        type: Number,
        required: function () {
            return !this.hasVariants;
        },
        min: [0, 'Supplier price cannot be negative'],
        set: round2,
        validate: {
            validator: function(value) {
                if (this.price && value > this.price) {
                    return false;
                }
                return true;
            },
            message: 'Supplier price must be less than or equal to the final price'
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
    maxQuantityPerOrder: {
        type: Number,
        min: [1, 'Maximum quantity per order must be at least 1'],
        validate: {
            validator: function(value) {
                if (value && this.stock && value > this.stock) {
                    return false;
                }
                return true;
            },
            message: 'Maximum quantity per order cannot exceed available stock'
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
    shippingAddress: {
        type: {
            type: String,
            enum: ['nag_hamadi', 'other_governorates'],
            required: true,
            default: 'other_governorates'
        },
        details: {
            type: String,
            trim: true
        }
    },
    shippingCost: {
        type: Number,
        required: true,
        min: 0,
        default: 0,
        set: round2
    },
    deliveryDays: {
        type: Number,
        required: true,
        min: 0,
        default: 2
    }
},
    {
        timestamps: true,
        toJSON: { virtuals: true },
        toObject: { virtuals: true }
    });

productSchema.pre('save', function (next) {
    this.inStock = this.quantity > 0;
    next();
});
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

productSchema.virtual('productVariants', {
    ref: 'ProductVariant',
    foreignField: 'product',
    localField: '_id'
});

productSchema.pre('save', function (next) {
    if (this.title) {
        this.slug = this.title.toLowerCase().replace(/ /g, '-');
    }
    next();
});


const Product = mongoose.model('Product', productSchema);
const ProductVariant = mongoose.model('ProductVariant', productVariantSchema);

module.exports = { Product, ProductVariant };