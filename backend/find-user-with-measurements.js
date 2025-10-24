const mongoose = require('mongoose');

async function findUserWithMeasurements() {
  try {
    // Connect to MongoDB
    await mongoose.connect('mongodb://localhost:27017/flexcoach');
    console.log('✅ Connected to MongoDB');

    // Find a user with measurement data
    const userWithMeasurements = await mongoose.connection.db.collection('userprofiles').findOne({
      $and: [
        { measurements: { $exists: true } },
        { measurementHistory: { $exists: true, $ne: [] } }
      ]
    });
    
    if (userWithMeasurements) {
      console.log('\n📋 Found user with measurements:');
      console.log('User ID:', userWithMeasurements.userId);
      console.log('Name:', userWithMeasurements.firstName, userWithMeasurements.lastName);
      console.log('Email:', userWithMeasurements.email);
      
      // Current measurements
      console.log('\n📏 Current Measurements:');
      const currentMeasurements = userWithMeasurements.measurements || {};
      Object.keys(currentMeasurements).forEach(type => {
        console.log(`${type}: ${currentMeasurements[type]}`);
      });
      
      // Historical measurements
      console.log('\n📈 Historical Measurements:');
      const measurementHistory = userWithMeasurements.measurementHistory || [];
      console.log(`Total history entries: ${measurementHistory.length}`);
      
      if (measurementHistory.length > 0) {
        console.log('\nLatest entry:');
        const latest = measurementHistory[measurementHistory.length - 1];
        console.log(`Date: ${new Date(latest.date).toLocaleDateString()}`);
        Object.keys(latest.measurements || {}).forEach(type => {
          console.log(`  ${type}: ${latest.measurements[type]}`);
        });
      }
      
    } else {
      console.log('❌ No user with measurement history found');
      
      // Find any user with current measurements
      const userWithCurrentMeasurements = await mongoose.connection.db.collection('userprofiles').findOne({
        measurements: { $exists: true }
      });
      
      if (userWithCurrentMeasurements) {
        console.log('\n📋 Found user with current measurements only:');
        console.log('User ID:', userWithCurrentMeasurements.userId);
        console.log('Name:', userWithCurrentMeasurements.firstName, userWithCurrentMeasurements.lastName);
        
        const currentMeasurements = userWithCurrentMeasurements.measurements || {};
        Object.keys(currentMeasurements).forEach(type => {
          console.log(`${type}: ${currentMeasurements[type]}`);
        });
      }
    }

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Disconnected from MongoDB');
  }
}

findUserWithMeasurements();