// src/reportGeneration/utils/__tests__/progressTracker.test.ts
// Unit tests for ProgressTracker
// Context: Tests progress tracking functionality

import { ProgressTracker } from '../progressTracker';

describe('ProgressTracker', () => {
  let tracker: ProgressTracker;
  let onProgressCallback: jest.Mock;

  beforeEach(() => {
    onProgressCallback = jest.fn();
    tracker = new ProgressTracker(onProgressCallback);
  });

  describe('initialization', () => {
    it('should initialize with zero progress', () => {
      expect(tracker.getProgress()).toBe(0);
      expect(tracker.getStatus()).toBe('idle');
      expect(tracker.getCurrentStage()).toBeUndefined();
    });

    it('should call onProgress callback on initialization', () => {
      expect(onProgressCallback).toHaveBeenCalledWith({
        progress: 0,
        status: 'idle',
        stage: undefined,
        message: undefined
      });
    });
  });

  describe('updateProgress', () => {
    it('should update progress and status', () => {
      tracker.updateProgress(50, 'in_progress', 'Fetching data');

      expect(tracker.getProgress()).toBe(50);
      expect(tracker.getStatus()).toBe('in_progress');
      expect(onProgressCallback).toHaveBeenCalledWith({
        progress: 50,
        status: 'in_progress',
        stage: undefined,
        message: 'Fetching data'
      });
    });

    it('should clamp progress between 0 and 100', () => {
      tracker.updateProgress(-10);
      expect(tracker.getProgress()).toBe(0);

      tracker.updateProgress(150);
      expect(tracker.getProgress()).toBe(100);
    });

    it('should handle progress without status change', () => {
      tracker.updateProgress(25, 'in_progress');
      tracker.updateProgress(50);
      
      expect(tracker.getStatus()).toBe('in_progress');
      expect(tracker.getProgress()).toBe(50);
    });
  });

  describe('setStage', () => {
    it('should set current stage', () => {
      tracker.setStage('data_fetching');
      
      expect(tracker.getCurrentStage()).toBe('data_fetching');
      expect(onProgressCallback).toHaveBeenCalledWith({
        progress: 0,
        status: 'idle',
        stage: 'data_fetching',
        message: undefined
      });
    });

    it('should update stage with progress', () => {
      tracker.setStage('processing', 30);
      
      expect(tracker.getCurrentStage()).toBe('processing');
      expect(tracker.getProgress()).toBe(30);
    });
  });

  describe('complete', () => {
    it('should mark as completed with 100% progress', () => {
      tracker.updateProgress(75, 'in_progress');
      tracker.complete();

      expect(tracker.getProgress()).toBe(100);
      expect(tracker.getStatus()).toBe('completed');
      expect(onProgressCallback).toHaveBeenLastCalledWith({
        progress: 100,
        status: 'completed',
        stage: undefined,
        message: 'Report generation completed'
      });
    });

    it('should include custom completion message', () => {
      tracker.complete('Custom completion message');

      expect(onProgressCallback).toHaveBeenLastCalledWith({
        progress: 100,
        status: 'completed',
        stage: undefined,
        message: 'Custom completion message'
      });
    });
  });

  describe('error', () => {
    it('should mark as error status', () => {
      tracker.updateProgress(50, 'in_progress');
      tracker.error('Something went wrong');

      expect(tracker.getStatus()).toBe('error');
      expect(tracker.getProgress()).toBe(50); // Progress unchanged
      expect(onProgressCallback).toHaveBeenLastCalledWith({
        progress: 50,
        status: 'error',
        stage: undefined,
        message: 'Something went wrong'
      });
    });

    it('should handle error without message', () => {
      tracker.error();

      expect(tracker.getStatus()).toBe('error');
      expect(onProgressCallback).toHaveBeenLastCalledWith({
        progress: 0,
        status: 'error',
        stage: undefined,
        message: 'An error occurred'
      });
    });
  });

  describe('reset', () => {
    it('should reset all values to initial state', () => {
      tracker.updateProgress(75, 'in_progress');
      tracker.setStage('processing');
      tracker.reset();

      expect(tracker.getProgress()).toBe(0);
      expect(tracker.getStatus()).toBe('idle');
      expect(tracker.getCurrentStage()).toBeUndefined();
    });

    it('should call onProgress after reset', () => {
      tracker.updateProgress(50, 'in_progress');
      onProgressCallback.mockClear();
      
      tracker.reset();

      expect(onProgressCallback).toHaveBeenCalledWith({
        progress: 0,
        status: 'idle',
        stage: undefined,
        message: undefined
      });
    });
  });

  describe('getSnapshot', () => {
    it('should return current state snapshot', () => {
      tracker.updateProgress(45, 'in_progress', 'Processing data');
      tracker.setStage('analysis');

      const snapshot = tracker.getSnapshot();

      expect(snapshot).toEqual({
        progress: 45,
        status: 'in_progress',
        stage: 'analysis',
        message: 'Processing data'
      });
    });
  });

  describe('increment', () => {
    it('should increment progress by specified amount', () => {
      tracker.updateProgress(20);
      tracker.increment(15);

      expect(tracker.getProgress()).toBe(35);
    });

    it('should not exceed 100%', () => {
      tracker.updateProgress(90);
      tracker.increment(20);

      expect(tracker.getProgress()).toBe(100);
    });

    it('should increment with message', () => {
      tracker.increment(10, 'Incremental update');

      expect(onProgressCallback).toHaveBeenCalledWith({
        progress: 10,
        status: 'idle',
        stage: undefined,
        message: 'Incremental update'
      });
    });
  });

  describe('stage progress calculation', () => {
    it('should calculate progress based on stage weights', () => {
      const stageWeights = {
        fetching: 30,
        processing: 40,
        generating: 30
      };

      const trackerWithWeights = new ProgressTracker(onProgressCallback, stageWeights);

      // Complete first stage
      trackerWithWeights.setStage('fetching');
      trackerWithWeights.completeStage();
      expect(trackerWithWeights.getProgress()).toBe(30);

      // Complete second stage
      trackerWithWeights.setStage('processing');
      trackerWithWeights.completeStage();
      expect(trackerWithWeights.getProgress()).toBe(70);

      // Complete final stage
      trackerWithWeights.setStage('generating');
      trackerWithWeights.completeStage();
      expect(trackerWithWeights.getProgress()).toBe(100);
    });

    it('should handle partial stage completion', () => {
      const stageWeights = { stage1: 50, stage2: 50 };
      const trackerWithWeights = new ProgressTracker(onProgressCallback, stageWeights);

      trackerWithWeights.setStage('stage1');
      trackerWithWeights.updateStageProgress(0.5); // 50% of stage1

      expect(trackerWithWeights.getProgress()).toBe(25); // 50% of 50
    });
  });

  describe('concurrent updates', () => {
    it('should handle rapid updates', () => {
      for (let i = 0; i <= 100; i += 5) {
        tracker.updateProgress(i, 'in_progress');
      }

      expect(tracker.getProgress()).toBe(100);
      expect(onProgressCallback).toHaveBeenCalledTimes(22); // init + 21 updates
    });

    it('should maintain consistency during concurrent operations', () => {
      const updates = [
        () => tracker.updateProgress(20, 'in_progress'),
        () => tracker.setStage('processing'),
        () => tracker.increment(10),
        () => tracker.updateProgress(50),
        () => tracker.complete()
      ];

      updates.forEach(update => update());

      expect(tracker.getProgress()).toBe(100);
      expect(tracker.getStatus()).toBe('completed');
    });
  });

  describe('edge cases', () => {
    it('should handle missing callback gracefully', () => {
      const trackerNoCallback = new ProgressTracker();
      
      expect(() => {
        trackerNoCallback.updateProgress(50);
        trackerNoCallback.complete();
      }).not.toThrow();
    });

    it('should handle invalid status values', () => {
      tracker.updateProgress(50, 'invalid_status' as any);
      
      // Should default to in_progress for unknown status
      expect(tracker.getStatus()).toBe('in_progress');
    });

    it('should handle NaN progress values', () => {
      tracker.updateProgress(NaN);
      expect(tracker.getProgress()).toBe(0);

      tracker.updateProgress(50);
      tracker.increment(NaN);
      expect(tracker.getProgress()).toBe(50);
    });
  });
});