const axios = require('axios');

const BASE_URL = 'http://localhost:3001/api';
const testUserId = "68e8fd08e8d1859ebd9edd05";

async function testUserAddDietFlow() {
  console.log('🧪 Testing Exact User AddDiet Flow...\n');

  try {
    // Step 1: User selects "Meal 1"
    console.log('1. User selects "Meal 1"');
    
    // Step 2: User adds foods with specific quantities
    console.log('\n2. User adds foods:');
    console.log('   - Selects "Breakfast" meal type');
    console.log('   - Selects "Eggs" from food dropdown');
    console.log('   - Types "3" in quantity field');
    console.log('   - Clicks "Add Food"');
    console.log('   - Selects "Toast" from food dropdown');
    console.log('   - Types "2" in quantity field');
    console.log('   - Clicks "Add Food"');
    
    // Simulate the exact state that would be in AddDiet component
    const addedFoods = {
      "Breakfast": [
        { name: "Eggs", quantity: "3" },      // Note: quantity is string from TextInput
        { name: "Toast", quantity: "2" }
      ]
    };
    
    console.log('\n   AddDiet component state (addedFoods):');
    console.log(JSON.stringify(addedFoods, null, 4));
    
    // Step 3: User goes to Step 3 (Preview)
    console.log('\n3. Step 3 Preview - What user sees:');
    Object.entries(addedFoods).map(([meal, foods], i) => {
      console.log(`   ${meal}:`);
      foods.map((f, idx) => {
        console.log(`     • ${f.name} - ${f.quantity}`);
      });
    });
    
    // Step 4: User clicks "Confirm" - saveDietPlan is called
    console.log('\n4. User clicks "Confirm" - saveDietPlan transforms data:');
    
    const meals = [];
    let totalCalories = 0;

    Object.entries(addedFoods).forEach(([mealType, foods]) => {
      const mealCalories = foods.reduce((sum, food) => {
        const calories = parseInt(food.quantity) || 0;  // String "3" becomes number 3
        return sum + calories;
      }, 0);

      meals.push({
        name: mealType,
        time: mealType,
        foods: foods.map(food => ({
          foodName: food.name,
          quantity: parseInt(food.quantity) || 0,  // String "3" becomes number 3
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

    console.log('   Transformed data sent to API:');
    console.log(JSON.stringify(dietPlanData, null, 4));

    // Step 5: Save to database
    console.log('\n5. Saving to database...');
    
    // Get existing plan
    const existingResponse = await axios.get(`${BASE_URL}/diet-plans/user/${testUserId}`);
    const existingPlan = existingResponse.data.dietPlans.find(plan => plan.name === "Meal 1");
    
    if (existingPlan) {
      const updateResponse = await axios.put(`${BASE_URL}/diet-plans/${existingPlan._id}`, dietPlanData);
      console.log(`   Update successful: ${updateResponse.data.success}`);
    }

    // Step 6: User navigates to DietPlan screen to view saved data
    console.log('\n6. User views saved data in DietPlan screen:');
    
    const viewResponse = await axios.get(`${BASE_URL}/diet-plans/user/${testUserId}`);
    const savedPlan = viewResponse.data.dietPlans.find(plan => plan.name === "Meal 1");
    
    if (savedPlan) {
      console.log('   Raw data from database:');
      savedPlan.meals.forEach(meal => {
        console.log(`     ${meal.name}:`);
        meal.foods.forEach(food => {
          console.log(`       - ${food.foodName}: ${food.quantity} ${food.unit} (type: ${typeof food.quantity})`);
        });
      });
      
      console.log('\n   How DietPlan component displays it:');
      savedPlan.meals.forEach(meal => {
        const foodList = meal.foods.map(food =>
          `${food.foodName} ${food.quantity}${food.unit}`
        ).join('\n');
        
        console.log(`     ${meal.time}:`);
        console.log(`       ${foodList}`);
      });
    }

    // Step 7: Check if there's any discrepancy
    console.log('\n7. Verification:');
    console.log('   User entered: Eggs 3, Toast 2');
    if (savedPlan && savedPlan.meals.length > 0) {
      const breakfastMeal = savedPlan.meals.find(m => m.name === "Breakfast");
      if (breakfastMeal) {
        console.log('   Database saved:');
        breakfastMeal.foods.forEach(food => {
          console.log(`     ${food.foodName}: ${food.quantity}`);
        });
        
        // Check if quantities match
        const eggsFood = breakfastMeal.foods.find(f => f.foodName === "Eggs");
        const toastFood = breakfastMeal.foods.find(f => f.foodName === "Toast");
        
        if (eggsFood && eggsFood.quantity === 3) {
          console.log('   ✅ Eggs quantity correct (3)');
        } else {
          console.log(`   ❌ Eggs quantity wrong: expected 3, got ${eggsFood?.quantity}`);
        }
        
        if (toastFood && toastFood.quantity === 2) {
          console.log('   ✅ Toast quantity correct (2)');
        } else {
          console.log(`   ❌ Toast quantity wrong: expected 2, got ${toastFood?.quantity}`);
        }
      }
    }

  } catch (error) {
    console.error('❌ Error during user flow test:', error.response?.data || error.message);
  }
}

testUserAddDietFlow();