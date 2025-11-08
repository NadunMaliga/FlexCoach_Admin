// Test script for Admin API endpoints
// This script tests the admin login flow and user management endpoints

const axios = require('axios');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const config = require('./config');

// Import models
const Admin = require('./models/Admin');
const User = require('./models/User');

// Test configuration
const API_BASE_URL = `http://localhost:${config.PORT}`;
const TEST_ADMIN_EMAIL = 'admin@flexcoach.com';
const TEST_ADMIN_PASSWORD = 'admin123';

let adminToken = null;
let testUserId = null;

// Helper function to make API requests
async function makeRequest(method, endpoint, data = null, headers = {}) {
  try {
    const config = {
      method,
      url: `${API_BASE_URL}${endpoint}`,
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
      status: error.response?.status || 0,
      data: error.response?.data || { error: error.message }
    };
  }
}

// Test functions
async function testHealthCheck() {
  console.log('\n🔍 Testing Health Check...');
  
  const result = await makeRequest('GET', '/health');
  
  if (result.success && result.status === 200) {
    console.log('✅ Health check passed');
    console.log(`   Database: ${result.data.system.database}`);
    console.log(`   Port: ${result.data.system.port}`);
    return true;
  } else {
    console.log('❌ Health check failed');
    console.log(`   Status: ${result.status}`);
    console.log(`   Error: ${result.data.error || 'Unknown error'}`);
    return false;
  }
}

async function setupTestData() {
  console.log('\n🔧 Setting up test data...');
  
  try {
    // Connect to database
    await mongoose.connect(config.MONGODB_URI);
    console.log('✅ Connected to database');

    // Create test admin if it doesn't exist
    let admin = await Admin.findOne({ email: TEST_ADMIN_EMAIL });
    if (!admin) {
      const hashedPassword = await bcrypt.hash(TEST_ADMIN_PASSWORD, 10);
      admin = new Admin({
        username: 'admin',
        email: TEST_ADMIN_EMAIL,
        password: hashedPassword,
        role: 'admin',
        isActive: true
      });
      await admin.save();
      console.log('✅ Test admin created');
    } else {
      console.log('✅ Test admin already exists');
    }

    // Create test user if it doesn't exist
    let testUser = await User.findOne({ email: 'testuser@example.com' });
    if (!testUser) {
      testUser = new User({
        firstName: 'Test',
        lastName: 'User',
        email: 'testuser@example.com',
        mobile: '+1234567890',
        birthday: new Date('1990-01-01'),
        gender: 'Male',
        trainingMode: 'Online',
        status: 'pending'
      });
      await testUser.save();
      console.log('✅ Test user created');
    } else {
      console.log('✅ Test user already exists');
    }
    
    testUserId = testUser._id.toString();
    
    return true;
  } catch (error) {
    console.log('❌ Failed to setup test data');
    console.log(`   Error: ${error.message}`);
    return false;
  }
}

