const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            trim: true,
            min: [3, 'Too short name'],
            max: [30, 'Too long name'],
            required: [true, 'name required'],
        },
        slug: {
            type: String,
            lowercase: true,
        },
        email: {
            type: String,
            required: [true, 'email required'],
            unique: true,
            lowercase: true,
            validate: {
                validator: function (v) {
                    return /^[a-zA-Z0-9._%+-]+@[a-zA-Z]+\.[a-zA-Z]{2,}$/.test(v);
                },
                message: props => `${props.value} is not a valid email!`,
            },
        },
        phone: String,
        profileImg: String,

        password: {
            type: String,
            required: [true, 'password required'],
            minlength: [8, 'Too short password'],
        },
        passwordChangedAt: Date,
        passwordResetCode: String,
        passwordResetExpires: Date,
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
        addresses: [
            {
                id: { type: mongoose.Schema.Types.ObjectId },
                details: String,
                city: String,
                postalCode: String,
            },
        ],
        googleId: String,
        isGoogleUser: {
            type: Boolean,
            default: false,
        },
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