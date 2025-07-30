// src/reportGeneration/utils/resourcePool.ts
// Resource pooling system for managing API connections and expensive resources
// Context: Prevents resource exhaustion and improves performance through reuse

import { performanceMonitor } from './performanceMonitor';
import { logger } from '../../utils/logger';

export interface PooledResource<T> {
  resource: T;
  id: string;
  inUse: boolean;
  lastUsed: number;
  useCount: number;
  errors: number;
}

export interface ResourcePoolConfig<T> {
  name: string;
  minSize: number;
  maxSize: number;
  acquireTimeout: number;
  idleTimeout: number;
  maxUseCount?: number;
  maxErrors?: number;
  factory: () => Promise<T>;
  destroyer?: (resource: T) => Promise<void>;
  validator?: (resource: T) => Promise<boolean>;
}

export class ResourcePool<T> {
  private config: ResourcePoolConfig<T>;
  private resources: Map<string, PooledResource<T>> = new Map();
  private waitingQueue: Array<{
    resolve: (resource: PooledResource<T>) => void;
    reject: (error: Error) => void;
    timeout: NodeJS.Timeout;
  }> = [];
  private maintenanceInterval?: NodeJS.Timeout;
  private disposed = false;
  
  constructor(config: ResourcePoolConfig<T>) {
    this.config = config;
    this.initialize();
  }
  
  /**
   * Initializes the pool with minimum resources
   */
  private async initialize(): Promise<void> {
    logger.info(`Initializing resource pool: ${this.config.name}`);
    
    // Create minimum resources
    const promises = [];
    for (let i = 0; i < this.config.minSize; i++) {
      promises.push(this.createResource());
    }
    
    await Promise.allSettled(promises);
    
    // Start maintenance routine
    this.startMaintenance();
  }
  
  /**
   * Acquires a resource from the pool
   */
  async acquire(): Promise<PooledResource<T>> {
    if (this.disposed) {
      throw new Error(`Resource pool ${this.config.name} has been disposed`);
    }
    
    return performanceMonitor.measureOperation(
      `resource_pool_acquire_${this.config.name}`,
      async () => {
        // Try to find an available resource
        const available = this.findAvailableResource();
        if (available) {
          return this.checkoutResource(available);
        }
        
        // Try to create a new resource if under max size
        if (this.resources.size < this.config.maxSize) {
          try {
            const newResource = await this.createResource();
            if (newResource) {
              return this.checkoutResource(newResource);
            }
          } catch (error) {
            logger.warn(`Failed to create new resource: ${error}`);
          }
        }
        
        // Wait for a resource to become available
        return this.waitForResource();
      }
    );
  }
  
  /**
   * Releases a resource back to the pool
   */
  async release(pooledResource: PooledResource<T>): Promise<void> {
    if (!this.resources.has(pooledResource.id)) {
      logger.warn(`Attempting to release unknown resource: ${pooledResource.id}`);
      return;
    }
    
    pooledResource.inUse = false;
    pooledResource.lastUsed = Date.now();
    
    // Check if resource should be destroyed
    if (this.shouldDestroyResource(pooledResource)) {
      await this.destroyResource(pooledResource);
      return;
    }
    
    // Notify waiting consumers
    if (this.waitingQueue.length > 0) {
      const waiter = this.waitingQueue.shift()!;
      clearTimeout(waiter.timeout);
      waiter.resolve(this.checkoutResource(pooledResource));
    }
    
    logger.debug(`Released resource ${pooledResource.id} back to pool`);
  }
  
  /**
   * Reports an error for a resource
   */
  reportError(pooledResource: PooledResource<T>): void {
    pooledResource.errors++;
    logger.warn(
      `Resource ${pooledResource.id} reported error (total: ${pooledResource.errors})`
    );
  }
  
  /**
   * Disposes of all resources in the pool
   */
  async dispose(): Promise<void> {
    if (this.disposed) return;
    
    logger.info(`Disposing resource pool: ${this.config.name}`);
    this.disposed = true;
    
    // Clear maintenance interval
    if (this.maintenanceInterval) {
      clearInterval(this.maintenanceInterval);
    }
    
    // Reject all waiting consumers
    this.waitingQueue.forEach(waiter => {
      clearTimeout(waiter.timeout);
      waiter.reject(new Error('Resource pool disposed'));
    });
    this.waitingQueue = [];
    
    // Destroy all resources
    const destroyPromises = Array.from(this.resources.values()).map(resource =>
      this.destroyResource(resource).catch(error =>
        logger.error(`Error destroying resource ${resource.id}:`, error)
      )
    );
    
    await Promise.allSettled(destroyPromises);
    this.resources.clear();
  }
  
  /**
   * Gets current pool statistics
   */
  getStats(): {
    total: number;
    available: number;
    inUse: number;
    waiting: number;
    errors: number;
  } {
    const resources = Array.from(this.resources.values());
    
    return {
      total: resources.length,
      available: resources.filter(r => !r.inUse).length,
      inUse: resources.filter(r => r.inUse).length,
      waiting: this.waitingQueue.length,
      errors: resources.reduce((sum, r) => sum + r.errors, 0)
    };
  }
  
