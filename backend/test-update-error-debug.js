const axios = require('axios');

const BASE_URL = 'http://localhost:3001/api';
const testUserId = "68e8fd08e8d1859ebd9edd05";
const existingPlanId = "68e94697f645c13ca10e81eb"; // From the error log

async function debugUpdateError() {
  console.log('🧪 Debugging Update Error...\n');

  try {
    // Recreate the exact data structure from the error log
    const dietPlanData = {
      "description": "Meal 1 with customized meals",
      "dietType": "Muscle Building", 
      "isActive": true,
      "meals": [
        {
          "foods": [
            {
              "foodName": "Test Food",
              "quantity": 1,
              "unit": "piece"
            }
          ],
          "instructions": "Breakfast meal plan",
          "name": "Breakfast", 
          "time": "Breakfast",
          "totalCalories": 2
        }
      ],
      "name": "Meal 1",
      "totalDailyCalories": 2,
      "userId": "68e8fd08e8d1859ebd9edd05"
    };

    console.log('1. Attempting to update with exact data structure from error:');
    console.log(JSON.stringify(dietPlanData, null, 2));

    console.log('\n2. Sending PUT request...');
    
    try {
      const updateResponse = await axios.put(`${BASE_URL}/diet-plans/${existingPlanId}`, dietPlanData);
      console.log('✅ Update successful!');
      console.log(`Response: ${JSON.stringify(updateResponse.data, null, 2)}`);
    } catch (updateError) {
      console.error('❌ Update failed with error:');
      console.error('Status:', updateError.response?.status);
      console.error('Error data:', updateError.response?.data);
      
      // Let's try to get more details about the validation error
      if (updateError.response?.status === 500) {
        console.log('\n3. Checking if the plan exists...');
        try {
          const getResponse = await axios.get(`${BASE_URL}/diet-plans/user/${testUserId}`);
          const existingPlan = getResponse.data.dietPlans.find(plan => plan._id === existingPlanId);
          
          if (existingPlan) {
            console.log('✅ Plan exists in database');
            console.log('Current plan structure:');
            console.log(JSON.stringify(existingPlan, null, 2));
          } else {
            console.log('❌ Plan not found in database');
          }
        } catch (getError) {
          console.error('Error getting plan:', getError.message);
        }
      }
    }

    // Let's also try a simpler update to see if it's a data structure issue
    console.log('\n4. Trying simpler update...');
    const simpleData = {
      name: "Meal 1",
      description: "Simple test update",
      userId: testUserId,
      dietType: "Muscle Building",
      isActive: true,
      totalDailyCalories: 100,
      meals: [
        {
          name: "Breakfast",
          time: "Breakfast",
          instructions: "Simple breakfast",
          totalCalories: 100,
          foods: [
            {
              foodName: "Simple Food",
              quantity: 1,
              unit: "serving"
            }
          ]
        }
      ]
    };

    try {
      const simpleResponse = await axios.put(`${BASE_URL}/diet-plans/${existingPlanId}`, simpleData);
      console.log('✅ Simple update successful!');
    } catch (simpleError) {
      console.error('❌ Simple update also failed:');
      console.error('Status:', simpleError.response?.status);
      console.error('Error:', simpleError.response?.data);
    }

  } catch (error) {
    console.error('❌ General error:', error.message);
  }
}

debugUpdateError();