// src/reportGeneration/utils/storageAdapter.ts
// Storage adapter that works in both browser and Node.js environments
// Context: Provides localStorage-like API for Node.js environments

interface StorageItem {
  data: any;
  expires: number;
}

/**
 * Simple in-memory storage for Node.js environments
 */
class MemoryStorage {
  private storage: Map<string, string> = new Map();

  getItem(key: string): string | null {
    return this.storage.get(key) || null;
  }

  setItem(key: string, value: string): void {
    this.storage.set(key, value);
  }

  removeItem(key: string): void {
    this.storage.delete(key);
  }

  clear(): void {
    this.storage.clear();
  }

  get length(): number {
    return this.storage.size;
  }

  key(index: number): string | null {
    const keys = Array.from(this.storage.keys());
    return keys[index] || null;
  }

  keys(): string[] {
    return Array.from(this.storage.keys());
  }
}

/**
 * Storage adapter that provides a unified interface for both browser and Node.js
 */
export class StorageAdapter {
  private storage: Storage | MemoryStorage;

  constructor() {
    // Check if we're in a browser environment with localStorage
    if (typeof window !== 'undefined' && window.localStorage) {
      this.storage = window.localStorage;
    } else {
      // Use in-memory storage for Node.js
      this.storage = new MemoryStorage();
    }
  }

  getItem(key: string): string | null {
    try {
      return this.storage.getItem(key);
    } catch (error) {
      console.warn('[StorageAdapter] Failed to get item:', error);
      return null;
    }
  }

  setItem(key: string, value: string): void {
    try {
      this.storage.setItem(key, value);
    } catch (error) {
      console.warn('[StorageAdapter] Failed to set item:', error);
      // If storage is full, try to clear old entries
      this.clearExpiredEntries();
      try {
        this.storage.setItem(key, value);
      } catch (retryError) {
        console.error('[StorageAdapter] Failed to set item after cleanup:', retryError);
      }
    }
  }

  removeItem(key: string): void {
    try {
      this.storage.removeItem(key);
    } catch (error) {
      console.warn('[StorageAdapter] Failed to remove item:', error);
    }
  }

  clear(): void {
    try {
      this.storage.clear();
    } catch (error) {
      console.warn('[StorageAdapter] Failed to clear storage:', error);
    }
  }

  keys(): string[] {
    try {
      if (this.storage instanceof MemoryStorage) {
        return this.storage.keys();
      } else {
        // For localStorage, we need to iterate
        const keys: string[] = [];
        for (let i = 0; i < this.storage.length; i++) {
          const key = this.storage.key(i);
          if (key) keys.push(key);
        }
        return keys;
      }
    } catch (error) {
      console.warn('[StorageAdapter] Failed to get keys:', error);
      return [];
    }
  }

  /**
   * Clear expired entries from storage
   */
  private clearExpiredEntries(): void {
    const now = Date.now();
    const keysToRemove: string[] = [];

    this.keys().forEach(key => {
      try {
        const value = this.getItem(key);
        if (value) {
          const item = JSON.parse(value);
          if (item.expires && item.expires < now) {
            keysToRemove.push(key);
          }
        }
      } catch (error) {
        // Remove corrupted entries
        keysToRemove.push(key);
      }
    });

    keysToRemove.forEach(key => this.removeItem(key));
  }
}

// Export a singleton instance
export const storageAdapter = new StorageAdapter();