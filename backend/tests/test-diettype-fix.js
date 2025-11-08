const axios = require('axios');

const BASE_URL = 'http://localhost:3001/api';
const testUserId = "68e8fd08e8d1859ebd9edd05";
const existingPlanId = "68e94697f645c13ca10e81eb";

async function testDietTypeFix() {
  console.log('🧪 Testing DietType Fix...\n');

  try {
    // Test with the corrected dietType values
    console.log('1. Testing with Muscle Building...');
    const testData = {
      name: "Meal 1",
      description: "Testing dietType fix",
      userId: testUserId,
      dietType: "Muscle Building", // This should now work
      isActive: true,
      totalDailyCalories: 100,
      meals: [
        {
          name: "Breakfast",
          time: "Breakfast",
          instructions: "Test breakfast",
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

    const response = await axios.put(`${BASE_URL}/diet-plans/${existingPlanId}`, testData);
    console.log(`✅ Update successful: ${response.data.success}`);

    // Test all diet types
    const dietTypes = ['Weight Loss', 'Weight Gain', 'Muscle Building', 'Maintenance', 'Athletic Performance'];
    
    console.log('\n2. Testing all diet types...');
    for (const dietType of dietTypes) {
      try {
        const testResponse = await axios.put(`${BASE_URL}/diet-plans/${existingPlanId}`, {
          ...testData,
          dietType: dietType,
          description: `Testing ${dietType}`
        });
        console.log(`✅ ${dietType}: ${testResponse.data.success}`);
      } catch (error) {
        console.log(`❌ ${dietType} failed: ${error.response?.status}`);
        console.log(`   Error: ${JSON.stringify(error.response?.data, null, 2)}`);
      }
    }

    console.log('\n3. Testing exact AddDiet component data structure...');
    // Simulate exact data from AddDiet component
    const addDietData = {
      name: "Meal 1",
      description: "Meal 1 with customized meals",
      userId: testUserId,
      meals: [
        {
          name: "Breakfast",
          time: "Breakfast",
          foods: [
            {
              foodName: "Eggs",
              quantity: 2,
              unit: "pieces"
            }
          ],
          instructions: "Breakfast meal plan",
          totalCalories: 2
        }
      ],
      totalDailyCalories: 2,
      dietType: "Muscle Building",
      isActive: true
    };

    const addDietResponse = await axios.put(`${BASE_URL}/diet-plans/${existingPlanId}`, addDietData);
    console.log(`✅ AddDiet structure: ${addDietResponse.data.success}`);

  } catch (error) {
    console.error('❌ Error:', error.response?.data || error.message);
  }
}

testDietTypeFix();