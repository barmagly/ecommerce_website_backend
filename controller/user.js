const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const usersModel = require('../models/users');

const getAllUser = async (req, res, next) => {
    try {
        const users = await usersModel.find();
        res.status(200).json(users);
    } catch (err) {
        next({ message: "Failed to retrieve users", error: err.message });
    }
};

const getUserById = async (req, res, next) => {
    const { id } = req.params;
    try {
        if (!id.match(/^[0-9a-fA-F]{24}$/)) {
            return res.status(400).json({ message: "Invalid user ID format" });
        }

        const user = await usersModel.findById(id);
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }
        res.status(200).json({ message: "Success", user });
    } catch (err) {
        next({ message: "Failed to retrieve user", error: err.message });
    }
};

const addUser = async (req, res, next) => {
    try {
        const { firstName, lastName, email, password, phone, profileImage, dateOfBirth, gender, address, role, hostDetails, bookings } = req.body;

        if (!firstName || !lastName || !email || !password || !dateOfBirth || !address) {
            return res.status(400).json({ message: "Missing required fields" });
        }

        const existingUser = await usersModel.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ message: "Email already exists" });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const newUser = new usersModel({
            firstName, lastName, email, password: hashedPassword, phone, profileImage, dateOfBirth, gender, address, role, hostDetails, bookings
        });

        const savedUser = await newUser.save();

        res.status(201).json({ message: "User added successfully", user: savedUser });

    } catch (err) {
        next({ message: "Failed to add user", error: err.message });
    }
};


const editUserById = async (req, res) => {
    const { id } = req.params;
    const data = req.body;

    try {
        const updatedUser = await usersModel.findByIdAndUpdate(id, { ...data, updatedAt: Date.now() }, { new: true });

        if (!updatedUser) {
            return res.status(404).json({ message: "User not found" });
        }

        res.status(200).json({ message: "Success", user: updatedUser });
    } catch (err) {
        console.error("Error updating user:", err);
        next(500).json({ message: "Failed to update user", error: err.message });
    }
};

const deleteUserById = async (req, res) => {
    const { id } = req.params;
    try {
        const user = await usersModel.findById(id);
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }
        await usersModel.findByIdAndDelete(id);
        res.status(200).json({ message: "User deleted successfully" });
    } catch (err) {
        next({ message: "Failed to delete user", error: err.message });
    }
};



const userLogin = async (req, res, next) => {
    const { email, password } = req.body;
    console.log(req.body);
    console.log(email, password);


    try {
        if (!email || !password) {

            return res.status(400).json({ message: "You must provide a name and password" });
        }

        const user = await usersModel.findOne({ email });
        if (!user) {
            return res.status(400).json({ message: "Invalid username or password" });
        }

        const isValid = await bcrypt.compare(password, user.password);
        console.log(password, user.password);

        if (!isValid) {
            return res.status(400).json({ message: "Invalid username or password" });
        }

        const token = jwt.sign({ id: user._id, email: user.email }, 'ahmed_kamal');

        res.status(200).json({ message: "Login successful", token });
    } catch (err) {
        next({ message: "Failed to log in", error: err.message });
    }
};

module.exports = { getAllUser, getUserById, addUser, editUserById, deleteUserById, userLogin };
