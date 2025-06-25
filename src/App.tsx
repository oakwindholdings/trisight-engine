// src/App.tsx
// Main application component
// NOTE: supports DEBUG_UI channel
// Composes TriSight interface
import React, { useState, useEffect, useRef, useCallback } from 'react';
import styled from 'styled-components';
import './App.css';
import './styles/globals.css';
import { logDebug } from './utils/debug';
import { getApiKey } from './api/twelveDataApi';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import mainGridStyles from './styles/MainGrid.module.css';

// Import components
import SymbolSearch from './components/SymbolSearch';
import PatternSelector from './components/Patterns/PatternSelector';
import ChartWithContext from './components/Chart/ChartWithContext';
import { InfiniteZoomChartRef } from './components/Chart/InfiniteZoomChart';
import FeedbackModalWithContext from './components/Feedback/FeedbackModalWithContext';
import LearningDashboard from './components/Dashboard/LearningDashboard';
import PatternDetailsModal from './components/Modals/PatternDetailsModal';
import { SymbolRankingTable } from './components/SymbolRankingTable'; // Add import for SymbolRankingTable component

// Import components
import ContextBar from './components/Navigation/ContextBar';
import ChartWorkspace from './components/Chart/ChartWorkspace';
import ChartControlBar from './components/Chart/ChartControlBar';
import PatternPanel from './components/Patterns/PatternPanel';
import AnalysisPanel from './components/Analysis/AnalysisPanel';
import DebugSettingsPanel from './components/Settings/DebugSettingsPanel';
import { TimeRangeOption } from './components/Chart/TimeRangeSelector';

// Import context providers
import AppProviders from './components/AppProviders';
import { useMarketDataContext } from './contexts/MarketDataContext';
import { usePatternContext } from './contexts/PatternContext';

// Import feature flags
import { isFeatureEnabled } from './utils/featureFlags';

// Import types
import { Pattern } from './models/PatternTypes';

// Import hooks
import useTwelveDataApiKey from './hooks/useTwelveDataApiKey';

// Import mock data
import { mockSymbolRankings } from './utils/mockData/symbolRankings';
import { SymbolRanking } from './types/SymbolRanking';

// Styled components
const SymbolRankingContainer = styled.div`
  margin-top: 16px;
  width: 100%;
`;

// Constants for localStorage keys
const STORAGE_KEY_DATE = 'trisight_selected_date';
const STORAGE_KEY_CHART_HEIGHT = 'trisight_chart_height';
const STORAGE_KEY_TRADING_HOURS = 'trisight_trading_hours_only';
const STORAGE_KEY_TIMEFRAME = 'selectedTimeframe';
const STORAGE_KEY_TIME_RANGE = 'selectedTimeRange';
const STORAGE_KEY_SYMBOL = 'selectedSymbol';
const STORAGE_KEY_SHOW_RIGHT_PANEL = 'trisight_show_right_panel';
const STORAGE_KEY_SHOW_BOTTOM_TABLE = 'trisight_show_bottom_table';

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
    console.error('Error loading saved date from localStorage:', e);
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
    console.error('Error loading saved chart height from localStorage:', e);
  }
  return 500; // Default height if no saved height or error
};

// Helper function to save chart height to localStorage
const saveChartHeight = (height: number): void => {
  try {
    localStorage.setItem(STORAGE_KEY_CHART_HEIGHT, height.toString());
  } catch (e) {
    console.error('Error saving chart height to localStorage:', e);
  }
};

