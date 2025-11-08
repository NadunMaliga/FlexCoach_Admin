import Logger from './logger';

/**
 * Admin Secure ID Generator
 * Replaces Math.random() with crypto-secure alternatives
 */

import * as Crypto from 'expo-crypto';

// Generate a secure random UUID
export async function generateSecureId() {
  try {
    return await Crypto.randomUUID();
  } catch (error) {
    Logger.warn('Failed to generate UUID, falling back to digest method');
    const randomBytes = await Crypto.getRandomBytesAsync(16);
    const timestamp = Date.now().toString();
    const combined = randomBytes.join('') + timestamp;
    return await Crypto.digestStringAsync(
      Crypto.CryptoDigestAlgorithm.SHA256,
      combined
    );
  }
}

// Generate a secure random string
export async function generateSecureString(length = 16) {
  const bytes = await Crypto.getRandomBytesAsync(length);
  return bytes.map(b => b.toString(16).padStart(2, '0')).join('');
}

// Generate a temporary message ID (for optimistic updates)
export async function generateTempMessageId() {
  const randomPart = await generateSecureString(8);
  return `temp_${Date.now()}_${randomPart}`;
}
