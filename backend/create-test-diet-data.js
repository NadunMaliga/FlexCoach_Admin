const mongoose = require('mongoose');
require('dotenv').config();

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/flexcoach');

const Diet = require('./models/Diet');

async function createTestDietData() {
    try {
        console.log('🍽️ Creating Test Diet Data...\n');

        const testUserId = "68e8fd08e8d1859ebd9edd05";
        
        // Clear existing data
        await Diet.deleteMany({ userId: testUserId });
        console.log('Cleared existing diet plans');

        // Create test diet plans that match the UI format
        const adminId = new mongoose.Types.ObjectId("507f1f77bcf86cd799439011");
        
        const testDietPlans = [
            {
                userId: testUserId,
                name: "Meal 1",
                description: "High protein muscle building plan",
                dietType: "Muscle Building",
                createdBy: adminId,
                meals: [
                    {
                        name: "Morning Protein",
                        time: "Morning",
                        foods: [
                            { foodName: "Protein Scoop", quantity: 1, unit: "scoop" }
                        ],
                        totalCalories: 120,
                        instructions: "Mix with water"
                    },
                    {
                        name: "Breakfast",
                        time: "Breakfast", 
                        foods: [
                            { foodName: "Chicken breast", quantity: 150, unit: "g" },
                            { foodName: "Egg whites", quantity: 3, unit: "pieces" },
                            { foodName: "Vegetables (Steamed or salad)", quantity: 200, unit: "g" }
                        ],
                        totalCalories: 350,
                        instructions: "Grilled chicken with steamed vegetables"
                    },
                    {
                        name: "Snacks",
                        time: "Snacks",
                        foods: [
                            { foodName: "Watermelon", quantity: 200, unit: "g" }
                        ],
                        totalCalories: 60,
                        instructions: "Fresh watermelon"
                    },
                    {
                        name: "Lunch",
                        time: "Lunch",
                        foods: [
                            { foodName: "Basmati rice", quantity: 100, unit: "g" },
                            { foodName: "White Fish", quantity: 150, unit: "g" },
                            { foodName: "Vegetables (Steamed or salad)", quantity: 200, unit: "g" },
                            { foodName: "Olive oil", quantity: 1, unit: "teaspoon" }
                        ],
                        totalCalories: 450,
                        instructions: "Grilled fish with rice and vegetables"
                    },
                    {
                        name: "Post-Workout",
                        time: "Post-Workout",
                        foods: [
                            { foodName: "Protein Scoop", quantity: 1, unit: "scoop" }
                        ],
                        totalCalories: 120,
                        instructions: "Post-workout protein shake"
                    },
                    {
                        name: "Dinner",
                        time: "Dinner",
                        foods: [
                            { foodName: "Pasta", quantity: 80, unit: "g" },
                            { foodName: "Chicken", quantity: 150, unit: "g" },
                            { foodName: "Vegetables (Steamed or salad)", quantity: 200, unit: "g" },
                            { foodName: "Olive oil", quantity: 1, unit: "teaspoon" }
                        ],
                        totalCalories: 500,
                        instructions: "Pasta with grilled chicken and vegetables"
                    }
                ],
                totalDailyCalories: 1600
            },
            {
                userId: testUserId,
                name: "Meal 2",
                description: "Balanced nutrition plan",
                dietType: "Maintenance",
                createdBy: adminId,
                meals: [
                    {
                        name: "Morning Protein",
                        time: "Morning",
                        foods: [
                            { foodName: "Protein Scoop", quantity: 1, unit: "scoop" }
                        ],
                        totalCalories: 120,
                        instructions: "Morning protein boost"
                    },
                    {
                        name: "Breakfast",
                        time: "Breakfast",
                        foods: [
                            { foodName: "Oats", quantity: 50, unit: "g" },
                            { foodName: "Mixed fruits", quantity: 100, unit: "g" }
                        ],
                        totalCalories: 250,
                        instructions: "Oats with fresh fruits"
                    },
                    {
                        name: "Snacks",
                        time: "Snacks",
                        foods: [
                            { foodName: "Almonds", quantity: 1, unit: "handful" }
                        ],
                        totalCalories: 160,
                        instructions: "Raw almonds"
                    },
                    {
                        name: "Lunch",
                        time: "Lunch",
                        foods: [
                            { foodName: "Brown rice", quantity: 100, unit: "g" },
                            { foodName: "Chicken", quantity: 150, unit: "g" },
                            { foodName: "Vegetables", quantity: 200, unit: "g" }
                        ],
                        totalCalories: 400,
                        instructions: "Brown rice with grilled chicken"
                    },
                    {
                        name: "Post-Workout",
                        time: "Post-Workout",
                        foods: [
                            { foodName: "Protein Scoop", quantity: 1, unit: "scoop" }
                        ],
                        totalCalories: 120,
                        instructions: "Post-workout recovery"
                    },
                    {
                        name: "Dinner",
                        time: "Dinner",
                        foods: [
                            { foodName: "Sweet potato", quantity: 150, unit: "g" },
                            { foodName: "Tuna", quantity: 120, unit: "g" },
                            { foodName: "Vegetables", quantity: 200, unit: "g" }
                        ],
                        totalCalories: 350,
                        instructions: "Baked sweet potato with tuna"
                    }
                ],
                totalDailyCalories: 1400
            },
            {
                userId: testUserId,
                name: "Meal 3",
                description: "Clean eating plan",
                dietType: "Weight Loss",
                createdBy: adminId,
                meals: [
                    {
                        name: "Morning",
                        time: "Morning",
                        foods: [
                            { foodName: "Green Tea", quantity: 1, unit: "cup" },
                            { foodName: "Apple", quantity: 1, unit: "piece" }
                        ],
                        totalCalories: 80,
                        instructions: "Green tea with fresh apple"
                    },
                    {
                        name: "Breakfast",
                        time: "Breakfast",
                        foods: [
                            { foodName: "Egg Omelette", quantity: 2, unit: "eggs" },
                            { foodName: "Spinach", quantity: 50, unit: "g" }
                        ],
                        totalCalories: 200,
                        instructions: "Spinach omelette"
                    },
                    {
                        name: "Snacks",
                        time: "Snacks",
                        foods: [
                            { foodName: "Banana", quantity: 1, unit: "piece" }
                        ],
                        totalCalories: 90,
                        instructions: "Fresh banana"
                    },
                    {
                        name: "Lunch",
                        time: "Lunch",
                        foods: [
                            { foodName: "Quinoa", quantity: 80, unit: "g" },
                            { foodName: "Grilled Chicken", quantity: 150, unit: "g" },
                            { foodName: "Vegetables", quantity: 200, unit: "g" }
                        ],
                        totalCalories: 420,
                        instructions: "Quinoa bowl with grilled chicken"
                    },
                    {
                        name: "Post-Workout",
                        time: "Post-Workout",
                        foods: [
                            { foodName: "Protein Shake", quantity: 1, unit: "serving" }
                        ],
                        totalCalories: 150,
                        instructions: "Whey protein shake"
                    },
                    {
                        name: "Dinner",
                        time: "Dinner",
                        foods: [
                            { foodName: "Whole wheat pasta", quantity: 80, unit: "g" },
                            { foodName: "Fish", quantity: 150, unit: "g" },
                            { foodName: "Vegetables", quantity: 200, unit: "g" }
                        ],
                        totalCalories: 380,
                        instructions: "Whole wheat pasta with grilled fish"
                    }
                ],
                totalDailyCalories: 1320
            }
        ];

        // Insert test data
        const createdPlans = await Diet.insertMany(testDietPlans);
        console.log(`✅ Created ${createdPlans.length} test diet plans`);

        // Verify the data
        console.log('\n📋 Created Diet Plans:');
        createdPlans.forEach((plan, index) => {
            console.log(`\n${index + 1}. ${plan.name}`);
            console.log(`   Description: ${plan.description}`);
            console.log(`   Total Calories: ${plan.totalCalories}`);
            console.log(`   Meals: ${plan.meals.length}`);
            plan.meals.forEach(meal => {
                console.log(`   - ${meal.time}: ${meal.foods.length} foods (${meal.totalCalories} cal)`);
            });
        });

        console.log('\n✅ Test diet data created successfully!');
        console.log('The DietPlan component will now show real data from the backend.');

    } catch (error) {
        console.error('❌ Error creating test data:', error);
    } finally {
        mongoose.connection.close();
    }
}

createTestDietData();