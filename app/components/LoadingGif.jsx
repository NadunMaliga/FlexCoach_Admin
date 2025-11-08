import React from 'react';
import { View, Image, StyleSheet, Text } from 'react-native';

export default function LoadingGif({ message = "Loading...", size = 150 }) {
  return (
    <View style={styles.container}>
      <Image
        source={require('../../assets/images/e4f48ad87846a3ed2310792f8cab38-unscreen.gif')}
        style={[styles.gif, { width: size, height: size }]}
        resizeMode="contain"
      />
      {message && <Text style={styles.message}>{message}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  gif: {
    width: 150,
    height: 150,
  },
  message: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
    fontWeight: '500',
  },
});