async function testAdminLogin() {
  console.log('\n🔐 Testing Admin Login Flow...');
  
  // Test 1: Valid credentials
  console.log('  Testing valid credentials...');
  const validLogin = await makeRequest('POST', '/api/admin/login', {
    email: TEST_ADMIN_EMAIL,
    password: TEST_ADMIN_PASSWORD
  });
  
  if (validLogin.success && validLogin.status === 200) {
    console.log('  ✅ Valid login successful');
    console.log(`     Token received: ${validLogin.data.token ? 'Yes' : 'No'}`);
    console.log(`     Admin data: ${validLogin.data.admin ? 'Yes' : 'No'}`);
    
    // Store token for subsequent tests
    adminToken = validLogin.data.token;
    
    // Verify response format matches frontend expectations
    const expectedFields = ['success', 'message', 'token', 'admin'];
    const hasAllFields = expectedFields.every(field => validLogin.data.hasOwnProperty(field));
    
    if (hasAllFields) {
      console.log('  ✅ Response format matches frontend expectations');
    } else {
      console.log('  ⚠️  Response format may not match frontend expectations');
      console.log(`     Expected fields: ${expectedFields.join(', ')}`);
      console.log(`     Received fields: ${Object.keys(validLogin.data).join(', ')}`);
    }
  } else {
    console.log('  ❌ Valid login failed');
    console.log(`     Status: ${validLogin.status}`);
    console.log(`     Error: ${validLogin.data.error || 'Unknown error'}`);
    return false;
  }
  
  // Test 2: Invalid credentials
  console.log('  Testing invalid credentials...');
  const invalidLogin = await makeRequest('POST', '/api/admin/login', {
    email: TEST_ADMIN_EMAIL,
    password: 'wrongpassword'
  });
  
  if (!invalidLogin.success && invalidLogin.status === 401) {
    console.log('  ✅ Invalid credentials properly rejected');
    console.log(`     Error code: ${invalidLogin.data.code}`);
  } else {
    console.log('  ❌ Invalid credentials not properly handled');
    console.log(`     Status: ${invalidLogin.status}`);
  }
  
  // Test 3: Missing fields
  console.log('  Testing missing fields...');
  const missingFields = await makeRequest('POST', '/api/admin/login', {
    email: TEST_ADMIN_EMAIL
    // password missing
  });
  
  if (!missingFields.success && missingFields.status === 400) {
    console.log('  ✅ Missing fields properly validated');
  } else {
    console.log('  ❌ Missing fields validation failed');
    console.log(`     Status: ${missingFields.status}`);
  }
  
  return true;
}

async function testAdminProfile() {
  console.log('\n👤 Testing Admin Profile Endpoint...');
  
  if (!adminToken) {
    console.log('  ❌ No admin token available');
    return false;
  }
  
  const profileResult = await makeRequest('GET', '/api/admin/profile', null, {
    'Authorization': `Bearer ${adminToken}`
  });
  
  if (profileResult.success && profileResult.status === 200) {
    console.log('  ✅ Admin profile retrieved successfully');
    console.log(`     Admin ID: ${profileResult.data.admin?.id}`);
    console.log(`     Email: ${profileResult.data.admin?.email}`);
    console.log(`     Role: ${profileResult.data.admin?.role}`);
    return true;
  } else {
    console.log('  ❌ Admin profile retrieval failed');
    console.log(`     Status: ${profileResult.status}`);
    console.log(`     Error: ${profileResult.data.error || 'Unknown error'}`);
    return false;
  }
}

