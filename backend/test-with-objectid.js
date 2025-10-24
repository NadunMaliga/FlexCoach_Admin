const axios = require('axios');

async function testWithObjectId() {
  try {
    console.log('🧪 Testing measurement API with ObjectId...');
    
    // Login first
    const loginResponse = await axios.post('http://localhost:3001/api/admin/login', {
      email: 'admin@gmail.com',
      password: 'admin123'
    });

    if (!loginResponse.data.success) {
      console.error('❌ Login failed');
      return;
    }

    const token = loginResponse.data.token;
    console.log('✅ Login successful');

    // Test with the ObjectId we found
    const userId = '68ce2241ea3c9e25138fbe6b'; // This is the ObjectId as string
    
    console.log(`\n=== Testing with userId: ${userId} ===`);
    
    const response = await axios.get(`http://localhost:3001/api/admin/body-measurements/user/${userId}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    console.log('✅ API Status:', response.status);
    console.log('✅ Success:', response.data.success);
    console.log('✅ Total measurements:', response.data.count);
    console.log('✅ User profile:', response.data.userProfile);
    console.log('✅ Current measurements available:', Object.keys(response.data.currentMeasurements || {}).length > 0);
    
    if (response.data.measurements && response.data.measurements.length > 0) {
      console.log('\n📊 Sample measurements:');
      response.data.measurements.slice(0, 10).forEach((measurement, index) => {
        console.log(`${index + 1}. ${measurement.measurementType}: ${measurement.value} ${measurement.unit} (${measurement.isCurrent ? 'Current' : 'Historical'}) - ${new Date(measurement.date).toLocaleDateString()}`);
      });
      
      console.log('\n📈 Grouped measurements:');
      Object.keys(response.data.groupedMeasurements).forEach(type => {
        const measurements = response.data.groupedMeasurements[type];
        console.log(`${type}: ${measurements.length} entries`);
      });
    } else {
      console.log('❌ No measurements found');
    }

  } catch (error) {
    console.error('❌ Error:', error.response?.data || error.message);
  }
}

// Start server and test
const { spawn } = require('child_process');

console.log('🚀 Starting server...');
const server = spawn('node', ['server.js'], { cwd: __dirname });

server.stdout.on('data', (data) => {
  const output = data.toString();
  console.log(output);
  
  // Wait for server to be ready
  if (output.includes('Connected to MongoDB')) {
    setTimeout(() => {
      testWithObjectId().then(() => {
        server.kill();
        process.exit(0);
      });
    }, 1000);
  }
});

server.stderr.on('data', (data) => {
  console.error('Server error:', data.toString());
});

// Kill server after 30 seconds if test doesn't complete
setTimeout(() => {
  server.kill();
  process.exit(1);
}, 30000);