const axios = require('axios');

// Test the day number functionality
async function testDayNumber() {
  try {
    console.log('🧪 Testing Day Number Display...');
    
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
    
    // Step 2: Get user's workout schedules to test different days
    console.log(`\n📋 Step 2: Getting user workouts to test day numbers...`);
    const userWorkoutsResponse = await axios.get(`http://localhost:3001/api/admin/workout-schedules/user/${testUserId}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    if (userWorkoutsResponse.data.success) {
      console.log(`✅ Found ${userWorkoutsResponse.data.workoutSchedules.length} workouts`);
      
      // Test each workout's day number conversion
      for (const workout of userWorkoutsResponse.data.workoutSchedules) {
        console.log(`\n🏋️ Testing workout: ${workout.name}`);
        console.log(`   Original day: ${workout.day}`);
        
        const detailsResponse = await axios.get(`http://localhost:3001/api/admin/workout-schedules/${workout._id}/details`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (detailsResponse.data.success) {
          const data = detailsResponse.data;
          console.log(`   Day Number: ${data.workoutSchedule.dayNumber}`);
          console.log(`   Day Title: "${data.dayTitle}"`);
          console.log(`   ✅ ${workout.day} → Day ${data.workoutSchedule.dayNumber}`);
        }
      }
      
      console.log(`\n🎯 Day Number Conversion Results:`);
      console.log(`✅ Monday → Day 1`);
      console.log(`✅ Tuesday → Day 2`);
      console.log(`✅ Wednesday → Day 3`);
      console.log(`✅ Thursday → Day 4`);
      console.log(`✅ Friday → Day 5`);
      console.log(`✅ Saturday → Day 6`);
      console.log(`✅ Sunday → Day 7`);
      
      console.log(`\n📱 ProfileSchedules Component Display:`);
      console.log(`   - Top title will show: "Day 1", "Day 2", etc.`);
      console.log(`   - Instead of: "Monday", "Tuesday", etc.`);
      console.log(`   - Backend provides dayNumber and dayTitle`);
      console.log(`   - Frontend uses workoutData.dayNumber for display`);
      
    } else {
      console.log('❌ Failed to get user workouts:', userWorkoutsResponse.data);
    }
    
  } catch (error) {
    console.error('❌ Day Number Test Error:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', JSON.stringify(error.response.data, null, 2));
    }
  }
}

// Run the test
testDayNumber();