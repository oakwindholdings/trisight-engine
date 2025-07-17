// src/utils/learning/FeedbackStorage.ts
// Stores feedback in localStorage
// Also saves learning parameters
// NOTE: TriSight uses Canvas, not SVG. Supports DEBUG_UI channel via logDebug.
import { PatternFeedback, LegacyPatternFeedback } from '../../models/FeedbackTypes';
import { PatternType } from '../../models/PatternTypes';
import { PatternDetectionParameters, PatternFeedbackHistory } from '../../models/LearningTypes';
import { logDebug } from '../debug';

/**
 * Storage key constants
 */
const STORAGE_KEYS = {
  FEEDBACK: 'trisight_pattern_feedback',
  PARAMETERS: 'trisight_pattern_parameters',
  FEEDBACK_HISTORY: 'trisight_feedback_history'
};

/**
 * Service to handle persistent storage of feedback and learning data
 */
export class FeedbackStorage {
  private static lastSubmissions: number[] = [];
  private static mutex = Promise.resolve();

  /**
   * Save a new feedback entry
   */
  public static async saveFeedback(feedback: PatternFeedback): Promise<void> {
    if (localStorage.getItem('storageConsent') !== 'true') {
      throw new Error('User has not consented to local storage');
    }
    this.mutex = this.mutex.then(async () => {
      const now = Date.now();
      this.lastSubmissions = this.lastSubmissions.filter(t => now - t < 60000); // 1 min
      if (this.lastSubmissions.length >= 10) throw new Error('Rate limit exceeded');
      this.lastSubmissions.push(now);
      
      const existingFeedback = this.getAllFeedback();
      existingFeedback.push(feedback);
      
      localStorage.setItem(STORAGE_KEYS.FEEDBACK, JSON.stringify(existingFeedback));
      
      // Update feedback history for this pattern
      this.updateFeedbackHistory(feedback);
      
      return Promise.resolve();
    });
  }
  
  /**
   * Get all feedback entries
   */
  public static getAllFeedback(): PatternFeedback[] {
    try {
      const storedFeedback = localStorage.getItem(STORAGE_KEYS.FEEDBACK);
      if (!storedFeedback) {
        return [];
      }
      
      const parsedFeedback = JSON.parse(storedFeedback);
      
      // Convert string dates back to Date objects
      return parsedFeedback.map((feedback: any) => ({
        ...feedback,
        createdAt: new Date(feedback.createdAt || feedback.submittedAt),
        updatedAt: new Date(feedback.updatedAt || feedback.submittedAt),
        boundaryAdjustment: {
          ...feedback.boundaryAdjustment,
          originalStart: new Date(feedback.boundaryAdjustment.originalStart),
          originalEnd: new Date(feedback.boundaryAdjustment.originalEnd),
          correctedStart: feedback.boundaryAdjustment.correctedStart ? 
                          new Date(feedback.boundaryAdjustment.correctedStart) : null,
          correctedEnd: feedback.boundaryAdjustment.correctedEnd ? 
                        new Date(feedback.boundaryAdjustment.correctedEnd) : null
        }
      }));
    } catch (error) {
      logDebug('DEBUG_UI', 'Error loading feedback from storage:', error);
      return [];
    }
  }
  
  /**
   * Get feedback entries for a specific pattern type
   */
  public static getFeedbackByPatternType(patternType: PatternType): PatternFeedback[] {
    return this.getAllFeedback().filter(
      feedback => (feedback as any).originalPatternType === patternType || 
                 (feedback as any).correctedPatternType === patternType ||
                 feedback.patternType === patternType
    );
  }
  
  /**
   * Get feedback entries for a specific pattern ID
   */
  public static getFeedbackByPatternId(patternId: string): PatternFeedback[] {
    return this.getAllFeedback().filter(
      feedback => feedback.patternId === patternId
    );
  }
  
  /**
   * Save detection parameters for a pattern type
   */
  public static saveParameters(
    patternType: PatternType, 
    parameters: PatternDetectionParameters
  ): void {
    const allParameters = this.getAllParameters();
    
    allParameters[patternType] = parameters;
    
    localStorage.setItem(STORAGE_KEYS.PARAMETERS, JSON.stringify(allParameters));
    
    // Update parameter history
    this.updateParameterHistory(patternType, parameters);
  }
  
  /**
   * Get detection parameters for all pattern types
   */
  public static getAllParameters(): Record<PatternType, PatternDetectionParameters> {
    try {
      const storedParameters = localStorage.getItem(STORAGE_KEYS.PARAMETERS);
      if (!storedParameters) {
        return {} as Record<PatternType, PatternDetectionParameters>;
      }
      
      return JSON.parse(storedParameters);
    } catch (error) {
      logDebug('DEBUG_UI', 'Error loading parameters from storage:', error);
      return {} as Record<PatternType, PatternDetectionParameters>;
    }
  }
  
