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

export default function DashboardSkeleton() {
  return (
    <View style={styles.container}>
      {/* Stats Cards */}
      <View style={styles.statsRow}>
        <SkeletonBox width={(width - 60) / 2} height={100} style={styles.statCard} />
        <SkeletonBox width={(width - 60) / 2} height={100} style={styles.statCard} />
      </View>
      <View style={styles.statsRow}>
        <SkeletonBox width={(width - 60) / 2} height={100} style={styles.statCard} />
        <SkeletonBox width={(width - 60) / 2} height={100} style={styles.statCard} />
      </View>

      {/* Chart */}
      <SkeletonBox width={width - 40} height={200} style={styles.chart} />

      {/* Recent Activity */}
      <View style={styles.activitySection}>
        <SkeletonBox width={150} height={20} style={styles.title} />
        {[1, 2, 3].map((item) => (
          <View key={item} style={styles.activityItem}>
            <SkeletonBox width={40} height={40} style={styles.avatar} />
            <View style={styles.activityContent}>
              <SkeletonBox width={200} height={16} style={styles.activityText} />
              <SkeletonBox width={100} height={12} style={styles.activityDate} />
            </View>
          </View>
        ))}
      </View>
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
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  statCard: {
    borderRadius: 12,
  },
  chart: {
    marginVertical: 20,
    borderRadius: 12,
  },
  activitySection: {
    marginTop: 20,
  },
  title: {
    marginBottom: 16,
    borderRadius: 4,
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  avatar: {
    borderRadius: 20,
    marginRight: 12,
  },
  activityContent: {
    flex: 1,
  },
  activityText: {
    marginBottom: 6,
    borderRadius: 4,
  },
  activityDate: {
    borderRadius: 4,
  },
});
