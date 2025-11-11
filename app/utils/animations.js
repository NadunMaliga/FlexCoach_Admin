import { Animated, Easing } from 'react-native';

/**
 * Advanced Animation Utilities for FlexCoach Admin
 * Provides smooth, native-like animations throughout the app
 */

// Animation configurations
export const ANIMATION_DURATION = {
  fast: 200,
  normal: 300,
  slow: 500,
};

export const EASING = {
  ease: Easing.ease,
  easeIn: Easing.in(Easing.ease),
  easeOut: Easing.out(Easing.ease),
  easeInOut: Easing.inOut(Easing.ease),
  spring: Easing.elastic(1),
  bounce: Easing.bounce,
};

/**
 * Fade In Animation
 */
export const fadeIn = (animatedValue, duration = ANIMATION_DURATION.normal, delay = 0) => {
  return Animated.timing(animatedValue, {
    toValue: 1,
    duration,
    delay,
    easing: EASING.easeOut,
    useNativeDriver: true,
  });
};

/**
 * Fade Out Animation
 */
export const fadeOut = (animatedValue, duration = ANIMATION_DURATION.normal, delay = 0) => {
  return Animated.timing(animatedValue, {
    toValue: 0,
    duration,
    delay,
    easing: EASING.easeIn,
    useNativeDriver: true,
  });
};

/**
 * Scale In Animation (for modals, cards)
 */
export const scaleIn = (animatedValue, duration = ANIMATION_DURATION.normal, delay = 0) => {
  return Animated.spring(animatedValue, {
    toValue: 1,
    friction: 8,
    tension: 40,
    delay,
    useNativeDriver: true,
  });
};

/**
 * Scale Out Animation
 */
export const scaleOut = (animatedValue, duration = ANIMATION_DURATION.fast, delay = 0) => {
  return Animated.timing(animatedValue, {
    toValue: 0,
    duration,
    delay,
    easing: EASING.easeIn,
    useNativeDriver: true,
  });
};

/**
 * Slide In From Right (for page transitions)
 */
export const slideInRight = (animatedValue, duration = ANIMATION_DURATION.normal) => {
  return Animated.timing(animatedValue, {
    toValue: 0,
    duration,
    easing: EASING.easeOut,
    useNativeDriver: true,
  });
};

/**
 * Slide Out To Left
 */
export const slideOutLeft = (animatedValue, screenWidth, duration = ANIMATION_DURATION.normal) => {
  return Animated.timing(animatedValue, {
    toValue: -screenWidth,
    duration,
    easing: EASING.easeIn,
    useNativeDriver: true,
  });
};

/**
 * Slide In From Bottom (for sheets, modals)
 */
export const slideInBottom = (animatedValue, duration = ANIMATION_DURATION.normal) => {
  return Animated.spring(animatedValue, {
    toValue: 0,
    friction: 9,
    tension: 50,
    useNativeDriver: true,
  });
};

/**
 * Slide Out To Bottom
 */
export const slideOutBottom = (animatedValue, screenHeight, duration = ANIMATION_DURATION.normal) => {
  return Animated.timing(animatedValue, {
    toValue: screenHeight,
    duration,
    easing: EASING.easeIn,
    useNativeDriver: true,
  });
};

/**
 * Bounce Animation (for buttons, icons)
 */
export const bounce = (animatedValue) => {
  return Animated.sequence([
    Animated.timing(animatedValue, {
      toValue: 1.2,
      duration: 100,
      easing: EASING.easeOut,
      useNativeDriver: true,
    }),
    Animated.spring(animatedValue, {
      toValue: 1,
      friction: 3,
      tension: 40,
      useNativeDriver: true,
    }),
  ]);
};

/**
 * Shake Animation (for errors)
 */
export const shake = (animatedValue) => {
  return Animated.sequence([
    Animated.timing(animatedValue, { toValue: 10, duration: 50, useNativeDriver: true }),
    Animated.timing(animatedValue, { toValue: -10, duration: 50, useNativeDriver: true }),
    Animated.timing(animatedValue, { toValue: 10, duration: 50, useNativeDriver: true }),
    Animated.timing(animatedValue, { toValue: -10, duration: 50, useNativeDriver: true }),
    Animated.timing(animatedValue, { toValue: 0, duration: 50, useNativeDriver: true }),
  ]);
};

/**
 * Pulse Animation (for notifications, badges)
 */
