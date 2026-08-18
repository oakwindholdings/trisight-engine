// src/reportGeneration/utils/cacheWarming.ts
// Cache warming and preloading strategies for report generation optimization
// Context: Proactively loads frequently accessed data to improve performance

import { performanceMonitor } from './performanceMonitor';
import logger from '../../utils/logger';

export interface CacheWarmingStrategy {
  name: string;
  priority: number;
  warmCache: () => Promise<void>;
  shouldWarm: () => boolean;
}

export interface WarmingResult {
  strategy: string;
  success: boolean;
  itemsWarmed: number;
  duration: number;
  error?: string;
}

export class CacheWarmer {
  private strategies: CacheWarmingStrategy[] = [];
  private warmingInProgress = false;
  private lastWarmingTime = 0;
  private warmingInterval = 30 * 60 * 1000; // 30 minutes
  
  /**
   * Registers a cache warming strategy
   */
  registerStrategy(strategy: CacheWarmingStrategy): void {
    this.strategies.push(strategy);
    this.strategies.sort((a, b) => b.priority - a.priority);
    logger.info('cacheWarming', `Registered cache warming strategy: ${strategy.name}`);
  }
  
  /**
   * Executes all registered warming strategies
   */
  async warmAllCaches(): Promise<WarmingResult[]> {
    if (this.warmingInProgress) {
      logger.warn('cacheWarming', 'Cache warming already in progress, skipping...');
      return [];
    }
    
    this.warmingInProgress = true;
    const results: WarmingResult[] = [];
    
    try {
      logger.info('cacheWarming', 'Starting cache warming process...');
      
      for (const strategy of this.strategies) {
        if (!strategy.shouldWarm()) {
          logger.debug('cacheWarming', `Skipping strategy ${strategy.name} - conditions not met`);
          continue;
        }
        
        const result = await this.executeStrategy(strategy);
        results.push(result);
      }
      
      this.lastWarmingTime = Date.now();
      logger.info('cacheWarming', `Cache warming completed. ${results.length} strategies executed.`);
      
      return results;
    } finally {
      this.warmingInProgress = false;
    }
  }
  
  /**
   * Executes a single warming strategy with monitoring
   */
  private async executeStrategy(strategy: CacheWarmingStrategy): Promise<WarmingResult> {
    const start = performance.now();
    
    try {
      await performanceMonitor.measureOperation(
        `cache_warming_${strategy.name}`,
        () => strategy.warmCache()
      );
      
      const duration = performance.now() - start;
      
      return {
        strategy: strategy.name,
        success: true,
        itemsWarmed: 0, // Strategy should update this
        duration
      };
    } catch (error) {
      const duration = performance.now() - start;
      logger.error('cacheWarming', `Cache warming strategy ${strategy.name} failed:`, error);
      
      return {
        strategy: strategy.name,
        success: false,
        itemsWarmed: 0,
        duration,
        error: error instanceof Error ? error.message : String(error)
      };
    }
  }
  
  /**
   * Checks if cache warming is due
   */
  shouldWarmCaches(): boolean {
    return Date.now() - this.lastWarmingTime > this.warmingInterval;
  }
  
  /**
   * Sets up automatic cache warming
   */
  startAutoWarming(intervalMs?: number): void {
    if (intervalMs) {
      this.warmingInterval = intervalMs;
    }
    
    // Initial warming
    this.warmAllCaches().catch(error => {
      logger.error('cacheWarming', 'Initial cache warming failed:', error);
    });
    
    // Set up interval
    setInterval(() => {
      if (this.shouldWarmCaches()) {
        this.warmAllCaches().catch(error => {
          logger.error('cacheWarming', 'Scheduled cache warming failed:', error);
        });
      }
    }, 60000); // Check every minute
  }
}

/**
 * Common cache warming strategies
 */
export const commonStrategies = {
  /**
   * Warms market data cache for frequently accessed symbols
   */
  marketDataWarming: (
    symbols: string[],
    fetchData: (symbol: string) => Promise<any>
  ): CacheWarmingStrategy => ({
    name: 'market_data',
    priority: 100,
    shouldWarm: () => symbols.length > 0,
    warmCache: async () => {
      logger.info('cacheWarming', `Warming cache for ${symbols.length} symbols`);
      
      // Batch symbols to avoid overwhelming the API
      const batchSize = 5;
      const batches = [];
      
      for (let i = 0; i < symbols.length; i += batchSize) {
        batches.push(symbols.slice(i, i + batchSize));
      }
      
      for (const batch of batches) {
        await Promise.all(
          batch.map(symbol => 
            fetchData(symbol).catch(error => {
              logger.warn('cacheWarming', `Failed to warm cache for ${symbol}:`, error);
            })
          )
        );
        
        // Small delay between batches
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
  }),
  
  /**
   * Warms technical indicators cache
   */
  technicalIndicatorsWarming: (
    indicators: string[],
    fetchIndicator: (indicator: string) => Promise<any>
  ): CacheWarmingStrategy => ({
    name: 'technical_indicators',
    priority: 80,
    shouldWarm: () => indicators.length > 0,
    warmCache: async () => {
      logger.info('cacheWarming', `Warming cache for ${indicators.length} indicators`);
      
      await Promise.all(
        indicators.map(indicator =>
          fetchIndicator(indicator).catch(error => {
            logger.warn('cacheWarming', `Failed to warm cache for ${indicator}:`, error);
          })
        )
      );
    }
  }),
  
  /**
   * Warms company profile cache
   */
  companyProfileWarming: (
    companies: string[],
    fetchProfile: (symbol: string) => Promise<any>
  ): CacheWarmingStrategy => ({
    name: 'company_profiles',
    priority: 60,
    shouldWarm: () => companies.length > 0,
    warmCache: async () => {
      logger.info('cacheWarming', `Warming cache for ${companies.length} company profiles`);
      
      // Sequential to be gentle on the API
      for (const company of companies) {
        try {
          await fetchProfile(company);
          await new Promise(resolve => setTimeout(resolve, 500));
        } catch (error) {
          logger.warn('cacheWarming', `Failed to warm cache for ${company}:`, error);
        }
      }
    }
  })
};

// Global instance
export const cacheWarmer = new CacheWarmer();