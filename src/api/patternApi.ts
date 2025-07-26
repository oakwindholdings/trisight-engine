// src/api/patternApi.ts
// Local storage API for pattern feedback
// Simulates server calls
import { PatternFeedback, LearningModelState } from '../models/FeedbackTypes';
import { LearningMetrics } from '../models/LearningTypes';
import { PatternType } from '../models/PatternTypes';
import { supabase } from '../utils/supabase/client';

// Recursively clamp all numeric fields in an object to 9.99
function clampNumericFields(obj: any): any {
  if (Array.isArray(obj)) {
    return obj.map(clampNumericFields);
  }
  if (obj && typeof obj === 'object') {
    const result: any = {};
    for (const key in obj) {
      if (typeof obj[key] === 'number') {
        result[key] = Math.min(9.99, obj[key]);
      } else if (typeof obj[key] === 'object' && obj[key] !== null) {
        result[key] = clampNumericFields(obj[key]);
      } else {
        result[key] = obj[key];
      }
    }
    return result;
  }
  return obj;
}

// In a real implementation, this would connect to a server API
// For now, we'll persist data in localStorage with a simulated API delay

export const STORAGE_KEYS = {
  FEEDBACK: 'trisight_pattern_feedback',
  LEARNING_MODEL: 'trisight_learning_model',
};

// Helper to simulate network delay
const simulateNetworkDelay = (min = 100, max = 500): Promise<void> => {
  const delay = Math.floor(Math.random() * (max - min + 1)) + min;
  return new Promise(resolve => setTimeout(resolve, delay));
};

// Get stored feedback data
const getStoredFeedback = (): PatternFeedback[] => {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.FEEDBACK);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error('Error retrieving feedback data', error);
    return [];
  }
};

// Save feedback data
const saveFeedback = (feedback: PatternFeedback[]): void => {
  try {
    localStorage.setItem(STORAGE_KEYS.FEEDBACK, JSON.stringify(feedback));
  } catch (error) {
    console.error('Error saving feedback data', error);
  }
};

// Get learning model
const getLearningModel = (): LearningModelState | null => {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.LEARNING_MODEL);
    return data ? JSON.parse(data) : null;
  } catch (error) {
    console.error('Error retrieving learning model', error);
    return null;
  }
};

// Save learning model
const saveLearningModel = (model: LearningModelState): void => {
  try {
    localStorage.setItem(STORAGE_KEYS.LEARNING_MODEL, JSON.stringify(model));
  } catch (error) {
    console.error('Error saving learning model', error);
  }
};

// Submit new feedback
export const submitFeedback = async (feedback: PatternFeedback): Promise<void> => {
  await simulateNetworkDelay();
  // Validate and serialize payload for Supabase
  const feedbackRow = {
    ...clampNumericFields(feedback),
    createdAt: (feedback.createdAt instanceof Date ? feedback.createdAt.toISOString() : String(feedback.createdAt)),
    updatedAt: (feedback.updatedAt instanceof Date ? feedback.updatedAt.toISOString() : String(feedback.updatedAt)),
    patternType: String(feedback.patternType),
    timing: String(feedback.timing),
    invalidityReason: feedback.invalidityReason ? String(feedback.invalidityReason) : undefined,
    originalPatternType: feedback.originalPatternType ? String(feedback.originalPatternType) : undefined,
    correctedPatternType: feedback.correctedPatternType ? String(feedback.correctedPatternType) : undefined,
    consentTimestamp: feedback.consentTimestamp instanceof Date ? feedback.consentTimestamp.toISOString() : String(feedback.consentTimestamp),
    suggestedAdjustment: feedback.suggestedAdjustment ? JSON.stringify(clampNumericFields(feedback.suggestedAdjustment)) : undefined,
    viewport: feedback.viewport ? JSON.stringify(feedback.viewport) : undefined,
    boundaryAdjustment: feedback.boundaryAdjustment ? JSON.stringify(feedback.boundaryAdjustment) : undefined,
  };

  // Debug: log payload and client status
  console.log('[submitFeedback] Supabase client:', supabase);
  console.log('[submitFeedback] Payload:', feedbackRow);

  if (supabase) {
    const { error } = await supabase
      .from('pattern_feedback')
      .insert([feedbackRow]);
    if (error) {
      console.error('[submitFeedback] Supabase feedback insert error:', error);
      // Fallback to local storage
      const feedbackData = getStoredFeedback();
      feedbackData.push(feedback);
      saveFeedback(feedbackData);
      throw new Error('Failed to submit feedback to Supabase. Saved locally. ' + error.message);
    }
  } else {
    // Supabase not configured, fallback to local storage
    console.error('[submitFeedback] Supabase client not configured.');
    const feedbackData = getStoredFeedback();
    feedbackData.push(feedback);
    saveFeedback(feedbackData);
    throw new Error('Supabase client not configured. Saved feedback locally.');
  }

  // After submitting feedback, update the learning model
  await processNewFeedback(feedback);
};

