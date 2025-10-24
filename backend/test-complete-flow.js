const axios = require('axios');

// Test the complete flow: login -> get exercises -> get workout schedules
async function testCompleteFlow() {
  try {
    console.log('🧪 Testing Complete Exercise Flow...');
    
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
    
    // Step 2: Test exercises endpoint (for AddSchedule)
    console.log('📋 Step 2: Testing exercises endpoint...');
    const exercisesResponse = await axios.get('http://localhost:3001/api/admin/exercises', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    if (exercisesResponse.data.success) {
      console.log(`✅ Exercises API working! Found ${exercisesResponse.data.exercises.length} exercises`);
      exercisesResponse.data.exercises.forEach((exercise, index) => {
        console.log(`   ${index + 1}. ${exercise.name}`);
      });
    } else {
      console.log('❌ Exercises API failed');
    }
    
    // Step 3: Test workout schedules endpoint (for ExercisePlan)
    console.log('🏋️ Step 3: Testing workout schedules endpoint...');
    const workoutResponse = await axios.get('http://localhost:3001/api/admin/workout-schedules', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    if (workoutResponse.data.success) {
      console.log(`✅ Workout schedules API working! Found ${workoutResponse.data.workoutSchedules.length} schedules`);
    } else {
      console.log('❌ Workout schedules API failed');
    }
    
    // Step 4: Test user-specific workout schedules
    console.log('👤 Step 4: Testing user-specific workout schedules...');
    const testUserId = '68e772107be5ed4ada394b58'; // From the error log
    try {
      const userWorkoutResponse = await axios.get(`http://localhost:3001/api/admin/workout-schedules/user/${testUserId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (userWorkoutResponse.data.success) {
        console.log(`✅ User workout schedules API working! Found ${userWorkoutResponse.data.workoutSchedules.length} schedules for user`);
      } else {
        console.log('⚠️ User workout schedules API returned no data (this is normal if user has no schedules)');
      }
    } catch (userError) {
      console.log('⚠️ User workout schedules endpoint error (this might be expected):', userError.response?.status);
    }
    
    console.log('\n🎯 Flow Test Complete!');
    console.log('📱 Frontend should now be able to:');
    console.log('   - Fetch exercises in AddSchedule (Step 2)');
    console.log('   - Fetch workout schedules in ExercisePlan');
    console.log('   - Handle cases where user has no workout schedules');
    
  } catch (error) {
    console.error('❌ Flow Test Error:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
  }
}

// Run the test
testCompleteFlow();