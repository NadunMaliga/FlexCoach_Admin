const fetch = require('node-fetch');

async function testClientsWithProfiles() {
  try {
    const BASE_URL = 'http://localhost:3001';
    
    console.log('🧪 Testing Clients with Profile Photos...');
    
    // First get users list
    console.log('\n1. Getting users list...');
    const usersResponse = await fetch(`${BASE_URL}/api/admin/users?limit=5`, {
      headers: {
        'Authorization': 'Bearer test-token',
        'Content-Type': 'application/json'
      }
    });
    
    if (!usersResponse.ok) {
      console.log('❌ Users API failed, testing without auth...');
      return;
    }
    
    const usersData = await usersResponse.json();
    console.log(`📋 Found ${usersData.users?.length || 0} users`);
    
    if (usersData.users && usersData.users.length > 0) {
      // Test profile fetching for each user
      for (const user of usersData.users.slice(0, 3)) {
        console.log(`\n👤 Testing profile for: ${user.firstName} ${user.lastName} (${user._id})`);
        
        const profileResponse = await fetch(`${BASE_URL}/api/user-profiles/user/${user._id}`);
        
        if (profileResponse.ok) {
          const profileData = await profileResponse.json();
          const profilePhoto = profileData.userProfile?.profilePhoto;
          
          console.log(`  Profile Photo: ${profilePhoto || 'None'}`);
          console.log(`  Status: ${profilePhoto ? '✅ Has photo' : '❌ No photo'}`);
        } else {
          console.log(`  ❌ Profile not found (${profileResponse.status})`);
        }
      }
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testClientsWithProfiles();