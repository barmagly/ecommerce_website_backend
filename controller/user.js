const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const mongoose = require('mongoose');
const User = require('../models/user.model');
const { Product, ProductVariant } = require('../models/product.model');
const { uploadToCloudinary } = require('../utils/cloudinary');
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

// Generate JWT Token
const generateToken = (id) => {
    return jwt.sign({ id }, JWT_SECRET, { expiresIn: '30d' });
};

const register = async (req, res, next) => {
    try {
        const { name, email, password, phone, addresses, address } = req.body;

        // Validate required fields with specific messages
        if (!name) {
            return res.status(400).json({
                message: 'Name is required',
                field: 'name'
            });
        }
        if (!email) {
            return res.status(400).json({
                message: 'Email is required',
                field: 'email'
            });
        }
        if (!password) {
            return res.status(400).json({
                message: 'Password is required',
                field: 'password'
            });
        }
        if (!phone) {
            return res.status(400).json({
                message: 'Phone number is required',
                field: 'phone'
            });
        }

        // Validate email format
        const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z]+\.[a-zA-Z]{2,}$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({
                message: 'Please enter a valid email address',
                field: 'email'
            });
        }

        // Validate password
        if (password.length < 6) {
            return res.status(400).json({
                message: 'Password must be at least 6 characters long',
                field: 'password'
            });
        }

        // Validate password format
        const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d@$!%*?&]{6,}$/;
        if (!passwordRegex.test(password)) {
            return res.status(400).json({
                message: 'Password must contain at least one letter and one number',
                field: 'password'
            });
        }

        // Validate phone format
        const phoneRegex = /^[0-9]{10,15}$/;
        if (!phoneRegex.test(phone)) {
            return res.status(400).json({
                message: 'Please enter a valid phone number (10-15 digits)',
                field: 'phone'
            });
        }

        // Check if user already exists
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({
                message: 'This email is already registered',
                field: 'email'
            });
        }

        // Create new user
        const user = await User.create({
            name,
            email,
            password,
            phone,
            addresses: addresses || address,
            active: true
        });

        const token = generateToken(user._id);

        // Return user data and token in the same format as login
        const userData = {
            _id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
            phone: user.phone
        };

        res.status(201).json({
            status: 'success',
            data: {
                user: userData,
                token,
                hasToken: true,
                hasUser: true,
                adminData: user.role === 'admin' ? {
                    ...userData,
                    isAdmin: true
                } : null
            }
        });
    } catch (err) {
        console.error('Registration error:', err);
        if (err.name === 'ValidationError') {
            const errors = Object.values(err.errors).map(e => ({
                message: e.message,
                field: e.path
            }));
            return res.status(400).json({
                message: 'Validation error',
                errors
            });
        }
        next({ message: 'Failed to register user', error: err.message });
    }
};

