const axios = require('axios');

const BASE_URL = 'http://localhost:3001/api';
const testUserId = "68e8fd08e8d1859ebd9edd05";

async function testFullAddDietFlow() {
  console.log('🧪 Testing Full AddDiet Component Flow...\n');

  try {
    // Simulate what AddDiet component does:
    
    // 1. Load existing meal plans (loadExistingMealPlans)
    console.log('1. Loading existing meal plans...');
    const existingResponse = await axios.get(`${BASE_URL}/diet-plans/user/${testUserId}`);
    const existingPlans = existingResponse.data.dietPlans;
    const existingNames = existingPlans.map(plan => plan.name);
    
    console.log(`Found existing plans: ${existingNames.join(', ')}`);
    
    // 2. User selects "Meal 1" and adds foods
    const selectedMealPlan = "Meal 1";
    const addedFoods = {
      "Breakfast": [
        { name: "Scrambled Eggs", quantity: "3" },
        { name: "Toast", quantity: "2" }
      ],
      "Lunch": [
        { name: "Grilled Chicken", quantity: "200" },
        { name: "Brown Rice", quantity: "150" }
      ]
    };
    
    console.log('\n2. User selected meal plan:', selectedMealPlan);
    console.log('User added foods:', JSON.stringify(addedFoods, null, 2));
    
    // 3. Simulate saveDietPlan function
    console.log('\n3. Simulating saveDietPlan...');
    
    // Transform addedFoods to backend format (like in AddDiet component)
    const meals = [];
    let totalCalories = 0;

    Object.entries(addedFoods).forEach(([mealType, foods]) => {
      const mealCalories = foods.reduce((sum, food) => {
        const calories = parseInt(food.quantity) || 0;
        return sum + calories;
      }, 0);

      meals.push({
        name: mealType,
        time: mealType,
        foods: foods.map(food => ({
          foodName: food.name,
          quantity: parseInt(food.quantity) || 0,
          unit: 'grams'
        })),
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
    const dietType = dietTypeMapping[selectedMealPlan] || "Maintenance";

    const dietPlanData = {
      name: selectedMealPlan,
      description: `${selectedMealPlan} with customized meals`,
      userId: testUserId,
      meals: meals,
      totalDailyCalories: totalCalories,
      dietType: dietType,
      isActive: true
    };

    console.log('Diet plan data to save:');
    console.log(JSON.stringify(dietPlanData, null, 2));

    // 4. Check if plan exists and update/create accordingly
    const existingPlan = existingPlans.find(plan => plan.name === selectedMealPlan);
    
    let response;
    let actionMessage;

    if (existingPlan) {
      console.log(`\n4. ${selectedMealPlan} exists - UPDATING...`);
      console.log(`Existing plan ID: ${existingPlan._id}`);
      
      response = await axios.put(`${BASE_URL}/diet-plans/${existingPlan._id}`, dietPlanData);
      actionMessage = `${selectedMealPlan} updated successfully!`;
    } else {
      console.log(`\n4. ${selectedMealPlan} does not exist - CREATING...`);
      
      response = await axios.post(`${BASE_URL}/diet-plans`, dietPlanData);
      actionMessage = `${selectedMealPlan} created successfully!`;
    }

    console.log('\n✅ Save Response:');
    console.log(`Status: ${response.status}`);
    console.log(`Success: ${response.data.success}`);
    console.log(`Message: ${actionMessage}`);

    // 5. Verify the final result
    console.log('\n5. Verifying final result...');
    const finalResponse = await axios.get(`${BASE_URL}/diet-plans/user/${testUserId}`);
    const updatedPlan = finalResponse.data.dietPlans.find(plan => plan.name === selectedMealPlan);
    
    if (updatedPlan) {
      console.log(`\n📋 Final ${selectedMealPlan} contents:`);
      console.log(`Name: ${updatedPlan.name}`);
      console.log(`Diet Type: ${updatedPlan.dietType}`);
      console.log(`Total Calories: ${updatedPlan.totalDailyCalories}`);
      console.log(`Meals: ${updatedPlan.meals.length}`);
      
      updatedPlan.meals.forEach((meal, idx) => {
        console.log(`  ${idx + 1}. ${meal.name} (${meal.totalCalories} cal)`);
        meal.foods.forEach(food => {
          console.log(`     - ${food.foodName}: ${food.quantity} ${food.unit}`);
        });
      });
      
      console.log('\n🎉 AddDiet flow completed successfully!');
      console.log('✅ Data is being saved and retrieved correctly');
    }

  } catch (error) {
    console.error('❌ Error during full flow test:', error.response?.data || error.message);
  }
}

testFullAddDietFlow();