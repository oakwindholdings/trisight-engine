export const ThemeTokens = {
  colors: {
    // Primary color palette
    primary: '#0A2647',        // Deep blue for app chrome/framework
    primaryHover: '#0D3359',
    primaryActive: '#061A33',
    
    // Secondary palette
    secondary: '#144272',      // Cerulean for interaction elements
    secondaryHover: '#1A5494',
    secondaryActive: '#0E3155',
    
    // Accent palette
    accent: '#FFA500',         // Gold for highlighting patterns/selections
    accentHover: '#FFB124',
    accentActive: '#E69500',
    
    // Neutral palette (dark mode)
    background: '#121212',
    surface: '#1E1E1E',
    surfaceHover: '#2A2A2A',
    surfaceActive: '#323232',
    
    // Text colors
    textPrimary: '#EFEFEF',
    textSecondary: '#A0A0A0',
    textDisabled: '#666666',
    textOnAccent: '#000000',
    
    // Border and dividers
    border: '#333333',
    divider: '#292929',
    
    // Form elements
    inputBackground: '#2A2A2A',
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
