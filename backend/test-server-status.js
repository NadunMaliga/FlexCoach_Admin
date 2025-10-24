const axios = require('axios');

async function testServerStatus() {
    try {
        console.log('Testing server status and routes...');
        
        // Test if server is running
        console.log('1. Testing server health...');
        try {
            const healthResponse = await axios.get('http://10.231.45.234:3001/api/health');
            console.log('   Server is running:', healthResponse.status === 200);
        } catch (error) {
            console.log('   Health check failed, trying basic connection...');
            try {
                const basicResponse = await axios.get('http://10.231.45.234:3001/');
                console.log('   Server responding:', basicResponse.status);
            } catch (basicError) {
                console.log('   Server not responding:', basicError.message);
            }
        }
        
        // Test admin route (should require auth)
        console.log('2. Testing admin route...');
        try {
            const adminResponse = await axios.get('http://10.231.45.234:3001/api/admin/diet-plans');
            console.log('   Admin route response:', adminResponse.status);
        } catch (error) {
            console.log('   Admin route error (expected):', error.response?.status, error.response?.data?.error);
        }
        
        // Test non-admin route (should work)
        console.log('3. Testing non-admin route...');
        try {
            const nonAdminResponse = await axios.get('http://10.231.45.234:3001/api/diet-plans');
            console.log('   Non-admin route response:', nonAdminResponse.status, nonAdminResponse.data);
        } catch (error) {
            console.log('   Non-admin route error:', error.response?.status, error.response?.data);
        }
        
        // Test specific user route
        console.log('4. Testing user-specific route...');
        try {
            const userResponse = await axios.get('http://10.231.45.234:3001/api/diet-plans/user/68e8fd08e8d1859ebd9edd05');
            console.log('   User route response:', userResponse.status);
            console.log('   Diet plans found:', userResponse.data.dietPlans?.length || 0);
        } catch (error) {
            console.log('   User route error:', error.response?.status, error.response?.data);
        }
        
    } catch (error) {
        console.error('Test failed:', error.message);
    }
}

testServerStatus();