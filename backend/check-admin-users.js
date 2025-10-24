const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const Admin = require('./models/Admin');

async function checkAndFixAdminUsers() {
  try {
    // Connect to MongoDB
    await mongoose.connect('mongodb://localhost:27017/flexcoach');
    console.log('✅ Connected to MongoDB');
    
    // Get all admin users
    const admins = await Admin.find({});
    console.log('\n👥 All Admin Users:');
    
    if (admins.length === 0) {
      console.log('   No admin users found');
    } else {
      admins.forEach((admin, index) => {
        console.log(`   ${index + 1}. Email: ${admin.email}`);
        console.log(`      Name: ${admin.firstName || 'N/A'} ${admin.lastName || 'N/A'}`);
        console.log(`      Role: ${admin.role || 'N/A'}`);
        console.log(`      Active: ${admin.isActive}`);
        console.log(`      Created: ${admin.createdAt}`);
        console.log(`      Password Hash: ${admin.password ? admin.password.substring(0, 20) + '...' : 'N/A'}`);
        console.log('');
      });
    }
    
    // Create or update admin user with known credentials
    console.log('🔧 Creating/updating admin user...');
    
    const hashedPassword = await bcrypt.hash('admin123', 12);
    
    const adminData = {
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
    };
    
    // Use upsert to create or update
    const result = await Admin.findOneAndUpdate(
      { email: 'admin@flexcoach.com' },
      adminData,
      { upsert: true, new: true }
    );
    
    console.log('✅ Admin user created/updated:');
    console.log('   Email: admin@flexcoach.com');
    console.log('   Password: admin123');
    console.log('   ID:', result._id);
    
    // Test password verification
    const isPasswordValid = await bcrypt.compare('admin123', result.password);
    console.log('   Password verification:', isPasswordValid ? '✅ Valid' : '❌ Invalid');
    
    mongoose.connection.close();
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

checkAndFixAdminUsers();