const axios = require('axios');

async function testAdminLogin() {
  try {
    console.log('🧪 Testing Admin Login and Dashboard...');
    
    const baseURL = 'http://localhost:3001/api';
    
    // Test different admin credentials
    const credentials = [
      { email: 'admin@flexcoach.com', password: 'admin123' },
      { email: 'admin@flexcoach.com', password: 'password' },
      { email: 'admin@admin.com', password: 'admin123' }
    ];
    
    let token = null;
    
    for (const cred of credentials) {
      console.log(`\n🔐 Trying login with ${cred.email}...`);
      try {
        const loginResponse = await axios.post(`${baseURL}/admin/login`, cred);
        
        if (loginResponse.data.success) {
          token = loginResponse.data.token;
          console.log('✅ Login successful!');
          console.log('   Token:', token.substring(0, 20) + '...');
          break;
        }
      } catch (error) {
        console.log('❌ Login failed:', error.response?.data?.error || error.message);
      }
    }
    
    if (!token) {
      console.log('\n❌ Could not authenticate with any credentials');
      return;
    }
    
    const headers = { Authorization: `Bearer ${token}` };
    
    // Test dashboard stats endpoint
    console.log('\n📊 Testing dashboard stats with authentication...');
    try {
      const statsResponse = await axios.get(`${baseURL}/admin/dashboard/stats`, { headers });
      
      if (statsResponse.data.success) {
        const stats = statsResponse.data.stats;
        console.log('✅ Dashboard Stats Retrieved:');
        console.log('   Total Users:', stats.totalUsers);
        console.log('   Active Users:', stats.activeUsers);
        console.log('   Pending Users:', stats.pendingUsers);
        console.log('   Active %:', stats.activeUsersPercentage);
        console.log('   New Users (30d):', stats.newUsersLast30Days);
        console.log('   Total Diet Plans:', stats.totalDietPlans);
        console.log('   Total Workouts:', stats.totalWorkouts);
      }
    } catch (error) {
      console.log('❌ Dashboard Stats Error:', error.response?.data || error.message);
    }
    
    // Test client overview endpoint
    console.log('\n📈 Testing client overview...');
    try {
      const overviewResponse = await axios.get(`${baseURL}/admin/dashboard/client-overview?period=7`, { headers });
      
      if (overviewResponse.data.success) {
        const overview = overviewResponse.data.overview;
        console.log('✅ Client Overview Retrieved:');
        console.log('   Period:', overview.period);
        console.log('   Total Users:', overview.totalUsers);
        console.log('   Daily Data Points:', overview.dailyData?.length);
        console.log('   Status Breakdown:', overview.statusBreakdown);
        
        if (overview.dailyData && overview.dailyData.length > 0) {
          console.log('   Sample Daily Data:');
          overview.dailyData.slice(0, 3).forEach(day => {
            console.log(`     ${day.day}: ${day.newUsers} new, ${day.activeUsers} active`);
          });
        }
      }
    } catch (error) {
      console.log('❌ Client Overview Error:', error.response?.data || error.message);
    }
    
  } catch (error) {
    console.error('❌ General Error:', error.message);
  }
}

testAdminLogin();