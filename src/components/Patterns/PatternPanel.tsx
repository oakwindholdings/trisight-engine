// src/components/Patterns/PatternPanel.tsx
// Side panel listing patterns
// Includes adaptive controls
import React, { useState } from 'react';
import styled from 'styled-components';
import { ThemeTokens } from '../../styles/theme';
import { Pattern, PatternType, ThrustDirection, ChannelDirection } from '../../models/PatternTypes';
import { usePatternContext } from '../../contexts/PatternContext';
import AdaptivePatternControls from './AdaptivePatternControls';
import GoldmineChannelSettingsPanel from './GoldmineChannelSettingsPanel';
import GoldmineShaftSettingsPanel from './GoldmineShaftSettingsPanel';
import RocketmanSettingsPanel from './RocketmanSettingsPanel';
import BlackjackSettingsPanel from './BlackjackSettingsPanel';
import EscalatorSettingsPanel from './EscalatorSettingsPanel';
import PivotSettingsPanel from '../Settings/PivotSettingsPanel';

const PanelContainer = styled.div`
  display: flex;
  flex-direction: column;
  width: 280px;
  height: 100%;
  background-color: ${ThemeTokens.colors.surface};
  border-left: 1px solid ${ThemeTokens.colors.border};
`;

const PanelHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: ${ThemeTokens.spacing.medium};
  border-bottom: 1px solid ${ThemeTokens.colors.border};
`;

const PanelTitle = styled.h2`
  font-size: ${ThemeTokens.typography.size.medium};
  font-weight: ${ThemeTokens.typography.weight.semibold};
  color: ${ThemeTokens.colors.textPrimary};
  margin: 0;
`;

const PanelBody = styled.div`
  flex: 1;
  overflow-y: auto;
  padding: ${ThemeTokens.spacing.small};
`;

const Section = styled.div`
  margin-bottom: ${ThemeTokens.spacing.medium};
`;

const SectionHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  cursor: pointer;
  padding: ${ThemeTokens.spacing.small} 0;
  border-bottom: 1px solid ${ThemeTokens.colors.border};
`;

const SectionTitle = styled.h3`
  font-size: ${ThemeTokens.typography.size.small};
  font-weight: ${ThemeTokens.typography.weight.semibold};
  color: ${ThemeTokens.colors.textSecondary};
  text-transform: uppercase;
  margin: 0;
`;

const SectionContent = styled.div<{ $isOpen: boolean }>`
  max-height: ${props => props.$isOpen ? '1000px' : '0px'};
  overflow: hidden;
  transition: max-height 0.3s ease-in-out;
  padding-top: ${props => props.$isOpen ? ThemeTokens.spacing.small : '0'};
  padding-bottom: ${props => props.$isOpen ? ThemeTokens.spacing.small : '0'};
`;

const ChevronIcon = styled.span<{ $isOpen: boolean }>`
  transform: ${props => props.$isOpen ? 'rotate(90deg)' : 'rotate(0deg)'};
  transition: transform 0.3s ease;
  font-size: ${ThemeTokens.typography.size.medium};
  line-height: 1;
`;

const FilterGroup = styled.div`
  margin-bottom: ${ThemeTokens.spacing.medium};
`;

const FilterLabel = styled.label`
  display: block;
  font-size: ${ThemeTokens.typography.size.small};
  color: ${ThemeTokens.colors.textSecondary};
  margin-bottom: ${ThemeTokens.spacing.xsmall};
`;

const FilterSelect = styled.select`
  width: 100%;
  background-color: ${ThemeTokens.colors.inputBackground};
  border: 1px solid ${ThemeTokens.colors.border};
  border-radius: ${ThemeTokens.borderRadius.small};
  padding: ${ThemeTokens.spacing.small};
  color: ${ThemeTokens.colors.textPrimary};
  font-size: ${ThemeTokens.typography.size.small};
`;

const RangeContainer = styled.div`
  width: 100%;
`;

const RangeSlider = styled.input`
  width: 100%;
  margin: ${ThemeTokens.spacing.small} 0;
`;

const RangeLabels = styled.div`
  display: flex;
  justify-content: space-between;
  font-size: ${ThemeTokens.typography.size.xsmall};
  color: ${ThemeTokens.colors.textSecondary};
`;

interface PatternPanelProps {
  patterns: Pattern[];
  selectedPattern: Pattern | null;
  onPatternSelect: (pattern: Pattern) => void;
  patternFilters: {
    successRate: number;
    timeframe: string;
    patternType: string;
  };
  onFilterChange: (filters: any) => void;
  chartHeight?: number;
  onChartHeightChange?: (height: number) => void;
}

