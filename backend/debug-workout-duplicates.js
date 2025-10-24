const mongoose = require('mongoose');
const Workout = require('./models/Workout');

async function debugWorkoutDuplicates() {
  try {
    // Connect to MongoDB
    await mongoose.connect('mongodb://localhost:27017/flexcoach');
    console.log('✅ Connected to MongoDB');
    
    // Get all workouts
    const allWorkouts = await Workout.find({})
      .populate('userId', 'firstName lastName')
      .sort({ createdAt: -1 });
    
    console.log(`\n📊 Total Workouts: ${allWorkouts.length}`);
    
    // Group workouts by user and name to find duplicates
    const workoutGroups = {};
    
    allWorkouts.forEach(workout => {
      const userId = workout.userId?._id?.toString() || 'unknown';
      const userName = workout.userId ? `${workout.userId.firstName} ${workout.userId.lastName}` : 'Unknown User';
      const workoutName = workout.name;
      const key = `${userId}-${workoutName}`;
      
      if (!workoutGroups[key]) {
        workoutGroups[key] = {
          userName,
          workoutName,
          workouts: []
        };
      }
      
      workoutGroups[key].workouts.push({
        id: workout._id,
        isCompleted: workout.isCompleted,
        completedAt: workout.completedAt,
        scheduledDate: workout.scheduledDate,
        createdAt: workout.createdAt,
        day: workout.day,
        dayNumber: workout.dayNumber
      });
    });
    
    // Find groups with multiple workouts (potential duplicates)
    console.log('\n🔍 Checking for duplicate workouts...');
    
    let duplicatesFound = 0;
    
    Object.keys(workoutGroups).forEach(key => {
      const group = workoutGroups[key];
      
      if (group.workouts.length > 1) {
        duplicatesFound++;
        console.log(`\n❌ DUPLICATE FOUND:`);
        console.log(`   User: ${group.userName}`);
        console.log(`   Workout: ${group.workoutName}`);
        console.log(`   Count: ${group.workouts.length} workouts`);
        
        group.workouts.forEach((workout, index) => {
          console.log(`   ${index + 1}. ID: ${workout.id}`);
          console.log(`      Completed: ${workout.isCompleted}`);
          console.log(`      Completed At: ${workout.completedAt || 'N/A'}`);
          console.log(`      Scheduled: ${workout.scheduledDate}`);
          console.log(`      Created: ${workout.createdAt}`);
          console.log(`      Day: ${workout.day} (Day ${workout.dayNumber})`);
        });
        
        // Check if there's a pattern: one incomplete, one complete
        const completed = group.workouts.filter(w => w.isCompleted);
        const incomplete = group.workouts.filter(w => !w.isCompleted);
        
        if (completed.length > 0 && incomplete.length > 0) {
          console.log(`   🎯 PATTERN: ${incomplete.length} incomplete + ${completed.length} completed`);
          console.log(`   💡 This suggests completion creates new documents instead of updating existing ones`);
        }
      }
    });
    
    if (duplicatesFound === 0) {
      console.log('✅ No duplicate workouts found');
    } else {
      console.log(`\n⚠️  Found ${duplicatesFound} sets of duplicate workouts`);
    }
    
    // Show recent workout activity
    console.log('\n📅 Recent Workout Activity (last 10):');
    allWorkouts.slice(0, 10).forEach((workout, index) => {
      const userName = workout.userId ? `${workout.userId.firstName} ${workout.userId.lastName}` : 'Unknown';
      console.log(`${index + 1}. ${workout.name} - ${userName}`);
      console.log(`   Completed: ${workout.isCompleted}, Created: ${workout.createdAt.toDateString()}`);
    });
    
    mongoose.connection.close();
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

debugWorkoutDuplicates();