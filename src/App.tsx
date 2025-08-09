// src/App.tsx
// Main application component
// NOTE: supports DEBUG_UI channel
// Composes TriSight interface
import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import styled from 'styled-components';
import './App.css';
import './styles/globals.css';
import { logDebug } from './utils/debug';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { HTMLReportTemplate } from './components/Reports/HTMLReportTemplate';

import { ChartProvider } from './contexts/ChartContext';
// Removed react-datepicker - using HTML5 date input instead
import mainGridStyles from './styles/MainGrid.module.css';

// Import components
import SymbolSearch from './components/SymbolSearch';
import PatternSelector from './components/Patterns/PatternSelector';
import ChartWithContext from './components/Chart/ChartWithContext';
import { InfiniteZoomChartRef } from './components/Chart/InfiniteZoomChart';
import FeedbackModalWithContext from './components/Feedback/FeedbackModalWithContext';
import LearningDashboard from './components/Dashboard/LearningDashboard';
import PatternDetailsModal from './components/Modals/PatternDetailsModal';
import { DynamicPatternAnalysisModal } from './components/Feedback/DynamicPatternAnalysisModal';
import { ConsentModal } from './components/privacy/ConsentModal';
import { usePrivacyConsent } from './hooks/usePrivacyConsent';
import { TargetReportTable } from './components/TargetReportTable'; // Dick's TriSight Target Report Table with actual formulas
import TargetsPage from './pages/TargetsPage'; // Dedicated Targets page for independent mounting
import ReportsPage from './pages/ReportsPage'; // World-class report generation command center

// Import components
import ContextBar from './components/Navigation/ContextBar';
import { TopNav } from './components/Navigation/TopNav';
import ChartWorkspace from './components/Chart/ChartWorkspace';
import ChartControlBar from './components/Chart/ChartControlBar';
import PatternPanel from './components/Patterns/PatternPanel';
import AnalysisPanel from './components/Analysis/AnalysisPanel';

import SettingsPanel from './components/Settings/SettingsPanel';
import { TimeRangeOption } from './components/Chart/TimeRangeSelector';
import { SupabaseTestPanel } from './components/SupabaseTestPanel';
import { FeedSidebar } from './feed/components/FeedSidebar';

// Import context providers
import AppProviders from './components/AppProviders';
import { useMarketDataContext } from './contexts/MarketDataContext';
import { usePatternContext } from './contexts/PatternContext';

// Import feature flags
import { isFeatureEnabled } from './utils/featureFlags';

// Import types
import { Pattern } from './models/PatternTypes';
import { TradeActionBus } from './utils/trading/TradeActionSignal';

import { evaluateAllPatterns } from './utils/patternHydration';

// Import hooks
import useTwelveDataApiKey from './hooks/useTwelveDataApiKey';

// Import types
import { SymbolRanking } from './types/SymbolRanking';

// Styled components


// Constants for localStorage keys
const STORAGE_KEY_DATE = 'trisight_selected_date';
const STORAGE_KEY_CHART_HEIGHT = 'trisight_chart_height';
const STORAGE_KEY_TRADING_HOURS = 'trisight_trading_hours_only';
const STORAGE_KEY_TIMEFRAME = 'selectedTimeframe';
const STORAGE_KEY_TIME_RANGE = 'selectedTimeRange';
const STORAGE_KEY_SYMBOL = 'selectedSymbol';
const STORAGE_KEY_SHOW_RIGHT_PANEL = 'trisight_show_right_panel';
const STORAGE_KEY_SHOW_BOTTOM_TABLE = 'trisight_show_bottom_table';
const STORAGE_KEY_GOLDEN_CANDLE_FILTER = 'trisight_golden_candle_filter';

// Helper function to get saved date from localStorage
const getSavedDate = (): Date => {
  try {
    const savedDate = localStorage.getItem(STORAGE_KEY_DATE);
    if (savedDate) {
      const parsedDate = new Date(savedDate);
      // Check if the parsed date is valid
      if (!isNaN(parsedDate.getTime())) {
        return parsedDate;
      }
    }
  } catch (e) {
    logDebug('DEBUG_SETTINGS', 'Error loading saved date from localStorage:', e);
  }
  
  // Default to the last trading day if no saved date or error
  const today = new Date();
  const day = today.getDay(); // 0 = Sunday, 6 = Saturday
  
  // If today is Sunday, go back to Friday
  if (day === 0) {
    const friday = new Date(today);
    friday.setDate(today.getDate() - 2);
    return friday;
  }
  
  // If today is Saturday, go back to Friday
  if (day === 6) {
    const friday = new Date(today);
    friday.setDate(today.getDate() - 1);
    return friday;
  }
  
  return today;
};

// Helper function to get saved chart height from localStorage
const getSavedChartHeight = (): number => {
  try {
    const savedHeight = localStorage.getItem(STORAGE_KEY_CHART_HEIGHT);
    if (savedHeight) {
      const parsedHeight = parseInt(savedHeight, 10);
      if (!isNaN(parsedHeight) && parsedHeight >= 200 && parsedHeight <= 2000) {
        return parsedHeight;
      }
    }
  } catch (e) {
    logDebug('DEBUG_SETTINGS', 'Error loading saved chart height from localStorage:', e);
  }
  return 500; // Default height if no saved height or error
};

// Helper function to get saved Golden Candle filter state from localStorage
const getSavedGoldenCandleFilter = (): boolean => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY_GOLDEN_CANDLE_FILTER);
    return saved === 'true';
  } catch (e) {
    logDebug('DEBUG_SETTINGS', 'Error loading saved Golden Candle filter from localStorage:', e);
  }
  return false; // Default to false if no saved state or error
};

// Helper function to save chart height to localStorage
const saveChartHeight = (height: number): void => {
  try {
    localStorage.setItem(STORAGE_KEY_CHART_HEIGHT, height.toString());
  } catch (e) {
    logDebug('DEBUG_SETTINGS', 'Error saving chart height to localStorage:', e);
  }
};

