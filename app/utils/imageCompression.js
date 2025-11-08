import { manipulateAsync, SaveFormat } from 'expo-image-manipulator';
import Logger from './logger';


/**
 * Compress image for chat messages
 * @param {string} uri - Image URI
 * @returns {Promise<string>} - Compressed image URI
 */
export const compressChatImage = async (uri) => {
  try {
    Logger.debug('Admin: Starting chat image compression...');
    
    // Get original file size
    const originalSize = await getImageSize(uri);
    
    const result = await manipulateAsync(
      uri,
      [
        // Resize to max 1024px width while maintaining aspect ratio
        { resize: { width: 1024 } }
      ],
      {
        compress: 0.75, // 75% quality - good balance between quality and size
        format: SaveFormat.JPEG,
      }
    );
    
    // Get compressed file size
    const compressedSize = await getImageSize(result.uri);
    const compressionRatio = originalSize > 0 ? ((originalSize - compressedSize) / originalSize * 100).toFixed(1) : 0;
    
    Logger.success('Admin: Chat image compressed successfully');
    Logger.log(`   Original size: ${(originalSize / 1024).toFixed(1)}KB`);
    Logger.log(`   Compressed size: ${(compressedSize / 1024).toFixed(1)}KB`);
    Logger.log(`   Compression: ${compressionRatio}% reduction`);
    
    return result.uri;
  } catch (error) {
    Logger.failure('Admin: Error compressing chat image:', error);
    // Return original URI if compression fails
    return uri;
  }
};

/**
 * Get file size from URI (approximate)
 * @param {string} uri - Image URI
 * @returns {Promise<number>} - File size in bytes (approximate)
 */
export const getImageSize = async (uri) => {
  try {
    const response = await fetch(uri);
    const blob = await response.blob();
    return blob.size;
  } catch (error) {
    Logger.error('Error getting image size:', error);
    return 0;
  }
};

/**
 * Compress image with custom settings
 * @param {string} uri - Image URI
 * @param {Object} options - Compression options
 * @returns {Promise<string>} - Compressed image URI
 */
export const compressImage = async (uri, options = {}) => {
  const {
    maxWidth = 800,
    maxHeight = 1200,
    quality = 0.8,
    format = SaveFormat.JPEG
  } = options;

  try {
    Logger.debug('Admin: Starting custom image compression...');
    
    const result = await manipulateAsync(
      uri,
      [
        { resize: { width: maxWidth, height: maxHeight } }
      ],
      {
        compress: quality,
        format: format,
      }
    );
    
    Logger.success('Admin: Custom image compressed successfully');
    return result.uri;
  } catch (error) {
    Logger.failure('Admin: Error in custom image compression:', error);
    return uri;
  }
};