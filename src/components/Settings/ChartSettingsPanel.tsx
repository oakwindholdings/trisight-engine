// src/components/Settings/ChartSettingsPanel.tsx
// Chart display settings panel including candle type selection
// NOTE: TriSight uses Canvas, not SVG. This panel controls chart rendering options.

import React, { useState } from 'react';
import styled from 'styled-components';
import { useChartSettings } from '../../contexts/ChartSettingsContext';
import { CandleType } from '../../hooks/useHeikinAshiTransform';
import { ThemeTokens } from '../../styles/theme';
import { logDebug } from '../../utils/debug';

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

const Select = styled.select`
  padding: 6px 12px;
  border: 1px solid ${ThemeTokens.colors.border};
  border-radius: 4px;
  background: ${ThemeTokens.colors.background};
  color: ${ThemeTokens.colors.textPrimary};
  font-size: ${ThemeTokens.typography.size.small};
  min-width: 120px;
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

const Checkbox = styled.input`
  margin: 0;
  cursor: pointer;
  
  &:focus {
    outline: 2px solid ${ThemeTokens.colors.accent};
    outline-offset: 2px;
  }
`;

const ButtonRow = styled.div`
  display: flex;
  gap: ${ThemeTokens.spacing.small};
  margin-top: ${ThemeTokens.spacing.medium};
  padding-top: ${ThemeTokens.spacing.small};
  border-top: 1px solid ${ThemeTokens.colors.border};
`;

const Button = styled.button`
  padding: 6px 12px;
  border: 1px solid ${ThemeTokens.colors.border};
  border-radius: 4px;
  background: ${ThemeTokens.colors.background};
  color: ${ThemeTokens.colors.textPrimary};
  font-size: ${ThemeTokens.typography.size.small};
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    background: ${ThemeTokens.colors.surfaceHover};
    border-color: ${ThemeTokens.colors.textSecondary};
  }

  &:focus {
    outline: none;
    border-color: ${ThemeTokens.colors.accent};
    box-shadow: 0 0 0 2px ${ThemeTokens.colors.accent}20;
  }
`;

const CandleTypeDescription: Record<CandleType, string> = {
  ohlc: 'Standard OHLC bars show actual market prices with full detail.',
  heikin_ashi: 'Heikin-Ashi candles smooth price data to highlight trends and reduce noise.'
};

interface ChartSettingsPanelProps {
  className?: string;
}

export function ChartSettingsPanel({ className }: ChartSettingsPanelProps) {
  const [isOpen, setIsOpen] = useState(false);
  const {
    candleType,
    showVolume,
    showGrid,
    setCandleType,
    setShowVolume,
    setShowGrid,
    resetToDefaults,
    isHeikinAshiMode
  } = useChartSettings();

  const handleCandleTypeChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const newType = event.target.value as CandleType;
    logDebug('DEBUG_UI', '[ChartSettingsPanel] Candle type selection changed:', {
      from: candleType,
      to: newType
    });
    setCandleType(newType);
  };

  const handleShowVolumeChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setShowVolume(event.target.checked);
  };

  const handleShowGridChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setShowGrid(event.target.checked);
  };

  const handleReset = () => {
    logDebug('DEBUG_UI', '[ChartSettingsPanel] Resetting chart settings to defaults');
    resetToDefaults();
  };

  return (
    <PanelContainer className={className}>
      <HeaderRow onClick={() => setIsOpen(!isOpen)}>
        Chart Settings
        <ChevronIcon $open={isOpen}>▶</ChevronIcon>
      </HeaderRow>
      
      <ContentArea $open={isOpen}>
        {/* Candle Type Selection */}
        <SettingRow>
          <SettingLabel htmlFor="candle-type-select">
            Candle Type
            <HelpText>{CandleTypeDescription[candleType]}</HelpText>
          </SettingLabel>
          <Select
            id="candle-type-select"
            value={candleType}
            onChange={handleCandleTypeChange}
          >
            <option value="ohlc">Standard (OHLC)</option>
            <option value="heikin_ashi">Heikin-Ashi</option>
          </Select>
        </SettingRow>

        {/* Volume Display Toggle */}
        <SettingRow>
          <SettingLabel htmlFor="show-volume-checkbox">
            Show Volume
            <HelpText>Display volume bars at the bottom of the chart.</HelpText>
          </SettingLabel>
          <Checkbox
            id="show-volume-checkbox"
            type="checkbox"
            checked={showVolume}
            onChange={handleShowVolumeChange}
          />
        </SettingRow>

        {/* Grid Display Toggle */}
        <SettingRow>
          <SettingLabel htmlFor="show-grid-checkbox">
            Show Grid
            <HelpText>Display price and time grid lines for reference.</HelpText>
          </SettingLabel>
          <Checkbox
            id="show-grid-checkbox"
            type="checkbox"
            checked={showGrid}
            onChange={handleShowGridChange}
          />
        </SettingRow>

        {/* Heikin-Ashi Mode Indicator */}
        {isHeikinAshiMode && (
          <SettingRow>
            <div style={{ 
              padding: '8px 12px', 
              background: ThemeTokens.colors.accent + '20',
              border: `1px solid ${ThemeTokens.colors.accent}`,
              borderRadius: '4px',
              fontSize: ThemeTokens.typography.size.xsmall,
              color: ThemeTokens.colors.accent,
              fontWeight: ThemeTokens.typography.weight.medium,
              width: '100%'
            }}>
              ✓ Heikin-Ashi mode active - Price data is smoothed for trend clarity
            </div>
          </SettingRow>
        )}

        {/* Action Buttons */}
        <ButtonRow>
          <Button onClick={handleReset}>Reset to Defaults</Button>
        </ButtonRow>
      </ContentArea>
    </PanelContainer>
  );
}

export default ChartSettingsPanel;
