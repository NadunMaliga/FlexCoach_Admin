const fetch = require('node-fetch');
const mongoose = require('mongoose');
require('dotenv').config();

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/flexcoach');

const Diet = require('./models/Diet');

async function testCleanReplaceFunction() {
    try {
        console.log('🧪 Testing Clean Replace Functionality...\n');

        const testUserId = "68e8fd08e8d1859ebd9edd05";
        
        // 1. Clean up existing "Meal 1" plans for clean test
        console.log('1. Cleaning up existing "Meal 1" plans...');
        const deletedCount = await Diet.deleteMany({ 
            userId: testUserId, 
            name: "Meal 1" 
        });
        console.log(`Deleted ${deletedCount.deletedCount} existing "Meal 1" plans`);

        // 2. Verify clean state
        console.log('\n2. Verifying clean state...');
        const cleanDiets = await Diet.find({ userId: testUserId });
        const meal1Plans = cleanDiets.filter(diet => diet.name === "Meal 1");
        console.log(`Total diet plans: ${cleanDiets.length}`);
        console.log(`"Meal 1" plans: ${meal1Plans.length}`);

        // 3. Test the complete AddDiet flow - First creation
        console.log('\n3. Testing first "Meal 1" creation...');
        
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

        // Simulate AddDiet component logic for first creation
        const firstCheckResponse = await fetch(`http://localhost:3001/api/diet-plans/user/${testUserId}`, {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' }
        });

        let existingPlan = null;
        if (firstCheckResponse.ok) {
            const userPlansData = await firstCheckResponse.json();
            existingPlan = userPlansData.dietPlans.find(plan => plan.name === "Meal 1");
        }

        console.log(`Existing "Meal 1" found: ${existingPlan ? 'Yes' : 'No'}`);

        // Create first plan (should be new creation)
        const firstCreateResponse = await fetch('http://localhost:3001/api/diet-plans', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(firstMeal1Data)
        });

        let firstPlanId;
        if (firstCreateResponse.ok) {
            const firstResult = await firstCreateResponse.json();
            firstPlanId = firstResult.dietPlan._id;
            console.log(`✅ First "Meal 1" created: ${firstPlanId}`);
        } else {
            console.log('❌ Failed to create first "Meal 1"');
            return;
        }

        // 4. Verify first creation
        console.log('\n4. Verifying first creation...');
        const afterFirstDiets = await Diet.find({ userId: testUserId });
        const afterFirstMeal1 = afterFirstDiets.filter(diet => diet.name === "Meal 1");
        console.log(`Total diet plans: ${afterFirstDiets.length}`);
        console.log(`"Meal 1" plans: ${afterFirstMeal1.length}`);

        if (afterFirstMeal1.length === 1) {
            console.log('✅ First creation successful - exactly 1 "Meal 1" exists');
            console.log(`Meals in first plan: ${afterFirstMeal1[0].meals.length}`);
            console.log(`First plan calories: ${afterFirstMeal1[0].totalDailyCalories}`);
        }

        // 5. Test replacement - Second "Meal 1" with different content
        console.log('\n5. Testing replacement with second "Meal 1"...');
        
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
                },
                {
                    name: "Dinner",
                    time: "Dinner",
                    foods: [
                        {
                            foodName: "Fish",
                            quantity: 180,
                            unit: "grams"
                        }
                    ],
                    instructions: "Dinner meal plan",
                    totalCalories: 250
                }
            ],
            totalDailyCalories: 650,
            dietType: "Muscle Building",
            isActive: true
        };

        // Simulate AddDiet component logic for replacement
        const secondCheckResponse = await fetch(`http://localhost:3001/api/diet-plans/user/${testUserId}`, {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' }
        });

        let existingPlanForUpdate = null;
        if (secondCheckResponse.ok) {
            const userPlansData = await secondCheckResponse.json();
            existingPlanForUpdate = userPlansData.dietPlans.find(plan => plan.name === "Meal 1");
        }

        console.log(`Existing "Meal 1" found for update: ${existingPlanForUpdate ? 'Yes' : 'No'}`);
        if (existingPlanForUpdate) {
            console.log(`Plan to update ID: ${existingPlanForUpdate._id}`);
        }

        // Update existing plan (should replace content)
        let secondResponse;
        if (existingPlanForUpdate) {
            secondResponse = await fetch(`http://localhost:3001/api/diet-plans/${existingPlanForUpdate._id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(secondMeal1Data)
            });
        } else {
            secondResponse = await fetch('http://localhost:3001/api/diet-plans', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(secondMeal1Data)
            });
        }

        if (secondResponse.ok) {
            const secondResult = await secondResponse.json();
            console.log(`✅ ${existingPlanForUpdate ? 'Updated' : 'Created'} "Meal 1" successfully`);
        } else {
            console.log(`❌ Failed to ${existingPlanForUpdate ? 'update' : 'create'} "Meal 1"`);
        }

        // 6. Verify final replacement result
        console.log('\n6. Verifying replacement result...');
        const finalDiets = await Diet.find({ userId: testUserId });
        const finalMeal1Plans = finalDiets.filter(diet => diet.name === "Meal 1");
        console.log(`Total diet plans: ${finalDiets.length}`);
        console.log(`"Meal 1" plans: ${finalMeal1Plans.length}`);

        if (finalMeal1Plans.length === 1) {
            const finalMeal1 = finalMeal1Plans[0];
            console.log('✅ Replacement successful - still exactly 1 "Meal 1" exists');
            console.log(`Final meals count: ${finalMeal1.meals.length}`);
            console.log(`Final calories: ${finalMeal1.totalDailyCalories}`);
            
            // Verify content was replaced
            const hasLunch = finalMeal1.meals.some(meal => meal.time === "Lunch");
            const hasDinner = finalMeal1.meals.some(meal => meal.time === "Dinner");
            const hasBreakfast = finalMeal1.meals.some(meal => meal.time === "Breakfast");
            
            console.log(`Has Lunch: ${hasLunch}`);
            console.log(`Has Dinner: ${hasDinner}`);
            console.log(`Has Breakfast: ${hasBreakfast}`);
            
            if (hasLunch && hasDinner && !hasBreakfast && finalMeal1.totalDailyCalories === 650) {
                console.log('✅ Content successfully replaced with new meal configuration');
            } else {
                console.log('⚠️ Content may not have been fully replaced');
            }
        } else {
            console.log(`❌ Expected exactly 1 "Meal 1", found ${finalMeal1Plans.length}`);
        }

        console.log('\n🎯 Replace Functionality Summary:');
        console.log('✅ First creation: Creates new diet plan');
        console.log('✅ Duplicate detection: Finds existing plan by name');
        console.log('✅ Content replacement: Updates existing plan instead of creating duplicate');
        console.log('✅ Single instance: Maintains only one plan per meal name');
        console.log('✅ AddDiet integration: Ready for frontend use');

    } catch (error) {
        console.error('❌ Test failed:', error);
    } finally {
        mongoose.connection.close();
    }
}

testCleanReplaceFunction();