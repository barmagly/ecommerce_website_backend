const mongoose = require('mongoose');

const settingsSchema = new mongoose.Schema({
  // General Settings
  siteName: {
    type: String,
    required: true,
    default: 'المتجر الإلكتروني'
  },
  siteDescription: {
    type: String,
    required: true,
    default: 'متجر إلكتروني متكامل للتجارة الإلكترونية'
  },
  contactEmail: {
    type: String,
    required: true
  },
  contactPhone: {
    type: String,
    required: true,
    default: '+966-11-1234567'
  },
  address: {
    type: String,
    required: true
  },

  // SEO Settings
  seoPages: {
    type: Map,
    of: {
      title: String,
      description: String,
      keywords: String,
      ogTitle: String,
      ogDescription: String,
      ogImage: String,
      robotsIndex: Boolean,
      robotsFollow: Boolean,
      canonicalUrl: String
    },
    default: {}
  },

  // Theme Settings
  primaryColor: {
    type: String,
    default: '#1976d2'
  },
  darkMode: {
    type: Boolean,
    default: false
  },
  rtl: {
    type: Boolean,
    default: true
  },
  fontFamily: {
    type: String,
    default: 'Arial'
  },

  // Security Settings
  twoFactorAuth: {
    type: Boolean,
    default: false
  },
  sessionTimeout: {
    type: Number,
    default: 30
  },
  maxLoginAttempts: {
    type: Number,
    default: 5
  },
  passwordPolicy: {
    minLength: {
      type: Number,
      default: 8
    },
    requireUppercase: {
      type: Boolean,
      default: true
    },
    requireLowercase: {
      type: Boolean,
      default: true
    },
    requireNumbers: {
      type: Boolean,
      default: true
    },
    requireSymbols: {
      type: Boolean,
      default: false
    }
  },

  // Notifications
  emailNotifications: {
    type: Boolean,
    default: true
  },
  smsNotifications: {
    type: Boolean,
    default: false
  },
  pushNotifications: {
    type: Boolean,
    default: true
  },
  orderNotifications: {
    type: Boolean,
    default: true
  },
  reviewNotifications: {
    type: Boolean,
    default: true
  },

  // Analytics
  googleAnalytics: {
    type: String,
    default: ''
  },
  facebookPixel: {
    type: String,
    default: ''
  },
  trackingEnabled: {
    type: Boolean,
    default: true
  },

  // Performance
  cacheEnabled: {
    type: Boolean,
    default: true
  },
  compressionEnabled: {
    type: Boolean,
    default: true
  },
  lazyLoading: {
    type: Boolean,
    default: true
  },
  imageOptimization: {
    type: Boolean,
    default: true
  },

  // Backup
  autoBackup: {
    type: Boolean,
    default: true
  },
  backupFrequency: {
    type: String,
    enum: ['daily', 'weekly', 'monthly'],
    default: 'daily'
  },
  backupRetention: {
    type: Number,
    default: 30
  },

  // Payment & Shipping
  currency: {
    type: String,
    enum: ['EGP', 'SAR', 'USD', 'EUR'],
    default: 'SAR'
  },
  taxRate: {
    type: Number,
    default: 15
  },
  freeShippingThreshold: {
    type: Number,
    default: 200
  },
  shippingCalculation: {
    type: String,
    enum: ['weight', 'price', 'fixed'],
    default: 'weight'
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Settings', settingsSchema); 