// Get feedback history
export const getFeedbackHistory = async (): Promise<PatternFeedback[]> => {
  await simulateNetworkDelay();
  return getStoredFeedback();
};

// Get feedback for a specific pattern
export const getFeedbackForPattern = async (patternId: string): Promise<PatternFeedback | null> => {
  await simulateNetworkDelay();
  
  const feedbackData = getStoredFeedback();
  return feedbackData.find(f => f.patternId === patternId) || null;
};

// Process new feedback and update learning model
export const processNewFeedback = async (feedback: PatternFeedback): Promise<void> => {
  await simulateNetworkDelay(300, 800);
  
  let model = getLearningModel();
  
  // Initialize model if it doesn't exist
  if (!model) {
    model = {
      version: '1.0.0',
      lastUpdated: new Date(),
      patternStates: {} as Record<PatternType, any>, // Initialize empty patternStates
      patternParameters: {
        [PatternType.GOLDMINE_CHANNEL]: {
          confidenceThreshold: 0.7,
          timeframeWeights: { '1day': 1.0, '1hour': 0.8, '15min': 0.6 },
          detectionSensitivity: 0.6,
          minPatternDuration: 5,
          maxPatternDuration: 30,
          additionalParams: {}
        },
        [PatternType.GOLDMINE_SHAFT]: {
          confidenceThreshold: 0.7,
          timeframeWeights: { '1day': 1.0, '1hour': 0.8, '15min': 0.6 },
          detectionSensitivity: 0.6,
          minPatternDuration: 5,
          maxPatternDuration: 30,
          additionalParams: {}
        },
        [PatternType.PIVOT]: {
          confidenceThreshold: 0.7,
          timeframeWeights: { '1day': 1.0, '1hour': 0.8, '15min': 0.6 },
          detectionSensitivity: 0.6,
          minPatternDuration: 3,
          maxPatternDuration: 10,
          additionalParams: {}
        },
        [PatternType.ROCKETMAN]: {
          confidenceThreshold: 0.7,
          timeframeWeights: { '1day': 1.0, '1hour': 0.9, '15min': 0.7 },
          detectionSensitivity: 0.7,
          minPatternDuration: 3,
          maxPatternDuration: 15,
          additionalParams: {}
        },
        [PatternType.ESCALATOR]: {
          confidenceThreshold: 0.7,
          timeframeWeights: { '1day': 1.0, '1hour': 0.8, '15min': 0.6 },
          detectionSensitivity: 0.6,
          minPatternDuration: 5,
          maxPatternDuration: 50,
          additionalParams: {}
        },
        [PatternType.BLACKJACK]: {
          confidenceThreshold: 0.7,
          timeframeWeights: { '1day': 1.0, '1hour': 0.8, '15min': 0.6 },
          detectionSensitivity: 0.6,
          minPatternDuration: 1,
          maxPatternDuration: 10,
          additionalParams: {}
        },
        [PatternType.BREAKOUTBOX]: {
          confidenceThreshold: 0.7,
          timeframeWeights: { '1day': 1.0, '1hour': 0.8, '15min': 0.6 },
          detectionSensitivity: 0.6,
          minPatternDuration: 3,
          maxPatternDuration: 20,
          additionalParams: {}
        },
        [PatternType.GOLDEN_CANDLE]: {
          confidenceThreshold: 0.7,
          timeframeWeights: { '1day': 1.0, '1hour': 0.8, '15min': 0.6 },
          detectionSensitivity: 0.6,
          minPatternDuration: 1,
          maxPatternDuration: 5,
          additionalParams: {}
        }
      },
      feedbackHistory: [],
      metrics: {
        accuracyByPatternType: {
          [PatternType.GOLDMINE_CHANNEL]: 0,
          [PatternType.GOLDMINE_SHAFT]: 0,
          [PatternType.PIVOT]: 0,
          [PatternType.ROCKETMAN]: 0,
          [PatternType.ESCALATOR]: 0,
          [PatternType.BLACKJACK]: 0,
          [PatternType.BREAKOUTBOX]: 0,
          [PatternType.GOLDEN_CANDLE]: 0
        },
        feedbackCountByPatternType: {
          [PatternType.GOLDMINE_CHANNEL]: 0,
          [PatternType.GOLDMINE_SHAFT]: 0,
          [PatternType.PIVOT]: 0,
          [PatternType.ROCKETMAN]: 0,
          [PatternType.ESCALATOR]: 0,
          [PatternType.BLACKJACK]: 0,
          [PatternType.BREAKOUTBOX]: 0,
          [PatternType.GOLDEN_CANDLE]: 0
        },
        falsePositiveRate: 0,
        correctionsByType: [],
        totalFeedbackCount: 0,
        feedbackTrend: [],
        topContributors: [],
      },
    };
  }
  
  // Add to feedback history
  if (!model.feedbackHistory) {
    model.feedbackHistory = [];
  }
  model.feedbackHistory.push(feedback);
  
  // Update metrics
  updateLearningMetrics(model);
  
  // Save updated model
  model.lastUpdated = new Date();
  saveLearningModel(model);
};

