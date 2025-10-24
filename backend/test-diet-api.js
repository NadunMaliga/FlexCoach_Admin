const mongoose = require('mongoose');
const Diet = require('./models/Diet');
const Food = require('./models/Food');

// Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/fitnessapp');

async function testDietAPI() {
    try {
        console.log('Testing diet plan API...');
        
        // Test user ID from previous script
        const testUserId = '68e8fd08e8d1859ebd9edd05';
        
        console.log('Searching for diet plans for user:', testUserId);
        
        const dietPlans = await Diet.find({ userId: testUserId, isActive: true })
            .populate('meals.foods.food', 'name category')
            .sort({ createdAt: -1 });
        
        console.log('Found diet plans:', dietPlans.length);
        
        dietPlans.forEach((plan, index) => {
            console.log(`\nDiet Plan ${index + 1}:`);
            console.log(`- Name: ${plan.name}`);
            console.log(`- Type: ${plan.dietType}`);
            console.log(`- Meals: ${plan.meals.length}`);
            
            plan.meals.forEach((meal, mealIndex) => {
                console.log(`  Meal ${mealIndex + 1}: ${meal.name} (${meal.time}) - ${meal.totalCalories} calories`);
                meal.foods.forEach(food => {
                    console.log(`    - ${food.foodName}: ${food.quantity}${food.unit}`);
                });
            });
        });
        
    } catch (error) {
        console.error('Error testing diet API:', error);
    } finally {
        mongoose.connection.close();
    }
}

testDietAPI();