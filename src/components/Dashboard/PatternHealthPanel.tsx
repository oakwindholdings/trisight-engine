// src/components/Dashboard/PatternHealthPanel.tsx
// Live Pattern Health Panel for SIGINT audit visualization
// Real-time dashboard showing pattern detection, emission, and render metrics

import React, { useState, useEffect, useMemo } from 'react';
import styled from 'styled-components';

// Types for audit data
interface AuditData {
  auditId: string;
  auditName: string;
  scope: string[];
  timeframe: string;
  timestamp: string;
  stages: {
    detection: any[];
    emission: any[];
    render: any[];
    diff_analysis: any[];
  };
  summary: {
    totalDetections: number;
    patternsDetected: number;
    totalEmissions: number;
    signalsEmitted: number;
    signalsRendered: number;
    duplicateRenders: number;
    integrityScore: number;
  };
  diagnostics: {
    statusBreakdown: Record<string, number>;
  };
  patternCountMap: Record<string, {
    total: number;
    detected: number;
    emitted: number;
    rendered: number;
  }>;
}

interface PatternHealthPanelProps {
  auditPath: string;
  showConfidenceThresholds?: boolean;
  includeSuppressionStats?: boolean;
  chartOptions?: {
    type: 'bar' | 'line';
    groupBy: 'pattern' | 'time';
    metrics: string[];
  };
  highlight?: {
    thresholds: {
      detectionRate: number;
      emissionRate: number;
      renderRate: number;
    };
    dangerColor: string;
    warningColor: string;
    healthyColor: string;
  };
  style?: React.CSSProperties;
}

// Styled components
const PanelContainer = styled.div<{ customStyle?: React.CSSProperties }>`
  background: #fff;
  border: 1px solid #ccc;
  padding: 1rem;
  margin-top: 1rem;
  border-radius: 0.5rem;
  ${props => props.customStyle && Object.entries(props.customStyle).map(([key, value]) => `${key}: ${value};`).join('\n')}
`;

const PanelHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
  padding-bottom: 0.75rem;
  border-bottom: 2px solid #f0f0f0;
`;

const PanelTitle = styled.h2`
  font-size: 1.25rem;
  font-weight: 600;
  color: #1e293b;
  margin: 0;
`;

const StatusIndicator = styled.div<{ status: 'healthy' | 'warning' | 'danger' }>`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  border-radius: 0.375rem;
  font-size: 0.875rem;
  font-weight: 500;
  
  ${props => {
    switch (props.status) {
      case 'healthy':
        return `background-color: #dcfce7; color: #166534; border: 1px solid #bbf7d0;`;
      case 'warning':
        return `background-color: #fef3c7; color: #92400e; border: 1px solid #fde68a;`;
      case 'danger':
        return `background-color: #fee2e2; color: #991b1b; border: 1px solid #fecaca;`;
      default:
        return `background-color: #f3f4f6; color: #374151; border: 1px solid #d1d5db;`;
    }
  }}
`;

const MetricsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1rem;
  margin-bottom: 2rem;
`;

const MetricCard = styled.div`
  background: #f9fafb;
  border: 1px solid #e5e7eb;
  border-radius: 0.5rem;
  padding: 1rem;
`;

const MetricTitle = styled.h3`
  font-size: 0.875rem;
  font-weight: 500;
  color: #6b7280;
  margin: 0 0 0.5rem 0;
  text-transform: uppercase;
  letter-spacing: 0.05em;
`;

const MetricValue = styled.div`
  font-size: 1.5rem;
  font-weight: 700;
  color: #111827;
  margin-bottom: 0.25rem;
`;

const MetricSubtext = styled.div`
  font-size: 0.75rem;
  color: #6b7280;
`;

const EngineHealthGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
  margin-bottom: 2rem;
