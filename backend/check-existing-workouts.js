const mongoose = require('mongoose');

async function checkExistingWorkouts() {
  try {
    console.log('🔍 Checking Existing Workout Schedules for Video URLs...');
    
    // Connect to MongoDB
    await mongoose.connect('mongodb://localhost:27017/flexcoach');
    console.log('✅ Connected to MongoDB');
    
    const Workout = require('./models/Workout');
    const User = require('./models/User'); // Import User model for population
    
    // Get all workout schedules
    const workouts = await Workout.find({}).populate('userId', 'firstName lastName');
    
    console.log(`\n📋 Found ${workouts.length} workout schedules in database:\n`);
    
    if (workouts.length === 0) {
      console.log('   No workout schedules found in database');
    } else {
      let workoutsWithVideoURLs = 0;
      let workoutsWithoutVideoURLs = 0;
      
      workouts.forEach((workout, index) => {
        console.log(`${index + 1}. ${workout.name} (${workout.day})`);
        console.log(`   Client: ${workout.userId?.firstName || 'Unknown'} ${workout.userId?.lastName || 'User'}`);
        console.log(`   Exercises: ${workout.exercises.length}`);
        
        let hasVideoURLs = false;
        workout.exercises.forEach((exercise, exIndex) => {
          console.log(`      ${exIndex + 1}. ${exercise.exerciseName}`);
          if (exercise.videoUrl) {
            console.log(`         ✅ Video URL: ${exercise.videoUrl}`);
            hasVideoURLs = true;
          } else {
            console.log(`         ❌ No video URL embedded`);
          }
        });
        
        if (hasVideoURLs) {
          workoutsWithVideoURLs++;
        } else {
          workoutsWithoutVideoURLs++;
        }
        
        console.log(`   Created: ${workout.createdAt ? new Date(workout.createdAt).toDateString() : 'Unknown'}`);
        console.log(`   Active: ${workout.isActive !== false ? 'Yes' : 'No'}`);
        console.log('');
      });
      
      console.log(`📊 Summary:`);
      console.log(`   Workouts with embedded video URLs: ${workoutsWithVideoURLs}`);
      console.log(`   Workouts without embedded video URLs: ${workoutsWithoutVideoURLs}`);
      
      if (workoutsWithoutVideoURLs > 0) {
        console.log('\n⚠️  Some existing workouts do not have embedded video URLs.');
        console.log('   These were created before the video URL embedding feature.');
        console.log('   They will still work but will need to fetch video URLs from exercises collection.');
      }
    }
    
    mongoose.connection.close();
    console.log('\n✅ Database check completed');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

checkExistingWorkouts();