// src/components/Settings/DebugSettingsPanel.tsx
// Checkbox list of runtime debug channels
// NOTE: TriSight uses Canvas, not SVG. This file supports runtime debug channel toggling.

import React, { useEffect, useState } from 'react';
import styled from 'styled-components';
import { getDebugSettings, setChannelEnabled, logDebug } from '../../utils/debug';
import { ThemeTokens } from '../../styles/theme';

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
`;

const Content = styled.div<{ $open: boolean }>`
  overflow: hidden;
  max-height: ${({ $open }) => ($open ? '800px' : '0')};
  transition: max-height 0.3s ease;
`;

const ChannelRow = styled.label`
  display: flex;
  align-items: center;
  gap: ${ThemeTokens.spacing.small};
  font-size: ${ThemeTokens.typography.size.small};
  color: ${ThemeTokens.colors.textPrimary};
  margin-bottom: ${ThemeTokens.spacing.xsmall};
`;

const InfoLabel = styled.p`
  font-size: ${ThemeTokens.typography.size.xsmall};
  color: ${ThemeTokens.colors.textSecondary};
  margin-top: ${ThemeTokens.spacing.small};
`;

const DebugSettingsPanel: React.FC = () => {
  const [settings, setSettings] = useState<Record<string, boolean>>({});
  const [open, setOpen] = useState(true);
  const [showHAComparisons, setShowHAComparisons] = useState(false);
  const [signalFidelityMode, setSignalFidelityMode] = useState(false);
  const [showEngineHUD, setShowEngineHUD] = useState(false);
  const [renderDiagnostics, setRenderDiagnostics] = useState(false);

  useEffect(() => {
    setSettings(getDebugSettings());
    // Check for HA comparison setting in localStorage
    const haComparison = localStorage.getItem('trisight_ha_comparisons');
    setShowHAComparisons(haComparison === 'true');
    
    // Check for signal fidelity mode settings
    const fidelityMode = localStorage.getItem('signalFidelityMode');
    setSignalFidelityMode(fidelityMode === 'true');
    
    const hudEnabled = localStorage.getItem('signalEngineHUD');
    setShowEngineHUD(hudEnabled === 'true');
    
    const renderLogs = localStorage.getItem('renderLogsEnabled');
    setRenderDiagnostics(renderLogs === 'true');
  }, []);

  const handleToggle = (channel: string) => (e: React.ChangeEvent<HTMLInputElement>) => {
    const enabled = e.target.checked;
    setSettings(prev => ({ ...prev, [channel]: enabled }));
    setChannelEnabled(channel, enabled);
    logDebug('DEBUG_UI', '[DebugSettingsPanel] Toggled channel:', channel, enabled);
  };

  const handleHAToggle = (e: React.ChangeEvent<HTMLInputElement>) => {
    const enabled = e.target.checked;
    setShowHAComparisons(enabled);
    localStorage.setItem('trisight_ha_comparisons', enabled.toString());
    logDebug('DEBUG_UI', '[DebugSettingsPanel] Toggled HA comparisons:', enabled);
    
    if (enabled) {
      // Enable HA-related debug channels when HA comparisons are turned on
      setChannelEnabled('DEBUG_PATTERN_DETECT', true);
      setSettings(prev => ({ ...prev, 'DEBUG_PATTERN_DETECT': true }));
    }
  };

  const channels = Object.keys(settings);

  return (
    <PanelContainer>
      <HeaderRow onClick={() => setOpen(prev => !prev)}>
        Debug Settings <ChevronIcon $open={open}>▶</ChevronIcon>
      </HeaderRow>
      <Content $open={open}>
        <div style={{ marginBottom: ThemeTokens.spacing.xsmall, fontWeight: 600 }}>Runtime Log Channels</div>
        {channels.map(channel => (
          <ChannelRow key={channel} htmlFor={`dbg-${channel}`}>
            <input
              id={`dbg-${channel}`}
              type="checkbox"
              checked={!!settings[channel]}
              onChange={handleToggle(channel)}
            />
            <span>{channel}</span>
          </ChannelRow>
        ))}
        <ChannelRow htmlFor="dbg-ha-comparisons">
          <input
            id="dbg-ha-comparisons"
            type="checkbox"
            checked={showHAComparisons}
            onChange={handleHAToggle}
          />
          <span>HA Comparisons</span>
        </ChannelRow>
        
        <div style={{ marginTop: ThemeTokens.spacing.medium, marginBottom: ThemeTokens.spacing.xsmall, fontWeight: 600 }}>🛠 Signal Engine Controls</div>
        
        <ChannelRow htmlFor="dbg-signal-fidelity">
          <input
            id="dbg-signal-fidelity"
            type="checkbox"
            checked={signalFidelityMode}
            onChange={(e) => {
              const enabled = e.target.checked;
              setSignalFidelityMode(enabled);
              localStorage.setItem('signalFidelityMode', enabled.toString());
              if ((window as any).signalFidelityPatch) {
                (window as any).signalFidelityPatch.setFidelityMode(enabled);
              }
              logDebug('DEBUG_UI', '[DebugSettingsPanel] Signal Fidelity Mode:', enabled);
            }}
          />
          <span>Signal Fidelity Mode</span>
        </ChannelRow>
        
        <ChannelRow htmlFor="dbg-engine-hud">
          <input
            id="dbg-engine-hud"
            type="checkbox"
            checked={showEngineHUD}
            onChange={(e) => {
              const enabled = e.target.checked;
              setShowEngineHUD(enabled);
              localStorage.setItem('signalEngineHUD', enabled.toString());
              logDebug('DEBUG_UI', '[DebugSettingsPanel] Engine HUD:', enabled);
            }}
          />
          <span>Show Engine HUD</span>
        </ChannelRow>
        
        <ChannelRow htmlFor="dbg-render-diagnostics">
          <input
            id="dbg-render-diagnostics"
            type="checkbox"
            checked={renderDiagnostics}
            onChange={(e) => {
              const enabled = e.target.checked;
              setRenderDiagnostics(enabled);
              localStorage.setItem('renderLogsEnabled', enabled.toString());
              logDebug('DEBUG_UI', '[DebugSettingsPanel] Render Diagnostics:', enabled);
            }}
          />
          <span>Render Diagnostics</span>
        </ChannelRow>
        <InfoLabel>Logs are developer-facing and stored locally.</InfoLabel>
      </Content>
    </PanelContainer>
  );
};

export default DebugSettingsPanel;