// Debug API key presence
const debugApiKey = () => {
  const key = process.env.REACT_APP_TWELVE_DATA_API_KEY;
  logDebug('DEBUG_UI', 'API Key present:', key ? `Yes (${key.length} chars)` : 'NOT SET!');
  logDebug('DEBUG_UI', '[App] Starting TriSight with API key:', getApiKey() ? 'CONFIGURED' : 'NOT SET');
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
  const { apiKey } = useTwelveDataApiKey();
  
  const { data, fetchDateRange, setIsUsingCustomRange, fetchSpecificDay, timeframe, setTimeframe } = useMarketDataContext(); 
  const { patterns, patternCounts, selectedPattern, setSelectedPattern, detectPatterns } = usePatternContext();
  
  // Generate a simple user ID for the session
  const [userId] = useState(() => Math.random().toString(36).substring(2, 10));
  const [activeTab, setActiveTab] = useState<'chart' | 'dashboard'>('chart');
  
  // Symbol selection state
  const [selectedSymbol, setSelectedSymbol] = useState(() => {
    const saved = localStorage.getItem(STORAGE_KEY_SYMBOL);
    return saved || 'AAPL';
  });
  
  // State for symbol rankings - initialize with mock data
  const [symbolRankings, setSymbolRankings] = useState<SymbolRanking[]>(mockSymbolRankings);
  
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
    console.log('[App] customDateRange changed:', customDateRange ? {
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
      console.log('[UI] Toggled Right Panel:', newValue);
      
      // Force chart redraw by triggering resize event
      setTimeout(() => {
        window.dispatchEvent(new Event('resize'));
        console.log('[UI] Dispatched resize event for chart redraw');
      }, 0);
      
      return newValue;
    });
  }, []);
  
  // Handle bottom table toggle
  const handleToggleBottomTable = useCallback(() => {
    setShowBottomTable((prev: boolean) => {
      const newValue = !prev;
      localStorage.setItem(STORAGE_KEY_SHOW_BOTTOM_TABLE, JSON.stringify(newValue));
      console.log('[UI] Toggled Bottom Table:', newValue);
      
      // Force chart redraw by triggering resize event
      setTimeout(() => {
        window.dispatchEvent(new Event('resize'));
        console.log('[UI] Dispatched resize event for chart redraw');
      }, 0);
      
      return newValue;
    });
  }, []);
  
  // Handle symbol select
  const handleSymbolSelect = useCallback((symbol: string) => {
    console.log('[App] handleSymbolSelect called with:', symbol);
    setSelectedSymbol(symbol);
    localStorage.setItem(STORAGE_KEY_SYMBOL, symbol);
    
    // Check if symbol already exists in rankings
    const symbolExists = symbolRankings.some(ranking => ranking.symbol === symbol);
    
    if (!symbolExists) {
      logDebug('DEBUG_UI', '[App] Adding new symbol to rankings:', symbol);
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
  const handleTabChange = (tab: 'chart' | 'dashboard') => {
    setActiveTab(tab);
  };
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [chartHeight, setChartHeight] = useState(getSavedChartHeight());
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedDate, setSelectedDate] = useState(getSavedDate());
  
  // Initialize selectedDate to the last trading day
  useEffect(() => {
    const today = new Date();
    
    // Clear any lingering selected pattern on mount
    console.log('[App] Clearing selectedPattern on mount');
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
      console.error('Failed to load trading hours setting from localStorage:', e);
      return true; // Default to true if there's an error
    }
  });
  
  // Initialize active time range from localStorage or default to 1D
  const [activeTimeRange, setActiveTimeRange] = useState<TimeRangeOption>(() => {
    try {
      const savedTimeRange = localStorage.getItem(STORAGE_KEY_TIME_RANGE) as TimeRangeOption;
      return savedTimeRange || '1D';
    } catch (e) {
      console.error('Failed to load time range from localStorage:', e);
      return '1D';
    }
  });
  
  console.log(`AppContent render - activeTimeRange: ${activeTimeRange}, activeTab: ${activeTab}`);
  console.log(`About to check activeTab === 'chart': ${activeTab === 'chart'}`);
  console.log(`Chart should render: ${activeTab === 'chart'}`);
  
  // Debug which chart component will render
  if (activeTab === 'chart') {
    console.log(`Chart tab is active. Will render ChartWithContext`);
  }
  
  // Viewport state for chart controls
  const [viewportState, setViewportState] = useState({
    autoScaled: false,
    resetView: false
  });
  
  // Pattern filters state
  const [patternFilters, setPatternFilters] = useState({
    successRate: 0,
    timeframe: 'all',
    patternType: 'all'
  });
  
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
  
  // Handle trading hours toggle
  const handleTradingHoursToggle = () => {
    const newValue = !showTradingHoursOnly;
    setShowTradingHoursOnly(newValue);
    
    // Save to localStorage for persistence across sessions
    try {
      localStorage.setItem(STORAGE_KEY_TRADING_HOURS, newValue.toString());
    } catch (e) {
      console.error('Failed to save trading hours setting to localStorage:', e);
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
    
    console.log('Adjusted dates for fetch:', { startDate, endDate: adjustedEndDate });
    
    // Save to localStorage for persistence across sessions
    try {
      localStorage.setItem(STORAGE_KEY_TIME_RANGE, range);
    } catch (e) {
      console.error('Failed to save time range to localStorage:', e);
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
        console.error('Failed to save timeframe to localStorage:', e);
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
    // Implement settings panel toggle logic here
    logDebug('DEBUG_UI', 'Settings toggled');
  };
  
  // Handle save pattern
  const handleSavePattern = () => {
    // Implement save pattern logic here
    logDebug('DEBUG_UI', 'Pattern saved', selectedPattern);
  };
  
  // Handle pattern filter changes
  const handleFilterChange = (newFilters: any) => {
    setPatternFilters(newFilters);
    // Additional logic for filtering patterns
  };

  // Refs
  const chartRef = useRef<InfiniteZoomChartRef>(null);

  // Handle zoom to fit
  const handleZoomToFit = useCallback(() => {
    if (chartRef.current?.zoomToFit) {
      chartRef.current.zoomToFit();
    }
  }, []);

  // Debug: Check what's causing the click blocking
  useEffect(() => {
    console.log('=== DEBUG UI BLOCKING ===');
    console.log('selectedPattern:', selectedPattern);
    console.log('showFeedbackModal:', showFeedbackModal);
    console.log('isFeatureEnabled(NEW_LAYOUT):', isFeatureEnabled('NEW_LAYOUT'));
    console.log('Modal should render:', !isFeatureEnabled('NEW_LAYOUT') && selectedPattern && !showFeedbackModal);
    
    // Check localStorage for feature flag
    const features = localStorage.getItem('features');
    console.log('Features in localStorage:', features);
    
    // Auto-clear stale pattern selection
    if (selectedPattern && !showFeedbackModal) {
      const patternElement = document.querySelector('.pattern-details-modal');
      if (!patternElement) {
        console.warn('Pattern is selected but modal is not visible - clearing selection');
        setSelectedPattern(null);
      }
    }
    
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
    console.log('App mounted - cleared any stale selections');
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

  return (
    <div className={isFeatureEnabled('NEW_LAYOUT') ? mainGridStyles.mainGrid : 'app-container'}>
      {isFeatureEnabled('NEW_LAYOUT') ? (
        // New UI using wrapper components
        <>
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
                console.log('[App] onCustomDateRange called with:', { start, end });
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
                      patterns={patterns}
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
                          patterns={patterns}
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
              <SymbolRankingTable
                rankings={symbolRankings}
                selectedSymbol={selectedSymbol}
                onSymbolSelect={(symbol) => {
                  setSelectedSymbol(symbol);
                  logDebug('DEBUG_UI', '[App] Symbol selected from ranking table:', symbol);
                }}
                loading={false}
              />
            </div>
          )}
          
          <div className={mainGridStyles.footer}>
            TriSight Pattern Training Interface &copy; {new Date().getFullYear()}
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
          </TabBar>
          <ContentArea>
            <>
              {activeTab === 'chart' && (
                <>
                  <ControlsContainer>
                    <ControlGroup>
                      <Label>Date:</Label>
                      <DatePicker
                        selected={selectedDate}
                        onChange={handleDateChange}
                        maxDate={new Date()} // Can't select future dates
                        dateFormat="yyyy-MM-dd"
                        className="date-picker"
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
            </>
          </ContentArea>
          <Footer>
            TriSight Pattern Training Interface &copy; {new Date().getFullYear()}
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
        {/* Debug overlay to visualize click blocking */}
        {process.env.NODE_ENV === 'development' && (
          <div 
            id="debug-click-test" 
            style={{
              position: 'fixed',
              bottom: 10,
              right: 10,
              padding: '10px',
              background: 'rgba(255, 0, 0, 0.8)',
              color: 'white',
              borderRadius: '5px',
              cursor: 'pointer',
              zIndex: 9999,
              pointerEvents: 'auto',
            }}
            onClick={() => {
              console.log('Debug button clicked successfully!');
              // Removed unused import: debugClickBlocking
              // Force clear any blocking state
              setSelectedPattern(null);
              setShowFeedbackModal(false);
              // Also check for any CSS issues
              const appDiv = document.querySelector('.App');
              if (appDiv) {
                const computedStyle = window.getComputedStyle(appDiv);
                console.log('App div pointer-events:', computedStyle.pointerEvents);
              }
            }}
          >
            Debug Click Issues
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
