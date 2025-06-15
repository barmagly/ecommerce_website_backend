exports.authorizeAdmin = (req, res, next) => {
    try {
        if (!req.user) {
            return res.status(401).json({ message: "Unauthorized, please login first" });
        }

        if (req.user.role !== "admin") {
            return res.status(403).json({ message: "Access denied. Admins only." });
        }
        console.log("Admin authorized:", req.user.email);
        next();
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Internal server error" });
    }
};