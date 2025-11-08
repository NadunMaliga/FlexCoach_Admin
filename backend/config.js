// FlexCoach Admin Backend Configuration
const config = {
  development: {
    PORT: process.env.PORT || 3001,
    NODE_ENV: 'development',
    JWT_SECRET: process.env.JWT_SECRET,
    CORS_ORIGIN: process.env.CORS_ORIGIN || 'http://localhost:3000,http://localhost:19006',
    MONGODB_URI: process.env.MONGODB_URI,
    API_BASE_URL: process.env.API_BASE_URL || 'http://localhost:3001',
    // Admin credentials
    ADMIN_EMAIL: process.env.ADMIN_EMAIL,
    ADMIN_PASSWORD_HASH: process.env.ADMIN_PASSWORD_HASH,
  },
  staging: {
    PORT: process.env.PORT || 3001,
    NODE_ENV: 'staging',
    JWT_SECRET: process.env.JWT_SECRET,
    CORS_ORIGIN: process.env.CORS_ORIGIN,
    MONGODB_URI: process.env.MONGODB_URI,
    API_BASE_URL: process.env.API_BASE_URL,
    // Admin credentials
    ADMIN_EMAIL: process.env.ADMIN_EMAIL,
    ADMIN_PASSWORD_HASH: process.env.ADMIN_PASSWORD_HASH,
  },
  production: {
    PORT: process.env.PORT || 80,
    NODE_ENV: 'production',
    JWT_SECRET: process.env.JWT_SECRET,
    CORS_ORIGIN: process.env.CORS_ORIGIN,
    MONGODB_URI: process.env.MONGODB_URI,
    API_BASE_URL: process.env.API_BASE_URL,
    // Admin credentials
    ADMIN_EMAIL: process.env.ADMIN_EMAIL,
    ADMIN_PASSWORD_HASH: process.env.ADMIN_PASSWORD_HASH,
  }
};

// Get current environment
const currentEnv = process.env.NODE_ENV || 'development';

// Validate required environment variables
const requiredEnvVars = ['JWT_SECRET', 'MONGODB_URI', 'ADMIN_EMAIL', 'ADMIN_PASSWORD_HASH'];
const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);

if (missingVars.length > 0) {
  console.error('❌ Missing required environment variables:', missingVars.join(', '));
  console.error('Please check your .env file and ensure all required variables are set.');
  process.exit(1);
}

// Export current config
module.exports = config[currentEnv];
