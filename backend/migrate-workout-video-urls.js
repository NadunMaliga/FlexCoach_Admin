const mongoose = require('mongoose');

async function migrateWorkoutVideoURLs() {
  try {
    console.log('🔄 Migrating Existing Workout Schedules to Include Video URLs...');
    
    // Connect to MongoDB
    await mongoose.connect('mongodb://localhost:27017/flexcoach');
    console.log('✅ Connected to MongoDB');
    
    const Workout = require('./models/Workout');
    const User = require('./models/User');
    
    // Connect to flexcoach database to get exercise details
    const flexcoachDb = mongoose.connection.useDb('flexcoach');
    const ExercisesCollection = flexcoachDb.collection('exercises');
    
    // Get all workout schedules that don't have video URLs embedded
    const workouts = await Workout.find({
      'exercises.videoUrl': { $exists: false }
    });
    
    console.log(`\n📋 Found ${workouts.length} workout schedules to migrate:\n`);
    
    if (workouts.length === 0) {
      console.log('   No workout schedules need migration');
      mongoose.connection.close();
      return;
    }
    
    let migratedCount = 0;
    let errorCount = 0;
    
    for (const workout of workouts) {
      try {
        console.log(`🔄 Migrating: ${workout.name} (${workout.day})`);
        
        let updated = false;
        
        // Update each exercise in the workout
        for (let i = 0; i < workout.exercises.length; i++) {
          const exercise = workout.exercises[i];
          
          console.log(`   Processing exercise: ${exercise.exerciseName}`);
          
          // If exercise has an ID, fetch details from exercises collection
          if (exercise.exercise && mongoose.Types.ObjectId.isValid(exercise.exercise)) {
            try {
              const exerciseDoc = await ExercisesCollection.findOne({
                _id: new mongoose.Types.ObjectId(exercise.exercise)
              });
              
              if (exerciseDoc) {
                // Update the exercise with embedded data
                workout.exercises[i].videoUrl = exerciseDoc.videoUrl;
                workout.exercises[i].description = exerciseDoc.description;
                workout.exercises[i].category = exerciseDoc.category;
                workout.exercises[i].difficulty = exerciseDoc.difficulty;
                
                console.log(`      ✅ Added video URL: ${exerciseDoc.videoUrl || 'None'}`);
                updated = true;
              } else {
                console.log(`      ⚠️  Exercise not found in exercises collection`);
              }
            } catch (exerciseError) {
              console.log(`      ❌ Error fetching exercise details: ${exerciseError.message}`);
            }
          } else {
            console.log(`      ⚠️  No valid exercise ID to fetch details`);
          }
        }
        
        // Save the updated workout if any changes were made
        if (updated) {
          await workout.save();
          console.log(`   ✅ Workout updated successfully`);
          migratedCount++;
        } else {
          console.log(`   ⚠️  No updates needed for this workout`);
        }
        
        console.log('');
        
      } catch (workoutError) {
        console.error(`   ❌ Error migrating workout ${workout.name}: ${workoutError.message}`);
        errorCount++;
      }
    }
    
    console.log(`\n📊 Migration Summary:`);
    console.log(`   Successfully migrated: ${migratedCount} workouts`);
    console.log(`   Errors: ${errorCount} workouts`);
    console.log(`   Total processed: ${workouts.length} workouts`);
    
    // Verify migration by checking updated workouts
    console.log('\n🔍 Verifying migration...');
    
    const updatedWorkouts = await Workout.find({
      'exercises.videoUrl': { $exists: true }
    });
    
    console.log(`✅ Found ${updatedWorkouts.length} workouts with embedded video URLs after migration`);
    
    mongoose.connection.close();
    console.log('\n✅ Migration completed');
    
  } catch (error) {
    console.error('❌ Migration Error:', error.message);
    process.exit(1);
  }
}

migrateWorkoutVideoURLs();