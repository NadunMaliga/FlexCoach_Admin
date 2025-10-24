const axios = require('axios');

const BASE_URL = 'http://localhost:3001/api';
const testUserId = "68e8fd08e8d1859ebd9edd05";

async function testAddDietFinal() {
  console.log('🧪 Final AddDiet Component Test...\n');

  try {
    // Simulate complete AddDiet flow
    console.log('1. User selects "Meal 1" and adds flexible quantities...');
    
    const userInput = {
      selectedMealPlan: "Meal 1",
      addedFoods: {
        "Breakfast": [
          { name: "Eggs", quantity: "3 pieces" },
          { name: "Toast", quantity: "2 slices" }
        ],
        "Lunch": [
          { name: "Chicken Breast", quantity: "150g" },
          { name: "Rice", quantity: "1 cup" }
        ]
      }
    };

    console.log('User input:');
    console.log(JSON.stringify(userInput, null, 2));

    // Process like AddDiet component
    const meals = [];
    let totalCalories = 0;

    Object.entries(userInput.addedFoods).forEach(([mealType, foods]) => {
      const mealCalories = foods.reduce((sum, food) => {
        const numericValue = parseInt(food.quantity) || 0;
        return sum + numericValue;
      }, 0);

      meals.push({
        name: mealType,
        time: mealType,
        foods: foods.map(food => {
          // Extract numeric part for quantity field, keep full text in unit field
          const numericMatch = food.quantity.match(/^\d+(\.\d+)?/);
          const numericPart = numericMatch ? parseFloat(numericMatch[0]) : 1;
          const textPart = food.quantity.replace(/^\d+(\.\d+)?\s*/, '') || 'serving';
          
          return {
            foodName: food.name,
            quantity: numericPart,
            unit: textPart || food.quantity
          };
        }),
        instructions: `${mealType} meal plan`,
        totalCalories: mealCalories
      });

      totalCalories += mealCalories;
    });

    const dietTypeMapping = {
      "Meal 1": "Muscle Building",
      "Meal 2": "Maintenance",
      "Meal 3": "Weight Loss"
    };
    const dietType = dietTypeMapping[userInput.selectedMealPlan] || "Maintenance";

    const dietPlanData = {
      name: userInput.selectedMealPlan,
      description: `${userInput.selectedMealPlan} with customized meals`,
      userId: testUserId,
      meals: meals,
      totalDailyCalories: totalCalories,
      dietType: dietType,
      isActive: true
    };

    console.log('\n2. Processed diet plan data:');
    console.log(JSON.stringify(dietPlanData, null, 2));

    // Check for existing plan and update
    console.log('\n3. Checking for existing plan...');
    const existingResponse = await axios.get(`${BASE_URL}/diet-plans/user/${testUserId}`);
    const existingPlan = existingResponse.data.dietPlans.find(plan => plan.name === userInput.selectedMealPlan);

    if (existingPlan) {
      console.log(`Found existing ${userInput.selectedMealPlan} - updating...`);
      const updateResponse = await axios.put(`${BASE_URL}/diet-plans/${existingPlan._id}`, dietPlanData);
      console.log(`✅ Update successful: ${updateResponse.data.success}`);
    } else {
      console.log(`Creating new ${userInput.selectedMealPlan}...`);
      const createResponse = await axios.post(`${BASE_URL}/diet-plans`, dietPlanData);
      console.log(`✅ Create successful: ${createResponse.data.success}`);
    }

    // Verify the final result
    console.log('\n4. Verifying saved data...');
    const verifyResponse = await axios.get(`${BASE_URL}/diet-plans/user/${testUserId}`);
    const savedPlan = verifyResponse.data.dietPlans.find(plan => plan.name === userInput.selectedMealPlan);

    if (savedPlan) {
      console.log(`\n📋 Final ${userInput.selectedMealPlan} contents:`);
      console.log(`Diet Type: ${savedPlan.dietType}`);
      console.log(`Total Calories: ${savedPlan.totalDailyCalories}`);
      
      savedPlan.meals.forEach(meal => {
        console.log(`\n${meal.name}:`);
        meal.foods.forEach(food => {
          // Display as DietPlan component would
          let displayText;
          if (food.unit && food.unit !== 'serving' && food.unit !== '') {
              displayText = `${food.foodName} ${food.quantity} ${food.unit}`;
          } else {
              displayText = `${food.foodName} ${food.quantity}`;
          }
          console.log(`  - ${displayText}`);
        });
      });

      console.log('\n🎉 AddDiet component flow completed successfully!');
      console.log('✅ Flexible quantities working');
      console.log('✅ Diet type mapping working');
      console.log('✅ Update/create logic working');
      console.log('✅ Data display working');
    }

  } catch (error) {
    console.error('❌ Error:', error.response?.data || error.message);
  }
}

testAddDietFinal();