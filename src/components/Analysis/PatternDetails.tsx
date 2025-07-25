// src/components/Analysis/PatternDetails.tsx
// Small component listing pattern meta
// Used inside AnalysisPanel
import React, { useState } from 'react';
import styled from 'styled-components';
import { ThemeTokens } from '../../styles/theme';
import { Pattern } from '../../models/PatternTypes';
import { useFormattedPatternMetrics } from '../../hooks/usePatternMetrics';

// Generic pattern details component for analysis panel
const DetailsContainer = styled.div`
  padding: ${ThemeTokens.spacing.medium};
`;

const Title = styled.h3`
  font-size: ${ThemeTokens.typography.size.medium};
  font-weight: ${ThemeTokens.typography.weight.semibold};
  color: ${ThemeTokens.colors.textPrimary};
  margin: 0 0 ${ThemeTokens.spacing.medium} 0;
`;

const StatGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: ${ThemeTokens.spacing.medium};
  margin-bottom: ${ThemeTokens.spacing.large};
`;

const StatItem = styled.div`
  display: flex;
  flex-direction: column;
  position: relative;
`;

const StatLabel = styled.span`
  font-size: ${ThemeTokens.typography.size.small};
  color: ${ThemeTokens.colors.textSecondary};
  margin-bottom: ${ThemeTokens.spacing.xsmall};
  display: flex;
  align-items: center;
  gap: 4px;
`;

const StatValue = styled.span`
  font-size: ${ThemeTokens.typography.size.medium};
  color: ${ThemeTokens.colors.textPrimary};
  font-weight: ${ThemeTokens.typography.weight.medium};
`;

const AdvancedSection = styled.div<{ $isOpen: boolean }>`
  max-height: ${props => props.$isOpen ? '500px' : '0'};
  overflow: hidden;
  transition: max-height 0.3s ease-in-out;
  margin-top: ${props => props.$isOpen ? ThemeTokens.spacing.medium : '0'};
`;

const ToggleButton = styled.button`
  background: none;
  border: 1px solid ${ThemeTokens.colors.border};
  color: ${ThemeTokens.colors.textSecondary};
  padding: ${ThemeTokens.spacing.small} ${ThemeTokens.spacing.medium};
  border-radius: ${ThemeTokens.borderRadius.small};
  font-size: ${ThemeTokens.typography.size.small};
  cursor: pointer;
  margin-top: ${ThemeTokens.spacing.medium};
  width: 100%;

  &:hover {
    background-color: ${ThemeTokens.colors.surface};
    color: ${ThemeTokens.colors.textPrimary};
  }
`;

const LoadingSpinner = styled.div`
  display: inline-block;
  width: 12px;
  height: 12px;
  border: 2px solid ${ThemeTokens.colors.border};
  border-radius: 50%;
  border-top-color: ${ThemeTokens.colors.primary};
  animation: spin 1s ease-in-out infinite;

  @keyframes spin {
    to { transform: rotate(360deg); }
  }
`;

const ErrorMessage = styled.div`
  color: ${ThemeTokens.colors.danger};
  font-size: ${ThemeTokens.typography.size.small};
  margin-top: ${ThemeTokens.spacing.small};
  padding: ${ThemeTokens.spacing.small};
  background-color: ${ThemeTokens.colors.danger}10;
  border-radius: ${ThemeTokens.borderRadius.small};
`;

const MetricCategory = styled.div`
  margin-bottom: ${ThemeTokens.spacing.medium};
`;

const CategoryTitle = styled.h4`
  font-size: ${ThemeTokens.typography.size.small};
  font-weight: ${ThemeTokens.typography.weight.semibold};
  color: ${ThemeTokens.colors.textPrimary};
  margin: 0 0 ${ThemeTokens.spacing.small} 0;
  text-transform: uppercase;
  letter-spacing: 0.5px;
`;

const Tooltip = styled.div`
  position: absolute;
  bottom: 100%;
  left: 50%;
  transform: translateX(-50%);
  background-color: ${ThemeTokens.colors.surface};
  border: 1px solid ${ThemeTokens.colors.border};
  border-radius: ${ThemeTokens.borderRadius.small};
  padding: ${ThemeTokens.spacing.small};
  font-size: ${ThemeTokens.typography.size.xsmall};
  color: ${ThemeTokens.colors.textSecondary};
  white-space: nowrap;
  z-index: 1000;
  opacity: 0;
  pointer-events: none;
  transition: opacity 0.2s;

  &.visible {
    opacity: 1;
  }
`;

const InfoIcon = styled.span`
  display: inline-block;
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background-color: ${ThemeTokens.colors.textSecondary};
  color: white;
  font-size: 8px;
  line-height: 12px;
  text-align: center;
  cursor: help;

  &:hover + ${Tooltip} {
    opacity: 1;
  }
`;

const LastUpdated = styled.div`
  font-size: ${ThemeTokens.typography.size.xsmall};
  color: ${ThemeTokens.colors.textSecondary};
  text-align: center;
  margin-top: ${ThemeTokens.spacing.medium};
  padding-top: ${ThemeTokens.spacing.small};
  border-top: 1px solid ${ThemeTokens.colors.border};
`;

const DataSourceBadge = styled.span<{ $source: 'LIVE' | 'CACHED' | 'FALLBACK' }>`
  display: inline-block;
  padding: 2px 6px;
  border-radius: ${ThemeTokens.borderRadius.small};
  font-size: ${ThemeTokens.typography.size.xsmall};
  font-weight: ${ThemeTokens.typography.weight.medium};
  margin-left: 4px;

  ${props => {
    switch (props.$source) {
      case 'LIVE':
        return `
          background-color: #10b981;
          color: white;
        `;
      case 'CACHED':
        return `
          background-color: #f59e0b;
          color: white;
        `;
      case 'FALLBACK':
        return `
          background-color: #ef4444;
          color: white;
        `;
      default:
        return `
          background-color: ${ThemeTokens.colors.textSecondary};
          color: white;
        `;
    }
  }}
