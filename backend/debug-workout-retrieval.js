const mongoose = require('mongoose');
const config = require('./config');

// Debug workout schedule retrieval
async function debugWorkoutRetrieval() {
  try {
    console.log('🔍 Debugging Workout Schedule Retrieval...');
    
    // Connect to MongoDB
    await mongoose.connect(config.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Check which database we're connected to
    console.log('📊 Current database:', mongoose.connection.db.databaseName);

    // Import the Workout model
    const Workout = require('./models/Workout');
    
    // Check all workout schedules in the database
    console.log('\n1️⃣ Checking all workout schedules in database...');
    const allWorkouts = await Workout.find({});
    console.log(`Found ${allWorkouts.length} total workout schedules`);
    
    allWorkouts.forEach((workout, index) => {
      console.log(`   ${index + 1}. ${workout.name} - User: ${workout.userId} - Day: ${workout.day}`);
    });

    // Check for the specific test user
    const testUserId = '68e772107be5ed4ada394b58';
    console.log(`\n2️⃣ Checking workout schedules for user: ${testUserId}`);
    
    const userWorkouts = await Workout.find({ userId: testUserId });
    console.log(`Found ${userWorkouts.length} workout schedules for this user`);
    
    userWorkouts.forEach((workout, index) => {
      console.log(`   ${index + 1}. ${workout.name} - Created: ${workout.createdAt}`);
      console.log(`      Exercises: ${workout.exercises.length}`);
      workout.exercises.forEach((ex, exIndex) => {
        console.log(`         ${exIndex + 1}. ${ex.exerciseName} - ${ex.sets}x${ex.reps}`);
      });
    });

    // Check if there are any issues with the userId format
    console.log(`\n3️⃣ Checking userId format and validation...`);
    console.log(`Test userId: ${testUserId}`);
    console.log(`Is valid ObjectId: ${mongoose.Types.ObjectId.isValid(testUserId)}`);

    // Try different query approaches
    console.log(`\n4️⃣ Trying different query approaches...`);
    
    // Query 1: Direct string match
    const query1 = await Workout.find({ userId: testUserId });
    console.log(`Query 1 (string): ${query1.length} results`);
    
    // Query 2: ObjectId conversion
    const query2 = await Workout.find({ userId: new mongoose.Types.ObjectId(testUserId) });
    console.log(`Query 2 (ObjectId): ${query2.length} results`);
    
    // Query 3: Check with isActive filter (like the API does)
    const query3 = await Workout.find({ 
      userId: testUserId,
      isActive: { $ne: false }
    });
    console.log(`Query 3 (with isActive): ${query3.length} results`);

    // Check the raw collection directly
    console.log(`\n5️⃣ Checking raw collection data...`);
    const workoutCollection = mongoose.connection.db.collection('workouts');
    const rawWorkouts = await workoutCollection.find({ userId: testUserId }).toArray();
    console.log(`Raw collection query: ${rawWorkouts.length} results`);
    
    if (rawWorkouts.length > 0) {
      console.log('Raw workout data:');
      rawWorkouts.forEach((workout, index) => {
        console.log(`   ${index + 1}. Name: ${workout.name}`);
        console.log(`      UserId: ${workout.userId} (type: ${typeof workout.userId})`);
        console.log(`      IsActive: ${workout.isActive}`);
      });
    }

  } catch (error) {
    console.error('❌ Debug error:', error);
  } finally {
    await mongoose.connection.close();
    console.log('\n🔌 Database connection closed');
  }
}

// Run the debug
debugWorkoutRetrieval();