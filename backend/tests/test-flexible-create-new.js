const axios = require('axios');

const BASE_URL = 'http://localhost:3001/api';
const testUserId = "68e8fd08e8d1859ebd9edd05";

async function testCreateFlexibleQuantities() {
  console.log('🧪 Testing Create New Diet Plan with Flexible Quantities...\n');

  try {
    // Create a completely new diet plan with flexible quantities
    const dietPlanData = {
      name: "Test Flexible Plan",
      description: "Testing flexible quantity system",
      userId: testUserId,
      meals: [
        {
          name: "Breakfast",
          time: "Breakfast",
          foods: [
            {
              foodName: "Eggs",
              quantity: "3 pieces",
              unit: ""
            },
            {
              foodName: "Milk",
              quantity: "1 cup",
              unit: ""
            }
          ],
          instructions: "Breakfast meal plan",
          totalCalories: 4
        }
      ],
      totalDailyCalories: 4,
      dietType: "Muscle Building",
      isActive: true
    };

    console.log('1. Creating new diet plan with flexible quantities:');
    console.log(JSON.stringify(dietPlanData, null, 2));

    // Create new diet plan
    console.log('\n2. Sending create request...');
    const createResponse = await axios.post(`${BASE_URL}/diet-plans`, dietPlanData);
    
    console.log(`   Create successful: ${createResponse.data.success}`);
    
    if (createResponse.data.success) {
      const newPlanId = createResponse.data.dietPlan._id;
      console.log(`   New plan ID: ${newPlanId}`);

      // Verify the saved data
      console.log('\n3. Verifying saved data:');
      const verifyResponse = await axios.get(`${BASE_URL}/diet-plans/user/${testUserId}`);
      const savedPlan = verifyResponse.data.dietPlans.find(plan => plan.name === "Test Flexible Plan");
      
      if (savedPlan) {
        console.log('   ✅ Plan saved successfully!');
        console.log('   Raw database data:');
        savedPlan.meals.forEach(meal => {
          console.log(`     ${meal.name}:`);
          meal.foods.forEach(food => {
            console.log(`       - ${food.foodName}: "${food.quantity}" (type: ${typeof food.quantity})`);
          });
        });

        console.log('\n   How it displays:');
        savedPlan.meals.forEach(meal => {
          meal.foods.forEach(food => {
            const displayText = `${food.foodName} ${food.quantity}`;
            console.log(`     ${displayText}`);
          });
        });

        // Clean up - delete the test plan
        console.log('\n4. Cleaning up test plan...');
        await axios.delete(`${BASE_URL}/diet-plans/${savedPlan._id}`);
        console.log('   Test plan deleted');
      }
    }

  } catch (error) {
    console.error('❌ Error during test:', error.response?.data || error.message);
    if (error.response?.data?.details) {
      console.error('Error details:', error.response.data.details);
    }
  }
}

testCreateFlexibleQuantities();