  /**
   * Get detection parameters for a specific pattern type
   */
  public static getParametersByPatternType(
    patternType: PatternType
  ): PatternDetectionParameters | null {
    const allParameters = this.getAllParameters();
    return allParameters[patternType] || null;
  }
  
  /**
   * Update feedback history for a pattern
   */
  private static updateFeedbackHistory(feedback: PatternFeedback): void {
    try {
      const histories = this.getFeedbackHistories();
      
      // Find or create history for this pattern
      let history = histories.find(h => h.patternId === feedback.patternId);
      
      if (!history) {
        history = {
          patternId: feedback.patternId,
          feedbackEntries: [],
          patternEvolution: []
        };
        histories.push(history);
      }
      
      // Add feedback to history
      history.feedbackEntries.push(feedback);
      
      // Save updated histories
      localStorage.setItem(STORAGE_KEYS.FEEDBACK_HISTORY, JSON.stringify(histories));
    } catch (error) {
      logDebug('DEBUG_UI', 'Error updating feedback history:', error);
    }
  }
  
  /**
   * Update parameter history for a pattern type
   */
  private static updateParameterHistory(
    patternType: PatternType,
    parameters: PatternDetectionParameters
  ): void {
    try {
      const histories = this.getFeedbackHistories();
      
      // Find histories for this pattern type
      const relevantHistories = histories.filter(h => {
        const matchingFeedback = h.feedbackEntries.find(
          f => f.originalPatternType === patternType || f.correctedPatternType === patternType
        );
        return !!matchingFeedback;
      });
      
      // Add parameter update to each relevant history
      const parameterUpdate = {
        version: this.generateVersionString(),
        parameters,
        timestamp: Date.now()
      };
      
      for (const history of relevantHistories) {
        history.patternEvolution.push(parameterUpdate);
      }
      
      // Save updated histories
      localStorage.setItem(STORAGE_KEYS.FEEDBACK_HISTORY, JSON.stringify(histories));
    } catch (error) {
      logDebug('DEBUG_UI', 'Error updating parameter history:', error);
    }
  }
  
  /**
   * Get all feedback histories
   */
  public static getFeedbackHistories(): PatternFeedbackHistory[] {
    try {
      const storedHistories = localStorage.getItem(STORAGE_KEYS.FEEDBACK_HISTORY);
      if (!storedHistories) {
        return [];
      }
      
      const histories = JSON.parse(storedHistories);
      
      // Convert string dates to Date objects
      return histories.map((history: any) => ({
        ...history,
        feedbackEntries: history.feedbackEntries.map((feedback: any) => ({
          ...feedback,
          createdAt: new Date(feedback.createdAt || feedback.submittedAt),
          updatedAt: new Date(feedback.updatedAt || feedback.submittedAt),
          boundaryAdjustment: {
            ...feedback.boundaryAdjustment,
            originalStart: new Date(feedback.boundaryAdjustment.originalStart),
            originalEnd: new Date(feedback.boundaryAdjustment.originalEnd),
            correctedStart: feedback.boundaryAdjustment.correctedStart ? 
                          new Date(feedback.boundaryAdjustment.correctedStart) : null,
            correctedEnd: feedback.boundaryAdjustment.correctedEnd ? 
                        new Date(feedback.boundaryAdjustment.correctedEnd) : null
          }
        }))
      }));
    } catch (error) {
      logDebug('DEBUG_UI', 'Error loading feedback histories from storage:', error);
      return [];
    }
  }
  
  /**
   * Get feedback history for a specific pattern
   */
  public static getFeedbackHistoryByPatternId(patternId: string): PatternFeedbackHistory | null {
    const histories = this.getFeedbackHistories();
    return histories.find(h => h.patternId === patternId) || null;
  }
  
  /**
   * Generate a version string for parameter updates
   */
  private static generateVersionString(): string {
    const now = new Date();
    const datePart = `${now.getFullYear()}${(now.getMonth() + 1).toString().padStart(2, '0')}${now.getDate().toString().padStart(2, '0')}`;
    const timePart = `${now.getHours().toString().padStart(2, '0')}${now.getMinutes().toString().padStart(2, '0')}`;
    
    return `v${datePart}.${timePart}`;
  }
  
  /**
   * Clear all feedback data (for testing/reset)
   */
  public static clearAllData(): void {
    localStorage.removeItem(STORAGE_KEYS.FEEDBACK);
    localStorage.removeItem(STORAGE_KEYS.PARAMETERS);
    localStorage.removeItem(STORAGE_KEYS.FEEDBACK_HISTORY);
  }

  public static setConsent(consent: boolean): void {
    localStorage.setItem('storageConsent', consent.toString());
  }
}
