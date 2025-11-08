const mongoose = require('mongoose');
const config = require('./config');
const User = require('./models/User');
const UserProfile = require('./models/UserProfile');

async function testClientsProfilesDirect() {
  try {
    await mongoose.connect(config.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Get first 5 users
    const users = await User.find().limit(5).select('_id firstName lastName email profilePhoto');
    console.log(`📋 Found ${users.length} users in database`);

    console.log('\n👥 Users and their profile photos:');
    
    for (const user of users) {
      console.log(`\n👤 ${user.firstName} ${user.lastName} (${user.email})`);
      console.log(`   User ID: ${user._id}`);
      console.log(`   User.profilePhoto: ${user.profilePhoto || 'None'}`);
      
      // Check userprofiles collection
      const userProfile = await UserProfile.findOne({ userId: user._id });
      if (userProfile) {
        console.log(`   UserProfile.profilePhoto: ${userProfile.profilePhoto || 'None'}`);
        console.log(`   📸 Final photo: ${userProfile.profilePhoto || user.profilePhoto || 'Default'}`);
      } else {
        console.log(`   ❌ No user profile found`);
        console.log(`   📸 Final photo: ${user.profilePhoto || 'Default'}`);
      }
    }

    // Summary
    const usersWithProfiles = await UserProfile.countDocuments();
    const usersWithPhotos = await UserProfile.countDocuments({ profilePhoto: { $ne: null, $ne: '' } });
    
    console.log(`\n📊 Summary:`);
    console.log(`   Total users: ${users.length}`);
    console.log(`   Users with profiles: ${usersWithProfiles}`);
    console.log(`   Users with photos: ${usersWithPhotos}`);

  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Disconnected from MongoDB');
  }
}

testClientsProfilesDirect();