const mongoose = require('mongoose');

async function testMeasurementDirect() {
  try {
    // Connect to MongoDB
    await mongoose.connect('mongodb://localhost:27017/flexcoach');
    console.log('✅ Connected to MongoDB');

    const userId = '68ce2241ea3c9e25138fbe6b'; // User "Ss gg" who has measurements
    
    // Find user profile with measurement data
    const userProfile = await mongoose.connection.db.collection('userprofiles').findOne({ userId });
    
    if (userProfile) {
      console.log('\n📋 User Profile Found:');
      console.log('Name:', userProfile.firstName, userProfile.lastName);
      
      // Current measurements
      console.log('\n📏 Current Measurements:');
      const currentMeasurements = userProfile.measurements || {};
      Object.keys(currentMeasurements).forEach(type => {
        console.log(`${type}: ${currentMeasurements[type]}`);
      });
      
      // Historical measurements
      console.log('\n📈 Historical Measurements:');
      const measurementHistory = userProfile.measurementHistory || [];
      console.log(`Total history entries: ${measurementHistory.length}`);
      
      if (measurementHistory.length > 0) {
        console.log('\nRecent entries:');
        measurementHistory.slice(-3).forEach((entry, index) => {
          console.log(`Entry ${index + 1} (${new Date(entry.date).toLocaleDateString()}):`);
          Object.keys(entry.measurements || {}).forEach(type => {
            console.log(`  ${type}: ${entry.measurements[type]}`);
          });
        });
      }
      
      // Simulate the API transformation
      console.log('\n🔄 Simulating API Response:');
      const transformedMeasurements = [];
      
      // Add current measurements
      Object.keys(currentMeasurements).forEach(type => {
        if (currentMeasurements[type] !== null && currentMeasurements[type] !== undefined) {
          transformedMeasurements.push({
            measurementType: type.charAt(0).toUpperCase() + type.slice(1),
            value: currentMeasurements[type],
            unit: getUnit(type),
            date: new Date().toISOString(),
            isCurrent: true
          });
        }
      });
      
      // Add historical measurements
      measurementHistory.forEach(entry => {
        const measurements = entry.measurements || {};
        Object.keys(measurements).forEach(type => {
          if (measurements[type] !== null && measurements[type] !== undefined) {
            transformedMeasurements.push({
              measurementType: type.charAt(0).toUpperCase() + type.slice(1),
              value: measurements[type],
              unit: getUnit(type),
              date: entry.date,
              isCurrent: false
            });
          }
        });
      });
      
      console.log(`Total transformed measurements: ${transformedMeasurements.length}`);
      
      // Group by type
      const groupedMeasurements = {};
      transformedMeasurements.forEach(measurement => {
        const type = measurement.measurementType;
        if (!groupedMeasurements[type]) {
          groupedMeasurements[type] = [];
        }
        groupedMeasurements[type].push(measurement);
      });
      
      console.log('\n📊 Grouped by type:');
      Object.keys(groupedMeasurements).forEach(type => {
        const measurements = groupedMeasurements[type];
        console.log(`${type}: ${measurements.length} entries`);
        // Show latest value
        const latest = measurements.find(m => m.isCurrent) || measurements[measurements.length - 1];
        if (latest) {
          console.log(`  Latest: ${latest.value} ${latest.unit} (${latest.isCurrent ? 'Current' : 'Historical'})`);
        }
      });
      
    } else {
      console.log('❌ User profile not found');
    }

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Disconnected from MongoDB');
  }
}

function getUnit(type) {
  switch (type.toLowerCase()) {
    case 'weight':
      return 'kg';
    case 'height':
      return 'cm';
    case 'steps':
      return 'steps';
    default:
      return 'cm';
  }
}

testMeasurementDirect();