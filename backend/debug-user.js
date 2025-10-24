const mongoose = require('mongoose');

mongoose.connect('mongodb://localhost:27017/flexcoach')
  .then(async () => {
    const db = mongoose.connection.db;
    
    console.log('=== CHECKING ALL USER PROFILES ===');
    const allProfiles = await db.collection('userprofiles').find({}, { userId: 1, firstName: 1, lastName: 1 }).limit(5).toArray();
    
    console.log('Available users:');
    allProfiles.forEach((profile, i) => {
      console.log(`${i + 1}. userId: '${profile.userId}' - ${profile.firstName} ${profile.lastName}`);
    });
    
    if (allProfiles.length > 0) {
      const firstUser = allProfiles[0];
      console.log(`\n=== CHECKING FIRST USER: ${firstUser.userId} ===`);
      
      const userProfile = await db.collection('userprofiles').findOne({ userId: firstUser.userId });
      
      if (userProfile) {
        console.log('✅ User found:', userProfile.firstName, userProfile.lastName);
        console.log('✅ Measurement history length:', userProfile.measurementHistory?.length || 0);
        
        if (userProfile.measurementHistory && userProfile.measurementHistory.length > 0) {
          console.log('✅ Sample measurement entry:');
          const sample = userProfile.measurementHistory[0];
          console.log('  Date:', sample.date);
          console.log('  Measurements:', Object.keys(sample.measurements || {}));
        }
      }
    }
    
    mongoose.disconnect();
  })
  .catch(err => {
    console.error('Error:', err);
    process.exit(1);
  });