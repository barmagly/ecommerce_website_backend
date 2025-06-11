const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            trim: true,
            min: [3, 'Name must be at least 3 characters long'],
            max: [30, 'Name cannot exceed 30 characters'],
            required: [true, 'Name is required'],
        },
        slug: {
            type: String,
            lowercase: true,
        },
        email: {
            type: String,
            required: [true, 'Email is required'],
            unique: true,
            lowercase: true,
            validate: {
                validator: function (v) {
                    return /^[a-zA-Z0-9._%+-]+@[a-zA-Z]+\.[a-zA-Z]{2,}$/.test(v);
                },
                message: props => `${props.value} is not a valid email address`,
            },
        },
        phone: {
            type: String,
            // required: [true, 'Phone number is required'],
            validate: {
                validator: function (v) {
                    return /^[0-9]{10,15}$/.test(v);
                },
                message: props => `${props.value} is not a valid phone number`
            }
        },
        profileImg: String,
        resetPasswordToken: String,
        resetPasswordExpires: Date,
        password: {
            type: String,
            // required: [true, 'Password is required'],
            minlength: [6, 'Password must be at least 6 characters long'],
            validate: {
                validator: function (v) {
                    // Skip validation if this is a token operation
                    if (this.resetPasswordToken) {
                        return true;
                    }
                    
                    // At least one letter and one number
                    if (!v) return false; // If password is empty
                    
                    const hasLetter = /[a-zA-Z]/.test(v);
                    const hasNumber = /\d/.test(v);
                    
                    return hasLetter && hasNumber;
                },
                message: 'Password must contain at least one letter and one number'
            }
        },
        passwordChangedAt: Date,
        role: {
            type: String,
            enum: ['user', 'admin'],
            default: 'user',
        },
        active: {
            type: Boolean,
            default: false,
        },
        // child reference (one to many)
        wishlist: [
            {
                type: mongoose.Schema.ObjectId,
                ref: 'Product',
            },
        ],
        addresses: String,
        googleId: String,
        isGoogleUser: {
            type: Boolean,
            default: false,
        },
        addresses: {
            type: [String],
            default: []
        },
        addressBook: [{
            label: {
                type: String,
                // required: true,
                trim: true
            },
            details: {
                type: String,
                // required: true,
                trim: true
            },
            city: {
                type: String,
                // required: true,
                trim: true
            }
        }],
        paymentOptions: [{
            cardType: {
                type: String,
                enum: ['Visa', 'MasterCard', 'American Express', 'Discover','Bank Transfer'],
                // required: true
            },
            cardNumber: {
                type: String,
                // required: true,
                validate: {
                    validator: function(v) {
                        // Basic card number validation
                        return /^[0-9]{13,16}$/.test(v);
                    },
                    message: 'Card number must be between 13 and 16 digits'
                }
            },
            cardholderName: {
                type: String,
                // required: true,
                trim: true,
                validate: {
                    validator: function(v) {
                        return /^[a-zA-Z\s]+$/.test(v);
                    },
                    message: 'Cardholder name must contain only letters and spaces'
                }
            },
        }],
    },
    { timestamps: true }
);

userSchema.pre('save', async function (next) {
    if (!this.isModified('password')) return next();
    // Hashing user password
    this.password = await bcrypt.hash(this.password, 12);
    next();
});

const User = mongoose.model('User', userSchema);

module.exports = User;