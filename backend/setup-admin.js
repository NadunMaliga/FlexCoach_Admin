// Setup script to create admin user with proper password
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const config = require('./config');
const Admin = require('./models/Admin');

async function setupAdmin() {
  try {
    // Connect to database
    await mongoose.connect(config.MONGODB_URI);
    console.log('✅ Connected to database');

    // Check if admin exists
    const existingAdmin = await Admin.findOne({ email: 'admin@flexcoach.com' });
    
    if (existingAdmin) {
      console.log('📧 Admin exists, updating password...');
      
      // Hash the password properly
      const hashedPassword = await bcrypt.hash('admin123', 10);
      
      // Update the admin with proper password
      existingAdmin.password = hashedPassword;
      existingAdmin.isActive = true;
      await existingAdmin.save();
      
      console.log('✅ Admin password updated successfully');
    } else {
      console.log('👤 Creating new admin...');
      
      // Hash the password
      const hashedPassword = await bcrypt.hash('admin123', 10);
      
      // Create new admin
      const admin = new Admin({
        username: 'admin',
        email: 'admin@flexcoach.com',
        password: hashedPassword,
        role: 'admin',
        isActive: true
      });
      
      await admin.save();
      console.log('✅ Admin created successfully');
    }
    
    // Verify the admin
    const admin = await Admin.findOne({ email: 'admin@flexcoach.com' });
    console.log('🔍 Admin verification:');
    console.log(`   ID: ${admin._id}`);
    console.log(`   Email: ${admin.email}`);
    console.log(`   Username: ${admin.username}`);
    console.log(`   Role: ${admin.role}`);
    console.log(`   Active: ${admin.isActive}`);
    console.log(`   Password hash length: ${admin.password ? admin.password.length : 'undefined'}`);
    
    // Test password verification
    const isValidPassword = await bcrypt.compare('admin123', admin.password);
    console.log(`   Password verification: ${isValidPassword ? '✅ Valid' : '❌ Invalid'}`);
    
  } catch (error) {
    console.error('❌ Setup failed:', error.message);
  } finally {
    await mongoose.connection.close();
    console.log('🔌 Database connection closed');
  }
}

// Run setup
setupAdmin();