# Advanced Animations Guide

Complete guide for implementing advanced animations, transitions, and gestures in FlexCoach Admin.

---

## 🎨 Animation System

### Available Animations

1. **Fade Animations** - Smooth opacity transitions
2. **Scale Animations** - Zoom in/out effects
3. **Slide Animations** - Directional movements
4. **Bounce Animations** - Playful button feedback
5. **Shake Animations** - Error indicators
6. **Pulse Animations** - Attention grabbers
7. **Stagger Animations** - Sequential list animations
8. **Page Transitions** - Screen navigation effects
9. **Modal Transitions** - Popup animations
10. **Shared Element Transitions** - Smooth element morphing

---

## 📖 Usage Examples

### 1. Fade In Animation

```javascript
import { useEffect, useRef } from 'react';
import { Animated, View } from 'react-native';
import { fadeIn } from '../utils/animations';

function MyComponent() {
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    fadeIn(fadeAnim).start();
  }, []);

  return (
    <Animated.View style={{ opacity: fadeAnim }}>
      <Text>Fading in!</Text>
    </Animated.View>
  );
}
```

### 2. Scale In Modal

```javascript
import { useState, useRef } from 'react';
import { Animated, Modal } from 'react-native';
import { modalTransition } from '../utils/animations';

function MyModal({ visible, onClose }) {
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      modalTransition(scaleAnim, opacityAnim).enter.start();
    } else {
      modalTransition(scaleAnim, opacityAnim).exit.start();
    }
  }, [visible]);

  return (
    <Modal visible={visible} transparent>
      <Animated.View 
        style={{
          opacity: opacityAnim,
          transform: [{ scale: scaleAnim }]
        }}
      >
        {/* Modal content */}
      </Animated.View>
    </Modal>
  );
}
```

### 3. Bounce Button

```javascript
import { useRef } from 'react';
import { Animated, TouchableOpacity } from 'react-native';
import { bounce } from '../utils/animations';

function BounceButton({ onPress, children }) {
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handlePress = () => {
    bounce(scaleAnim).start(() => {
      onPress();
    });
  };

  return (
    <TouchableOpacity onPress={handlePress}>
      <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
        {children}
      </Animated.View>
    </TouchableOpacity>
  );
}
```

### 4. Stagger List Animation

```javascript
import { useEffect, useRef } from 'react';
import { Animated, FlatList } from 'react-native';
import { staggerAnimation } from '../utils/animations';

function AnimatedList({ data }) {
  const animatedValues = useRef(
    data.map(() => new Animated.Value(0))
  ).current;

  useEffect(() => {
    staggerAnimation(animatedValues, 300, 100).start();
  }, [data]);

  return (
    <FlatList
      data={data}
      renderItem={({ item, index }) => (
        <Animated.View
          style={{
            opacity: animatedValues[index],
            transform: [{
              translateY: animatedValues[index].interpolate({
                inputRange: [0, 1],
                outputRange: [50, 0]
              })
            }]
          }}
        >
          {/* List item content */}
        </Animated.View>
      )}
    />
  );
}
```

### 5. Page Transition

```javascript
import { useEffect, useRef } from 'react';
import { Animated, Dimensions } from 'react-native';
import { pageTransitionSlide } from '../utils/animations';

function AnimatedScreen() {
  const slideAnim = useRef(new Animated.Value(Dimensions.get('window').width)).current;

  useEffect(() => {
    pageTransitionSlide(slideAnim, Dimensions.get('window').width).enter.start();
  }, []);

  return (
    <Animated.View
      style={{
        flex: 1,
        transform: [{ translateX: slideAnim }]
      }}
    >
      {/* Screen content */}
    </Animated.View>
  );
}
```

---

## 🖐️ Gesture-Based Navigation

### 1. Swipe to Go Back

