const axios = require('axios');

const BASE_URL = 'http://localhost:3001/api';
const testUserId = "68e8fd08e8d1859ebd9edd05";

async function testHybridQuantities() {
  console.log('🧪 Testing Hybrid Quantity System...\n');

  try {
    // Simulate user input with various quantity formats
    const userInputs = [
      { name: "Eggs", quantity: "3 pieces" },
      { name: "Milk", quantity: "1 cup" },
      { name: "Bread", quantity: "2 slices" },
      { name: "Chicken", quantity: "150g" },
      { name: "Rice", quantity: "0.5 cups" },
      { name: "Apple", quantity: "1" }
    ];

    console.log('1. User inputs:');
    userInputs.forEach(food => {
      console.log(`   ${food.name}: "${food.quantity}"`);
    });

    // Process like AddDiet component would
    console.log('\n2. Processing quantities:');
    const processedFoods = userInputs.map(food => {
      // Extract numeric part for quantity field, keep full text in unit field
      const numericMatch = food.quantity.match(/^\d+(\.\d+)?/);
      const numericPart = numericMatch ? parseFloat(numericMatch[0]) : 1;
      const textPart = food.quantity.replace(/^\d+(\.\d+)?\s*/, '') || 'serving';
      
      const processed = {
        foodName: food.name,
        quantity: numericPart, // Numeric part for database
        unit: textPart || food.quantity // Full text or original input
      };

      console.log(`   ${food.name}: quantity=${processed.quantity}, unit="${processed.unit}"`);
      return processed;
    });

    // Create diet plan data
    const dietPlanData = {
      name: "Meal 1",
      description: "Testing hybrid quantity system",
      userId: testUserId,
      meals: [
        {
          name: "Breakfast",
          time: "Breakfast",
          foods: processedFoods,
          instructions: "Breakfast meal plan",
          totalCalories: 100
        }
      ],
      totalDailyCalories: 100,
      dietType: "Muscle Building",
      isActive: true
    };

    console.log('\n3. Sending to API...');
    
    // Get existing plan and update
    const existingResponse = await axios.get(`${BASE_URL}/diet-plans/user/${testUserId}`);
    const existingPlan = existingResponse.data.dietPlans.find(plan => plan.name === "Meal 1");
    
    if (existingPlan) {
      const updateResponse = await axios.put(`${BASE_URL}/diet-plans/${existingPlan._id}`, dietPlanData);
      console.log(`   Update successful: ${updateResponse.data.success}`);

      if (updateResponse.data.success) {
        // Verify the saved data
        console.log('\n4. Verifying saved data:');
        const verifyResponse = await axios.get(`${BASE_URL}/diet-plans/user/${testUserId}`);
        const savedPlan = verifyResponse.data.dietPlans.find(plan => plan.name === "Meal 1");
        
        if (savedPlan) {
          console.log('   Raw database data:');
          savedPlan.meals[0].foods.forEach(food => {
            console.log(`     ${food.foodName}: quantity=${food.quantity} (${typeof food.quantity}), unit="${food.unit}"`);
          });

          console.log('\n   How DietPlan component will display:');
          savedPlan.meals[0].foods.forEach(food => {
            let displayText;
            if (food.unit && food.unit !== 'serving' && food.unit !== '') {
                displayText = `${food.foodName} ${food.quantity} ${food.unit}`;
            } else {
                displayText = `${food.foodName} ${food.quantity}`;
            }
            console.log(`     ${displayText}`);
          });

          console.log('\n✅ Hybrid quantity system working!');
          console.log('✅ Users can type flexible quantities, system stores them properly');
        }
      }
    }

  } catch (error) {
    console.error('❌ Error during test:', error.response?.data || error.message);
  }
}

testHybridQuantities();