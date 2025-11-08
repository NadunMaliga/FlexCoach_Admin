const axios = require('axios');

const BASE_URL = 'http://localhost:3001/api';  // Non-admin route
const testUserId = "68e8fd08e8d1859ebd9edd05";

async function testAddDietNoAuth() {
  console.log('🧪 Testing AddDiet API Calls (No Auth)...\n');

  try {
    // 1. Test getUserDietPlans (non-admin route)
    console.log('1. Testing getUserDietPlans (no auth)...');
    const getUserPlansResponse = await axios.get(`${BASE_URL}/diet-plans/user/${testUserId}`);
    
    console.log('✅ getUserDietPlans Response:');
    console.log(`Status: ${getUserPlansResponse.status}`);
    console.log(`Success: ${getUserPlansResponse.data.success}`);
    console.log(`Plans found: ${getUserPlansResponse.data.dietPlans.length}`);
    
    getUserPlansResponse.data.dietPlans.forEach(plan => {
      console.log(`  - ${plan.name} (${plan.dietType})`);
      console.log(`    Meals: ${plan.meals.length}`);
    });

    // 2. Find existing Meal 1
    const existingMeal1 = getUserPlansResponse.data.dietPlans.find(plan => plan.name === "Meal 1");
    
    if (existingMeal1) {
      console.log('\n2. Found existing Meal 1 - Testing UPDATE (no auth)...');
      console.log(`Existing Meal 1 ID: ${existingMeal1._id}`);
      
      // Test update data
      const updateData = {
        name: "Meal 1",
        description: "Meal 1 with customized meals",
        userId: testUserId,
        meals: [
          {
            name: "Breakfast",
            time: "Breakfast",
            foods: [
              {
                foodName: "Updated Food 1",
                quantity: 100,
                unit: "grams"
              },
              {
                foodName: "Updated Food 2", 
                quantity: 50,
                unit: "grams"
              }
            ],
            instructions: "Breakfast meal plan",
            totalCalories: 150
          }
        ],
        totalDailyCalories: 150,
        dietType: "Muscle Building",
        isActive: true
      };

      console.log('\nSending UPDATE request (no auth)...');

      const updateResponse = await axios.put(`${BASE_URL}/diet-plans/${existingMeal1._id}`, updateData);
      
      console.log('\n✅ Update Response:');
      console.log(`Status: ${updateResponse.status}`);
      console.log(`Success: ${updateResponse.data.success}`);
      
      if (updateResponse.data.dietPlan) {
        const updated = updateResponse.data.dietPlan;
        console.log(`Updated plan name: ${updated.name}`);
        console.log(`Updated plan meals: ${updated.meals.length}`);
        updated.meals.forEach(meal => {
          console.log(`  - ${meal.name}: ${meal.foods.length} foods`);
          meal.foods.forEach(food => {
            console.log(`    * ${food.foodName}: ${food.quantity} ${food.unit}`);
          });
        });
      }

    } else {
      console.log('\n2. No existing Meal 1 found');
      
      // Test creating new plan
      console.log('\n3. Testing CREATE (no auth)...');
      const createData = {
        name: "Meal 1",
        description: "Meal 1 with customized meals",
        userId: testUserId,
        meals: [
          {
            name: "Breakfast",
            time: "Breakfast",
            foods: [
              {
                foodName: "New Food 1",
                quantity: 100,
                unit: "grams"
              }
            ],
            instructions: "Breakfast meal plan",
            totalCalories: 100
          }
        ],
        totalDailyCalories: 100,
        dietType: "Muscle Building",
        isActive: true
      };

      const createResponse = await axios.post(`${BASE_URL}/diet-plans`, createData);
      
      console.log('\n✅ Create Response:');
      console.log(`Status: ${createResponse.status}`);
      console.log(`Success: ${createResponse.data.success}`);
    }

  } catch (error) {
    console.error('❌ Error during API test:', error.response?.data || error.message);
  }
}

testAddDietNoAuth();