// Get learning metrics
export const getLearningMetrics = async (): Promise<LearningMetrics> => {
  await simulateNetworkDelay();
  
  let model = getLearningModel();
  if (!model) {
    // Initialize a default model instead of throwing an error
    model = {
      version: '1.0.0',
      lastUpdated: new Date(),
      patternStates: {
        [PatternType.GOLDMINE_CHANNEL]: { enabled: true, confidenceMultiplier: 1.0, timingOffsetMs: 0 },
        [PatternType.GOLDMINE_SHAFT]: { enabled: true, confidenceMultiplier: 1.0, timingOffsetMs: 0 },
        [PatternType.PIVOT]: { enabled: true, confidenceMultiplier: 1.0, timingOffsetMs: 0 },
        [PatternType.ROCKETMAN]: { enabled: true, confidenceMultiplier: 1.0, timingOffsetMs: 0 },
        [PatternType.ESCALATOR]: { enabled: true, confidenceMultiplier: 1.0, timingOffsetMs: 0 },
        [PatternType.BLACKJACK]: { enabled: true, confidenceMultiplier: 1.0, timingOffsetMs: 0 },
        [PatternType.BREAKOUTBOX]: { enabled: true, confidenceMultiplier: 1.0, timingOffsetMs: 0 },
        [PatternType.GOLDEN_CANDLE]: { enabled: true, confidenceMultiplier: 1.0, timingOffsetMs: 0 }
      },
      patternParameters: {
        [PatternType.GOLDMINE_CHANNEL]: {
          confidenceThreshold: 0.7,
          timeframeWeights: { '1day': 1.0, '1hour': 0.8, '15min': 0.6 },
          detectionSensitivity: 0.6,
          minPatternDuration: 5,
          maxPatternDuration: 30,
          additionalParams: {}
        },
        [PatternType.GOLDMINE_SHAFT]: {
          confidenceThreshold: 0.7,
          timeframeWeights: { '1day': 1.0, '1hour': 0.8, '15min': 0.6 },
          detectionSensitivity: 0.6,
          minPatternDuration: 5,
          maxPatternDuration: 30,
          additionalParams: {}
        },
        [PatternType.PIVOT]: {
          confidenceThreshold: 0.7,
          timeframeWeights: { '1day': 1.0, '1hour': 0.8, '15min': 0.6 },
          detectionSensitivity: 0.6,
          minPatternDuration: 3,
          maxPatternDuration: 10,
          additionalParams: {}
        },
        [PatternType.ROCKETMAN]: {
          confidenceThreshold: 0.7,
          timeframeWeights: { '1day': 1.0, '1hour': 0.9, '15min': 0.7 },
          detectionSensitivity: 0.7,
          minPatternDuration: 3,
          maxPatternDuration: 15,
          additionalParams: {}
        },
        [PatternType.ESCALATOR]: {
          confidenceThreshold: 0.7,
          timeframeWeights: { '1day': 1.0, '1hour': 0.8, '15min': 0.6 },
          detectionSensitivity: 0.6,
          minPatternDuration: 5,
          maxPatternDuration: 50,
          additionalParams: {}
        },
        [PatternType.BLACKJACK]: {
          confidenceThreshold: 0.7,
          timeframeWeights: { '1day': 1.0, '1hour': 0.8, '15min': 0.6 },
          detectionSensitivity: 0.6,
          minPatternDuration: 1,
          maxPatternDuration: 10,
          additionalParams: {}
        },
        [PatternType.BREAKOUTBOX]: {
          confidenceThreshold: 0.7,
          timeframeWeights: { '1day': 1.0, '1hour': 0.8, '15min': 0.6 },
          detectionSensitivity: 0.6,
          minPatternDuration: 3,
          maxPatternDuration: 20,
          additionalParams: {}
        },
        [PatternType.GOLDEN_CANDLE]: {
          confidenceThreshold: 0.7,
          timeframeWeights: { '1day': 1.0, '1hour': 0.8, '15min': 0.6 },
          detectionSensitivity: 0.6,
          minPatternDuration: 1,
          maxPatternDuration: 5,
          additionalParams: {}
        }
      },
      feedbackHistory: [],
      metrics: {
        accuracyByPatternType: {
          [PatternType.GOLDMINE_CHANNEL]: 0,
          [PatternType.GOLDMINE_SHAFT]: 0,
          [PatternType.PIVOT]: 0,
          [PatternType.ROCKETMAN]: 0,
          [PatternType.ESCALATOR]: 0,
          [PatternType.BLACKJACK]: 0,
          [PatternType.BREAKOUTBOX]: 0,
          [PatternType.GOLDEN_CANDLE]: 0
        },
        feedbackCountByPatternType: {
          [PatternType.GOLDMINE_CHANNEL]: 0,
          [PatternType.GOLDMINE_SHAFT]: 0,
          [PatternType.PIVOT]: 0,
          [PatternType.ROCKETMAN]: 0,
          [PatternType.ESCALATOR]: 0,
          [PatternType.BLACKJACK]: 0,
          [PatternType.BREAKOUTBOX]: 0,
          [PatternType.GOLDEN_CANDLE]: 0
        },
        falsePositiveRate: 0,
        correctionsByType: [],
        totalFeedbackCount: 0,
        feedbackTrend: [],
        topContributors: [],
      },
    };
    saveLearningModel(model);
  }
  
  return model.metrics;
};

