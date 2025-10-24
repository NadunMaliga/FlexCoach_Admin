const mongoose = require('mongoose');
const config = require('./config');

// Import models
const User = require('./models/User');
const Diet = require('./models/Diet');
const Workout = require('./models/Workout');

async function testDashboardStats() {
  try {
    // Connect to MongoDB
    await mongoose.connect(config.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Test dashboard statistics calculation
    console.log('\n=== Testing Dashboard Statistics ===');

    // Get user statistics
    const totalUsers = await User.countDocuments();
    const activeUsers = await User.countDocuments({ isActive: true });
    const pendingUsers = await User.countDocuments({ isApproved: false });
    const approvedUsers = await User.countDocuments({ isApproved: true });

    console.log('User Statistics:');
    console.log(`- Total Users: ${totalUsers}`);
    console.log(`- Active Users: ${activeUsers}`);
    console.log(`- Pending Users: ${pendingUsers}`);
    console.log(`- Approved Users: ${approvedUsers}`);

    // Calculate percentages
    const activeUsersPercentage = totalUsers > 0 ? Math.round((activeUsers / totalUsers) * 100) : 0;
    const pendingUsersPercentage = totalUsers > 0 ? Math.round((pendingUsers / totalUsers) * 100) : 0;

    console.log('\nPercentages:');
    console.log(`- Active Users: ${activeUsersPercentage}%`);
    console.log(`- Pending Users: ${pendingUsersPercentage}%`);

    // Get content statistics
    const totalDietPlans = await Diet.countDocuments();
    const totalWorkouts = await Workout.countDocuments();

    console.log('\nContent Statistics:');
    console.log(`- Total Diet Plans: ${totalDietPlans}`);
    console.log(`- Total Workouts: ${totalWorkouts}`);

    // Get recent activity (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const newUsersLast30Days = await User.countDocuments({
      createdAt: { $gte: thirtyDaysAgo }
    });

    const newDietPlansLast30Days = await Diet.countDocuments({
      createdAt: { $gte: thirtyDaysAgo }
    });

    console.log('\nRecent Activity (Last 30 Days):');
    console.log(`- New Users: ${newUsersLast30Days}`);
    console.log(`- New Diet Plans: ${newDietPlansLast30Days}`);

    // Test daily registrations
    console.log('\n=== Testing Daily Registrations (Last 7 Days) ===');
    const dailyRegistrations = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const startOfDay = new Date(date.setHours(0, 0, 0, 0));
      const endOfDay = new Date(date.setHours(23, 59, 59, 999));

      const count = await User.countDocuments({
        createdAt: { $gte: startOfDay, $lte: endOfDay }
      });

      const dayName = startOfDay.toLocaleDateString('en-US', { weekday: 'short' });
      console.log(`${dayName} (${startOfDay.toISOString().split('T')[0]}): ${count} users`);

      dailyRegistrations.push({
        date: startOfDay.toISOString().split('T')[0],
        count
      });
    }

    // Get recent users
    console.log('\n=== Testing Recent Users ===');
    const recentUsers = await User.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .select('firstName lastName createdAt isActive');

    recentUsers.forEach((user, index) => {
      const daysAgo = Math.floor((new Date() - user.createdAt) / (1000 * 60 * 60 * 24));
      console.log(`${index + 1}. ${user.firstName} ${user.lastName} - ${daysAgo} days ago (${user.isActive ? 'Active' : 'Inactive'})`);
    });

    console.log('\n✅ Dashboard statistics test completed successfully!');

  } catch (error) {
    console.error('❌ Dashboard statistics test failed:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

// Run the test
testDashboardStats();