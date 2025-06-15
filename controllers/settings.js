const Settings = require('../models/settings');
const { validateSettings } = require('../validators/settings');

// Get all settings
exports.getSettings = async (req, res) => {
    try {
        let settings = await Settings.findOne();
        
        // If no settings exist, create default settings
        if (!settings) {
            settings = await Settings.create({
                siteName: 'المتجر الإلكتروني',
                siteDescription: 'متجر إلكتروني متكامل للتجارة الإلكترونية',
                contactEmail: 'info@store.com',
                contactPhone: '+966-11-1234567',
                address: 'الرياض، المملكة العربية السعودية',
                googleAnalytics: 'GA-XXXXXXXXX-X',
                facebookPixel: 'XXXXXXXXXXXXXXX',
                trackingEnabled: true
            });
        }
        
        res.json({
            status: 'success',
            data: settings
        });
    } catch (error) {
        console.error('Error getting settings:', error);
        res.status(500).json({
            status: 'error',
            message: 'Error getting settings'
        });
    }
};

// Update settings
exports.updateSettings = async (req, res) => {
    try {
        // Validate settings data
        const { error } = validateSettings(req.body);
        if (error) {
            return res.status(400).json({
                status: 'error',
                message: error.details[0].message
            });
        }

        let settings = await Settings.findOne();
        
        // If no settings exist, create new settings
        if (!settings) {
            settings = await Settings.create(req.body);
        } else {
            // Update existing settings
            settings = await Settings.findOneAndUpdate(
                {},
                { $set: req.body },
                { new: true, runValidators: true }
            );
        }
        
        res.json({
            status: 'success',
            data: settings
        });
    } catch (error) {
        console.error('Error updating settings:', error);
        res.status(500).json({
            status: 'error',
            message: 'Error updating settings'
        });
    }
};

// Reset settings to default
exports.resetSettings = async (req, res) => {
    try {
        await Settings.deleteOne({});
        const settings = await Settings.create({});
        
        res.json({
            status: 'success',
            data: settings
        });
    } catch (error) {
        console.error('Error resetting settings:', error);
        res.status(500).json({
            status: 'error',
            message: 'Error resetting settings'
        });
    }
}; 