const login = async (req, res, next) => {
    try {
        // Accept both username and email fields
        const { email, username, password } = req.body;
        const loginEmail = email || username;

        // Validate input
        if (!loginEmail || !password) {
            return res.status(400).json({
                message: 'Email and password are required',
                field: !loginEmail ? 'email' : 'password'
            });
        }

        // Find user and explicitly select password field
        const user = await User.findOne({ email: loginEmail }).select('+password');
        if (!user) {
            return res.status(401).json({
                message: 'Invalid email or password',
                field: 'email'
            });
        }

        // Verify password
        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            return res.status(401).json({
                message: 'Invalid email or password',
                field: 'password'
            });
        }

        // Generate token
        const token = generateToken(user._id);
        if (!token) {
            return res.status(500).json({
                message: 'Failed to generate authentication token'
            });
        }

        // Return user data and token in the format expected by frontend
        const userData = {
            _id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
            phone: user.phone
        };

        // For admin users, include additional data
        if (user.role === 'admin') {
            userData.isAdmin = true;
        }

        // Send response in the exact format expected by frontend
        res.status(200).json({
            status: 'success',
            data: {
                user: userData,
                token,
                hasToken: true,
                hasUser: true,
                adminData: user.role === 'admin' ? {
                    ...userData,
                    isAdmin: true
                } : null
            }
        });
    } catch (err) {
        console.error('Login error:', err);
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
        // Get form data from request body
        const { name, email, phone, addresses } = req.body;
        let profileImgUrl = null;

        // Handle profile image upload if provided
        if (req.file) {
            const uploadResult = await uploadToCloudinary(req.file, 'users/profiles/' + req.user._id);
            profileImgUrl = uploadResult.url;
        }

        // Validate email if provided
        if (email) {
            const existingUser = await User.findOne({ email, _id: { $ne: req.user._id } });
            if (existingUser) {
                return res.status(400).json({ message: 'Email already in use' });
            }
        }

        // Create update fields object
        const updateFields = {};

        // Only add fields that are provided
        if (name) updateFields.name = name;
        if (email) updateFields.email = email;
        if (phone) updateFields.phone = phone;
        if (addresses) updateFields.addresses = addresses;
        if (profileImgUrl) updateFields.profileImg = profileImgUrl;

        // Update user
        const user = await User.findByIdAndUpdate(
            req.user._id,
            updateFields,
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

        // Validate new password pattern before anything
        if (!/^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d@$!%*?&]{6,}$/.test(newPassword)) {
            return res.status(400).json({
                message: 'Password must be at least 6 characters long and contain at least one letter and one number'
            });
        }

        const user = await User.findById(req.user._id).select('+password');

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        if (!(await bcrypt.compare(currentPassword, user.password))) {
            return res.status(401).json({ message: 'Current password is incorrect' });
        }

        user.password = newPassword; // will be hashed automatically in pre-save
        user.passwordChangedAt = Date.now();

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

// Add new address to address book
const addAddressToBook = async (req, res, next) => {
    try {
        const { label, details, city } = req.body;

        if (!label || !details || !city) {
            return res.status(400).json({
                message: 'All address fields are required'
            });
        }

        const user = await User.findByIdAndUpdate(
            req.user._id,
            {
                $push: {
                    addressBook: {
                        label,
                        details,
                        city,
                    }
                }
            },
            { new: true }
        );

        res.status(200).json({
            status: 'success',
            data: user.addressBook
        });
    } catch (err) {
        next({ message: 'Failed to add address', error: err.message });
    }
};

// Update existing address in address book
const updateAddressInBook = async (req, res, next) => {
    try {
        const { addressId } = req.params;
        const { label, details, city } = req.body;

        const user = await User.findOneAndUpdate(
            {
                _id: req.user._id,
                'addressBook._id': addressId
            },
            {
                $set: {
                    'addressBook.$.label': label,
                    'addressBook.$.details': details,
                    'addressBook.$.city': city,
                }
            },
            { new: true }
        );

        if (!user) {
            return res.status(404).json({
                message: 'Address not found'
            });
        }

        res.status(200).json({
            status: 'success',
            data: user.addressBook
        });
    } catch (err) {
        next({ message: 'Failed to update address', error: err.message });
    }
};

// Delete address from address book
const deleteAddressFromBook = async (req, res, next) => {
    try {
        const { addressId } = req.params;

        const user = await User.findByIdAndUpdate(
            req.user._id,
            {
                $pull: {
                    addressBook: { _id: addressId }
                }
            },
            { new: true }
        );

        if (!user) {
            return res.status(404).json({
                message: 'Address not found'
            });
        }

        res.status(200).json({
            status: 'success',
            data: user.addressBook
        });
    } catch (err) {
        next({ message: 'Failed to delete address', error: err.message });
    }
};

// Get all addresses from address book
const getAddressBook = async (req, res, next) => {
    try {
        const user = await User.findById(req.user._id);
        if (!user) {
            return res.status(404).json({
                message: 'User not found'
            });
        }

        res.status(200).json({
            status: 'success',
            data: user.addressBook
        });
    } catch (err) {
        next({ message: 'Failed to get address book', error: err.message });
    }
};

// Get all payment options
const getPaymentOptions = async (req, res, next) => {
    try {
        const user = await User.findById(req.user._id);
        if (!user) {
            return res.status(404).json({
                message: 'User not found'
            });
        }

        res.status(200).json({
            status: 'success',
            data: user.paymentOptions
        });
    } catch (err) {
        next({ message: 'Failed to get payment options', error: err.message });
    }
};

// Add new payment option
const addPaymentOption = async (req, res, next) => {
    try {
        const { cardType, cardNumber, cardholderName } = req.body;

        if (!cardType || !cardNumber || !cardholderName) {
            return res.status(400).json({
                message: 'All payment fields are required'
            });
        }

        const user = await User.findByIdAndUpdate(
            req.user._id,
            {
                $push: {
                    paymentOptions: {
                        cardType,
                        cardNumber,
                        cardholderName
                    }
                }
            },
            { new: true }
        );

        res.status(200).json({
            status: 'success',
            data: user.paymentOptions
        });
    } catch (err) {
        next({ message: 'Failed to add payment option', error: err.message });
    }
};

// Update existing payment option
const updatePaymentOption = async (req, res, next) => {
    try {
        const { paymentOptionId } = req.params;
        const { cardType, cardNumber, cardholderName } = req.body;

        const user = await User.findOneAndUpdate(
            {
                _id: req.user._id,
                'paymentOptions._id': paymentOptionId
            },
            {
                $set: {
                    'paymentOptions.$.cardType': cardType,
                    'paymentOptions.$.cardNumber': cardNumber,
                    'paymentOptions.$.cardholderName': cardholderName
                }
            },
            { new: true }
        );

        if (!user) {
            return res.status(404).json({
                message: 'Payment option not found'
            });
        }

        res.status(200).json({
            status: 'success',
            data: user.paymentOptions
        });
    } catch (err) {
        next({ message: 'Failed to update payment option', error: err.message });
    }
};

// Delete payment option
const deletePaymentOption = async (req, res, next) => {
    try {
        const { paymentOptionId } = req.params;

        const user = await User.findByIdAndUpdate(
            req.user._id,
            {
                $pull: {
                    paymentOptions: { _id: paymentOptionId }
                }
            },
            { new: true }
        );

        if (!user) {
            return res.status(404).json({
                message: 'Payment option not found'
            });
        }

        res.status(200).json({
            status: 'success',
            data: user.paymentOptions
        });
    } catch (err) {
        next({ message: 'Failed to delete payment option', error: err.message });
    }
};
const getWishlist = async (req, res, next) => {
    try {
        const user = await User.findById(req.user._id)
            .select('-password')
            .populate('wishlist');

        res.status(200).json({
            status: 'success',
            data: user.wishlist
        });
    } catch (err) {
        next({ message: 'Failed to retrieve wishlist', error: err.message });
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

const removeFromWishlist = async (req, res) => {
    try {
        const { productId } = req.params;

        if (!req.user || !req.user._id) {
            return res.status(401).json({ message: 'Unauthorized' });
        }

        const product = await Product.findById(productId);
        if (!product) {
            return res.status(404).json({ message: 'Product not found' });
        }
        const user = await User.findByIdAndUpdate(
            req.user._id,
            { $pull: { wishlist: productId } },
            { new: true } // Remove the product from their wishlist
        );
        return res.status(200).json({
            status: 'success',
            data: user.wishlist // Send the wishlist from the re-fetched user
        });
    } catch (err) {
        return res.status(500).json({
            message: 'Failed to remove from wishlist',
            error: err.message
        });
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
        pass: 'vyel kuus cuxp kgnc'
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

        const token = generateToken(user._id);

        // Return user data and token in the same format as login
        const userData = {
            _id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
            phone: user.phone,
            profileImg: user.profileImg,
            isGoogleUser: user.isGoogleUser
        };

        res.json({
            status: 'success',
            data: {
                user: userData,
                token,
                hasToken: true,
                hasUser: true,
                adminData: user.role === 'admin' ? {
                    ...userData,
                    isAdmin: true
                } : null
            }
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
    googleLogin,
    getWishlist,
    addAddressToBook,
    updateAddressInBook,
    deleteAddressFromBook,
    getAddressBook,
    getPaymentOptions,
    addPaymentOption,
    updatePaymentOption,
    deletePaymentOption
};
