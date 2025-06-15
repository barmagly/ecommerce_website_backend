const Joi = require('joi');

const seoPageSchema = Joi.object({
    title: Joi.string().max(60),
    description: Joi.string().max(160),
    keywords: Joi.string(),
    ogTitle: Joi.string(),
    ogDescription: Joi.string(),
    ogImage: Joi.string().uri(),
    robotsIndex: Joi.boolean(),
    robotsFollow: Joi.boolean(),
    canonicalUrl: Joi.string().uri()
});

const passwordPolicySchema = Joi.object({
    minLength: Joi.number().min(6).max(32),
    requireUppercase: Joi.boolean(),
    requireLowercase: Joi.boolean(),
    requireNumbers: Joi.boolean(),
    requireSymbols: Joi.boolean()
});

exports.validateSettings = (data) => {
    const schema = Joi.object({
        // General Settings
        siteName: Joi.string().required(),
        siteDescription: Joi.string().required(),
        contactEmail: Joi.string().email().required(),
        contactPhone: Joi.string().required(),
        address: Joi.string().required(),

        // SEO Settings
        seoPages: Joi.object().pattern(
            Joi.string(),
            seoPageSchema
        ),

        // Theme Settings
        primaryColor: Joi.string().pattern(/^#[0-9A-Fa-f]{6}$/),
        darkMode: Joi.boolean(),
        rtl: Joi.boolean(),
        fontFamily: Joi.string(),

        // Security Settings
        twoFactorAuth: Joi.boolean(),
        sessionTimeout: Joi.number().min(5).max(1440),
        maxLoginAttempts: Joi.number().min(1).max(10),
        passwordPolicy: passwordPolicySchema,

        // Notifications
        emailNotifications: Joi.boolean(),
        smsNotifications: Joi.boolean(),
        pushNotifications: Joi.boolean(),
        orderNotifications: Joi.boolean(),
        reviewNotifications: Joi.boolean(),

        // Analytics
        googleAnalytics: Joi.string(),
        facebookPixel: Joi.string(),
        trackingEnabled: Joi.boolean(),

        // Performance
        cacheEnabled: Joi.boolean(),
        compressionEnabled: Joi.boolean(),
        lazyLoading: Joi.boolean(),
        imageOptimization: Joi.boolean(),

        // Backup
        autoBackup: Joi.boolean(),
        backupFrequency: Joi.string().valid('daily', 'weekly', 'monthly'),
        backupRetention: Joi.number().min(1).max(365),

        // Payment & Shipping
        currency: Joi.string().valid('EGP', 'SAR', 'USD', 'EUR'),
        taxRate: Joi.number().min(0).max(100),
        freeShippingThreshold: Joi.number().min(0),
        shippingCalculation: Joi.string().valid('weight', 'price', 'fixed')
    });

    return schema.validate(data);
}; 