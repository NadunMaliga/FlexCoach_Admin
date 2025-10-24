const mongoose = require('mongoose');
const config = require('./config');
const User = require('./models/User');
const Photo = require('./models/Photo');

async function findUserWithPhotos() {
  try {
    await mongoose.connect(config.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Find the user who has photos
    const photoUserId = '68e772107be5ed4ada394b58';
    const user = await User.findById(photoUserId);
    
    if (user) {
      console.log('👤 User with photos:');
      console.log(`  Name: ${user.firstName} ${user.lastName}`);
      console.log(`  Email: ${user.email}`);
      console.log(`  ID: ${user._id}`);
      console.log(`  Status: ${user.status}`);
    } else {
      console.log('❌ User not found');
    }

    // Also show all users for reference
    console.log('\n📋 All users:');
    const allUsers = await User.find().select('_id firstName lastName email status');
    allUsers.forEach(user => {
      console.log(`  - ${user.firstName} ${user.lastName} (${user.email}) - ID: ${user._id} - Status: ${user.status}`);
    });

    // Check photos for this user
    const photos = await Photo.find({ userId: photoUserId });
    console.log(`\n📸 Photos for user ${photoUserId}: ${photos.length}`);
    photos.forEach(photo => {
      console.log(`  - Photo ID: ${photo._id}`);
      console.log(`    Date: ${photo.date}`);
      console.log(`    Front: ${photo.photos?.front}`);
      console.log(`    Side: ${photo.photos?.side}`);
      console.log(`    Back: ${photo.photos?.back}`);
    });

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Disconnected from MongoDB');
  }
}

findUserWithPhotos();