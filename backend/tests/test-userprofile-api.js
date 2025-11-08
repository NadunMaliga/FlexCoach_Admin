const fetch = require('node-fetch');

async function testUserProfileAPI() {
  try {
    const BASE_URL = 'http://localhost:3001';
    
    // Test with a user ID that we know has a profile photo
    const testUserId = '68ce2241ea3c9e25138fbe6b'; // HjsH Jana (aaa@gmail.com)
    
    console.log('🧪 Testing User Profile API...');
    console.log(`📋 Using test user ID: ${testUserId}`);
    
    // Test GET user profile
    console.log('\n1. Testing GET /api/user-profiles/user/:userId');
    const response = await fetch(`${BASE_URL}/api/user-profiles/user/${testUserId}`);
    const data = await response.json();
    
    console.log(`Status: ${response.status}`);
    console.log('Response:', JSON.stringify(data, null, 2));
    
    if (response.ok && data.success) {
      console.log('✅ GET user profile endpoint working correctly');
      console.log(`📸 Profile photo: ${data.userProfile.profilePhoto}`);
    } else {
      console.log('❌ GET user profile endpoint failed');
    }
    
    // Test GET user profile photo only
    console.log('\n2. Testing GET /api/user-profiles/user/:userId/photo');
    const photoResponse = await fetch(`${BASE_URL}/api/user-profiles/user/${testUserId}/photo`);
    const photoData = await photoResponse.json();
    
    console.log(`Status: ${photoResponse.status}`);
    console.log('Response:', JSON.stringify(photoData, null, 2));
    
    if (photoResponse.ok && photoData.success) {
      console.log('✅ GET user profile photo endpoint working correctly');
    } else {
      console.log('❌ GET user profile photo endpoint failed');
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

testUserProfileAPI();