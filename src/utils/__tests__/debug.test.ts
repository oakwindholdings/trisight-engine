// src/utils/__tests__/debug.test.ts
// Unit tests for debug utilities
// Context: Tests debugging and logging functions

import {
  logDebug,
  logError,
  logWarn,
  logInfo,
  logPerformance,
  createDebugContext,
  measurePerformance,
  formatDebugMessage,
  isDebugEnabled,
  setDebugLevel,
  getDebugLevel,
  clearDebugLogs,
  getDebugLogs,
  exportDebugLogs
} from '../debug';

// Mock console methods
const mockConsoleLog = jest.spyOn(console, 'log').mockImplementation();
const mockConsoleError = jest.spyOn(console, 'error').mockImplementation();
const mockConsoleWarn = jest.spyOn(console, 'warn').mockImplementation();
const mockConsoleInfo = jest.spyOn(console, 'info').mockImplementation();

// Mock performance.now
const mockPerformanceNow = jest.spyOn(performance, 'now');

describe('debug utilities', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    clearDebugLogs();
    setDebugLevel('info'); // Default level
  });

  afterAll(() => {
    mockConsoleLog.mockRestore();
    mockConsoleError.mockRestore();
    mockConsoleWarn.mockRestore();
    mockConsoleInfo.mockRestore();
    mockPerformanceNow.mockRestore();
  });

  describe('logging functions', () => {
    it('should log debug messages when debug level allows', () => {
      setDebugLevel('debug');
      logDebug('Test debug message', { data: 'test' });

      expect(mockConsoleLog).toHaveBeenCalledWith(
        expect.stringContaining('[DEBUG]'),
        'Test debug message',
        { data: 'test' }
      );
    });

    it('should not log debug messages when level is higher', () => {
      setDebugLevel('warn');
      logDebug('Test debug message');

      expect(mockConsoleLog).not.toHaveBeenCalled();
    });

    it('should log error messages', () => {
      logError('Test error', new Error('Test error'));

      expect(mockConsoleError).toHaveBeenCalledWith(
        expect.stringContaining('[ERROR]'),
        'Test error',
        expect.any(Error)
      );
    });

    it('should log warning messages', () => {
      logWarn('Test warning');

      expect(mockConsoleWarn).toHaveBeenCalledWith(
        expect.stringContaining('[WARN]'),
        'Test warning'
      );
    });

    it('should log info messages', () => {
      logInfo('Test info');

      expect(mockConsoleInfo).toHaveBeenCalledWith(
        expect.stringContaining('[INFO]'),
        'Test info'
      );
    });
  });

  describe('debug context', () => {
    it('should create debug context with metadata', () => {
      const context = createDebugContext('TestComponent', {
        userId: '123',
        action: 'click'
      });

      expect(context).toEqual({
        component: 'TestComponent',
        metadata: {
          userId: '123',
          action: 'click'
        },
        timestamp: expect.any(Number)
      });
    });

    it('should log with context', () => {
      setDebugLevel('debug');
      const context = createDebugContext('TestComponent');
      
      logDebug('Test with context', { context });

      expect(mockConsoleLog).toHaveBeenCalledWith(
        expect.stringContaining('[DEBUG]'),
        'Test with context',
        expect.objectContaining({
          context: expect.objectContaining({
            component: 'TestComponent'
          })
        })
      );
    });
  });

  describe('performance measurement', () => {
    it('should measure performance of sync function', () => {
      mockPerformanceNow
        .mockReturnValueOnce(1000)
        .mockReturnValueOnce(1500);

      const result = measurePerformance('testOperation', () => {
        return 'result';
      });

      expect(result).toBe('result');
      expect(mockConsoleLog).toHaveBeenCalledWith(
        expect.stringContaining('[PERF]'),
        expect.stringContaining('testOperation'),
        expect.stringContaining('500.00ms')
      );
    });

    it('should measure performance of async function', async () => {
      mockPerformanceNow
        .mockReturnValueOnce(1000)
        .mockReturnValueOnce(2000);

      const result = await measurePerformance('asyncOperation', async () => {
        await new Promise(resolve => setTimeout(resolve, 10));
        return 'async result';
      });

      expect(result).toBe('async result');
      expect(mockConsoleLog).toHaveBeenCalledWith(
        expect.stringContaining('[PERF]'),
        expect.stringContaining('asyncOperation'),
        expect.stringContaining('1000.00ms')
      );
    });

    it('should log performance metrics', () => {
      setDebugLevel('debug');
      logPerformance('renderChart', 123.45, {
        itemCount: 1000
      });

      expect(mockConsoleLog).toHaveBeenCalledWith(
        expect.stringContaining('[PERF]'),
        expect.stringContaining('renderChart'),
        expect.stringContaining('123.45ms'),
        expect.objectContaining({
          itemCount: 1000
        })
      );
    });
  });

  describe('debug configuration', () => {
    it('should check if debug is enabled', () => {
      setDebugLevel('debug');
      expect(isDebugEnabled()).toBe(true);

      setDebugLevel('error');
      expect(isDebugEnabled()).toBe(false);
    });

    it('should get and set debug level', () => {
      setDebugLevel('warn');
      expect(getDebugLevel()).toBe('warn');

      setDebugLevel('debug');
      expect(getDebugLevel()).toBe('debug');
    });

    it('should handle invalid debug level', () => {
      setDebugLevel('invalid' as any);
      expect(getDebugLevel()).toBe('info'); // Default
    });
  });

  describe('debug log management', () => {
    it('should store debug logs', () => {
      setDebugLevel('debug');
      
      logDebug('Message 1');
      logInfo('Message 2');
      logWarn('Message 3');

      const logs = getDebugLogs();
      expect(logs).toHaveLength(3);
      expect(logs[0].level).toBe('debug');
      expect(logs[1].level).toBe('info');
      expect(logs[2].level).toBe('warn');
    });

    it('should clear debug logs', () => {
      logInfo('Test message');
      expect(getDebugLogs()).toHaveLength(1);

      clearDebugLogs();
      expect(getDebugLogs()).toHaveLength(0);
    });

    it('should export debug logs as JSON', () => {
      logInfo('Export test');
      logError('Export error', new Error('Test'));

      const exported = exportDebugLogs();
      const parsed = JSON.parse(exported);

      expect(parsed.logs).toHaveLength(2);
      expect(parsed.logs[0].message).toBe('Export test');
      expect(parsed.logs[1].message).toBe('Export error');
      expect(parsed.exportedAt).toBeDefined();
    });

    it('should limit stored logs', () => {
      // Create more logs than the limit
      for (let i = 0; i < 1005; i++) {
        logInfo(`Message ${i}`);
      }

      const logs = getDebugLogs();
      expect(logs.length).toBeLessThanOrEqual(1000); // Assuming 1000 is the limit
    });
  });

  describe('formatDebugMessage', () => {
    it('should format debug message with timestamp', () => {
      const formatted = formatDebugMessage('Test message', 'info');

      expect(formatted).toMatch(/\[\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
      expect(formatted).toContain('[INFO]');
      expect(formatted).toContain('Test message');
    });

    it('should format with custom prefix', () => {
      const formatted = formatDebugMessage('Test', 'debug', 'CUSTOM');

      expect(formatted).toContain('[CUSTOM]');
      expect(formatted).toContain('[DEBUG]');
      expect(formatted).toContain('Test');
    });

    it('should handle object messages', () => {
      const obj = { key: 'value', nested: { data: 123 } };
      const formatted = formatDebugMessage(obj, 'info');

      expect(formatted).toContain('"key":"value"');
      expect(formatted).toContain('"data":123');
    });
  });

  describe('conditional logging', () => {
    it('should respect environment variables', () => {
      const originalEnv = process.env.NODE_ENV;
      
      // Test production mode
      process.env.NODE_ENV = 'production';
      setDebugLevel('debug');
      logDebug('Should not log in production');
      
      expect(mockConsoleLog).not.toHaveBeenCalled();
      
      // Restore
      process.env.NODE_ENV = originalEnv;
    });

    it('should allow force logging', () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'production';
      
      logError('Force log in production', null, { force: true });
      
      expect(mockConsoleError).toHaveBeenCalled();
      
      process.env.NODE_ENV = originalEnv;
    });
  });
});