// Export learning model
export const exportLearningModel = async (): Promise<LearningModelState> => {
  await simulateNetworkDelay();
  
  let model = getLearningModel();
  if (!model) {
    // Initialize a default model instead of throwing an error
    model = {
      version: '1.0.0',
      lastUpdated: new Date(),
      patternStates: {
        [PatternType.GOLDMINE_CHANNEL]: { enabled: true, confidenceMultiplier: 1.0, timingOffsetMs: 0 },
        [PatternType.GOLDMINE_SHAFT]: { enabled: true, confidenceMultiplier: 1.0, timingOffsetMs: 0 },
        [PatternType.PIVOT]: { enabled: true, confidenceMultiplier: 1.0, timingOffsetMs: 0 },
        [PatternType.ROCKETMAN]: { enabled: true, confidenceMultiplier: 1.0, timingOffsetMs: 0 },
        [PatternType.ESCALATOR]: { enabled: true, confidenceMultiplier: 1.0, timingOffsetMs: 0 },
        [PatternType.BLACKJACK]: { enabled: true, confidenceMultiplier: 1.0, timingOffsetMs: 0 },
        [PatternType.BREAKOUTBOX]: { enabled: true, confidenceMultiplier: 1.0, timingOffsetMs: 0 },
        [PatternType.GOLDEN_CANDLE]: { enabled: true, confidenceMultiplier: 1.0, timingOffsetMs: 0 }
      },
      patternParameters: {
        [PatternType.GOLDMINE_CHANNEL]: {
          confidenceThreshold: 0.7,
          timeframeWeights: { '1day': 1.0, '1hour': 0.8, '15min': 0.6 },
          detectionSensitivity: 0.6,
          minPatternDuration: 5,
          maxPatternDuration: 30,
          additionalParams: {}
        },
        [PatternType.GOLDMINE_SHAFT]: {
          confidenceThreshold: 0.7,
          timeframeWeights: { '1day': 1.0, '1hour': 0.8, '15min': 0.6 },
          detectionSensitivity: 0.6,
          minPatternDuration: 5,
          maxPatternDuration: 30,
          additionalParams: {}
        },
        [PatternType.PIVOT]: {
          confidenceThreshold: 0.7,
          timeframeWeights: { '1day': 1.0, '1hour': 0.8, '15min': 0.6 },
          detectionSensitivity: 0.6,
          minPatternDuration: 3,
          maxPatternDuration: 10,
          additionalParams: {}
        },
        [PatternType.ROCKETMAN]: {
          confidenceThreshold: 0.7,
          timeframeWeights: { '1day': 1.0, '1hour': 0.9, '15min': 0.7 },
          detectionSensitivity: 0.7,
          minPatternDuration: 3,
          maxPatternDuration: 15,
          additionalParams: {}
        },
        [PatternType.ESCALATOR]: {
          confidenceThreshold: 0.7,
          timeframeWeights: { '1day': 1.0, '1hour': 0.8, '15min': 0.6 },
          detectionSensitivity: 0.6,
          minPatternDuration: 5,
          maxPatternDuration: 50,
          additionalParams: {}
        },
        [PatternType.BLACKJACK]: {
          confidenceThreshold: 0.7,
          timeframeWeights: { '1day': 1.0, '1hour': 0.8, '15min': 0.6 },
          detectionSensitivity: 0.6,
          minPatternDuration: 1,
          maxPatternDuration: 10,
          additionalParams: {}
        },
        [PatternType.BREAKOUTBOX]: {
          confidenceThreshold: 0.7,
          timeframeWeights: { '1day': 1.0, '1hour': 0.8, '15min': 0.6 },
          detectionSensitivity: 0.6,
          minPatternDuration: 3,
          maxPatternDuration: 20,
          additionalParams: {}
        },
        [PatternType.GOLDEN_CANDLE]: {
          confidenceThreshold: 0.7,
          timeframeWeights: { '1day': 1.0, '1hour': 0.8, '15min': 0.6 },
          detectionSensitivity: 0.6,
          minPatternDuration: 1,
          maxPatternDuration: 5,
          additionalParams: {}
        }
      },
      feedbackHistory: [],
      metrics: {
        accuracyByPatternType: {
          [PatternType.GOLDMINE_CHANNEL]: 0,
          [PatternType.GOLDMINE_SHAFT]: 0,
          [PatternType.PIVOT]: 0,
          [PatternType.ROCKETMAN]: 0,
          [PatternType.ESCALATOR]: 0,
          [PatternType.BLACKJACK]: 0,
          [PatternType.BREAKOUTBOX]: 0,
          [PatternType.GOLDEN_CANDLE]: 0
        },
        feedbackCountByPatternType: {
          [PatternType.GOLDMINE_CHANNEL]: 0,
          [PatternType.GOLDMINE_SHAFT]: 0,
          [PatternType.PIVOT]: 0,
          [PatternType.ROCKETMAN]: 0,
          [PatternType.ESCALATOR]: 0,
          [PatternType.BLACKJACK]: 0,
          [PatternType.BREAKOUTBOX]: 0,
          [PatternType.GOLDEN_CANDLE]: 0
        },
        falsePositiveRate: 0,
        correctionsByType: [],
        totalFeedbackCount: 0,
        feedbackTrend: [],
        topContributors: [],
      },
    };
    saveLearningModel(model);
  }
  
  return model;
};

