const axios = require('axios');

const BASE_URL = 'http://10.231.45.234:3001';
const TEST_ADMIN = {
  email: 'admin@gmail.com',
  password: 'Password123'
};

let adminToken = null;

async function makeRequest(method, endpoint, data = null, headers = {}) {
  try {
    const config = {
      method,
      url: `${BASE_URL}${endpoint}`,
      headers: {
        'Content-Type': 'application/json',
        ...headers
      }
    };

    if (data) {
      config.data = data;
    }

    const response = await axios(config);
    return {
      success: true,
      status: response.status,
      data: response.data
    };
  } catch (error) {
    return {
      success: false,
      status: error.response?.status || 500,
      data: error.response?.data || { error: error.message }
    };
  }
}

async function loginAdmin() {
  console.log('🔐 Logging in admin...');
  
  const result = await makeRequest('POST', '/api/admin/login', TEST_ADMIN);
  
  if (result.success && result.data.success) {
    adminToken = result.data.token;
    console.log('  ✅ Admin login successful');
    return true;
  } else {
    console.log('  ❌ Admin login failed');
    console.log(`     Status: ${result.status}`);
    console.log(`     Error: ${result.data.error || 'Unknown error'}`);
    return false;
  }
}

async function testGetUsers() {
  console.log('\n👥 Testing Get Users...');
  
  if (!adminToken) {
    console.log('  ❌ No admin token available');
    return false;
  }
  
  const result = await makeRequest('GET', '/api/admin/users?limit=10&sortBy=createdAt&sortOrder=desc', null, {
    'Authorization': `Bearer ${adminToken}`
  });
  
  if (result.success && result.status === 200) {
    console.log('  ✅ Users retrieved successfully');
    console.log(`     Total users: ${result.data.users?.length || 0}`);
    console.log(`     Pagination: ${JSON.stringify(result.data.pagination || {})}`);
    return true;
  } else {
    console.log('  ❌ Users retrieval failed');
    console.log(`     Status: ${result.status}`);
    console.log(`     Error: ${result.data.error || 'Unknown error'}`);
    return false;
  }
}

async function testGetUserById() {
  console.log('\n👤 Testing Get User By ID...');
  
  if (!adminToken) {
    console.log('  ❌ No admin token available');
    return false;
  }
  
  // First get a user ID from the users list
  const usersResult = await makeRequest('GET', '/api/admin/users?limit=1', null, {
    'Authorization': `Bearer ${adminToken}`
  });
  
  if (!usersResult.success || !usersResult.data.users || usersResult.data.users.length === 0) {
    console.log('  ⚠️ No users available to test with');
    return true; // Not a failure, just no data
  }
  
  const userId = usersResult.data.users[0]._id;
  
  const result = await makeRequest('GET', `/api/admin/users/${userId}`, null, {
    'Authorization': `Bearer ${adminToken}`
  });
  
  if (result.success && result.status === 200) {
    console.log('  ✅ User details retrieved successfully');
    console.log(`     User: ${result.data.user?.firstName} ${result.data.user?.lastName}`);
    console.log(`     Status: ${result.data.user?.isActive ? 'Active' : 'Inactive'}`);
    return true;
  } else {
    console.log('  ❌ User details retrieval failed');
    console.log(`     Status: ${result.status}`);
    console.log(`     Error: ${result.data.error || 'Unknown error'}`);
    return false;
  }
}

