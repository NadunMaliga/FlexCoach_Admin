const mongoose = require('mongoose');
const Diet = require('./models/Diet');
const User = require('./models/User');
const Food = require('./models/Food');

// Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/fitnessapp', {
    useNewUrlParser: true,
    useUnifiedTopology: true
});

async function createTestDietPlans() {
    try {
        console.log('Creating test diet plans...');

        // Find a test user (or create one)
        let testUser = await User.findOne({ email: 'test@example.com' });
        if (!testUser) {
            testUser = new User({
                firstName: 'Test',
                lastName: 'User',
                email: 'test@example.com',
                mobile: '+1234567890',
                birthday: new Date('1990-01-01'),
                gender: 'Male',
                trainingMode: 'Online',
                isApproved: true,
                onboardingCompleted: true,
                status: 'approved'
            });
            await testUser.save();
            console.log('Created test user:', testUser._id);
        }

        // Find or create some test foods
        let oatmeal = await Food.findOne({ name: 'Oatmeal' });
        if (!oatmeal) {
            oatmeal = new Food({
                name: 'Oatmeal',
                category: 'Carbohydrates',
                nutritionPer100g: {
                    calories: 389,
                    protein: 16.9,
                    carbs: 66.3,
                    fat: 6.9
                },
                createdBy: testUser._id
            });
            await oatmeal.save();
        }

        let chicken = await Food.findOne({ name: 'Grilled Chicken Breast' });
        if (!chicken) {
            chicken = new Food({
                name: 'Grilled Chicken Breast',
                category: 'Protein',
                nutritionPer100g: {
                    calories: 165,
                    protein: 31,
                    carbs: 0,
                    fat: 3.6
                },
                createdBy: testUser._id
            });
            await chicken.save();
        }

        let salmon = await Food.findOne({ name: 'Salmon' });
        if (!salmon) {
            salmon = new Food({
                name: 'Salmon',
                category: 'Protein',
                nutritionPer100g: {
                    calories: 208,
                    protein: 25.4,
                    carbs: 0,
                    fat: 12.4
                },
                createdBy: testUser._id
            });
            await salmon.save();
        }

        let yogurt = await Food.findOne({ name: 'Greek Yogurt' });
        if (!yogurt) {
            yogurt = new Food({
                name: 'Greek Yogurt',
                category: 'Dairy',
                nutritionPer100g: {
                    calories: 59,
                    protein: 10,
                    carbs: 3.6,
                    fat: 0.4
                },
                createdBy: testUser._id
            });
            await yogurt.save();
        }

        // Create a comprehensive diet plan
        const dietPlan = new Diet({
            name: 'Weight Loss Plan',
            description: 'A balanced diet plan for healthy weight loss',
            userId: testUser._id,
            dietType: 'Weight Loss',
            meals: [
                {
                    name: 'Breakfast',
                    time: 'Breakfast',
                    foods: [
                        {
                            food: oatmeal._id,
                            foodName: 'Oatmeal with Fruits',
                            quantity: 100,
                            unit: 'grams'
                        }
                    ],
                    instructions: 'Mix oatmeal with fresh fruits and a little honey',
                    totalCalories: 300
                },
                {
                    name: 'Lunch',
                    time: 'Lunch',
                    foods: [
                        {
                            food: chicken._id,
                            foodName: 'Grilled Chicken Salad',
                            quantity: 150,
                            unit: 'grams'
                        }
                    ],
                    instructions: 'Serve with mixed greens and light dressing',
                    totalCalories: 450
                },
                {
                    name: 'Dinner',
                    time: 'Dinner',
                    foods: [
                        {
                            food: salmon._id,
                            foodName: 'Salmon with Vegetables',
                            quantity: 120,
                            unit: 'grams'
                        }
                    ],
                    instructions: 'Baked salmon with steamed vegetables',
                    totalCalories: 400
                },
                {
                    name: 'Snack',
                    time: 'Snacks',
                    foods: [
                        {
                            food: yogurt._id,
                            foodName: 'Greek Yogurt',
                            quantity: 200,
                            unit: 'grams'
                        }
                    ],
                    instructions: 'Plain Greek yogurt with berries',
                    totalCalories: 150
                }
            ],
            totalDailyCalories: 1300,
            createdBy: testUser._id, // Using user as admin for testing
            isActive: true
        });

        await dietPlan.save();
        console.log('Created diet plan:', dietPlan._id);

        // Create another diet plan for variety
        const muscleGainPlan = new Diet({
            name: 'Muscle Building Plan',
            description: 'High protein diet for muscle building',
            userId: testUser._id,
            dietType: 'Muscle Building',
            meals: [
                {
                    name: 'Pre-Workout',
                    time: 'Morning',
                    foods: [
                        {
                            food: oatmeal._id,
                            foodName: 'Protein Oatmeal',
                            quantity: 150,
                            unit: 'grams'
                        }
                    ],
                    instructions: 'Oatmeal with protein powder',
                    totalCalories: 450
                },
                {
                    name: 'Post-Workout',
                    time: 'Post-Workout',
                    foods: [
                        {
                            food: chicken._id,
                            foodName: 'Chicken & Rice',
                            quantity: 200,
                            unit: 'grams'
                        }
                    ],
                    instructions: 'Grilled chicken with brown rice',
                    totalCalories: 600
                },
                {
                    name: 'Evening Meal',
                    time: 'Evening',
                    foods: [
                        {
                            food: salmon._id,
                            foodName: 'Salmon Steak',
                            quantity: 180,
                            unit: 'grams'
                        }
                    ],
                    instructions: 'Pan-seared salmon with quinoa',
                    totalCalories: 500
                }
            ],
            totalDailyCalories: 1550,
            createdBy: testUser._id,
            isActive: true
        });

        await muscleGainPlan.save();
        console.log('Created muscle gain plan:', muscleGainPlan._id);

        console.log('Test data created successfully!');
        console.log('Test User ID:', testUser._id);
        console.log('You can now test with userId:', testUser._id);

    } catch (error) {
        console.error('Error creating test data:', error);
    } finally {
        mongoose.connection.close();
    }
}

createTestDietPlans();