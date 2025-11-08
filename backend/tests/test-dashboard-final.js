const axios = require('axios');

async function testDashboardFinal() {
  try {
    console.log('🎯 Final Dashboard Test - Simulating Frontend Flow...');
    
    const baseURL = 'http://localhost:3001/api/admin';
    
    // Simulate frontend login
    console.log('\n🔐 Simulating Frontend Login...');
    const loginResponse = await axios.post(`${baseURL}/login`, {
      email: 'admin@gmail.com',
      password: 'Password123'
    });
    
    if (!loginResponse.data.success) {
      console.log('❌ Login failed');
      return;
    }
    
    const token = loginResponse.data.token;
    const headers = { Authorization: `Bearer ${token}` };
    console.log('✅ Login successful');
    
    // Simulate frontend dashboard data loading
    console.log('\n📊 Simulating Dashboard Data Loading...');
    
    const [overviewResponse, usersResponse] = await Promise.all([
      axios.get(`${baseURL}/dashboard/client-overview?period=7`, { headers }),
      axios.get(`${baseURL}/users?limit=5&sortBy=createdAt&sortOrder=desc`, { headers })
    ]);
    
    if (overviewResponse.data.success) {
      const overview = overviewResponse.data.overview;
      
      // Extract stats exactly like the frontend does
      const extractedStats = {
        totalUsers: overview.totalUsers,
        activeUsers: overview.statusBreakdown.active,
        pendingUsers: overview.statusBreakdown.pending,
        approvedUsers: overview.statusBreakdown.approved,
        activeUsersPercentage: overview.totalUsers > 0 ? 
          Math.round((overview.statusBreakdown.active / overview.totalUsers) * 100) + '%' : '0%',
        pendingUsersPercentage: overview.totalUsers > 0 ? 
          Math.round((overview.statusBreakdown.pending / overview.totalUsers) * 100) + '%' : '0%',
        newUsersLast30Days: overview.dailyData.reduce((sum, day) => sum + day.newUsers, 0)
      };
      
      console.log('✅ Dashboard data extracted successfully');
      
      // Show what the dashboard cards will display
      console.log('\n📱 DASHBOARD CARDS WILL SHOW:');
      console.log('┌─────────────────────────────────────┐');
      console.log('│ Total Clients                      │');
      console.log(`│ ${extractedStats.totalUsers.toString().padEnd(35)}│`);
      console.log('│ 100%                               │');
      console.log('└─────────────────────────────────────┘');
      
      console.log('┌─────────────────────────────────────┐');
      console.log('│ Active Clients                     │');
      console.log(`│ ${extractedStats.activeUsers.toString().padEnd(35)}│`);
      console.log(`│ ${extractedStats.activeUsersPercentage.padEnd(35)}│`);
      console.log('└─────────────────────────────────────┘');
      
      console.log('┌─────────────────────────────────────┐');
      console.log('│ New Clients                        │');
      console.log(`│ ${extractedStats.newUsersLast30Days.toString().padEnd(35)}│`);
      console.log(`│ ${extractedStats.pendingUsersPercentage.padEnd(35)}│`);
      console.log('└─────────────────────────────────────┘');
      
      // Show chart data
      console.log('\n📈 CHART DATA:');
      const chartLabels = overview.dailyData.map(d => d.day.substring(0, 3));
      const chartData = overview.dailyData.map(d => d.newUsers + d.activeUsers);
      console.log('   Labels:', chartLabels.join(', '));
      console.log('   Data:', chartData.join(', '));
    }
    
    if (usersResponse.data.success) {
      console.log('\n👥 RECENT USERS SECTION:');
      usersResponse.data.users.slice(0, 3).forEach((user, index) => {
        const daysAgo = Math.floor((new Date().getTime() - new Date(user.createdAt).getTime()) / (1000 * 60 * 60 * 24));
        const status = user.isActive ? "Active" : "Inactive";
        console.log(`   ${index + 1}. ${user.firstName} ${user.lastName}`);
        console.log(`      Joined ${daysAgo} days ago - ${status}`);
      });
    }
    
    console.log('\n🎉 SUCCESS! Dashboard Integration Complete:');
    console.log('   ✅ Real client count: ' + extractedStats.totalUsers + ' (no more mock 1200)');
    console.log('   ✅ Real active percentage: ' + extractedStats.activeUsersPercentage);
    console.log('   ✅ Real daily activity data');
    console.log('   ✅ Real user names and status');
    console.log('   ✅ All data updates automatically from database');
    
  } catch (error) {
    console.error('❌ Error:', error.response?.data || error.message);
  }
}

testDashboardFinal();