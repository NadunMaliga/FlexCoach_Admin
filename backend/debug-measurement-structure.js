const mongoose = require('mongoose');

async function debugMeasurementStructure() {
  try {
    // Connect to MongoDB
    await mongoose.connect('mongodb://localhost:27017/flexcoach');
    console.log('✅ Connected to MongoDB');

    // Get a sample user profile to see the structure
    const userProfile = await mongoose.connection.db.collection('userprofiles').findOne({});
    
    if (userProfile) {
      console.log('\n📋 Sample User Profile Structure:');
      console.log('User ID:', userProfile.userId);
      console.log('Name:', userProfile.firstName, userProfile.lastName);
      
      // Check if there's a 'measurement' key (singular)
      if (userProfile.measurement) {
        console.log('\n📏 Found "measurement" key:');
        console.log(JSON.stringify(userProfile.measurement, null, 2));
      }
      
      // Check if there's a 'measurements' key (plural)
      if (userProfile.measurements) {
        console.log('\n📏 Found "measurements" key:');
        console.log(JSON.stringify(userProfile.measurements, null, 2));
      }
      
      // Check if there's a 'measurementHistory' key
      if (userProfile.measurementHistory) {
        console.log('\n📈 Found "measurementHistory" key:');
        console.log('Length:', userProfile.measurementHistory.length);
        if (userProfile.measurementHistory.length > 0) {
          console.log('Sample entry:', JSON.stringify(userProfile.measurementHistory[0], null, 2));
        }
      }
      
      // Show all keys in the user profile
      console.log('\n🔑 All keys in user profile:');
      console.log(Object.keys(userProfile));
      
    } else {
      console.log('❌ No user profiles found');
    }

    // Count total user profiles
    const totalUsers = await mongoose.connection.db.collection('userprofiles').countDocuments();
    console.log(`\n👥 Total user profiles: ${totalUsers}`);

    // Find users with measurement data
    const usersWithMeasurements = await mongoose.connection.db.collection('userprofiles').find({
      $or: [
        { measurement: { $exists: true } },
        { measurements: { $exists: true } },
        { measurementHistory: { $exists: true } }
      ]
    }).toArray();

    console.log(`\n📊 Users with measurement data: ${usersWithMeasurements.length}`);
    
    if (usersWithMeasurements.length > 0) {
      console.log('\n📋 Users with measurements:');
      usersWithMeasurements.forEach(user => {
        console.log(`- ${user.firstName} ${user.lastName} (${user.userId})`);
        if (user.measurement) console.log('  Has "measurement" key');
        if (user.measurements) console.log('  Has "measurements" key');
        if (user.measurementHistory) console.log(`  Has "measurementHistory" key (${user.measurementHistory.length} entries)`);
      });
    }

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Disconnected from MongoDB');
  }
}

debugMeasurementStructure();