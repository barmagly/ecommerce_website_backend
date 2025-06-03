const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const mongoose = require('mongoose');
const User = require('../models/user.model');
const { Product, ProductVariant } = require('../models/product.model');
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

// Generate JWT Token
const generateToken = (id) => {
    return jwt.sign({ id }, JWT_SECRET, { expiresIn: '30d' });
};

const register = async (req, res, next) => {
    try {
        const { name, email, password, phone } = req.body;
if(!name || !email || !password || !phone){
    return res.status(400).json({ message: 'All fields are required' });
}
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ message: 'Email already registered' });
        }

        const user = await User.create({
            name,
            email,
            password,
            phone,
            active: true
        });

        const token = generateToken(user._id);

        res.status(201).json({
            status: 'success',
            data: {
                user: {
                    _id: user._id,
                    name: user.name,
                    email: user.email,
                    role: user.role
                },
                token
            }
        });
    } catch (err) {
        next({ message: 'Failed to register user', error: err.message });
    }
};

const login = async (req, res, next) => {
    try {
        const { email, password } = req.body;

        const user = await User.findOne({ email }).select('+password');
        if (!user || !(await bcrypt.compare(password, user.password))) {
            return res.status(401).json({ message: 'Invalid email or password' });
        }

        const token = generateToken(user._id);

        res.status(200).json({
            status: 'success',
            data: {
                user: {
                    _id: user._id,
                    name: user.name,
                    email: user.email,
                    role: user.role
                },
                token
            }
        });
    } catch (err) {
        next({ message: 'Failed to login', error: err.message });
    }
};

const getAllUsers = async (req, res, next) => {
    try {
        const users = await User.find().select('-password');
        res.status(200).json({
            status: 'success',
            users
        });
    } catch (err) {
        next({ message: 'Failed to retrieve users', error: err.message });
    }
};

const getUserById = async (req, res, next) => {
    try {
        const { id } = req.params;

        if (!id.match(/^[0-9a-fA-F]{24}$/)) {
            return res.status(400).json({ message: 'Invalid user ID format' });
        }

        const user = await User.findById(id).select('-password');
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        res.status(200).json({
            status: 'success',
            data: user
        });
    } catch (err) {
        next({ message: 'Failed to retrieve user', error: err.message });
    }
};

const getProfile = async (req, res, next) => {
    try {
        const user = await User.findById(req.user._id)
            .select('-password')
            .populate('wishlist');

        res.status(200).json({
            status: 'success',
            data: user
        });
    } catch (err) {
        next({ message: 'Failed to retrieve profile', error: err.message });
    }
};

const updateUser = async (req, res, next) => {
    try {
        const { name, email, phone } = req.body;

        if (email) {
            const existingUser = await User.findOne({ email, _id: { $ne: req.user._id } });
            if (existingUser) {
                return res.status(400).json({ message: 'Email already in use' });
            }
        }

        const user = await User.findByIdAndUpdate(
            req.user._id,
            { name, email, phone },
            { new: true, runValidators: true }
        ).select('-password');

        res.status(200).json({
            status: 'success',
            user
        });
    } catch (err) {
        next({ message: 'Failed to update user', error: err.message });
    }
};

const updatePassword = async (req, res, next) => {
    try {
        const { currentPassword, newPassword } = req.body;

        const user = await User.findById(req.user._id).select('+password');

        if (!(await bcrypt.compare(currentPassword, user.password))) {
            return res.status(401).json({ message: 'Current password is incorrect' });
        }

        user.password = newPassword;
        await user.save();

        res.status(200).json({
            status: 'success',
            message: 'Password updated successfully'
        });
    } catch (err) {
        next({ message: 'Failed to update password', error: err.message });
    }
};

const deleteUser = async (req, res, next) => {
    try {
        const { id } = req.params;
        const user = await User.findById(id);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        user = await User.findByIdAndDelete(id);


        res.status(204).json({
            status: 'success delete'
        });
    } catch (err) {
        next({ message: 'Failed to delete user', error: err.message });
    }
};

