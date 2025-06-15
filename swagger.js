const swaggerJsdoc = require('swagger-jsdoc');

const options = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'E-commerce API Documentation',
            version: '1.0.0',
            description: 'API documentation for the E-commerce backend',
        },
        servers: [
            {
                url: 'http://localhost:3000',
                description: 'Development server',
            },
        ],
        components: {
            securitySchemes: {
                bearerAuth: {
                    type: 'http',
                    scheme: 'bearer',
                    bearerFormat: 'JWT',
                },
            },
            schemas: {
                Settings: {
                    type: 'object',
                    properties: {
                        // General Settings
                        siteName: {
                            type: 'string',
                            example: 'المتجر الإلكتروني'
                        },
                        siteDescription: {
                            type: 'string',
                            example: 'متجر إلكتروني متكامل للتجارة الإلكترونية'
                        },
                        contactEmail: {
                            type: 'string',
                            format: 'email',
                            example: 'info@store.com'
                        },
                        contactPhone: {
                            type: 'string',
                            example: '+966-11-1234567'
                        },
                        address: {
                            type: 'string',
                            example: 'الرياض، المملكة العربية السعودية'
                        },

                        // SEO Settings
                        seoPages: {
                            type: 'object',
                            additionalProperties: {
                                type: 'object',
                                properties: {
                                    title: { type: 'string' },
                                    description: { type: 'string' },
                                    keywords: { type: 'string' },
                                    ogTitle: { type: 'string' },
                                    ogDescription: { type: 'string' },
                                    ogImage: { type: 'string' },
                                    robotsIndex: { type: 'boolean' },
                                    robotsFollow: { type: 'boolean' },
                                    canonicalUrl: { type: 'string' }
                                }
                            }
                        },

                        // Theme Settings
                        primaryColor: {
                            type: 'string',
                            example: '#1976d2'
                        },
                        darkMode: {
                            type: 'boolean',
                            example: false
                        },
                        rtl: {
                            type: 'boolean',
                            example: true
                        },
                        fontFamily: {
                            type: 'string',
                            example: 'Arial'
                        },

                        // Security Settings
                        twoFactorAuth: {
                            type: 'boolean',
                            example: false
                        },
                        sessionTimeout: {
                            type: 'number',
                            example: 30
                        },
                        maxLoginAttempts: {
                            type: 'number',
                            example: 5
                        },
                        passwordPolicy: {
                            type: 'object',
                            properties: {
                                minLength: { type: 'number', example: 8 },
                                requireUppercase: { type: 'boolean', example: true },
                                requireLowercase: { type: 'boolean', example: true },
                                requireNumbers: { type: 'boolean', example: true },
                                requireSymbols: { type: 'boolean', example: false }
                            }
                        },

                        // Notifications
                        emailNotifications: {
                            type: 'boolean',
                            example: true
                        },
                        smsNotifications: {
                            type: 'boolean',
                            example: false
                        },
                        pushNotifications: {
                            type: 'boolean',
                            example: true
                        },
                        orderNotifications: {
                            type: 'boolean',
                            example: true
                        },
                        reviewNotifications: {
                            type: 'boolean',
                            example: true
                        },

                        // Analytics
                        googleAnalytics: {
                            type: 'string',
                            example: 'GA-XXXXXXXXX-X'
                        },
                        facebookPixel: {
                            type: 'string',
                            example: 'XXXXXXXXXXXXXXX'
                        },
                        trackingEnabled: {
                            type: 'boolean',
                            example: true
                        },

                        // Performance
                        cacheEnabled: {
                            type: 'boolean',
                            example: true
                        },
                        compressionEnabled: {
                            type: 'boolean',
                            example: true
                        },
                        lazyLoading: {
                            type: 'boolean',
                            example: true
                        },
                        imageOptimization: {
                            type: 'boolean',
                            example: true
                        },

                        // Backup
                        autoBackup: {
                            type: 'boolean',
                            example: true
                        },
                        backupFrequency: {
                            type: 'string',
                            enum: ['daily', 'weekly', 'monthly'],
                            example: 'daily'
                        },
                        backupRetention: {
                            type: 'number',
                            example: 30
                        },

                        // Payment & Shipping
                        currency: {
                            type: 'string',
                            enum: ['EGP', 'SAR', 'USD', 'EUR'],
                            example: 'SAR'
                        },
                        taxRate: {
                            type: 'number',
                            example: 15
                        },
                        freeShippingThreshold: {
                            type: 'number',
                            example: 200
                        },
                        shippingCalculation: {
                            type: 'string',
                            enum: ['weight', 'price', 'fixed'],
                            example: 'weight'
                        }
                    }
                },
            },
        },
        security: [{
            bearerAuth: [],
        }],
    },
    apis: ['./routers/*.js'], // Path to the API routes
};

const swaggerSpec = swaggerJsdoc(options);

module.exports = swaggerSpec;
