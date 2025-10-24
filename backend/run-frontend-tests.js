// Script to start server and run frontend integration tests
const { spawn } = require('child_process');
const axios = require('axios');

const API_BASE_URL = 'http://localhost:3001';

// Function to check if server is running
async function isServerRunning() {
  try {
    const response = await axios.get(`${API_BASE_URL}/health`);
    return response.status === 200;
  } catch (error) {
    return false;
  }
}

// Function to wait for server to start
async function waitForServer(maxAttempts = 30) {
  for (let i = 0; i < maxAttempts; i++) {
    if (await isServerRunning()) {
      console.log('✅ Server is running');
      return true;
    }
    console.log(`⏳ Waiting for server... (${i + 1}/${maxAttempts})`);
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  return false;
}

async function runFrontendTestsWithServer() {
  console.log('🚀 Starting server and running frontend integration tests...');
  
  // Check if server is already running
  if (await isServerRunning()) {
    console.log('✅ Server is already running');
    
    // Run tests
    const { runFrontendIntegrationTests } = require('./test-frontend-integration');
    await runFrontendIntegrationTests();
    return;
  }
  
  // Start server
  console.log('🔄 Starting server...');
  const serverProcess = spawn('node', ['server.js'], {
    stdio: 'pipe',
    cwd: __dirname
  });
  
  // Handle server output
  serverProcess.stdout.on('data', (data) => {
    const output = data.toString();
    if (output.includes('FlexCoach Admin Backend running')) {
      console.log('✅ Server started successfully');
    }
  });
  
  serverProcess.stderr.on('data', (data) => {
    const error = data.toString();
    if (!error.includes('Warning')) { // Ignore mongoose warnings
      console.error('Server error:', error);
    }
  });
  
  // Wait for server to be ready
  const serverReady = await waitForServer();
  
  if (serverReady) {
    // Run tests
    const { runFrontendIntegrationTests } = require('./test-frontend-integration');
    await runFrontendIntegrationTests();
  } else {
    console.log('❌ Server failed to start within timeout');
  }
  
  // Clean up
  console.log('🛑 Stopping server...');
  serverProcess.kill();
}

// Run if this file is executed directly
if (require.main === module) {
  runFrontendTestsWithServer().catch(console.error);
}

module.exports = { runFrontendTestsWithServer };