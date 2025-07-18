const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const mongoose = require('mongoose');
const User = require('../models/user.model');
const { Product, ProductVariant } = require('../models/product.model');
const { uploadToCloudinary } = require('../utils/cloudinary');
const crypto = require('crypto');
const { transporter, sendMail } = require('../utils/emailConfig');
const client = require('../utils/googleAuth');

const JWT_SECRET = process.env.JWT_SECRET;

const generateToken = (id) => {
    return jwt.sign({ id }, JWT_SECRET, { expiresIn: '30d' });
};

const register = async (req, res, next) => {
    try {
        const { name, email, password, phone, addresses, address } = req.body;

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
        const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z]+\.[a-zA-Z]{2,}$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({
                message: 'Please enter a valid email address',
                field: 'email'
            });
        }

        if (password.length < 6) {
            return res.status(400).json({
                message: 'Password must be at least 6 characters long',
                field: 'password'
            });
        }
        const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d@$!%*?&]{6,}$/;
        if (!passwordRegex.test(password)) {
            return res.status(400).json({
                message: 'Password must contain at least one letter and one number',
                field: 'password'
            });
        }
        const phoneRegex = /^[0-9]{10,15}$/;
        if (!phoneRegex.test(phone)) {
            return res.status(400).json({
                message: 'Please enter a valid phone number (10-15 digits)',
                field: 'phone'
            });
        }
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({
                message: 'This email is already registered',
                field: 'email'
            });
        }
        const user = await User.create({
            name,
            email,
            password,
            phone,
            addresses: addresses || address,
            active: true
        });

        const token = generateToken(user._id);

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
        const { email, username, password } = req.body;
        const loginEmail = email || username;

        if (!loginEmail || !password) {
            return res.status(400).json({
                message: 'Email and password are required',
                field: !loginEmail ? 'email' : 'password'
            });
        }

        const user = await User.findOne({ email: loginEmail }).select('+password');
        if (!user) {
            return res.status(401).json({
                message: 'Invalid email or password',
                field: 'email'
            });
        }

        if (!user.active) {
            return res.status(401).json({
                message: 'Account is deactivated. Please contact support.',
                field: 'email'
            });
        }

        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            return res.status(401).json({
                message: 'Invalid email or password',
                field: 'password'
            });
        }

        
        const token = generateToken(user._id);
        if (!token) {
            return res.status(500).json({
                message: 'Failed to generate authentication token'
            });
        }

        const userData = {
            _id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
            phone: user.phone
        };

        if (user.role === 'admin') {
            userData.isAdmin = true;
        }
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
        const { name, email, phone, addresses } = req.body;
        let profileImgUrl = null;

        if (req.file) {
            const uploadResult = await uploadToCloudinary(req.file, 'users/profiles/' + req.user._id);
            profileImgUrl = uploadResult.url;
        }

        if (email) {
            const existingUser = await User.findOne({ email, _id: { $ne: req.user._id } });
            if (existingUser) {
                return res.status(400).json({ message: 'Email already in use' });
            }
        }

        const updateFields = {};

        if (name) updateFields.name = name;
        if (email) updateFields.email = email;
        if (phone) updateFields.phone = phone;
        if (addresses) updateFields.addresses = addresses;
        if (profileImgUrl) updateFields.profileImg = profileImgUrl;

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

const updateUserById = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { name, email, phone, password, role, status, addresses } = req.body;

        const existingUser = await User.findById(id);
        if (!existingUser) {
            return res.status(404).json({ message: 'User not found' });
        }

        if (email) {
            const emailExists = await User.findOne({ email, _id: { $ne: id } });
            if (emailExists) {
                return res.status(400).json({ message: 'Email already in use' });
            }
        }

        const updateFields = {};

        if (name) updateFields.name = name;
        if (email) updateFields.email = email;
        if (phone) updateFields.phone = phone;
        if (role) updateFields.role = role;
        if (status) updateFields.status = status;
        if (addresses) {
            const addressArray = Array.isArray(addresses) ? addresses : addresses.split(',').map(addr => addr.trim()).filter(addr => addr);
            updateFields.addresses = addressArray;
        }
        if (password) {
            if (!/^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d@$!%*?&]{6,}$/.test(password)) {
                return res.status(400).json({
                    message: 'Password must be at least 6 characters long and contain at least one letter and one number'
                });
            }
            updateFields.password = password;
            updateFields.passwordChangedAt = Date.now();
        }

        const user = await User.findByIdAndUpdate(
            id,
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

        user.password = newPassword;
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

const googleLogin = async (req, res) => {
    const { idToken } = req.body;

    if (!idToken) {
        return res.status(400).json({ success: false, message: 'ID Token is required' });
    }

    try {
        const ticket = await client.verifyIdToken({
            idToken,
            audience: process.env.GOOGLE_CLIENT_ID,
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
                isGoogleUser: true,
                active: true
            });

            await user.save();
            console.log(`✅ New user created: ${email}`);

            try {
                await sendMail(
                    email,
                    'مرحبًا بك في منصتنا!',
                    `<div style="font-family: Arial, sans-serif; direction: rtl; text-align: right;">
                        <h2>مرحبًا ${name}!</h2>
                        <p>شكرًا لانضمامك إلينا! نحن سعداء بانضمامك إلى منصتنا ونتمنى لك تجربة رائعة 😊</p>
                        <p>مع تحياتنا،<br>فريق ميزانو ❤️</p>
                    </div>`,
                    `مرحبًا ${name}،\n\nشكرًا لانضمامك إلينا! نحن سعداء بانضمامك إلى منصتنا ونتمنى لك تجربة رائعة 😊`
                );
                console.log('Welcome email sent successfully');
            } catch (error) {
                console.log('Error sending welcome email:', error);
            }
        } else {
            if (!user.active) {
                return res.status(401).json({
                    status: 'error',
                    message: 'Account is deactivated. Please contact support.'
                });
            }
            console.log(`Existing user logged in: ${email}`);
        }

        const token = generateToken(user._id);

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
        console.error(' Token verification failed:', error);
        res.status(401).json({ success: false, message: 'Invalid ID Token' });
    }
};



