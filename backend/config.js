// FlexCoach Admin Backend Configuration
const config = {
  development: {
    PORT: 3001, // Different port from client backend (client runs on 3000)
    NODE_ENV: 'development',
    JWT_SECRET: 'flexcoach_admin_super_secret_key_2024',
    CORS_ORIGIN: '*', // Allow all origins in development for mobile app testing
    MONGODB_URI: 'mongodb+srv://chenura:Password123@cluster0.pynxkya.mongodb.net/flexcoach', // MongoDB Atlas cluster
    API_BASE_URL: 'http://localhost:3001',
  },
  staging: {
    PORT: process.env.PORT || 3001,
    NODE_ENV: 'staging',
    JWT_SECRET: process.env.JWT_SECRET || 'flexcoach_admin_super_secret_key_2024',
    CORS_ORIGIN: process.env.CORS_ORIGIN || '*',
    MONGODB_URI: process.env.MONGODB_URI || 'mongodb+srv://chenura:Password123@cluster0.pynxkya.mongodb.net/flexcoach_staging',
    API_BASE_URL: process.env.API_BASE_URL || 'http://localhost:3001',
  },
  production: {
    PORT: process.env.PORT || 80,
    NODE_ENV: 'production',
    JWT_SECRET: process.env.JWT_SECRET || 'flexcoach_admin_super_secret_key_2024',
    CORS_ORIGIN: process.env.CORS_ORIGIN || 'https://admin.yourdomain.com',
    MONGODB_URI: process.env.MONGODB_URI || 'mongodb+srv://chenura:Password123@cluster0.pynxkya.mongodb.net/flexcoach_prod',
    API_BASE_URL: process.env.API_BASE_URL || 'https://admin.yourdomain.com',
  }
};

// Get current environment
const currentEnv = process.env.NODE_ENV || 'development';

// Export current config
module.exports = config[currentEnv];
