// src/utils/marketHours.ts
// Trading hours utilities
// Determines market open/close
/**
 * Utility functions for handling market trading hours
 */

// US Stock market trading hours (9:30 AM - 4:00 PM Eastern Time, Monday-Friday)
export const MARKET_OPEN_HOUR = 9;
export const MARKET_OPEN_MINUTE = 30;
export const MARKET_CLOSE_HOUR = 16;
export const MARKET_CLOSE_MINUTE = 0;

/**
 * Checks if a given date is during trading hours
 * For this demo, we're approximating market hours as 9:30 AM - 4:00 PM weekdays
 * A real implementation would need to account for time zones, holidays, etc.
 */
export function isDuringTradingHours(date: Date): boolean {
  // Get day of week (0 = Sunday, 6 = Saturday)
  const day = date.getDay();
  
  // Check if it's a weekday (Monday-Friday)
  if (day === 0 || day === 6) {
    return false;
  }
  
  // Get hours and minutes
  const hours = date.getHours();
  const minutes = date.getMinutes();
  
  // Create time points in minutes for easier comparison
  const timeInMinutes = hours * 60 + minutes;
  const openTimeInMinutes = MARKET_OPEN_HOUR * 60 + MARKET_OPEN_MINUTE;
  const closeTimeInMinutes = MARKET_CLOSE_HOUR * 60 + MARKET_CLOSE_MINUTE;
  
  // Check if within market hours (9:30 AM - 4:00 PM)
  return timeInMinutes >= openTimeInMinutes && timeInMinutes < closeTimeInMinutes;
}

/**
 * Filters data to show only trading hours
 */
export function filterTradingHoursData<T extends { timestamp: number }>(data: T[]): T[] {
  if (!data || data.length === 0) return [];
  
  // Filter out non-trading hours
  return data.filter(item => {
    const date = new Date(item.timestamp);
    return isDuringTradingHours(date);
  });
}
