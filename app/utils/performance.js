/**
 * Performance Utilities
 * Helper functions for optimizing React Native performance
 */

import { useCallback, useEffect, useRef } from 'react';

/**
 * Debounce hook for search inputs
 * @param {Function} callback - Function to debounce
 * @param {number} delay - Delay in milliseconds
 * @returns {Function} Debounced function
 */
export function useDebounce(callback, delay = 300) {
  const timeoutRef = useRef(null);

  return useCallback((...args) => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = setTimeout(() => {
      callback(...args);
    }, delay);
  }, [callback, delay]);
}

/**
 * Throttle hook for scroll events
 * @param {Function} callback - Function to throttle
 * @param {number} limit - Minimum time between calls
 * @returns {Function} Throttled function
 */
export function useThrottle(callback, limit = 100) {
  const inThrottle = useRef(false);

  return useCallback((...args) => {
    if (!inThrottle.current) {
      callback(...args);
      inThrottle.current = true;
      setTimeout(() => {
        inThrottle.current = false;
      }, limit);
    }
  }, [callback, limit]);
}

/**
 * Previous value hook
 * @param {any} value - Current value
 * @returns {any} Previous value
 */
export function usePrevious(value) {
  const ref = useRef();
  
  useEffect(() => {
    ref.current = value;
  }, [value]);
  
  return ref.current;
}

/**
 * Memoize expensive calculations
 * @param {Function} fn - Function to memoize
 * @param {Array} deps - Dependencies
 * @returns {any} Memoized result
 */
export function useMemoizedValue(fn, deps) {
  const memoRef = useRef({ deps: null, value: null });
  
  const depsChanged = !memoRef.current.deps || 
    deps.some((dep, i) => dep !== memoRef.current.deps[i]);
  
  if (depsChanged) {
    memoRef.current.deps = deps;
    memoRef.current.value = fn();
  }
  
  return memoRef.current.value;
}

/**
 * Check if component is mounted
 * @returns {Object} Mounted ref
 */
export function useIsMounted() {
  const isMounted = useRef(false);
  
  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
    };
  }, []);
  
  return isMounted;
}
