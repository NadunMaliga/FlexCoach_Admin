/**
 * Admin Input Validation Utilities
 * Sanitizes and validates admin inputs before API calls
 */

// Sanitize string input
export function sanitizeString(input) {
  if (typeof input !== 'string') return '';
  return input
    .trim()
    .replace(/[<>]/g, '') // Remove potential HTML tags
    .substring(0, 10000); // Limit length
}

// Validate and sanitize user ID
export function validateUserId(userId) {
  if (!userId) throw new Error('User ID is required');
  const sanitized = String(userId).trim();
  // MongoDB ObjectId validation (24 hex characters)
  if (!/^[a-f0-9]{24}$/i.test(sanitized)) {
    throw new Error('Invalid user ID format');
  }
  return sanitized;
}

// Validate and sanitize email
export function validateEmail(email) {
  if (!email) throw new Error('Email is required');
  const sanitized = String(email).trim().toLowerCase();
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(sanitized)) {
    throw new Error('Invalid email format');
  }
  return sanitized;
}

// Validate admin password (stronger requirements)
export function validateAdminPassword(password) {
  if (!password) throw new Error('Password is required');
  
  const errors = [];
  
  if (password.length < 12) {
    errors.push('Password must be at least 12 characters');
  }
  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain an uppercase letter');
  }
  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain a lowercase letter');
  }
  if (!/[0-9]/.test(password)) {
    errors.push('Password must contain a number');
  }
  if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    errors.push('Password must contain a special character');
  }
  
  if (errors.length > 0) {
    throw new Error(errors.join('. '));
  }
  
  return password;
}

// Validate workout/diet/exercise ID
export function validateId(id, type = 'ID') {
  if (!id) throw new Error(`${type} is required`);
  const sanitized = String(id).trim();
  if (!/^[a-f0-9]{24}$/i.test(sanitized)) {
    throw new Error(`Invalid ${type} format`);
  }
  return sanitized;
}

// Validate food/exercise name
export function validateName(name, maxLength = 200) {
  if (!name) throw new Error('Name is required');
  const sanitized = String(name).trim();
  if (sanitized.length < 1 || sanitized.length > maxLength) {
    throw new Error(`Name must be between 1 and ${maxLength} characters`);
  }
  // Allow letters, numbers, spaces, and common punctuation
  if (!/^[a-zA-Z0-9\s\-_.,()&]+$/.test(sanitized)) {
    throw new Error('Name contains invalid characters');
  }
  return sanitized;
}

// Validate message content
export function validateMessageContent(content) {
  if (!content) return '';
  const sanitized = String(content).trim();
  if (sanitized.length > 5000) {
    throw new Error('Message content too long (max 5000 characters)');
  }
  return sanitized;
}

// Validate numeric input
export function validateNumber(value, min = -Infinity, max = Infinity, fieldName = 'Value') {
  const num = Number(value);
  if (isNaN(num)) {
    throw new Error(`${fieldName} must be a number`);
  }
  if (num < min || num > max) {
    throw new Error(`${fieldName} must be between ${min} and ${max}`);
  }
  return num;
}

// Validate URL
export function validateUrl(url) {
  if (!url) return '';
  try {
    new URL(url);
    return url;
  } catch {
    throw new Error('Invalid URL format');
  }
}

// Validate date string
export function validateDate(dateString) {
  if (!dateString) return null;
  const date = new Date(dateString);
  if (isNaN(date.getTime())) {
    throw new Error('Invalid date format');
  }
  return date.toISOString();
}

// Validate file URI
export function validateFileUri(uri) {
  if (!uri) throw new Error('File URI is required');
  const sanitized = String(uri).trim();
  if (!sanitized.startsWith('file://') && !sanitized.startsWith('content://')) {
    throw new Error('Invalid file URI format');
  }
  return sanitized;
}
