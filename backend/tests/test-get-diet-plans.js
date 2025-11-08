const axios = require('axios');

async function testGetDietPlans() {
    try {
        console.log('Testing API call to get user diet plans...');
        
        const testUserId = '68e8fd08e8d1859ebd9edd05';
        const url = `http://10.231.45.234:3001/api/diet-plans/user/${testUserId}`;
        
        console.log('Making request to:', url);
        
        const response = await axios.get(url, {
            headers: {
                'Content-Type': 'application/json'
            }
        });

        console.log('Success:', response.data);
        console.log('Number of diet plans:', response.data.dietPlans?.length || 0);

    } catch (error) {
        console.error('API call failed:');
        console.error('Status:', error.response?.status);
        console.error('Data:', error.response?.data);
        console.error('Message:', error.message);
    }
}

testGetDietPlans();