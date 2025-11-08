const axios = require('axios');

// Test getting detailed workout schedule information
async function testWorkoutDetails() {
  try {
    console.log('🧪 Testing Workout Schedule Details API...');
    
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
    
    // Step 2: Get user's workout schedules to find a workout ID
    const testUserId = '68e772107be5ed4ada394b58';
    console.log(`📋 Step 2: Getting workout schedules for user: ${testUserId}`);
    
    const userWorkoutsResponse = await axios.get(`http://localhost:3001/api/admin/workout-schedules/user/${testUserId}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    if (!userWorkoutsResponse.data.success || userWorkoutsResponse.data.workoutSchedules.length === 0) {
      throw new Error('No workout schedules found for user');
    }
    
    const workoutId = userWorkoutsResponse.data.workoutSchedules[0]._id;
    console.log(`✅ Found workout schedule ID: ${workoutId}`);
    
    // Step 3: Get detailed workout schedule information
    console.log(`🏋️ Step 3: Getting detailed workout schedule...`);
    
    const workoutDetailsResponse = await axios.get(`http://localhost:3001/api/admin/workout-schedules/${workoutId}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    if (workoutDetailsResponse.data.success) {
      const workout = workoutDetailsResponse.data.workoutSchedule;
      console.log(`✅ Successfully retrieved workout details!`);
      console.log(`\n📊 Workout: ${workout.name}`);
      console.log(`   Day: ${workout.day}`);
      console.log(`   Type: ${workout.workoutType}`);
      console.log(`   Duration: ${workout.totalDuration} minutes`);
      console.log(`   Difficulty: ${workout.difficulty}`);
      console.log(`   Scheduled: ${new Date(workout.scheduledDate).toLocaleDateString()}`);
      console.log(`   Completed: ${workout.isCompleted ? 'Yes' : 'No'}`);
      
      console.log(`\n🏋️ Exercises (${workout.exercises.length}):`);
      workout.exercises.forEach((ex, index) => {
        console.log(`\n   ${index + 1}. ${ex.exerciseName}`);
        console.log(`      Sets: ${ex.sets} | Reps: ${ex.reps} | Weight: ${ex.weight}kg | Rest: ${ex.restTime}s`);
        
        if (ex.exerciseDetails) {
          console.log(`      📋 Exercise Details:`);
          console.log(`         Description: ${ex.exerciseDetails.description || 'N/A'}`);
          console.log(`         Category: ${ex.exerciseDetails.category || 'N/A'}`);
          console.log(`         Difficulty: ${ex.exerciseDetails.difficulty || 'N/A'}`);
          console.log(`         Video URL: ${ex.exerciseDetails.videoUrl || 'N/A'}`);
          if (ex.exerciseDetails.muscleGroups && ex.exerciseDetails.muscleGroups.length > 0) {
            console.log(`         Muscle Groups: ${ex.exerciseDetails.muscleGroups.join(', ')}`);
          }
          if (ex.exerciseDetails.equipment && ex.exerciseDetails.equipment.length > 0) {
            console.log(`         Equipment: ${ex.exerciseDetails.equipment.join(', ')}`);
          }
        } else {
          console.log(`      ⚠️ No detailed exercise information available`);
        }
      });
      
      console.log(`\n🎯 ProfileSchedules Component Data Ready!`);
      console.log(`✅ Real exercise data with sets, reps, weight, rest time`);
      console.log(`✅ Exercise descriptions, categories, and video URLs`);
      console.log(`✅ Muscle groups and equipment information`);
      
    } else {
      console.log('❌ Failed to retrieve workout details:', workoutDetailsResponse.data);
    }
    
  } catch (error) {
    console.error('❌ Workout Details Test Error:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', JSON.stringify(error.response.data, null, 2));
    }
  }
}

// Run the test
testWorkoutDetails();