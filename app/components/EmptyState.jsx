import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Path } from 'react-native-svg';

/**
 * EmptyState Component
 * Displays a friendly message when no data is available
 */
export default function EmptyState({ 
  icon = 'inbox',
  title = 'No data available',
  message = 'There is nothing to display here yet.',
  style 
}) {
  const renderIcon = () => {
    if (icon === 'users') {
      return (
        <Svg width={64} height={64} viewBox="0 0 24 24" fill="none" stroke="#666" strokeWidth={1.5}>
          <Path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
          <Path d="M9 11a4 4 0 100-8 4 4 0 000 8zM23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" />
        </Svg>
      );
    }
    
    if (icon === 'search') {
      return (
        <Svg width={64} height={64} viewBox="0 0 24 24" fill="none" stroke="#666" strokeWidth={1.5}>
          <Path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </Svg>
      );
    }
    
    // Default inbox icon
    return (
      <Svg width={64} height={64} viewBox="0 0 24 24" fill="none" stroke="#666" strokeWidth={1.5}>
        <Path d="M3 9h18v10a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
        <Path d="M3 9l9-7 9 7" />
        <Path d="M9 13h6" />
      </Svg>
    );
  };

  return (
    <View style={[styles.container, style]}>
      {renderIcon()}
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.message}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
    minHeight: 300,
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: '#fff',
    marginTop: 20,
    marginBottom: 8,
    textAlign: 'center',
  },
  message: {
    fontSize: 15,
    color: '#999',
    textAlign: 'center',
    lineHeight: 22,
  },
});
