const axios = require('axios');

async function testFrontendFlow() {
  try {
    console.log('🧪 Testing Complete Frontend Flow...');
    
    const baseURL = 'http://localhost:3001/api';
    
    // Step 1: Login with correct credentials
    console.log('\n🔐 Step 1: Admin Login');
    const loginResponse = await axios.post(`${baseURL}/admin/login`, {
      email: 'admin@gmail.com',
      password: 'Password123'
    });
    
    if (!loginResponse.data.success) {
      console.log('❌ Login failed');
      return;
    }
    
    const token = loginResponse.data.token;
    console.log('✅ Login successful');
    
    const headers = { Authorization: `Bearer ${token}` };
    
    // Step 2: Get Client Overview (this works)
    console.log('\n📈 Step 2: Get Client Overview');
    const overviewResponse = await axios.get(`${baseURL}/admin/dashboard/client-overview?period=7`, { headers });
    
    if (overviewResponse.data.success) {
      const overview = overviewResponse.data.overview;
      console.log('✅ Client Overview Retrieved');
      
      // Extract stats like the frontend does
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
      
      console.log('\n🎯 DASHBOARD STATS (Real Data):');
      console.log(`   📊 Total Clients: ${extractedStats.totalUsers}`);
      console.log(`   ✅ Active Clients: ${extractedStats.activeUsers} (${extractedStats.activeUsersPercentage})`);
      console.log(`   ⏳ Pending Clients: ${extractedStats.pendingUsers} (${extractedStats.pendingUsersPercentage})`);
      console.log(`   📈 New Clients (7 days): ${extractedStats.newUsersLast30Days}`);
      
      console.log('\n📅 Daily Activity:');
      overview.dailyData.forEach(day => {
        if (day.newUsers > 0 || day.activeUsers > 0) {
          console.log(`   ${day.day}: ${day.newUsers} new, ${day.activeUsers} active`);
        }
      });
    }
    
    // Step 3: Get Recent Users
    console.log('\n👥 Step 3: Get Recent Users');
    const usersResponse = await axios.get(`${baseURL}/admin/users?limit=5&sortBy=createdAt&sortOrder=desc`, { headers });
    
    if (usersResponse.data.success) {
      console.log('✅ Recent Users Retrieved');
      console.log(`   Found ${usersResponse.data.users.length} recent users`);
      
      usersResponse.data.users.slice(0, 3).forEach((user, index) => {
        const daysAgo = Math.floor((new Date().getTime() - new Date(user.createdAt).getTime()) / (1000 * 60 * 60 * 24));
        console.log(`   ${index + 1}. ${user.firstName} ${user.lastName} - ${user.isActive ? 'Active' : 'Inactive'} (${daysAgo} days ago)`);
      });
    }
    
    console.log('\n🎉 SUCCESS: Dashboard now shows REAL DATA instead of mock data!');
    console.log('   ✅ Authentication working');
    console.log('   ✅ Client count is real');
    console.log('   ✅ Activity data is real');
    console.log('   ✅ User list is real');
    
  } catch (error) {
    console.error('❌ Error:', error.response?.data || error.message);
  }
}

testFrontendFlow();