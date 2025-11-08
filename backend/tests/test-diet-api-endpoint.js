const fetch = require('node-fetch');

async function testDietAPIEndpoint() {
    try {
        console.log('🧪 Testing Diet Plan API Endpoint...\n');

        const testUserId = "68e8fd08e8d1859ebd9edd05";
        const apiUrl = `http://localhost:3001/api/diet-plans?userId=${testUserId}`;
        
        console.log(`Making request to: ${apiUrl}`);
        
        const response = await fetch(apiUrl, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            },
        });

        console.log(`Response status: ${response.status}`);
        console.log(`Response headers:`, response.headers.raw());

        if (response.ok) {
            const data = await response.json();
            console.log('\n✅ API Response:');
            console.log(JSON.stringify(data, null, 2));
            
            if (data.success && data.dietPlans) {
                console.log(`\n📊 Found ${data.dietPlans.length} diet plans`);
                
                // Test data transformation like frontend does
                const transformedMeals = data.dietPlans.map((dietPlan, index) => {
                    const mealDetails = {};
                    
                    dietPlan.meals.forEach(meal => {
                        const foodList = meal.foods.map(food => 
                            `${food.foodName} ${food.quantity}${food.unit}`
                        ).join('\n');
                        
                        mealDetails[meal.time] = foodList;
                    });

                    return {
                        name: dietPlan.name || `Meal ${index + 1}`,
                        details: mealDetails
                    };
                });

                console.log('\n🎯 Transformed for UI:');
                transformedMeals.forEach((meal, index) => {
                    console.log(`\n${index + 1}. ${meal.name}`);
                    Object.entries(meal.details).forEach(([time, foods]) => {
                        console.log(`   ${time}:`);
                        foods.split('\n').forEach(food => {
                            console.log(`     - ${food}`);
                        });
                    });
                });
                
                console.log('\n✅ API endpoint working correctly!');
            } else {
                console.log('⚠️ No diet plans found in response');
            }
        } else {
            const errorText = await response.text();
            console.error(`❌ API Error: ${response.status}`);
            console.error('Error response:', errorText);
        }

    } catch (error) {
        console.error('❌ Test failed:', error.message);
    }
}

testDietAPIEndpoint();