`;

const EngineCard = styled.div<{ healthStatus: 'healthy' | 'warning' | 'danger' }>`
  background: white;
  border: 2px solid;
  border-radius: 0.5rem;
  padding: 1rem;
  
  ${props => {
    switch (props.healthStatus) {
      case 'healthy':
        return `border-color: #10b981; background: linear-gradient(135deg, #ecfdf5 0%, #f0fdf4 100%);`;
      case 'warning':
        return `border-color: #f59e0b; background: linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%);`;
      case 'danger':
        return `border-color: #ef4444; background: linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%);`;
      default:
        return `border-color: #6b7280; background: #f9fafb;`;
    }
  }}
`;

const EngineTitle = styled.h4`
  font-size: 0.875rem;
  font-weight: 600;
  margin: 0 0 0.75rem 0;
  color: #1e293b;
`;

const EngineStats = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin: 0.5rem 0;
  font-size: 0.75rem;
`;

const ProgressBar = styled.div<{ percentage: number; color: string }>`
  width: 100%;
  height: 0.5rem;
  background: #e5e7eb;
  border-radius: 0.25rem;
  overflow: hidden;
  margin: 0.5rem 0;
  
  &::after {
    content: '';
    display: block;
    width: ${props => props.percentage}%;
    height: 100%;
    background: ${props => props.color};
    transition: width 0.3s ease;
  }
`;

const LoadingSpinner = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 2rem;
  color: #6b7280;
`;

const ErrorMessage = styled.div`
  background: #fee2e2;
  border: 1px solid #fecaca;
  color: #991b1b;
  padding: 1rem;
  border-radius: 0.5rem;
  margin: 1rem 0;
