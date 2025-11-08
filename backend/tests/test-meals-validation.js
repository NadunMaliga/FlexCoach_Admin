const axios = require('axios');

const BASE_URL = 'http://localhost:3001/api';
const testUserId = "68e8fd08e8d1859ebd9edd05";
const existingPlanId = "68e94697f645c13ca10e81eb";

async function testMealsValidation() {
  console.log('🧪 Testing Meals Array Validation...\n');

  try {
    // Test 1: Update with just basic fields (we know this works)
    console.log('1. Testing basic update (should work)...');
    const basicData = {
      name: "Meal 1",
      description: "Basic test"
    };

    const basicResponse = await axios.put(`${BASE_URL}/diet-plans/${existingPlanId}`, basicData);
    console.log(`✅ Basic update: ${basicResponse.data.success}`);

    // Test 2: Add meals array with simple structure
    console.log('\n2. Testing with simple meals array...');
    const simpleMealsData = {
      name: "Meal 1",
      description: "Simple meals test",
      meals: [
        {
          name: "Breakfast",
          time: "Breakfast",
          instructions: "Simple breakfast",
          totalCalories: 100
        }
      ]
    };

    try {
      const simpleMealsResponse = await axios.put(`${BASE_URL}/diet-plans/${existingPlanId}`, simpleMealsData);
      console.log(`✅ Simple meals update: ${simpleMealsResponse.data.success}`);
    } catch (simpleMealsError) {
      console.log(`❌ Simple meals failed: ${simpleMealsError.response?.status}`);
      console.log(`   Error: ${JSON.stringify(simpleMealsError.response?.data, null, 2)}`);
    }

    // Test 3: Add foods array (this might be the issue)
    console.log('\n3. Testing with foods array...');
    const foodsData = {
      name: "Meal 1",
      description: "Foods test",
      meals: [
        {
          name: "Breakfast",
          time: "Breakfast",
          instructions: "Breakfast with foods",
          totalCalories: 100,
          foods: [
            {
              foodName: "Test Food",
              quantity: 1,
              unit: "piece"
            }
          ]
        }
      ]
    };

    try {
      const foodsResponse = await axios.put(`${BASE_URL}/diet-plans/${existingPlanId}`, foodsData);
      console.log(`✅ Foods update: ${foodsResponse.data.success}`);
    } catch (foodsError) {
      console.log(`❌ Foods update failed: ${foodsError.response?.status}`);
      console.log(`   Error: ${JSON.stringify(foodsError.response?.data, null, 2)}`);
    }

    // Test 4: Test with all required fields
    console.log('\n4. Testing with all required fields...');
    const completeData = {
      name: "Meal 1",
      description: "Complete test",
      userId: testUserId,
      dietType: "Muscle Building",
      isActive: true,
      totalDailyCalories: 100,
      meals: [
        {
          name: "Breakfast",
          time: "Breakfast",
          instructions: "Complete breakfast",
          totalCalories: 100,
          foods: [
            {
              foodName: "Complete Food",
              quantity: 1,
              unit: "piece"
            }
          ]
        }
      ]
    };

    try {
      const completeResponse = await axios.put(`${BASE_URL}/diet-plans/${existingPlanId}`, completeData);
      console.log(`✅ Complete update: ${completeResponse.data.success}`);
    } catch (completeError) {
      console.log(`❌ Complete update failed: ${completeError.response?.status}`);
      console.log(`   Error: ${JSON.stringify(completeError.response?.data, null, 2)}`);
    }

  } catch (error) {
    console.error('❌ General error:', error.message);
  }
}

testMealsValidation();