import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated } from 'react-native';

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
    outputRange: [0.3, 0.6],
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

export default function DietHistorySkeleton({ count = 3 }) {
  return (
    <View style={styles.container}>
      {/* Title */}
      <SkeletonBox width={180} height={30} style={styles.title} />
      
      {/* Description */}
      <SkeletonBox width="90%" height={14} style={styles.description} />
      <SkeletonBox width="80%" height={14} style={styles.descriptionLine2} />

      {/* Day Sections */}
      {Array.from({ length: count }).map((_, dayIndex) => (
        <View key={dayIndex} style={styles.daySection}>
          {/* Date Header */}
          <View style={styles.dateHeader}>
            <SkeletonBox width={20} height={20} style={styles.dateIcon} />
            <SkeletonBox width={250} height={18} style={styles.dateText} />
          </View>

          {/* Meal Cards */}
          {Array.from({ length: 2 }).map((_, mealIndex) => (
            <View key={mealIndex} style={styles.mealCard}>
              <View style={styles.mealContent}>
                <SkeletonBox width={140} height={19} style={styles.mealTitle} />
                <SkeletonBox width={100} height={14} style={styles.mealSubtitle} />
              </View>
              <SkeletonBox width={20} height={20} style={styles.chevronIcon} />
            </View>
          ))}
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
    borderRadius: 6,
  },
  title: {
    alignSelf: 'center',
    marginBottom: 10,
    borderRadius: 8,
  },
  description: {
    alignSelf: 'center',
    marginBottom: 6,
    borderRadius: 4,
  },
  descriptionLine2: {
    alignSelf: 'center',
    marginBottom: 20,
    borderRadius: 4,
  },
  daySection: {
    marginTop: 20,
    marginBottom: 10,
  },
  dateHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 15,
    paddingHorizontal: 10,
  },
  dateIcon: {
    borderRadius: 4,
  },
  dateText: {
    borderRadius: 4,
  },
  mealCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 10,
    marginBottom: 15,
  },
  mealContent: {
    flex: 1,
  },
  mealTitle: {
    marginBottom: 8,
    borderRadius: 4,
  },
  mealSubtitle: {
    borderRadius: 4,
  },
  chevronIcon: {
    borderRadius: 4,
    marginLeft: 10,
  },
});
