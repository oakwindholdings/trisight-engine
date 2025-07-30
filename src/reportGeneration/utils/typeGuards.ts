// src/reportGeneration/utils/typeGuards.ts
// Type guards for validating API responses at runtime
// Context: Ensures data integrity when processing external API responses

/**
 * Validates that a value is a valid number
 * Handles string numbers from APIs and filters out invalid values
 */
export function isValidNumber(value: any): value is number {
  if (typeof value === 'number') {
    return !isNaN(value) && isFinite(value);
  }
  if (typeof value === 'string') {
    const parsed = parseFloat(value);
    return !isNaN(parsed) && isFinite(parsed);
  }
  return false;
}

/**
 * Safely parses a numeric value from API response
 * Returns default value if parsing fails
 */
export function safeParseFloat(value: any, defaultValue: number = 0): number {
  if (isValidNumber(value)) {
    return typeof value === 'number' ? value : parseFloat(value);
  }
  return defaultValue;
}

/**
 * Safely parses an integer value from API response
 * Returns default value if parsing fails
 */
export function safeParseInt(value: any, defaultValue: number = 0): number {
  if (isValidNumber(value)) {
    return typeof value === 'number' ? Math.floor(value) : parseInt(value);
  }
  return defaultValue;
}

/**
 * Validates date string format
 * Ensures dates are in expected format before processing
 */
export function isValidDateString(value: any): value is string {
  if (typeof value !== 'string') return false;
  const date = new Date(value);
  return !isNaN(date.getTime());
}

/**
 * Validates that an object has required properties
 * Useful for checking API response structure
 */
export function hasRequiredProperties<T extends object>(
  obj: any,
  properties: (keyof T)[]
): obj is T {
  if (!obj || typeof obj !== 'object') return false;
  return properties.every(prop => prop in obj);
}

/**
 * Type guard for financial statement data
 */
export function isValidFinancialStatement(data: any): boolean {
  return (
    hasRequiredProperties(data, ['date']) &&
    isValidDateString(data.date) &&
    (isValidNumber(data.revenue) || data.revenue === undefined) &&
    (isValidNumber(data.netIncome) || data.netIncome === undefined) &&
    (isValidNumber(data.eps) || data.eps === undefined)
  );
}

/**
 * Type guard for price data (OHLCV)
 */
export function isValidPriceData(data: any): boolean {
  return (
    hasRequiredProperties(data, ['datetime', 'open', 'high', 'low', 'close', 'volume']) &&
    isValidDateString(data.datetime) &&
    isValidNumber(data.open) &&
    isValidNumber(data.high) &&
    isValidNumber(data.low) &&
    isValidNumber(data.close) &&
    isValidNumber(data.volume)
  );
}

/**
 * Type guard for analyst rating data
 */
export function isValidAnalystRating(data: any): boolean {
  return (
    hasRequiredProperties(data, ['date', 'firm', 'rating']) &&
    isValidDateString(data.date) &&
    typeof data.firm === 'string' &&
    typeof data.rating === 'string'
  );
}

/**
 * Validates array of items with a type guard
 * Filters out invalid items and returns typed array
 */
export function validateArray<T>(
  items: any[],
  validator: (item: any) => item is T
): T[] {
  if (!Array.isArray(items)) return [];
  return items.filter(validator);
}

/**
 * Safely extracts nested property from object
 * Returns undefined if path doesn't exist
 */
export function safeGet<T>(
  obj: any,
  path: string,
  defaultValue?: T
): T | undefined {
  const keys = path.split('.');
  let result = obj;
  
  for (const key of keys) {
    if (result && typeof result === 'object' && key in result) {
      result = result[key];
    } else {
      return defaultValue;
    }
  }
  
  return result as T;
}

/**
 * Type guard for TwelveData quote response
 */
export function isValidQuoteResponse(data: any): boolean {
  return (
    hasRequiredProperties(data, ['symbol', 'close', 'volume']) &&
    typeof data.symbol === 'string' &&
    isValidNumber(data.close) &&
    isValidNumber(data.volume)
  );
}

/**
 * Type guard for TwelveData time series response
 */
export function isValidTimeSeriesResponse(data: any): boolean {
  return (
    hasRequiredProperties(data, ['meta', 'values']) &&
    data.meta &&
    typeof data.meta === 'object' &&
    Array.isArray(data.values) &&
    data.values.every(isValidPriceData)
  );
}

/**
 * Type guard for technical indicator response
 */
export function isValidIndicatorResponse(data: any): boolean {
  return (
    hasRequiredProperties(data, ['meta', 'values']) &&
    data.meta &&
    typeof data.meta === 'object' &&
    Array.isArray(data.values) &&
    data.values.length > 0
  );
}

/**
 * Validates and transforms error response
 * Extracts meaningful error message from various formats
 */
export function extractErrorMessage(error: any): string {
  if (typeof error === 'string') return error;
  if (error?.message) return error.message;
  if (error?.error?.message) return error.error.message;
  if (error?.errors?.[0]?.message) return error.errors[0].message;
  if (error?.response?.data?.message) return error.response.data.message;
  if (error?.response?.statusText) return error.response.statusText;
  return 'Unknown error occurred';
}

/**
 * Type guard for rate limit error
 */
export function isRateLimitError(error: any): boolean {
  const message = extractErrorMessage(error).toLowerCase();
  return (
    message.includes('rate limit') ||
    message.includes('too many requests') ||
    message.includes('429') ||
    (error?.response?.status === 429) ||
    (error?.status === 429)
  );
}

/**
 * Type guard for authentication error
 */
export function isAuthError(error: any): boolean {
  const message = extractErrorMessage(error).toLowerCase();
  return (
    message.includes('unauthorized') ||
    message.includes('invalid api key') ||
    message.includes('401') ||
    message.includes('403') ||
    (error?.response?.status === 401) ||
    (error?.response?.status === 403) ||
    (error?.status === 401) ||
    (error?.status === 403)
  );
}

/**
 * Validates and cleans object by removing invalid values
 * Useful for cleaning API responses before storage
 */
export function cleanObject<T extends object>(
  obj: T,
  options: {
    removeNull?: boolean;
    removeUndefined?: boolean;
    removeEmpty?: boolean;
  } = {}
): Partial<T> {
  const { removeNull = true, removeUndefined = true, removeEmpty = false } = options;
  const cleaned: any = {};
  
  for (const [key, value] of Object.entries(obj)) {
    if (removeNull && value === null) continue;
    if (removeUndefined && value === undefined) continue;
    if (removeEmpty && value === '') continue;
    cleaned[key] = value;
  }
  
  return cleaned;
}