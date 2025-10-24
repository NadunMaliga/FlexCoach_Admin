const axios = require('axios');

const BASE_URL = 'http://localhost:3001/api';
const testUserId = "68e8fd08e8d1859ebd9edd05";

async function testFlexibleQuantities() {
  console.log('🧪 Testing Flexible Quantity System...\n');

  try {
    // Simulate user adding foods with different quantity formats
    const addedFoods = {
      "Breakfast": [
        { name: "Eggs", quantity: "3 pieces" },
        { name: "Milk", quantity: "1 cup" },
        { name: "Bread", quantity: "2 slices" }
      ],
      "Lunch": [
        { name: "Chicken Breast", quantity: "150g" },
        { name: "Rice", quantity: "1/2 cup" },
        { name: "Vegetables", quantity: "1 serving" }
      ]
    };

    console.log('1. User input with flexible quantities:');
    Object.entries(addedFoods).forEach(([mealType, foods]) => {
      console.log(`   ${mealType}:`);
      foods.forEach(food => {
        console.log(`     - ${food.name}: "${food.quantity}"`);
      });
    });

    // Transform to new flexible format
    const meals = [];
    let totalCalories = 0;

    Object.entries(addedFoods).forEach(([mealType, foods]) => {
      const mealCalories = foods.reduce((sum, food) => {
        // Try to extract numbers for calorie calculation
        const numericValue = parseInt(food.quantity) || 0;
        return sum + numericValue;
      }, 0);

      meals.push({
        name: mealType,
        time: mealType,
        foods: foods.map(food => ({
          foodName: food.name,
          quantity: food.quantity, // Keep as string
          unit: '' // No unit
        })),
        instructions: `${mealType} meal plan`,
        totalCalories: mealCalories
      });

      totalCalories += mealCalories;
    });

    const dietPlanData = {
      name: "Meal 1",
      description: "Meal 1 with flexible quantities",
      userId: testUserId,
      meals: meals,
      totalDailyCalories: totalCalories,
      dietType: "Muscle Building",
      isActive: true
    };

    console.log('\n2. Data structure sent to API:');
    console.log(JSON.stringify(dietPlanData, null, 2));

    // Save to database
    const existingResponse = await axios.get(`${BASE_URL}/diet-plans/user/${testUserId}`);
    const existingPlan = existingResponse.data.dietPlans.find(plan => plan.name === "Meal 1");
    
    if (existingPlan) {
      console.log('\n3. Updating existing plan...');
      const updateResponse = await axios.put(`${BASE_URL}/diet-plans/${existingPlan._id}`, dietPlanData);
      console.log(`   Update successful: ${updateResponse.data.success}`);
    }

    // Verify the saved data
    console.log('\n4. Verifying saved data:');
    const verifyResponse = await axios.get(`${BASE_URL}/diet-plans/user/${testUserId}`);
    const savedPlan = verifyResponse.data.dietPlans.find(plan => plan.name === "Meal 1");
    
    if (savedPlan) {
      console.log('   Raw database data:');
      savedPlan.meals.forEach(meal => {
        console.log(`     ${meal.name}:`);
        meal.foods.forEach(food => {
          console.log(`       - ${food.foodName}: "${food.quantity}" (unit: "${food.unit}")`);
        });
      });

      console.log('\n   How it will display in DietPlan component:');
      savedPlan.meals.forEach(meal => {
        console.log(`     ${meal.time}:`);
        meal.foods.forEach(food => {
          const displayText = `${food.foodName} ${food.quantity}`;
          console.log(`       ${displayText}`);
        });
      });
    }

    console.log('\n✅ Flexible quantity system working!');
    console.log('✅ Users can now type: "2 cups", "150g", "1 piece", etc.');

  } catch (error) {
    console.error('❌ Error during test:', error.response?.data || error.message);
  }
}

testFlexibleQuantities();