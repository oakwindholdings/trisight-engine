// src/reportGeneration/utils/sectionGuards.ts
// Section guards for graceful fallback handling in report generation
// Context: Ensures all report sections render with fallback content when data sources fail

import { logDebug, logError } from '../../utils/logger';

/**
 * Result type for section operations that can fail gracefully
 */
export type SectionResult<T> = 
  | { ok: true; data: T }
  | { ok: false; reason: string };

/**
 * Safe wrapper for async operations that may fail
 * Returns structured result instead of throwing
 */
export const safeMaybe = async <T>(
  label: string, 
  f: () => Promise<T>
): Promise<SectionResult<T>> => {
  try {
    const data = await f();
    logDebug('SectionGuards', `${label}: Success`);
    return { ok: true, data };
  } catch (e: any) {
    const reason = `${label}: ${e?.message || 'unknown error'}`;
    logError('SectionGuards', reason, e);
    return { ok: false, reason };
  }
};

/**
 * Safe wrapper for synchronous operations that may fail
 */
export const safeMaybeSync = <T>(
  label: string, 
  f: () => T
): SectionResult<T> => {
  try {
    const data = f();
    logDebug('SectionGuards', `${label}: Success`);
    return { ok: true, data };
  } catch (e: any) {
    const reason = `${label}: ${e?.message || 'unknown error'}`;
    logError('SectionGuards', reason, e);
    return { ok: false, reason };
  }
};

/**
 * Extracts data from SectionResult or returns fallback
 */
export const extractOrFallback = <T>(
  result: SectionResult<T>, 
  fallback: T
): T => {
  return result.ok ? (result as any).data : fallback;
};

/**
 * Extracts data from SectionResult or generates fallback using function
 */
export const extractOrGenerate = <T>(
  result: SectionResult<T>, 
  fallbackFn: (reason: string) => T
): T => {
  if (result.ok) return (result as any).data;
  return fallbackFn((result as any).reason); // TS 4.9 mis-narrows this generic discriminated union
};

/**
 * Combines multiple SectionResults into a single result
 * Succeeds only if all inputs succeed
 */
export const combineResults = <T extends Record<string, any>>(
  results: { [K in keyof T]: SectionResult<T[K]> }
): SectionResult<T> => {
  const failures: string[] = [];
  const data = {} as T;
  
  for (const [key, result] of Object.entries(results)) {
    if (result.ok) {
      (data as any)[key] = (result as any).data;
    } else {
      failures.push(`${key}: ${(result as any).reason}`);
    }
  }
  
  if (failures.length > 0) {
    return { ok: false, reason: `Multiple failures: ${failures.join('; ')}` };
  }
  
  return { ok: true, data };
};

/**
 * Combines multiple SectionResults with partial success
 * Returns successful data and logs failures
 */
export const combinePartial = <T extends Record<string, any>>(
  results: { [K in keyof T]: SectionResult<T[K]> },
  fallbacks: Partial<T> = {}
): { data: T; failures: string[] } => {
  const failures: string[] = [];
  const data = {} as T;
  
  for (const [key, result] of Object.entries(results)) {
    if (result.ok) {
      (data as any)[key] = (result as any).data;
    } else {
      failures.push(`${key}: ${(result as any).reason}`);
      // Use fallback if available
      if (fallbacks && key in fallbacks) {
        (data as any)[key] = (fallbacks as any)[key];
      }
    }
  }
  
  return { data, failures };
};

/**
 * Retry wrapper for operations that may fail temporarily
 */
export const retryMaybe = async <T>(
  label: string,
  f: () => Promise<T>,
  maxRetries: number = 3,
  delayMs: number = 1000
): Promise<SectionResult<T>> => {
  let lastError: any;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const data = await f();
      logDebug('SectionGuards', `${label}: Success on attempt ${attempt}`);
      return { ok: true, data };
    } catch (e: any) {
      lastError = e;
      logDebug('SectionGuards', `${label}: Attempt ${attempt}/${maxRetries} failed: ${e?.message}`);
      
      if (attempt < maxRetries) {
        await new Promise(resolve => setTimeout(resolve, delayMs * attempt));
      }
    }
  }
  
  const reason = `${label}: Failed after ${maxRetries} attempts: ${lastError?.message || 'unknown error'}`;
  logError('SectionGuards', reason, lastError);
  return { ok: false, reason };
};

/**
 * Timeout wrapper for operations that may hang
 */
export const timeoutMaybe = async <T>(
  label: string,
  f: () => Promise<T>,
  timeoutMs: number = 30000
): Promise<SectionResult<T>> => {
  const timeoutPromise = new Promise<never>((_, reject) => {
    setTimeout(() => reject(new Error(`Timeout after ${timeoutMs}ms`)), timeoutMs);
  });
  
  try {
    const data = await Promise.race([f(), timeoutPromise]);
    logDebug('SectionGuards', `${label}: Success within timeout`);
    return { ok: true, data };
  } catch (e: any) {
    const reason = `${label}: ${e?.message || 'unknown error'}`;
    logError('SectionGuards', reason, e);
    return { ok: false, reason };
  }
};

/**
 * Validates data and returns structured result
 */
export const validateMaybe = <T>(
  label: string,
  data: T,
  validator: (data: T) => boolean,
  errorMessage?: string
): SectionResult<T> => {
  try {
    if (validator(data)) {
      logDebug('SectionGuards', `${label}: Validation passed`);
      return { ok: true, data };
    } else {
      const reason = `${label}: Validation failed${errorMessage ? `: ${errorMessage}` : ''}`;
      logError('SectionGuards', reason);
      return { ok: false, reason };
    }
  } catch (e: any) {
    const reason = `${label}: Validation error: ${e?.message || 'unknown error'}`;
    logError('SectionGuards', reason, e);
    return { ok: false, reason };
  }
};

/**
 * Creates a fallback data generator for common report sections
 */
export const createFallbackGenerator = <T>(
  sectionName: string,
  fallbackData: T
) => {
  return (reason: string): T => {
    logDebug('SectionGuards', `Using fallback for ${sectionName}: ${reason}`);
    return fallbackData;
  };
};

/**
 * Utility to check if any results failed
 */
export const hasFailures = (results: SectionResult<any>[]): boolean => {
  return results.some(result => !result.ok);
};

/**
 * Utility to get all failure reasons
 */
export const getFailureReasons = (results: SectionResult<any>[]): string[] => {
  return results.filter(result => !result.ok).map(result => (result as any).reason);
};

/**
 * Utility to get all successful data
 */
export const getSuccessfulData = <T>(results: SectionResult<T>[]): T[] => {
  return results.filter(result => result.ok).map(result => (result as any).data);
};
