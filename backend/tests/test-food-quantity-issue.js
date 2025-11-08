const axios = require('axios');

const BASE_URL = 'http://localhost:3001/api';
const testUserId = "68e8fd08e8d1859ebd9edd05";

async function testFoodQuantityIssue() {
  console.log('🧪 Testing Food Quantity Issue...\n');

  try {
    // 1. First, let's see what's currently in the database
    console.log('1. Current database state:');
    const currentResponse = await axios.get(`${BASE_URL}/diet-plans/user/${testUserId}`);
    const currentPlans = currentResponse.data.dietPlans;
    
    const meal1 = currentPlans.find(plan => plan.name === "Meal 1");
    if (meal1) {
      console.log('\n📋 Current Meal 1 in database:');
      meal1.meals.forEach(meal => {
        console.log(`  ${meal.name} (${meal.time}):`);
        meal.foods.forEach(food => {
          console.log(`    - ${food.foodName}: ${food.quantity} ${food.unit}`);
        });
      });
    }

    // 2. Now let's simulate adding specific quantities like a user would
    console.log('\n2. Simulating user adding specific quantities...');
    
    const userInputFoods = {
      "Breakfast": [
        { name: "Eggs", quantity: "4" },      // User enters 4
        { name: "Bread", quantity: "2" }      // User enters 2
      ],
      "Lunch": [
        { name: "Chicken Breast", quantity: "250" },  // User enters 250
        { name: "Rice", quantity: "100" }             // User enters 100
      ]
    };

    console.log('User input foods:');
    Object.entries(userInputFoods).forEach(([mealType, foods]) => {
      console.log(`  ${mealType}:`);
      foods.forEach(food => {
        console.log(`    - ${food.name}: ${food.quantity}`);
      });
    });

    // 3. Transform to backend format (exactly like AddDiet component does)
    const meals = [];
    let totalCalories = 0;

    Object.entries(userInputFoods).forEach(([mealType, foods]) => {
      const mealCalories = foods.reduce((sum, food) => {
        const calories = parseInt(food.quantity) || 0;
        return sum + calories;
      }, 0);

      meals.push({
        name: mealType,
        time: mealType,
        foods: foods.map(food => ({
          foodName: food.name,
          quantity: parseInt(food.quantity) || 0,  // This converts string to number
          unit: 'grams'
        })),
        instructions: `${mealType} meal plan`,
        totalCalories: mealCalories
      });

      totalCalories += mealCalories;
    });

    const dietPlanData = {
      name: "Meal 1",
      description: "Meal 1 with customized meals",
      userId: testUserId,
      meals: meals,
      totalDailyCalories: totalCalories,
      dietType: "Muscle Building",
      isActive: true
    };

    console.log('\n3. Data being sent to backend:');
    console.log(JSON.stringify(dietPlanData, null, 2));

    // 4. Update the diet plan
    console.log('\n4. Updating diet plan...');
    const updateResponse = await axios.put(`${BASE_URL}/diet-plans/${meal1._id}`, dietPlanData);
    
    console.log(`Update successful: ${updateResponse.data.success}`);

    // 5. Immediately fetch the data back to see what was saved
    console.log('\n5. Fetching updated data from database...');
    const verifyResponse = await axios.get(`${BASE_URL}/diet-plans/user/${testUserId}`);
    const updatedMeal1 = verifyResponse.data.dietPlans.find(plan => plan.name === "Meal 1");
    
    if (updatedMeal1) {
      console.log('\n📋 What was actually saved in database:');
      updatedMeal1.meals.forEach(meal => {
        console.log(`  ${meal.name} (${meal.time}):`);
        meal.foods.forEach(food => {
          console.log(`    - ${food.foodName}: ${food.quantity} ${food.unit}`);
        });
      });

      // 6. Simulate how DietPlan component would display this
      console.log('\n6. How DietPlan component would display this:');
      updatedMeal1.meals.forEach(meal => {
        const foodList = meal.foods.map(food =>
          `${food.foodName} ${food.quantity}${food.unit}`
        ).join('\n');
        
        console.log(`  ${meal.time}:`);
        console.log(`    ${foodList}`);
      });
    }

    // 7. Check if there are any other sources of food data that might be interfering
    console.log('\n7. Checking Foods collection for reference data...');
    try {
      const foodsResponse = await axios.get(`${BASE_URL}/foods?limit=10`);
      if (foodsResponse.data.success && foodsResponse.data.foods) {
        console.log('Sample foods from Foods collection:');
        foodsResponse.data.foods.slice(0, 5).forEach(food => {
          console.log(`  - ${food.name}: ${food.quantity || 'no quantity'} ${food.unit || 'no unit'}`);
        });
      }
    } catch (error) {
      console.log('Could not fetch foods collection (might not have public endpoint)');
    }

  } catch (error) {
    console.error('❌ Error during test:', error.response?.data || error.message);
  }
}

testFoodQuantityIssue();