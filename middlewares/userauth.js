const jwt = require("jsonwebtoken");
const User = require("../models/user.model");


const isAuthenticated = async (req, res, next) => {
    try {

        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            return res.status(401).json({ message: "Unauthorized, token missing" });
        }

        const token = authHeader.split(" ")[1];

        let decoded;
        try {
            const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
            decoded = jwt.verify(token, JWT_SECRET);
            if (!decoded.id) {
                throw new Error("Invalid token format");
            }
        } catch (err) {
            return res.status(401).json({ message: "Unauthorized, invalid token" });
        }

        const user = await User.findById(decoded.id).select("-password");

        if (!user) {
            return res.status(401).json({ message: "Unauthorized, user not found" });
        }

        req.user = user;

        next();
    } catch (error) {
        console.error(error);
        return res.status(401).json({ message: "Unauthorized, invalid token" });
    }
};

module.exports = { isAuthenticated };