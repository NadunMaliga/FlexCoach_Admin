const axios = require('axios');

async function testAPICall() {
    try {
        console.log('Testing API call to create diet plan...');
        
        const dietPlanData = {
            name: "Weight Loss Plan",
            description: "Weight Loss Plan with customized meals",
            userId: "68e8fd08e8d1859ebd9edd05",
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
                    instructions: "Breakfast meal plan",
                    totalCalories: 300
                }
            ],
            totalDailyCalories: 300,
            dietType: "Weight Loss",
            isActive: true
        };

        console.log('Making request to: http://10.231.45.234:3001/api/diet-plans');
        
        const response = await axios.post('http://10.231.45.234:3001/api/diet-plans', dietPlanData, {
            headers: {
                'Content-Type': 'application/json'
            }
        });

        console.log('Success:', response.data);

    } catch (error) {
        console.error('API call failed:');
        console.error('Status:', error.response?.status);
        console.error('Data:', error.response?.data);
        console.error('Message:', error.message);
    }
}

testAPICall();