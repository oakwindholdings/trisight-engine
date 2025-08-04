// src/reportGeneration/utils/__tests__/cancellationManager.test.ts
// Unit tests for CancellationManager
// Context: Tests report generation cancellation functionality

import { CancellationManager } from '../cancellationManager';

describe('CancellationManager', () => {
  let manager: CancellationManager;

  beforeEach(() => {
    manager = new CancellationManager();
  });

  describe('initialization', () => {
    it('should initialize with not cancelled state', () => {
      expect(manager.isCancelled()).toBe(false);
    });

    it('should create cancellation token', () => {
      const token = manager.getToken();
      expect(token).toBeDefined();
      expect(token.isCancelled()).toBe(false);
    });
  });

  describe('cancel', () => {
    it('should set cancelled state', () => {
      manager.cancel();
      expect(manager.isCancelled()).toBe(true);
    });

    it('should propagate cancellation to token', () => {
      const token = manager.getToken();
      manager.cancel();
      
      expect(token.isCancelled()).toBe(true);
    });

    it('should call cancellation callbacks', () => {
      const callback1 = jest.fn();
      const callback2 = jest.fn();
      
      manager.onCancel(callback1);
      manager.onCancel(callback2);
      
      manager.cancel();
      
      expect(callback1).toHaveBeenCalledTimes(1);
      expect(callback2).toHaveBeenCalledTimes(1);
    });

    it('should only call callbacks once on multiple cancels', () => {
      const callback = jest.fn();
      manager.onCancel(callback);
      
      manager.cancel();
      manager.cancel();
      manager.cancel();
      
      expect(callback).toHaveBeenCalledTimes(1);
    });

    it('should call callback with cancellation reason', () => {
      const callback = jest.fn();
      manager.onCancel(callback);
      
      manager.cancel('User requested cancellation');
      
      expect(callback).toHaveBeenCalledWith('User requested cancellation');
    });
  });

  describe('reset', () => {
    it('should reset cancelled state', () => {
      manager.cancel();
      expect(manager.isCancelled()).toBe(true);
      
      manager.reset();
      expect(manager.isCancelled()).toBe(false);
    });

    it('should create new token after reset', () => {
      const token1 = manager.getToken();
      manager.cancel();
      
      manager.reset();
      const token2 = manager.getToken();
      
      expect(token1).not.toBe(token2);
      expect(token1.isCancelled()).toBe(true);
      expect(token2.isCancelled()).toBe(false);
    });

    it('should clear callbacks on reset', () => {
      const callback = jest.fn();
      manager.onCancel(callback);
      
      manager.reset();
      manager.cancel();
      
      expect(callback).not.toHaveBeenCalled();
    });
  });

  describe('throwIfCancelled', () => {
    it('should not throw when not cancelled', () => {
      expect(() => manager.throwIfCancelled()).not.toThrow();
    });

    it('should throw when cancelled', () => {
      manager.cancel();
      expect(() => manager.throwIfCancelled()).toThrow('Operation cancelled');
    });

    it('should throw with custom reason', () => {
      manager.cancel('Custom reason');
      expect(() => manager.throwIfCancelled()).toThrow('Operation cancelled: Custom reason');
    });
  });

  describe('checkCancellation', () => {
    it('should return promise that resolves when not cancelled', async () => {
      await expect(manager.checkCancellation()).resolves.toBeUndefined();
    });

    it('should return promise that rejects when cancelled', async () => {
      manager.cancel();
      await expect(manager.checkCancellation()).rejects.toThrow('Operation cancelled');
    });

    it('should check at intervals', async () => {
      const checkPromise = manager.checkCancellation(100);
      
      setTimeout(() => manager.cancel(), 50);
      
      await expect(checkPromise).rejects.toThrow('Operation cancelled');
    });
  });

  describe('withCancellation', () => {
    it('should execute function when not cancelled', async () => {
      const mockFn = jest.fn(async () => 'result');
      
      const result = await manager.withCancellation(mockFn);
      
      expect(mockFn).toHaveBeenCalled();
      expect(result).toBe('result');
    });

    it('should not execute function when already cancelled', async () => {
      const mockFn = jest.fn(async () => 'result');
      
      manager.cancel();
      
      await expect(manager.withCancellation(mockFn)).rejects.toThrow('Operation cancelled');
      expect(mockFn).not.toHaveBeenCalled();
    });

    it('should propagate function errors', async () => {
      const mockFn = jest.fn(async () => {
        throw new Error('Function error');
      });
      
      await expect(manager.withCancellation(mockFn)).rejects.toThrow('Function error');
    });

    it('should handle cancellation during execution', async () => {
      const mockFn = jest.fn(async () => {
        await new Promise(resolve => setTimeout(resolve, 100));
        manager.throwIfCancelled();
        return 'result';
      });
      
      const promise = manager.withCancellation(mockFn);
      
      setTimeout(() => manager.cancel(), 50);
      
      await expect(promise).rejects.toThrow('Operation cancelled');
    });
  });

  describe('createChildManager', () => {
    it('should create child manager', () => {
      const child = manager.createChildManager();
      
      expect(child).toBeDefined();
      expect(child.isCancelled()).toBe(false);
    });

    it('should propagate parent cancellation to child', () => {
      const child = manager.createChildManager();
      
      manager.cancel();
      
      expect(child.isCancelled()).toBe(true);
    });

    it('should not propagate child cancellation to parent', () => {
      const child = manager.createChildManager();
      
      child.cancel();
      
      expect(manager.isCancelled()).toBe(false);
      expect(child.isCancelled()).toBe(true);
    });

    it('should handle nested children', () => {
      const child1 = manager.createChildManager();
      const child2 = child1.createChildManager();
      
      manager.cancel();
      
      expect(child1.isCancelled()).toBe(true);
      expect(child2.isCancelled()).toBe(true);
    });
  });

  describe('timeout', () => {
    jest.useFakeTimers();

    it('should cancel after timeout', () => {
      manager.setTimeout(1000);
      
      expect(manager.isCancelled()).toBe(false);
      
      jest.advanceTimersByTime(1000);
      
      expect(manager.isCancelled()).toBe(true);
    });

    it('should clear timeout on manual cancel', () => {
      manager.setTimeout(1000);
      manager.cancel();
      
      jest.advanceTimersByTime(2000);
      
      // Should only be cancelled once
      const callback = jest.fn();
      manager.onCancel(callback);
      expect(callback).not.toHaveBeenCalled();
    });

    it('should clear timeout on reset', () => {
      manager.setTimeout(1000);
      manager.reset();
      
      jest.advanceTimersByTime(2000);
      
      expect(manager.isCancelled()).toBe(false);
    });

    jest.useRealTimers();
  });

  describe('CancellationToken', () => {
    it('should reflect manager state', () => {
      const token = manager.getToken();
      
      expect(token.isCancelled()).toBe(false);
      
      manager.cancel();
      
      expect(token.isCancelled()).toBe(true);
    });

    it('should handle callbacks', () => {
      const token = manager.getToken();
      const callback = jest.fn();
      
      token.onCancel(callback);
      
      manager.cancel('Token test');
      
      expect(callback).toHaveBeenCalledWith('Token test');
    });

    it('should throw if cancelled', () => {
      const token = manager.getToken();
      
      manager.cancel();
      
      expect(() => token.throwIfCancelled()).toThrow('Operation cancelled');
    });

    it('should handle immediate callback for already cancelled', () => {
      manager.cancel();
      
      const token = manager.getToken();
      const callback = jest.fn();
      
      token.onCancel(callback);
      
      expect(callback).toHaveBeenCalledTimes(1);
    });
  });

  describe('race conditions', () => {
    it('should handle concurrent cancellations', () => {
      const callbacks = Array(10).fill(null).map(() => jest.fn());
      
      callbacks.forEach(cb => manager.onCancel(cb));
      
      // Simulate concurrent cancellation attempts
      Promise.all([
        Promise.resolve().then(() => manager.cancel()),
        Promise.resolve().then(() => manager.cancel()),
        Promise.resolve().then(() => manager.cancel())
      ]);
      
      callbacks.forEach(cb => {
        expect(cb).toHaveBeenCalledTimes(1);
      });
    });

    it('should handle callback registration during cancellation', () => {
      const callback1 = jest.fn();
      const callback2 = jest.fn();
      
      manager.onCancel(() => {
        manager.onCancel(callback2);
      });
      
      manager.onCancel(callback1);
      manager.cancel();
      
      expect(callback1).toHaveBeenCalled();
      expect(callback2).toHaveBeenCalled();
    });
  });
});