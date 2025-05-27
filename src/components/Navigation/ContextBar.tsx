// src/components/Navigation/ContextBar.tsx
// Top bar with search and date
// Switches between app tabs
import React from 'react';
import styled from 'styled-components';
import SymbolSearch from '../SymbolSearch';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { ThemeTokens } from '../../styles/theme';

// Container for the entire context bar
const ContextBarContainer = styled.div`
  display: flex;
  align-items: center;
  padding: ${ThemeTokens.spacing.medium};
  background-color: ${ThemeTokens.colors.primary};
  border-bottom: 1px solid ${ThemeTokens.colors.border};
  height: 60px;
`;

// Group for search and date picker
const LeftGroup = styled.div`
  display: flex;
  align-items: center;
  flex: 1;
  gap: ${ThemeTokens.spacing.medium};
`;

// Group for view toggles and settings
const RightGroup = styled.div`
  display: flex;
  align-items: center;
  gap: ${ThemeTokens.spacing.medium};
`;

// Wrapper for keeping original styles while adding new positioning
const DatePickerWrapper = styled.div`
  .react-datepicker-wrapper {
    width: auto;
  }
  
  .react-datepicker__input-container input {
    background-color: ${ThemeTokens.colors.surface};
    border: 1px solid ${ThemeTokens.colors.border};
    border-radius: ${ThemeTokens.borderRadius.small};
    padding: ${ThemeTokens.spacing.small};
    color: ${ThemeTokens.colors.textPrimary};
    font-size: ${ThemeTokens.typography.size.small};
  }
`;

interface ContextBarProps {
  selectedDate: Date;
  onDateChange: (date: Date | null) => void;
  activeTab: 'chart' | 'dashboard';
  onTabChange: (tab: 'chart' | 'dashboard') => void;
  onSettingsToggle: () => void;
}

const ContextBar: React.FC<ContextBarProps> = ({
  selectedDate,
  onDateChange,
  activeTab,
  onTabChange,
  onSettingsToggle,
}) => {
  return (
    <ContextBarContainer>
      <LeftGroup>
        {/* Search Control */}
        <SymbolSearch />
        
        {/* Date Control */}
        <DatePickerWrapper>
          <DatePicker
            selected={selectedDate}
            onChange={onDateChange}
            dateFormat="MM/dd/yyyy"
          />
        </DatePickerWrapper>
      </LeftGroup>
      
      <RightGroup>
        {/* View Mode Toggle */}
        <ViewModeToggle
          activeTab={activeTab}
          onTabChange={onTabChange}
        />
        
        {/* Global Settings Toggle */}
        <GlobalSettingsToggle
          onClick={onSettingsToggle}
        />
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
  activeTab: 'chart' | 'dashboard';
  onTabChange: (tab: 'chart' | 'dashboard') => void;
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
