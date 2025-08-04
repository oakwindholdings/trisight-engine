// src/reportGeneration/utils/cancellationManager.ts
// Manages cancellation tokens for report generation
// Context: Provides proper cleanup and cancellation of async operations

import { logDebug } from '../../utils/logger';

export interface CancellationToken {
  signal: AbortSignal;
  isCancelled: boolean;
  throwIfCancelled(): void;
}

/**
 * Manages cancellation for report generation operations
 */
export class CancellationManager {
  private controller: AbortController;
  private cleanupCallbacks: Set<() => void> = new Set();

  constructor() {
    this.controller = new AbortController();
  }

  /**
   * Get a cancellation token for operations
   */
  getToken(): CancellationToken {
    const signal = this.controller.signal;
    
    return {
      signal,
      get isCancelled() {
        return signal.aborted;
      },
      throwIfCancelled() {
        if (signal.aborted) {
          throw new Error('Operation cancelled');
        }
      }
    };
  }

  /**
   * Register a cleanup callback to be called on cancellation
   */
  onCancel(callback: () => void): () => void {
    this.cleanupCallbacks.add(callback);
    
    // If already cancelled, call immediately
    if (this.controller.signal.aborted) {
      callback();
    }
    
    // Return unsubscribe function
    return () => this.cleanupCallbacks.delete(callback);
  }

  /**
   * Cancel all operations
   */
  cancel(): void {
    logDebug('CancellationManager', 'Cancelling all operations');
    
    // Abort the controller
    this.controller.abort();
    
    // Call all cleanup callbacks
    this.cleanupCallbacks.forEach(callback => {
      try {
        callback();
      } catch (error) {
        logDebug('CancellationManager', `Cleanup callback error: ${error}`);
      }
    });
    
    // Clear callbacks
    this.cleanupCallbacks.clear();
  }

  /**
   * Reset for a new operation
   */
  reset(): void {
    this.controller = new AbortController();
    this.cleanupCallbacks.clear();
  }

  /**
   * Wrap a promise with cancellation support
   */
  async wrapPromise<T>(promise: Promise<T>, operationName?: string): Promise<T> {
    const token = this.getToken();
    
    return new Promise<T>((resolve, reject) => {
      // Check if already cancelled
      if (token.isCancelled) {
        reject(new Error('Operation cancelled before start'));
        return;
      }
      
      // Listen for cancellation
      const onAbort = () => {
        reject(new Error(`Operation cancelled: ${operationName || 'unknown'}`));
      };
      
      token.signal.addEventListener('abort', onAbort);
      
      // Execute the promise
      promise
        .then(result => {
          token.signal.removeEventListener('abort', onAbort);
          if (token.isCancelled) {
            reject(new Error('Operation cancelled after completion'));
          } else {
            resolve(result);
          }
        })
        .catch(error => {
          token.signal.removeEventListener('abort', onAbort);
          reject(error);
        });
    });
  }

  /**
   * Create a cancellable delay
   */
  async delay(ms: number): Promise<void> {
    const token = this.getToken();
    
    return new Promise<void>((resolve, reject) => {
      if (token.isCancelled) {
        reject(new Error('Delay cancelled'));
        return;
      }
      
      const timeoutId = setTimeout(() => {
        if (token.isCancelled) {
          reject(new Error('Delay cancelled'));
        } else {
          resolve();
        }
      }, ms);
      
      const cleanup = () => {
        clearTimeout(timeoutId);
        reject(new Error('Delay cancelled'));
      };
      
      token.signal.addEventListener('abort', cleanup, { once: true });
    });
  }

  /**
   * Check if an error is a cancellation error
   */
  static isCancellationError(error: any): boolean {
    return error?.message?.includes('cancelled') || 
           error?.message?.includes('aborted') ||
           error?.name === 'AbortError';
  }
}