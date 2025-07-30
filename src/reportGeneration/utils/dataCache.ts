// src/reportGeneration/utils/dataCache.ts
// In-memory cache with TTL support for API response caching
// Context: Reduces API calls and improves development experience

import { logDebug } from '../../utils/logger';

/**
 * Represents a cached value with metadata
 * The TTL ensures we don't serve stale financial data
 */
interface CacheEntry<T> {
  value: T;
  timestamp: number;
  ttl: number; // Time to live in milliseconds
  hits: number; // Track usage for LRU implementation
  size: number; // Estimated memory size
  compressed?: boolean;
}

/**
 * Configuration for cache behavior
 * Different data types have different freshness requirements
 */
export interface CacheConfig {
  defaultTTLMs: number; // Default time-to-live in milliseconds
  maxSize: number; // Maximum number of entries to store
  maxMemoryMB?: number; // Maximum memory usage in MB
  enableCompression?: boolean; // Whether to compress large entries
  evictionStrategy?: 'LRU' | 'FIFO'; // Eviction strategy
}

/**
 * Time-based cache with LRU/FIFO eviction
 * Designed for financial data that changes at different rates
 */
export class DataCache {
  private cache: Map<string, CacheEntry<any>> = new Map();
  private config: CacheConfig;
  private totalMemoryBytes: number = 0;
  
  constructor(config: Partial<CacheConfig> = {}) {
    this.config = {
      defaultTTLMs: 5 * 60 * 1000, // 5 minutes default
      maxSize: 100,
      maxMemoryMB: 50, // 50MB default
      enableCompression: false,
      evictionStrategy: 'LRU',
      ...config
    };
  }
  
  /**
   * Generates a cache key from request parameters
   * This ensures identical requests share the same cache entry
   */
  static createKey(prefix: string, ...params: (string | number | Record<string, any>)[]): string {
    // Handle different parameter types
    const parts = params.map(param => {
      if (typeof param === 'object') {
        // Sort object keys for consistent key generation
        const sorted = Object.entries(param)
          .sort(([a], [b]) => a.localeCompare(b))
          .map(([key, value]) => `${key}=${JSON.stringify(value)}`)
          .join('&');
        return sorted;
      }
      return String(param);
    });
    
    return `${prefix}:${parts.join(':')}`;
  }
  
  /**
   * Gets data from cache if fresh
   * Returns null if data is stale or missing
   */
  get<T>(key: string, ttlMs?: number): T | null {
    const entry = this.cache.get(key);
    if (!entry) {
      logDebug('DataCache', `Cache miss for key: ${key}`);
      return null;
    }
    
    const age = Date.now() - entry.timestamp;
    const ttl = ttlMs || entry.ttl || this.config.defaultTTLMs;
    
    if (age > ttl) {
      logDebug('DataCache', `Cache expired for key: ${key} (age: ${age}ms)`);
      this.delete(key);
      return null;
    }
    
    // Update hit count for LRU tracking
    entry.hits++;
    logDebug('DataCache', `Cache hit for key: ${key} (age: ${age}ms, hits: ${entry.hits})`);
    
    return entry.value;
  }
  
  /**
   * Stores data in cache with automatic eviction if needed
   */
  set<T>(key: string, data: T, ttlMs?: number): void {
    const size = this.estimateSize(data);
    
    // Check memory limit
    const maxMemoryBytes = (this.config.maxMemoryMB || 50) * 1024 * 1024;
    if (this.totalMemoryBytes + size > maxMemoryBytes) {
      this.evictUntilMemoryAvailable(size);
    }
    
    // Check entry count limit
    if (this.cache.size >= this.config.maxSize && !this.cache.has(key)) {
      this.evictOne();
    }
    
    // Remove old entry if updating
    if (this.cache.has(key)) {
      this.delete(key);
    }
    
    const entry: CacheEntry<T> = {
      value: data,
      timestamp: Date.now(),
      ttl: ttlMs || this.config.defaultTTLMs,
      hits: 0,
      size
    };
    
    this.cache.set(key, entry);
    this.totalMemoryBytes += size;
    logDebug('DataCache', `Cached key: ${key} (size: ${size} bytes, ttl: ${entry.ttl}ms)`);
  }
  
  /**
   * Checks if a key exists and hasn't expired
   * Useful for conditional fetching logic
   */
  has(key: string): boolean {
    return this.get(key) !== null;
  }
  
  /**
   * Removes a specific entry from the cache
   * Useful when data is known to be invalidated
   */
  delete(key: string): boolean {
    const entry = this.cache.get(key);
    if (entry) {
      this.totalMemoryBytes -= entry.size;
      return this.cache.delete(key);
    }
    return false;
  }
  
