import { API_BASE_URL } from '../config/environment';

/**
 * Profile Picture Utility
 * Handles profile picture URLs with fallbacks and caching
 */

/**
 * Get profile picture URL with proper fallback
 * @param {Object} user - User object with profilePhoto and gender
 * @returns {Object} - { uri: string } or null
 */
export const getProfilePictureSource = (user) => {
  if (!user) {
    return null;
  }

  // If user has a profile photo URL
  if (user.profilePhoto && typeof user.profilePhoto === 'string') {
    // Check if it's already a full URL
    if (user.profilePhoto.startsWith('http://') || user.profilePhoto.startsWith('https://')) {
      return { uri: user.profilePhoto };
    }
    
    // Check if it's a relative path
    if (user.profilePhoto.startsWith('/uploads/')) {
      return { uri: `${API_BASE_URL}${user.profilePhoto}` };
    }
    
    // Assume it's just the filename
    return { uri: `${API_BASE_URL}/uploads/profile-pictures/${user.profilePhoto}` };
  }

  // No profile photo - will fallback to initials
  return null;
};

/**
 * Get profile picture URL as string (for Image source)
 * @param {Object} user - User object
 * @returns {string} - URL string
 */
export const getProfilePictureUrl = (user) => {
  const source = getProfilePictureSource(user);
  return source.uri || null;
};

/**
 * Check if user has a custom profile picture
 * @param {Object} user - User object
 * @returns {boolean}
 */
export const hasCustomProfilePicture = (user) => {
  return !!(user && user.profilePhoto && user.profilePhoto.trim());
};

/**
 * Get initials from user name for avatar placeholder
 * @param {Object} user - User object with firstName and lastName
 * @returns {string} - Initials (e.g., "JD")
 */
export const getUserInitials = (user) => {
  if (!user) return '?';
  
  const firstName = user.firstName || '';
  const lastName = user.lastName || '';
  
  const firstInitial = firstName.charAt(0).toUpperCase();
  const lastInitial = lastName.charAt(0).toUpperCase();
  
  return firstInitial + lastInitial || '?';
};

/**
 * Get avatar background color based on user name
 * @param {Object} user - User object
 * @returns {string} - Hex color
 */
export const getAvatarColor = (user) => {
  if (!user) return '#999';
  
  const colors = [
    '#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A',
    '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E2',
    '#F8B739', '#52B788', '#E76F51', '#2A9D8F'
  ];
  
  const name = (user.firstName || '') + (user.lastName || '');
  const index = name.length % colors.length;
  
  return colors[index];
};

export default {
  getProfilePictureSource,
  getProfilePictureUrl,
  hasCustomProfilePicture,
  getUserInitials,
  getAvatarColor,
};
