const axios = require('axios');

async function testCorrectedEndpoints() {
  try {
    console.log('🧪 Testing Corrected Dashboard Endpoints...');
    
    const baseURL = 'http://localhost:5000/api';
    
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
      console.log('✅ Stats Response:', JSON.stringify(statsResponse.data, null, 2));
    } catch (error) {
      console.log('❌ Stats Error:', error.response?.data || error.message);
    }
    
    // Test corrected client overview endpoint
    console.log('\n📈 Testing /admin/dashboard/client-overview...');
    try {
      const overviewResponse = await axios.get(`${baseURL}/admin/dashboard/client-overview?period=7`, { headers });
      console.log('✅ Overview Response:', JSON.stringify(overviewResponse.data, null, 2));
    } catch (error) {
      console.log('❌ Overview Error:', error.response?.data || error.message);
    }
    
    // Test users endpoint
    console.log('\n👥 Testing /admin/users...');
    try {
      const usersResponse = await axios.get(`${baseURL}/admin/users?limit=5&sortBy=createdAt&sortOrder=desc`, { headers });
      console.log('✅ Users Response (first 3 users):', JSON.stringify(usersResponse.data.users?.slice(0, 3), null, 2));
    } catch (error) {
      console.log('❌ Users Error:', error.response?.data || error.message);
    }
    
  } catch (error) {
    console.error('❌ General Error:', error.message);
  }
}

// Wait a bit for server to start, then test
setTimeout(testCorrectedEndpoints, 3000);