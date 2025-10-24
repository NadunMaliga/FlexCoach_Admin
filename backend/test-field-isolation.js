const axios = require('axios');

const BASE_URL = 'http://localhost:3001/api';
const testUserId = "68e8fd08e8d1859ebd9edd05";
const existingPlanId = "68e94697f645c13ca10e81eb";

async function testFieldIsolation() {
  console.log('🧪 Testing Individual Fields...\n');

  const baseData = {
    name: "Meal 1",
    description: "Field isolation test",
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

  try {
    // Test each additional field one by one
    const fieldsToTest = [
      { field: 'userId', value: testUserId },
      { field: 'dietType', value: 'Muscle Building' },
      { field: 'isActive', value: true },
      { field: 'totalDailyCalories', value: 100 }
    ];

    for (const { field, value } of fieldsToTest) {
      console.log(`Testing with ${field}...`);
      
      const testData = {
        ...baseData,
        [field]: value
      };

      try {
        const response = await axios.put(`${BASE_URL}/diet-plans/${existingPlanId}`, testData);
        console.log(`✅ ${field}: ${response.data.success}`);
      } catch (error) {
        console.log(`❌ ${field} failed: ${error.response?.status}`);
        console.log(`   Error: ${JSON.stringify(error.response?.data, null, 2)}`);
        
        // If this field caused the error, let's not test the rest with it
        break;
      }
    }

    // Test with combinations
    console.log('\n🔄 Testing combinations...');
    
    // Test userId + dietType
    console.log('Testing userId + dietType...');
    try {
      const combo1 = await axios.put(`${BASE_URL}/diet-plans/${existingPlanId}`, {
        ...baseData,
        userId: testUserId,
        dietType: 'Muscle Building'
      });
      console.log(`✅ userId + dietType: ${combo1.data.success}`);
    } catch (error) {
      console.log(`❌ userId + dietType failed: ${error.response?.status}`);
      console.log(`   Error: ${JSON.stringify(error.response?.data, null, 2)}`);
    }

  } catch (error) {
    console.error('❌ General error:', error.message);
  }
}

testFieldIsolation();