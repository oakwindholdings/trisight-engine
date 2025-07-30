// src/reportGeneration/utils/parallelOrchestrator.ts
// Parallel data fetching orchestrator for optimized report generation
// Context: Manages concurrent operations with rate limiting and dependency resolution

import { performanceMonitor } from './performanceMonitor';
import { logger } from '../../utils/logger';

export interface Task<T> {
  id: string;
  execute: () => Promise<T>;
  dependencies?: string[];
  priority?: number;
  retryCount?: number;
  timeout?: number;
}

export interface TaskResult<T> {
  id: string;
  success: boolean;
  data?: T;
  error?: Error;
  duration: number;
  retries: number;
}

export interface OrchestratorConfig {
  maxConcurrency: number;
  defaultTimeout: number;
  maxRetries: number;
  retryDelay: number;
  rateLimitPerSecond?: number;
}

export class ParallelOrchestrator {
  private config: OrchestratorConfig;
  private runningTasks = new Map<string, Promise<any>>();
  private completedTasks = new Map<string, TaskResult<any>>();
  private taskQueue: Task<any>[] = [];
  private rateLimitTokens: number;
  private lastTokenRefill: number;
  
  constructor(config: Partial<OrchestratorConfig> = {}) {
    this.config = {
      maxConcurrency: config.maxConcurrency || 5,
      defaultTimeout: config.defaultTimeout || 30000,
      maxRetries: config.maxRetries || 3,
      retryDelay: config.retryDelay || 1000,
      rateLimitPerSecond: config.rateLimitPerSecond
    };
    
    this.rateLimitTokens = this.config.rateLimitPerSecond || Infinity;
    this.lastTokenRefill = Date.now();
  }
  
  /**
   * Executes multiple tasks with dependency resolution and concurrency control
   */
  async executeTasks<T>(tasks: Task<T>[]): Promise<Map<string, TaskResult<T>>> {
    logger.info(`Starting parallel execution of ${tasks.length} tasks`);
    
    // Reset state
    this.runningTasks.clear();
    this.completedTasks.clear();
    this.taskQueue = [...tasks].sort((a, b) => 
      (b.priority || 0) - (a.priority || 0)
    );
    
    // Start execution
    const startTime = performance.now();
    await this.processQueue();
    
    const totalDuration = performance.now() - startTime;
    logger.info(
      `Completed ${this.completedTasks.size} tasks in ${totalDuration.toFixed(2)}ms`
    );
    
    return new Map(this.completedTasks);
  }
  
  /**
   * Processes the task queue with concurrency control
   */
  private async processQueue(): Promise<void> {
    while (this.taskQueue.length > 0 || this.runningTasks.size > 0) {
      // Refill rate limit tokens
      this.refillRateLimitTokens();
      
      // Start new tasks if we have capacity
      while (
        this.taskQueue.length > 0 &&
        this.runningTasks.size < this.config.maxConcurrency &&
        this.rateLimitTokens > 0
      ) {
        const nextTask = this.findNextExecutableTask();
        if (!nextTask) break;
        
        this.startTask(nextTask);
      }
      
      // Wait for at least one task to complete if we're at capacity
      if (this.runningTasks.size > 0) {
        await Promise.race(this.runningTasks.values());
      }
      
      // Small delay to prevent tight loops
      await new Promise(resolve => setTimeout(resolve, 10));
    }
  }
  
  /**
   * Finds the next task that can be executed (dependencies satisfied)
   */
  private findNextExecutableTask(): Task<any> | null {
    for (let i = 0; i < this.taskQueue.length; i++) {
      const task = this.taskQueue[i];
      
      if (this.areDependenciesSatisfied(task)) {
        this.taskQueue.splice(i, 1);
        return task;
      }
    }
    
    return null;
  }
  
  /**
   * Checks if all dependencies of a task are satisfied
   */
  private areDependenciesSatisfied(task: Task<any>): boolean {
    if (!task.dependencies || task.dependencies.length === 0) {
      return true;
    }
    
    return task.dependencies.every(depId => {
      const result = this.completedTasks.get(depId);
      return result && result.success;
    });
  }
  
  /**
   * Starts executing a task with monitoring and error handling
   */
  private async startTask(task: Task<any>): Promise<void> {
    logger.debug(`Starting task: ${task.id}`);
    this.rateLimitTokens--;
    
    const taskPromise = this.executeTaskWithRetry(task);
    this.runningTasks.set(task.id, taskPromise);
    
    try {
      await taskPromise;
    } finally {
      this.runningTasks.delete(task.id);
    }
  }
  
