const axios = require('axios');

async function testHardcodedLogin() {
  try {
    console.log('🧪 Testing Hardcoded Admin Login...');
    
    const baseURL = 'http://localhost:3001/api';
    
    // Use the hardcoded credentials from the server
    const credentials = { email: 'admin@gmail.com', password: 'Password123' };
    
    console.log(`\n🔐 Trying hardcoded login with ${credentials.email}...`);
    
    let token = null;
    try {
      const loginResponse = await axios.post(`${baseURL}/admin/login`, credentials);
      
      if (loginResponse.data.success) {
        token = loginResponse.data.token;
        console.log('✅ Login successful!');
        console.log('   Token:', token.substring(0, 20) + '...');
        console.log('   Admin:', loginResponse.data.admin);
      }
    } catch (error) {
      console.log('❌ Login failed:', error.response?.data?.error || error.message);
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
        
        console.log('\n🎯 REAL DATA SUMMARY:');
        console.log(`   📊 You have ${stats.totalUsers} total clients`);
        console.log(`   ✅ ${stats.activeUsers} are active (${stats.activeUsersPercentage})`);
        console.log(`   ⏳ ${stats.pendingUsers} are pending approval`);
        console.log(`   📈 ${stats.newUsersLast30Days} new clients in the last 30 days`);
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
        console.log('   Status Breakdown:', overview.statusBreakdown);
        
        if (overview.dailyData && overview.dailyData.length > 0) {
          console.log('   📅 Daily Activity (last 7 days):');
          overview.dailyData.forEach(day => {
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

testHardcodedLogin();