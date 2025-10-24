const mongoose = require('mongoose');
const User = require('./models/User');
const Diet = require('./models/Diet');
const Workout = require('./models/Workout');

async function testDashboardData() {
  try {
    // Connect to MongoDB
    await mongoose.connect('mongodb://localhost:27017/flexcoach', {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    
    console.log('✅ Connected to MongoDB');
    
    // Test user statistics
    const totalUsers = await User.countDocuments();
    const activeUsers = await User.countDocuments({ isActive: true });
    const pendingUsers = await User.countDocuments({ isApproved: false });
    
    console.log('\n📊 Dashboard Statistics:');
    console.log('Total Users:', totalUsers);
    console.log('Active Users:', activeUsers);
    console.log('Pending Users:', pendingUsers);
    
    // Calculate percentages
    const activePercentage = totalUsers > 0 ? Math.round((activeUsers / totalUsers) * 100) : 0;
    const pendingPercentage = totalUsers > 0 ? Math.round((pendingUsers / totalUsers) * 100) : 0;
    
    console.log('Active Users Percentage:', activePercentage + '%');
    console.log('Pending Users Percentage:', pendingPercentage + '%');
    
    // Get recent users (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const newUsersLast30Days = await User.countDocuments({
      createdAt: { $gte: thirtyDaysAgo }
    });
    
    console.log('New Users (Last 30 Days):', newUsersLast30Days);
    
    // Get sample users
    const sampleUsers = await User.find()
      .limit(5)
      .select('firstName lastName isActive createdAt isApproved')
      .sort({ createdAt: -1 });
    
    console.log('\n👥 Sample Users:');
    sampleUsers.forEach((user, index) => {
      console.log(`${index + 1}. ${user.firstName} ${user.lastName} - Active: ${user.isActive}, Approved: ${user.isApproved}, Created: ${user.createdAt.toDateString()}`);
    });
    
    // Test diet and workout counts
    const totalDietPlans = await Diet.countDocuments();
    const totalWorkouts = await Workout.countDocuments();
    
    console.log('\n📋 Content Statistics:');
    console.log('Total Diet Plans:', totalDietPlans);
    console.log('Total Workouts:', totalWorkouts);
    
    mongoose.connection.close();
    console.log('\n✅ Test completed successfully');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

testDashboardData();