async function testUserManagement() {
  console.log('\n👥 Testing User Management Endpoints...');
  
  if (!adminToken) {
    console.log('  ❌ No admin token available');
    return false;
  }
  
  const authHeaders = { 'Authorization': `Bearer ${adminToken}` };
  
  // Test 1: Get all users
  console.log('  Testing GET /api/admin/users...');
  const usersResult = await makeRequest('GET', '/api/admin/users', null, authHeaders);
  
  if (usersResult.success && usersResult.status === 200) {
    console.log('  ✅ Users list retrieved successfully');
    console.log(`     Total users: ${usersResult.data.users?.length || 0}`);
    console.log(`     Pagination info: ${usersResult.data.pagination ? 'Yes' : 'No'}`);
    
    // Verify response format matches frontend expectations
    const expectedUserFields = ['_id', 'firstName', 'lastName', 'email', 'status', 'createdAt'];
    if (usersResult.data.users && usersResult.data.users.length > 0) {
      const firstUser = usersResult.data.users[0];
      const hasExpectedFields = expectedUserFields.every(field => firstUser.hasOwnProperty(field));
      
      if (hasExpectedFields) {
        console.log('  ✅ User data format matches frontend expectations');
      } else {
        console.log('  ⚠️  User data format may not match frontend expectations');
        console.log(`     Expected fields: ${expectedUserFields.join(', ')}`);
        console.log(`     Received fields: ${Object.keys(firstUser).join(', ')}`);
      }
    }
  } else {
    console.log('  ❌ Users list retrieval failed');
    console.log(`     Status: ${usersResult.status}`);
    console.log(`     Error: ${usersResult.data.error || 'Unknown error'}`);
    return false;
  }
  
  // Test 2: Get pending users
  console.log('  Testing GET /api/admin/users/pending...');
  const pendingResult = await makeRequest('GET', '/api/admin/users/pending', null, authHeaders);
  
  if (pendingResult.success && pendingResult.status === 200) {
    console.log('  ✅ Pending users retrieved successfully');
    console.log(`     Pending count: ${pendingResult.data.count || 0}`);
  } else {
    console.log('  ❌ Pending users retrieval failed');
    console.log(`     Status: ${pendingResult.status}`);
  }
  
  // Test 3: User approval
  if (testUserId) {
    console.log('  Testing POST /api/admin/users/:userId/approve...');
    const approveResult = await makeRequest('POST', `/api/admin/users/${testUserId}/approve`, null, authHeaders);
    
    if (approveResult.success && approveResult.status === 200) {
      console.log('  ✅ User approval successful');
      console.log(`     Message: ${approveResult.data.message}`);
    } else {
      console.log('  ❌ User approval failed');
      console.log(`     Status: ${approveResult.status}`);
      console.log(`     Error: ${approveResult.data.error || 'Unknown error'}`);
    }
    
    // Test 4: User rejection (reset user to pending first)
    console.log('  Testing POST /api/admin/users/:userId/reject...');
    
    // First reset user to pending status
    try {
      await User.findByIdAndUpdate(testUserId, { status: 'pending' });
    } catch (error) {
      console.log('  ⚠️  Could not reset user status for rejection test');
    }
    
    const rejectResult = await makeRequest('POST', `/api/admin/users/${testUserId}/reject`, {
      reason: 'Test rejection reason'
    }, authHeaders);
    
    if (rejectResult.success && rejectResult.status === 200) {
      console.log('  ✅ User rejection successful');
      console.log(`     Message: ${rejectResult.data.message}`);
    } else {
      console.log('  ❌ User rejection failed');
      console.log(`     Status: ${rejectResult.status}`);
      console.log(`     Error: ${rejectResult.data.error || 'Unknown error'}`);
    }
  }
  
  return true;
}

async function testDashboardStats() {
  console.log('\n📊 Testing Dashboard Statistics...');
  
  if (!adminToken) {
    console.log('  ❌ No admin token available');
    return false;
  }
  
  const statsResult = await makeRequest('GET', '/api/admin/dashboard/stats', null, {
    'Authorization': `Bearer ${adminToken}`
  });
  
  if (statsResult.success && statsResult.status === 200) {
    console.log('  ✅ Dashboard stats retrieved successfully');
    const stats = statsResult.data.stats;
    console.log(`     Total users: ${stats?.totalUsers || 0}`);
    console.log(`     Pending users: ${stats?.pendingUsers || 0}`);
    console.log(`     Approved users: ${stats?.approvedUsers || 0}`);
    console.log(`     Rejected users: ${stats?.rejectedUsers || 0}`);
    return true;
  } else {
    console.log('  ❌ Dashboard stats retrieval failed');
    console.log(`     Status: ${statsResult.status}`);
    console.log(`     Error: ${statsResult.data.error || 'Unknown error'}`);
    return false;
  }
}

async function testAuthenticationFlow() {
  console.log('\n🔒 Testing Authentication Flow...');
  
  // Test 1: Access protected endpoint without token
  console.log('  Testing access without token...');
  const noTokenResult = await makeRequest('GET', '/api/admin/users');
  
  if (!noTokenResult.success && noTokenResult.status === 401) {
    console.log('  ✅ Properly rejected request without token');
  } else {
    console.log('  ❌ Should have rejected request without token');
    console.log(`     Status: ${noTokenResult.status}`);
  }
  
  // Test 2: Access with invalid token
  console.log('  Testing access with invalid token...');
  const invalidTokenResult = await makeRequest('GET', '/api/admin/users', null, {
    'Authorization': 'Bearer invalid_token_here'
  });
  
  if (!invalidTokenResult.success && [401, 403].includes(invalidTokenResult.status)) {
    console.log('  ✅ Properly rejected request with invalid token');
  } else {
    console.log('  ❌ Should have rejected request with invalid token');
    console.log(`     Status: ${invalidTokenResult.status}`);
  }
  
  // Test 3: Token refresh
  if (adminToken) {
    console.log('  Testing token refresh...');
    const refreshResult = await makeRequest('POST', '/api/admin/refresh-token', null, {
      'Authorization': `Bearer ${adminToken}`
    });
    
    if (refreshResult.success && refreshResult.status === 200) {
      console.log('  ✅ Token refresh successful');
      console.log(`     New token received: ${refreshResult.data.token ? 'Yes' : 'No'}`);
    } else {
      console.log('  ❌ Token refresh failed');
      console.log(`     Status: ${refreshResult.status}`);
    }
  }
  
  return true;
}

