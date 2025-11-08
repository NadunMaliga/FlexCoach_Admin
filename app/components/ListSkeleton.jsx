import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, Dimensions } from 'react-native';

const { width } = Dimensions.get('window');

const SkeletonBox = ({ width: boxWidth, height, style }) => {
  const animatedValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(animatedValue, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(animatedValue, {
          toValue: 0,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  const opacity = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 0.7],
  });

  return (
    <Animated.View
      style={[
        styles.skeleton,
        { width: boxWidth, height, opacity },
        style,
      ]}
    />
  );
};

export default function ListSkeleton({ count = 5 }) {
  return (
    <View style={styles.container}>
      {/* Search Bar */}
      <SkeletonBox width={width - 40} height={50} style={styles.searchBar} />

      {/* List Items */}
      {Array.from({ length: count }).map((_, index) => (
        <View key={index} style={styles.listItem}>
          <View style={styles.itemContent}>
            <SkeletonBox width={180} height={18} style={styles.title} />
            <SkeletonBox width={250} height={14} style={styles.subtitle} />
            <SkeletonBox width={120} height={12} style={styles.meta} />
          </View>
          <SkeletonBox width={24} height={24} style={styles.icon} />
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#fff',
  },
  skeleton: {
    backgroundColor: '#E1E9EE',
    borderRadius: 8,
  },
  searchBar: {
    marginBottom: 20,
    borderRadius: 25,
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    marginBottom: 12,
  },
  itemContent: {
    flex: 1,
  },
  title: {
    marginBottom: 8,
    borderRadius: 4,
  },
  subtitle: {
    marginBottom: 6,
    borderRadius: 4,
  },
  meta: {
    borderRadius: 4,
  },
  icon: {
    borderRadius: 12,
    marginLeft: 12,
  },
});
