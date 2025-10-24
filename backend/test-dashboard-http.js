const axios = require('axios');

async function testDashboardHTTP() {
  try {
    console.log('🧪 Testing Dashboard HTTP Endpoints...');
    
    const baseURL = 'http://localhost:5000/api';
    
    // Test dashboard stats endpoint
    console.log('\n📊 Testing /dashboard/stats...');
    try {
      const statsResponse = await axios.get(`${baseURL}/dashboard/stats`);
      console.log('✅ Stats Response:', JSON.stringify(statsResponse.data, null, 2));
    } catch (error) {
      console.log('❌ Stats Error:', error.response?.data || error.message);
    }
    
    // Test client overview endpoint
    console.log('\n📈 Testing /dashboard/client-overview...');
    try {
      const overviewResponse = await axios.get(`${baseURL}/dashboard/client-overview?period=7`);
      console.log('✅ Overview Response:', JSON.stringify(overviewResponse.data, null, 2));
    } catch (error) {
      console.log('❌ Overview Error:', error.response?.data || error.message);
    }
    
    // Test users endpoint
    console.log('\n👥 Testing /users...');
    try {
      const usersResponse = await axios.get(`${baseURL}/users?limit=5&sortBy=createdAt&sortOrder=desc`);
      console.log('✅ Users Response:', JSON.stringify(usersResponse.data, null, 2));
    } catch (error) {
      console.log('❌ Users Error:', error.response?.data || error.message);
    }
    
  } catch (error) {
    console.error('❌ General Error:', error.message);
  }
}

testDashboardHTTP();