// src/components/Navigation/ContextBar.tsx
// Top bar with search and date
// Switches between app tabs
import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import SymbolSearch from '../SymbolSearch';
import { ThemeTokens } from '../../styles/theme';
import { useUIState } from '../../contexts/UIStateContext';
import { useMarketDataContext } from '../../contexts/MarketDataContext';
import { Timeframe } from '../../models/ChartTypes';

// localStorage keys
const STORAGE_KEYS = {
  START_DATE: 'trisight_navbar_start_date',
  END_DATE: 'trisight_navbar_end_date',
  TIMEFRAME: 'trisight_navbar_timeframe',
  SYMBOL_INFO: 'trisight_navbar_symbol_info'
};

// Container for the entire context bar
const ContextBarContainer = styled.nav`
  display: flex;
  align-items: center;
  padding: ${ThemeTokens.spacing.medium};
  background-color: ${ThemeTokens.colors.primary};
  border-bottom: 1px solid ${ThemeTokens.colors.border};
  height: 60px;
`;

// Group for search and date inputs
const LeftGroup = styled.div`
  display: flex;
  align-items: center;
  flex: 1;
  gap: ${ThemeTokens.spacing.small};
`;

// Group for view toggles and settings
const RightGroup = styled.div`
  display: flex;
  align-items: center;
  gap: ${ThemeTokens.spacing.medium};
`;

// Date input styled component
const DateInput = styled.input`
  background-color: ${ThemeTokens.colors.surface};
  border: 1px solid ${ThemeTokens.colors.border};
  border-radius: ${ThemeTokens.borderRadius.small};
  padding: ${ThemeTokens.spacing.small};
  color: ${ThemeTokens.colors.textPrimary};
  font-size: ${ThemeTokens.typography.size.small};
  width: 100px;
  
  &::placeholder {
    color: rgba(255, 255, 255, 0.5);
  }
  
  &:focus {
    outline: none;
    border-color: ${ThemeTokens.colors.accent};
  }
  
  &:invalid {
    border-color: ${ThemeTokens.colors.danger};
  }
`;

// Timeframe dropdown
const TimeframeSelect = styled.select`
  background-color: ${ThemeTokens.colors.surface};
  border: 1px solid ${ThemeTokens.colors.border};
  border-radius: ${ThemeTokens.borderRadius.small};
  padding: ${ThemeTokens.spacing.small};
  color: ${ThemeTokens.colors.textPrimary};
  font-size: ${ThemeTokens.typography.size.small};
  cursor: pointer;
  
  &:focus {
    outline: none;
    border-color: ${ThemeTokens.colors.accent};
  }
`;

// Apply button
const ApplyButton = styled.button`
  background-color: ${ThemeTokens.colors.accent};
  color: ${ThemeTokens.colors.textOnAccent};
  border: none;
  border-radius: ${ThemeTokens.borderRadius.small};
  padding: ${ThemeTokens.spacing.small} ${ThemeTokens.spacing.medium};
  font-size: ${ThemeTokens.typography.size.small};
  font-weight: 500;
  cursor: pointer;
  transition: background-color 0.2s;
  
  &:hover:not(:disabled) {
    background-color: ${ThemeTokens.colors.accentHover};
  }
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

// Summary label
const SummaryLabel = styled.div`
  display: flex;
  align-items: center;
  margin-left: 16px;
  color: #e2e8f0;
  font-size: 13px;
  font-weight: 400;
  white-space: nowrap;
  
  span {
    margin: 0 4px;
    color: #10b981;
    font-weight: 500;
  }
  
  .exchange {
    color: #94a3b8;
    font-size: 12px;
    margin-left: 2px;
  }