// Import learning model
export const importLearningModel = async (modelState: LearningModelState): Promise<void> => {
  await simulateNetworkDelay();
  saveLearningModel(modelState);
};

// Update learning metrics based on feedback
const updateLearningMetrics = (model: LearningModelState): void => {
  const { feedbackHistory } = model;
  const metrics = model.metrics;
  
  // Initialize metrics with default values
  const allPatternTypes = Object.values(PatternType);
  
  // Reset counts with proper typing
  const emptyAccuracy: Record<PatternType, number> = {} as Record<PatternType, number>;
  const emptyFeedbackCount: Record<PatternType, number> = {} as Record<PatternType, number>;
  
  // Initialize all pattern types with 0 values
  allPatternTypes.forEach(type => {
    emptyAccuracy[type] = 0;
    emptyFeedbackCount[type] = 0;
  });
  
  metrics.accuracyByPatternType = emptyAccuracy;
  metrics.feedbackCountByPatternType = emptyFeedbackCount;
  metrics.correctionsByType = [];
  metrics.totalFeedbackCount = feedbackHistory ? feedbackHistory.length : 0;
  
  // Group by pattern type
  const byPatternType: Record<PatternType, PatternFeedback[]> = {} as Record<PatternType, PatternFeedback[]>;
  const corrections: Record<string, {from: PatternType, to: PatternType, count: number}> = {};
  let falsePositiveCount = 0;
  
  // Process all feedback
  if (feedbackHistory) {
    feedbackHistory.forEach(feedback => {
    const { originalPatternType, correctedPatternType, falsePositive } = feedback;
    
    // Count by pattern type
    if (originalPatternType && originalPatternType in PatternType) {
      if (!byPatternType[originalPatternType as PatternType]) {
        byPatternType[originalPatternType as PatternType] = [];
      }
      byPatternType[originalPatternType as PatternType].push(feedback);
    }
    
    // Count false positives
    if (falsePositive) {
      falsePositiveCount++;
    }
    
    // Count corrections
    if (correctedPatternType && correctedPatternType !== originalPatternType) {
      const key = `${originalPatternType}:${correctedPatternType}`;
      if (!corrections[key]) {
        corrections[key] = {
          from: originalPatternType,
          to: correctedPatternType,
          count: 0
        };
      }
      corrections[key].count++;
    }
  });
  
  // Calculate accuracy by pattern type
  Object.entries(byPatternType).forEach(([typeStr, feedbacks]) => {
    const type = typeStr as PatternType;
    metrics.feedbackCountByPatternType[type] = feedbacks.length;
    
    const correctCount = feedbacks.filter(f => 
      !f.falsePositive && 
      (!f.correctedPatternType || f.correctedPatternType === f.originalPatternType)
    ).length;
    
    metrics.accuracyByPatternType[type] = feedbacks.length > 0 
      ? correctCount / feedbacks.length 
      : 0;
  });
  
  // Calculate false positive rate
  metrics.falsePositiveRate = feedbackHistory && feedbackHistory.length > 0 
    ? falsePositiveCount / feedbackHistory.length 
    : 0;
  }
  
  // Format corrections
  metrics.correctionsByType = Object.values(corrections);
  
  // Update feedback trend (group by day)
  const trendMap = new Map<string, number>();
  if (feedbackHistory) {
    feedbackHistory.forEach(f => {
      const date = new Date(f.createdAt);
      const dateStr = date.toISOString().split('T')[0];
      trendMap.set(dateStr, (trendMap.get(dateStr) || 0) + 1);
    });
  }
  
  metrics.feedbackTrend = Array.from(trendMap.entries())
    .map(([dateStr, count]) => ({
      date: new Date(dateStr),
      count,
    }))
    .sort((a, b) => a.date.getTime() - b.date.getTime());
  
  // Update top contributors
  const contributorMap = new Map<string, { count: number; correct: number }>();
  if (feedbackHistory) {
    feedbackHistory.forEach(f => {
      const userId = f.userId;
      const current = contributorMap.get(userId) || { count: 0, correct: 0 };
      
      current.count++;
    if (!f.falsePositive && (!f.correctedPatternType || f.correctedPatternType === f.originalPatternType)) {
      current.correct++;
    }
    
    contributorMap.set(userId, current);
    });
  }
  
  metrics.topContributors = Array.from(contributorMap.entries())
    .map(([userId, { count, correct }]) => ({
      userId,
      feedbackCount: count,
      accuracyRate: count > 0 ? correct / count : 0,
    }))
    .sort((a, b) => b.feedbackCount - a.feedbackCount)
    .slice(0, 10);
};
