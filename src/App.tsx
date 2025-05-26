// src/App.tsx
// Main application component
// Composes TriSight interface
import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import './App.css';
import './styles/globals.css';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
// Removed unused import: mainLayoutStyles
import mainGridStyles from './styles/MainGrid.module.css';

// Import components
import SymbolSearch from './components/SymbolSearch';
import PatternSelector from './components/Patterns/PatternSelector';
import ChartWithContext from './components/Chart/ChartWithContext';
import FeedbackModalWithContext from './components/Feedback/FeedbackModalWithContext';
import LearningDashboard from './components/Dashboard/LearningDashboard';
import PatternDetailsModal from './components/Modals/PatternDetailsModal';

// Import components
import ContextBar from './components/Navigation/ContextBar';
import ChartWorkspace from './components/Chart/ChartWorkspace';
import ChartControlBar from './components/Chart/ChartControlBar';
import PatternPanel from './components/Patterns/PatternPanel';
import AnalysisPanel from './components/Analysis/AnalysisPanel';
import { TimeRangeOption } from './components/Chart/TimeRangeSelector';

// Import context providers
import AppProviders from './components/AppProviders';
import { useMarketDataContext } from './contexts/MarketDataContext';
import { usePatternContext } from './contexts/PatternContext';
import { useFeedbackContext } from './contexts/FeedbackContext';

// Import feature flags
import { isFeatureEnabled } from './utils/featureFlags';

// Import types
import { Pattern } from './models/PatternTypes';
import { PatternFeedback } from './models/FeedbackTypes';

// Constants for localStorage keys
const STORAGE_KEY_DATE = 'trisight_selected_date';
const STORAGE_KEY_CHART_HEIGHT = 'trisight_chart_height';
const STORAGE_KEY_TRADING_HOURS = 'trisight_trading_hours_only';
const STORAGE_KEY_TIMEFRAME = 'selectedTimeframe';
const STORAGE_KEY_TIME_RANGE = 'selectedTimeRange';

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

