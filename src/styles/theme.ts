// src/styles/theme.ts
// Design tokens for styling
// Colors and spacing for UI
export const ThemeTokens = {
  colors: {
    // Primary color palette
    primary: '#2196f3',        // Blue for app chrome/framework
    primaryHover: '#1976d2',
    primaryActive: '#1565c0',
    
    // Secondary palette
    secondary: '#757575',      // Grey for interaction elements
    secondaryHover: '#616161',
    secondaryActive: '#424242',
    
    // Accent palette
    accent: '#FFA500',         // Gold for highlighting patterns/selections
    accentHover: '#FFB124',
    accentActive: '#E69500',
    
    // Neutral palette (light mode)
    background: '#f5f5f5',
    surface: '#ffffff',
    surfaceHover: '#f9f9f9',
    surfaceActive: '#e0e0e0',
    
    // Text colors
    textPrimary: '#212121',
    textSecondary: '#757575',
    textDisabled: '#9e9e9e',
    textOnAccent: '#000000',
    
    // Border and dividers
    border: '#e0e0e0',
    divider: '#e0e0e0',
    
    // Form elements
    inputBackground: '#ffffff',
    white: '#FFFFFF',
    
    // Alert colors
    success: '#4CAF50',
    warning: '#FF9800',
    danger: '#F44336',
  },
  
  spacing: {
    xsmall: '4px',
    small: '8px',
    medium: '12px',
    large: '16px',
    xlarge: '24px',
    xxlarge: '32px',
  },
  
  typography: {
    fontFamily: {
      primary: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
      monospace: "'IBM Plex Mono', monospace",
    },
    size: {
      xsmall: '10px',
      small: '12px',
      medium: '14px',
      large: '16px',
      xlarge: '20px',
      xxlarge: '24px',
    },
    weight: {
      regular: 400,
      medium: 500,
      semibold: 600,
      bold: 700,
    },
  },
  
  borderRadius: {
    small: '4px',
    medium: '6px',
    large: '8px',
    circle: '50%',
  },
  
  shadows: {
    small: '0 2px 4px rgba(0, 0, 0, 0.2)',
    medium: '0 4px 8px rgba(0, 0, 0, 0.2)',
    large: '0 8px 16px rgba(0, 0, 0, 0.2)',
  },
  
  zIndex: {
    base: 0,
    above: 1,
    dropdown: 10,
    modal: 100,
    toast: 1000,
  },
  
  transition: {
    default: '0.2s ease-in-out',
    fast: '0.1s ease-in-out',
    slow: '0.3s ease-in-out',
  },
};

export default ThemeTokens;
