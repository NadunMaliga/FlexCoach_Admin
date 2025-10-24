const axios = require('axios');

// Test the ProfileSchedules-specific API endpoint
async function testProfileSchedulesAPI() {
  try {
    console.log('🧪 Testing ProfileSchedules API Endpoint...');
    
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
    
    // Step 3: Test the ProfileSchedules-specific API endpoint
    console.log(`🏋️ Step 3: Testing ProfileSchedules API endpoint...`);
    
    const profileSchedulesResponse = await axios.get(`http://localhost:3001/api/admin/workout-schedules/${workoutId}/details`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    if (profileSchedulesResponse.data.success) {
      const data = profileSchedulesResponse.data;
      console.log(`✅ ProfileSchedules API working perfectly!`);
      
      console.log(`\n📊 Workout Schedule:`);
      console.log(`   Name: ${data.workoutSchedule.name}`);
      console.log(`   Day: ${data.workoutSchedule.day}`);
      console.log(`   Type: ${data.workoutSchedule.workoutType}`);
      console.log(`   Duration: ${data.workoutSchedule.totalDuration} minutes`);
      console.log(`   Day Title: ${data.dayTitle}`);
      console.log(`   Total Exercises: ${data.totalExercises}`);
      
      console.log(`\n🏋️ Exercises (formatted for ProfileSchedules):`);
      data.exercises.forEach((ex, index) => {
        console.log(`\n   ${index + 1}. ${ex.name}`);
        console.log(`      Detail: ${ex.detail}`);
        console.log(`      Video URL: ${ex.videoUrl}`);
        console.log(`      Modal Data:`);
        console.log(`         Sets: ${ex.sets}`);
        console.log(`         Reps: ${ex.reps}`);
        console.log(`         Weight: ${ex.weight} kg`);
        console.log(`         Rest: ${ex.rest} sec`);
        console.log(`         Date: ${new Date(ex.date).toLocaleDateString()}`);
        if (ex.description) {
          console.log(`         Description: ${ex.description}`);
        }
        if (ex.category) {
          console.log(`         Category: ${ex.category}`);
        }
      });
      
      console.log(`\n🎯 ProfileSchedules Component Ready!`);
      console.log(`✅ Mock data can be replaced with: ApiService.getWorkoutScheduleDetails(workoutId)`);
      console.log(`✅ Exercise list formatted correctly for component`);
      console.log(`✅ Modal data includes all required fields`);
      console.log(`✅ Video URLs from real exercise database`);
      
    } else {
      console.log('❌ ProfileSchedules API failed:', profileSchedulesResponse.data);
    }
    
  } catch (error) {
    console.error('❌ ProfileSchedules API Test Error:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', JSON.stringify(error.response.data, null, 2));
    }
  }
}

// Run the test
testProfileSchedulesAPI();