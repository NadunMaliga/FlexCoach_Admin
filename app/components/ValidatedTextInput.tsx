import React, { useState } from 'react';
import { TextInput, Text, View, StyleSheet, TextInputProps } from 'react-native';
import { sanitizeString } from '../utils/validators';

interface ValidatedTextInputProps extends TextInputProps {
  onChangeText: (text: string) => void;
  validator?: (text: string) => string; // Returns error message or empty string
  errorStyle?: object;
  containerStyle?: object;
}

/**
 * TextInput with built-in validation and sanitization
 * Automatically sanitizes input and displays validation errors
 */
export default function ValidatedTextInput({
  onChangeText,
  validator,
  errorStyle,
  containerStyle,
  ...props
}: ValidatedTextInputProps) {
  const [error, setError] = useState<string>('');

  const handleChange = (text: string) => {
    // Sanitize input
    const sanitized = sanitizeString(text);
    
    // Validate if validator provided
    if (validator) {
      try {
        validator(sanitized);
        setError('');
      } catch (err: any) {
        setError(err.message || 'Invalid input');
      }
    }
    
    // Call parent onChange
    onChangeText(sanitized);
  };

  return (
    <View style={containerStyle}>
      <TextInput
        {...props}
        onChangeText={handleChange}
      />
      {error ? (
        <Text style={[styles.errorText, errorStyle]}>{error}</Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  errorText: {
    color: '#ff8181ff',
    fontSize: 13,
    marginTop: 5,
    marginLeft: 10,
  },
});
