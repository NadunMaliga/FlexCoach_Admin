const axios = require('axios');

// Test fetching user workout schedules
async function testUserWorkouts() {
  try {
    console.log('🧪 Testing User Workout Schedules Retrieval...');
    
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
    
    // Step 2: Test user workout schedules endpoint
    const testUserId = '68e772107be5ed4ada394b58';
    console.log(`🏋️ Step 2: Fetching workout schedules for user: ${testUserId}`);
    
    // Test with the same parameters that the frontend sends
    console.log('Testing with frontend parameters...');
    const userWorkoutsResponse = await axios.get(`http://localhost:3001/api/admin/workout-schedules/user/${testUserId}?limit=50&sortBy=scheduledDate&sortOrder=asc`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    if (userWorkoutsResponse.data.success) {
      console.log(`✅ Successfully retrieved workout schedules!`);
      console.log(`📊 Found ${userWorkoutsResponse.data.workoutSchedules.length} workout schedules`);
      
      userWorkoutsResponse.data.workoutSchedules.forEach((workout, index) => {
        console.log(`\n   ${index + 1}. ${workout.name}`);
        console.log(`      Day: ${workout.day}`);
        console.log(`      Type: ${workout.workoutType}`);
        console.log(`      Duration: ${workout.totalDuration} minutes`);
        console.log(`      Exercises: ${workout.exercises.length}`);
        workout.exercises.forEach((ex, exIndex) => {
          console.log(`         ${exIndex + 1}. ${ex.exerciseName} - ${ex.sets}x${ex.reps}`);
        });
        console.log(`      Completed: ${workout.isCompleted ? 'Yes' : 'No'}`);
      });
    } else {
      console.log('❌ Failed to retrieve workout schedules:', userWorkoutsResponse.data);
    }
    
    console.log('\n🎯 User Workout Schedules Test Complete!');
    console.log('✅ ExercisePlan component should now show workout schedules');
    
  } catch (error) {
    console.error('❌ User Workouts Test Error:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', JSON.stringify(error.response.data, null, 2));
    }
  }
}

// Run the test
testUserWorkouts();