  /**
   * Executes a task with retry logic
   */
  private async executeTaskWithRetry(task: Task<any>): Promise<void> {
    let lastError: Error | undefined;
    let retries = 0;
    const maxRetries = task.retryCount ?? this.config.maxRetries;
    
    while (retries <= maxRetries) {
      try {
        const result = await this.executeTaskOnce(task);
        
        this.completedTasks.set(task.id, {
          id: task.id,
          success: true,
          data: result,
          duration: 0, // Will be set by performanceMonitor
          retries
        });
        
        return;
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        logger.warn(
          `Task ${task.id} failed (attempt ${retries + 1}/${maxRetries + 1}): ${lastError.message}`
        );
        
        if (retries < maxRetries) {
          await new Promise(resolve => 
            setTimeout(resolve, this.config.retryDelay * Math.pow(2, retries))
          );
          retries++;
        } else {
          break;
        }
      }
    }
    
    // Task failed after all retries
    this.completedTasks.set(task.id, {
      id: task.id,
      success: false,
      error: lastError,
      duration: 0,
      retries
    });
  }
  
  /**
   * Executes a single task with timeout
   */
  private async executeTaskOnce(task: Task<any>): Promise<any> {
    const timeout = task.timeout || this.config.defaultTimeout;
    
    return performanceMonitor.measureOperation(
      `task_${task.id}`,
      async () => {
        const timeoutPromise = new Promise((_, reject) => {
          setTimeout(() => reject(new Error(`Task ${task.id} timed out`)), timeout);
        });
        
        return Promise.race([
          task.execute(),
          timeoutPromise
        ]);
      }
    );
  }
  
  /**
   * Refills rate limit tokens based on elapsed time
   */
  private refillRateLimitTokens(): void {
    if (!this.config.rateLimitPerSecond) return;
    
    const now = Date.now();
    const elapsed = (now - this.lastTokenRefill) / 1000;
    const tokensToAdd = elapsed * this.config.rateLimitPerSecond;
    
    this.rateLimitTokens = Math.min(
      this.config.rateLimitPerSecond,
      this.rateLimitTokens + tokensToAdd
    );
    
    this.lastTokenRefill = now;
  }
  
  /**
   * Creates a task from a simple async function
   */
  static createTask<T>(
    id: string,
    execute: () => Promise<T>,
    options?: Partial<Task<T>>
  ): Task<T> {
    return {
      id,
      execute,
      ...options
    };
  }
  
  /**
   * Batches multiple operations into parallel tasks
   */
  static batchOperations<T, R>(
    items: T[],
    operation: (item: T) => Promise<R>,
    batchSize: number = 5
  ): Task<R[]>[] {
    const batches: Task<R[]>[] = [];
    
    for (let i = 0; i < items.length; i += batchSize) {
      const batch = items.slice(i, i + batchSize);
      const batchId = `batch_${Math.floor(i / batchSize)}`;
      
      batches.push({
        id: batchId,
        execute: async () => {
          return Promise.all(batch.map(item => operation(item)));
        }
      });
    }
    
    return batches;
  }
}

/**
 * Helper function to create a dependency graph from tasks
 */
export function createDependencyGraph(tasks: Task<any>[]): Map<string, Set<string>> {
  const graph = new Map<string, Set<string>>();
  
  tasks.forEach(task => {
    if (!graph.has(task.id)) {
      graph.set(task.id, new Set());
    }
    
    if (task.dependencies) {
      task.dependencies.forEach(dep => {
        if (!graph.has(dep)) {
          graph.set(dep, new Set());
        }
        graph.get(dep)!.add(task.id);
      });
    }
  });
  
  return graph;
}

/**
 * Validates that task dependencies form a valid DAG (no cycles)
 */
export function validateTaskDependencies(tasks: Task<any>[]): boolean {
  const graph = createDependencyGraph(tasks);
  const visited = new Set<string>();
  const recursionStack = new Set<string>();
  
  function hasCycle(taskId: string): boolean {
    visited.add(taskId);
    recursionStack.add(taskId);
    
    const dependents = graph.get(taskId) || new Set();
    for (const dependent of dependents) {
      if (!visited.has(dependent)) {
        if (hasCycle(dependent)) return true;
      } else if (recursionStack.has(dependent)) {
        return true;
      }
    }
    
    recursionStack.delete(taskId);
    return false;
  }
  
  for (const task of tasks) {
    if (!visited.has(task.id)) {
      if (hasCycle(task.id)) {
        logger.error(`Circular dependency detected involving task: ${task.id}`);
        return false;
      }
    }
  }
  
  return true;
}