`;

const RefreshButton = styled.button`
  background: none;
  border: none;
  color: ${ThemeTokens.colors.primary};
  cursor: pointer;
  font-size: ${ThemeTokens.typography.size.xsmall};
  margin-left: 8px;
  text-decoration: underline;

  &:hover {
    color: ${ThemeTokens.colors.primaryHover || ThemeTokens.colors.primary};
  }

  &:disabled {
    color: ${ThemeTokens.colors.textSecondary};
    cursor: not-allowed;
    text-decoration: none;
  }
`;

const Description = styled.p`
  font-size: ${ThemeTokens.typography.size.small};
  color: ${ThemeTokens.colors.textPrimary};
  line-height: 1.5;
  margin: 0 0 ${ThemeTokens.spacing.medium} 0;
`;

interface PatternDetailsProps {
  pattern: Pattern;
}

const PatternDetails: React.FC<PatternDetailsProps> = ({ pattern }) => {
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [hoveredTooltip, setHoveredTooltip] = useState<string | null>(null);

  const { metrics, formattedMetrics, isLoading, error, refresh } = useFormattedPatternMetrics(pattern, showAdvanced);

  // Get pattern type safely
  const patternType = pattern.type || 'Unknown Pattern';

  // Group metrics by category
  const coreMetrics = formattedMetrics.filter(m => m.category === 'core' && !m.isAdvanced);
  const learningMetrics = formattedMetrics.filter(m => m.category === 'learning' && !m.isAdvanced);
  const advancedMetrics = formattedMetrics.filter(m => m.isAdvanced);

  const renderMetricItem = (metric: any) => (
    <StatItem key={metric.key}>
      <StatLabel>
        {metric.label}
        {metric.tooltip && (
          <>
            <InfoIcon
              onMouseEnter={() => setHoveredTooltip(metric.key)}
              onMouseLeave={() => setHoveredTooltip(null)}
            >
              ?
            </InfoIcon>
            <Tooltip className={hoveredTooltip === metric.key ? 'visible' : ''}>
              {metric.tooltip}
            </Tooltip>
          </>
        )}
        {isLoading && <LoadingSpinner />}
      </StatLabel>
      <StatValue>{metric.formattedValue}</StatValue>
    </StatItem>
  );

  return (
    <DetailsContainer>
      <Title>{patternType.replace(/_/g, ' ')}</Title>

      <Description>
        Pattern detected at {pattern.startTime.toLocaleString()} with {Math.round(pattern.confidence * 100)}% confidence.
        {pattern.feedbackCount && pattern.feedbackCount > 0 && (
          <> Has received {pattern.feedbackCount} feedback submission{pattern.feedbackCount !== 1 ? 's' : ''}.</>
        )}
      </Description>

      {error && (
        <ErrorMessage>
          Failed to load some metrics: {error}
          <button onClick={refresh} style={{ marginLeft: '8px', fontSize: '12px' }}>
            Retry
          </button>
        </ErrorMessage>
      )}

      {/* Core Performance Metrics */}
      <MetricCategory>
        <CategoryTitle>Performance</CategoryTitle>
        <StatGrid>
          {coreMetrics.map(renderMetricItem)}
        </StatGrid>
      </MetricCategory>

      {/* Learning Metrics */}
      {learningMetrics.length > 0 && (
        <MetricCategory>
          <CategoryTitle>Learning & Feedback</CategoryTitle>
          <StatGrid>
            {learningMetrics.map(renderMetricItem)}
          </StatGrid>
        </MetricCategory>
      )}

      {/* Advanced Metrics Toggle */}
      {advancedMetrics.length > 0 && (
        <>
          <ToggleButton onClick={() => setShowAdvanced(!showAdvanced)}>
            {showAdvanced ? 'Hide' : 'Show'} Advanced Metrics ({advancedMetrics.length})
          </ToggleButton>

          <AdvancedSection $isOpen={showAdvanced}>
            {showAdvanced && (
              <>
                {/* Group advanced metrics by category */}
                {['specific', 'technical', 'learning'].map(category => {
                  const categoryMetrics = advancedMetrics.filter(m => m.category === category);
                  if (categoryMetrics.length === 0) return null;

                  return (
                    <MetricCategory key={category}>
                      <CategoryTitle>
                        {category === 'specific' ? 'Pattern-Specific' :
                         category === 'technical' ? 'Technical Analysis' :
                         'Advanced Learning'}
                      </CategoryTitle>
                      <StatGrid>
                        {categoryMetrics.map(renderMetricItem)}
                      </StatGrid>
                    </MetricCategory>
                  );
                })}
              </>
            )}
          </AdvancedSection>
        </>
      )}

      {/* Last Updated and Data Source */}
      {metrics && (
        <LastUpdated>
          Last updated: {metrics.lastUpdated.toLocaleTimeString()}
          <DataSourceBadge $source={metrics.dataSource}>
            {metrics.dataSource}
          </DataSourceBadge>
          <RefreshButton
            onClick={refresh}
            disabled={isLoading}
            title="Refresh metrics"
          >
            {isLoading ? 'Refreshing...' : 'Refresh'}
          </RefreshButton>
        </LastUpdated>
      )}
    </DetailsContainer>
  );
};

export default PatternDetails;
