const express = require('express');
const mongoose = require('mongoose');
const dashboardRoutes = require('./routes/dashboard');

async function testDashboardAPI() {
  try {
    // Connect to MongoDB
    await mongoose.connect('mongodb://localhost:27017/flexcoach');
    console.log('✅ Connected to MongoDB');
    
    // Create a mock Express app
    const app = express();
    app.use('/dashboard', dashboardRoutes);
    
    // Test the stats endpoint directly
    const mockReq = { query: {} };
    const mockRes = {
      json: (data) => {
        console.log('\n📊 Dashboard Stats API Response:');
        console.log(JSON.stringify(data, null, 2));
      },
      status: (code) => ({
        json: (data) => {
          console.log(`❌ Error Response (${code}):`, data);
        }
      })
    };
    
    // Import the route handler directly
    const User = require('./models/User');
    const Diet = require('./models/Diet');
    const Workout = require('./models/Workout');
    
    console.log('🧪 Testing dashboard stats calculation...');
    
    // Get user statistics
    const totalUsers = await User.countDocuments();
    const activeUsers = await User.countDocuments({ isActive: true });
    const pendingUsers = await User.countDocuments({ isApproved: false });
    const approvedUsers = await User.countDocuments({ isApproved: true });

    // Calculate percentages
    const activeUsersPercentage = totalUsers > 0 ? Math.round((activeUsers / totalUsers) * 100) : 0;
    const pendingUsersPercentage = totalUsers > 0 ? Math.round((pendingUsers / totalUsers) * 100) : 0;

    // Get recent activity statistics (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const newUsersLast30Days = await User.countDocuments({
      createdAt: { $gte: thirtyDaysAgo }
    });

    const totalDietPlans = await Diet.countDocuments();
    const totalWorkouts = await Workout.countDocuments();

    const stats = {
      totalUsers,
      activeUsers,
      pendingUsers,
      approvedUsers,
      activeUsersPercentage: `${activeUsersPercentage}%`,
      pendingUsersPercentage: `${pendingUsersPercentage}%`,
      newUsersLast30Days,
      totalDietPlans,
      totalWorkouts
    };

    console.log('\n✅ Calculated Stats:');
    console.log(JSON.stringify(stats, null, 2));
    
    mongoose.connection.close();
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

testDashboardAPI();