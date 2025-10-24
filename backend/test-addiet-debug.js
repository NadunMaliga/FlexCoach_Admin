const mongoose = require('mongoose');
const Diet = require('./models/Diet');

// Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/flexcoach', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const testUserId = "68e8fd08e8d1859ebd9edd05";

async function testAddDietFlow() {
  console.log('🧪 Testing AddDiet Flow...\n');

  try {
    // 1. Check existing diet plans for user
    console.log('1. Checking existing diet plans...');
    const existingPlans = await Diet.find({ userId: testUserId });
    console.log(`Found ${existingPlans.length} existing plans:`);
    existingPlans.forEach(plan => {
      console.log(`  - ${plan.name} (ID: ${plan._id})`);
      console.log(`    Meals: ${plan.meals.length}`);
      plan.meals.forEach(meal => {
        console.log(`      * ${meal.name}: ${meal.foods.length} foods`);
        meal.foods.forEach(food => {
          console.log(`        - ${food.foodName}: ${food.quantity}${food.unit}`);
        });
      });
    });

    // 2. Simulate creating a new diet plan (like from AddDiet component)
    console.log('\n2. Simulating new diet plan creation...');
    
    const testDietPlan = {
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
              unit: "grams"
            },
            {
              foodName: "Oats",
              quantity: 50,
              unit: "grams"
            }
          ],
          instructions: "Breakfast meal plan",
          totalCalories: 52
        },
        {
          name: "Lunch",
          time: "Lunch", 
          foods: [
            {
              foodName: "Chicken Breast",
              quantity: 150,
              unit: "grams"
            },
            {
              foodName: "Rice",
              quantity: 100,
              unit: "grams"
            }
          ],
          instructions: "Lunch meal plan",
          totalCalories: 250
        }
      ],
      totalDailyCalories: 302,
      dietType: "Muscle Building",
      isActive: true
    };

    console.log('Test diet plan data:');
    console.log(JSON.stringify(testDietPlan, null, 2));

    // 3. Check if Meal 1 already exists
    const existingMeal1 = await Diet.findOne({ 
      userId: testUserId, 
      name: "Meal 1" 
    });

    if (existingMeal1) {
      console.log('\n3. Meal 1 exists - UPDATING...');
      console.log(`Existing Meal 1 ID: ${existingMeal1._id}`);
      
      const updated = await Diet.findByIdAndUpdate(
        existingMeal1._id,
        testDietPlan,
        { new: true, runValidators: true }
      );
      
      console.log('✅ Updated successfully!');
      console.log(`Updated plan has ${updated.meals.length} meals`);
      
    } else {
      console.log('\n3. Meal 1 does not exist - CREATING...');
      
      const newPlan = new Diet(testDietPlan);
      const saved = await newPlan.save();
      
      console.log('✅ Created successfully!');
      console.log(`New plan ID: ${saved._id}`);
      console.log(`New plan has ${saved.meals.length} meals`);
    }

    // 4. Verify the final state
    console.log('\n4. Final verification...');
    const finalPlans = await Diet.find({ userId: testUserId });
    console.log(`Total plans for user: ${finalPlans.length}`);
    
    const meal1Plan = finalPlans.find(plan => plan.name === "Meal 1");
    if (meal1Plan) {
      console.log('\n📋 Current Meal 1 contents:');
      console.log(`  Name: ${meal1Plan.name}`);
      console.log(`  Diet Type: ${meal1Plan.dietType}`);
      console.log(`  Total Calories: ${meal1Plan.totalDailyCalories}`);
      console.log(`  Meals: ${meal1Plan.meals.length}`);
      
      meal1Plan.meals.forEach((meal, idx) => {
        console.log(`    ${idx + 1}. ${meal.name} (${meal.time})`);
        console.log(`       Calories: ${meal.totalCalories}`);
        console.log(`       Foods: ${meal.foods.length}`);
        meal.foods.forEach(food => {
          console.log(`         - ${food.foodName}: ${food.quantity} ${food.unit}`);
        });
      });
    }

  } catch (error) {
    console.error('❌ Error during test:', error);
  } finally {
    mongoose.connection.close();
  }
}

testAddDietFlow();