export const pulse = (animatedValue) => {
  return Animated.loop(
    Animated.sequence([
      Animated.timing(animatedValue, {
        toValue: 1.1,
        duration: 800,
        easing: EASING.easeInOut,
        useNativeDriver: true,
      }),
      Animated.timing(animatedValue, {
        toValue: 1,
        duration: 800,
        easing: EASING.easeInOut,
        useNativeDriver: true,
      }),
    ])
  );
};

/**
 * Stagger Animation (for lists)
 */
export const staggerAnimation = (animatedValues, duration = ANIMATION_DURATION.normal, staggerDelay = 50) => {
  return Animated.stagger(
    staggerDelay,
    animatedValues.map(value =>
      Animated.timing(value, {
        toValue: 1,
        duration,
        easing: EASING.easeOut,
        useNativeDriver: true,
      })
    )
  );
};

/**
 * Parallel Animation (multiple animations at once)
 */
export const parallelAnimation = (animations) => {
  return Animated.parallel(animations);
};

/**
 * Sequence Animation (one after another)
 */
export const sequenceAnimation = (animations) => {
  return Animated.sequence(animations);
};

/**
 * Card Flip Animation
 */
export const flipCard = (animatedValue, duration = ANIMATION_DURATION.slow) => {
  return Animated.timing(animatedValue, {
    toValue: 180,
    duration,
    easing: EASING.easeInOut,
    useNativeDriver: true,
  });
};

/**
 * Rotate Animation (continuous)
 */
export const rotate = (animatedValue, duration = 1000) => {
  return Animated.loop(
    Animated.timing(animatedValue, {
      toValue: 1,
      duration,
      easing: Easing.linear,
      useNativeDriver: true,
    })
  );
};

/**
 * Page Transition - Slide
 */
export const pageTransitionSlide = (animatedValue, screenWidth) => {
  return {
    enter: slideInRight(animatedValue, ANIMATION_DURATION.normal),
    exit: slideOutLeft(animatedValue, screenWidth, ANIMATION_DURATION.normal),
  };
};

/**
 * Page Transition - Fade
 */
export const pageTransitionFade = (animatedValue) => {
  return {
    enter: fadeIn(animatedValue, ANIMATION_DURATION.normal),
    exit: fadeOut(animatedValue, ANIMATION_DURATION.fast),
  };
};

/**
 * Modal Transition - Scale + Fade
 */
export const modalTransition = (scaleValue, opacityValue) => {
  return {
    enter: parallelAnimation([
      scaleIn(scaleValue),
      fadeIn(opacityValue, ANIMATION_DURATION.normal),
    ]),
    exit: parallelAnimation([
      scaleOut(scaleValue, ANIMATION_DURATION.fast),
      fadeOut(opacityValue, ANIMATION_DURATION.fast),
    ]),
  };
};

/**
 * Bottom Sheet Transition
 */
export const bottomSheetTransition = (translateValue, opacityValue, screenHeight) => {
  return {
    enter: parallelAnimation([
      slideInBottom(translateValue),
      fadeIn(opacityValue, ANIMATION_DURATION.normal),
    ]),
    exit: parallelAnimation([
      slideOutBottom(translateValue, screenHeight),
      fadeOut(opacityValue, ANIMATION_DURATION.normal),
    ]),
  };
};

/**
 * Shared Element Transition Helper
 */
export const sharedElementTransition = (animatedValue, fromPosition, toPosition, duration = ANIMATION_DURATION.normal) => {
  return Animated.timing(animatedValue, {
    toValue: toPosition,
    duration,
    easing: EASING.easeInOut,
    useNativeDriver: true,
  });
};

/**
 * Spring Animation (for interactive elements)
 */
export const springAnimation = (animatedValue, toValue, config = {}) => {
  return Animated.spring(animatedValue, {
    toValue,
    friction: config.friction || 7,
    tension: config.tension || 40,
    useNativeDriver: true,
  });
};

/**
 * Decay Animation (for gesture-based scrolling)
 */
export const decayAnimation = (animatedValue, velocity, config = {}) => {
  return Animated.decay(animatedValue, {
    velocity,
    deceleration: config.deceleration || 0.997,
    useNativeDriver: true,
  });
};

export default {
  fadeIn,
  fadeOut,
  scaleIn,
  scaleOut,
  slideInRight,
  slideOutLeft,
  slideInBottom,
  slideOutBottom,
  bounce,
  shake,
  pulse,
  staggerAnimation,
  parallelAnimation,
  sequenceAnimation,
  flipCard,
  rotate,
  pageTransitionSlide,
  pageTransitionFade,
  modalTransition,
  bottomSheetTransition,
  sharedElementTransition,
  springAnimation,
  decayAnimation,
  ANIMATION_DURATION,
  EASING,
};
