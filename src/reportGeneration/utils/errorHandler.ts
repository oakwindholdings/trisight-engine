// src/reportGeneration/utils/errorHandler.ts
// Intelligent error handling with categorization and retry strategies
// Context: Ensures data fetching resilience against transient failures

/**
 * Categories of errors that determine retry behavior
 * Network and timeout errors are typically transient and worth retrying
 * Auth and parsing errors indicate configuration issues that won't resolve with retries
 */
export enum ErrorCategory {
  NETWORK = 'NETWORK',
  TIMEOUT = 'TIMEOUT',
  RATE_LIMIT = 'RATE_LIMIT',
  AUTH = 'AUTH',
  PARSING = 'PARSING',
  UNKNOWN = 'UNKNOWN'
}

/**
 * Custom error class that includes retry information
 * This helps the system make intelligent decisions about error recovery
 */
export class RetryableError extends Error {
  constructor(
    message: string,
    public category: ErrorCategory,
    public retryable: boolean,
    public originalError?: Error
  ) {
    super(message);
    this.name = 'RetryableError';
  }
}

/**
 * Configuration for retry behavior
 * These defaults work well for financial APIs but can be customized per adapter
 */
export interface RetryConfig {
  maxAttempts: number;
  initialDelayMs: number;
  maxDelayMs: number;
  backoffMultiplier: number;
}

export const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxAttempts: 3,
  initialDelayMs: 1000,
  maxDelayMs: 32000,
  backoffMultiplier: 2
};

/**
 * Categorizes errors to determine if they should be retried
 * This function embodies our knowledge about common API failure modes
 */
export function categorizeError(error: Error): ErrorCategory {
  const message = error.message.toLowerCase();
  const name = error.name.toLowerCase();
  
  // Network-related errors that are typically transient
  if (
    message.includes('network') ||
    message.includes('fetch failed') ||
    message.includes('econnrefused') ||
    message.includes('enotfound') ||
    message.includes('econnreset') ||
    name.includes('fetcherror')
  ) {
    return ErrorCategory.NETWORK;
  }
  
  // Timeout errors that might succeed with more time
  if (
    message.includes('timeout') ||
    message.includes('timedout') ||
    message.includes('request timeout')
  ) {
    return ErrorCategory.TIMEOUT;
  }
  
  // Rate limiting requires backing off
  if (
    message.includes('rate limit') ||
    message.includes('429') ||
    message.includes('too many requests')
  ) {
    return ErrorCategory.RATE_LIMIT;
  }
  
  // Authentication failures won't resolve with retries
  if (
    message.includes('unauthorized') ||
    message.includes('401') ||
    message.includes('forbidden') ||
    message.includes('403') ||
    message.includes('invalid api key')
  ) {
    return ErrorCategory.AUTH;
  }
  
  // Data parsing errors indicate unexpected response format
  if (
    message.includes('parsing') ||
    message.includes('invalid json') ||
    message.includes('unexpected token') ||
    name.includes('syntaxerror')
  ) {
    return ErrorCategory.PARSING;
  }
  
  return ErrorCategory.UNKNOWN;
}

/**
 * Determines if an error should be retried based on its category
 * This encodes our retry policy across the system
 */
export function isRetryable(category: ErrorCategory): boolean {
  return [
    ErrorCategory.NETWORK,
    ErrorCategory.TIMEOUT,
    ErrorCategory.RATE_LIMIT
  ].includes(category);
}

/**
 * Calculates delay before next retry attempt using exponential backoff
 * This prevents overwhelming APIs while recovering as quickly as possible
 */
export function calculateBackoffDelay(
  attempt: number,
  config: RetryConfig
): number {
  const exponentialDelay = config.initialDelayMs * Math.pow(config.backoffMultiplier, attempt - 1);
  const jitteredDelay = exponentialDelay * (0.5 + Math.random() * 0.5); // Add jitter to prevent thundering herd
  return Math.min(jitteredDelay, config.maxDelayMs);
}

/**
 * Executes a function with automatic retry logic
 * This is the main utility that other parts of the system will use
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  config: RetryConfig = DEFAULT_RETRY_CONFIG,
  onRetry?: (attempt: number, error: Error, delayMs: number) => void
): Promise<T> {
  let lastError: Error | null = null;
  
  for (let attempt = 1; attempt <= config.maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;
      const category = categorizeError(lastError);
      
      // Don't retry if this error type isn't retryable or we're out of attempts
      if (!isRetryable(category) || attempt === config.maxAttempts) {
        throw new RetryableError(
          `Failed after ${attempt} attempts: ${lastError.message}`,
          category,
          false,
          lastError
        );
      }
      
      // Calculate delay and notify caller if they want to log/monitor
      const delayMs = calculateBackoffDelay(attempt, config);
      if (onRetry) {
        onRetry(attempt, lastError, delayMs);
      }
      
      // Wait before retrying
      await new Promise(resolve => setTimeout(resolve, delayMs));
    }
  }
  
  // This should never be reached due to the logic above, but TypeScript needs it
  throw lastError;
}

/**
 * Wraps an error with additional context about data fetching
 * This helps with debugging when errors bubble up through multiple layers
 */
export function wrapDataFetchError(
  error: Error,
  context: {
    source: string;
    operation: string;
    ticker?: string;
  }
): RetryableError {
  const category = categorizeError(error);
  const message = `${context.source} ${context.operation} failed${
    context.ticker ? ` for ${context.ticker}` : ''
  }: ${error.message}`;
  
  return new RetryableError(message, category, isRetryable(category), error);
}