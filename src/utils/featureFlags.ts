// src/utils/featureFlags.ts
// Client feature flag utility
// Toggles experimental features
type FeatureFlag = {
  id: string;
  enabled: boolean;
  description: string;
};

// Feature flags for UI enhancements
const FEATURE_FLAGS: Record<string, FeatureFlag> = {
  NEW_LAYOUT: {
    id: 'NEW_LAYOUT',
    enabled: true, // Enable the new layout wrappers
    description: 'Use the new semantic layout wrappers for better organization',
  },
  ENHANCED_CHART_CONTROLS: {
    id: 'ENHANCED_CHART_CONTROLS',
    enabled: false, // Phase 2 feature
    description: 'Enhanced chart controls with better interaction patterns',
  },
  CONTEXT_MENUS: {
    id: 'CONTEXT_MENUS',
    enabled: false, // Phase 2 feature
    description: 'Right-click context menus for chart interactions',
  },
};

export const isFeatureEnabled = (featureId: string): boolean => {
  return !!FEATURE_FLAGS[featureId]?.enabled;
};

export default FEATURE_FLAGS;