  /**
   * Creates a new resource
   */
  private async createResource(): Promise<PooledResource<T> | null> {
    try {
      const resource = await this.config.factory();
      const pooledResource: PooledResource<T> = {
        resource,
        id: `${this.config.name}_${Date.now()}_${Math.random()}`,
        inUse: false,
        lastUsed: Date.now(),
        useCount: 0,
        errors: 0
      };
      
      this.resources.set(pooledResource.id, pooledResource);
      logger.debug(`Created new resource: ${pooledResource.id}`);
      
      return pooledResource;
    } catch (error) {
      logger.error(`Failed to create resource:`, error);
      return null;
    }
  }
  
  /**
   * Destroys a resource
   */
  private async destroyResource(pooledResource: PooledResource<T>): Promise<void> {
    this.resources.delete(pooledResource.id);
    
    if (this.config.destroyer) {
      try {
        await this.config.destroyer(pooledResource.resource);
      } catch (error) {
        logger.error(`Error destroying resource ${pooledResource.id}:`, error);
      }
    }
    
    logger.debug(`Destroyed resource: ${pooledResource.id}`);
  }
  
  /**
   * Finds an available resource
   */
  private findAvailableResource(): PooledResource<T> | null {
    for (const resource of this.resources.values()) {
      if (!resource.inUse && !this.shouldDestroyResource(resource)) {
        return resource;
      }
    }
    return null;
  }
  
  /**
   * Checks out a resource for use
   */
  private checkoutResource(pooledResource: PooledResource<T>): PooledResource<T> {
    pooledResource.inUse = true;
    pooledResource.useCount++;
    return pooledResource;
  }
  
  /**
   * Waits for a resource to become available
   */
  private waitForResource(): Promise<PooledResource<T>> {
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        const index = this.waitingQueue.findIndex(w => w.reject === reject);
        if (index !== -1) {
          this.waitingQueue.splice(index, 1);
        }
        reject(new Error(`Acquire timeout after ${this.config.acquireTimeout}ms`));
      }, this.config.acquireTimeout);
      
      this.waitingQueue.push({ resolve, reject, timeout });
    });
  }
  
  /**
   * Determines if a resource should be destroyed
   */
  private shouldDestroyResource(pooledResource: PooledResource<T>): boolean {
    // Check max use count
    if (
      this.config.maxUseCount &&
      pooledResource.useCount >= this.config.maxUseCount
    ) {
      return true;
    }
    
    // Check max errors
    if (
      this.config.maxErrors &&
      pooledResource.errors >= this.config.maxErrors
    ) {
      return true;
    }
    
    // Check if pool is over minimum size and resource is idle
    if (
      this.resources.size > this.config.minSize &&
      Date.now() - pooledResource.lastUsed > this.config.idleTimeout
    ) {
      return true;
    }
    
    return false;
  }
  
  /**
   * Starts the maintenance routine
   */
  private startMaintenance(): void {
    this.maintenanceInterval = setInterval(async () => {
      await this.performMaintenance();
    }, 30000); // Run every 30 seconds
  }
  
  /**
   * Performs maintenance tasks
   */
  private async performMaintenance(): Promise<void> {
    if (this.disposed) return;
    
    logger.debug(`Performing maintenance for pool: ${this.config.name}`);
    
    // Remove idle resources
    const toDestroy: PooledResource<T>[] = [];
    for (const resource of this.resources.values()) {
      if (!resource.inUse && this.shouldDestroyResource(resource)) {
        toDestroy.push(resource);
      }
    }
    
    for (const resource of toDestroy) {
      await this.destroyResource(resource);
    }
    
    // Validate existing resources
    if (this.config.validator) {
      const toValidate = Array.from(this.resources.values()).filter(r => !r.inUse);
      
      for (const resource of toValidate) {
        try {
          const isValid = await this.config.validator(resource.resource);
          if (!isValid) {
            logger.warn(`Resource ${resource.id} failed validation`);
            await this.destroyResource(resource);
          }
        } catch (error) {
          logger.error(`Error validating resource ${resource.id}:`, error);
          await this.destroyResource(resource);
        }
      }
    }
    
    // Ensure minimum resources
    while (this.resources.size < this.config.minSize && !this.disposed) {
      await this.createResource();
    }
    
    // Log stats
    const stats = this.getStats();
    logger.debug(`Pool stats: ${JSON.stringify(stats)}`);
  }
}

/**
 * Creates a simple resource pool for functions
 */
export function createFunctionPool<T extends (...args: any[]) => any>(
  fn: T,
  concurrency: number = 5
): (...args: Parameters<T>) => Promise<ReturnType<T>> {
  const semaphore = new ResourcePool({
    name: 'function_pool',
    minSize: 0,
    maxSize: concurrency,
    acquireTimeout: 60000,
    idleTimeout: 1000,
    factory: async () => ({ execute: fn })
  });
  
  return async (...args: Parameters<T>): Promise<ReturnType<T>> => {
    const resource = await semaphore.acquire();
    try {
      return await resource.resource.execute(...args);
    } finally {
      await semaphore.release(resource);
    }
  };
}