const mongoose = require('mongoose');
const config = require('./config');
const Photo = require('./models/Photo');

async function testUpdatedPhotosAPI() {
  try {
    await mongoose.connect(config.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Check the existing photos collection structure
    console.log('\n📋 Checking existing photos in database...');
    const existingPhotos = await Photo.find().limit(3);
    
    console.log(`Found ${existingPhotos.length} existing photos:`);
    existingPhotos.forEach((photo, index) => {
      console.log(`\nPhoto ${index + 1}:`);
      console.log(`  ID: ${photo._id}`);
      console.log(`  User ID: ${photo.userId}`);
      console.log(`  Date: ${photo.date}`);
      console.log(`  Photos object:`, photo.photos);
      console.log(`  Notes: ${photo.notes || 'No notes'}`);
      console.log(`  Is Active: ${photo.isActive}`);
    });

    // Test the API endpoint
    const fetch = require('node-fetch');
    const BASE_URL = 'http://localhost:3001';
    
    if (existingPhotos.length > 0) {
      const testUserId = existingPhotos[0].userId;
      console.log(`\n🧪 Testing API with user ID: ${testUserId}`);
      
      const response = await fetch(`${BASE_URL}/api/photos/user/${testUserId}`);
      const data = await response.json();
      
      console.log(`\nAPI Response Status: ${response.status}`);
      console.log('API Response Data:', JSON.stringify(data, null, 2));
    }

  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Disconnected from MongoDB');
  }
}

testUpdatedPhotosAPI();