`;

interface ContextBarProps {
  selectedDate: Date;
  onDateChange: (date: Date | null) => void;
  activeTab: 'chart' | 'dashboard' | 'targets';
  onTabChange: (tab: 'chart' | 'dashboard' | 'targets') => void;
  onSettingsToggle: () => void;
  onSymbolSelect?: (symbol: string, name?: string, exchange?: string) => void;
  onToggleRightPanel?: () => void;
  onToggleBottomTable?: () => void;
  showRightPanel?: boolean;
  showBottomTable?: boolean;
  onCustomDateRange?: (startDate: Date, endDate: Date) => void;
}

const ContextBar: React.FC<ContextBarProps> = ({
  selectedDate,
  onDateChange,
  activeTab,
  onTabChange,
  onSettingsToggle,
  onSymbolSelect,
  onToggleRightPanel,
  onToggleBottomTable,
  showRightPanel = true,
  showBottomTable = true,
  onCustomDateRange,
}) => {
  // Removed setIsDatePickerOpen since we switched to HTML5 date input
  const { symbol, setTimeframe, setSymbol, fetchDateRange, timeframe, clearData } = useMarketDataContext();
  
  // State for symbol info
  const [symbolInfo, setSymbolInfo] = useState<{ symbol: string; name?: string; exchange?: string }>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.SYMBOL_INFO);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return { symbol: symbol || '' };
      }
    }
    return { symbol: symbol || '' };
  });
  
  // State for current symbol input value - initialize from context or localStorage
  const [currentSymbol, setCurrentSymbol] = useState(() => {
    if (symbol) return symbol;
    // Fallback to localStorage if context symbol isn't ready yet
    const saved = localStorage.getItem(STORAGE_KEYS.SYMBOL_INFO);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        return parsed.symbol || 'AAPL';
      } catch {}
    }
    return 'AAPL';
  });
  
  // State for form inputs - initialize from localStorage
  const [startDate, setStartDate] = useState(() => {
    return localStorage.getItem(STORAGE_KEYS.START_DATE) || '';
  });
  const [endDate, setEndDate] = useState(() => {
    return localStorage.getItem(STORAGE_KEYS.END_DATE) || '';
  });
  const [selectedTimeframe, setSelectedTimeframe] = useState<Timeframe>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.TIMEFRAME);
    return (saved as Timeframe) || 'daily';
  });
  
  // Save to localStorage when values change
  useEffect(() => {
    if (startDate) localStorage.setItem(STORAGE_KEYS.START_DATE, startDate);
  }, [startDate]);
  
  useEffect(() => {
    if (endDate) localStorage.setItem(STORAGE_KEYS.END_DATE, endDate);
  }, [endDate]);
  
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.TIMEFRAME, selectedTimeframe);
  }, [selectedTimeframe]);
  
  // Debug: Log symbol from context
  console.log('[ContextBar] Current symbol from context:', symbol);
  
  // Update symbolInfo when symbol changes from context
  useEffect(() => {
    if (symbol && symbol !== symbolInfo.symbol) {
      // Check if we have saved info for this symbol
      const saved = localStorage.getItem(STORAGE_KEYS.SYMBOL_INFO);
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          if (parsed.symbol === symbol) {
            setSymbolInfo(parsed);
            return;
          }
        } catch {}
      }
      // Otherwise just update the symbol
      setSymbolInfo({ symbol });
    }
  }, [symbol, symbolInfo.symbol]);
  
  // Trigger initial fetch with persisted values on mount
  useEffect(() => {
    const performInitialFetch = async () => {
      // Only run once on mount and if we have valid dates AND a symbol
      const hasValidSymbol = symbol || currentSymbol;
      const hasValidDates = validateDate(startDate) && validateDate(endDate);
      
      console.log('[ContextBar] Initial fetch conditions:', {
        hasValidSymbol,
        symbol,
        currentSymbol,
        hasValidDates,
        startDate,
        endDate,
        selectedTimeframe
      });
      
      if (hasValidSymbol && hasValidDates) {
        console.log('[ContextBar] Preparing initial fetch with persisted values:', {
          symbol,
          currentSymbol,
          effectiveSymbol: symbol || currentSymbol,
          startDate,
          endDate,
          timeframe: selectedTimeframe,
          contextTimeframe: timeframe
        });
        
        // Ensure we use the correct symbol - prioritize context symbol, fallback to currentSymbol
        const effectiveSymbol = symbol || currentSymbol;
        
        // Update symbol in context if it's not already set
        if (!symbol && currentSymbol) {
          console.log('[ContextBar] Setting symbol in context to:', currentSymbol);
          setSymbol(currentSymbol);
        }
        
        // Parse dates
        const [startMonth, startDay, startYear] = startDate.split('/').map(Number);
        const [endMonth, endDay, endYear] = endDate.split('/').map(Number);
        const start = new Date(startYear, startMonth - 1, startDay);
        const end = new Date(endYear, endMonth - 1, endDay);
        
        try {
          // IMPORTANT: Set the timeframe first before fetching
          if (selectedTimeframe !== timeframe) {
            console.log('[ContextBar] Setting timeframe to persisted value:', selectedTimeframe);
            setTimeframe(selectedTimeframe);
            
            // Wait a bit for the context to update before fetching
            await new Promise(resolve => setTimeout(resolve, 100));
          }
          
          // Map the timeframe to interval
          const intervalMap: Record<string, string> = {
            '1min': '1min',
            '5min': '5min', 
            '15min': '15min',
            '30min': '30min', 
            '60min': '60min',
            '1hour': '60min',
            'daily': '1day',
            'weekly': '1week',
            'monthly': '1month'
          };
          
          const interval = intervalMap[selectedTimeframe] || selectedTimeframe;
          console.log('[ContextBar] Initial fetch using interval:', interval, 'for symbol:', effectiveSymbol);
          
          // Call fetchDateRange with persisted values and explicit interval
          await fetchDateRange(start, end, interval);
          console.log('[ContextBar] Initial fetch completed successfully');
        } catch (error) {
          console.error('[ContextBar] Initial fetch failed:', error);
        }
      } else {
        console.log('[ContextBar] Skipping initial fetch - missing required data:', {
          hasValidSymbol,
          hasValidDates,
          startDate,
          endDate
        });
      }
    };
    
    // Small delay to ensure all contexts are initialized
    const timeoutId = setTimeout(performInitialFetch, 200);
    
    return () => clearTimeout(timeoutId);
    // Dependencies: symbol and currentSymbol to trigger fetch when symbol context becomes available
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [symbol, currentSymbol]);
  
  // Handle symbol selection from SymbolSearch
  const handleSymbolSelect = (newSymbol: string, name?: string, exchange?: string) => {
    console.log('[ContextBar] handleSymbolSelect:', newSymbol, name, exchange);
    const info = { symbol: newSymbol, name, exchange };
    setSymbolInfo(info);
    setCurrentSymbol(newSymbol); // Update the current symbol state
    localStorage.setItem(STORAGE_KEYS.SYMBOL_INFO, JSON.stringify(info));
    
    if (onSymbolSelect) {
      onSymbolSelect(newSymbol, name, exchange);
    }

    // Expose globally for feed emitter fallback
    if (typeof window !== 'undefined') {
      (window as any).trisightSymbol = newSymbol;
    }
  };
  
  // Validate date format MM/DD/YYYY
  const validateDate = (dateStr: string) => {
    const regex = /^(0[1-9]|1[0-2])\/(0[1-9]|[12][0-9]|3[01])\/\d{4}$/;
    if (!regex.test(dateStr)) return false;
    
    const [month, day, year] = dateStr.split('/').map(Number);
    const date = new Date(year, month - 1, day);
    return date.getMonth() === month - 1 && date.getDate() === day;
  };
  
  // Handle Apply button click
  const handleApply = async () => {
    console.log('[DIAGNOSTIC] Apply button CLICKED - handleApply function started');
    console.log('[ContextBar] Apply button clicked');
    console.log('[ContextBar] Current values:', {
      currentSymbol,
      symbolFromContext: symbol,
      startDate,
      endDate,
      selectedTimeframe,
      startDateValid: validateDate(startDate),
      endDateValid: validateDate(endDate)
    });
    
    // Log specific check for 15min
    if (selectedTimeframe === '15min') {
      console.log('[ContextBar] Special case: 15min timeframe selected');
    }
    
    if (!currentSymbol || !validateDate(startDate) || !validateDate(endDate)) {
      console.error('[ContextBar] Validation failed:', {
        hasSymbol: !!currentSymbol,
        startDateValid: validateDate(startDate),
        endDateValid: validateDate(endDate)
      });
      return;
    }
    
    // Parse dates
    const [startMonth, startDay, startYear] = startDate.split('/').map(Number);
    const [endMonth, endDay, endYear] = endDate.split('/').map(Number);
    // Create Date objects at local midnight for the chosen calendar dates
    const start = new Date(startYear, startMonth - 1, startDay);
    const end = new Date(endYear, endMonth - 1, endDay);

    // If the user selected the SAME calendar day for start and end, treat it as
    // a *single-day* request.  TwelveData expects end_date to be LATER than
    // start_date, otherwise it returns an empty array.  Therefore extend the
    // end date to the last millisecond of that day so the request covers the
    // full regular trading session.
    if (start.getTime() === end.getTime()) {
      end.setHours(23, 59, 59, 999);
    }
    
    console.log('[ContextBar] Parsed dates:', {
      start: start.toISOString(),
      end: end.toISOString()
    });
    
    // Ensure start date is not after end date (allow same date for single-day view)
    if (start > end) {
      alert('Start date must be before or equal to end date');
      return;
    }
    
    console.log('[ContextBar] Applying filters:', {
      symbol: currentSymbol,
      startDate: start,
      endDate: end,
      timeframe: selectedTimeframe
    });
    
    // Notify parent component of custom date range
    if (onCustomDateRange) {
      onCustomDateRange(start, end);
    }
    
    // Clear existing data first to ensure fresh fetch
    console.log('[ContextBar] Clearing existing data for fresh fetch');
    clearData();
    
    // Update symbol in MarketDataContext first
    console.log('[ContextBar] Setting symbol to:', currentSymbol);
    setSymbol(currentSymbol);
    
    // Call setTimeframe before fetchDateRange
    console.log('[ContextBar] Setting timeframe to:', selectedTimeframe);
    setTimeframe(selectedTimeframe);
    
    // Add a small delay to ensure state updates propagate
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // Map the timeframe to interval for the API
    const intervalMap: Record<string, string> = {
      '1min': '1min',
      '5min': '5min', 
      '15min': '15min',
      '30min': '30min',
      '60min': '60min',
      '1hour': '60min',
      'daily': '1day',
      'weekly': '1week',
      'monthly': '1month'
    };
    
    const interval = intervalMap[selectedTimeframe] || selectedTimeframe;
    
    // Call fetchDateRange with the timeframe (fetchDateRange will handle the interval conversion)
    console.log('[ContextBar] Calling fetchDateRange with:', {
      startDate: start,
      endDate: end,
      timeframe: selectedTimeframe,
      interval: interval
    });
    
    try {
      console.log('[ContextBar] About to call fetchDateRange...');
      console.log('[DIAGNOSTIC] Calling fetchDateRange NOW with:', {
        start: start.toISOString(),
        end: end.toISOString(),
        interval
      });
      await fetchDateRange(start, end, interval);
      console.log('[ContextBar] fetchDateRange completed successfully');
      console.log('[DIAGNOSTIC] fetchDateRange call COMPLETED');
    } catch (error) {
      console.error('[ContextBar] fetchDateRange failed:', error);
      console.error('[DIAGNOSTIC] fetchDateRange FAILED:', error);
    }
  };
  
  // Check if Apply button should be enabled
  const isApplyEnabled = currentSymbol && 
    validateDate(startDate) && 
    validateDate(endDate);
    
  console.log('[ContextBar] Apply button enabled:', isApplyEnabled);
  console.log('[DIAGNOSTIC] Apply button state:', {
    isEnabled: isApplyEnabled,
    currentSymbol,
    hasSymbol: !!currentSymbol,
    startDate,
    startDateValid: validateDate(startDate),
    endDate,
    endDateValid: validateDate(endDate),
    allConditions: {
      symbol: !!currentSymbol,
      start: validateDate(startDate),
      end: validateDate(endDate)
    }
  });
  
  // Format timeframe for display
  const getTimeframeDisplay = (tf: Timeframe): string => {
    const displayMap: Record<Timeframe, string> = {
      '1min': '1M',
      '5min': '5M',
      '15min': '15M',
      '30min': '30M', 
      '60min': '1H',
      '1hour': '1H',
      'daily': '1D',
      'weekly': '1W',
      'monthly': '1M',
      '1day': '1D',
      '5day': '5D'
    };
    return displayMap[tf] || tf;
  };
  
  return (
    <ContextBarContainer>
      <LeftGroup>
        {/* Search Control */}
        <SymbolSearch onSymbolSelect={handleSymbolSelect} />
        
        {/* Start Date Input */}
        <DateInput
          type="text"
          placeholder="Start MM/DD/YYYY"
          value={startDate}
          onChange={(e) => setStartDate(e.target.value)}
          pattern="\d{2}/\d{2}/\d{4}"
          title="Enter date in MM/DD/YYYY format"
        />
        
        {/* End Date Input */}
        <DateInput
          type="text"
          placeholder="End MM/DD/YYYY"
          value={endDate}
          onChange={(e) => setEndDate(e.target.value)}
          pattern="\d{2}/\d{2}/\d{4}"
          title="Enter date in MM/DD/YYYY format"
        />
        
        {/* Timeframe Dropdown */}
        <TimeframeSelect 
          value={selectedTimeframe} 
          onChange={(e) => {
            const newTimeframe = e.target.value as Timeframe;
            console.log('[ContextBar] Timeframe dropdown changed to:', newTimeframe);
            setSelectedTimeframe(newTimeframe);
            
            // Debug logging for auto-fetch conditions
            console.log('[DIAGNOSTIC] Auto-fetch conditions:', {
              currentSymbol,
              hasSymbol: !!currentSymbol,
              startDate,
              endDate,
              startDateValid: validateDate(startDate),
              endDateValid: validateDate(endDate),
              willAutoFetch: currentSymbol && startDate && endDate && validateDate(startDate) && validateDate(endDate)
            });
            
            // If we have a symbol and valid date range, fetch data automatically
            if (currentSymbol && startDate && endDate && validateDate(startDate) && validateDate(endDate)) {
              console.log('[ContextBar] Auto-fetching data for new timeframe:', newTimeframe);
              setTimeframe(newTimeframe);
              
              // Convert dates and fetch
              const start = parseInputDate(startDate);
              const end = parseInputDate(endDate);
              
              if (start && end) {
                console.log('[DIAGNOSTIC] Auto-calling fetchDateRange for timeframe change:', {
                  start: start.toISOString(),
                  end: end.toISOString(),
                  interval: newTimeframe
                });
                
                fetchDateRange(start, end).catch(error => {
                  console.error('[ContextBar] Auto-fetch failed:', error);
                });
              }
            } else {
              console.log('[DIAGNOSTIC] Auto-fetch SKIPPED - conditions not met');
            }
          }}
        >
          <option value="1min">1m</option>
          <option value="5min">5m</option>
          <option value="15min">15m</option>
          <option value="30min">30m</option>
          <option value="60min">1h</option>
          <option value="daily">1D</option>
          <option value="weekly">1W</option>
          <option value="monthly">1M</option>
        </TimeframeSelect>
        
        {/* Apply Button */}
        <ApplyButton 
          onClick={(e) => {
            console.log('[DIAGNOSTIC] Apply button RAW CLICK EVENT detected', e);
            handleApply();
          }}
          disabled={!isApplyEnabled}
          title={!isApplyEnabled ? "Please fill all fields with valid data" : "Apply date range and timeframe"}
        >
          Apply
        </ApplyButton>
        
        {/* Summary Label */}
        {symbolInfo.symbol && startDate && endDate && (
          <SummaryLabel>
            {symbolInfo.name ? (
              <>
                {symbolInfo.name}
                <span>({symbolInfo.symbol})</span>
                {symbolInfo.exchange && <span className="exchange">({symbolInfo.exchange})</span>}
              </>
            ) : (
              <span>{symbolInfo.symbol}</span>
            )}
            {' '}from {startDate} to {endDate} -
            <span>{getTimeframeDisplay(selectedTimeframe)}</span>
          </SummaryLabel>
        )}
      </LeftGroup>
      
      <RightGroup>
        {/* View Mode Toggle */}
        <ViewModeToggle
          activeTab={activeTab}
          onTabChange={onTabChange}
        />
        
        {/* Panel Visibility Toggles */}
        {activeTab === 'chart' && (
          <>
            {onToggleRightPanel && (
              <PanelToggleButton
                onClick={onToggleRightPanel}
                title={showRightPanel ? "Hide Right Panel" : "Show Right Panel"}
                $active={showRightPanel}
              >
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <rect x="2" y="2" width="8" height="12" stroke="currentColor" strokeWidth="1.5" fill="none"/>
                  <rect x="11" y="2" width="3" height="12" stroke="currentColor" strokeWidth="1.5" fill={showRightPanel ? "currentColor" : "none"}/>
                </svg>
              </PanelToggleButton>
            )}
            
            {onToggleBottomTable && (
              <PanelToggleButton
                onClick={onToggleBottomTable}
                title={showBottomTable ? "Hide Bottom Table" : "Show Bottom Table"}
                $active={showBottomTable}
              >
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <rect x="2" y="2" width="12" height="8" stroke="currentColor" strokeWidth="1.5" fill="none"/>
                  <rect x="2" y="11" width="12" height="3" stroke="currentColor" strokeWidth="1.5" fill={showBottomTable ? "currentColor" : "none"}/>
                </svg>
              </PanelToggleButton>
            )}
          </>
        )}
        
        {/* Settings Button */}
        <GlobalSettingsToggle onClick={onSettingsToggle} />
      </RightGroup>
    </ContextBarContainer>
  );
};

// ViewModeToggle component for chart/dashboard switching
const ViewModeToggleContainer = styled.div`
  display: flex;
  border-radius: ${ThemeTokens.borderRadius.medium};
  overflow: hidden;
  border: 1px solid ${ThemeTokens.colors.border};
