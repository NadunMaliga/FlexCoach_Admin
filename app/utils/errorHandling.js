import Logger from './logger';

/**
 * Admin Error Handling Utilities
 * Provides consistent error handling across the admin app
 */

// Wrap async functions with error handling
export async function withErrorHandling(fn, errorMessage = 'An error occurred') {
  try {
    return await fn();
  } catch (error) {
    Logger.error(`Error: ${errorMessage}`, error);
    throw new Error(errorMessage);
  }
}

// Safe async wrapper that returns [error, data]
export async function safeAsync(promise) {
  try {
    const data = await promise;
    return [null, data];
  } catch (error) {
    return [error, null];
  }
}

// API error handler
export function handleApiError(error, context = '') {
  Logger.error(`API Error${context ? ` (${context})` : ''}:`, error);
  
  if (error.message?.includes('timeout')) {
    return 'Request timed out. Please try again.';
  }
  
  if (error.message?.includes('Network')) {
    return 'Network error. Please check your connection.';
  }
  
  if (error.message?.includes('401') || error.message?.includes('Unauthorized')) {
    return 'Session expired. Please sign in again.';
  }
  
  if (error.message?.includes('403') || error.message?.includes('Forbidden')) {
    return 'You do not have permission to perform this action.';
  }
  
  if (error.message?.includes('404')) {
    return 'Resource not found.';
  }
  
  if (error.message?.includes('500')) {
    return 'Server error. Please try again later.';
  }
  
  return error.message || 'An unexpected error occurred';
}

// Retry wrapper for failed requests
export async function withRetry(fn, maxRetries = 3, delay = 1000) {
  let lastError;
  
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      if (i < maxRetries - 1) {
        await new Promise(resolve => setTimeout(resolve, delay * (i + 1)));
      }
    }
  }
  
  throw lastError;
}

// Secure logging (only in development)
export function secureLog(message, data) {
  if (__DEV__) {
    // Sanitize sensitive data
    const sanitized = sanitizeForLog(data);
    Logger.log(message, sanitized);
  }
}

// Sanitize data for logging
function sanitizeForLog(data) {
  if (!data || typeof data !== 'object') return data;
  
  const sanitized = { ...data };
  
  // Remove sensitive fields
  const sensitiveFields = ['token', 'password', 'secret', 'apiKey', 'authorization'];
  sensitiveFields.forEach(field => {
    if (sanitized[field]) {
      sanitized[field] = '[REDACTED]';
    }
  });
  
  return sanitized;
}