```javascript
import { useRef } from 'react';
import { Animated, View } from 'react-native';
import { useRouter } from 'expo-router';
import { createSwipeBackGesture } from '../utils/gestures';

function MyScreen() {
  const router = useRouter();
  const { panResponder, pan } = createSwipeBackGesture(() => {
    router.back();
  });

  return (
    <Animated.View
      {...panResponder.panHandlers}
      style={{
        flex: 1,
        transform: [{ translateX: pan.x }]
      }}
    >
      {/* Screen content */}
    </Animated.View>
  );
}
```

### 2. Swipe to Delete

```javascript
import { useRef } from 'react';
import { Animated, Text } from 'react-native';
import { createSwipeToDeleteGesture } from '../utils/gestures';

function SwipeableListItem({ item, onDelete }) {
  const { panResponder, pan } = createSwipeToDeleteGesture(() => {
    onDelete(item.id);
  });

  return (
    <Animated.View
      {...panResponder.panHandlers}
      style={{
        transform: [{ translateX: pan.x }]
      }}
    >
      <Text>{item.name}</Text>
    </Animated.View>
  );
}
```

### 3. Swipe Between Tabs

```javascript
import { useState, useRef } from 'react';
import { Animated, Dimensions } from 'react-native';
import { createSwipeTabsGesture } from '../utils/gestures';

function SwipeableTabs({ tabs }) {
  const [activeTab, setActiveTab] = useState(0);
  const screenWidth = Dimensions.get('window').width;
  
  const { panResponder, pan } = createSwipeTabsGesture(
    activeTab,
    tabs.length,
    setActiveTab,
    screenWidth
  );

  return (
    <Animated.View
      {...panResponder.panHandlers}
      style={{
        flexDirection: 'row',
        transform: [{ translateX: pan.x }]
      }}
    >
      {tabs.map((tab, index) => (
        <View key={index} style={{ width: screenWidth }}>
          {tab.content}
        </View>
      ))}
    </Animated.View>
  );
}
```

### 4. Long Press Action

```javascript
import { useRef } from 'react';
import { Animated, Alert } from 'react-native';
import { createLongPressGesture } from '../utils/gestures';

function LongPressItem({ item }) {
  const { panResponder, scale } = createLongPressGesture(() => {
    Alert.alert('Long Press', 'Item long pressed!');
  }, 500);

  return (
    <Animated.View
      {...panResponder.panHandlers}
      style={{
        transform: [{ scale }]
      }}
    >
      {/* Item content */}
    </Animated.View>
  );
}
```

---

## 🎭 Shared Element Transitions

### Profile Avatar Transition

```javascript
import { useRef, useEffect } from 'react';
import { Animated } from 'react-native';
import { sharedElementTransition } from '../utils/animations';

function ProfileTransition({ isExpanded }) {
  const sizeAnim = useRef(new Animated.Value(50)).current;
  const positionAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (isExpanded) {
      Animated.parallel([
        sharedElementTransition(sizeAnim, 50, 150),
        sharedElementTransition(positionAnim, 0, 100)
      ]).start();
    } else {
      Animated.parallel([
        sharedElementTransition(sizeAnim, 150, 50),
        sharedElementTransition(positionAnim, 100, 0)
      ]).start();
    }
  }, [isExpanded]);

  return (
    <Animated.Image
      source={{ uri: 'avatar.jpg' }}
      style={{
        width: sizeAnim,
        height: sizeAnim,
        borderRadius: sizeAnim.interpolate({
          inputRange: [50, 150],
          outputRange: [25, 75]
        }),
        transform: [{ translateY: positionAnim }]
      }}
    />
  );
}
```

---

## 🎬 Custom Page Transitions

### Slide + Fade Transition

