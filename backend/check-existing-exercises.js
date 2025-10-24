const mongoose = require('mongoose');

async function checkExistingExercises() {
  try {
    console.log('🔍 Checking Existing Exercises with Video URLs...');
    
    // Connect to MongoDB
    await mongoose.connect('mongodb://localhost:27017/flexcoach');
    console.log('✅ Connected to MongoDB');
    
    // Access the flexcoach database exercises collection
    const flexcoachDb = mongoose.connection.useDb('flexcoach');
    const ExercisesCollection = flexcoachDb.collection('exercises');
    
    // Get all exercises
    const exercises = await ExercisesCollection.find({}).toArray();
    
    console.log(`\n📋 Found ${exercises.length} exercises in database:\n`);
    
    if (exercises.length === 0) {
      console.log('   No exercises found in database');
    } else {
      exercises.forEach((exercise, index) => {
        console.log(`${index + 1}. ${exercise.name}`);
        console.log(`   Description: ${exercise.description || 'No description'}`);
        console.log(`   Video URL: ${exercise.videoUrl || 'No video URL'}`);
        console.log(`   Category: ${exercise.category || 'No category'}`);
        console.log(`   Difficulty: ${exercise.difficulty || 'No difficulty'}`);
        console.log(`   Created: ${exercise.createdAt ? new Date(exercise.createdAt).toDateString() : 'Unknown'}`);
        console.log(`   Active: ${exercise.isActive !== false ? 'Yes' : 'No'}`);
        console.log('');
      });
    }
    
    // Check for exercises with video URLs
    const exercisesWithVideos = exercises.filter(ex => ex.videoUrl && ex.videoUrl.trim() !== '');
    console.log(`📹 Exercises with video URLs: ${exercisesWithVideos.length}/${exercises.length}`);
    
    if (exercisesWithVideos.length > 0) {
      console.log('\n🎥 Video URLs in database:');
      exercisesWithVideos.forEach((exercise, index) => {
        console.log(`   ${index + 1}. ${exercise.name}: ${exercise.videoUrl}`);
      });
    }
    
    // Check for different video platforms
    const platforms = {
      youtube: exercisesWithVideos.filter(ex => ex.videoUrl.includes('youtube.com') || ex.videoUrl.includes('youtu.be')),
      vimeo: exercisesWithVideos.filter(ex => ex.videoUrl.includes('vimeo.com')),
      other: exercisesWithVideos.filter(ex => !ex.videoUrl.includes('youtube.com') && !ex.videoUrl.includes('youtu.be') && !ex.videoUrl.includes('vimeo.com'))
    };
    
    console.log('\n📊 Video Platform Distribution:');
    console.log(`   YouTube: ${platforms.youtube.length}`);
    console.log(`   Vimeo: ${platforms.vimeo.length}`);
    console.log(`   Other: ${platforms.other.length}`);
    
    mongoose.connection.close();
    console.log('\n✅ Database check completed');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

checkExistingExercises();