// Debug API key presence
const debugApiKey = () => {
  const key = process.env.REACT_APP_TWELVE_DATA_API_KEY;
  logDebug('DEBUG_UI', 'API Key present:', key ? `Yes (${key.length} chars)` : 'NOT SET!');
  const API_KEY = process.env.REACT_APP_TWELVE_DATA_API_KEY;
  logDebug('DEBUG_UI', '[App] Starting TriSight with API key:', API_KEY ? 'CONFIGURED' : 'NOT SET');
};

// Legacy styled components - will be transitioned to CSS modules
const AppContainer = styled.div`
  display: flex;
  flex-direction: column;
  height: 100vh;
  background-color: var(--color-background);
  color: var(--color-text-primary);
  font-family: var(--font-family-primary);
`;

const Header = styled.header`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 24px;
  background-color: #2196f3;
  color: white;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
`;

const Title = styled.h1`
  font-size: 20px;
  font-weight: 500;
  margin: 0;
`;

const TabBar = styled.div`
  display: flex;
  background-color: white;
  border-bottom: 1px solid #e0e0e0;
`;

const Tab = styled.button<{ $active: boolean }>`
  padding: 12px 24px;
  background: ${props => props.$active ? '#f5f5f5' : 'transparent'};
  border: none;
  border-bottom: 2px solid ${props => props.$active ? '#2196f3' : 'transparent'};
  color: ${props => props.$active ? '#2196f3' : '#757575'};
  font-size: 16px;
  font-weight: ${props => props.$active ? '500' : 'normal'};
  cursor: pointer;
  transition: all 0.2s;
  
  &:hover {
    background-color: #f9f9f9;
  }
`;

const ContentArea = styled.main`
  flex: 1;
  padding: 24px;
  overflow-y: auto;
`;

const ChartContainer = styled.div<{ $chartHeight: number }>`
  height: ${props => props.$chartHeight}px;
  margin-bottom: 24px;
  background-color: white;
  border-radius: 4px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
`;

const ControlsContainer = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
`;

const ControlGroup = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
`;

const Label = styled.label`
  font-size: 14px;
  color: #616161;
`;

const HeightInput = styled.input`
  width: 80px;
  padding: 6px;
  border: 1px solid #e0e0e0;
  border-radius: 4px;
  font-size: 14px;
`;

const RefreshButton = styled.button`
  padding: 8px 16px;
  background-color: #2196f3;
  color: white;
  border: none;
  border-radius: 4px;
  font-size: 14px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 8px;
  
  &:hover {
    background-color: #1976d2;
  }
  
  &:disabled {
    background-color: #bdbdbd;
    cursor: not-allowed;
  }
`;

const Footer = styled.footer`
  padding: 12px 24px;
  background-color: #f5f5f5;
  border-top: 1px solid #e0e0e0;
  text-align: center;
  font-size: 12px;
  color: #757575;
`;

// Main App component with layout and routing
const App: React.FC = () => {
  // Check API key on app load
  React.useEffect(() => {
    debugApiKey();
  }, []);

  return (
    <AppProviders>
      <AppContent />
    </AppProviders>
  );
};