`;

interface TabButtonProps {
  $active: boolean;
}

const TabButton = styled.button<TabButtonProps>`
  padding: ${ThemeTokens.spacing.small} ${ThemeTokens.spacing.medium};
  background-color: ${props => props.$active ? ThemeTokens.colors.accent : ThemeTokens.colors.surface};
  color: ${props => props.$active ? ThemeTokens.colors.textOnAccent : ThemeTokens.colors.textPrimary};
  border: none;
  cursor: pointer;
  transition: all 0.2s ease-in-out;
  
  &:hover {
    background-color: ${props => props.$active ? ThemeTokens.colors.accent : ThemeTokens.colors.surfaceHover};
  }
`;

interface ViewModeToggleProps {
  activeTab: 'chart' | 'dashboard' | 'targets';
  onTabChange: (tab: 'chart' | 'dashboard' | 'targets') => void;
}

const ViewModeToggle: React.FC<ViewModeToggleProps> = ({ activeTab, onTabChange }) => {
  return (
    <ViewModeToggleContainer>
      <TabButton
        $active={activeTab === 'chart'}
        onClick={() => onTabChange('chart')}
      >
        Chart
      </TabButton>
      <TabButton
        $active={activeTab === 'dashboard'}
        onClick={() => onTabChange('dashboard')}
      >
        Dashboard
      </TabButton>
      <TabButton
        $active={activeTab === 'targets'}
        onClick={() => onTabChange('targets')}
      >
        Targets
      </TabButton>
    </ViewModeToggleContainer>
  );
};

// Settings toggle button
const SettingsButton = styled.button`
  background-color: ${ThemeTokens.colors.surface};
  color: ${ThemeTokens.colors.textPrimary};
  border: 1px solid ${ThemeTokens.colors.border};
  border-radius: ${ThemeTokens.borderRadius.small};
  padding: ${ThemeTokens.spacing.small};
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  
  &:hover {
    background-color: ${ThemeTokens.colors.surfaceHover};
  }
