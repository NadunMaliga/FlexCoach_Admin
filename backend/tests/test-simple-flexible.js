const mongoose = require('mongoose');
const Diet = require('./models/Diet');

// Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/flexcoach', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

async function testSimpleFlexible() {
  console.log('🧪 Testing Simple Flexible Quantity Direct to Database...\n');

  try {
    // Test creating a diet plan directly with the database
    const testDietPlan = new Diet({
      name: "Test Flexible Direct",
      description: "Testing flexible quantities directly",
      userId: "68e8fd08e8d1859ebd9edd05",
      meals: [
        {
          name: "Breakfast",
          time: "Breakfast",
          foods: [
            {
              foodName: "Eggs",
              quantity: "3 pieces", // String quantity
              unit: "" // Empty unit
            }
          ],
          instructions: "Test meal",
          totalCalories: 3
        }
      ],
      totalDailyCalories: 3,
      dietType: "Muscle Building",
      isActive: true,
      createdBy: "68e8fd08e8d1859ebd9edd05"
    });

    console.log('1. Attempting to save diet plan with flexible quantity...');
    
    const savedPlan = await testDietPlan.save();
    
    console.log('✅ Successfully saved!');
    console.log(`Plan ID: ${savedPlan._id}`);
    console.log('Saved food data:');
    savedPlan.meals[0].foods.forEach(food => {
      console.log(`  - ${food.foodName}: "${food.quantity}" (type: ${typeof food.quantity})`);
    });

    // Clean up
    await Diet.findByIdAndDelete(savedPlan._id);
    console.log('✅ Test plan cleaned up');

  } catch (error) {
    console.error('❌ Error during direct database test:', error);
    if (error.errors) {
      console.error('Validation errors:');
      Object.keys(error.errors).forEach(key => {
        console.error(`  ${key}: ${error.errors[key].message}`);
      });
    }
  } finally {
    mongoose.connection.close();
  }
}

testSimpleFlexible();