const addToWishlist = async (req, res, next) => {
    try {
        const { productId } = req.params;
        const product = await Product.findById(productId);
        if (!product) {
            return res.status(404).json({ message: 'Product not found' });
        }
        const user = await User.findByIdAndUpdate(
            req.user._id,
            { $addToSet: { wishlist: productId } },
            { new: true }
        ).populate('wishlist');

        res.status(200).json({
            status: 'success',
            data: user.wishlist
        });
    } catch (err) {
        next({ message: 'Failed to add to wishlist', error: err.message });
    }
};

const removeFromWishlist = async (req, res, next) => {
    try {
        const { productId } = req.params;
        const product = await Product.findById(productId);
        if (!product) {
            return res.status(404).json({ message: 'Product not found' });
        }
        const user = await User.findByIdAndUpdate(
            req.user._id,
            { $pull: { wishlist: productId } },
            { new: true }
        ).populate('wishlist');

        res.status(200).json({
            status: 'success',
            data: user.wishlist
        });
    } catch (err) {
        next({ message: 'Failed to remove from wishlist', error: err.message });
    }
};

const addAddress = async (req, res, next) => {
    try {
        const { details, city, postalCode } = req.body;

        const user = await User.findByIdAndUpdate(
            req.user._id,
            {
                $push: {
                    addresses: {
                        id: new mongoose.Types.ObjectId(),
                        details,
                        city,
                        postalCode
                    }
                }
            },
            { new: true }
        );

        res.status(200).json({
            status: 'success',
            data: user.addresses
        });
    } catch (err) {
        next({ message: 'Failed to add address', error: err.message });
    }
};

const removeAddress = async (req, res, next) => {
    try {
        const { addressId } = req.params;

        const user = await User.findByIdAndUpdate(
            req.user._id,
            {
                $pull: {
                    addresses: { id: addressId }
                }
            },
            { new: true }
        );

        res.status(200).json({
            status: 'success',
            data: user.addresses
        });
    } catch (err) {
        next({ message: 'Failed to remove address', error: err.message });
    }
};
//------------------------------------------------------------

const { OAuth2Client } = require('google-auth-library');
const nodemailer = require('nodemailer');

const client = new OAuth2Client('812727128915-pjdracpnf7dalh7ppeagmtfhkea0vf3s.apps.googleusercontent.com');

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: 'barmaglyy@gmail.com',
        pass: 'prhv ikvn ijkb bvib'
    }
});

const googleLogin = async (req, res) => {
    const { idToken } = req.body;

    if (!idToken) {
        return res.status(400).json({ success: false, message: 'ID Token is required' });
    }

    try {
        const ticket = await client.verifyIdToken({
            idToken,
            audience: '812727128915-pjdracpnf7dalh7ppeagmtfhkea0vf3s.apps.googleusercontent.com',
        });

        const payload = ticket.getPayload();
        const { sub: googleId, email, name, picture, email_verified } = payload;

        let user = await User.findOne({ email });
        if (!user) {
            user = new User({
                name,
                email,
                googleId,
                profileImg: picture,
                isGoogleUser: true
            });

            await user.save();
            console.log(`✅ New user created: ${email}`);

            const mailOptions = {
                from: 'barmaglyy@gmail.com',
                to: email,
                subject: 'Welcome to our platform!',
                text: `Hello ${name},\n\nThank you for signing up with us! We're excited to have you onboard in our platform. 😊`
            };

            transporter.sendMail(mailOptions, (error, info) => {
                if (error) {
                    console.log('Error sending email:', error);
                } else {
                    console.log('Welcome email sent:', info.response);
                }
            });
        } else {
            console.log(`Existing user logged in: ${email}`);
        }
        const serverToken = jwt.sign(
            { id: user._id },
            JWT_SECRET,
            { expiresIn: '24h' }
        );

        res.json({
            status: "success",
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                profileImg: user.profileImg,
                email_verified: email_verified
            },
            token: serverToken
        });

    } catch (error) {
        console.error('❌ Token verification failed:', error);
        res.status(401).json({ success: false, message: 'Invalid ID Token' });
    }
};


module.exports = {
    register,
    login,
    getAllUsers,
    getUserById,
    updateUser,
    deleteUser,
    updatePassword,
    getProfile,
    addToWishlist,
    removeFromWishlist,
    addAddress,
    removeAddress,
    googleLogin
};