const generateResetToken = () => {
    return crypto.randomBytes(20).toString('hex');
};

const generateTokenExpiration = () => {
    return Date.now() + 10 * 60 * 1000; // 10 minutes
};

const forgotPassword = async (req, res, next) => {
    try {
        const { email } = req.body;
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        if (user.isGoogleUser) {
            return res.status(400).json({
                message: 'Google users cannot reset their password. Please use Google to sign in.'
            });
        }

        const resetToken = generateResetToken();
        const tokenExpiration = generateTokenExpiration();

        user.validate = () => { };

        user.resetPasswordToken = resetToken;
        user.resetPasswordExpires = tokenExpiration;
        await user.save();

        const resetUrl = `https://ecommerce-website-cyan-pi.vercel.app/reset-password/${resetToken}`;
        
        try {
            await sendMail(
                email,
                'طلب إعادة تعيين كلمة المرور',
                `<div style="font-family: Arial, sans-serif; direction: rtl; text-align: right;">
                    <h2>طلب إعادة تعيين كلمة المرور</h2>
                    <p>لقد تلقّيت هذا البريد الإلكتروني لأنك (أو شخصًا آخر) طلبت إعادة تعيين كلمة المرور لحسابك.</p>
                    <p>يرجى النقر على الرابط التالي أو نسخه ولصقه في المتصفح لإتمام العملية:</p>
                    <p><a href="${resetUrl}" style="color: #0d6efd; text-decoration: none;">${resetUrl}</a></p>
                    <p>إذا لم تطلب ذلك، يمكنك تجاهل هذا البريد، وستظل كلمة المرور الخاصة بك كما هي.</p>
                    <p><strong>يرجى ملاحظة أن هذا الرابط سينتهي خلال 10 دقائق.</strong></p>
                    <p>إذا واجهت أي مشكلة أو كنت بحاجة إلى مساعدة، لا تتردد في التواصل معنا.</p>
                    <p>مع تحياتنا،<br>فريق ميزانو ❤️</p>
                </div>`,
                `لقد تلقّيت هذا البريد الإلكتروني لأنك (أو شخصًا آخر) طلبت إعادة تعيين كلمة المرور لحسابك.\n\nيرجى النقر على الرابط التالي أو نسخه ولصقه في المتصفح لإتمام العملية:\n${resetUrl}\n\nإذا لم تطلب ذلك، يمكنك تجاهل هذا البريد، وستظل كلمة المرور الخاصة بك كما هي.\n\nيرجى ملاحظة أن هذا الرابط سينتهي خلال 10 دقائق.\n\nإذا واجهت أي مشكلة أو كنت بحاجة إلى مساعدة، لا تتردد في التواصل معنا.\n\nمع تحياتنا،\nفريق ميزانو ❤️`
            );
            res.status(200).json({ message: 'Reset password email sent' });
        } catch (error) {
            console.log('Error sending reset email:', error);
            return res.status(500).json({ message: 'Error sending reset email' });
        }
    } catch (err) {
        next({ message: 'Error processing forgot password request', error: err.message });
    }
};

const resetPassword = async (req, res, next) => {
    try {
        const { token } = req.params;
        const { password } = req.body;

        const user = await User.findOne({
            resetPasswordToken: token,
            resetPasswordExpires: { $gt: Date.now() }
        });

        if (!user) {
            return res.status(400).json({
                message: 'Invalid or expired reset token'
            });
        }

        if (user.isGoogleUser) {
            return res.status(400).json({
                message: 'Google users cannot reset their password. Please use Google to sign in.'
            });
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        user.password = hashedPassword;
        user.resetPasswordToken = undefined;
        user.resetPasswordExpires = undefined;

        await User.findByIdAndUpdate(user._id, {
            password: hashedPassword,
            resetPasswordToken: undefined,
            resetPasswordExpires: undefined
        }, { new: true });

        res.status(200).json({
            message: 'Password reset successful'
        });
    } catch (err) {
        console.error('Password reset error:', err);
        next({ message: 'Error resetting password', error: err.message });
    }
};

module.exports = {
    register,
    login,
    getAllUsers,
    getUserById,
    getProfile,
    updateUser,
    updatePassword,
    deleteUser,
    addAddressToBook,
    updateAddressInBook,
    deleteAddressFromBook,
    getAddressBook,
    getPaymentOptions,
    addPaymentOption,
    updatePaymentOption,
    deletePaymentOption,
    getWishlist,
    addToWishlist,
    removeFromWishlist,
    addAddress,
    removeAddress,
    googleLogin,
    forgotPassword,
    resetPassword,
    updateUserById
};