async function testErrorHandling() {
  console.log('\n⚠️  Testing Error Handling...');
  
  // Test 1: Invalid user ID format
  console.log('  Testing invalid user ID format...');
  const invalidIdResult = await makeRequest('POST', '/api/admin/users/invalid_id/approve', null, {
    'Authorization': `Bearer ${adminToken}`
  });
  
  if (!invalidIdResult.success && invalidIdResult.status === 400) {
    console.log('  ✅ Invalid ID format properly handled');
  } else {
    console.log('  ❌ Invalid ID format not properly handled');
    console.log(`     Status: ${invalidIdResult.status}`);
  }
  
  // Test 2: Non-existent user
  console.log('  Testing non-existent user...');
  const nonExistentResult = await makeRequest('POST', '/api/admin/users/507f1f77bcf86cd799439011/approve', null, {
    'Authorization': `Bearer ${adminToken}`
  });
  
  if (!nonExistentResult.success && nonExistentResult.status === 404) {
    console.log('  ✅ Non-existent user properly handled');
  } else {
    console.log('  ❌ Non-existent user not properly handled');
    console.log(`     Status: ${nonExistentResult.status}`);
  }
  
  return true;
}

async function cleanup() {
  console.log('\n🧹 Cleaning up...');
  
  try {
    if (mongoose.connection.readyState === 1) {
      await mongoose.connection.close();
      console.log('✅ Database connection closed');
    }
  } catch (error) {
    console.log('⚠️  Error during cleanup:', error.message);
  }
}

// Main test runner
async function runTests() {
  console.log('🚀 Starting Admin API Tests');
  console.log(`📍 API Base URL: ${API_BASE_URL}`);
  console.log(`📧 Test Admin: ${TEST_ADMIN_EMAIL}`);
  
  let allTestsPassed = true;
  
  try {
    // Setup
    if (!await testHealthCheck()) {
      console.log('\n❌ Health check failed - server may not be running');
      console.log('   Please ensure the admin backend is running on port 3001');
      return;
    }
    
    if (!await setupTestData()) {
      console.log('\n❌ Test data setup failed');
      return;
    }
    
    // Core tests
    allTestsPassed = await testAdminLogin() && allTestsPassed;
    allTestsPassed = await testAdminProfile() && allTestsPassed;
    allTestsPassed = await testUserManagement() && allTestsPassed;
    allTestsPassed = await testDashboardStats() && allTestsPassed;
    allTestsPassed = await testAuthenticationFlow() && allTestsPassed;
    allTestsPassed = await testErrorHandling() && allTestsPassed;
    
    // Results
    console.log('\n' + '='.repeat(50));
    if (allTestsPassed) {
      console.log('🎉 All tests completed successfully!');
      console.log('✅ Admin API is ready for frontend integration');
    } else {
      console.log('⚠️  Some tests failed - please review the output above');
    }
    console.log('='.repeat(50));
    
  } catch (error) {
    console.log('\n❌ Test execution failed:', error.message);
  } finally {
    await cleanup();
  }
}

// Run tests if this file is executed directly
if (require.main === module) {
  runTests();
}

module.exports = {
  runTests,
  testAdminLogin,
  testUserManagement,
  testAuthenticationFlow
};