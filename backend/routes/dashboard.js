const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Diet = require('../models/Diet');
const Workout = require('../models/Workout');

// Get dashboard statistics
router.get('/stats', async (req, res) => {
  try {
    console.log('Getting dashboard statistics...');

    // Get user statistics
    const totalUsers = await User.countDocuments();
    const activeUsers = await User.countDocuments({ isActive: true });
    const pendingUsers = await User.countDocuments({ isApproved: false });
    const approvedUsers = await User.countDocuments({ isApproved: true });

    // Calculate percentages
    const activeUsersPercentage = totalUsers > 0 ? Math.round((activeUsers / totalUsers) * 100) : 0;
    const pendingUsersPercentage = totalUsers > 0 ? Math.round((pendingUsers / totalUsers) * 100) : 0;
    const approvedUsersPercentage = totalUsers > 0 ? Math.round((approvedUsers / totalUsers) * 100) : 0;

    // Get recent activity statistics (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const newUsersLast30Days = await User.countDocuments({
      createdAt: { $gte: thirtyDaysAgo }
    });

    const newDietPlansLast30Days = await Diet.countDocuments({
      createdAt: { $gte: thirtyDaysAgo }
    });

    const newWorkoutsLast30Days = await Workout.countDocuments({
      createdAt: { $gte: thirtyDaysAgo }
    });

    // Get total content statistics
    const totalDietPlans = await Diet.countDocuments();
    const totalWorkouts = await Workout.countDocuments();

    // Get user registration trend (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const dailyRegistrations = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const startOfDay = new Date(date.setHours(0, 0, 0, 0));
      const endOfDay = new Date(date.setHours(23, 59, 59, 999));

      const count = await User.countDocuments({
        createdAt: { $gte: startOfDay, $lte: endOfDay }
      });

      dailyRegistrations.push({
        date: startOfDay.toISOString().split('T')[0],
        count
      });
    }

    const stats = {
      // Main statistics
      totalUsers,
      activeUsers,
      pendingUsers,
      approvedUsers,
      
      // Percentages
      activeUsersPercentage: `${activeUsersPercentage}%`,
      pendingUsersPercentage: `${pendingUsersPercentage}%`,
      approvedUsersPercentage: `${approvedUsersPercentage}%`,
      
      // Recent activity
      newUsersLast30Days,
      newDietPlansLast30Days,
      newWorkoutsLast30Days,
      
      // Content statistics
      totalDietPlans,
      totalWorkouts,
      
      // Trends
      dailyRegistrations,
      
      // Additional metrics
      averageUsersPerDay: Math.round(newUsersLast30Days / 30),
      userGrowthRate: totalUsers > newUsersLast30Days ? 
        Math.round((newUsersLast30Days / (totalUsers - newUsersLast30Days)) * 100) : 0
    };

    console.log('Dashboard stats calculated:', {
      totalUsers,
      activeUsers,
      pendingUsers,
      activeUsersPercentage: stats.activeUsersPercentage,
      pendingUsersPercentage: stats.pendingUsersPercentage
    });

    res.json({
      success: true,
      stats
    });

  } catch (error) {
    console.error('Get dashboard stats error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get dashboard statistics',
      details: error.message
    });
  }
});

// Get client overview data for charts
router.get('/client-overview', async (req, res) => {
  try {
    const { period = '7' } = req.query; // days
    const days = parseInt(period);

    console.log(`Getting client overview for last ${days} days...`);

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // Get daily user registrations
    const dailyData = [];
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const startOfDay = new Date(date.setHours(0, 0, 0, 0));
      const endOfDay = new Date(date.setHours(23, 59, 59, 999));

      const newUsers = await User.countDocuments({
        createdAt: { $gte: startOfDay, $lte: endOfDay }
      });

      const activeUsers = await User.countDocuments({
        isActive: true,
        lastLoginAt: { $gte: startOfDay, $lte: endOfDay }
      });

      dailyData.push({
        date: startOfDay.toISOString().split('T')[0],
        day: startOfDay.toLocaleDateString('en-US', { weekday: 'short' }),
        newUsers,
        activeUsers,
        totalUsers: newUsers + activeUsers
      });
    }

    // Get user status breakdown
    const statusBreakdown = {
      active: await User.countDocuments({ isActive: true }),
      inactive: await User.countDocuments({ isActive: false }),
      approved: await User.countDocuments({ isApproved: true }),
      pending: await User.countDocuments({ isApproved: false })
    };

    res.json({
      success: true,
      overview: {
        period: `${days} days`,
        dailyData,
        statusBreakdown,
        totalUsers: statusBreakdown.active + statusBreakdown.inactive
      }
    });

  } catch (error) {
    console.error('Get client overview error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get client overview',
      details: error.message
    });
  }
});

// Get recent activity summary
router.get('/recent-activity', async (req, res) => {
  try {
    const { limit = 10 } = req.query;

    console.log(`Getting recent activity (limit: ${limit})...`);

    // Get recent users
    const recentUsers = await User.find()
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .select('firstName lastName createdAt isActive profilePhoto');

    // Get user profiles for profile photos
    const UserProfile = require('../models/UserProfile');
    const usersWithProfiles = await Promise.all(
      recentUsers.map(async (user) => {
        try {
          const userProfile = await UserProfile.findOne({ userId: user._id }).select('profilePhoto');
          const profilePhoto = userProfile?.profilePhoto || user.profilePhoto;
          
          return {
            id: user._id,
            name: `${user.firstName} ${user.lastName}`,
            createdAt: user.createdAt,
            isActive: user.isActive,
            profilePhoto: profilePhoto,
            daysAgo: Math.floor((new Date() - user.createdAt) / (1000 * 60 * 60 * 24))
          };
        } catch (err) {
          console.log(`Profile not found for user ${user._id}:`, err.message);
          return {
            id: user._id,
            name: `${user.firstName} ${user.lastName}`,
            createdAt: user.createdAt,
            isActive: user.isActive,
            profilePhoto: user.profilePhoto,
            daysAgo: Math.floor((new Date() - user.createdAt) / (1000 * 60 * 60 * 24))
          };
        }
      })
    );

    // Get recent diet plans
    const recentDietPlans = await Diet.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .populate('userId', 'firstName lastName')
      .select('name createdAt userId');

    // Get recent workouts
    const recentWorkouts = await Workout.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .populate('userId', 'firstName lastName')
      .select('name createdAt userId');

    res.json({
      success: true,
      activity: {
        recentUsers: usersWithProfiles,
        recentDietPlans: recentDietPlans.map(plan => ({
          id: plan._id,
          name: plan.name,
          createdAt: plan.createdAt,
          user: plan.userId ? `${plan.userId.firstName} ${plan.userId.lastName}` : 'Unknown'
        })),
        recentWorkouts: recentWorkouts.map(workout => ({
          id: workout._id,
          name: workout.name,
          createdAt: workout.createdAt,
          user: workout.userId ? `${workout.userId.firstName} ${workout.userId.lastName}` : 'Unknown'
        }))
      }
    });

  } catch (error) {
    console.error('Get recent activity error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get recent activity',
      details: error.message
    });
  }
});

module.exports = router;