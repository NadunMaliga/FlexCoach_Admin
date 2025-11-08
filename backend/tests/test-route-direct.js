const mongoose = require('mongoose');
const Diet = require('./models/Diet');

// Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/fitnessapp');

async function testRouteDirect() {
    try {
        console.log('Testing route logic directly...');
        
        const userId = '68e8fd08e8d1859ebd9edd05';
        console.log('Original userId:', userId);
        
        // Convert userId to ObjectId if it's a valid ObjectId string
        let userIdQuery = userId;
        if (mongoose.Types.ObjectId.isValid(userId)) {
            userIdQuery = new mongoose.Types.ObjectId(userId);
            console.log('Converted to ObjectId:', userIdQuery);
        }

        const query = { userId: userIdQuery, isActive: true };
        console.log('Query:', query);

        const dietPlans = await Diet.find(query).sort({ createdAt: -1 });
        
        console.log('Found diet plans:', dietPlans.length);
        
        if (dietPlans.length > 0) {
            dietPlans.forEach((plan, index) => {
                console.log(`${index + 1}. ${plan.name} - ${plan.dietType}`);
                console.log(`   Meals: ${plan.meals.length}`);
            });
        }
        
        // Also test without ObjectId conversion
        console.log('\nTesting without ObjectId conversion...');
        const query2 = { userId: userId, isActive: true };
        const dietPlans2 = await Diet.find(query2);
        console.log('Found diet plans (string userId):', dietPlans2.length);
        
    } catch (error) {
        console.error('Error:', error);
    } finally {
        mongoose.connection.close();
    }
}

testRouteDirect();