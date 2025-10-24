const mongoose = require('mongoose');
const config = require('./config');
const Photo = require('./models/Photo');
const User = require('./models/User');

async function testPhotosAPI() {
  try {
    // Connect to MongoDB
    await mongoose.connect(config.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Find a test user
    const testUser = await User.findOne().limit(1);
    if (!testUser) {
      console.log('❌ No users found in database');
      return;
    }

    console.log(`📋 Testing with user: ${testUser.firstName} ${testUser.lastName} (${testUser._id})`);

    // Check existing photos for this user
    const existingPhotos = await Photo.find({ userId: testUser._id });
    console.log(`📸 Existing photos for user: ${existingPhotos.length}`);

    if (existingPhotos.length === 0) {
      // Create sample photos for testing
      const samplePhoto = new Photo({
        userId: testUser._id,
        date: new Date(),
        front: "https://placekitten.com/300/400",
        side: "https://placekitten.com/301/400",
        back: "https://placekitten.com/302/400",
        notes: "Sample photo for testing"
      });

      await samplePhoto.save();
      console.log('✅ Created sample photo for testing');
    }

    // Test fetching photos
    const userPhotos = await Photo.find({ userId: testUser._id }).sort({ date: -1 });
    console.log(`📸 Found ${userPhotos.length} photos for user`);

    userPhotos.forEach((photo, index) => {
      console.log(`  Photo ${index + 1}:`);
      console.log(`    Date: ${photo.date.toLocaleDateString()}`);
      console.log(`    Front: ${photo.front}`);
      console.log(`    Side: ${photo.side}`);
      console.log(`    Back: ${photo.back}`);
      console.log(`    Notes: ${photo.notes || 'No notes'}`);
    });

    console.log('✅ Photos API test completed successfully');

  } catch (error) {
    console.error('❌ Photos API test failed:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
  }
}

testPhotosAPI();