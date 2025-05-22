// src/utils/formatters.ts
// Formatting helper functions
// Used across UI
/**
 * Utility functions for formatting data
 */

/**
 * Format a number as a percentage string with a specific number of decimal places
 * @param value The number to format as a percentage
 * @param decimals The number of decimal places to display (default: 1)
 * @returns A formatted percentage string
 */
export const formatPercent = (value: number, decimals: number = 1): string => {
  const multiplied = value * 100;
  return `${multiplied >= 0 ? '+' : ''}${multiplied.toFixed(decimals)}%`;
};

/**
 * Format a number with commas as thousands separators
 * @param value The number to format
 * @returns A formatted string with commas
 */
export const formatNumber = (value: number): string => {
  return new Intl.NumberFormat('en-US').format(value);
};

/**
 * Format a price value with a specific number of decimal places
 * @param price The price to format
 * @param decimals The number of decimal places to display (default: 2)
 * @returns A formatted price string
 */
export const formatPrice = (price: number, decimals: number = 2): string => {
  return `$${price.toFixed(decimals)}`;
};

/**
 * Format a date to a readable string
 * @param date The date to format
 * @param includeTime Whether to include the time (default: false)
 * @returns A formatted date string
 */
export const formatDate = (date: Date, includeTime: boolean = false): string => {
  const options: Intl.DateTimeFormatOptions = { 
    year: 'numeric', 
    month: 'short', 
    day: 'numeric'
  };
  
  if (includeTime) {
    options.hour = 'numeric';
    options.minute = '2-digit';
  }
  
  return new Intl.DateTimeFormat('en-US', options).format(date);
};

/**
 * Format a date to show only the time portion
 * @param date The date to format
 * @returns A formatted time string
 */
export const formatTime = (date: Date): string => {
  const options: Intl.DateTimeFormatOptions = {
    hour: 'numeric',
    minute: '2-digit',
    second: '2-digit',
    hour12: true
  };
  
  return new Intl.DateTimeFormat('en-US', options).format(date);
};