  /**
   * Invalidates specific cache entries matching a pattern
   * Useful when we know data has changed
   */
  invalidate(pattern: string | RegExp): number {
    let invalidated = 0;
    
    for (const key of this.cache.keys()) {
      if (typeof pattern === 'string' ? key.includes(pattern) : pattern.test(key)) {
        if (this.delete(key)) {
          invalidated++;
        }
      }
    }
    
    logDebug('DataCache', `Invalidated ${invalidated} entries matching: ${pattern}`);
    return invalidated;
  }
  
  /**
   * Gets cache statistics for monitoring and debugging
   */
  getStats(): {
    size: number;
    totalHits: number;
    hitRate: number;
    totalMemoryMB: number;
    avgAge: number;
    oldestEntry: number;
  } {
    let totalHits = 0;
    let totalAccess = 0;
    let totalAge = 0;
    let oldestTimestamp = Date.now();
    const now = Date.now();
    
    for (const entry of this.cache.values()) {
      totalAccess += entry.hits + 1; // +1 for initial set
      totalHits += entry.hits;
      totalAge += now - entry.timestamp;
      oldestTimestamp = Math.min(oldestTimestamp, entry.timestamp);
    }
    
    return {
      size: this.cache.size,
      totalHits,
      hitRate: totalAccess > 0 ? totalHits / totalAccess : 0,
      totalMemoryMB: this.totalMemoryBytes / (1024 * 1024),
      avgAge: this.cache.size > 0 ? totalAge / this.cache.size : 0,
      oldestEntry: now - oldestTimestamp
    };
  }
  
  /**
   * Clears the entire cache
   */
  clear(): void {
    const size = this.cache.size;
    this.cache.clear();
    this.totalMemoryBytes = 0;
    logDebug('DataCache', `Cleared ${size} cache entries`);
  }
  
  /**
   * Gets current cache size for monitoring
   */
  get size(): number {
    return this.cache.size;
  }
  
  /**
   * Evicts entries based on configured strategy
   */
  private evictOne(): void {
    if (this.config.evictionStrategy === 'FIFO') {
      this.evictOldest();
    } else {
      this.evictLRU();
    }
  }
  
  /**
   * Evicts oldest entry (FIFO strategy)
   */
  private evictOldest(): void {
    let oldestKey: string | null = null;
    let oldestTime = Infinity;
    
    for (const [key, entry] of this.cache.entries()) {
      if (entry.timestamp < oldestTime) {
        oldestTime = entry.timestamp;
        oldestKey = key;
      }
    }
    
    if (oldestKey) {
      this.delete(oldestKey);
      logDebug('DataCache', `Evicted oldest entry: ${oldestKey}`);
    }
  }
  
  /**
   * Evicts least recently used entry (LRU strategy)
   */
  private evictLRU(): void {
    let lruKey: string | null = null;
    let minScore = Infinity;
    
    for (const [key, entry] of this.cache.entries()) {
      const age = Date.now() - entry.timestamp;
      // Score combines hit count and age - lower score = less useful
      const score = entry.hits * 1000 - age; // Favor frequently accessed, recent entries
      
      if (score < minScore) {
        minScore = score;
        lruKey = key;
      }
    }
    
    if (lruKey) {
      this.delete(lruKey);
      logDebug('DataCache', `Evicted LRU entry: ${lruKey}`);
    }
  }
  
  /**
   * Evicts entries until enough memory is available
   */
  private evictUntilMemoryAvailable(requiredBytes: number): void {
    const maxMemoryBytes = (this.config.maxMemoryMB || 50) * 1024 * 1024;
    
    while (this.totalMemoryBytes + requiredBytes > maxMemoryBytes && this.cache.size > 0) {
      this.evictOne();
    }
  }
  
  /**
   * Estimates the memory size of data
   * Used for cache size management
   */
  private estimateSize(data: any): number {
    try {
      return JSON.stringify(data).length * 2; // Rough estimate: 2 bytes per character
    } catch {
      return 1000; // Default estimate for non-serializable data
    }
  }
}

/**
 * Creates a memoized version of an async function with caching
 * This is a higher-order function that adds caching to any API call
 */
export function memoizeAsync<T extends (...args: any[]) => Promise<any>>(
  fn: T,
  options: {
    cache?: DataCache;
    ttlMs?: number;
    keyGenerator?: (...args: Parameters<T>) => string;
    keyPrefix?: string;
  } = {}
): T {
  const cache = options.cache || new DataCache();
  const keyGen = options.keyGenerator || ((...args) => {
    const prefix = options.keyPrefix || fn.name || 'memoized';
    return DataCache.createKey(prefix, ...args);
  });
  
  return (async (...args: Parameters<T>): Promise<ReturnType<T>> => {
    const key = keyGen(...args);
    
    // Check cache first
    const cached = cache.get<ReturnType<T>>(key, options.ttlMs);
    if (cached !== null) {
      return cached;
    }
    
    // Call function and cache result
    const result = await fn(...args);
    cache.set(key, result, options.ttlMs);
    
    return result;
  }) as T;
}