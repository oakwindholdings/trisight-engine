// src/api/patternApi.ts
// Local storage API for pattern feedback
// Simulates server calls
import { PatternFeedback, LearningMetrics, LearningModelState } from '../models/FeedbackTypes';
import { PatternType } from '../models/PatternTypes';

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
  
  const feedbackData = getStoredFeedback();
  
  // Add new feedback
  feedbackData.push({
    ...feedback,
    submittedAt: new Date(),
  });
  
  saveFeedback(feedbackData);
  
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
          maxPatternDuration: 20,
          additionalParams: {}
        },
        [PatternType.BLACKJACK]: {
          confidenceThreshold: 0.7,
          timeframeWeights: { '1day': 1.0, '1hour': 0.8, '15min': 0.6 },
          detectionSensitivity: 0.6,
          minPatternDuration: 3,
          maxPatternDuration: 10,
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
          [PatternType.BLACKJACK]: 0
        },
        feedbackCountByPatternType: {
          [PatternType.GOLDMINE_CHANNEL]: 0,
          [PatternType.GOLDMINE_SHAFT]: 0,
          [PatternType.PIVOT]: 0,
          [PatternType.ROCKETMAN]: 0,
          [PatternType.ESCALATOR]: 0,
          [PatternType.BLACKJACK]: 0
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
          maxPatternDuration: 20,
          additionalParams: {}
        },
        [PatternType.BLACKJACK]: {
          confidenceThreshold: 0.7,
          timeframeWeights: { '1day': 1.0, '1hour': 0.8, '15min': 0.6 },
          detectionSensitivity: 0.6,
          minPatternDuration: 3,
          maxPatternDuration: 10,
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
          [PatternType.BLACKJACK]: 0
        },
        feedbackCountByPatternType: {
          [PatternType.GOLDMINE_CHANNEL]: 0,
          [PatternType.GOLDMINE_SHAFT]: 0,
          [PatternType.PIVOT]: 0,
          [PatternType.ROCKETMAN]: 0,
          [PatternType.ESCALATOR]: 0,
          [PatternType.BLACKJACK]: 0
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
          maxPatternDuration: 20,
          additionalParams: {}
        },
        [PatternType.BLACKJACK]: {
          confidenceThreshold: 0.7,
          timeframeWeights: { '1day': 1.0, '1hour': 0.8, '15min': 0.6 },
          detectionSensitivity: 0.6,
          minPatternDuration: 3,
          maxPatternDuration: 10,
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
          [PatternType.BLACKJACK]: 0
        },
        feedbackCountByPatternType: {
          [PatternType.GOLDMINE_CHANNEL]: 0,
          [PatternType.GOLDMINE_SHAFT]: 0,
          [PatternType.PIVOT]: 0,
          [PatternType.ROCKETMAN]: 0,
          [PatternType.ESCALATOR]: 0,
          [PatternType.BLACKJACK]: 0
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
  metrics.totalFeedbackCount = feedbackHistory.length;
  
  // Group by pattern type
  const byPatternType: Record<PatternType, PatternFeedback[]> = {} as Record<PatternType, PatternFeedback[]>;
  const corrections: Record<string, {from: PatternType, to: PatternType, count: number}> = {};
  let falsePositiveCount = 0;
  
  // Process all feedback
  feedbackHistory.forEach(feedback => {
    const { originalPatternType, correctedPatternType, falsePositive } = feedback;
    
    // Count by pattern type
    if (!byPatternType[originalPatternType]) {
      byPatternType[originalPatternType] = [];
    }
    byPatternType[originalPatternType].push(feedback);
    
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
  metrics.falsePositiveRate = feedbackHistory.length > 0 
    ? falsePositiveCount / feedbackHistory.length 
    : 0;
  
  // Format corrections
  metrics.correctionsByType = Object.values(corrections);
  
  // Update feedback trend (group by day)
  const trendMap = new Map<string, number>();
  feedbackHistory.forEach(f => {
    const date = new Date(f.submittedAt);
    const dateStr = date.toISOString().split('T')[0];
    trendMap.set(dateStr, (trendMap.get(dateStr) || 0) + 1);
  });
  
  metrics.feedbackTrend = Array.from(trendMap.entries())
    .map(([dateStr, count]) => ({
      date: new Date(dateStr),
      count,
    }))
    .sort((a, b) => a.date.getTime() - b.date.getTime());
  
  // Update top contributors
  const contributorMap = new Map<string, { count: number; correct: number }>();
  feedbackHistory.forEach(f => {
    const userId = f.userId;
    const current = contributorMap.get(userId) || { count: 0, correct: 0 };
    
    current.count++;
    if (!f.falsePositive && (!f.correctedPatternType || f.correctedPatternType === f.originalPatternType)) {
      current.correct++;
    }
    
    contributorMap.set(userId, current);
  });
  
  metrics.topContributors = Array.from(contributorMap.entries())
    .map(([userId, { count, correct }]) => ({
      userId,
      feedbackCount: count,
      accuracyRate: count > 0 ? correct / count : 0,
    }))
    .sort((a, b) => b.feedbackCount - a.feedbackCount)
    .slice(0, 10);
};
