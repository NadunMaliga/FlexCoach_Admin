import React, { useState } from 'react';
import { View, Image, Text, StyleSheet } from 'react-native';
import { getProfilePictureSource, getUserInitials, getAvatarColor, hasCustomProfilePicture } from '../utils/profilePicture';

/**
 * ProfileAvatar Component
 * Displays user profile picture with fallback to initials
 */
export default function ProfileAvatar({ 
  user, 
  size = 50, 
  style,
  showBorder = false,
  borderColor = '#fff',
  borderWidth = 2
}) {
  const [imageError, setImageError] = useState(false);
  const hasCustomPicture = hasCustomProfilePicture(user);

  // If image failed to load or no custom picture, show initials
  if (imageError || !hasCustomPicture) {
    const initials = getUserInitials(user);
    const backgroundColor = getAvatarColor(user);

    return (
      <View
        style={[
          styles.initialsContainer,
          {
            width: size,
            height: size,
            borderRadius: size / 2,
            backgroundColor,
            borderWidth: showBorder ? borderWidth : 0,
            borderColor: showBorder ? borderColor : 'transparent',
          },
          style,
        ]}
      >
        <Text style={[styles.initials, { fontSize: size * 0.4 }]}>
          {initials}
        </Text>
      </View>
    );
  }

  // Show profile picture
  const source = getProfilePictureSource(user);

  return (
    <Image
      source={source}
      style={[
        styles.image,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          borderWidth: showBorder ? borderWidth : 0,
          borderColor: showBorder ? borderColor : 'transparent',
        },
        style,
      ]}
      onError={() => setImageError(true)}
    />
  );
}

const styles = StyleSheet.create({
  image: {
    backgroundColor: '#f0f0f0',
  },
  initialsContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  initials: {
    color: '#fff',
    fontWeight: '600',
  },
});
