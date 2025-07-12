// src/utils/gestureThrottle.ts
// Throttle and debounce utilities for gesture control
// Configurable delays to optimize chart interaction performance

// Global gesture throttle settings
export const GESTURE_THROTTLE_CONFIG = {
  ZOOM_DEBOUNCE_MS: 100,  // Default zoom debounce in milliseconds
  PAN_DEBOUNCE_MS: 60,    // Default pan debounce in milliseconds
  MIN_ZOOM_VELOCITY: 0.01, // Minimum zoom velocity before considered "stopped"
  MIN_PAN_VELOCITY: 0.5   // Minimum pan velocity before considered "stopped"
};

/**
 * Debounce function that delays execution until after wait milliseconds
 * have elapsed since the last time the debounced function was invoked
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null;
  
  return function debounced(...args: Parameters<T>) {
    if (timeout) {
      clearTimeout(timeout);
    }
    
    timeout = setTimeout(() => {
      func(...args);
      timeout = null;
    }, wait);
  };
}

/**
 * Throttle function that only allows execution at most once per interval
 */
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle = false;
  
  return function throttled(...args: Parameters<T>) {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => {
        inThrottle = false;
      }, limit);
    }
  };
}

/**
 * Velocity-based throttle that only triggers when velocity is near zero
 * Perfect for gestures that should only update when movement stops
 */
export function velocityThrottle<T extends (...args: any[]) => any>(
  func: T,
  minVelocity: number,
  wait: number = 100
): (velocity: number, ...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null;
  
  return function velocityThrottled(velocity: number, ...args: Parameters<T>) {
    if (timeout) {
      clearTimeout(timeout);
    }
    
    // If velocity is below threshold, execute after wait period
    if (Math.abs(velocity) < minVelocity) {
      timeout = setTimeout(() => {
        func(...args);
        timeout = null;
      }, wait);
    }
  };
}

/**
 * Update gesture throttle configuration
 */
export function updateGestureThrottleConfig(config: Partial<typeof GESTURE_THROTTLE_CONFIG>) {
  Object.assign(GESTURE_THROTTLE_CONFIG, config);
}
