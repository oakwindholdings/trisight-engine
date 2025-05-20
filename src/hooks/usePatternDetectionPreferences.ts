import { useState, useEffect } from 'react';
import { PatternType } from '../models/PatternTypes';

export interface PatternDetectionPreferences {
  enabledPatternTypes: PatternType[];
  diagnosticsEnabled: boolean;
  adaptiveThresholds: boolean;
  feedbackEnabled: boolean;
  patternOptions: Record<string, any>; // Store pattern-specific options
}

const defaultPreferences: PatternDetectionPreferences = {
  enabledPatternTypes: Object.values(PatternType),
  diagnosticsEnabled: false,
  adaptiveThresholds: true,
  feedbackEnabled: true,
  patternOptions: {} // Initialize empty pattern options
};

/**
 * Hook for managing pattern detection preferences
 * Stores preferences in localStorage and provides methods to update them
 */
export const usePatternDetectionPreferences = () => {
  const [preferences, setPreferences] = useState<PatternDetectionPreferences>(defaultPreferences);
  const [initialized, setInitialized] = useState(false);

  // Load preferences from localStorage on mount
  useEffect(() => {
    try {
      const storedPreferences = localStorage.getItem('patternDetectionPreferences');
      if (storedPreferences) {
        setPreferences(JSON.parse(storedPreferences));
      }
      setInitialized(true);
    } catch (error) {
      console.error('Error loading pattern detection preferences:', error);
      setInitialized(true);
    }
  }, []);

  // Save preferences to localStorage when they change
  useEffect(() => {
    if (initialized) {
      try {
        localStorage.setItem('patternDetectionPreferences', JSON.stringify(preferences));
      } catch (error) {
        console.error('Error saving pattern detection preferences:', error);
      }
    }
  }, [preferences, initialized]);

  // Toggle a specific pattern type
  const togglePatternType = (patternType: PatternType) => {
    setPreferences(prev => {
      const isEnabled = prev.enabledPatternTypes.includes(patternType);
      return {
        ...prev,
        enabledPatternTypes: isEnabled
          ? prev.enabledPatternTypes.filter(type => type !== patternType)
          : [...prev.enabledPatternTypes, patternType]
      };
    });
  };

  // Set all pattern types enabled/disabled
  const setAllPatternTypes = (enabled: boolean) => {
    setPreferences(prev => ({
      ...prev,
      enabledPatternTypes: enabled ? Object.values(PatternType) : []
    }));
  };

  // Toggle diagnostics
  const toggleDiagnostics = () => {
    setPreferences(prev => ({
      ...prev,
      diagnosticsEnabled: !prev.diagnosticsEnabled
    }));
  };

  // Toggle adaptive thresholds
  const toggleAdaptiveThresholds = () => {
    setPreferences(prev => ({
      ...prev,
      adaptiveThresholds: !prev.adaptiveThresholds
    }));
  };

  // Toggle feedback system
  const toggleFeedback = () => {
    setPreferences(prev => ({
      ...prev,
      feedbackEnabled: !prev.feedbackEnabled
    }));
  };

  // Get pattern-specific options
  const getPatternOptions = (patternId: string) => {
    return preferences.patternOptions[patternId] || {};
  };

  // Update pattern-specific options
  const updatePatternOptions = (patternId: string, options: any) => {
    setPreferences(prev => ({
      ...prev,
      patternOptions: {
        ...prev.patternOptions,
        [patternId]: {
          ...prev.patternOptions[patternId],
          ...options
        }
      }
    }));
  };

  return {
    preferences,
    initialized,
    togglePatternType,
    setAllPatternTypes,
    toggleDiagnostics,
    toggleAdaptiveThresholds,
    toggleFeedback,
    getPatternOptions,
    updatePatternOptions
  };
};
