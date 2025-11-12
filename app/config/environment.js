import Logger from '../utils/logger';

/**
 * Environment Configuration for FlexCoach Admin App
 * 
 * This file manages environment-specific URLs and settings.
 * Update the production URLs before deploying to production.
 */

// Detect if we're in development mode
const isDev = typeof _DEV_ !== 'undefined' ? _DEV_ : false;

// TEMPORARY: Force production URLs even in development for VPS testing
const forceProduction = true;

// Environment configurations
const ENV = {
  development: {
    // Development - Use your local machine's IP address
    // Update this IP if your network changes
    API_URL: 'https://admin.flexcoach.publicvm.com',
    CHAT_URL: 'https://chat.flexcoach.publicvm.com',
    
    // Development settings
    API_TIMEOUT: 10000, // 10 seconds
    ENABLE_LOGGING: true,
    ENABLE_DEBUG: true,
  },
  
  production: {
    // Production - VPS Domain URLs
    API_URL: 'https://admin.flexcoach.publicvm.com',
    CHAT_URL: 'https://chat.flexcoach.publicvm.com',
    
    // Production settings
    API_TIMEOUT: 30000, // 30 seconds
    ENABLE_LOGGING: false,
    ENABLE_DEBUG: false,
  }
};

// Select current environment
const currentEnv = (isDev && !forceProduction) ? 'development' : 'production';
const config = ENV[currentEnv];

// Export configuration
export const API_URL = config.API_URL;
export const CHAT_URL = config.CHAT_URL;
export const API_TIMEOUT = config.API_TIMEOUT;
export const ENABLE_LOGGING = config.ENABLE_LOGGING;
export const ENABLE_DEBUG = config.ENABLE_DEBUG;

// Derived URLs
export const API_BASE = `${API_URL}/api/admin`;
export const CHAT_WS_URL = CHAT_URL.replace('http', 'ws');

// Helper function to log configuration (only in development)
export const logConfig = () => {
  if (ENABLE_LOGGING) {
    Logger.debug('Environment Configuration:');
    Logger.log('   Mode:', currentEnv);
    Logger.log('   API URL:', API_URL);
    Logger.log('   Chat URL:', CHAT_URL);
    Logger.log('   Timeout:', API_TIMEOUT + 'ms');
  }
};

// Validate configuration on load
if (!API_URL || !CHAT_URL) {
  Logger.failure('Configuration Error: API_URL or CHAT_URL is not set!');
  throw new Error('Invalid environment configuration');
}

// Warn if using development URLs in production
if (!isDev) {
  const devPatterns = ['localhost', '127.0.0.1', '172.28', '192.168', '10.'];
  const hasDevUrl = devPatterns.some(pattern => API_URL.includes(pattern));
  
  if (hasDevUrl) {
    Logger.failure('PRODUCTION ERROR: API_URL contains development URL!');
    Logger.error('   Current URL:', API_URL);
    Logger.error('   Update FlexCoach_Admin/app/config/environment.js with your production URL');
    Logger.error('   Example: https://api.flexcoach.com');
  }
  
  const hasDevChatUrl = devPatterns.some(pattern => CHAT_URL.includes(pattern));
  
  if (hasDevChatUrl) {
    Logger.failure('PRODUCTION ERROR: CHAT_URL contains development URL!');
    Logger.error('   Current URL:', CHAT_URL);
    Logger.error('   Update FlexCoach_Admin/app/config/environment.js with your production URL');
    Logger.error('   Example: https://chat.flexcoach.com');
  }
}

export default {
  API_URL,
  CHAT_URL,
  API_BASE,
  CHAT_WS_URL,
  API_TIMEOUT,
  ENABLE_LOGGING,
  ENABLE_DEBUG,
  isDev,
  currentEnv,
  logConfig
};