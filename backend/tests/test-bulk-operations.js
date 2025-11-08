const axios = require('axios');
const mongoose = require('mongoose');
const config = require('./config');

// Import models
const User = require('./models/User');
const Admin = require('./models/Admin');

const BASE_URL = 'http://localhost:3001';

// Test configuration
const TEST_ADMIN = {
  email: 'admin@flexcoach.com',
  password: 'admin123'
};

let adminToken = '';

async function connectToDatabase() {
  try {
    await mongoose.connect(config.MONGODB_URI);
    console.log('✅ Connected to MongoDB for testing');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    process.exit(1);
  }
}

async function loginAdmin() {
  try {
    const response = await axios.post(`${BASE_URL}/api/admin/login`, TEST_ADMIN);
    
    if (response.data.success) {
      adminToken = response.data.token;
      console.log('✅ Admin login successful');
      return true;
    } else {
      console.error('❌ Admin login failed:', response.data.error);
      return false;
    }
  } catch (error) {
    console.error('❌ Admin login error:', error.response?.data || error.message);
    return false;
  }
}

async function createTestUsers() {
  try {
    console.log('\n📝 Creating test users...');
    
    const testUsers = [
      {
        firstName: 'John',
        lastName: 'Doe',
        email: 'john.doe.bulk@test.com',
        mobile: '1234567890',
        birthday: new Date('1990-01-01'),
        gender: 'Male',
        trainingMode: 'Online',
        status: 'pending'
      },
      {
        firstName: 'Jane',
        lastName: 'Smith',
        email: 'jane.smith.bulk@test.com',
        mobile: '1234567891',
        birthday: new Date('1992-02-02'),
        gender: 'Female',
        trainingMode: 'Physical Training',
        status: 'pending'
      },
      {
        firstName: 'Bob',
        lastName: 'Johnson',
        email: 'bob.johnson.bulk@test.com',
        mobile: '1234567892',
        birthday: new Date('1988-03-03'),
        gender: 'Male',
        trainingMode: 'Both Options',
        status: 'pending'
      },
      {
        firstName: 'Alice',
        lastName: 'Brown',
        email: 'alice.brown.bulk@test.com',
        mobile: '1234567893',
        birthday: new Date('1995-04-04'),
        gender: 'Female',
        trainingMode: 'Schedule Only',
        status: 'approved' // Already approved to test edge case
      }
    ];

    // Remove existing test users
    await User.deleteMany({ email: { $regex: /\.bulk@test\.com$/ } });

    // Create new test users
    const createdUsers = await User.insertMany(testUsers);
    console.log(`✅ Created ${createdUsers.length} test users`);
    
    return createdUsers;
  } catch (error) {
    console.error('❌ Error creating test users:', error);
    return [];
  }
}

async function testBulkApproval(userIds) {
  try {
    console.log('\n🧪 Testing bulk approval...');
    
    const response = await axios.post(
      `${BASE_URL}/api/admin/users/bulk-approve`,
      { userIds },
      {
        headers: {
          'Authorization': `Bearer ${adminToken}`,
          'Content-Type': 'application/json'
        }
      }
    );

    if (response.data.success) {
      console.log('✅ Bulk approval successful');
      console.log(`   - Total requested: ${response.data.results.summary.totalRequested}`);
      console.log(`   - Successfully approved: ${response.data.results.summary.successful}`);
      console.log(`   - Already processed: ${response.data.results.summary.alreadyProcessed}`);
      console.log(`   - Failed: ${response.data.results.summary.failed}`);
      
      if (response.data.results.successful.length > 0) {
        console.log('   - Approved users:');
        response.data.results.successful.forEach(user => {
          console.log(`     * ${user.firstName} ${user.lastName} (${user.email})`);
        });
      }
      
      if (response.data.results.alreadyProcessed.length > 0) {
        console.log('   - Already processed:');
        response.data.results.alreadyProcessed.forEach(user => {
          console.log(`     * ${user.email} - ${user.reason}`);
        });
      }
      
      return true;
    } else {
      console.error('❌ Bulk approval failed:', response.data.error);
      return false;
    }
  } catch (error) {
    console.error('❌ Bulk approval error:', error.response?.data || error.message);
    return false;
  }
}

async function testBulkRejection(userIds) {
  try {
    console.log('\n🧪 Testing bulk rejection...');
    
    const response = await axios.post(
      `${BASE_URL}/api/admin/users/bulk-reject`,
      { 
        userIds,
        rejectionReason: 'Bulk rejection test - incomplete profile'
      },
      {
        headers: {
          'Authorization': `Bearer ${adminToken}`,
          'Content-Type': 'application/json'
        }
      }
    );

    if (response.data.success) {
      console.log('✅ Bulk rejection successful');
      console.log(`   - Total requested: ${response.data.results.summary.totalRequested}`);
      console.log(`   - Successfully rejected: ${response.data.results.summary.successful}`);
      console.log(`   - Already processed: ${response.data.results.summary.alreadyProcessed}`);
      console.log(`   - Failed: ${response.data.results.summary.failed}`);
      console.log(`   - Rejection reason: ${response.data.results.rejectionReason}`);
      
      if (response.data.results.successful.length > 0) {
        console.log('   - Rejected users:');
        response.data.results.successful.forEach(user => {
          console.log(`     * ${user.firstName} ${user.lastName} (${user.email})`);
        });
      }
      
      return true;
    } else {
      console.error('❌ Bulk rejection failed:', response.data.error);
      return false;
    }
  } catch (error) {
    console.error('❌ Bulk rejection error:', error.response?.data || error.message);
    return false;
  }
}