const PatternPanel: React.FC<PatternPanelProps> = ({
  patterns,
  selectedPattern,
  onPatternSelect,
  patternFilters,
  onFilterChange,
  chartHeight = 500,
  onChartHeightChange,
}) => {
  // Access pattern context for preferences
  const { preferences = { enabledPatternTypes: [] }, updatePreferences } = usePatternContext();
  // Define section names as a type for type safety
  type SectionName = 'globalSettings' |
                  'goldmineChannelSettings' | 'goldmineShaftSettings' | 'rocketmanSettings' | 
                  'blackjackSettings' | 'escalatorSettings' | 'pivotSettings';
  
  // State to track which sections are open
  const [openSections, setOpenSections] = useState<Record<SectionName, boolean>>({
    globalSettings: false, // All sections closed by default
    goldmineChannelSettings: false,
    goldmineShaftSettings: false,
    rocketmanSettings: false,
    blackjackSettings: false,
    escalatorSettings: false,
    pivotSettings: false
  });
  
  // State for pattern settings
  const [goldmineChannelSettings, setGoldmineChannelSettings] = useState({
    enabled: true,
    minTouchPoints: 4,
    priceTolerance: 0.2,
    minChannelHeight: 1.5,
    minChannelDuration: 20,
    confidenceThreshold: 0.5,
    preferredDirection: 'ALL' as 'ALL' | ChannelDirection
  });
  
  const [goldmineShaftSettings, setGoldmineShaftSettings] = useState({
    enabled: true,
    minThrustMagnitude: 1.5,
    minRetracementPercentage: 30,
    maxRetracementPercentage: 60,
    thrustDurationRange: [5, 20] as [number, number],
    preferredDirection: 'BOTH' as 'BOTH' | ThrustDirection,
    confidenceThreshold: 0.5
  });
  
  const [rocketmanSettings, setRocketmanSettings] = useState({
    enabled: true,
    minAccelerationRate: 0.2,
    minIntensity: 0.5,
    minMomentumScore: 0.6,
    minVolumeConfirmation: 0.5,
    lookbackPeriods: 5,
    preferredDirection: 'BOTH' as 'BOTH' | ThrustDirection
  });
  
  const [blackjackSettings, setBlackjackSettings] = useState({
    enabled: true,
    lookbackPeriods: 7,
    minScore: 2,
    showContextTimeframe: true,
    contextTimeframeMultiplier: 5,
    basePriceChangeThreshold: 0.1,
    baseVolumeChangeThreshold: 0.5
  });
  
  const [escalatorSettings, setEscalatorSettings] = useState({
    enabled: true,
    minSteps: 3,
    minStepSize: 0.5,
    maxConsolidationVolatility: 1.0,
    basePriceChangeThreshold: 0.01,
    baseVolumeChangeThreshold: 0.05,
    useContextTimeframe: true,
    contextTimeframeMultiplier: 3,
    minScore: 2.0,
    preferredDirection: 'BOTH' as 'BOTH' | ThrustDirection
  });
  
  const [pivotSettings, setPivotSettings] = useState({
    touchPointThreshold: 3,
    priceTolerance: 0.3,
    confidenceThreshold: 0.6,
    volumeReactionThreshold: 1.2,
    minimumTouchGap: 3,
    detectSupport: true,
    detectResistance: true
  });
  
  const toggleSection = (section: SectionName) => {
    setOpenSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };
  return (
    <PanelContainer>
      <PanelHeader>
        <PanelTitle>Settings</PanelTitle>
      </PanelHeader>
      
      <PanelBody>
        {/* Global Pattern Detection Settings */}
        <Section>
          <SectionHeader onClick={() => toggleSection('globalSettings')}>
            <SectionTitle>Global Settings</SectionTitle>
            <ChevronIcon $isOpen={openSections.globalSettings}>›</ChevronIcon>
          </SectionHeader>
          <SectionContent $isOpen={openSections.globalSettings}>
            <AdaptivePatternControls 
              preferences={preferences}
              updatePreferences={updatePreferences}
              detectionStats={{}}
            />

            <FilterGroup style={{ marginTop: '16px' }}>
              <FilterLabel>Success Rate Filter (Min: {patternFilters.successRate}%)</FilterLabel>
              <RangeContainer>
                <RangeSlider
                  type="range"
                  min="0"
                  max="100"
                  value={patternFilters.successRate}
                  onChange={(e) => onFilterChange({...patternFilters, successRate: parseInt(e.target.value)})}
                />
                <RangeLabels>
                  <span>0%</span>
                  <span>50%</span>
                  <span>100%</span>
                </RangeLabels>
              </RangeContainer>
            </FilterGroup>

            <FilterGroup>
              <FilterLabel>Pattern Type Filter</FilterLabel>
              <FilterSelect 
                value={patternFilters.patternType}
                onChange={(e) => onFilterChange({...patternFilters, patternType: e.target.value})}
              >
                <option value="all">All Types</option>
                <option value="reversal">Reversal</option>
                <option value="continuation">Continuation</option>
                <option value="breakout">Breakout</option>
              </FilterSelect>
            </FilterGroup>

            <FilterGroup>
              <FilterLabel>Chart Height (px)</FilterLabel>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <RangeSlider
                  type="range"
                  min="200"
                  max="2000"
                  step="50"
                  value={chartHeight}
                  style={{ flex: 1 }}
                  onChange={(e) => onChartHeightChange && onChartHeightChange(parseInt(e.target.value))}
                />
                <input
                  type="number"
                  value={chartHeight}
                  onChange={(e) => onChartHeightChange && onChartHeightChange(parseInt(e.target.value))}
                  style={{
                    width: '60px',
                    padding: '4px',
                    textAlign: 'right',
                    border: `1px solid ${ThemeTokens.colors.border}`,
                    borderRadius: ThemeTokens.borderRadius.small,
                  }}
                  min="200"
                  max="2000"
                  step="50"
                />
              </div>
              <div style={{ fontSize: '10px', color: ThemeTokens.colors.textSecondary, marginTop: '4px' }}>
                Changes are automatically saved to your browser
              </div>
            </FilterGroup>
          </SectionContent>
        </Section>
        
        {/* Goldmine Channel Pattern */}
        <Section>
          <SectionHeader onClick={() => toggleSection('goldmineChannelSettings')}>
            <SectionTitle>
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <input 
                  type="checkbox" 
                  id="enable-goldmine-channel"
                  checked={preferences?.enabledPatternTypes?.includes(PatternType.GOLDMINE_CHANNEL) || false}
                  onChange={(e) => {
                    const currentTypes = preferences?.enabledPatternTypes || [];
                    const updatedTypes = e.target.checked
                      ? [...currentTypes, PatternType.GOLDMINE_CHANNEL]
                      : currentTypes.filter((t: PatternType) => t !== PatternType.GOLDMINE_CHANNEL);
                    updatePreferences({
                      ...preferences,
                      enabledPatternTypes: updatedTypes
                    });
                  }}
                  onClick={(e) => e.stopPropagation()}
                  style={{ marginRight: '8px' }}
                />
                Goldmine Channel
              </div>
            </SectionTitle>
            <ChevronIcon $isOpen={openSections.goldmineChannelSettings}>›</ChevronIcon>
          </SectionHeader>
          <SectionContent $isOpen={openSections.goldmineChannelSettings}>
            <GoldmineChannelSettingsPanel 
              settings={goldmineChannelSettings}
              onSettingsChange={setGoldmineChannelSettings}
            />
          </SectionContent>
        </Section>
        
        {/* Goldmine Shaft Pattern */}
        <Section>
          <SectionHeader onClick={() => toggleSection('goldmineShaftSettings')}>
            <SectionTitle>
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <input 
                  type="checkbox" 
                  id="enable-goldmine-shaft"
                  checked={preferences?.enabledPatternTypes?.includes(PatternType.GOLDMINE_SHAFT) || false}
                  onChange={(e) => {
                    const currentTypes = preferences?.enabledPatternTypes || [];
                    const updatedTypes = e.target.checked
                      ? [...currentTypes, PatternType.GOLDMINE_SHAFT]
                      : currentTypes.filter((t: PatternType) => t !== PatternType.GOLDMINE_SHAFT);
                    updatePreferences({
                      ...preferences,
                      enabledPatternTypes: updatedTypes
                    });
                  }}
                  onClick={(e) => e.stopPropagation()}
                  style={{ marginRight: '8px' }}
                />
                Goldmine Shaft
              </div>
            </SectionTitle>
            <ChevronIcon $isOpen={openSections.goldmineShaftSettings}>›</ChevronIcon>
          </SectionHeader>
          <SectionContent $isOpen={openSections.goldmineShaftSettings}>
            <GoldmineShaftSettingsPanel 
              settings={goldmineShaftSettings}
              onSettingsChange={setGoldmineShaftSettings}
            />
          </SectionContent>
        </Section>

        {/* Rocketman Pattern */}
        <Section>
          <SectionHeader onClick={() => toggleSection('rocketmanSettings')}>
            <SectionTitle>
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <input 
                  type="checkbox" 
                  id="enable-rocketman"
                  checked={preferences?.enabledPatternTypes?.includes(PatternType.ROCKETMAN) || false}
                  onChange={(e) => {
                    const currentTypes = preferences?.enabledPatternTypes || [];
                    const updatedTypes = e.target.checked
                      ? [...currentTypes, PatternType.ROCKETMAN]
                      : currentTypes.filter((t: PatternType) => t !== PatternType.ROCKETMAN);
                    updatePreferences({
                      ...preferences,
                      enabledPatternTypes: updatedTypes
                    });
                  }}
                  onClick={(e) => e.stopPropagation()}
                  style={{ marginRight: '8px' }}
                />
                Rocketman
              </div>
            </SectionTitle>
            <ChevronIcon $isOpen={openSections.rocketmanSettings}>›</ChevronIcon>
          </SectionHeader>
          <SectionContent $isOpen={openSections.rocketmanSettings}>
            <RocketmanSettingsPanel 
              settings={rocketmanSettings}
              onSettingsChange={setRocketmanSettings}
            />
          </SectionContent>
        </Section>
        
        {/* BlackJack Pattern */}
        <Section>
          <SectionHeader onClick={() => toggleSection('blackjackSettings')}>
            <SectionTitle>
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <input 
                  type="checkbox" 
                  id="enable-blackjack"
                  checked={preferences?.enabledPatternTypes?.includes(PatternType.BLACKJACK) || false}
                  onChange={(e) => {
                    const currentTypes = preferences?.enabledPatternTypes || [];
                    const updatedTypes = e.target.checked
                      ? [...currentTypes, PatternType.BLACKJACK]
                      : currentTypes.filter((t: PatternType) => t !== PatternType.BLACKJACK);
                    updatePreferences({
                      ...preferences,
                      enabledPatternTypes: updatedTypes
                    });
                  }}
                  onClick={(e) => e.stopPropagation()}
                  style={{ marginRight: '8px' }}
                />
                BlackJack
              </div>
            </SectionTitle>
            <ChevronIcon $isOpen={openSections.blackjackSettings}>›</ChevronIcon>
          </SectionHeader>
          <SectionContent $isOpen={openSections.blackjackSettings}>
            <BlackjackSettingsPanel 
              settings={blackjackSettings}
              onSettingsChange={setBlackjackSettings}
            />
          </SectionContent>
        </Section>
        
        {/* Escalator Pattern */}
        <Section>
          <SectionHeader onClick={() => toggleSection('escalatorSettings')}>
            <SectionTitle>
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <input 
                  type="checkbox" 
                  id="enable-escalator"
                  checked={preferences?.enabledPatternTypes?.includes(PatternType.ESCALATOR) || false}
                  onChange={(e) => {
                    const currentTypes = preferences?.enabledPatternTypes || [];
                    const updatedTypes = e.target.checked
                      ? [...currentTypes, PatternType.ESCALATOR]
                      : currentTypes.filter((t: PatternType) => t !== PatternType.ESCALATOR);
                    updatePreferences({
                      ...preferences,
                      enabledPatternTypes: updatedTypes
                    });
                  }}
                  onClick={(e) => e.stopPropagation()}
                  style={{ marginRight: '8px' }}
                />
                Escalator
              </div>
            </SectionTitle>
            <ChevronIcon $isOpen={openSections.escalatorSettings}>›</ChevronIcon>
          </SectionHeader>
          <SectionContent $isOpen={openSections.escalatorSettings}>
            <EscalatorSettingsPanel 
              settings={escalatorSettings}
              onSettingsChange={setEscalatorSettings}
            />
          </SectionContent>
        </Section>
        
        {/* Pivot Pattern */}
        <Section>
          <SectionHeader onClick={() => toggleSection('pivotSettings')}>
            <SectionTitle>
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <input 
                  type="checkbox" 
                  id="enable-pivot"
                  checked={preferences?.enabledPatternTypes?.includes(PatternType.PIVOT) || false}
                  onChange={(e) => {
                    const currentTypes = preferences?.enabledPatternTypes || [];
                    const updatedTypes = e.target.checked
                      ? [...currentTypes, PatternType.PIVOT]
                      : currentTypes.filter((t: PatternType) => t !== PatternType.PIVOT);
                    updatePreferences({
                      ...preferences,
                      enabledPatternTypes: updatedTypes
                    });
                  }}
                  onClick={(e) => e.stopPropagation()}
                  style={{ marginRight: '8px' }}
                />
                Pivot
              </div>
            </SectionTitle>
            <ChevronIcon $isOpen={openSections.pivotSettings}>›</ChevronIcon>
          </SectionHeader>
          <SectionContent $isOpen={openSections.pivotSettings}>
            <PivotSettingsPanel 
              settings={pivotSettings}
              onChange={(patternType, newSettings) => {
                setPivotSettings(newSettings);
              }}
            />
          </SectionContent>
        </Section>
        
      </PanelBody>
    </PanelContainer>
  );
};

export default PatternPanel;