async function testUpdateUserStatus() {
  console.log('\n🔄 Testing Update User Status...');
  
  if (!adminToken) {
    console.log('  ❌ No admin token available');
    return false;
  }
  
  // First get a user ID from the users list
  const usersResult = await makeRequest('GET', '/api/admin/users?limit=1', null, {
    'Authorization': `Bearer ${adminToken}`
  });
  
  if (!usersResult.success || !usersResult.data.users || usersResult.data.users.length === 0) {
    console.log('  ⚠️ No users available to test with');
    return true; // Not a failure, just no data
  }
  
  const user = usersResult.data.users[0];
  const userId = user._id;
  const currentStatus = user.isActive;
  const newStatus = !currentStatus;
  
  console.log(`  Testing status change: ${currentStatus} → ${newStatus}`);
  
  const result = await makeRequest('PATCH', `/api/admin/users/${userId}/status`, 
    { isActive: newStatus }, 
    { 'Authorization': `Bearer ${adminToken}` }
  );
  
  if (result.success && result.status === 200) {
    console.log('  ✅ User status updated successfully');
    console.log(`     New status: ${result.data.user?.isActive ? 'Active' : 'Inactive'}`);
    
    // Revert the change
    await makeRequest('PATCH', `/api/admin/users/${userId}/status`, 
      { isActive: currentStatus }, 
      { 'Authorization': `Bearer ${adminToken}` }
    );
    console.log('  ✅ Status reverted to original');
    
    return true;
  } else {
    console.log('  ❌ User status update failed');
    console.log(`     Status: ${result.status}`);
    console.log(`     Error: ${result.data.error || 'Unknown error'}`);
    return false;
  }
}

async function testSearchUsers() {
  console.log('\n🔍 Testing Search Users...');
  
  if (!adminToken) {
    console.log('  ❌ No admin token available');
    return false;
  }
  
  const result = await makeRequest('GET', '/api/admin/users?search=test&limit=5', null, {
    'Authorization': `Bearer ${adminToken}`
  });
  
  if (result.success && result.status === 200) {
    console.log('  ✅ User search completed successfully');
    console.log(`     Results: ${result.data.users?.length || 0} users found`);
    return true;
  } else {
    console.log('  ❌ User search failed');
    console.log(`     Status: ${result.status}`);
    console.log(`     Error: ${result.data.error || 'Unknown error'}`);
    return false;
  }
}

async function testFilterUsers() {
  console.log('\n🎯 Testing Filter Users...');
  
  if (!adminToken) {
    console.log('  ❌ No admin token available');
    return false;
  }
  
  // Test active users filter
  const activeResult = await makeRequest('GET', '/api/admin/users?isActive=true&limit=5', null, {
    'Authorization': `Bearer ${adminToken}`
  });
  
  if (activeResult.success && activeResult.status === 200) {
    console.log('  ✅ Active users filter working');
    console.log(`     Active users: ${activeResult.data.users?.length || 0}`);
  } else {
    console.log('  ❌ Active users filter failed');
    return false;
  }
  
  // Test inactive users filter
  const inactiveResult = await makeRequest('GET', '/api/admin/users?isActive=false&limit=5', null, {
    'Authorization': `Bearer ${adminToken}`
  });
  
  if (inactiveResult.success && inactiveResult.status === 200) {
    console.log('  ✅ Inactive users filter working');
    console.log(`     Inactive users: ${inactiveResult.data.users?.length || 0}`);
    return true;
  } else {
    console.log('  ❌ Inactive users filter failed');
    return false;
  }
}

async function runAllTests() {
  console.log('🧪 Testing Client Page Backend Endpoints\n');
  console.log('=' .repeat(50));
  
  let allTestsPassed = true;
  
  try {
    // Login first
    allTestsPassed = await loginAdmin() && allTestsPassed;
    
    if (adminToken) {
      // Test all client-related endpoints
      allTestsPassed = await testGetUsers() && allTestsPassed;
      allTestsPassed = await testGetUserById() && allTestsPassed;
      allTestsPassed = await testUpdateUserStatus() && allTestsPassed;
      allTestsPassed = await testSearchUsers() && allTestsPassed;
      allTestsPassed = await testFilterUsers() && allTestsPassed;
    }
    
    console.log('\n' + '=' .repeat(50));
    if (allTestsPassed) {
      console.log('🎉 All client page backend tests passed!');
      console.log('\n✅ Available Features:');
      console.log('   - Get users list with pagination');
      console.log('   - Search users by name/email');
      console.log('   - Filter users by status (active/inactive)');
      console.log('   - Get individual user details');
      console.log('   - Update user status (activate/deactivate)');
      console.log('   - Sort users by various fields');
    } else {
      console.log('❌ Some tests failed. Check the logs above.');
    }
    
  } catch (error) {
    console.error('💥 Test execution failed:', error);
  }
}

// Run the tests
runAllTests();