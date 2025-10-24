const fetch = require('node-fetch');

async function testDashboardRecentActivity() {
  try {
    const BASE_URL = 'http://localhost:3001';
    
    console.log('🧪 Testing Dashboard Recent Activity API...');
    
    // Test the recent activity endpoint
    console.log('\n1. Testing GET /api/admin/dashboard/recent-activity');
    const response = await fetch(`${BASE_URL}/api/admin/dashboard/recent-activity?limit=5`);
    const data = await response.json();
    
    console.log(`Status: ${response.status}`);
    
    if (response.ok && data.success) {
      console.log('✅ Recent activity endpoint working correctly');
      console.log(`📋 Found ${data.activity.recentUsers.length} recent users`);
      
      data.activity.recentUsers.forEach((user, index) => {
        console.log(`\n👤 User ${index + 1}:`);
        console.log(`  Name: ${user.name}`);
        console.log(`  Days ago: ${user.daysAgo}`);
        console.log(`  Status: ${user.isActive ? 'Active' : 'Inactive'}`);
        console.log(`  Profile Photo: ${user.profilePhoto || 'None'}`);
        console.log(`  Has Photo: ${user.profilePhoto ? '✅' : '❌'}`);
      });
    } else {
      console.log('❌ Recent activity endpoint failed');
      console.log('Response:', JSON.stringify(data, null, 2));
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

testDashboardRecentActivity();