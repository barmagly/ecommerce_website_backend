const mongoose = require('mongoose');
const User = require('./models/user.model');

async function createAdmin() {
    try {
        // Connect to database
        await mongoose.connect('mongodb+srv://barmaglyy:Wr4sTf0EjgvwvEGn@ecommerc.orhrblw.mongodb.net/?retryWrites=true&w=majority&appName=Ecommerc');
        console.log('Connected to database');

        // Check if admin user exists
        const existingAdmin = await User.findOne({ email: 'admin@admin.com' });
        
        if (existingAdmin) {
            console.log('Admin user found:', existingAdmin.email);
            console.log('Current role:', existingAdmin.role);
            
            // Update role to admin if it's not already
            if (existingAdmin.role !== 'admin') {
                existingAdmin.role = 'admin';
                await existingAdmin.save();
                console.log('Updated role to admin');
            } else {
                console.log('Role is already admin');
            }
        } else {
            // Create new admin user
            const adminUser = await User.create({
                name: 'Admin User',
                email: 'admin@admin.com',
                password: 'admin123',
                role: 'admin',
                active: true
            });
            console.log('Created new admin user:', adminUser.email);
        }

        process.exit(0);
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
}

createAdmin(); 