`;

const PatternHealthPanel: React.FC<PatternHealthPanelProps> = ({
  auditPath,
  showConfidenceThresholds = true,
  includeSuppressionStats = true,
  chartOptions = {
    type: 'bar',
    groupBy: 'pattern',
    metrics: ['detected', 'emitted', 'rendered', 'debounced', 'suppressed']
  },
  highlight = {
    thresholds: {
      detectionRate: 0.7,
      emissionRate: 0.8,
      renderRate: 0.9
    },
    dangerColor: 'red',
    warningColor: 'orange',
    healthyColor: 'green'
  },
  style
}) => {
  const [auditData, setAuditData] = useState<AuditData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load audit data
  useEffect(() => {
    const loadAuditData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const response = await fetch(auditPath);
        if (!response.ok) {
          throw new Error(`Failed to load audit data: ${response.statusText}`);
        }
        
        const data = await response.json();
        setAuditData(data);
      } catch (err) {
        console.error('Error loading audit data:', err);
        setError(err instanceof Error ? err.message : 'Failed to load audit data');
      } finally {
        setLoading(false);
      }
    };

    loadAuditData();
  }, [auditPath]);

  // Calculate overall health status
  const overallHealthStatus = useMemo(() => {
    if (!auditData) return 'warning';
    
    const { integrityScore } = auditData.summary;
    
    if (integrityScore >= 90) return 'healthy';
    if (integrityScore >= 70) return 'warning';
    return 'danger';
  }, [auditData]);

  // Calculate engine health
  const engineHealthData = useMemo(() => {
    if (!auditData) return [];
    
    return Object.entries(auditData.patternCountMap).map(([engine, stats]) => {
      const detectionRate = stats.total > 0 ? stats.detected / stats.total : 0;
      const emissionRate = stats.detected > 0 ? stats.emitted / stats.detected : 0;
      const renderRate = stats.emitted > 0 ? stats.rendered / stats.emitted : 0;
      
      let healthStatus: 'healthy' | 'warning' | 'danger' = 'healthy';
      
      if (detectionRate < highlight.thresholds.detectionRate || 
          emissionRate < highlight.thresholds.emissionRate || 
          renderRate < highlight.thresholds.renderRate) {
        healthStatus = detectionRate < 0.5 || emissionRate < 0.5 || renderRate < 0.5 ? 'danger' : 'warning';
      }
      
      return {
        engine,
        stats,
        detectionRate,
        emissionRate,
        renderRate,
        healthStatus
      };
    });
  }, [auditData, highlight.thresholds]);

  if (loading) {
    return (
      <PanelContainer customStyle={style}>
        <LoadingSpinner>Loading Pattern Health Data...</LoadingSpinner>
      </PanelContainer>
    );
  }

  if (error) {
    return (
      <PanelContainer customStyle={style}>
        <ErrorMessage>
          <strong>Error:</strong> {error}
        </ErrorMessage>
      </PanelContainer>
    );
  }

  if (!auditData) {
    return (
      <PanelContainer customStyle={style}>
        <ErrorMessage>No audit data available</ErrorMessage>
      </PanelContainer>
    );
  }

  return (
    <PanelContainer customStyle={style}>
      <PanelHeader>
        <PanelTitle>Live Pattern Health Panel</PanelTitle>
        <StatusIndicator status={overallHealthStatus}>
          <span>●</span>
          Integrity Score: {auditData.summary.integrityScore}%
        </StatusIndicator>
      </PanelHeader>

      {/* Key Metrics */}
      <MetricsGrid>
        <MetricCard>
          <MetricTitle>Total Detections</MetricTitle>
          <MetricValue>{auditData.summary.totalDetections}</MetricValue>
          <MetricSubtext>{auditData.summary.patternsDetected} patterns detected</MetricSubtext>
        </MetricCard>
        
        <MetricCard>
          <MetricTitle>Signal Emissions</MetricTitle>
          <MetricValue>{auditData.summary.signalsEmitted}</MetricValue>
          <MetricSubtext>of {auditData.summary.totalEmissions} total emissions</MetricSubtext>
        </MetricCard>
        
        <MetricCard>
          <MetricTitle>Rendered Signals</MetricTitle>
          <MetricValue>{auditData.summary.signalsRendered}</MetricValue>
          <MetricSubtext>{auditData.summary.duplicateRenders} duplicates detected</MetricSubtext>
        </MetricCard>
        
        <MetricCard>
          <MetricTitle>Pipeline Health</MetricTitle>
          <MetricValue>{auditData.summary.integrityScore}%</MetricValue>
          <MetricSubtext>End-to-end integrity score</MetricSubtext>
        </MetricCard>
      </MetricsGrid>

      {/* Engine Health Grid */}
      <EngineHealthGrid>
        {engineHealthData.map(({ engine, stats, detectionRate, emissionRate, renderRate, healthStatus }) => (
          <EngineCard key={engine} healthStatus={healthStatus}>
            <EngineTitle>{engine.replace('_', ' ')}</EngineTitle>
            
            <EngineStats>
              <span>Detection:</span>
              <span>{stats.detected}/{stats.total}</span>
            </EngineStats>
            <ProgressBar 
              percentage={detectionRate * 100} 
              color={detectionRate >= highlight.thresholds.detectionRate ? highlight.healthyColor : highlight.warningColor}
            />
            
            <EngineStats>
              <span>Emission:</span>
              <span>{stats.emitted}</span>
            </EngineStats>
            <ProgressBar 
              percentage={emissionRate * 100} 
              color={emissionRate >= highlight.thresholds.emissionRate ? highlight.healthyColor : highlight.warningColor}
            />
            
            <EngineStats>
              <span>Rendered:</span>
              <span>{stats.rendered}</span>
            </EngineStats>
            <ProgressBar 
              percentage={renderRate * 100} 
              color={renderRate >= highlight.thresholds.renderRate ? highlight.healthyColor : highlight.warningColor}
            />
          </EngineCard>
        ))}
      </EngineHealthGrid>

      {/* Suppression Stats */}
      {includeSuppressionStats && (
        <MetricCard>
          <MetricTitle>Suppression Analysis</MetricTitle>
          {Object.entries(auditData.diagnostics.statusBreakdown).map(([status, count]) => (
            <EngineStats key={status}>
              <span>{status.replace('_', ' ')}:</span>
              <span>{count}</span>
            </EngineStats>
          ))}
        </MetricCard>
      )}
      
      <MetricSubtext style={{ textAlign: 'center', marginTop: '1rem' }}>
        Last updated: {new Date(auditData.timestamp).toLocaleString()} | 
        Audit: {auditData.auditName} | 
        Timeframe: {auditData.timeframe}
      </MetricSubtext>
    </PanelContainer>
  );
};

export default PatternHealthPanel;
