// Fix admin data
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const config = require('./config');
const Admin = require('./models/Admin');

async function fixAdmin() {
  try {
    await mongoose.connect(config.MONGODB_URI);
    console.log('✅ Connected to database');

    // Find the admin
    const admin = await Admin.findOne({ email: 'admin@flexcoach.com' });
    
    if (admin) {
      console.log('📧 Found admin, updating...');
      
      // Hash the password
      const hashedPassword = await bcrypt.hash('admin123', 10);
      
      // Update using updateOne to avoid validation issues
      await Admin.updateOne(
        { _id: admin._id },
        {
          $set: {
            username: 'admin',
            password: hashedPassword,
            isActive: true,
            role: 'admin'
          }
        }
      );
      
      console.log('✅ Admin updated successfully');
      
      // Verify the update
      const updatedAdmin = await Admin.findById(admin._id);
      console.log('🔍 Updated admin:');
      console.log(`   Username: ${updatedAdmin.username}`);
      console.log(`   Email: ${updatedAdmin.email}`);
      console.log(`   Password hash: ${updatedAdmin.password ? 'Set' : 'Not set'}`);
      console.log(`   Role: ${updatedAdmin.role}`);
      console.log(`   Active: ${updatedAdmin.isActive}`);
      
      // Test password
      const isValid = await bcrypt.compare('admin123', updatedAdmin.password);
      console.log(`   Password test: ${isValid ? '✅ Valid' : '❌ Invalid'}`);
      
    } else {
      console.log('❌ Admin not found');
    }
    
  } catch (error) {
    console.error('❌ Fix failed:', error.message);
  } finally {
    await mongoose.connection.close();
  }
}

fixAdmin();