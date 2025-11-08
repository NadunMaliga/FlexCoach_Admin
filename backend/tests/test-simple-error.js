/**
 * Simple test to verify error handling is working
 */

const axios = require('axios');

const BASE_URL = 'http://localhost:3001';

async function testSimpleError() {
  try {
    console.log('Testing 404 error...');
    const response = await axios.get(`${BASE_URL}/nonexistent`, {
      validateStatus: () => true
    });
    
    console.log('Status:', response.status);
    console.log('Response:', JSON.stringify(response.data, null, 2));
    
    if (response.status === 404 && response.data.code === 'RESOURCE_NOT_FOUND') {
      console.log('✅ 404 error handling works correctly');
    } else {
      console.log('❌ 404 error handling failed');
    }
    
  } catch (error) {
    console.error('Test failed:', error.message);
  }
}

testSimpleError();