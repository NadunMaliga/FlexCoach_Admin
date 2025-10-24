const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const Admin = require('./models/Admin');

async function createAdminUser() {
  try {
    // Connect to MongoDB
    await mongoose.connect('mongodb://localhost:27017/flexcoach');
    console.log('✅ Connected to MongoDB');
    
    // Check if admin already exists
    const existingAdmin = await Admin.findOne({ email: 'admin@flexcoach.com' });
    
    if (existingAdmin) {
      console.log('✅ Admin user already exists:', existingAdmin.email);
      console.log('   Name:', existingAdmin.firstName, existingAdmin.lastName);
      console.log('   Created:', existingAdmin.createdAt);
      mongoose.connection.close();
      return;
    }
    
    // Create new admin user
    const hashedPassword = await bcrypt.hash('admin123', 12);
    
    const adminUser = new Admin({
      firstName: 'Admin',
      lastName: 'User',
      email: 'admin@flexcoach.com',
      password: hashedPassword,
      role: 'admin',
      isActive: true,
      permissions: {
        users: { read: true, write: true, delete: true },
        dashboard: { read: true },
        settings: { read: true, write: true }
      }
    });
    
    await adminUser.save();
    console.log('✅ Admin user created successfully!');
    console.log('   Email: admin@flexcoach.com');
    console.log('   Password: admin123');
    console.log('   Role: admin');
    
    mongoose.connection.close();
    
  } catch (error) {
    console.error('❌ Error creating admin user:', error.message);
    process.exit(1);
  }
}

createAdminUser();