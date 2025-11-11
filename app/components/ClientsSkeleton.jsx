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
    outputRange: [0.5, 0.8],
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

export default function ClientsSkeleton() {
  return (
    <View style={styles.container}>
      {/* Search Bar */}
      <SkeletonBox width={width - 40} height={50} style={styles.searchBar} />

      {/* Filter Tabs */}
      <View style={styles.filterRow}>
        <SkeletonBox width={80} height={36} style={styles.filterTab} />
        <SkeletonBox width={80} height={36} style={styles.filterTab} />
        <SkeletonBox width={80} height={36} style={styles.filterTab} />
      </View>

      {/* Client List */}
      {[1, 2, 3, 4, 5].map((item) => (
        <View key={item} style={styles.clientCard}>
          <SkeletonBox width={60} height={60} style={styles.avatar} />
          <View style={styles.clientInfo}>
            <SkeletonBox width={150} height={18} style={styles.name} />
            <SkeletonBox width={200} height={14} style={styles.email} />
            <SkeletonBox width={100} height={12} style={styles.date} />
          </View>
          <SkeletonBox width={80} height={32} style={styles.statusBadge} />
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#000',
  },
  skeleton: {
    backgroundColor: '#2a2a2a',
    borderRadius: 8,
  },
  searchBar: {
    marginBottom: 16,
    borderRadius: 25,
  },
  filterRow: {
    flexDirection: 'row',
    marginBottom: 20,
    gap: 10,
  },
  filterTab: {
    borderRadius: 18,
  },
  clientCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    marginBottom: 12,
  },
  avatar: {
    borderRadius: 30,
    marginRight: 12,
  },
  clientInfo: {
    flex: 1,
  },
  name: {
    marginBottom: 6,
    borderRadius: 4,
  },
  email: {
    marginBottom: 4,
    borderRadius: 4,
  },
  date: {
    borderRadius: 4,
  },
  statusBadge: {
    borderRadius: 16,
  },
});
