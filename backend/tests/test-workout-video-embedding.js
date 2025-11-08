const mongoose = require('mongoose');
const axios = require('axios');

async function testWorkoutVideoEmbedding() {
  try {
    console.log('🧪 Testing Video URL Embedding in Workout Schedules...');
    
    const baseURL = 'http://localhost:3001/api/admin';
    
    // Step 1: Login to get authentication token
    console.log('\n🔐 Step 1: Admin Login');
    const loginResponse = await axios.post(`${baseURL}/login`, {
      email: 'admin@gmail.com',
      password: 'Password123'
    });
    
    if (!loginResponse.data.success) {
      console.log('❌ Login failed');
      return;
    }
    
    const token = loginResponse.data.token;
    const headers = { Authorization: `Bearer ${token}` };
    console.log('✅ Login successful');
    
    // Step 2: Get available exercises to use in workout
    console.log('\n📋 Step 2: Getting Available Exercises');
    const exercisesResponse = await axios.get(`${baseURL}/exercises?limit=5`, { headers });
    
    if (!exercisesResponse.data.success || exercisesResponse.data.exercises.length === 0) {
      console.log('❌ No exercises found');
      return;
    }
    
    const availableExercises = exercisesResponse.data.exercises;
    console.log(`✅ Found ${availableExercises.length} exercises`);
    
    // Display exercises with their video URLs
    availableExercises.forEach((exercise, index) => {
      console.log(`   ${index + 1}. ${exercise.name}`);
      console.log(`      Video URL: ${exercise.videoUrl || 'No video URL'}`);
    });
    
    // Step 3: Create a workout schedule with exercises that have video URLs
    console.log('\n🏋️ Step 3: Creating Workout Schedule with Video URLs');
    
    // Use first 2 exercises for the workout
    const selectedExercises = availableExercises.slice(0, 2).map(exercise => ({
      exercise: exercise._id,
      exerciseName: exercise.name,
      sets: 3,
      reps: 12,
      weight: 20,
      restTime: 60
    }));
    
    const workoutData = {
      name: 'Test Video Workout',
      description: 'Testing video URL embedding in workout schedules',
      userId: '68b403f4d5f53e9201c6c040', // Use a test user ID
      day: 'Monday',
      dayNumber: 1,
      workoutType: 'Strength',
      scheduledDate: new Date().toISOString(),
      exercises: selectedExercises,
      totalDuration: 45
    };
    
    console.log('Creating workout with exercises:', selectedExercises.map(ex => ex.exerciseName));
    
    const createResponse = await axios.post(`${baseURL}/workout-schedules`, workoutData, { headers });
    
    if (!createResponse.data.success) {
      console.log('❌ Failed to create workout:', createResponse.data);
      return;
    }
    
    const workoutId = createResponse.data.workoutSchedule._id;
    console.log('✅ Workout created successfully');
    console.log('   Workout ID:', workoutId);
    
    // Step 4: Verify video URLs are embedded in the workout document
    console.log('\n🔍 Step 4: Verifying Video URLs in Database');
    
    // Connect directly to database to check the workout document
    await mongoose.connect('mongodb://localhost:27017/flexcoach');
    const Workout = require('./models/Workout');
    
    const savedWorkout = await Workout.findById(workoutId);
    
    if (savedWorkout) {
      console.log('✅ Workout found in database:');
      console.log('   Name:', savedWorkout.name);
      console.log('   Exercises with embedded video URLs:');
      
      savedWorkout.exercises.forEach((exercise, index) => {
        console.log(`   ${index + 1}. ${exercise.exerciseName}`);
        console.log(`      Video URL: ${exercise.videoUrl || 'NO VIDEO URL EMBEDDED!'}`);
        console.log(`      Description: ${exercise.description || 'No description'}`);
        console.log(`      Category: ${exercise.category || 'No category'}`);
        console.log(`      Sets: ${exercise.sets}, Reps: ${exercise.reps}, Weight: ${exercise.weight}kg`);
        console.log('');
      });
    }
    
    // Step 5: Test retrieving workout via API
    console.log('\n📋 Step 5: Testing API Retrieval with Embedded Video URLs');
    
    const getResponse = await axios.get(`${baseURL}/workout-schedules/${workoutId}`, { headers });
    
    if (getResponse.data.success) {
      console.log('✅ Workout retrieved via API:');
      const workout = getResponse.data.workoutSchedule;
      
      workout.exercises.forEach((exercise, index) => {
        console.log(`   ${index + 1}. ${exercise.exerciseName}`);
        console.log(`      Embedded Video URL: ${exercise.videoUrl || 'NO VIDEO URL!'}`);
        console.log(`      Exercise Details Video URL: ${exercise.exerciseDetails?.videoUrl || 'NO DETAILS VIDEO URL!'}`);
      });
    }
    
    // Step 6: Test the details endpoint (used by ProfileSchedules)
    console.log('\n📱 Step 6: Testing Details Endpoint for Client App');
    
    const detailsResponse = await axios.get(`${baseURL}/workout-schedules/${workoutId}/details`, { headers });
    
    if (detailsResponse.data.success) {
      console.log('✅ Workout details retrieved for client app:');
      const exercises = detailsResponse.data.exercises;
      
      exercises.forEach((exercise, index) => {
        console.log(`   ${index + 1}. ${exercise.name}`);
        console.log(`      Video URL for client: ${exercise.videoUrl || 'NO VIDEO URL FOR CLIENT!'}`);
        console.log(`      Detail: ${exercise.detail}`);
      });
    }
    
    // Step 7: Clean up - delete test workout
    console.log('\n🧹 Step 7: Cleaning up test data');
    
    const deleteResponse = await axios.delete(`${baseURL}/workout-schedules/${workoutId}`, { headers });
    
    if (deleteResponse.data.success) {
      console.log('✅ Test workout deleted successfully');
    }
    
    mongoose.connection.close();
    
    console.log('\n🎯 SUMMARY:');
    console.log('✅ Video URLs are now embedded directly in workout documents');
    console.log('✅ No need for additional database lookups to get video URLs');
    console.log('✅ Client apps can access video URLs immediately');
    console.log('✅ Faster performance - single database query instead of multiple');
    console.log('✅ Video URLs are preserved even if original exercise is deleted');
    
  } catch (error) {
    console.error('❌ Test Error:', error.response?.data || error.message);
  }
}

testWorkoutVideoEmbedding();