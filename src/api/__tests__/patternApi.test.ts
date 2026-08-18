// src/api/__tests__/patternApi.test.ts
// Unit tests for pattern API functions
// Context: Tests pattern detection API endpoints

import {
  submitFeedback,
  getFeedbackHistory,
  updateLearningModel,
  getLearningModelState,
  getPatternLearningMetrics,
  resetLearningModel,
  STORAGE_KEYS
} from '../patternApi';
import { PatternFeedback, LearningModelState } from '../../models/FeedbackTypes';
import { PatternType } from '../../models/PatternTypes';

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn()
};
Object.defineProperty(window, 'localStorage', { value: localStorageMock });

// Mock the /api/data/* fetch calls (patternApi.ts talks to the Express data API, not Supabase directly)
global.fetch = jest.fn(() =>
  Promise.resolve({
    ok: true,
    status: 201,
    json: () => Promise.resolve({ data: [] })
  })
) as jest.Mock;

// Mock console methods
const mockConsoleError = jest.spyOn(console, 'error').mockImplementation();
const mockConsoleLog = jest.spyOn(console, 'log').mockImplementation();

describe('Pattern API', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorageMock.getItem.mockReturnValue(null);
  });

  afterAll(() => {
    mockConsoleError.mockRestore();
    mockConsoleLog.mockRestore();
  });

  describe('submitFeedback', () => {
    it('should submit feedback successfully', async () => {
      const feedback: PatternFeedback = {
        id: 'feedback-123',
        patternId: 'pattern-123',
        patternType: PatternType.GOLDMINE_CHANNEL,
        timestamp: new Date().toISOString(),
        symbol: 'AAPL',
        timeframe: '5m',
        correct: true,
        confidence: 0.85,
        priceAtDetection: 150,
        priceAtFeedback: 151,
        userRating: 5,
        parameters: {},
        candleData: []
      };

      localStorageMock.getItem.mockReturnValue('[]');
      
      const result = await submitFeedback(feedback);

      expect(result).toBe(true);
      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        STORAGE_KEYS.FEEDBACK,
        expect.stringContaining(feedback.id)
      );
    });

    it('should handle submission errors', async () => {
      const feedback: PatternFeedback = {
        id: 'feedback-123',
        patternId: 'pattern-123',
        patternType: PatternType.BREAKOUTBOX,
        timestamp: new Date().toISOString(),
        symbol: 'NVDA',
        timeframe: '15m',
        correct: false,
        confidence: 0.6,
        priceAtDetection: 500,
        priceAtFeedback: 495,
        userRating: 2
      };

      // Simulate localStorage error
      localStorageMock.setItem.mockImplementation(() => {
        throw new Error('Storage error');
      });

      const result = await submitFeedback(feedback);

      expect(result).toBe(false);
      expect(mockConsoleError).toHaveBeenCalled();
    });
  });

  describe('getFeedbackHistory', () => {
    it('should retrieve feedback history', async () => {
      const mockHistory: PatternFeedback[] = [
        {
          id: '1',
          patternId: 'p1',
          patternType: PatternType.GOLDMINE_CHANNEL,
          timestamp: new Date().toISOString(),
          symbol: 'AAPL',
          timeframe: '5m',
          correct: true,
          confidence: 0.8,
          priceAtDetection: 150,
          priceAtFeedback: 152,
          userRating: 4
        },
        {
          id: '2',
          patternId: 'p2',
          patternType: PatternType.ROCKETMAN,
          timestamp: new Date().toISOString(),
          symbol: 'TSLA',
          timeframe: '1h',
          correct: false,
          confidence: 0.7,
          priceAtDetection: 700,
          priceAtFeedback: 695,
          userRating: 2
        }
      ];

      localStorageMock.getItem.mockReturnValue(JSON.stringify(mockHistory));

      const result = await getFeedbackHistory();

      expect(result).toEqual(mockHistory);
    });

    it('should return empty array when no history exists', async () => {
      localStorageMock.getItem.mockReturnValue(null);

      const result = await getFeedbackHistory();

      expect(result).toEqual([]);
    });

    it('should handle corrupted data', async () => {
      localStorageMock.getItem.mockReturnValue('invalid json');

      const result = await getFeedbackHistory();

      expect(result).toEqual([]);
      expect(mockConsoleError).toHaveBeenCalled();
    });
  });

  describe('updateLearningModel', () => {
    it('should update learning model state', async () => {
      const updates: Partial<LearningModelState> = {
        totalFeedback: 100,
        accuracy: 0.85,
        patternAccuracy: {
          [PatternType.GOLDMINE_CHANNEL]: 0.87,
          [PatternType.ESCALATOR]: 0.82
        }
      };

      const existingState: LearningModelState = {
        lastUpdate: new Date().toISOString(),
        totalFeedback: 50,
        accuracy: 0.75,
        patternAccuracy: {},
        parameterAdjustments: {},
        confidenceThresholds: {}
      };

      localStorageMock.getItem.mockReturnValue(JSON.stringify(existingState));

      const result = await updateLearningModel(updates);

      expect(result).toBe(true);
      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        STORAGE_KEYS.LEARNING_MODEL,
        expect.stringContaining('"totalFeedback":100')
      );
    });

    it('should handle update errors', async () => {
      const updates = { accuracy: 0.9 };

      localStorageMock.getItem.mockReturnValue('{}');
      localStorageMock.setItem.mockImplementation(() => {
        throw new Error('Update error');
      });

      const result = await updateLearningModel(updates);

      expect(result).toBe(false);
      expect(mockConsoleError).toHaveBeenCalled();
    });
  });

  describe('getLearningModelState', () => {
    it('should retrieve learning model state', async () => {
      const mockState: LearningModelState = {
        lastUpdate: new Date().toISOString(),
        totalFeedback: 200,
        accuracy: 0.82,
        patternAccuracy: {
          [PatternType.GOLDMINE_CHANNEL]: 0.85,
          [PatternType.PIVOT]: 0.78
        },
        parameterAdjustments: {},
        confidenceThresholds: {
          [PatternType.GOLDMINE_CHANNEL]: 0.7,
          [PatternType.PIVOT]: 0.75
        }
      };

      localStorageMock.getItem.mockReturnValue(JSON.stringify(mockState));

      const result = await getLearningModelState();

      expect(result).toEqual(mockState);
    });

    it('should return null when no state exists', async () => {
      localStorageMock.getItem.mockReturnValue(null);

      const result = await getLearningModelState();

      expect(result).toBeNull();
    });
  });

  describe('getPatternLearningMetrics', () => {
    it('should calculate metrics for specific pattern', async () => {
      const mockFeedback: PatternFeedback[] = [
        {
          id: '1',
          patternId: 'p1',
          patternType: PatternType.GOLDMINE_CHANNEL,
          timestamp: new Date().toISOString(),
          symbol: 'AAPL',
          timeframe: '5m',
          correct: true,
          confidence: 0.8,
          priceAtDetection: 150,
          priceAtFeedback: 155,
          userRating: 5
        },
        {
          id: '2',
          patternId: 'p2',
          patternType: PatternType.GOLDMINE_CHANNEL,
          timestamp: new Date().toISOString(),
          symbol: 'NVDA',
          timeframe: '5m',
          correct: true,
          confidence: 0.85,
          priceAtDetection: 500,
          priceAtFeedback: 510,
          userRating: 4
        },
        {
          id: '3',
          patternId: 'p3',
          patternType: PatternType.GOLDMINE_CHANNEL,
          timestamp: new Date().toISOString(),
          symbol: 'TSLA',
          timeframe: '5m',
          correct: false,
          confidence: 0.7,
          priceAtDetection: 700,
          priceAtFeedback: 690,
          userRating: 2
        }
      ];

      localStorageMock.getItem.mockReturnValue(JSON.stringify(mockFeedback));

      const metrics = await getPatternLearningMetrics(PatternType.GOLDMINE_CHANNEL);

      expect(metrics).toEqual({
        patternType: PatternType.GOLDMINE_CHANNEL,
        totalFeedback: 3,
        correctPredictions: 2,
        accuracy: expect.closeTo(0.67, 2),
        averageConfidence: expect.closeTo(0.78, 2),
        averageRating: expect.closeTo(3.67, 2),
        profitableTrades: 2,
        profitability: expect.closeTo(0.67, 2),
        averageReturn: expect.any(Number)
      });
    });

    it('should return empty metrics for pattern with no feedback', async () => {
      localStorageMock.getItem.mockReturnValue('[]');

      const metrics = await getPatternLearningMetrics(PatternType.BLACKJACK);

      expect(metrics).toEqual({
        patternType: PatternType.BLACKJACK,
        totalFeedback: 0,
        correctPredictions: 0,
        accuracy: 0,
        averageConfidence: 0,
        averageRating: 0,
        profitableTrades: 0,
        profitability: 0,
        averageReturn: 0
      });
    });
  });

  describe('resetLearningModel', () => {
    it('should reset learning model and feedback', async () => {
      localStorageMock.getItem.mockReturnValue('["some", "data"]');

      const result = await resetLearningModel();

      expect(result).toBe(true);
      expect(localStorageMock.removeItem).toHaveBeenCalledWith(STORAGE_KEYS.FEEDBACK);
      expect(localStorageMock.removeItem).toHaveBeenCalledWith(STORAGE_KEYS.LEARNING_MODEL);
    });

    it('should handle reset errors gracefully', async () => {
      localStorageMock.removeItem.mockImplementation(() => {
        throw new Error('Remove error');
      });

      const result = await resetLearningModel();

      expect(result).toBe(false);
      expect(mockConsoleError).toHaveBeenCalled();
    });
  });

  describe('numeric clamping', () => {
    it('should clamp numeric values to 9.99', async () => {
      const feedback: PatternFeedback = {
        id: 'test',
        patternId: 'p1',
        patternType: PatternType.GOLDMINE_CHANNEL,
        timestamp: new Date().toISOString(),
        symbol: 'TEST',
        timeframe: '5m',
        correct: true,
        confidence: 15.5, // Should be clamped
        priceAtDetection: 1000,
        priceAtFeedback: 1050,
        userRating: 20, // Should be clamped
        parameters: {
          threshold: 100, // Should be clamped
          sensitivity: 0.8
        }
      };

      localStorageMock.getItem.mockReturnValue('[]');
      
      await submitFeedback(feedback);

      const savedData = JSON.parse(localStorageMock.setItem.mock.calls[0][1]);
      expect(savedData[0].confidence).toBe(9.99);
      expect(savedData[0].userRating).toBe(9.99);
      expect(savedData[0].parameters.threshold).toBe(9.99);
      expect(savedData[0].parameters.sensitivity).toBe(0.8);
    });
  });
});