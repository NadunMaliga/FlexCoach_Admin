const mongoose = require('mongoose');
const config = require('./config');
const Photo = require('./models/Photo');

async function cleanupTestPhotos() {
  try {
    await mongoose.connect(config.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Find photos with empty photos object (test data)
    const testPhotos = await Photo.find({
      $or: [
        { 'photos.front': { $exists: false } },
        { 'photos.front': null },
        { 'photos.front': '' }
      ]
    });

    console.log(`📸 Found ${testPhotos.length} test photos to clean up`);

    for (const photo of testPhotos) {
      console.log(`🗑️ Deleting test photo: ${photo._id} (User: ${photo.userId})`);
      await Photo.findByIdAndDelete(photo._id);
    }

    console.log('✅ Cleanup completed');

    // Show remaining photos
    const remainingPhotos = await Photo.find();
    console.log(`\n📸 Remaining photos: ${remainingPhotos.length}`);
    remainingPhotos.forEach(photo => {
      console.log(`  - ${photo._id} (User: ${photo.userId}) - Has photos: ${!!photo.photos?.front}`);
    });

  } catch (error) {
    console.error('❌ Cleanup failed:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
  }
}

cleanupTestPhotos();