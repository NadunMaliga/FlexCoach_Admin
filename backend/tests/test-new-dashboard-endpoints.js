const fetch = require('node-fetch');

async function testNewDashboardEndpoints() {
  try {
    console.log('Testing New Dashboard Endpoints...\n');

    const baseUrl = 'http://localhost:3001';
    
    // First, let's test without auth to see if routes exist
    console.log('Testing route existence (should get auth errors, not 404):');
    
    const endpoints = [
      '/api/admin/dashboard/stats',
      '/api/admin/dashboard/client-overview?period=7',
      '/api/admin/dashboard/recent-activity?limit=5'
    ];

    for (const endpoint of endpoints) {
      try {
        console.log(`\nTesting: ${endpoint}`);
        const response = await fetch(`${baseUrl}${endpoint}`);
        const data = await response.json();
        
        if (response.status === 401) {
          console.log('✅ Route exists (401 Unauthorized - needs auth)');
        } else if (response.status === 404) {
          console.log('❌ Route not found (404)');
        } else if (response.status === 200) {
          console.log('✅ Route working (200 OK)');
        } else {
          console.log(`⚠️ Unexpected status: ${response.status}`);
        }
        
        console.log(`Response: ${JSON.stringify(data).substring(0, 100)}...`);
      } catch (error) {
        console.log(`❌ Error: ${error.message}`);
      }
    }

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

// Run the test
testNewDashboardEndpoints();