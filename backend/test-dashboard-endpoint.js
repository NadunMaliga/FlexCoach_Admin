const fetch = require('node-fetch');

async function testDashboardEndpoint() {
  try {
    console.log('Testing Dashboard API Endpoint...\n');

    const baseUrl = 'http://localhost:3001';

    // Test dashboard stats endpoint
    console.log('1. Testing /api/admin/dashboard/stats');
    const statsResponse = await fetch(`${baseUrl}/api/admin/dashboard/stats`);
    const statsData = await statsResponse.json();
    
    if (statsData.success) {
      console.log('✅ Dashboard stats endpoint working!');
      console.log('Stats:', {
        totalUsers: statsData.stats.totalUsers,
        activeUsers: statsData.stats.activeUsers,
        pendingUsers: statsData.stats.pendingUsers,
        activeUsersPercentage: statsData.stats.activeUsersPercentage,
        pendingUsersPercentage: statsData.stats.pendingUsersPercentage
      });
    } else {
      console.log('❌ Dashboard stats endpoint failed:', statsData.error);
    }

    console.log('\n2. Testing /api/admin/dashboard/client-overview');
    const overviewResponse = await fetch(`${baseUrl}/api/admin/dashboard/client-overview?period=7`);
    const overviewData = await overviewResponse.json();
    
    if (overviewData.success) {
      console.log('✅ Client overview endpoint working!');
      console.log('Overview:', {
        period: overviewData.overview.period,
        totalUsers: overviewData.overview.totalUsers,
        dailyDataLength: overviewData.overview.dailyData.length,
        statusBreakdown: overviewData.overview.statusBreakdown
      });
      
      console.log('\nDaily Data Sample:');
      overviewData.overview.dailyData.slice(0, 3).forEach(day => {
        console.log(`${day.day} (${day.date}): ${day.newUsers} new, ${day.activeUsers} active`);
      });
    } else {
      console.log('❌ Client overview endpoint failed:', overviewData.error);
    }

    console.log('\n3. Testing /api/admin/dashboard/recent-activity');
    const activityResponse = await fetch(`${baseUrl}/api/admin/dashboard/recent-activity?limit=5`);
    const activityData = await activityResponse.json();
    
    if (activityData.success) {
      console.log('✅ Recent activity endpoint working!');
      console.log('Recent Users:', activityData.activity.recentUsers.length);
      console.log('Recent Diet Plans:', activityData.activity.recentDietPlans.length);
      console.log('Recent Workouts:', activityData.activity.recentWorkouts.length);
      
      if (activityData.activity.recentUsers.length > 0) {
        console.log('\nSample Recent User:');
        const user = activityData.activity.recentUsers[0];
        console.log(`${user.name} - ${user.daysAgo} days ago (${user.isActive ? 'Active' : 'Inactive'})`);
      }
    } else {
      console.log('❌ Recent activity endpoint failed:', activityData.error);
    }

    console.log('\n🎉 Dashboard API testing completed!');

  } catch (error) {
    console.error('❌ Dashboard API test failed:', error.message);
    console.log('\n💡 Make sure the backend server is running on http://localhost:3001');
  }
}

// Run the test
testDashboardEndpoint();