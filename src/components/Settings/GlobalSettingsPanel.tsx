// src/components/Settings/GlobalSettingsPanel.tsx
// Global settings panel for TriSight application-wide settings
// Includes live polling interval configuration

import React, { useState } from 'react';
import styled from 'styled-components';
import { ThemeTokens } from '../../styles/theme';
import { getPollingInterval, setPollingInterval } from '../../settings/globalSettings';

const PanelContainer = styled.div`
  padding: ${ThemeTokens.spacing.medium};
  border-top: 1px solid ${ThemeTokens.colors.border};
`;

const HeaderRow = styled.h3`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin: 0 0 ${ThemeTokens.spacing.small} 0;
  font-size: ${ThemeTokens.typography.size.small};
  font-weight: ${ThemeTokens.typography.weight.semibold};
  text-transform: uppercase;
  color: ${ThemeTokens.colors.textSecondary};
  cursor: pointer;
`;

const ChevronIcon = styled.span<{ $open: boolean }>`
  display: inline-block;
  transform: ${({ $open }) => ($open ? 'rotate(90deg)' : 'rotate(0deg)')};
  transition: transform 0.2s ease;
  color: ${ThemeTokens.colors.textSecondary};
`;

const ContentArea = styled.div<{ $open: boolean }>`
  display: ${({ $open }) => ($open ? 'block' : 'none')};
  margin-top: ${ThemeTokens.spacing.small};
`;

const SettingRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: ${ThemeTokens.spacing.small};
  padding: ${ThemeTokens.spacing.small} 0;
`;

const SettingLabel = styled.label`
  font-size: ${ThemeTokens.typography.size.small};
  color: ${ThemeTokens.colors.textPrimary};
  font-weight: ${ThemeTokens.typography.weight.medium};
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: ${ThemeTokens.spacing.small};
`;

const HelpText = styled.div`
  font-size: ${ThemeTokens.typography.size.xsmall};
  color: ${ThemeTokens.colors.textSecondary};
  margin-top: 4px;
  line-height: 1.4;
`;

const NumberInput = styled.input`
  padding: 6px 12px;
  border: 1px solid ${ThemeTokens.colors.border};
  border-radius: 4px;
  background: ${ThemeTokens.colors.background};
  color: ${ThemeTokens.colors.textPrimary};
  font-size: ${ThemeTokens.typography.size.small};
  width: 80px;
  cursor: pointer;

  &:focus {
    outline: none;
    border-color: ${ThemeTokens.colors.accent};
    box-shadow: 0 0 0 2px ${ThemeTokens.colors.accent}20;
  }

  &:hover {
    border-color: ${ThemeTokens.colors.textSecondary};
  }
`;

interface GlobalSettingsPanelProps {
  className?: string;
}

export function GlobalSettingsPanel({ className }: GlobalSettingsPanelProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [pollingInterval, setPollingIntervalState] = useState(getPollingInterval());

  const updatePolling = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVal = parseInt(e.target.value, 10);
    if (!isNaN(newVal) && newVal >= 10 && newVal <= 3600) {
      setPollingInterval(newVal);
      setPollingIntervalState(newVal);
      console.debug('[GlobalSettingsPanel] Updated polling interval:', newVal, 'seconds');
    }
  };

  return (
    <PanelContainer className={className}>
      <HeaderRow onClick={() => setIsOpen(!isOpen)}>
        Global Settings
        <ChevronIcon $open={isOpen}>▶</ChevronIcon>
      </HeaderRow>
      
      <ContentArea $open={isOpen}>
        {/* Live Polling Interval Setting */}
        <SettingRow>
          <SettingLabel htmlFor="polling-interval-input">
            Live Polling Interval (seconds)
            <HelpText>How often to automatically refresh pattern data and signals. Range: 10-3600 seconds.</HelpText>
          </SettingLabel>
          <NumberInput
            id="polling-interval-input"
            type="number"
            value={pollingInterval}
            onChange={updatePolling}
            min={10}
            max={3600}
            step={10}
            title="Polling interval in seconds (10-3600)"
          />
        </SettingRow>

        {/* Existing global settings UI placeholder */}
        {/* Additional global settings can be added here in the future */}
      </ContentArea>
    </PanelContainer>
  );
}

export default GlobalSettingsPanel;
