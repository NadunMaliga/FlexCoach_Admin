const fetch = require('node-fetch');
const mongoose = require('mongoose');
const config = require('./config');
const User = require('./models/User');

async function testPhotosWithUserId() {
  try {
    // Connect to MongoDB to get a real user ID
    await mongoose.connect(config.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Get all users to see available IDs
    const users = await User.find().limit(5).select('_id firstName lastName');
    console.log('📋 Available users:');
    users.forEach(user => {
      console.log(`  - ${user.firstName} ${user.lastName}: ${user._id}`);
    });

    if (users.length === 0) {
      console.log('❌ No users found in database');
      return;
    }

    const testUserId = users[0]._id.toString();
    console.log(`\n🧪 Testing with user ID: ${testUserId}`);

    const BASE_URL = 'http://localhost:3001';
    
    // Test the photos API
    console.log('\n1. Testing GET /api/photos/user/:userId');
    const response = await fetch(`${BASE_URL}/api/photos/user/${testUserId}`);
    const data = await response.json();
    
    console.log(`Status: ${response.status}`);
    console.log('Response:', JSON.stringify(data, null, 2));
    
    if (response.ok && data.success) {
      console.log(`✅ Found ${data.photos.length} photos for user`);
      
      if (data.photos.length > 0) {
        console.log('\n📸 Photo details:');
        data.photos.forEach((photo, index) => {
          console.log(`  Photo ${index + 1}:`);
          console.log(`    ID: ${photo._id}`);
          console.log(`    Date: ${photo.date}`);
          console.log(`    Front: ${photo.front}`);
          console.log(`    Side: ${photo.side}`);
          console.log(`    Back: ${photo.back}`);
          console.log(`    Notes: ${photo.notes || 'No notes'}`);
        });
      } else {
        console.log('📸 No photos found - this might be why the app shows empty boxes');
      }
    } else {
      console.log('❌ API call failed');
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
  }
}

testPhotosWithUserId();