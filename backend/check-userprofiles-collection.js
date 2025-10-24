const mongoose = require('mongoose');
const config = require('./config');

async function checkUserProfilesCollection() {
  try {
    await mongoose.connect(config.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Check the userprofiles collection
    const db = mongoose.connection.db;
    const userProfiles = await db.collection('userprofiles').find().limit(5).toArray();
    
    console.log(`📋 Found ${userProfiles.length} user profiles:`);
    
    userProfiles.forEach((profile, index) => {
      console.log(`\nProfile ${index + 1}:`);
      console.log(`  ID: ${profile._id}`);
      console.log(`  User ID: ${profile.userId}`);
      console.log(`  Profile Photo: ${profile.profilePhoto || 'No profile photo'}`);
      console.log(`  Created At: ${profile.createdAt}`);
      console.log(`  Full Profile:`, JSON.stringify(profile, null, 2));
    });

    // Also check if there are any users with profilePhoto field
    const User = require('./models/User');
    const usersWithPhotos = await User.find({ profilePhoto: { $ne: null, $ne: '' } }).limit(3);
    
    console.log(`\n👤 Users with profilePhoto field: ${usersWithPhotos.length}`);
    usersWithPhotos.forEach(user => {
      console.log(`  - ${user.firstName} ${user.lastName}: ${user.profilePhoto}`);
    });

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Disconnected from MongoDB');
  }
}

checkUserProfilesCollection();