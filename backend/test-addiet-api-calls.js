const axios = require('axios');

const BASE_URL = 'http://localhost:3001/api/admin';
const testUserId = "68e8fd08e8d1859ebd9edd05";

async function testAddDietAPICalls() {
  console.log('🧪 Testing AddDiet API Calls...\n');

  try {
    // 1. Test getUserDietPlans (what AddDiet calls to check existing plans)
    console.log('1. Testing getUserDietPlans API call...');
    const getUserPlansResponse = await axios.get(`${BASE_URL}/diet-plans/user/${testUserId}`);
    
    console.log('✅ getUserDietPlans Response:');
    console.log(`Status: ${getUserPlansResponse.status}`);
    console.log(`Success: ${getUserPlansResponse.data.success}`);
    console.log(`Plans found: ${getUserPlansResponse.data.dietPlans.length}`);
    
    getUserPlansResponse.data.dietPlans.forEach(plan => {
      console.log(`  - ${plan.name} (${plan.dietType})`);
      console.log(`    Meals: ${plan.meals.length}`);
      plan.meals.forEach(meal => {
        console.log(`      * ${meal.name}: ${meal.foods.length} foods`);
        meal.foods.forEach(food => {
          console.log(`        - ${food.foodName}: ${food.quantity} ${food.unit}`);
        });
      });
    });

    // 2. Find existing Meal 1
    const existingMeal1 = getUserPlansResponse.data.dietPlans.find(plan => plan.name === "Meal 1");
    
    if (existingMeal1) {
      console.log('\n2. Found existing Meal 1 - Testing UPDATE...');
      console.log(`Existing Meal 1 ID: ${existingMeal1._id}`);
      
      // Simulate what AddDiet component sends for update
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
                foodName: "Test Food 1",
                quantity: 100,
                unit: "grams"
              },
              {
                foodName: "Test Food 2", 
                quantity: 50,
                unit: "grams"
              }
            ],
            instructions: "Breakfast meal plan",
            totalCalories: 150
          },
          {
            name: "Lunch",
            time: "Lunch",
            foods: [
              {
                foodName: "Test Food 3",
                quantity: 200,
                unit: "grams"
              }
            ],
            instructions: "Lunch meal plan",
            totalCalories: 200
          }
        ],
        totalDailyCalories: 350,
        dietType: "Muscle Building",
        isActive: true
      };

      console.log('\nSending UPDATE request with data:');
      console.log(JSON.stringify(updateData, null, 2));

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

      // 3. Verify the update by getting plans again
      console.log('\n3. Verifying update by fetching plans again...');
      const verifyResponse = await axios.get(`${BASE_URL}/diet-plans/user/${testUserId}`);
      
      const updatedMeal1 = verifyResponse.data.dietPlans.find(plan => plan.name === "Meal 1");
      if (updatedMeal1) {
        console.log('\n📋 Verified Meal 1 after update:');
        console.log(`Name: ${updatedMeal1.name}`);
        console.log(`Total Calories: ${updatedMeal1.totalDailyCalories}`);
        console.log(`Meals: ${updatedMeal1.meals.length}`);
        updatedMeal1.meals.forEach(meal => {
          console.log(`  - ${meal.name} (${meal.totalCalories} cal)`);
          meal.foods.forEach(food => {
            console.log(`    * ${food.foodName}: ${food.quantity} ${food.unit}`);
          });
        });
      }

    } else {
      console.log('\n2. No existing Meal 1 found - would CREATE new one');
    }

  } catch (error) {
    console.error('❌ Error during API test:', error.response?.data || error.message);
  }
}

testAddDietAPICalls();