```javascript
import { useEffect, useRef } from 'react';
import { Animated, Dimensions } from 'react-native';
import { parallelAnimation, slideInRight, fadeIn } from '../utils/animations';

function CustomTransitionScreen() {
  const slideAnim = useRef(new Animated.Value(Dimensions.get('window').width)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    parallelAnimation([
      slideInRight(slideAnim),
      fadeIn(fadeAnim)
    ]).start();
  }, []);

  return (
    <Animated.View
      style={{
        flex: 1,
        opacity: fadeAnim,
        transform: [{ translateX: slideAnim }]
      }}
    >
      {/* Screen content */}
    </Animated.View>
  );
}
```

### Bottom Sheet Transition

```javascript
import { useState, useRef, useEffect } from 'react';
import { Animated, Dimensions } from 'react-native';
import { bottomSheetTransition } from '../utils/animations';

function BottomSheet({ visible, onClose }) {
  const screenHeight = Dimensions.get('window').height;
  const translateAnim = useRef(new Animated.Value(screenHeight)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      bottomSheetTransition(translateAnim, opacityAnim, screenHeight).enter.start();
    } else {
      bottomSheetTransition(translateAnim, opacityAnim, screenHeight).exit.start();
    }
  }, [visible]);

  return (
    <Animated.View
      style={{
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        height: screenHeight * 0.7,
        backgroundColor: '#fff',
        opacity: opacityAnim,
        transform: [{ translateY: translateAnim }]
      }}
    >
      {/* Bottom sheet content */}
    </Animated.View>
  );
}
```

---

## 🎯 Best Practices

### 1. Use Native Driver
Always use `useNativeDriver: true` for better performance:
```javascript
Animated.timing(value, {
  toValue: 1,
  duration: 300,
  useNativeDriver: true, // ✅ Better performance
}).start();
```

### 2. Cleanup Animations
Stop animations when component unmounts:
```javascript
useEffect(() => {
  const animation = fadeIn(fadeAnim);
  animation.start();

  return () => {
    animation.stop(); // Cleanup
  };
}, []);
```

### 3. Interpolate for Complex Animations
Use interpolation for smooth transitions:
```javascript
const rotate = animValue.interpolate({
  inputRange: [0, 1],
  outputRange: ['0deg', '360deg']
});
```

### 4. Combine Animations
Use parallel or sequence for complex effects:
```javascript
Animated.parallel([
  fadeIn(opacity),
  scaleIn(scale),
  slideInBottom(translateY)
]).start();
```

### 5. Performance Optimization
- Avoid animating layout properties (width, height, padding)
- Use transform and opacity instead
- Limit the number of simultaneous animations
- Use `shouldRasterizeIOS` for complex views

---

## 🚀 Implementation Checklist

- [ ] Import animation utilities
- [ ] Create animated values with `useRef`
- [ ] Apply animations in `useEffect`
- [ ] Add gesture handlers where needed
- [ ] Test on both iOS and Android
- [ ] Optimize performance
- [ ] Add haptic feedback (optional)
- [ ] Test with slow animations (dev mode)

---

## 📱 Platform-Specific Considerations

### iOS
- Smoother spring animations
- Better gesture recognition
- Native-like transitions

### Android
- May need timing adjustments
- Test on various devices
- Consider Material Design patterns

---

## 🎨 Animation Timing Reference

```javascript
// Fast interactions
duration: 200ms

// Standard transitions
duration: 300ms

// Slow, dramatic effects
duration: 500ms

// Spring animations
friction: 7-9
tension: 40-50
```

---

## 🔧 Troubleshooting

### Animation Not Working
1. Check `useNativeDriver` compatibility
2. Verify animated value initialization
3. Ensure animation is started with `.start()`

### Janky Performance
1. Reduce number of simultaneous animations
2. Use `shouldRasterizeIOS`
3. Avoid animating layout properties
4. Profile with React DevTools

### Gesture Conflicts
1. Adjust `onMoveShouldSetPanResponder` threshold
2. Use gesture priority
3. Test touch targets

---

Your FlexCoach Admin app now has enterprise-grade animations! 🎉
