const fetch = require('node-fetch');

async function testPhotosEndpoint() {
  try {
    const BASE_URL = 'http://localhost:3001';
    
    // Test user ID from previous test
    const testUserId = '68c99bf8063019acfaf38f40';
    
    console.log('🧪 Testing Photos API Endpoint...');
    console.log(`📋 Using test user ID: ${testUserId}`);
    
    // Test GET photos for user
    console.log('\n1. Testing GET /api/photos/user/:userId');
    const response = await fetch(`${BASE_URL}/api/photos/user/${testUserId}`);
    const data = await response.json();
    
    console.log(`Status: ${response.status}`);
    console.log('Response:', JSON.stringify(data, null, 2));
    
    if (response.ok && data.success) {
      console.log('✅ GET photos endpoint working correctly');
      console.log(`📸 Found ${data.photos.length} photos`);
    } else {
      console.log('❌ GET photos endpoint failed');
    }
    
    // Test POST new photos
    console.log('\n2. Testing POST /api/photos/user/:userId');
    const newPhotoData = {
      front: "https://placekitten.com/310/410",
      side: "https://placekitten.com/311/410", 
      back: "https://placekitten.com/312/410",
      notes: "Test photo from API endpoint",
      date: new Date().toISOString()
    };
    
    const postResponse = await fetch(`${BASE_URL}/api/photos/user/${testUserId}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(newPhotoData)
    });
    
    const postData = await postResponse.json();
    console.log(`Status: ${postResponse.status}`);
    console.log('Response:', JSON.stringify(postData, null, 2));
    
    if (postResponse.ok && postData.success) {
      console.log('✅ POST photos endpoint working correctly');
    } else {
      console.log('❌ POST photos endpoint failed');
    }
    
    // Test GET latest photos
    console.log('\n3. Testing GET /api/photos/user/:userId/latest');
    const latestResponse = await fetch(`${BASE_URL}/api/photos/user/${testUserId}/latest`);
    const latestData = await latestResponse.json();
    
    console.log(`Status: ${latestResponse.status}`);
    console.log('Response:', JSON.stringify(latestData, null, 2));
    
    if (latestResponse.ok && latestData.success) {
      console.log('✅ GET latest photos endpoint working correctly');
    } else {
      console.log('❌ GET latest photos endpoint failed');
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

testPhotosEndpoint();