// Main App content component
function AppContent() {
  // Initialize API key from localStorage
  useTwelveDataApiKey();
  
  const { data, fetchDateRange, setIsUsingCustomRange, fetchSpecificDay, timeframe, setTimeframe } = useMarketDataContext(); 
  const { 
    patterns, 
    patternCounts, 
    selectedPattern, 
    setSelectedPattern, 
    detectPatterns, 
    goldmineQual,
    selectedPatternForFeedback,
    setSelectedPatternForFeedback,
    submitPatternFeedback
  } = usePatternContext();
  
  // Generate a simple user ID for the session
  const [userId] = useState(() => Math.random().toString(36).substring(2, 10));
  
  // Initialize activeTab based on URL path
  const getInitialTab = (): 'chart' | 'dashboard' | 'targets' | 'reports' => {
    const path = window.location.pathname;
    if (path === '/dashboard') return 'dashboard';
    if (path === '/targets') return 'targets';
    if (path === '/reports') return 'reports';
    return 'chart';
  };
  
  const [activeTab, setActiveTab] = useState<'chart' | 'dashboard' | 'targets' | 'reports'>(getInitialTab());
  
  // Handle browser navigation (back/forward buttons)
  useEffect(() => {
    const handlePopState = () => {
      const tab = getInitialTab();
      setActiveTab(tab);
    };
    
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);
  
  // Debug render
  console.log('[App] Component rendering, selectedPatternForFeedback:', {
    pattern: selectedPatternForFeedback,
    type: selectedPatternForFeedback?.type,
    id: selectedPatternForFeedback?.id,
    timestamp: Date.now()
  });
  
  // Symbol selection state
  const [selectedSymbol, setSelectedSymbol] = useState(() => {
    const saved = localStorage.getItem(STORAGE_KEY_SYMBOL);
    return saved || 'AAPL';
  });
  
  // State for symbol rankings - initialize empty
  const [symbolRankings, setSymbolRankings] = useState<SymbolRanking[]>([]);
  
  // UI panel visibility state with localStorage persistence
  const [showRightPanel, setShowRightPanel] = useState(() => {
    const saved = localStorage.getItem(STORAGE_KEY_SHOW_RIGHT_PANEL);
    return saved !== null ? JSON.parse(saved) : true;
  });
  
  const [showBottomTable, setShowBottomTable] = useState(() => {
    const saved = localStorage.getItem(STORAGE_KEY_SHOW_BOTTOM_TABLE);
    return saved !== null ? JSON.parse(saved) : true;
  });
  
  // Custom date range state to track UI-selected dates
  const [customDateRange, setCustomDateRange] = useState<{ startDate: Date; endDate: Date } | null>(null);
  
  // Debug: Log when customDateRange changes
  useEffect(() => {
    logDebug('DEBUG_UI', '[App] customDateRange changed:', customDateRange ? {
      startDate: customDateRange.startDate.toISOString(),
      endDate: customDateRange.endDate.toISOString()
    } : 'null');
  }, [customDateRange]);
  
  // Calculate dynamic dimensions based on panel visibility
  const [dimensions, setDimensions] = useState(() => ({
    width: window.innerWidth - (showRightPanel ? 284 : 48),
    height: window.innerHeight - (showBottomTable ? 400 : 200) // Adjust for header and optional bottom table
  }));
  
  // Update dimensions when panels toggle or window resizes
  useEffect(() => {
    const updateDimensions = () => {
      const newWidth = window.innerWidth - (showRightPanel ? 284 : 48);
      const newHeight = window.innerHeight - (showBottomTable ? 400 : 200);
      setDimensions({ width: newWidth, height: newHeight });
      logDebug('DEBUG_UI', '[UI] Updated chart dimensions:', { width: newWidth, height: newHeight });
    };
    
    // Update immediately
    updateDimensions();
    
    // Handle window resize
    window.addEventListener('resize', updateDimensions);
    return () => window.removeEventListener('resize', updateDimensions);
  }, [showRightPanel, showBottomTable]);
  
  // Handle right panel toggle
  const handleToggleRightPanel = useCallback(() => {
    setShowRightPanel((prev: boolean) => {
      const newValue = !prev;
      localStorage.setItem(STORAGE_KEY_SHOW_RIGHT_PANEL, JSON.stringify(newValue));
      logDebug('DEBUG_UI', '[UI] Toggled Right Panel: ' + newValue);
      
      // Force chart redraw by triggering resize event
      setTimeout(() => {
        window.dispatchEvent(new Event('resize'));
        logDebug('DEBUG_UI', '[UI] Dispatched resize event for chart redraw');
      }, 0);
      
      return newValue;
    });
  }, []);
  
  // Handle bottom table toggle
  const handleToggleBottomTable = useCallback(() => {
    setShowBottomTable((prev: boolean) => {
      const newValue = !prev;
      localStorage.setItem(STORAGE_KEY_SHOW_BOTTOM_TABLE, JSON.stringify(newValue));
      logDebug('DEBUG_UI', '[UI] Toggled Bottom Table: ' + newValue);
      
      // Force chart redraw by triggering resize event
      setTimeout(() => {
        window.dispatchEvent(new Event('resize'));
        logDebug('DEBUG_UI', '[UI] Dispatched resize event for chart redraw');
      }, 0);
      
      return newValue;
    });
  }, []);
  
  // Handle symbol select
  const handleSymbolSelect = useCallback((symbol: string) => {
    logDebug('DEBUG_UI', '[App] handleSymbolSelect called with: ' + symbol);
    setSelectedSymbol(symbol);
    localStorage.setItem(STORAGE_KEY_SYMBOL, symbol);
    
    // Check if symbol already exists in rankings
    const symbolExists = symbolRankings.some(ranking => ranking.symbol === symbol);
    
    if (!symbolExists) {
      logDebug('DEBUG_UI', '[App] Adding new symbol to rankings: ' + symbol);
      // Create a new ranking entry for the symbol with default values
      const newRanking: SymbolRanking = {
        symbol: symbol,
        riskRating: Math.floor(Math.random() * 60) + 20, // Random between 20-80
        tractionRating: Math.floor(Math.random() * 60) + 20,
        strengthRating: Math.floor(Math.random() * 60) + 20,
        timingRating: Math.floor(Math.random() * 60) + 20,
        businessModelRatio: Math.round((Math.random() * 2 + 1) * 10) / 10, // 1.0-3.0
        acceleration: Math.round((Math.random() * 5 + 1) * 10) / 10, // 1.0-6.0
        sectorRating: Math.floor(Math.random() * 60) + 20,
        currentPrice: Math.round(Math.random() * 900 * 100) / 100 + 10 // 10-910
      };
      
      setSymbolRankings(prevRankings => [...prevRankings, newRanking]);
    }
  }, [symbolRankings]);
  
  // Type-safe tab change handler
  const handleTabChange = (tab: 'chart' | 'dashboard' | 'targets' | 'reports') => {
    setActiveTab(tab);
    // Update URL to match the selected tab
    const path = tab === 'chart' ? '/' : `/${tab}`;
    window.history.pushState({}, '', path);
  };
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [chartHeight, setChartHeight] = useState(getSavedChartHeight());
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedDate, setSelectedDate] = useState(getSavedDate());
  
  // Privacy consent for pattern feedback
  const { hasConsent, showConsentModal, requestConsent, setShowConsentModal } = usePrivacyConsent();
  
  // Debug selectedPatternForFeedback changes - add deep comparison
  useEffect(() => {
    console.log('[App] selectedPatternForFeedback effect triggered:', {
      pattern: selectedPatternForFeedback,
      type: selectedPatternForFeedback?.type,
      id: selectedPatternForFeedback?.id,
      timestamp: Date.now()
    });
  }, [selectedPatternForFeedback?.id, selectedPatternForFeedback?.type]); // Use specific properties to ensure updates
  
  // Local state for pattern analysis modal
  const [showPatternAnalysisModal, setShowPatternAnalysisModal] = useState(false);
  const [analysisPattern, setAnalysisPattern] = useState<Pattern | null>(null);
  
  // Sync with context - use specific properties to ensure updates
  useEffect(() => {
    console.log('[App] Modal sync useEffect triggered:', {
      pattern: selectedPatternForFeedback,
      type: selectedPatternForFeedback?.type,
      id: selectedPatternForFeedback?.id,
      timestamp: Date.now()
    });
    if (selectedPatternForFeedback && selectedPatternForFeedback.id) {
      console.log('[App] Opening pattern analysis modal for:', selectedPatternForFeedback.type);
      console.log('[App] Setting showPatternAnalysisModal to true');
      setShowPatternAnalysisModal(true);
      setAnalysisPattern(selectedPatternForFeedback);
      console.log('[App] State after update - showPatternAnalysisModal will be true on next render');
    } else {
      console.log('[App] Closing pattern analysis modal');
      setShowPatternAnalysisModal(false);
      setAnalysisPattern(null);
    }
  }, [selectedPatternForFeedback]); // Use the whole object to ensure any change triggers
  
  // Initialize selectedDate to the last trading day
  useEffect(() => {
    const today = new Date();
    
    // Clear any lingering selected pattern on mount
    logDebug('DEBUG_UI', '[App] Clearing selectedPattern on mount');
    setSelectedPattern(null);
    setShowFeedbackModal(false);
    
    // Check if today is Saturday or Sunday
    const dayOfWeek = today.getDay();
    if (dayOfWeek === 0) { // Sunday
      // Go back to Friday
      today.setDate(today.getDate() - 2);
    } else if (dayOfWeek === 6) { // Saturday
      // Go back to Friday
      today.setDate(today.getDate() - 1);
    }
    
    // Set time to 4 PM ET (end of trading day)
    today.setHours(16, 0, 0, 0);
    
    // Only update if different from current selectedDate
    if (selectedDate.getTime() !== today.getTime()) {
      setSelectedDate(today);
    }
  }, []); // Empty dependency array - run only on mount
  
  // Handle pattern selection
  const handlePatternSelect = (pattern: Pattern | null) => {
    logDebug('DEBUG_UI', '[App] handlePatternSelect called with pattern:', pattern);
    setSelectedPattern(pattern);
    if (pattern) {
      logDebug('DEBUG_UI', '[App] Setting showFeedbackModal to true');
      setShowFeedbackModal(true);
    }
  };
  
  // Handle chart height change
  const handleChartHeightChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newHeight = parseInt(event.target.value, 10);
    if (!isNaN(newHeight) && newHeight >= 200 && newHeight <= 2000) {
      setChartHeight(newHeight);
      saveChartHeight(newHeight);
    }
  };
  
  // Handle date change
  const handleDateChange = (date: Date | null) => {
    if (date) {
      setSelectedDate(date);
      // Save to localStorage
      localStorage.setItem(STORAGE_KEY_DATE, date.toISOString());
    }
  };
  
  // Handle feedback modal close
  const handleFeedbackModalClose = () => {
    logDebug('DEBUG_UI', '[App] Closing feedback modal and clearing selectedPattern');
    setShowFeedbackModal(false);
    setSelectedPattern(null); // Clear selected pattern when closing modal
  };
  
  // Refresh pattern detection
  const handleRefreshPatterns = () => {
    if (data.length > 0) {
      setIsRefreshing(true);
      // Short timeout to allow UI to update
      setTimeout(() => {
        detectPatterns(data);
        setIsRefreshing(false);
      }, 100);
    }
  };
  
  // Calculate total patterns detected
  const totalPatterns = Object.values(patternCounts).reduce(
    (sum, count) => sum + count,
    0
  );
  
  // State for UI interactions specific to new components
  const [showTradingHoursOnly, setShowTradingHoursOnly] = useState(() => {
    try {
      const savedSetting = localStorage.getItem(STORAGE_KEY_TRADING_HOURS);
      return savedSetting === null ? true : savedSetting === 'true';
    } catch (e) {
      logDebug('DEBUG_SETTINGS', 'Failed to load trading hours setting from localStorage:', e);
      return true; // Default to true if there's an error
    }
  });
  
  // Initialize active time range from localStorage or default to 1D
  const [activeTimeRange, setActiveTimeRange] = useState<TimeRangeOption>(() => {
    try {
      const savedTimeRange = localStorage.getItem(STORAGE_KEY_TIME_RANGE) as TimeRangeOption;
      return savedTimeRange || '1D';
    } catch (e) {
      logDebug('DEBUG_SETTINGS', 'Failed to load time range from localStorage:', e);
      return '1D';
    }
  });
  
  logDebug('DEBUG_UI', `AppContent render - activeTimeRange: ${activeTimeRange}, activeTab: ${activeTab}`);
  logDebug('DEBUG_UI', `About to check activeTab === 'chart': ${activeTab === 'chart'}`);
  logDebug('DEBUG_UI', `Chart should render: ${activeTab === 'chart'}`);
  
  // Debug which chart component will render
  if (activeTab === 'chart') {
    logDebug('DEBUG_UI', `Chart tab is active. Will render ChartWithContext`);
  }
  
  // Viewport state for chart controls
  const [viewportState] = useState({
    autoScaled: false,
    resetView: false
  });
  
  // Pattern filters state
  const [patternFilters, setPatternFilters] = useState({
    successRate: 0,
    timeframe: 'all',
    patternType: 'all',
    showOnlyGoldenCandles: getSavedGoldenCandleFilter()
  });
  
  // Apply Golden Candle filter to patterns
  const filteredPatterns = useMemo(() => {
    if (!patternFilters.showOnlyGoldenCandles || !goldmineQual?.length || !data?.length) {
      return patterns;
    }
    
    // Filter patterns to only show those that correspond to Golden Candles
    return patterns.filter(pattern => {
      // Find the candle index that corresponds to this pattern's start time
      const patternStartTime = pattern.startTime.getTime();
      const candleIndex = data.findIndex(candle => 
        new Date(candle.timestamp).getTime() >= patternStartTime
      );
      
      // Check if the pattern corresponds to a Golden Candle
      if (candleIndex >= 0 && candleIndex < goldmineQual.length) {
        return goldmineQual[candleIndex];
      }
      return false;
    });
  }, [patterns, patternFilters.showOnlyGoldenCandles, goldmineQual, data]);
  
  // Handle timeframe change
  const handleTimeframeChange = (newTimeframe: string) => {
    logDebug('DEBUG_UI', `[App] handleTimeframeChange: ${newTimeframe}`);
    
    // Map the dropdown value to the correct timeframe
    const timeframeMap: { [key: string]: string } = {
      '1m': '1min',
      '5m': '5min',
      '15m': '15min',
      '30m': '30min',
      '1h': '1hour',
      '1D': '1day'
    };
    
    const mappedTimeframe = timeframeMap[newTimeframe] || newTimeframe;
    setTimeframe(mappedTimeframe as any); // Use setTimeframe from MarketDataContext
    localStorage.setItem(STORAGE_KEY_TIMEFRAME, mappedTimeframe);
  };
  
  // Handle filter change
  const handleFilterChange = (filters: any) => {
    setPatternFilters(filters);
    
    // Save Golden Candle filter state to localStorage for persistence
    if (filters.hasOwnProperty('showOnlyGoldenCandles')) {
      try {
        localStorage.setItem(STORAGE_KEY_GOLDEN_CANDLE_FILTER, filters.showOnlyGoldenCandles.toString());
      } catch (e) {
        logDebug('DEBUG_SETTINGS', 'Error saving Golden Candle filter to localStorage:', e);
      }
    }
    
    logDebug('DEBUG_UI', 'Pattern filters updated:', filters);
  };
  
  // Handle trading hours toggle
  const handleTradingHoursToggle = () => {
    const newValue = !showTradingHoursOnly;
    setShowTradingHoursOnly(newValue);
    
    // Save to localStorage for persistence across sessions
    try {
      localStorage.setItem(STORAGE_KEY_TRADING_HOURS, newValue.toString());
    } catch (e) {
      logDebug('DEBUG_SETTINGS', 'Failed to save trading hours setting to localStorage:', e);
    }
  };
  
  // Handle auto-scale
  const handleAutoScale = () => {
    logDebug('DEBUG_UI', '[App] Auto-scale triggered');
    if (chartRef.current?.autoScale) {
      chartRef.current.autoScale();
    }
  };
  
  // Handle reset view
  const handleResetView = () => {
    logDebug('DEBUG_UI', '[App] Reset view triggered');
    if (chartRef.current?.resetView) {
      chartRef.current.resetView();
    }
  };
  
  // Handle time range selection
  const handleTimeRangeSelect = (range: TimeRangeOption, startDate: Date, endDate: Date) => {
    logDebug('DEBUG_UI', `Changing time range to: ${range}`, { startDate, endDate });
    
    // Adjust end date to last trading day if it's a weekend
    const adjustedEndDate = new Date(endDate);
    const dayOfWeek = adjustedEndDate.getDay();
    if (dayOfWeek === 0) { // Sunday
      // Go back to Friday
      adjustedEndDate.setDate(adjustedEndDate.getDate() - 2); // Go back to Friday
    } else if (dayOfWeek === 6) { // Saturday
      // Go back to Friday
      adjustedEndDate.setDate(adjustedEndDate.getDate() - 1); // Go back to Friday
    }
    
    logDebug('DEBUG_UI', 'Adjusted dates for fetch:', { startDate, endDate: adjustedEndDate });
    
    // Save to localStorage for persistence across sessions
    try {
      localStorage.setItem(STORAGE_KEY_TIME_RANGE, range);
    } catch (e) {
      logDebug('DEBUG_SETTINGS', 'Failed to save time range to localStorage:', e);
    }
    
    // Update state
    setActiveTimeRange(range);
    setSelectedDate(startDate); // Update the selected date to the start date of the range
    
    // Adjust timeframe based on range for optimal view
    let newTimeframe = timeframe;
    let intervalForFetch: string = '5min'; // Default value
    
    if (range === '1D') {
      newTimeframe = '1min';
      intervalForFetch = '5min';
    } else if (range === '1W') {
      newTimeframe = '15min';
      intervalForFetch = '30min';
    } else if (range === '1M') {
      newTimeframe = '60min';
      intervalForFetch = '1h';
    } else if (range === '3M') {
      newTimeframe = '60min';
      intervalForFetch = '2h';
    } else if (range === 'YTD') {
      newTimeframe = '60min';
      intervalForFetch = '1day';
    }
    
    if (newTimeframe !== timeframe) {
      setTimeframe(newTimeframe);
      try {
        localStorage.setItem(STORAGE_KEY_TIMEFRAME, newTimeframe);
      } catch (e) {
        logDebug('DEBUG_SETTINGS', 'Failed to save timeframe to localStorage:', e);
      }
    }
    
    // Fetch data based on the selected time range
    if (range === '1D') {
      logDebug('DEBUG_UI', 'App - Fetching data for 1D range');
      setIsUsingCustomRange(false);
      fetchSpecificDay(startDate);
    } else {
      logDebug('DEBUG_UI', `App - Fetching data for ${range} range`, { startDate, endDate: adjustedEndDate, intervalForFetch });
      // Ensure we fetch date range data for multi-day ranges
      const fetchDataForRange = async () => {
        await fetchDateRange(startDate, adjustedEndDate, intervalForFetch);
      };
      fetchDataForRange();
    }
  };
  
  // Handle settings toggle
  const handleSettingsToggle = () => {
    setShowSettingsPanel(!showSettingsPanel);
    logDebug('DEBUG_UI', 'Settings toggled: ' + !showSettingsPanel);
  };

  // Handle save pattern
  const handleSavePattern = () => {
    if (selectedPattern) {
      logDebug('DEBUG_UI', 'Saving pattern:', selectedPattern);
      // TODO: Implement pattern saving logic
      logDebug('DEBUG_UI', 'Pattern saved: ' + selectedPattern.id);
    }
  };

  // UI state for panels and modals
  const [showSettingsPanel, setShowSettingsPanel] = useState(false);

  // Refs
  const chartRef = useRef<InfiniteZoomChartRef>(null);

  // Handle zoom to fit
  const handleZoomToFit = useCallback(() => {
    if (chartRef.current?.zoomToFit) {
      chartRef.current.zoomToFit();
    }
  }, []);

  // MODULAR PDF GENERATION using parallel section fetching
  const generatePDFReport = useCallback(async () => {
    try {
      console.log('🚀 Starting modular PDF generation...');

      // Get current ticker from the app state
      const ticker = selectedSymbol || 'AAPL';

      // Get custom prompts from localStorage or state
      const customPrompts = JSON.parse(localStorage.getItem('reportPrompts') || '{}');

      // Parallel fetch all sections - each has its own 10-second timeout
      const sectionRequests = [
        {
          name: 'Market Overview',
          endpoint: '/api/reports/sections/market-overview',
          customPrompt: customPrompts.marketOverview
        },
        {
          name: 'Financial Analysis',
          endpoint: '/api/reports/sections/financial-analysis',
          customPrompt: customPrompts.financialAnalysis
        },
        {
          name: 'Technical Analysis',
          endpoint: '/api/reports/sections/technical-analysis',
          customPrompt: customPrompts.technicalAnalysis
        }
      ];

      console.log('📊 Fetching all sections in parallel...');

      const sectionPromises = sectionRequests.map(async (section) => {
        try {
          console.log(`  → Fetching ${section.name}...`);
          const response = await fetch(section.endpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              ticker: ticker,
              customPrompt: section.customPrompt
            })
          });

          if (!response.ok) throw new Error(`Failed: ${response.status}`);

          const data = await response.json();
          console.log(`  ✅ ${section.name} complete`);
          return data;

        } catch (error) {
          console.error(`  ❌ ${section.name} failed:`, error);
          return {
            success: false,
            section: section.name.toLowerCase().replace(' ', '-'),
            error: error.message
          };
        }
      });

      // Wait for all sections to complete
      const sections = await Promise.allSettled(sectionPromises);

      // Combine successful sections into report format
      const combinedReport = {
        success: true,
        reportId: `modular-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        ticker: ticker,
        title: `${ticker} Intelligent Analysis`,
        slides: [],
        charts: [],
        aiAnalysis: {},
        rawData: {},
        dataStatus: {},
        metadata: {
          generatedAt: new Date().toISOString(),
          sectionsCompleted: 0,
          totalSections: sectionRequests.length
        }
      };

      // Process each section result
      sections.forEach((result, index) => {
        if (result.status === 'fulfilled' && result.value?.success) {
          const section = result.value;

          // Merge slides
          if (section.slides) {
            combinedReport.slides.push(...section.slides);
          }

          // Merge raw data
          if (section.rawData) {
            combinedReport.rawData = { ...combinedReport.rawData, ...section.rawData };
          }

          // Merge AI analysis
          if (section.aiAnalysis) {
            combinedReport.aiAnalysis = { ...combinedReport.aiAnalysis, ...section.aiAnalysis };
          }

          // Track status
          combinedReport.dataStatus[section.section] = { success: true };
          combinedReport.metadata.sectionsCompleted++;

        } else {
          const sectionName = sectionRequests[index].name;
          combinedReport.dataStatus[sectionName] = { success: false };
          console.warn(`Section ${sectionName} was not included in report`);
        }
      });

      const totalSections = combinedReport?.metadata?.totalSections ?? combinedReport?.slides?.length ?? 0;
      console.info(`📄 Generating PDF with ${totalSections}/${totalSections} sections...`);

      // Generate PDF using existing endpoint
      const pdfResponse = await fetch('/api/reports/generate-complete-pdf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reportData: combinedReport })
      });

      if (!pdfResponse.ok) {
        const errorText = await pdfResponse.text();
        throw new Error(`PDF generation failed: ${pdfResponse.statusText} - ${errorText}`);
      }

      console.log('📄 PDF generated successfully, downloading...');

      // Get PDF blob and download it
      const pdfBlob = await pdfResponse.blob();
      const url = URL.createObjectURL(pdfBlob);

      // Create download link
      const link = document.createElement('a');
      link.href = url;
      link.download = `${ticker}-complete-financial-analysis.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      // Clean up
      setTimeout(() => {
        URL.revokeObjectURL(url);
      }, 1000);

      console.log('🎉 Complete PDF downloaded successfully!');

    } catch (error) {
      console.error('❌ Complete PDF generation failed:', error);
      alert(`PDF generation failed: ${error.message}`);
    }
  }, [selectedSymbol]);

  // Debug: Check what's causing the click blocking
  useEffect(() => {
    logDebug('DEBUG_UI', '=== DEBUG UI BLOCKING ===');
    logDebug('DEBUG_UI', 'selectedPattern:', selectedPattern);
    logDebug('DEBUG_UI', 'showFeedbackModal:', showFeedbackModal);
    logDebug('DEBUG_UI', 'isFeatureEnabled(NEW_LAYOUT):', isFeatureEnabled('NEW_LAYOUT'));
    logDebug('DEBUG_UI', 'Modal should render:', !isFeatureEnabled('NEW_LAYOUT') && selectedPattern && !showFeedbackModal);
    
    // Check localStorage for feature flag
    const features = localStorage.getItem('features');
    logDebug('DEBUG_SETTINGS', 'Features in localStorage:', features);
    
    // Add a global click listener to debug
    const debugClickHandler = (e: MouseEvent) => {
      logDebug('DEBUG_UI', 'Global click detected:', {
        target: e.target,
        currentTarget: e.currentTarget,
        clientX: e.clientX,
        clientY: e.clientY,
        targetElement: (e.target as HTMLElement)?.tagName,
        targetClass: (e.target as HTMLElement)?.className,
      });
    };
    
    document.addEventListener('click', debugClickHandler, true);
    
    // Run click blocking diagnostic
    setTimeout(() => {
      // Removed unused import: debugClickBlocking
    }, 1000);
    
    return () => {
      document.removeEventListener('click', debugClickHandler, true);
    };
  }, [selectedPattern, showFeedbackModal]);

  // Initialize state from localStorage or defaults
  useEffect(() => {
    const savedHeight = getSavedChartHeight();
    if (savedHeight !== null) {
      setChartHeight(savedHeight);
    }
    
    // Clear any stale pattern selection on mount
    setSelectedPattern(null);
    setShowFeedbackModal(false);
    logDebug('DEBUG_UI', 'App mounted - cleared any stale selections');
  }, []);

  // Handle pattern selection from URL on component mount
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const patternParam = params.get('pattern');
    
    if (patternParam) {
      try {
        const pattern = JSON.parse(decodeURIComponent(patternParam));
        setSelectedPattern(pattern);
      } catch (error) {
        console.error('Failed to parse pattern from URL:', error);
      }
    }
  }, [setSelectedPattern]);

  // Auto-hydrate TradeActionBus when candle data changes
  useEffect(() => {
    if (data.length > 0) {
      logDebug('DEBUG_UI', `[App] Auto-hydrating TradeActionBus with ${data.length} candles`);
      evaluateAllPatterns(data);
      const signalCount = TradeActionBus.getSignals().length;
      logDebug('DEBUG_UI', `[App] TradeActionBus now contains ${signalCount} signals`);
    }
  }, [data]);

  // Update URL when pattern is selected
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    
    if (selectedPattern) {
      params.set('pattern', encodeURIComponent(JSON.stringify(selectedPattern)));
    } else {
      params.delete('pattern');
    }
    
    const newUrl = `${window.location.pathname}${params.toString() ? '?' + params.toString() : ''}`;
    window.history.replaceState({}, '', newUrl);
  }, [selectedPattern]);

  const ENABLE_FEED = process.env.REACT_APP_ENABLE_PATTERN_FEED !== 'false';

  return (
    <ChartProvider>
      {ENABLE_FEED && <FeedSidebar />}
      <div
        className={isFeatureEnabled('NEW_LAYOUT') ? mainGridStyles.mainGrid : 'app-container'}
        style={ENABLE_FEED ? { marginLeft: 300, width: 'calc(100% - 300px)' } : undefined}
      >
      {isFeatureEnabled('NEW_LAYOUT') ? (
        // New UI using wrapper components
        <>
          <TopNav activeTab={activeTab} onTabChange={handleTabChange} onGeneratePDF={generatePDFReport} />
          <div className={mainGridStyles.header}>
            <ContextBar
              selectedDate={selectedDate}
              onDateChange={handleDateChange}
              activeTab={activeTab}
              onTabChange={handleTabChange}
              onSettingsToggle={handleSettingsToggle}
              onSymbolSelect={handleSymbolSelect}
              onToggleRightPanel={handleToggleRightPanel}
              onToggleBottomTable={handleToggleBottomTable}
              showRightPanel={showRightPanel}
              showBottomTable={showBottomTable}
              onCustomDateRange={(start, end) => {
                logDebug('DEBUG_UI', '[App] onCustomDateRange called with:', { start, end });
                setCustomDateRange({ startDate: start, endDate: end });
              }}
            />
          </div>
          <div className={mainGridStyles.content}>
            {activeTab === 'chart' ? (
              <>
                <div className={`${mainGridStyles.chartGrid} ${!showRightPanel ? mainGridStyles.chartGridNoPanel : ''}`}>
                  <div className={mainGridStyles.chartArea}>
                    <ChartWorkspace
                      key={`chart-${showRightPanel}-${showBottomTable}`} // Force re-render when panels toggle
                      data={data}
                      patterns={filteredPatterns}
                      width={dimensions.width}
                      height={dimensions.height}
                      onPatternSelect={handlePatternSelect}
                      selectedPattern={selectedPattern}
                      timeframe={timeframe}
                      onTimeframeChange={handleTimeframeChange}
                      showTradingHoursOnly={showTradingHoursOnly}
                      onTradingHoursToggle={handleTradingHoursToggle}
                      onAutoScale={handleAutoScale}
                      onResetView={handleResetView}
                      autoScale={viewportState.autoScaled}
                      activeTimeRange={activeTimeRange}
                      onTimeRangeSelect={handleTimeRangeSelect}
                      selectedSymbol={selectedSymbol}
                    />
                  </div>
                  {showRightPanel && (
                    <div className={mainGridStyles.panel}>
                      {selectedPattern ? (
                        <AnalysisPanel
                          selectedPattern={selectedPattern}
                          onFeedbackClick={() => setShowFeedbackModal(true)}
                          onSaveClick={handleSavePattern}
                        />
                      ) : (
                        <PatternPanel
                          patterns={filteredPatterns}
                          selectedPattern={selectedPattern}
                          onPatternSelect={handlePatternSelect}
                          patternFilters={patternFilters}
                          onFilterChange={handleFilterChange}
                          chartHeight={chartHeight}
                          onChartHeightChange={(newHeight) => {
                            setChartHeight(newHeight);
                            saveChartHeight(newHeight); // Save to localStorage
                          }}
                        />
                      )}
                    </div>
                  )}
                </div>
              </>
            ) : activeTab === 'targets' ? (
              <TargetsPage />
            ) : activeTab === 'reports' ? (
              <ReportsPage />
            ) : (
              <LearningDashboard />
            )}
          </div>
          
          {/* Bottom Table - conditionally rendered based on showBottomTable state */}
          {showBottomTable && (
            <div style={{ 
              height: '200px', 
              borderTop: '1px solid #e5e7eb', 
              backgroundColor: '#ffffff',
              overflow: 'hidden'
            }}>
              <TargetReportTable
                patterns={filteredPatterns || []}
                escalatorSteps={[]}
                selectedSymbol={selectedSymbol}
                onSymbolSelect={(symbol) => {
                  setSelectedSymbol(symbol);
                  logDebug('DEBUG_UI', '[App] Symbol selected from target report table:', symbol);
                }}
                loading={false}
                customSymbols={[selectedSymbol].filter(Boolean)}
                scanning={false}
              />
            </div>
          )}
          
          <div className={mainGridStyles.footer}>
            TriSight Pattern Training Interface v2025.07.04.12.09 &copy; {new Date().getFullYear()}
          </div>
        </>
      ) : (
        // Legacy UI
        <AppContainer>
          <Header>
            <Title>TriSight Pattern Training Interface</Title>
            <SymbolSearch />
          </Header>
          <TabBar>
            <Tab 
              $active={activeTab === 'chart'} 
              onClick={() => setActiveTab('chart')}
            >
              Chart View
            </Tab>
            <Tab 
              $active={activeTab === 'dashboard'} 
              onClick={() => setActiveTab('dashboard')}
            >
              Learning Dashboard
            </Tab>
            <Tab 
              $active={activeTab === 'targets'} 
              onClick={() => setActiveTab('targets')}
            >
              Targets Analysis
            </Tab>
            <Tab 
              $active={activeTab === 'reports'} 
              onClick={() => setActiveTab('reports')}
            >
              Reports
            </Tab>
          </TabBar>
          <ContentArea>
            <>
              {activeTab === 'chart' && (
                <>
                  <ControlsContainer>
                    <ControlGroup>
                      <Label>Date:</Label>
                      <input
                        type="date"
                        value={selectedDate?.toISOString().split('T')[0] || ''}
                        onChange={(e) => handleDateChange(new Date(e.target.value))}
                        max={new Date().toISOString().split('T')[0]}
                        className="date-picker"
                        style={{
                          padding: '8px 12px',
                          border: '1px solid #d1d5db',
                          borderRadius: '4px',
                          fontSize: '14px',
                          background: 'white'
                        }}
                      />
                    </ControlGroup>
                    <ControlGroup>
                      <Label>Chart Height:</Label>
                      <HeightInput
                        type="number"
                        value={chartHeight}
                        onChange={handleChartHeightChange}
                        min="200"
                        max="2000"
                        step="50"
                      />
                      <RefreshButton
                        onClick={handleRefreshPatterns}
                        disabled={isRefreshing || data.length === 0}
                      >
                        {isRefreshing ? 'Detecting...' : `Refresh (${totalPatterns})`}
                      </RefreshButton>
                    </ControlGroup>
                  </ControlsContainer>
                  <PatternSelector />
                  <ChartContainer $chartHeight={chartHeight}>
                    {/* Add ChartControlBar component above the chart */}
                    <ChartControlBar 
                      timeframe={timeframe}
                      onTimeframeChange={handleTimeframeChange}
                      showTradingHoursOnly={showTradingHoursOnly}
                      onTradingHoursToggle={handleTradingHoursToggle}
                      onAutoScale={handleAutoScale}
                      onResetView={handleResetView}
                      onZoomToFit={handleZoomToFit}
                      activeTimeRange={activeTimeRange}
                      onTimeRangeSelect={handleTimeRangeSelect}
                    />
                    <ChartWithContext 
                      ref={chartRef}
                      width={window.innerWidth - 48} 
                      height={chartHeight}
                      onPatternSelect={handlePatternSelect}
                      selectedPattern={selectedPattern}
                      selectedDate={selectedDate}
                      timeframe={timeframe}
                      activeTimeRange={activeTimeRange}
                      selectedSymbol={selectedSymbol}
                      showTradingHoursOnly={showTradingHoursOnly}
                      startDate={customDateRange?.startDate}
                      endDate={customDateRange?.endDate}
                    />
                  </ChartContainer>
                </>
              )}
              {activeTab === 'dashboard' && (
                <LearningDashboard />
              )}
              {activeTab === 'targets' && (
                <TargetsPage />
              )}
              {activeTab === 'reports' && (
                <ReportsPage />
              )}
            </>
          </ContentArea>
          <Footer>
            TriSight Pattern Training Interface v2025.07.04.12.09 &copy; {new Date().getFullYear()}
          </Footer>
        </AppContainer>
      )}
      <div>
        {showFeedbackModal && selectedPattern && (
          <FeedbackModalWithContext 
            pattern={selectedPattern}
            onClose={handleFeedbackModalClose}
            userId={userId}
          />
        )}
        {/* Pattern Details Modal - shown only in legacy mode */}
        {!isFeatureEnabled('NEW_LAYOUT') && selectedPattern && !showFeedbackModal && (
          <PatternDetailsModal />
        )}
        
        {/* New Pattern Feedback System */}
        {(() => {
          console.log('[App] Pattern feedback state:', selectedPatternForFeedback?.type || 'null');
          console.log('[App] Local modal state:', showPatternAnalysisModal);
          console.log('[App] analysisPattern:', analysisPattern?.type || 'null');
          console.log('[App] Should render modal:', showPatternAnalysisModal && analysisPattern);
          return null;
        })()}
        {showPatternAnalysisModal && analysisPattern && (
          <>
            {console.log('[App] DynamicPatternAnalysisModal render check:', {
              hasPattern: !!analysisPattern,
              patternType: analysisPattern?.type,
              hasSetMethod: !!setSelectedPatternForFeedback,
              typeOfSetMethod: typeof setSelectedPatternForFeedback,
              modalIsOpen: showPatternAnalysisModal
            })}
            {console.log('[App] ACTUALLY RENDERING DynamicPatternAnalysisModal NOW')}
            <DynamicPatternAnalysisModal
              key={analysisPattern?.id || 'no-pattern'}
              pattern={analysisPattern}
              isOpen={showPatternAnalysisModal}
              onClose={() => {
                console.log('[App] onClose called in modal prop - using local state');
                // Close using local state immediately
                setShowPatternAnalysisModal(false);
                setAnalysisPattern(null);

                // Clear selected pattern to hide the right panel
                setSelectedPattern(null);

                // Also update context state
                if (setSelectedPatternForFeedback) {
                  console.log('[App] Also calling setSelectedPatternForFeedback(null)');
                  setSelectedPatternForFeedback(null);
                }

                // Dispatch restore-zoom event to revert chart zoom
                console.log('[App] Dispatching restore-zoom event');
                window.dispatchEvent(new CustomEvent('trisight-restore-zoom'));
              }}
              onSubmit={async (feedback: any) => {
                if (!hasConsent) {
                  const granted = await requestConsent();
                  if (!granted) return;
                }
                if (submitPatternFeedback) {
                  await submitPatternFeedback(feedback);
                }
                
                // After successful submission, also restore zoom
                console.log('[App] Dispatching restore-zoom event after submission');
                window.dispatchEvent(new CustomEvent('trisight-restore-zoom'));
              }}
            />
          </>
        )}
        
        {/* Privacy Consent Modal */}
        <ConsentModal
          isOpen={showConsentModal}
          onClose={() => setShowConsentModal(false)}
        />
        
        {/* Settings Panel */}
        <SettingsPanel 
          isOpen={showSettingsPanel}
          onClose={() => setShowSettingsPanel(false)}
        />
      </div>
      </div>
    </ChartProvider>
  );
}

// Wrap App with AppProviders to provide all contexts
const AppWithProviders = () => (
  <AppProviders>
    <App />
  </AppProviders>
);

export default AppWithProviders;
