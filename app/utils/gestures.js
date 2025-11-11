import { PanResponder, Animated } from 'react-native';

/**
 * Gesture-Based Navigation Utilities
 * Provides swipe gestures for navigation and interactions
 */

/**
 * Swipe to Go Back Gesture
 * Usage: Add to screen to enable swipe-right to go back
 */
export const createSwipeBackGesture = (onSwipeBack, threshold = 100) => {
  const pan = new Animated.ValueXY();

  const panResponder = PanResponder.create({
    onStartShouldSetPanResponder: () => false,
    onMoveShouldSetPanResponder: (evt, gestureState) => {
      // Only respond to horizontal swipes from left edge
      return gestureState.dx > 20 && Math.abs(gestureState.dy) < 50;
    },
    onPanResponderGrant: () => {
      pan.setOffset({
        x: pan.x._value,
        y: pan.y._value,
      });
    },
    onPanResponderMove: Animated.event([null, { dx: pan.x, dy: pan.y }], {
      useNativeDriver: false,
    }),
    onPanResponderRelease: (evt, gestureState) => {
      pan.flattenOffset();

      if (gestureState.dx > threshold) {
        // Swipe threshold met - trigger back navigation
        Animated.spring(pan, {
          toValue: { x: 300, y: 0 },
          useNativeDriver: true,
        }).start(() => {
          onSwipeBack();
          pan.setValue({ x: 0, y: 0 });
        });
      } else {
        // Snap back
        Animated.spring(pan, {
          toValue: { x: 0, y: 0 },
          friction: 5,
          useNativeDriver: true,
        }).start();
      }
    },
  });

  return { panResponder, pan };
};

/**
 * Swipe to Delete Gesture
 * Usage: Add to list items for swipe-to-delete functionality
 */
export const createSwipeToDeleteGesture = (onDelete, threshold = 120) => {
  const pan = new Animated.ValueXY();

  const panResponder = PanResponder.create({
    onStartShouldSetPanResponder: () => false,
    onMoveShouldSetPanResponder: (evt, gestureState) => {
      return Math.abs(gestureState.dx) > 10;
    },
    onPanResponderGrant: () => {
      pan.setOffset({
        x: pan.x._value,
        y: 0,
      });
    },
    onPanResponderMove: Animated.event([null, { dx: pan.x }], {
      useNativeDriver: false,
    }),
    onPanResponderRelease: (evt, gestureState) => {
      pan.flattenOffset();

      if (Math.abs(gestureState.dx) > threshold) {
        // Swipe threshold met - trigger delete
        const direction = gestureState.dx > 0 ? 1 : -1;
        Animated.timing(pan, {
          toValue: { x: direction * 400, y: 0 },
          duration: 200,
          useNativeDriver: true,
        }).start(() => {
          onDelete();
        });
      } else {
        // Snap back
        Animated.spring(pan, {
          toValue: { x: 0, y: 0 },
          friction: 5,
          useNativeDriver: true,
        }).start();
      }
    },
  });

  return { panResponder, pan };
};

/**
 * Pull to Refresh Gesture
 * Usage: Add to ScrollView for pull-to-refresh functionality
 */
export const createPullToRefreshGesture = (onRefresh, threshold = 80) => {
  const pullDistance = new Animated.Value(0);
  const isRefreshing = new Animated.Value(0);

  const panResponder = PanResponder.create({
    onStartShouldSetPanResponder: () => false,
    onMoveShouldSetPanResponder: (evt, gestureState) => {
      return gestureState.dy > 0 && gestureState.dy > Math.abs(gestureState.dx);
    },
    onPanResponderMove: (evt, gestureState) => {
      if (gestureState.dy > 0) {
        pullDistance.setValue(Math.min(gestureState.dy, threshold * 1.5));
      }
    },
    onPanResponderRelease: (evt, gestureState) => {
      if (gestureState.dy > threshold) {
        // Trigger refresh
        isRefreshing.setValue(1);
        Animated.timing(pullDistance, {
          toValue: threshold,
          duration: 200,
          useNativeDriver: true,
        }).start(() => {
          onRefresh(() => {
            // Reset after refresh complete
            isRefreshing.setValue(0);
            Animated.timing(pullDistance, {
              toValue: 0,
              duration: 300,
              useNativeDriver: true,
            }).start();
          });
        });
      } else {
        // Snap back
        Animated.spring(pullDistance, {
          toValue: 0,
          friction: 5,
          useNativeDriver: true,
        }).start();
      }
    },
  });

  return { panResponder, pullDistance, isRefreshing };
};

/**
 * Swipe Between Tabs Gesture
 * Usage: Add to tab container for swipe navigation between tabs
 */
