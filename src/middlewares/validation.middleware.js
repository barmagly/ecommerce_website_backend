export const validation = (schema) => {
    return (req, res, next) => {
        const data = { ...req.body, ...req.query, ...req.params };
        const validationResult = schema.validate(data, { abortEarly: false });
        if (validationResult.error) {
            const errors = validationResult.error.details.map((detail) => detail.message);
            return res.status(400).json({ errors });
        }
        return next();

    }
} 