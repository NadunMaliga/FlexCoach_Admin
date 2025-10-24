const mongoose = require('mongoose');
require('dotenv').config();

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/flexcoach');

const Diet = require('./models/Diet');

async function debugUserIdFormat() {
    try {
        console.log('🔍 Debugging UserId Format Issue...\n');

        const testUserId = "68e8fd08e8d1859ebd9edd05";
        
        // 1. Check what format userId is stored as in database
        console.log('1. Checking userId format in database...');
        const allDiets = await Diet.find({}).limit(5);
        
        allDiets.forEach((diet, index) => {
            console.log(`   ${index + 1}. ${diet.name}`);
            console.log(`      userId: ${diet.userId}`);
            console.log(`      userId type: ${typeof diet.userId}`);
            console.log(`      userId constructor: ${diet.userId ? diet.userId.constructor.name : 'null'}`);
            console.log(`      Is ObjectId: ${mongoose.Types.ObjectId.isValid(diet.userId)}`);
        });

        // 2. Test different query formats
        console.log('\n2. Testing different query formats...');
        
        // Query as string
        const stringQuery = await Diet.find({ userId: testUserId });
        console.log(`String query result: ${stringQuery.length} plans`);
        
        // Query as ObjectId
        const objectIdQuery = await Diet.find({ userId: new mongoose.Types.ObjectId(testUserId) });
        console.log(`ObjectId query result: ${objectIdQuery.length} plans`);
        
        // Query with $in to test both formats
        const bothQuery = await Diet.find({ 
            userId: { 
                $in: [testUserId, new mongoose.Types.ObjectId(testUserId)] 
            } 
        });
        console.log(`Both formats query result: ${bothQuery.length} plans`);

        // 3. Simulate the exact route logic
        console.log('\n3. Simulating route logic...');
        
        const userId = testUserId;
        const isActive = true;
        
        console.log('Route - userId:', userId);
        console.log('Route - isActive:', isActive);

        // Convert userId to ObjectId if it's a valid ObjectId string
        let userIdQuery = userId;
        if (mongoose.Types.ObjectId.isValid(userId)) {
            userIdQuery = new mongoose.Types.ObjectId(userId);
            console.log('Route - Converted to ObjectId:', userIdQuery);
        } else {
            console.log('Route - Keeping as string:', userIdQuery);
        }

        const query = { userId: userIdQuery };
        if (isActive !== undefined) {
            query.isActive = isActive === true;
        }

        console.log('Route - Final query:', query);

        const routeResult = await Diet.find(query).sort({ createdAt: -1 });
        console.log(`Route simulation result: ${routeResult.length} plans`);

        // 4. Check if the issue is with isActive filter
        console.log('\n4. Testing isActive filter...');
        
        const noActiveFilter = await Diet.find({ userId: userIdQuery });
        console.log(`Without isActive filter: ${noActiveFilter.length} plans`);
        
        const withActiveFilter = await Diet.find({ userId: userIdQuery, isActive: true });
        console.log(`With isActive=true filter: ${withActiveFilter.length} plans`);
        
        // Check what isActive values exist
        const activeValues = await Diet.distinct('isActive', { userId: userIdQuery });
        console.log(`Distinct isActive values: ${activeValues}`);

    } catch (error) {
        console.error('❌ Debug failed:', error);
    } finally {
        mongoose.connection.close();
    }
}

debugUserIdFormat();