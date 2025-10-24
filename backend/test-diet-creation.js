const mongoose = require('mongoose');
const Diet = require('./models/Diet');
const User = require('./models/User');

// Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/fitnessapp');

async function testDietCreation() {
    try {
        console.log('Testing diet plan creation...');
        
        // Use the existing test user
        const testUserId = '68e8fd08e8d1859ebd9edd05';
        
        // Test the exact data structure from the frontend
        const dietPlanData = {
            name: "Weight Loss Plan",
            description: "Weight Loss Plan with customized meals",
            userId: testUserId, // This needs to be ObjectId
            meals: [
                {
                    name: "Breakfast",
                    time: "Breakfast",
                    foods: [
                        {
                            foodName: "Oats",
                            quantity: 100,
                            unit: "grams"
                        }
                    ],
                    instructions: "Breakfast meal plan",
                    totalCalories: 300
                }
            ],
            totalDailyCalories: 300,
            dietType: "Weight Loss",
            isActive: true,
            createdBy: testUserId // This also needs to be ObjectId
        };

        console.log('Creating diet plan with data:', JSON.stringify(dietPlanData, null, 2));

        // Test direct creation
        const dietPlan = new Diet(dietPlanData);
        await dietPlan.save();

        console.log('Diet plan created successfully:', dietPlan._id);

    } catch (error) {
        console.error('Diet creation error:', error);
        
        if (error.errors) {
            console.log('Validation errors:');
            Object.keys(error.errors).forEach(key => {
                console.log(`- ${key}: ${error.errors[key].message}`);
            });
        }
    } finally {
        mongoose.connection.close();
    }
}

testDietCreation();