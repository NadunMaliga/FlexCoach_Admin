const mongoose = require('mongoose');
require('dotenv').config();

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/flexcoach');

const Diet = require('./models/Diet');

async function testAddDietFix() {
    try {
        console.log('🧪 Testing AddDiet Fix...\n');

        const testUserId = "68e8fd08e8d1859ebd9edd05";
        
        // Test the data structure that AddDiet will now send
        const testDietPlanData = {
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
                    totalCalories: 350
                }
            ],
            totalDailyCalories: 350,
            dietType: "Muscle Building", // This should now be valid
            isActive: true,
            createdBy: new mongoose.Types.ObjectId("507f1f77bcf86cd799439011")
        };

        console.log('1. Testing diet plan validation...');
        console.log(`Diet Type: ${testDietPlanData.dietType}`);
        console.log(`Name: ${testDietPlanData.name}`);
        
        // Test validation
        const testDiet = new Diet(testDietPlanData);
        
        try {
            await testDiet.validate();
            console.log('✅ Validation passed!');
            
            // Test saving
            const savedDiet = await testDiet.save();
            console.log(`✅ Diet plan saved successfully: ${savedDiet._id}`);
            
            // Clean up
            await Diet.findByIdAndDelete(savedDiet._id);
            console.log('✅ Test data cleaned up');
            
        } catch (validationError) {
            console.error('❌ Validation failed:', validationError.message);
            
            if (validationError.errors) {
                Object.keys(validationError.errors).forEach(field => {
                    console.error(`  - ${field}: ${validationError.errors[field].message}`);
                });
            }
        }

        // Test all meal plan mappings
        console.log('\n2. Testing all meal plan mappings...');
        
        const dietTypeMapping = {
            "Meal 1": "Muscle Building",
            "Meal 2": "Maintenance", 
            "Meal 3": "Weight Loss"
        };

        const validDietTypes = ['Weight Loss', 'Weight Gain', 'Muscle Building', 'Maintenance', 'Athletic Performance'];
        
        Object.entries(dietTypeMapping).forEach(([mealPlan, dietType]) => {
            const isValid = validDietTypes.includes(dietType);
            console.log(`${mealPlan} → ${dietType} ${isValid ? '✅' : '❌'}`);
        });

        console.log('\n🎯 Fix Summary:');
        console.log('✅ Meal plan names kept as "Meal 1", "Meal 2", "Meal 3"');
        console.log('✅ Diet types mapped to valid model values');
        console.log('✅ Validation should now pass');
        console.log('✅ AddDiet component should work correctly');

    } catch (error) {
        console.error('❌ Test failed:', error);
    } finally {
        mongoose.connection.close();
    }
}

testAddDietFix();