// src/components/Chart/ChartControlBar.tsx
// Toolbar with chart controls
// Timeframe and range selectors
import React from 'react';
import styled from 'styled-components';
import { ThemeTokens } from '../../styles/theme';
import TimeRangeSelector, { TimeRangeOption } from './TimeRangeSelector';

const ControlBarContainer = styled.div`
  display: flex;
  align-items: center;
  padding: ${ThemeTokens.spacing.small};
  background-color: ${ThemeTokens.colors.surface};
  border-bottom: 1px solid ${ThemeTokens.colors.border};
  height: 40px;
`;

const ControlGroup = styled.div`
  display: flex;
  align-items: center;
  margin-right: ${ThemeTokens.spacing.large};
  gap: ${ThemeTokens.spacing.medium};
`;

const Separator = styled.div`
  width: 1px;
  height: 24px;
  background-color: ${ThemeTokens.colors.border};
  margin: 0 ${ThemeTokens.spacing.medium};
`;

const TimeframeSelectWrapper = styled.div`
  position: relative;
`;

const TimeframeLabel = styled.label`
  font-size: ${ThemeTokens.typography.size.small};
  color: ${ThemeTokens.colors.textSecondary};
  margin-right: ${ThemeTokens.spacing.small};
`;

const StyledSelect = styled.select`
  background-color: ${ThemeTokens.colors.surface};
  border: 1px solid ${ThemeTokens.colors.border};
  border-radius: ${ThemeTokens.borderRadius.small};
  padding: ${ThemeTokens.spacing.xsmall} ${ThemeTokens.spacing.medium};
  color: ${ThemeTokens.colors.textPrimary};
  font-size: ${ThemeTokens.typography.size.small};
  cursor: pointer;
  
  &:hover {
    border-color: ${ThemeTokens.colors.accent};
  }
  
  &:focus {
    outline: none;
    border-color: ${ThemeTokens.colors.accent};
    box-shadow: 0 0 0 1px ${ThemeTokens.colors.accent};
  }
`;

const ToggleContainer = styled.div`
  display: flex;
  align-items: center;
`;

const ToggleSwitch = styled.label`
  position: relative;
  display: inline-block;
  width: 36px;
  height: 20px;
  margin-right: ${ThemeTokens.spacing.small};
`;

const ToggleInput = styled.input`
  opacity: 0;
  width: 0;
  height: 0;
  
  &:checked + span {
    background-color: ${ThemeTokens.colors.accent};
  }
  
  &:checked + span:before {
    transform: translateX(16px);
  }
`;

const ToggleSlider = styled.span`
  position: absolute;
  cursor: pointer;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: ${ThemeTokens.colors.inputBackground};
  border-radius: 10px;
  transition: 0.4s;
  
  &:before {
    position: absolute;
    content: "";
    height: 16px;
    width: 16px;
    left: 2px;
    bottom: 2px;
    background-color: ${ThemeTokens.colors.white};
    border-radius: 50%;
    transition: 0.4s;
  }
`;

const ToggleLabel = styled.label`
  font-size: ${ThemeTokens.typography.size.small};
  color: ${ThemeTokens.colors.textSecondary};
`;

const ViewportControlButton = styled.button`
  background-color: ${ThemeTokens.colors.surface};
  border: 1px solid ${ThemeTokens.colors.border};
  border-radius: ${ThemeTokens.borderRadius.small};
  padding: ${ThemeTokens.spacing.xsmall} ${ThemeTokens.spacing.small};
  color: ${ThemeTokens.colors.textPrimary};
  font-size: ${ThemeTokens.typography.size.small};
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  
  &:hover {
    background-color: ${ThemeTokens.colors.surfaceHover};
  }
  
  &:active {
    background-color: ${ThemeTokens.colors.surfaceActive};
  }
`;

interface ChartControlBarProps {
  timeframe: string;
  onTimeframeChange: (timeframe: string) => void;
  showTradingHoursOnly: boolean;
  onTradingHoursToggle: () => void;
  onAutoScale: () => void;
  onResetView: () => void;
  onZoomToFit?: () => void;
  // Time Range Selector props
  activeTimeRange: TimeRangeOption;
  onTimeRangeSelect: (range: TimeRangeOption, startDate: Date, endDate: Date) => void;
}

