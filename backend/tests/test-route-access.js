const axios = require('axios');

const BASE_URL = 'http://localhost:3001/api';
const testUserId = "68e8fd08e8d1859ebd9edd05";

async function testRouteAccess() {
  console.log('🧪 Testing Route Access...\n');

  try {
    // 1. Test if we can GET diet plans (this should work)
    console.log('1. Testing GET /diet-plans/user/:userId');
    const getResponse = await axios.get(`${BASE_URL}/diet-plans/user/${testUserId}`);
    console.log(`✅ GET successful: ${getResponse.data.success}`);
    console.log(`   Found ${getResponse.data.dietPlans.length} plans`);

    if (getResponse.data.dietPlans.length > 0) {
      const firstPlan = getResponse.data.dietPlans[0];
      console.log(`   First plan ID: ${firstPlan._id}`);
      console.log(`   First plan name: ${firstPlan.name}`);

      // 2. Test if we can GET a specific diet plan
      console.log('\n2. Testing GET /diet-plans/:id');
      try {
        const getByIdResponse = await axios.get(`${BASE_URL}/diet-plans/${firstPlan._id}`);
        console.log(`✅ GET by ID successful: ${getByIdResponse.data.success}`);
      } catch (getByIdError) {
        console.log(`❌ GET by ID failed: ${getByIdError.response?.status} - ${getByIdError.response?.data?.error}`);
      }

      // 3. Test PUT with minimal data
      console.log('\n3. Testing PUT /diet-plans/:id with minimal data');
      const minimalData = {
        name: firstPlan.name,
        description: "Test update"
      };

      try {
        const putResponse = await axios.put(`${BASE_URL}/diet-plans/${firstPlan._id}`, minimalData);
        console.log(`✅ PUT successful: ${putResponse.data.success}`);
      } catch (putError) {
        console.log(`❌ PUT failed: ${putError.response?.status}`);
        console.log(`   Error: ${JSON.stringify(putError.response?.data, null, 2)}`);
      }
    }

    // 4. Test server health
    console.log('\n4. Testing server health');
    try {
      const healthResponse = await axios.get(`${BASE_URL.replace('/api', '')}/health`);
      console.log(`✅ Server health: ${healthResponse.status}`);
    } catch (healthError) {
      console.log(`❌ Health check failed: ${healthError.response?.status || healthError.message}`);
    }

  } catch (error) {
    console.error('❌ General error:', error.message);
  }
}

testRouteAccess();