const axios = require('axios');

async function testValidation() {
    try {
        console.log('Testing diet plan creation validation...');
        
        const dietPlanData = {
            name: "Test Plan",
            description: "Test description",
            userId: "68e8fd08e8d1859ebd9edd05", // Valid ObjectId string
            meals: [
                {
                    name: "Breakfast",
                    time: "Breakfast",
                    foods: [
                        {
                            foodName: "Oats",
                            quantity: 100,
                            unit: "grams"
                        }
                    ],
                    instructions: "Test meal",
                    totalCalories: 300
                }
            ],
            totalDailyCalories: 300,
            dietType: "Weight Loss",
            isActive: true
        };

        console.log('Sending data:', JSON.stringify(dietPlanData, null, 2));
        
        const response = await axios.post('http://10.231.45.234:3001/api/diet-plans', dietPlanData, {
            headers: {
                'Content-Type': 'application/json'
            }
        });

        console.log('Success:', response.data);

    } catch (error) {
        console.error('Validation test failed:');
        console.error('Status:', error.response?.status);
        console.error('Data:', JSON.stringify(error.response?.data, null, 2));
    }
}

testValidation();