const ChartControlBar: React.FC<ChartControlBarProps> = ({
  timeframe,
  onTimeframeChange,
  showTradingHoursOnly,
  onTradingHoursToggle,
  onAutoScale,
  onResetView,
  onZoomToFit,
  activeTimeRange,
  onTimeRangeSelect
}) => {
  // Debug the onTimeRangeSelect prop
  console.log('ChartControlBar received onTimeRangeSelect:', 
    typeof onTimeRangeSelect === 'function' ? 'Function ✓' : `Not a function: ${typeof onTimeRangeSelect}`);
  
  const handleTimeframeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newTimeframe = e.target.value;
    console.log('[ChartControlBar] Timeframe changed to:', newTimeframe);
    onTimeframeChange(newTimeframe);
  };

  const handleTradingHoursToggle = () => {
    console.log('[ChartControlBar] Trading hours toggle clicked, current state:', showTradingHoursOnly);
    onTradingHoursToggle();
  };

  const handleAutoScaleClick = () => {
    console.log('[ChartControlBar] Auto-scale button clicked');
    onAutoScale();
  };

  const handleResetViewClick = () => {
    console.log('[ChartControlBar] Reset view button clicked');
    onResetView();
  };

  const handleZoomToFitClick = () => {
    console.log('[ChartControlBar] Zoom to fit button clicked');
    if (onZoomToFit) {
      onZoomToFit();
    }
  };

  const handleTimeRangeClick = (range: TimeRangeOption) => {
    console.log('[ChartControlBar] Time range selected:', range);
    // Calculate start and end dates based on the selected range
    const endDate = new Date();
    const startDate = new Date();
    
    switch (range) {
      case '1D':
        startDate.setDate(endDate.getDate() - 1);
        break;
      case '1W':
        startDate.setDate(endDate.getDate() - 7);
        break;
      case '1M':
        startDate.setMonth(endDate.getMonth() - 1);
        break;
      case '3M':
        startDate.setMonth(endDate.getMonth() - 3);
        break;
      case 'YTD':
        // Set to January 1st of current year
        startDate.setMonth(0);
        startDate.setDate(1);
        break;
      case 'Custom':
        // For custom, we might want to show a date picker dialog
        // For now, default to last 30 days
        startDate.setDate(endDate.getDate() - 30);
        break;
    }
    
    onTimeRangeSelect(range, startDate, endDate);
  };

  return (
    <ControlBarContainer>
      {/* Timeframe Controls */}
      <ControlGroup>
        <TimeframeSelectWrapper>
          <TimeframeLabel htmlFor="timeframe-select">Timeframe:</TimeframeLabel>
          <StyledSelect
            id="timeframe-select"
            value={timeframe}
            onChange={handleTimeframeChange}
          >
            <option value="1min">1m</option>
            <option value="5min">5m</option>
            <option value="15min">15m</option>
            <option value="30min">30m</option>
            <option value="60min">1h</option>
            <option value="daily">D</option>
          </StyledSelect>
        </TimeframeSelectWrapper>
      </ControlGroup>
      
      <Separator />
      
      {/* Trading Hours Toggle */}
      <ControlGroup>
        <ToggleContainer>
          <ToggleSwitch>
            <ToggleInput
              id="trading-hours-toggle"
              type="checkbox"
              checked={showTradingHoursOnly}
              onChange={handleTradingHoursToggle}
            />
            <ToggleSlider />
          </ToggleSwitch>
          <ToggleLabel htmlFor="trading-hours-toggle">Trading Hours Only</ToggleLabel>
        </ToggleContainer>
      </ControlGroup>
      
      <Separator />
      
      {/* Time Range Selector */}
      <ControlGroup>
        <TimeRangeSelector
          activeRange={activeTimeRange}
          onRangeSelect={handleTimeRangeClick}
        />
      </ControlGroup>
      
      <Separator />
      
      {/* Viewport Controls */}
      <ControlGroup>
        {onZoomToFit && (
          <ViewportControlButton onClick={handleZoomToFitClick}>
            Zoom to Fit
          </ViewportControlButton>
        )}
        <ViewportControlButton onClick={handleAutoScaleClick}>
          Auto-Scale
        </ViewportControlButton>
        <ViewportControlButton onClick={handleResetViewClick}>
          Reset View
        </ViewportControlButton>
      </ControlGroup>
    </ControlBarContainer>
  );
};

export default ChartControlBar;
