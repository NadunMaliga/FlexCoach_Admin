const mongoose = require('mongoose');
const config = require('./config');

// Debug actual workout data structure
async function debugWorkoutData() {
  try {
    console.log('🔍 Debugging Actual Workout Data Structure...');
    
    // Connect to MongoDB
    await mongoose.connect(config.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Get the workouts collection directly
    const workoutsCollection = mongoose.connection.db.collection('workouts');
    
    // Get all documents without any filter
    console.log('\n📊 All documents in workouts collection:');
    const allDocs = await workoutsCollection.find({}).toArray();
    console.log(`Found ${allDocs.length} documents`);
    
    allDocs.forEach((doc, index) => {
      console.log(`\n--- Document ${index + 1} ---`);
      console.log(`_id: ${doc._id}`);
      console.log(`name: ${doc.name}`);
      console.log(`userId: ${doc.userId} (type: ${typeof doc.userId})`);
      console.log(`userId ObjectId: ${doc.userId instanceof mongoose.Types.ObjectId}`);
      console.log(`day: ${doc.day}`);
      console.log(`isActive: ${doc.isActive}`);
      console.log(`createdAt: ${doc.createdAt}`);
      console.log(`exercises count: ${doc.exercises ? doc.exercises.length : 0}`);
    });

    // Test different query formats for the specific user
    const testUserId = '68e772107be5ed4ada394b58';
    console.log(`\n🔍 Testing different query formats for user: ${testUserId}`);
    
    // Query 1: String
    const query1 = await workoutsCollection.find({ userId: testUserId }).toArray();
    console.log(`Query 1 (string): ${query1.length} results`);
    
    // Query 2: ObjectId
    const query2 = await workoutsCollection.find({ userId: new mongoose.Types.ObjectId(testUserId) }).toArray();
    console.log(`Query 2 (ObjectId): ${query2.length} results`);
    
    // Query 3: Check if userId is stored as ObjectId
    const query3 = await workoutsCollection.find({ 
      userId: { $eq: new mongoose.Types.ObjectId(testUserId) }
    }).toArray();
    console.log(`Query 3 ($eq ObjectId): ${query3.length} results`);

    // Query 4: Check if userId is stored as string
    const query4 = await workoutsCollection.find({ 
      userId: { $eq: testUserId }
    }).toArray();
    console.log(`Query 4 ($eq string): ${query4.length} results`);

    // Show the actual userId values in the database
    console.log(`\n📋 Actual userId values in database:`);
    const userIdValues = await workoutsCollection.distinct('userId');
    userIdValues.forEach((userId, index) => {
      console.log(`   ${index + 1}. ${userId} (type: ${typeof userId})`);
      console.log(`      Is ObjectId: ${userId instanceof mongoose.Types.ObjectId}`);
      console.log(`      String value: ${userId.toString()}`);
      console.log(`      Matches test: ${userId.toString() === testUserId}`);
    });

  } catch (error) {
    console.error('❌ Debug error:', error);
  } finally {
    await mongoose.connection.close();
    console.log('\n🔌 Database connection closed');
  }
}

// Run the debug
debugWorkoutData();