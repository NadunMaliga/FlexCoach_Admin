const fetch = require('node-fetch');

async function debugAPIRoute() {
    try {
        console.log('🔍 Debugging API Route Issue...\n');

        const testUserId = "68e8fd08e8d1859ebd9edd05";
        
        // Test different variations of the API call
        const testCases = [
            {
                name: "User route with default isActive",
                url: `http://localhost:3001/api/diet-plans/user/${testUserId}`
            },
            {
                name: "User route with isActive=true",
                url: `http://localhost:3001/api/diet-plans/user/${testUserId}?isActive=true`
            },
            {
                name: "User route with isActive=false",
                url: `http://localhost:3001/api/diet-plans/user/${testUserId}?isActive=false`
            },
            {
                name: "General route with userId query",
                url: `http://localhost:3001/api/diet-plans?userId=${testUserId}`
            },
            {
                name: "General route with userId and isActive",
                url: `http://localhost:3001/api/diet-plans?userId=${testUserId}&isActive=true`
            }
        ];

        for (const testCase of testCases) {
            console.log(`\n📋 Testing: ${testCase.name}`);
            console.log(`URL: ${testCase.url}`);
            
            try {
                const response = await fetch(testCase.url, {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                });

                console.log(`Status: ${response.status}`);
                
                if (response.ok) {
                    const data = await response.json();
                    console.log(`Success: ${data.success}`);
                    console.log(`Diet plans count: ${data.dietPlans ? data.dietPlans.length : 0}`);
                    
                    if (data.dietPlans && data.dietPlans.length > 0) {
                        console.log('First diet plan:');
                        const firstPlan = data.dietPlans[0];
                        console.log(`  Name: ${firstPlan.name}`);
                        console.log(`  UserId: ${firstPlan.userId}`);
                        console.log(`  IsActive: ${firstPlan.isActive}`);
                    }
                } else {
                    const errorText = await response.text();
                    console.log(`Error: ${errorText}`);
                }
            } catch (fetchError) {
                console.log(`Fetch error: ${fetchError.message}`);
            }
        }

        // Check if server is running and accessible
        console.log('\n🔍 Testing server health...');
        try {
            const healthResponse = await fetch('http://localhost:3001/api/health', {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                },
            });
            console.log(`Health check status: ${healthResponse.status}`);
        } catch (healthError) {
            console.log(`Health check failed: ${healthError.message}`);
        }

    } catch (error) {
        console.error('❌ Debug failed:', error.message);
    }
}

debugAPIRoute();