async function testValidationErrors() {
  try {
    console.log('\n🧪 Testing validation errors...');
    
    // Test empty array
    try {
      await axios.post(
        `${BASE_URL}/api/admin/users/bulk-approve`,
        { userIds: [] },
        {
          headers: {
            'Authorization': `Bearer ${adminToken}`,
            'Content-Type': 'application/json'
          }
        }
      );
      console.log('❌ Should have failed with empty array');
    } catch (error) {
      if (error.response?.status === 400) {
        console.log('✅ Empty array validation works');
      } else {
        console.log('❌ Unexpected error for empty array:', error.response?.data);
      }
    }
    
    // Test invalid user IDs
    try {
      await axios.post(
        `${BASE_URL}/api/admin/users/bulk-approve`,
        { userIds: ['invalid-id', 'another-invalid'] },
        {
          headers: {
            'Authorization': `Bearer ${adminToken}`,
            'Content-Type': 'application/json'
          }
        }
      );
      console.log('❌ Should have failed with invalid IDs');
    } catch (error) {
      if (error.response?.status === 400) {
        console.log('✅ Invalid ID validation works');
      } else {
        console.log('❌ Unexpected error for invalid IDs:', error.response?.data);
      }
    }
    
    // Test too many users (over 100)
    const tooManyIds = Array(101).fill().map(() => new mongoose.Types.ObjectId().toString());
    try {
      await axios.post(
        `${BASE_URL}/api/admin/users/bulk-approve`,
        { userIds: tooManyIds },
        {
          headers: {
            'Authorization': `Bearer ${adminToken}`,
            'Content-Type': 'application/json'
          }
        }
      );
      console.log('❌ Should have failed with too many users');
    } catch (error) {
      if (error.response?.status === 400 && error.response?.data?.code === 'BULK_LIMIT_EXCEEDED') {
        console.log('✅ Bulk limit validation works');
      } else {
        console.log('❌ Unexpected error for bulk limit:', error.response?.data);
      }
    }
    
  } catch (error) {
    console.error('❌ Validation test error:', error);
  }
}

async function verifyUserStatuses(userIds, expectedStatus) {
  try {
    const users = await User.find({ _id: { $in: userIds } });
    console.log(`\n📊 Verifying user statuses (expected: ${expectedStatus}):`);
    
    users.forEach(user => {
      const status = user.status === expectedStatus ? '✅' : '❌';
      console.log(`   ${status} ${user.firstName} ${user.lastName}: ${user.status}`);
    });
    
    return users.every(user => user.status === expectedStatus);
  } catch (error) {
    console.error('❌ Error verifying user statuses:', error);
    return false;
  }
}

async function cleanupTestUsers() {
  try {
    await User.deleteMany({ email: { $regex: /\.bulk@test\.com$/ } });
    console.log('\n🧹 Cleaned up test users');
  } catch (error) {
    console.error('❌ Error cleaning up test users:', error);
  }
}

async function runTests() {
  console.log('🚀 Starting Bulk Operations Tests\n');
  
  try {
    // Connect to database
    await connectToDatabase();
    
    // Login admin
    const loginSuccess = await loginAdmin();
    if (!loginSuccess) {
      console.log('❌ Cannot proceed without admin login');
      return;
    }
    
    // Create test users
    const testUsers = await createTestUsers();
    if (testUsers.length === 0) {
      console.log('❌ Cannot proceed without test users');
      return;
    }
    
    // Get pending users for approval test
    const pendingUsers = testUsers.filter(user => user.status === 'pending');
    const pendingUserIds = pendingUsers.map(user => user._id.toString());
    
    // Test bulk approval
    if (pendingUserIds.length >= 2) {
      const approvalIds = pendingUserIds.slice(0, 2); // Test with first 2 users
      await testBulkApproval(approvalIds);
      await verifyUserStatuses(approvalIds, 'approved');
    }
    
    // Create more test users for rejection test
    const moreTestUsers = await User.insertMany([
      {
        firstName: 'Test',
        lastName: 'User1',
        email: 'test.user1.bulk@test.com',
        mobile: '1234567894',
        birthday: new Date('1990-01-01'),
        gender: 'Male',
        trainingMode: 'Online',
        status: 'pending'
      },
      {
        firstName: 'Test',
        lastName: 'User2',
        email: 'test.user2.bulk@test.com',
        mobile: '1234567895',
        birthday: new Date('1992-02-02'),
        gender: 'Female',
        trainingMode: 'Physical Training',
        status: 'pending'
      }
    ]);
    
    // Test bulk rejection
    const rejectionIds = moreTestUsers.map(user => user._id.toString());
    await testBulkRejection(rejectionIds);
    await verifyUserStatuses(rejectionIds, 'rejected');
    
    // Test validation errors
    await testValidationErrors();
    
    // Test with non-existent user IDs
    console.log('\n🧪 Testing with non-existent user IDs...');
    const nonExistentIds = [
      new mongoose.Types.ObjectId().toString(),
      new mongoose.Types.ObjectId().toString()
    ];
    await testBulkApproval(nonExistentIds);
    
    console.log('\n✅ All bulk operations tests completed!');
    
  } catch (error) {
    console.error('❌ Test execution error:', error);
  } finally {
    // Cleanup
    await cleanupTestUsers();
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
  }
}

// Run tests if this file is executed directly
if (require.main === module) {
  runTests().catch(console.error);
}

module.exports = {
  runTests,
  testBulkApproval,
  testBulkRejection,
  testValidationErrors
};