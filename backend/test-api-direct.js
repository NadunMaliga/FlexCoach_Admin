const fetch = require('node-fetch');

async function testAPIDirect() {
    try {
        console.log('🧪 Testing API Endpoint Directly...\n');

        const testUserId = "68e8fd08e8d1859ebd9edd05";
        
        // Test the exact API endpoint the frontend uses
        const apiUrl = `http://localhost:3001/api/diet-plans/user/${testUserId}`;
        
        console.log(`Making request to: ${apiUrl}`);
        
        const response = await fetch(apiUrl, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            },
        });

        console.log(`Response status: ${response.status}`);
        
        if (response.ok) {
            const data = await response.json();
            console.log('\n✅ API Response:');
            console.log(`Success: ${data.success}`);
            console.log(`Diet plans count: ${data.dietPlans ? data.dietPlans.length : 0}`);
            
            if (data.dietPlans && data.dietPlans.length > 0) {
                console.log('\nDiet plans found:');
                data.dietPlans.forEach((plan, index) => {
                    console.log(`   ${index + 1}. ${plan.name}`);
                    console.log(`      Description: ${plan.description}`);
                    console.log(`      Diet Type: ${plan.dietType}`);
                    console.log(`      Meals: ${plan.meals ? plan.meals.length : 0}`);
                    console.log(`      Active: ${plan.isActive}`);
                    console.log(`      Created: ${plan.createdAt}`);
                });
            } else {
                console.log('⚠️ No diet plans in API response');
            }
        } else {
            const errorText = await response.text();
            console.error(`❌ API Error: ${response.status}`);
            console.error('Error response:', errorText);
        }

        // Also test the general endpoint
        console.log('\n🔍 Testing general endpoint...');
        const generalUrl = `http://localhost:3001/api/diet-plans?userId=${testUserId}`;
        console.log(`Making request to: ${generalUrl}`);
        
        const generalResponse = await fetch(generalUrl, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            },
        });

        console.log(`General endpoint status: ${generalResponse.status}`);
        
        if (generalResponse.ok) {
            const generalData = await generalResponse.json();
            console.log(`General endpoint diet plans: ${generalData.dietPlans ? generalData.dietPlans.length : 0}`);
        }

    } catch (error) {
        console.error('❌ Test failed:', error.message);
    }
}

testAPIDirect();