`;

// Panel toggle button
interface PanelToggleButtonProps {
  $active?: boolean;
}

const PanelToggleButton = styled.button<PanelToggleButtonProps>`
  background-color: ${props => props.$active ? ThemeTokens.colors.surface : ThemeTokens.colors.surfaceHover};
  color: ${ThemeTokens.colors.textPrimary};
  border: 1px solid ${ThemeTokens.colors.border};
  border-radius: ${ThemeTokens.borderRadius.small};
  padding: ${ThemeTokens.spacing.small};
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: ${props => props.$active ? 1 : 0.7};
  
  &:hover {
    background-color: ${ThemeTokens.colors.surfaceHover};
    opacity: 1;
  }
`;

// Settings toggle button
interface GlobalSettingsToggleProps {
  onClick: () => void;
}

const GlobalSettingsToggle: React.FC<GlobalSettingsToggleProps> = ({ onClick }) => {
  return (
    <SettingsButton onClick={onClick}>
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M8 10C9.10457 10 10 9.10457 10 8C10 6.89543 9.10457 6 8 6C6.89543 6 6 6.89543 6 8C6 9.10457 6.89543 10 8 10Z" fill="currentColor"/>
        <path d="M14 8.2V7.8C14 7.42 13.73 7.17 13.35 7.08C13.04 7 12.79 6.8 12.66 6.51C12.5 6.17 12.62 5.9 12.78 5.63C13.04 5.24 12.93 4.77 12.59 4.42L12.3 4.13C11.96 3.79 11.49 3.67 11.1 3.93C10.83 4.09 10.56 4.21 10.22 4.06C9.93 3.93 9.73 3.67 9.65 3.36C9.56 2.98 9.31 2.71 8.93 2.71H8.07C7.69 2.71 7.44 2.98 7.35 3.36C7.27 3.67 7.07 3.93 6.78 4.06C6.44 4.21 6.17 4.09 5.9 3.93C5.51 3.67 5.04 3.79 4.7 4.13L4.41 4.42C4.07 4.77 3.96 5.24 4.22 5.63C4.38 5.9 4.5 6.17 4.34 6.51C4.21 6.8 3.96 7 3.65 7.08C3.27 7.17 3 7.42 3 7.8V8.2C3 8.58 3.27 8.83 3.65 8.92C3.96 9 4.21 9.2 4.34 9.49C4.5 9.83 4.38 10.1 4.22 10.37C3.96 10.76 4.07 11.23 4.41 11.58L4.7 11.87C5.04 12.21 5.51 12.33 5.9 12.07C6.17 11.91 6.44 11.79 6.78 11.94C7.07 12.07 7.27 12.33 7.35 12.64C7.44 13.02 7.69 13.29 8.07 13.29H8.93C9.31 13.29 9.56 13.02 9.65 12.64C9.73 12.33 9.93 12.07 10.22 11.94C10.56 11.79 10.83 11.91 11.1 12.07C11.49 12.33 11.96 12.21 12.3 11.87L12.59 11.58C12.93 11.23 13.04 10.76 12.78 10.37C12.62 10.1 12.5 9.83 12.66 9.49C12.79 9.2 13.04 9 13.35 8.92C13.73 8.83 14 8.58 14 8.2Z" stroke="currentColor" strokeWidth="1.5" fill="none"/>
      </svg>
    </SettingsButton>
  );
};

export default ContextBar;

// Helper function to parse input date
function parseInputDate(dateStr: string): Date | null {
  const [month, day, year] = dateStr.split('/').map(Number);
  const date = new Date(year, month - 1, day);
  return date.getMonth() === month - 1 && date.getDate() === day ? date : null;
}
