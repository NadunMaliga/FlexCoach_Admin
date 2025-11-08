const axios = require('axios');

// Test the exercises API endpoint
async function testExercisesEndpoint() {
  try {
    console.log('🧪 Testing Exercises API Endpoint...');
    
    // First, login to get a token
    console.log('🔐 Logging in to get admin token...');
    const loginResponse = await axios.post('http://localhost:3001/api/admin/login', {
      email: 'admin@gmail.com',
      password: 'Password123'
    });
    
    if (!loginResponse.data.success) {
      throw new Error('Login failed');
    }
    
    const token = loginResponse.data.token;
    console.log('✅ Login successful, token received');
    
    // Test exercises endpoint
    console.log('📋 Testing exercises endpoint...');
    const exercisesResponse = await axios.get('http://localhost:3001/api/admin/exercises', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (exercisesResponse.data.success) {
      console.log('✅ Exercises API working!');
      console.log(`📊 Found ${exercisesResponse.data.exercises.length} exercises`);
      
      exercisesResponse.data.exercises.forEach((exercise, index) => {
        console.log(`   ${index + 1}. ${exercise.name} (${exercise.category || 'N/A'}, ${exercise.difficulty || 'N/A'})`);
      });
    } else {
      console.log('❌ Exercises API failed:', exercisesResponse.data);
    }
    
  } catch (error) {
    console.error('❌ API Test Error:', error.message);
    if (error.response) {
      console.error('Response data:', error.response.data);
    }
  }
}

// Run the test
testExercisesEndpoint();