// src/hooks/__tests__/useAutomatedReportGeneration.test.ts
// Unit tests for useAutomatedReportGeneration hook
// Context: Tests automated report generation scheduling and management

import { renderHook, act } from '@testing-library/react';
import { useAutomatedReportGeneration } from '../useAutomatedReportGeneration';
import { generateReport } from '../../services/reportApiService';
import { getStorageService } from '../../services/reportStorageService';
import { logDebug, logError } from '../../utils/logger';

// Mock dependencies
jest.mock('../../services/reportApiService', () => ({
  generateReport: jest.fn()
}));

jest.mock('../../services/reportStorageService', () => ({
  getStorageService: jest.fn(() => ({
    saveSchedule: jest.fn(),
    getSchedules: jest.fn(),
    deleteSchedule: jest.fn()
  }))
}));

jest.mock('../../utils/logger', () => ({
  logDebug: jest.fn(),
  logError: jest.fn()
}));

// Mock timers
jest.useFakeTimers();

describe('useAutomatedReportGeneration Hook', () => {
  const mockStorageService = {
    saveSchedule: jest.fn(),
    getSchedules: jest.fn(),
    deleteSchedule: jest.fn()
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (getStorageService as jest.Mock).mockReturnValue(mockStorageService);
    mockStorageService.getSchedules.mockResolvedValue([]);
  });

  afterEach(() => {
    jest.clearAllTimers();
  });

  describe('Initial State', () => {
    it('should return initial state', async () => {
      const { result } = renderHook(() => useAutomatedReportGeneration());

      // Wait for initial load
      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0));
      });

      expect(result.current.schedules).toEqual([]);
      expect(result.current.activeJobs).toEqual([]);
      expect(result.current.isProcessing).toBe(false);
      expect(typeof result.current.createSchedule).toBe('function');
      expect(typeof result.current.updateSchedule).toBe('function');
      expect(typeof result.current.deleteSchedule).toBe('function');
      expect(typeof result.current.runScheduleNow).toBe('function');
      expect(typeof result.current.pauseSchedule).toBe('function');
      expect(typeof result.current.resumeSchedule).toBe('function');
    });

    it('should load existing schedules on mount', async () => {
      const mockSchedules = [
        {
          id: 'schedule-1',
          name: 'Daily AAPL Report',
          ticker: 'AAPL',
          template: 'equity-research',
          frequency: 'daily',
          time: '09:00',
          enabled: true,
          lastRun: null,
          nextRun: new Date().toISOString()
        }
      ];

      mockStorageService.getSchedules.mockResolvedValueOnce(mockSchedules);

      const { result } = renderHook(() => useAutomatedReportGeneration());

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0));
      });

      expect(result.current.schedules).toEqual(mockSchedules);
      expect(mockStorageService.getSchedules).toHaveBeenCalled();
    });
  });

  describe('Schedule Creation', () => {
    it('should create a new schedule', async () => {
      const { result } = renderHook(() => useAutomatedReportGeneration());

      const newSchedule = {
        name: 'Weekly NVDA Report',
        ticker: 'NVDA',
        template: 'technical-analysis',
        frequency: 'weekly' as const,
        time: '14:00',
        dayOfWeek: 1, // Monday
        enabled: true
      };

      await act(async () => {
        await result.current.createSchedule(newSchedule);
      });

      expect(mockStorageService.saveSchedule).toHaveBeenCalledWith(
        expect.objectContaining({
          ...newSchedule,
          id: expect.stringContaining('schedule-'),
          createdAt: expect.any(String),
          lastRun: null,
          nextRun: expect.any(String)
        })
      );

      expect(result.current.schedules).toHaveLength(1);
      expect(result.current.schedules[0]).toMatchObject(newSchedule);
    });

    it('should validate schedule configuration', async () => {
      const { result } = renderHook(() => useAutomatedReportGeneration());

      const invalidSchedule = {
        name: '',
        ticker: 'AAPL',
        template: 'equity-research',
        frequency: 'daily' as const,
        time: '25:00', // Invalid time
        enabled: true
      };

      await act(async () => {
        try {
          await result.current.createSchedule(invalidSchedule);
        } catch (error) {
          expect(error).toEqual(new Error('Invalid schedule configuration'));
        }
      });

      expect(mockStorageService.saveSchedule).not.toHaveBeenCalled();
    });

    it('should calculate next run time correctly', async () => {
      const { result } = renderHook(() => useAutomatedReportGeneration());

      const schedule = {
        name: 'Daily Report',
        ticker: 'AAPL',
        template: 'equity-research',
        frequency: 'daily' as const,
        time: '09:00',
        enabled: true
      };

      await act(async () => {
        await result.current.createSchedule(schedule);
      });

      const createdSchedule = result.current.schedules[0];
      const nextRun = new Date(createdSchedule.nextRun);
      const [hours, minutes] = schedule.time.split(':').map(Number);

      expect(nextRun.getHours()).toBe(hours);
      expect(nextRun.getMinutes()).toBe(minutes);
    });
  });

  describe('Schedule Updates', () => {
    it('should update an existing schedule', async () => {
      const existingSchedule = {
        id: 'schedule-1',
        name: 'Daily AAPL Report',
        ticker: 'AAPL',
        template: 'equity-research',
        frequency: 'daily' as const,
        time: '09:00',
        enabled: true,
        createdAt: new Date().toISOString(),
        lastRun: null,
        nextRun: new Date().toISOString()
      };

      mockStorageService.getSchedules.mockResolvedValueOnce([existingSchedule]);

      const { result } = renderHook(() => useAutomatedReportGeneration());

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0));
      });

      const updates = {
        name: 'Updated Daily Report',
        time: '10:00'
      };

      await act(async () => {
        await result.current.updateSchedule('schedule-1', updates);
      });

      expect(mockStorageService.saveSchedule).toHaveBeenCalledWith(
        expect.objectContaining({
          ...existingSchedule,
          ...updates,
          nextRun: expect.any(String)
        })
      );

      expect(result.current.schedules[0].name).toBe('Updated Daily Report');
      expect(result.current.schedules[0].time).toBe('10:00');
    });

    it('should recalculate next run when schedule is updated', async () => {
      const existingSchedule = {
        id: 'schedule-1',
        name: 'Daily Report',
        ticker: 'AAPL',
        template: 'equity-research',
        frequency: 'daily' as const,
        time: '09:00',
        enabled: true,
        createdAt: new Date().toISOString(),
        lastRun: null,
        nextRun: new Date().toISOString()
      };

      mockStorageService.getSchedules.mockResolvedValueOnce([existingSchedule]);

      const { result } = renderHook(() => useAutomatedReportGeneration());

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0));
      });

      await act(async () => {
        await result.current.updateSchedule('schedule-1', {
          time: '15:00'
        });
      });

      const updatedSchedule = result.current.schedules[0];
      const nextRun = new Date(updatedSchedule.nextRun);
      expect(nextRun.getHours()).toBe(15);
    });
  });

  describe('Schedule Deletion', () => {
    it('should delete a schedule', async () => {
      const schedule = {
        id: 'schedule-1',
        name: 'Test Schedule',
        ticker: 'AAPL',
        template: 'equity-research',
        frequency: 'daily' as const,
        time: '09:00',
        enabled: true,
        createdAt: new Date().toISOString(),
        lastRun: null,
        nextRun: new Date().toISOString()
      };

      mockStorageService.getSchedules.mockResolvedValueOnce([schedule]);

      const { result } = renderHook(() => useAutomatedReportGeneration());

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0));
      });

      await act(async () => {
        await result.current.deleteSchedule('schedule-1');
      });

      expect(mockStorageService.deleteSchedule).toHaveBeenCalledWith('schedule-1');
      expect(result.current.schedules).toHaveLength(0);
    });
  });

  describe('Manual Execution', () => {
    it('should run a schedule immediately', async () => {
      const schedule = {
        id: 'schedule-1',
        name: 'Test Schedule',
        ticker: 'AAPL',
        template: 'equity-research',
        frequency: 'daily' as const,
        time: '09:00',
        enabled: true,
        createdAt: new Date().toISOString(),
        lastRun: null,
        nextRun: new Date().toISOString()
      };

      mockStorageService.getSchedules.mockResolvedValueOnce([schedule]);
      (generateReport as jest.Mock).mockResolvedValueOnce({
        success: true,
        reportId: 'report-123',
        data: { slides: [] }
      });

      const { result } = renderHook(() => useAutomatedReportGeneration());

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0));
      });

      await act(async () => {
        await result.current.runScheduleNow('schedule-1');
      });

      expect(generateReport).toHaveBeenCalledWith(
        expect.objectContaining({
          ticker: 'AAPL',
          template: 'equity-research',
          title: expect.stringContaining('Test Schedule'),
          format: 'pdf',
          outputFormat: 'pdf'
        }),
        expect.any(Function)
      );

      expect(result.current.activeJobs).toHaveLength(1);
      expect(result.current.activeJobs[0]).toMatchObject({
        scheduleId: 'schedule-1',
        status: 'running',
        startTime: expect.any(String)
      });
    });

    it('should handle generation errors', async () => {
      const schedule = {
        id: 'schedule-1',
        name: 'Test Schedule',
        ticker: 'AAPL',
        template: 'equity-research',
        frequency: 'daily' as const,
        time: '09:00',
        enabled: true,
        createdAt: new Date().toISOString(),
        lastRun: null,
        nextRun: new Date().toISOString()
      };

      mockStorageService.getSchedules.mockResolvedValueOnce([schedule]);
      (generateReport as jest.Mock).mockRejectedValueOnce(new Error('Generation failed'));

      const { result } = renderHook(() => useAutomatedReportGeneration());

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0));
      });

      await act(async () => {
        try {
          await result.current.runScheduleNow('schedule-1');
        } catch (error) {
          expect(error).toEqual(new Error('Generation failed'));
        }
      });

      expect(logError).toHaveBeenCalledWith(
        'useAutomatedReportGeneration',
        'Failed to run schedule:',
        expect.any(Error)
      );
    });
  });

  describe('Schedule Pause/Resume', () => {
    it('should pause a schedule', async () => {
      const schedule = {
        id: 'schedule-1',
        name: 'Test Schedule',
        ticker: 'AAPL',
        template: 'equity-research',
        frequency: 'daily' as const,
        time: '09:00',
        enabled: true,
        createdAt: new Date().toISOString(),
        lastRun: null,
        nextRun: new Date().toISOString()
      };

      mockStorageService.getSchedules.mockResolvedValueOnce([schedule]);

      const { result } = renderHook(() => useAutomatedReportGeneration());

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0));
      });

      await act(async () => {
        await result.current.pauseSchedule('schedule-1');
      });

      expect(mockStorageService.saveSchedule).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 'schedule-1',
          enabled: false
        })
      );

      expect(result.current.schedules[0].enabled).toBe(false);
    });

    it('should resume a schedule', async () => {
      const schedule = {
        id: 'schedule-1',
        name: 'Test Schedule',
        ticker: 'AAPL',
        template: 'equity-research',
        frequency: 'daily' as const,
        time: '09:00',
        enabled: false,
        createdAt: new Date().toISOString(),
        lastRun: null,
        nextRun: new Date().toISOString()
      };

      mockStorageService.getSchedules.mockResolvedValueOnce([schedule]);

      const { result } = renderHook(() => useAutomatedReportGeneration());

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0));
      });

      await act(async () => {
        await result.current.resumeSchedule('schedule-1');
      });

      expect(mockStorageService.saveSchedule).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 'schedule-1',
          enabled: true,
          nextRun: expect.any(String)
        })
      );

      expect(result.current.schedules[0].enabled).toBe(true);
    });
  });

  describe('Automated Execution', () => {
    it('should execute enabled schedules at scheduled time', async () => {
      const now = new Date();
      const scheduledTime = new Date(now);
      scheduledTime.setMinutes(scheduledTime.getMinutes() + 1);

      const schedule = {
        id: 'schedule-1',
        name: 'Test Schedule',
        ticker: 'AAPL',
        template: 'equity-research',
        frequency: 'daily' as const,
        time: `${scheduledTime.getHours().toString().padStart(2, '0')}:${scheduledTime.getMinutes().toString().padStart(2, '0')}`,
        enabled: true,
        createdAt: now.toISOString(),
        lastRun: null,
        nextRun: scheduledTime.toISOString()
      };

      mockStorageService.getSchedules.mockResolvedValueOnce([schedule]);
      (generateReport as jest.Mock).mockResolvedValueOnce({
        success: true,
        reportId: 'report-123',
        data: { slides: [] }
      });

      renderHook(() => useAutomatedReportGeneration());

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0));
      });

      // Advance time to scheduled execution
      act(() => {
        jest.advanceTimersByTime(60000); // 1 minute
      });

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0));
      });

      expect(generateReport).toHaveBeenCalled();
    });

    it('should not execute disabled schedules', async () => {
      const now = new Date();
      const scheduledTime = new Date(now);
      scheduledTime.setSeconds(scheduledTime.getSeconds() + 5);

      const schedule = {
        id: 'schedule-1',
        name: 'Test Schedule',
        ticker: 'AAPL',
        template: 'equity-research',
        frequency: 'daily' as const,
        time: `${scheduledTime.getHours()}:${scheduledTime.getMinutes()}`,
        enabled: false,
        createdAt: now.toISOString(),
        lastRun: null,
        nextRun: scheduledTime.toISOString()
      };

      mockStorageService.getSchedules.mockResolvedValueOnce([schedule]);

      renderHook(() => useAutomatedReportGeneration());

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0));
      });

      act(() => {
        jest.advanceTimersByTime(10000); // 10 seconds
      });

      expect(generateReport).not.toHaveBeenCalled();
    });
  });

  describe('Frequency Calculations', () => {
    it('should calculate weekly schedules correctly', async () => {
      const { result } = renderHook(() => useAutomatedReportGeneration());

      const schedule = {
        name: 'Weekly Report',
        ticker: 'AAPL',
        template: 'equity-research',
        frequency: 'weekly' as const,
        time: '09:00',
        dayOfWeek: 1, // Monday
        enabled: true
      };

      await act(async () => {
        await result.current.createSchedule(schedule);
      });

      const createdSchedule = result.current.schedules[0];
      const nextRun = new Date(createdSchedule.nextRun);

      // Should be next Monday at 9:00
      expect(nextRun.getDay()).toBe(1);
      expect(nextRun.getHours()).toBe(9);
      expect(nextRun.getMinutes()).toBe(0);
    });

    it('should calculate monthly schedules correctly', async () => {
      const { result } = renderHook(() => useAutomatedReportGeneration());

      const schedule = {
        name: 'Monthly Report',
        ticker: 'AAPL',
        template: 'equity-research',
        frequency: 'monthly' as const,
        time: '09:00',
        dayOfMonth: 15,
        enabled: true
      };

      await act(async () => {
        await result.current.createSchedule(schedule);
      });

      const createdSchedule = result.current.schedules[0];
      const nextRun = new Date(createdSchedule.nextRun);

      // Should be on the 15th at 9:00
      expect(nextRun.getDate()).toBe(15);
      expect(nextRun.getHours()).toBe(9);
      expect(nextRun.getMinutes()).toBe(0);
    });
  });

  describe('Concurrent Job Management', () => {
    it('should track multiple active jobs', async () => {
      const schedules = [
        {
          id: 'schedule-1',
          name: 'Schedule 1',
          ticker: 'AAPL',
          template: 'equity-research',
          frequency: 'daily' as const,
          time: '09:00',
          enabled: true,
          createdAt: new Date().toISOString(),
          lastRun: null,
          nextRun: new Date().toISOString()
        },
        {
          id: 'schedule-2',
          name: 'Schedule 2',
          ticker: 'NVDA',
          template: 'technical-analysis',
          frequency: 'daily' as const,
          time: '09:00',
          enabled: true,
          createdAt: new Date().toISOString(),
          lastRun: null,
          nextRun: new Date().toISOString()
        }
      ];

      mockStorageService.getSchedules.mockResolvedValueOnce(schedules);
      (generateReport as jest.Mock).mockImplementation(() => 
        new Promise(resolve => setTimeout(() => resolve({
          success: true,
          reportId: 'test',
          data: { slides: [] }
        }), 100))
      );

      const { result } = renderHook(() => useAutomatedReportGeneration());

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0));
      });

      // Run both schedules
      act(() => {
        result.current.runScheduleNow('schedule-1');
        result.current.runScheduleNow('schedule-2');
      });

      expect(result.current.activeJobs).toHaveLength(2);
      expect(result.current.isProcessing).toBe(true);
    });
  });
});