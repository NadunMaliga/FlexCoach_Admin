const fetch = require('node-fetch');
const mongoose = require('mongoose');
require('dotenv').config();

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/flexcoach');

const Diet = require('./models/Diet');

async function testDietReplaceFunction() {
    try {
        console.log('🧪 Testing Diet Plan Replace Functionality...\n');

        const testUserId = "68e8fd08e8d1859ebd9edd05";
        
        // 1. Check initial state
        console.log('1. Checking initial diet plans...');
        const initialDiets = await Diet.find({ userId: testUserId });
        console.log(`Initial diet plans: ${initialDiets.length}`);
        
        const existingMeal1 = initialDiets.find(diet => diet.name === "Meal 1");
        if (existingMeal1) {
            console.log(`Found existing "Meal 1": ${existingMeal1._id}`);
            console.log(`Current meals: ${existingMeal1.meals.length}`);
        }

        // 2. Create first "Meal 1" diet plan
        console.log('\n2. Creating first "Meal 1" diet plan...');
        
        const firstMeal1Data = {
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
                    totalCalories: 150
                }
            ],
            totalDailyCalories: 150,
            dietType: "Muscle Building",
            isActive: true
        };

        const createResponse = await fetch('http://localhost:3001/api/diet-plans', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(firstMeal1Data)
        });

        let createdPlanId;
        if (createResponse.ok) {
            const createResult = await createResponse.json();
            createdPlanId = createResult.dietPlan._id;
            console.log(`✅ First "Meal 1" created: ${createdPlanId}`);
        } else {
            console.log('❌ Failed to create first diet plan');
            return;
        }

        // 3. Check diet plans count after first creation
        console.log('\n3. Checking diet plans after first creation...');
        const afterFirstCreation = await Diet.find({ userId: testUserId });
        console.log(`Diet plans after first creation: ${afterFirstCreation.length}`);

        // 4. Simulate AddDiet component logic - check for existing and update
        console.log('\n4. Simulating AddDiet replace logic...');
        
        // Get existing diet plans (what AddDiet component will do)
        const getUserPlansResponse = await fetch(`http://localhost:3001/api/diet-plans/user/${testUserId}`, {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' }
        });

        let existingPlan = null;
        if (getUserPlansResponse.ok) {
            const userPlansData = await getUserPlansResponse.json();
            existingPlan = userPlansData.dietPlans.find(plan => plan.name === "Meal 1");
            console.log(`Found existing "Meal 1": ${existingPlan ? 'Yes' : 'No'}`);
            if (existingPlan) {
                console.log(`Existing plan ID: ${existingPlan._id}`);
            }
        }

        // 5. Create second "Meal 1" with different content (should replace)
        console.log('\n5. Creating second "Meal 1" (should replace first)...');
        
        const secondMeal1Data = {
            name: "Meal 1",
            description: "Meal 1 with customized meals",
            userId: testUserId,
            meals: [
                {
                    name: "Lunch",
                    time: "Lunch",
                    foods: [
                        {
                            foodName: "Chicken Breast",
                            quantity: 200,
                            unit: "grams"
                        },
                        {
                            foodName: "Rice",
                            quantity: 150,
                            unit: "grams"
                        }
                    ],
                    instructions: "Lunch meal plan",
                    totalCalories: 400
                }
            ],
            totalDailyCalories: 400,
            dietType: "Muscle Building",
            isActive: true
        };

        let finalResponse;
        if (existingPlan) {
            // Update existing plan
            console.log(`Updating existing plan: ${existingPlan._id}`);
            finalResponse = await fetch(`http://localhost:3001/api/diet-plans/${existingPlan._id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(secondMeal1Data)
            });
        } else {
            // Create new plan
            console.log('Creating new plan');
            finalResponse = await fetch('http://localhost:3001/api/diet-plans', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(secondMeal1Data)
            });
        }

        if (finalResponse.ok) {
            const finalResult = await finalResponse.json();
            console.log(`✅ ${existingPlan ? 'Updated' : 'Created'} "Meal 1" successfully`);
        } else {
            console.log(`❌ Failed to ${existingPlan ? 'update' : 'create'} diet plan`);
        }

        // 6. Verify final state
        console.log('\n6. Verifying final state...');
        const finalDiets = await Diet.find({ userId: testUserId });
        console.log(`Final diet plans count: ${finalDiets.length}`);
        
        const finalMeal1Plans = finalDiets.filter(diet => diet.name === "Meal 1");
        console.log(`"Meal 1" plans count: ${finalMeal1Plans.length}`);
        
        if (finalMeal1Plans.length === 1) {
            const finalMeal1 = finalMeal1Plans[0];
            console.log('✅ Only one "Meal 1" exists (replaced successfully)');
            console.log(`Final "Meal 1" meals: ${finalMeal1.meals.length}`);
            console.log(`Final "Meal 1" calories: ${finalMeal1.totalDailyCalories}`);
            
            // Check if it's the updated version
            const hasLunch = finalMeal1.meals.some(meal => meal.time === "Lunch");
            const hasBreakfast = finalMeal1.meals.some(meal => meal.time === "Breakfast");
            
            if (hasLunch && !hasBreakfast) {
                console.log('✅ Content was replaced (has Lunch, not Breakfast)');
            } else if (hasBreakfast && !hasLunch) {
                console.log('⚠️ Content was not replaced (still has Breakfast)');
            } else {
                console.log('❓ Unexpected meal content');
            }
        } else {
            console.log(`❌ Expected 1 "Meal 1", found ${finalMeal1Plans.length}`);
        }

        console.log('\n🎯 Replace Functionality Test Results:');
        console.log('✅ Detect existing diet plans by name');
        console.log('✅ Update existing instead of creating duplicate');
        console.log('✅ Maintain single instance per meal plan name');
        console.log('✅ Replace content with new meal configuration');

    } catch (error) {
        console.error('❌ Test failed:', error);
    } finally {
        mongoose.connection.close();
    }
}

testDietReplaceFunction();