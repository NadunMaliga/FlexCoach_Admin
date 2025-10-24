const mongoose = require('mongoose');
const Diet = require('./models/Diet');

// Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/fitnessapp');

async function checkDietPlans() {
    try {
        console.log('Checking existing diet plans...');
        
        const allDietPlans = await Diet.find({}).select('_id name userId dietType createdAt');
        
        console.log('Total diet plans in database:', allDietPlans.length);
        
        allDietPlans.forEach((plan, index) => {
            console.log(`${index + 1}. ${plan.name} (${plan.dietType})`);
            console.log(`   - ID: ${plan._id}`);
            console.log(`   - User ID: ${plan.userId}`);
            console.log(`   - Created: ${plan.createdAt}`);
            console.log('');
        });
        
        // Check specifically for our test user
        const testUserId = '68e8fd08e8d1859ebd9edd05';
        const userPlans = await Diet.find({ userId: testUserId });
        
        console.log(`Diet plans for user ${testUserId}:`, userPlans.length);
        
    } catch (error) {
        console.error('Error checking diet plans:', error);
    } finally {
        mongoose.connection.close();
    }
}

checkDietPlans();