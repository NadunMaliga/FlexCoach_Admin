// Test script for enhanced admin features
const mongoose = require('mongoose');
const config = require('./config');

// Import models
const User = require('./models/User');
const Admin = require('./models/Admin');

async function testEnhancedFeatures() {
  try {
    console.log('🧪 Testing Enhanced Admin Features...');
    
    // Connect to MongoDB
    await mongoose.connect(config.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Test 1: Dashboard Statistics Query
    console.log('\n📊 Testing Dashboard Statistics Query...');
    
    const totalUsers = await User.countDocuments();
    const pendingUsers = await User.countDocuments({ status: 'pending' });
    const approvedUsers = await User.countDocuments({ status: 'approved' });
    const rejectedUsers = await User.countDocuments({ status: 'rejected' });
    
    console.log(`   Total Users: ${totalUsers}`);
    console.log(`   Pending: ${pendingUsers}`);
    console.log(`   Approved: ${approvedUsers}`);
    console.log(`   Rejected: ${rejectedUsers}`);

    // Test 2: Training Mode Aggregation
    console.log('\n🏋️ Testing Training Mode Aggregation...');
    
    const trainingModeStats = await User.aggregate([
      {
        $group: {
          _id: '$trainingMode',
          count: { $sum: 1 }
        }
      }
    ]);
    
    console.log('   Training Mode Distribution:');
    trainingModeStats.forEach(stat => {
      console.log(`     ${stat._id}: ${stat.count}`);
    });

    // Test 3: Gender Aggregation
    console.log('\n👥 Testing Gender Aggregation...');
    
    const genderStats = await User.aggregate([
      {
        $group: {
          _id: '$gender',
          count: { $sum: 1 }
        }
      }
    ]);
    
    console.log('   Gender Distribution:');
    genderStats.forEach(stat => {
      console.log(`     ${stat._id}: ${stat.count}`);
    });

    // Test 4: Enhanced Filtering Query
    console.log('\n🔍 Testing Enhanced Filtering Query...');
    
    const sampleQuery = {
      status: 'pending',
      trainingMode: { $in: ['Online', 'Physical Training'] }
    };
    
    const filteredUsers = await User.find(sampleQuery).limit(5);
    console.log(`   Found ${filteredUsers.length} users matching sample filter`);

    // Test 5: Search Functionality
    console.log('\n🔎 Testing Search Functionality...');
    
    const searchResults = await User.find({
      $or: [
        { firstName: { $regex: 'test', $options: 'i' } },
        { lastName: { $regex: 'test', $options: 'i' } },
        { email: { $regex: 'test', $options: 'i' } }
      ]
    }).limit(3);
    
    console.log(`   Found ${searchResults.length} users matching 'test' search`);

    // Test 6: Date Range Query
    console.log('\n📅 Testing Date Range Query...');
    
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    
    const recentUsers = await User.countDocuments({
      createdAt: { $gte: sevenDaysAgo }
    });
    
    console.log(`   Users registered in last 7 days: ${recentUsers}`);

    // Test 7: Distinct Values Query
    console.log('\n🎯 Testing Distinct Values Query...');
    
    const distinctTrainingModes = await User.distinct('trainingMode');
    const distinctGenders = await User.distinct('gender');
    
    console.log(`   Distinct Training Modes: ${distinctTrainingModes.join(', ')}`);
    console.log(`   Distinct Genders: ${distinctGenders.join(', ')}`);

    console.log('\n✅ All enhanced features tested successfully!');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
  }
}

// Run tests
testEnhancedFeatures();