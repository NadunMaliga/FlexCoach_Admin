const axios = require('axios');

async function testMeasurementAPI() {
  try {
    console.log('Testing measurement API...');
    
    // First get admin token
    const loginResponse = await axios.post('http://localhost:3001/api/admin/login', {
      email: 'admin@gmail.com',
      password: 'Password123'
    });
    
    const token = loginResponse.data.token;
    const headers = { Authorization: `Bearer ${token}` };
    
    // Test with a known user ID that has data
    const userId = '68ce2241ea3c9e25138fbe6b'; // User with measurement data
    
    console.log(`\n=== Testing with userId: ${userId} ===`);
    
    const response = await axios.get(`http://localhost:3001/api/admin/body-measurements/user/${userId}`, { headers });
    
    console.log('✅ API Status:', response.status);
    console.log('✅ Success:', response.data.success);
    console.log('✅ Total measurements:', response.data.count);
    console.log('✅ User profile:', response.data.userProfile);
    
    if (response.data.measurements && response.data.measurements.length > 0) {
      console.log('\n📊 Sample measurements:');
      response.data.measurements.slice(0, 3).forEach((measurement, i) => {
        console.log(`  ${i + 1}. ${measurement.measurementType}: ${measurement.value} ${measurement.unit} (${measurement.date})`);
      });
      
      console.log('\n📈 Available measurement types:');
      const types = [...new Set(response.data.measurements.map(m => m.measurementType))];
      types.forEach(type => console.log(`  - ${type}`));
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
  }
}

testMeasurementAPI();