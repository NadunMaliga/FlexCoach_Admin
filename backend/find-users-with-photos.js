const mongoose = require('mongoose');
const config = require('./config');
const User = require('./models/User');
const UserProfile = require('./models/UserProfile');

async function findUsersWithPhotos() {
  try {
    await mongoose.connect(config.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Find users with profile photos
    const usersWithPhotos = await UserProfile.find({ 
      profilePhoto: { $ne: null, $ne: '' } 
    }).limit(10);
    
    console.log(`📸 Found ${usersWithPhotos.length} users with profile photos:`);
    
    for (const profile of usersWithPhotos) {
      // Get the corresponding user data
      const user = await User.findById(profile.userId);
      
      console.log(`\n👤 ${profile.firstName} ${profile.lastName}`);
      console.log(`   Email: ${profile.email}`);
      console.log(`   User ID: ${profile.userId}`);
      console.log(`   Profile Photo: ${profile.profilePhoto}`);
      console.log(`   User Status: ${user ? (user.isActive ? 'Active' : 'Inactive') : 'Not found'}`);
      console.log(`   User Approval: ${user ? user.status : 'Unknown'}`);
    }

    // Also show all users for reference
    console.log(`\n📋 All users (first 10):`);
    const allUsers = await User.find().limit(10).select('_id firstName lastName email status isActive');
    allUsers.forEach(user => {
      console.log(`  - ${user.firstName} ${user.lastName} (${user.email}) - Status: ${user.status} - Active: ${user.isActive}`);
    });

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Disconnected from MongoDB');
  }
}

findUsersWithPhotos();