function AppContent() {
  const { data } = useMarketDataContext(); // Removed unused variables: setSymbol, loading
  const { patterns, patternCounts, selectedPattern, setSelectedPattern, detectPatterns } = usePatternContext();
  // Removed unused variable: submitFeedback

  // Generate a simple user ID for the session
  const [userId] = useState(() => Math.random().toString(36).substring(2, 10));
  const [activeTab, setActiveTab] = useState<'chart' | 'dashboard'>('chart');
  
  // Type-safe tab change handler
  const handleTabChange = (tab: 'chart' | 'dashboard') => {
    setActiveTab(tab);
  };
  const [showFeedbackModal, setShowFeedbackModal] = useState<boolean>(false);
  const [chartHeight, setChartHeight] = useState<number>(getSavedChartHeight());
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [selectedDate, setSelectedDate] = useState<Date>(getSavedDate());
  
  // Initialize selectedDate to the last trading day
  useEffect(() => {
    const today = new Date();
    
    // If today is Sunday, go back to Friday
    if (today.getDay() === 0) {
      const friday = new Date(today);
      friday.setDate(today.getDate() - 2);
      setSelectedDate(friday);
    }
    
    // If today is Saturday, go back to Friday
    if (today.getDay() === 6) {
      const friday = new Date(today);
      friday.setDate(today.getDate() - 1);
      setSelectedDate(friday);
    }
  }, []);
  
  // Handle pattern selection
  const handlePatternSelect = (pattern: Pattern | null) => {
    setSelectedPattern(pattern);
    if (pattern) {
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
    setShowFeedbackModal(false);
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
  const [showTradingHoursOnly, setShowTradingHoursOnly] = useState<boolean>(() => {
    try {
      const savedSetting = localStorage.getItem(STORAGE_KEY_TRADING_HOURS);
      return savedSetting === null ? true : savedSetting === 'true';
    } catch (e) {
      console.error('Failed to load trading hours setting from localStorage:', e);
      return true; // Default to true if there's an error
    }
  });
  // Initialize timeframe from localStorage or default to 1min
  const [timeframe, setTimeframe] = useState<string>(() => {
    try {
      const savedTimeframe = localStorage.getItem(STORAGE_KEY_TIMEFRAME);
      return savedTimeframe || '1min';
    } catch (e) {
      console.error('Failed to load timeframe from localStorage:', e);
      return '1min';
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
  
  // Handle timeframe change
  const handleTimeframeChange = (newTimeframe: string) => {
    console.log(`Changing timeframe to: ${newTimeframe}`);
    // Save to localStorage for persistence across sessions
    try {
      localStorage.setItem(STORAGE_KEY_TIMEFRAME, newTimeframe);
    } catch (e) {
      console.error('Failed to save timeframe to localStorage:', e);
    }
    setTimeframe(newTimeframe);
    
    if (newTimeframe === 'daily' || newTimeframe === 'weekly' || newTimeframe === 'monthly') {
      // For larger timeframes, we might want to fetch a bigger date range
      // This is optional - our current approach aggregates the existing data
    }
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
    // Toggle state to trigger auto-scale in chart
    setViewportState(prev => ({
      ...prev,
      autoScaled: !prev.autoScaled
    }));
  };
  
  // Handle reset view
  const handleResetView = () => {
    // Toggle state to trigger reset view in chart
    setViewportState(prev => ({
      ...prev,
      resetView: !prev.resetView
    }));
  };
  
  // Handle time range selection
  const handleTimeRangeSelect = (range: TimeRangeOption, startDate: Date, endDate: Date) => {
    console.log(`Changing time range to: ${range}`, { startDate, endDate });
    
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
    if (range === '1D') {
      newTimeframe = '1min';
    } else if (range === '1W') {
      newTimeframe = '15min';
    } else if (range === '1M' || range === '3M' || range === 'YTD') {
      newTimeframe = '60min';
    }
    
    if (newTimeframe !== timeframe) {
      setTimeframe(newTimeframe);
      try {
        localStorage.setItem(STORAGE_KEY_TIMEFRAME, newTimeframe);
      } catch (e) {
        console.error('Failed to save timeframe to localStorage:', e);
      }
    }
  };
  
  // Handle settings toggle
  const handleSettingsToggle = () => {
    // Implement settings panel toggle logic here
    console.log('Settings toggled');
  };
  
  // Handle save pattern
  const handleSavePattern = () => {
    // Implement save pattern logic here
    console.log('Pattern saved', selectedPattern);
  };
  
  // Create default pattern filters
  const [patternFilters, setPatternFilters] = useState({
    successRate: 0,
    timeframe: 'all',
    patternType: 'all'
  });
  
  // Handle pattern filter changes
  const handleFilterChange = (newFilters: any) => {
    setPatternFilters(newFilters);
    // Additional logic for filtering patterns
  };

  const [viewportState, setViewportState] = useState({
    autoScaled: false,
    resetView: false
  });

  return (
    <div className={isFeatureEnabled('NEW_LAYOUT') ? mainGridStyles.mainGrid : undefined}>
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
            />
          </div>
          
          <div className={mainGridStyles.content}>
            {activeTab === 'chart' ? (
              <div className={mainGridStyles.chartGrid}>
                
                <div className={mainGridStyles.chartArea}>
                  <ChartWorkspace
                    data={data}
                    patterns={patterns}
                    width={window.innerWidth - 284} // Adjusting for PatternPanel width 
                    height={chartHeight}
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
                  />
                </div>
                
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
              </div>
            ) : (
              <LearningDashboard />
            )}
          </div>
          
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
                    activeTimeRange={activeTimeRange}
                    onTimeRangeSelect={handleTimeRangeSelect}
                  />
                  <ChartWithContext 
                    width={window.innerWidth - 48} 
                    height={chartHeight}
                    onPatternSelect={handlePatternSelect}
                    selectedPattern={selectedPattern}
                    selectedDate={selectedDate}
                    timeframe={timeframe}
                    activeTimeRange={activeTimeRange}
                    onTimeRangeSelect={handleTimeRangeSelect}
                  />
                </ChartContainer>
              </>
            )}
            
            {activeTab === 'dashboard' && (
              <LearningDashboard />
            )}
          </ContentArea>
          
          <Footer>
            TriSight Pattern Training Interface &copy; {new Date().getFullYear()}
          </Footer>
        </AppContainer>
      )}
      
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
    </div>
  );
}

// Main App component with all context providers
export function App() {
  return (
    <AppProviders>
      <AppContent />
    </AppProviders>
  );
}

export default App;
