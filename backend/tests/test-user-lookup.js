const mongoose = require('mongoose');

async function testUserLookup() {
  try {
    // Connect to MongoDB
    await mongoose.connect('mongodb://localhost:27017/flexcoach');
    console.log('✅ Connected to MongoDB');

    const userId = '68ce2241ea3c9e25138fbe6b';
    console.log('🔍 Testing user lookup with userId:', userId);
    
    // Test 1: Direct string lookup
    console.log('\n1️⃣ Testing direct string lookup...');
    let userProfile = await mongoose.connection.db.collection('userprofiles').findOne({ userId });
    console.log('Result:', userProfile ? 'FOUND' : 'NOT FOUND');
    
    // Test 2: ObjectId lookup
    console.log('\n2️⃣ Testing ObjectId lookup...');
    if (mongoose.Types.ObjectId.isValid(userId)) {
      userProfile = await mongoose.connection.db.collection('userprofiles').findOne({ userId: new mongoose.Types.ObjectId(userId) });
      console.log('Result:', userProfile ? 'FOUND' : 'NOT FOUND');
    }
    
    // Test 3: _id lookup
    console.log('\n3️⃣ Testing _id lookup...');
    userProfile = await mongoose.connection.db.collection('userprofiles').findOne({ _id: new mongoose.Types.ObjectId(userId) });
    console.log('Result:', userProfile ? 'FOUND' : 'NOT FOUND');
    
    if (userProfile) {
      console.log('\n📋 Found user:');
      console.log('Name:', userProfile.firstName, userProfile.lastName);
      console.log('Email:', userProfile.email);
      console.log('UserId field type:', typeof userProfile.userId);
      console.log('UserId value:', userProfile.userId);
    }
    
    // Test 4: Find all users and check their userId format
    console.log('\n4️⃣ Checking all users userId format...');
    const allUsers = await mongoose.connection.db.collection('userprofiles').find({}).limit(3).toArray();
    allUsers.forEach((user, index) => {
      console.log(`User ${index + 1}:`);
      console.log(`  Name: ${user.firstName} ${user.lastName}`);
      console.log(`  UserId type: ${typeof user.userId}`);
      console.log(`  UserId value: ${user.userId}`);
      console.log(`  _id: ${user._id}`);
    });

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Disconnected from MongoDB');
  }
}

testUserLookup();