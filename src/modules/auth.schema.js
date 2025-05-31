import Joi from "joi";

export const register = Joi.object({
    username: Joi.string().min(3).max(30).required(),
    email: Joi.string().email().required(),
    password: Joi.string().min(6).max(100).required(),
    confirmPassword: Joi.string().valid(Joi.ref('password')).required()
        .messages({
            'any.only': 'Passwords do not match',
        }),
    firstName: Joi.string().min(1).max(50).optional(),
    lastName: Joi.string().min(1).max(50).optional(),
});