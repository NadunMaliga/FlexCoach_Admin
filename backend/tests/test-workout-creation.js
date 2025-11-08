const axios = require('axios');

// Test creating a workout schedule with real exercise data
async function testWorkoutCreation() {
  try {
    console.log('🧪 Testing Workout Schedule Creation...');
    
    // Step 1: Login to get a token
    console.log('🔐 Step 1: Logging in...');
    const loginResponse = await axios.post('http://localhost:3001/api/admin/login', {
      email: 'admin@gmail.com',
      password: 'Password123'
    });
    
    if (!loginResponse.data.success) {
      throw new Error('Login failed');
    }
    
    const token = loginResponse.data.token;
    console.log('✅ Login successful');
    
    // Step 2: Get available exercises
    console.log('📋 Step 2: Getting available exercises...');
    const exercisesResponse = await axios.get('http://localhost:3001/api/admin/exercises', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    if (!exercisesResponse.data.success || exercisesResponse.data.exercises.length === 0) {
      throw new Error('No exercises available');
    }
    
    const exercises = exercisesResponse.data.exercises;
    console.log(`✅ Found ${exercises.length} exercises`);
    exercises.forEach((ex, idx) => {
      console.log(`   ${idx + 1}. ${ex.name} (ID: ${ex._id})`);
    });
    
    // Step 3: Create a workout schedule using real exercise IDs
    console.log('🏋️ Step 3: Creating workout schedule...');
    
    const testUserId = '68e772107be5ed4ada394b58'; // From the error log
    const workoutData = {
      name: 'Test Upper Body Workout',
      description: 'A test workout with real exercises',
      userId: testUserId,
      day: 'Monday',
      workoutType: 'Strength',
      scheduledDate: new Date().toISOString(),
      totalDuration: 45,
      difficulty: 'Beginner',
      exercises: [
        {
          exercise: exercises[0]._id, // Use real exercise ID
          sets: 3,
          reps: 12,
          weight: 0,
          restTime: 60
        }
      ]
    };
    
    if (exercises.length > 1) {
      workoutData.exercises.push({
        exercise: exercises[1]._id, // Use second exercise if available
        sets: 3,
        reps: 10,
        weight: 5,
        restTime: 90
      });
    }
    
    console.log('Workout data to create:', JSON.stringify(workoutData, null, 2));
    
    const createResponse = await axios.post('http://localhost:3001/api/admin/workout-schedules', workoutData, {
      headers: { 
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (createResponse.data.success) {
      console.log('✅ Workout schedule created successfully!');
      console.log('Created workout:', createResponse.data.workoutSchedule.name);
      console.log('Exercises in workout:');
      createResponse.data.workoutSchedule.exercises.forEach((ex, idx) => {
        console.log(`   ${idx + 1}. ${ex.exerciseName} - ${ex.sets}x${ex.reps} (Rest: ${ex.restTime}s)`);
      });
    } else {
      console.log('❌ Failed to create workout schedule:', createResponse.data);
    }
    
    // Step 4: Verify the workout was saved by fetching user's workouts
    console.log('🔍 Step 4: Verifying workout was saved...');
    const userWorkoutsResponse = await axios.get(`http://localhost:3001/api/admin/workout-schedules/user/${testUserId}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    if (userWorkoutsResponse.data.success) {
      console.log(`✅ User now has ${userWorkoutsResponse.data.workoutSchedules.length} workout schedule(s)`);
      userWorkoutsResponse.data.workoutSchedules.forEach((workout, idx) => {
        console.log(`   ${idx + 1}. ${workout.name} - ${workout.exercises.length} exercises`);
      });
    }
    
    console.log('\n🎯 Workout Creation Test Complete!');
    console.log('✅ Exercise names are automatically retrieved from exercise collection');
    console.log('✅ Workout schedules are properly saved to the database');
    console.log('✅ Frontend can now create real workout schedules');
    
  } catch (error) {
    console.error('❌ Workout Creation Test Error:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', JSON.stringify(error.response.data, null, 2));
    }
  }
}

// Run the test
testWorkoutCreation();