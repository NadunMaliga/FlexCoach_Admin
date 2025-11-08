const axios = require('axios');

async function testPort3001() {
  try {
    console.log('🧪 Testing Dashboard Endpoints on Port 3001...');
    
    const baseURL = 'http://localhost:3001/api';
    
    // Test server health first
    console.log('\n❤️  Testing server health...');
    try {
      const healthResponse = await axios.get('http://localhost:3001/health');
      console.log('✅ Server Health:', healthResponse.data);
    } catch (error) {
      console.log('❌ Server Health Error:', error.message);
      console.log('⚠️  Server might not be running on port 3001');
      return;
    }
    
    // First, let's try to login as admin to get a token
    console.log('\n🔐 Attempting admin login...');
    
    let token = null;
    try {
      const loginResponse = await axios.post(`${baseURL}/admin/login`, {
        email: 'admin@flexcoach.com',
        password: 'admin123'
      });
      
      if (loginResponse.data.success) {
        token = loginResponse.data.token;
        console.log('✅ Admin login successful');
      }
    } catch (error) {
      console.log('❌ Admin login failed:', error.response?.data || error.message);
      console.log('⚠️  Proceeding without authentication...');
    }
    
    const headers = token ? { Authorization: `Bearer ${token}` } : {};
    
    // Test corrected dashboard stats endpoint
    console.log('\n📊 Testing /admin/dashboard/stats...');
    try {
      const statsResponse = await axios.get(`${baseURL}/admin/dashboard/stats`, { headers });
      console.log('✅ Stats Response:');
      console.log('  Total Users:', statsResponse.data.stats?.totalUsers);
      console.log('  Active Users:', statsResponse.data.stats?.activeUsers);
      console.log('  Pending Users:', statsResponse.data.stats?.pendingUsers);
      console.log('  Active %:', statsResponse.data.stats?.activeUsersPercentage);
      console.log('  New Users (30d):', statsResponse.data.stats?.newUsersLast30Days);
    } catch (error) {
      console.log('❌ Stats Error:', error.response?.data || error.message);
    }
    
    // Test corrected client overview endpoint
    console.log('\n📈 Testing /admin/dashboard/client-overview...');
    try {
      const overviewResponse = await axios.get(`${baseURL}/admin/dashboard/client-overview?period=7`, { headers });
      console.log('✅ Overview Response:');
      console.log('  Total Users:', overviewResponse.data.overview?.totalUsers);
      console.log('  Daily Data Points:', overviewResponse.data.overview?.dailyData?.length);
      console.log('  Status Breakdown:', overviewResponse.data.overview?.statusBreakdown);
    } catch (error) {
      console.log('❌ Overview Error:', error.response?.data || error.message);
    }
    
  } catch (error) {
    console.error('❌ General Error:', error.message);
  }
}

testPort3001();