export const createSwipeTabsGesture = (currentIndex, totalTabs, onTabChange, screenWidth) => {
  const pan = new Animated.ValueXY();
  const threshold = screenWidth * 0.3;

  const panResponder = PanResponder.create({
    onStartShouldSetPanResponder: () => false,
    onMoveShouldSetPanResponder: (evt, gestureState) => {
      return Math.abs(gestureState.dx) > 10;
    },
    onPanResponderGrant: () => {
      pan.setOffset({
        x: pan.x._value,
        y: 0,
      });
    },
    onPanResponderMove: Animated.event([null, { dx: pan.x }], {
      useNativeDriver: false,
    }),
    onPanResponderRelease: (evt, gestureState) => {
      pan.flattenOffset();

      let newIndex = currentIndex;

      if (gestureState.dx < -threshold && currentIndex < totalTabs - 1) {
        // Swipe left - next tab
        newIndex = currentIndex + 1;
      } else if (gestureState.dx > threshold && currentIndex > 0) {
        // Swipe right - previous tab
        newIndex = currentIndex - 1;
      }

      if (newIndex !== currentIndex) {
        Animated.spring(pan, {
          toValue: { x: 0, y: 0 },
          friction: 8,
          useNativeDriver: true,
        }).start(() => {
          onTabChange(newIndex);
        });
      } else {
        // Snap back
        Animated.spring(pan, {
          toValue: { x: 0, y: 0 },
          friction: 5,
          useNativeDriver: true,
        }).start();
      }
    },
  });

  return { panResponder, pan };
};

/**
 * Pinch to Zoom Gesture
 * Usage: Add to images for pinch-to-zoom functionality
 */
export const createPinchZoomGesture = (onZoom) => {
  const scale = new Animated.Value(1);
  let lastScale = 1;

  const panResponder = PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onMoveShouldSetPanResponder: () => true,
    onPanResponderGrant: () => {
      lastScale = scale._value;
    },
    onPanResponderMove: (evt, gestureState) => {
      // Simple pinch detection (would need more sophisticated logic for production)
      if (evt.nativeEvent.touches.length === 2) {
        const touch1 = evt.nativeEvent.touches[0];
        const touch2 = evt.nativeEvent.touches[1];
        const distance = Math.sqrt(
          Math.pow(touch2.pageX - touch1.pageX, 2) +
          Math.pow(touch2.pageY - touch1.pageY, 2)
        );
        // Scale based on distance (simplified)
        const newScale = Math.max(0.5, Math.min(lastScale * (distance / 200), 3));
        scale.setValue(newScale);
        onZoom && onZoom(newScale);
      }
    },
    onPanResponderRelease: () => {
      // Snap back if zoomed out too much
      if (scale._value < 1) {
        Animated.spring(scale, {
          toValue: 1,
          friction: 7,
          useNativeDriver: true,
        }).start();
      }
    },
  });

  return { panResponder, scale };
};

/**
 * Long Press Gesture
 * Usage: Add to elements for long-press actions
 */
export const createLongPressGesture = (onLongPress, duration = 500) => {
  let pressTimer = null;
  const scale = new Animated.Value(1);

  const panResponder = PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onPanResponderGrant: () => {
      // Visual feedback
      Animated.spring(scale, {
        toValue: 0.95,
        friction: 5,
        useNativeDriver: true,
      }).start();

      pressTimer = setTimeout(() => {
        onLongPress();
        // Haptic feedback would go here
      }, duration);
    },
    onPanResponderRelease: () => {
      clearTimeout(pressTimer);
      Animated.spring(scale, {
        toValue: 1,
        friction: 5,
        useNativeDriver: true,
      }).start();
    },
    onPanResponderTerminate: () => {
      clearTimeout(pressTimer);
      Animated.spring(scale, {
        toValue: 1,
        friction: 5,
        useNativeDriver: true,
      }).start();
    },
  });

  return { panResponder, scale };
};

/**
 * Drag and Drop Gesture
 * Usage: Add to draggable elements
 */
export const createDragGesture = (onDragEnd) => {
  const pan = new Animated.ValueXY();

  const panResponder = PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onPanResponderGrant: () => {
      pan.setOffset({
        x: pan.x._value,
        y: pan.y._value,
      });
      pan.setValue({ x: 0, y: 0 });
    },
    onPanResponderMove: Animated.event([null, { dx: pan.x, dy: pan.y }], {
      useNativeDriver: false,
    }),
    onPanResponderRelease: (evt, gestureState) => {
      pan.flattenOffset();
      onDragEnd && onDragEnd(gestureState);

      // Snap back to original position
      Animated.spring(pan, {
        toValue: { x: 0, y: 0 },
        friction: 5,
        useNativeDriver: true,
      }).start();
    },
  });

  return { panResponder, pan };
};

export default {
  createSwipeBackGesture,
  createSwipeToDeleteGesture,
  createPullToRefreshGesture,
  createSwipeTabsGesture,
  createPinchZoomGesture,
  createLongPressGesture,
  createDragGesture,
};
