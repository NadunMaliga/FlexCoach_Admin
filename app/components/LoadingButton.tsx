import React from 'react';
import {
  TouchableOpacity,
  Text,
  ActivityIndicator,
  StyleSheet,
  ViewStyle,
  TextStyle,
} from 'react-native';

interface LoadingButtonProps {
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
  title: string;
  style?: ViewStyle;
  textStyle?: TextStyle;
  spinnerColor?: string;
  spinnerSize?: 'small' | 'large';
}

/**
 * LoadingButton Component
 * A button that shows a spinner when loading
 * 
 * @example
 * <LoadingButton
 *   title="Sign In"
 *   loading={isLoading}
 *   onPress={handleSignIn}
 *   spinnerColor="#d5ff5f"
 * />
 */
export default function LoadingButton({
  onPress,
  loading = false,
  disabled = false,
  title,
  style,
  textStyle,
  spinnerColor = '#fff',
  spinnerSize = 'small',
}: LoadingButtonProps) {
  const isDisabled = disabled || loading;

  return (
    <TouchableOpacity
      style={[
        styles.button,
        style,
        isDisabled && styles.disabled,
      ]}
      onPress={onPress}
      disabled={isDisabled}
      accessibilityRole="button"
      accessibilityLabel={title}
      accessibilityState={{ disabled: isDisabled, busy: loading }}
    >
      {loading ? (
        <ActivityIndicator size={spinnerSize} color={spinnerColor} />
      ) : (
        <Text style={[styles.text, textStyle]}>{title}</Text>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    paddingVertical: 22,
    borderRadius: 50,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#000',
  },
  disabled: {
    opacity: 0.6,
  },
  text: {
    fontSize: 18,
    color: '#fff',
    fontFamily: 'Poppins_300Light',
    textAlign: 'center',
  },
});
