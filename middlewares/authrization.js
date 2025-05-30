exports.authorizeAdmin = (req, res, next) => {
    try {
        console.log(req.user.role);

        if (req.user.role !== "Admin") {
            return res.status(403).json({ message: "Access denied. Admins only." });
        }
        console.log("Admin authorized:", req.user.email);
        next();
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Internal server error" });
    }
};