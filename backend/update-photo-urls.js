const mongoose = require('mongoose');
const config = require('./config');
const Photo = require('./models/Photo');

async function updatePhotoUrls() {
  try {
    await mongoose.connect(config.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Find all photos with placekitten URLs
    const photos = await Photo.find({
      $or: [
        { front: { $regex: 'placekitten' } },
        { side: { $regex: 'placekitten' } },
        { back: { $regex: 'placekitten' } }
      ]
    });

    console.log(`📸 Found ${photos.length} photos with placekitten URLs`);

    // Update each photo with working image URLs
    for (const photo of photos) {
      const updatedPhoto = {
        front: `https://picsum.photos/300/400?random=${Math.floor(Math.random() * 1000)}`,
        side: `https://picsum.photos/300/400?random=${Math.floor(Math.random() * 1000)}`,
        back: `https://picsum.photos/300/400?random=${Math.floor(Math.random() * 1000)}`
      };

      await Photo.findByIdAndUpdate(photo._id, updatedPhoto);
      console.log(`✅ Updated photo ${photo._id}`);
      console.log(`  Front: ${updatedPhoto.front}`);
      console.log(`  Side: ${updatedPhoto.side}`);
      console.log(`  Back: ${updatedPhoto.back}`);
    }

    console.log('✅ All photos updated successfully');

  } catch (error) {
    console.error('❌ Update failed:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
  }
}

updatePhotoUrls();