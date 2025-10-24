const mongoose = require('mongoose');
require('dotenv').config();

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/flexcoach');

const Diet = require('./models/Diet');

async function debugDietPlansIssue() {
    try {
        console.log('🔍 Debugging Diet Plans Issue...\n');

        const testUserId = "68e8fd08e8d1859ebd9edd05";
        
        // 1. Check if dietplans collection exists and has data
        console.log('1. Checking dietplans collection...');
        const allDiets = await Diet.find({});
        console.log(`Total diet plans in database: ${allDiets.length}`);
        
        if (allDiets.length > 0) {
            console.log('\nAll diet plans:');
            allDiets.forEach((diet, index) => {
                console.log(`   ${index + 1}. ${diet.name} - User: ${diet.userId} - Active: ${diet.isActive}`);
            });
        }

        // 2. Check for the specific test user
        console.log(`\n2. Checking diet plans for user ${testUserId}...`);
        const userDiets = await Diet.find({ userId: testUserId });
        console.log(`Diet plans for test user: ${userDiets.length}`);

        // 3. Check for different userId formats
        console.log('\n3. Checking different userId formats...');
        const userDietsString = await Diet.find({ userId: testUserId });
        const userDietsObjectId = await Diet.find({ userId: new mongoose.Types.ObjectId(testUserId) });
        console.log(`String userId format: ${userDietsString.length} plans`);
        console.log(`ObjectId userId format: ${userDietsObjectId.length} plans`);

        // 4. Check collection name and database
        console.log('\n4. Database information...');
        console.log(`Database name: ${mongoose.connection.db.databaseName}`);
        console.log(`Connection state: ${mongoose.connection.readyState}`);
        
        // List all collections
        const collections = await mongoose.connection.db.listCollections().toArray();
        console.log('\nAvailable collections:');
        collections.forEach(col => {
            console.log(`   - ${col.name}`);
        });

        // 5. Check if there are any diet plans with null userId
        console.log('\n5. Checking for diet plans with null userId...');
        const nullUserDiets = await Diet.find({ userId: null });
        console.log(`Diet plans with null userId: ${nullUserDiets.length}`);

        if (nullUserDiets.length > 0) {
            console.log('Diet plans with null userId:');
            nullUserDiets.forEach((diet, index) => {
                console.log(`   ${index + 1}. ${diet.name} - Created: ${diet.createdAt}`);
            });
        }

        // 6. Test creating a new diet plan
        console.log('\n6. Testing diet plan creation...');
        const testDiet = new Diet({
            name: "Test Diet Plan",
            description: "Test diet for debugging",
            userId: testUserId,
            dietType: "Maintenance",
            createdBy: new mongoose.Types.ObjectId("507f1f77bcf86cd799439011"),
            meals: [
                {
                    name: "Test Breakfast",
                    time: "Breakfast",
                    foods: [
                        {
                            foodName: "Test Food",
                            quantity: 100,
                            unit: "g"
                        }
                    ],
                    totalCalories: 200,
                    instructions: "Test instructions"
                }
            ],
            totalDailyCalories: 200
        });

        try {
            const savedDiet = await testDiet.save();
            console.log(`✅ Test diet plan created successfully: ${savedDiet._id}`);
            
            // Verify it can be found
            const foundDiet = await Diet.findById(savedDiet._id);
            console.log(`✅ Test diet plan found: ${foundDiet.name}`);
            
            // Clean up - remove test diet
            await Diet.findByIdAndDelete(savedDiet._id);
            console.log('✅ Test diet plan cleaned up');
            
        } catch (createError) {
            console.error('❌ Error creating test diet plan:', createError.message);
        }

        console.log('\n🔍 Debug Summary:');
        console.log(`- Total diets in database: ${allDiets.length}`);
        console.log(`- Diets for test user: ${userDiets.length}`);
        console.log(`- Database: ${mongoose.connection.db.databaseName}`);
        console.log(`- Collections available: ${collections.length}`);

    } catch (error) {
        console.error('❌ Debug failed:', error);
    } finally {
        mongoose.connection.close();
    }
}

debugDietPlansIssue();