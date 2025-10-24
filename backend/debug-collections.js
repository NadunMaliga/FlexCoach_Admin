const mongoose = require('mongoose');
const config = require('./config');

// Debug collections and data location
async function debugCollections() {
  try {
    console.log('🔍 Debugging Collections and Data Location...');
    
    // Connect to MongoDB
    await mongoose.connect(config.MONGODB_URI);
    console.log('✅ Connected to MongoDB');
    console.log('📊 Current database:', mongoose.connection.db.databaseName);

    // List all collections in the database
    console.log('\n📋 All collections in database:');
    const collections = await mongoose.connection.db.listCollections().toArray();
    collections.forEach((collection, index) => {
      console.log(`   ${index + 1}. ${collection.name}`);
    });

    // Check each collection that might contain workout data
    const possibleCollections = ['workouts', 'workoutschedules', 'workout_schedules', 'Workouts'];
    
    for (const collectionName of possibleCollections) {
      try {
        const collection = mongoose.connection.db.collection(collectionName);
        const count = await collection.countDocuments();
        console.log(`\n📊 Collection '${collectionName}': ${count} documents`);
        
        if (count > 0) {
          const samples = await collection.find({}).limit(2).toArray();
          samples.forEach((doc, index) => {
            console.log(`   ${index + 1}. ${doc.name || doc._id} - User: ${doc.userId}`);
          });
        }
      } catch (error) {
        console.log(`\n❌ Collection '${collectionName}' not found or error: ${error.message}`);
      }
    }

    // Test the specific user ID in each collection
    const testUserId = '68e772107be5ed4ada394b58';
    console.log(`\n🔍 Searching for user ${testUserId} in all collections:`);
    
    for (const collectionName of possibleCollections) {
      try {
        const collection = mongoose.connection.db.collection(collectionName);
        const userDocs = await collection.find({ userId: testUserId }).toArray();
        console.log(`   ${collectionName}: ${userDocs.length} documents`);
      } catch (error) {
        console.log(`   ${collectionName}: Error - ${error.message}`);
      }
    }

  } catch (error) {
    console.error('❌ Debug error:', error);
  } finally {
    await mongoose.connection.close();
    console.log('\n🔌 Database connection closed');
  }
}

// Run the debug
debugCollections();