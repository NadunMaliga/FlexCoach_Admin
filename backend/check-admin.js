// Check existing admin data
const mongoose = require('mongoose');
const config = require('./config');
const Admin = require('./models/Admin');

async function checkAdmin() {
  try {
    await mongoose.connect(config.MONGODB_URI);
    console.log('✅ Connected to database');

    const admins = await Admin.find({});
    console.log(`📊 Found ${admins.length} admin(s):`);
    
    admins.forEach((admin, index) => {
      console.log(`\n👤 Admin ${index + 1}:`);
      console.log(`   ID: ${admin._id}`);
      console.log(`   Username: ${admin.username || 'undefined'}`);
      console.log(`   Email: ${admin.email || 'undefined'}`);
      console.log(`   Password: ${admin.password ? 'Set (' + admin.password.length + ' chars)' : 'undefined'}`);
      console.log(`   Role: ${admin.role || 'undefined'}`);
      console.log(`   Active: ${admin.isActive}`);
      console.log(`   Created: ${admin.createdAt}`);
    });
    
  } catch (error) {
    console.error('❌ Check failed:', error.message);
  } finally {
    await mongoose.connection.close();
  }
}

checkAdmin();