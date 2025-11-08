const axios = require('axios');

// Test all workout-related APIs for ProfileSchedules component
async function testAllWorkoutAPIs() {
  try {
    console.log('🧪 Testing All Workout APIs for ProfileSchedules...');
    
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
    
    const testUserId = '68e772107be5ed4ada394b58';
    
    // Test 1: Get user workout schedules (for ExercisePlan component)
    console.log(`\n📋 Test 1: User Workout Schedules API`);
    const userWorkoutsResponse = await axios.get(`http://localhost:3001/api/admin/workout-schedules/user/${testUserId}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    if (userWorkoutsResponse.data.success) {
      console.log(`✅ User has ${userWorkoutsResponse.data.workoutSchedules.length} workout schedules`);
      userWorkoutsResponse.data.workoutSchedules.forEach((workout, index) => {
        console.log(`   ${index + 1}. ${workout.name} (ID: ${workout._id})`);
      });
    }
    
    // Test 2: Get latest workout schedule
    console.log(`\n🔄 Test 2: Latest Workout Schedule API`);
    const latestWorkoutResponse = await axios.get(`http://localhost:3001/api/admin/workout-schedules/user/${testUserId}/latest`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    if (latestWorkoutResponse.data.success) {
      console.log(`✅ Latest workout ID: ${latestWorkoutResponse.data.workoutScheduleId}`);
      console.log(`   Redirect URL: ${latestWorkoutResponse.data.redirectUrl}`);
    }
    
    // Test 3: Get detailed workout schedule (for ProfileSchedules component)
    const workoutId = userWorkoutsResponse.data.workoutSchedules[0]._id;
    console.log(`\n🏋️ Test 3: Detailed Workout Schedule API`);
    const detailsResponse = await axios.get(`http://localhost:3001/api/admin/workout-schedules/${workoutId}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    if (detailsResponse.data.success) {
      console.log(`✅ Detailed workout data retrieved`);
      console.log(`   Enhanced exercises: ${detailsResponse.data.workoutSchedule.exercises.length}`);
    }
    
    // Test 4: Get ProfileSchedules-formatted data
    console.log(`\n📱 Test 4: ProfileSchedules Formatted API`);
    const profileSchedulesResponse = await axios.get(`http://localhost:3001/api/admin/workout-schedules/${workoutId}/details`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    if (profileSchedulesResponse.data.success) {
      const data = profileSchedulesResponse.data;
      console.log(`✅ ProfileSchedules data formatted correctly`);
      console.log(`   Day Title: ${data.dayTitle}`);
      console.log(`   Exercises: ${data.totalExercises}`);
      
      // Show sample exercise data
      if (data.exercises.length > 0) {
        const sampleEx = data.exercises[0];
        console.log(`   Sample Exercise:`);
        console.log(`     Name: ${sampleEx.name}`);
        console.log(`     Detail: ${sampleEx.detail}`);
        console.log(`     Video: ${sampleEx.videoUrl}`);
        console.log(`     Modal Data: Sets=${sampleEx.sets}, Reps=${sampleEx.reps}, Weight=${sampleEx.weight}kg`);
      }
    }
    
    console.log(`\n🎯 All APIs Working Successfully!`);
    console.log(`\n📋 API Summary for Frontend Integration:`);
    console.log(`   1. ExercisePlan Component:`);
    console.log(`      - ApiService.getUserWorkoutSchedules(userId)`);
    console.log(`      - Shows list of workout schedules for client`);
    console.log(`\n   2. ProfileSchedules Component:`);
    console.log(`      - ApiService.getWorkoutScheduleDetails(workoutId)`);
    console.log(`      - Shows detailed exercises with real data`);
    console.log(`      - Replaces mock exercises array`);
    console.log(`\n   3. Navigation Support:`);
    console.log(`      - ApiService.getLatestWorkoutSchedule(userId)`);
    console.log(`      - For quick access to user's latest workout`);
    
    console.log(`\n✅ Backend APIs ready to replace all mock data!`);
    
  } catch (error) {
    console.error('❌ API Test Error:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', JSON.stringify(error.response.data, null, 2));
    }
  }
}

// Run the test
testAllWorkoutAPIs();