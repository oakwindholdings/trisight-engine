// src/components/Settings/ChartSettingsPanel.tsx
// Chart display settings panel including candle type selection
// NOTE: TriSight uses Canvas, not SVG. This panel controls chart rendering options.

import React, { useState, useEffect } from 'react';
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

// Signal label types
const SIGNAL_LABELS = ['BUY', 'SELL', 'COVER', 'SHORT'] as const;

type SignalLabelType = typeof SIGNAL_LABELS[number];

function getDefaultSignalLabelSettings() {
  return SIGNAL_LABELS.reduce((acc, label) => {
    acc[label] = true;
    return acc;
  }, {} as Record<SignalLabelType, boolean>);
}

interface ChartSettingsPanelProps {
  className?: string;
}

export function ChartSettingsPanel({ className }: ChartSettingsPanelProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [showConvictionCloud, setShowConvictionCloud] = useState(false);
  
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

  // Load ConvictionCloud visibility from localStorage on mount
  useEffect(() => {
    const savedSetting = localStorage.getItem('trisight.chart.showConvictionCloud');
    if (savedSetting !== null) {
      const isVisible = JSON.parse(savedSetting);
      setShowConvictionCloud(isVisible);
      logDebug('DEBUG_UI', '[ChartSettingsPanel] Loaded ConvictionCloud visibility from localStorage:', isVisible);
    } else {
      logDebug('DEBUG_UI', '[ChartSettingsPanel] ConvictionCloud visibility defaulting to false (off)');
    }
  }, []);

  // Signal label toggles
  const [signalLabelSettings, setSignalLabelSettings] = useState<Record<SignalLabelType, boolean>>(() => {
    const saved = localStorage.getItem('trisight.chart.signalLabelSettings');
    return saved ? JSON.parse(saved) : getDefaultSignalLabelSettings();
  });

  useEffect(() => {
    localStorage.setItem('trisight.chart.signalLabelSettings', JSON.stringify(signalLabelSettings));
  }, [signalLabelSettings]);

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

  const handleShowConvictionCloudChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const isVisible = event.target.checked;
    setShowConvictionCloud(isVisible);
    
    // Save to localStorage
    localStorage.setItem('trisight.chart.showConvictionCloud', JSON.stringify(isVisible));
    logDebug('DEBUG_UI', '[ChartSettingsPanel] ConvictionCloud visibility changed:', isVisible);
    
    // Emit a custom event to notify other components
    window.dispatchEvent(new CustomEvent('convictionCloudVisibilityChanged', {
      detail: { visible: isVisible }
    }));
  };

  const handleReset = () => {
    logDebug('DEBUG_UI', '[ChartSettingsPanel] Resetting chart settings to defaults');
    resetToDefaults();
    
    // Reset ConvictionCloud visibility to default (off)
    setShowConvictionCloud(false);
    localStorage.setItem('trisight.chart.showConvictionCloud', JSON.stringify(false));
    
    // Notify other components
    window.dispatchEvent(new CustomEvent('convictionCloudVisibilityChanged', {
      detail: { visible: false }
    }));
  };

  const handleSignalLabelToggle = (label: SignalLabelType) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setSignalLabelSettings(prev => ({ ...prev, [label]: e.target.checked }));
  };

  return (
    <PanelContainer className={className}>
      <HeaderRow onClick={() => setIsOpen(!isOpen)}>
        Chart Settings
        <ChevronIcon $open={isOpen}>▶</ChevronIcon>
      </HeaderRow>
      
      <ContentArea $open={isOpen}>
        {/* Signal Label Toggles */}
        <SettingRow>
          <SettingLabel>
            Signal Label Visibility
            <HelpText>Show/hide signal labels on chart. Does not affect detection or analytics.</HelpText>
          </SettingLabel>
          <div style={{ display: 'flex', gap: '12px' }}>
            {SIGNAL_LABELS.map(label => (
              <label key={label} style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Checkbox
                  type="checkbox"
                  checked={signalLabelSettings[label]}
                  onChange={handleSignalLabelToggle(label)}
                />
                {label}
              </label>
            ))}
          </div>
        </SettingRow>

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

        {/* ConvictionCloud Display Toggle */}
        <SettingRow>
          <SettingLabel htmlFor="show-conviction-cloud-checkbox">
            Show ConvictionCloud
            <HelpText>Display pattern conviction scores as an interactive cloud overlay on the chart canvas.</HelpText>
          </SettingLabel>
          <Checkbox
            id="show-conviction-cloud-checkbox"
            type="checkbox"
            checked={showConvictionCloud}
            onChange={handleShowConvictionCloudChange}
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
