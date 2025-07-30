// src/reportGeneration/utils/cache.ts
// Compatibility wrapper for dataCache.ts
// Context: Maintains backward compatibility while using enhanced caching system

export { 
  DataCache as MemoryCache,
  DataCache,
  memoizeAsync,
  memoizeAsync as withCache
} from './dataCache';

export type { CacheConfig } from './dataCache';

// Re-export with original function signature for backward compatibility
export { DataCache as default } from './dataCache';