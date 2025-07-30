// src/reportGeneration/components/PerformanceDashboard.tsx
// Performance monitoring dashboard component for report generation
// Context: Visual representation of performance metrics and bottlenecks

import React from 'react';
import styled from 'styled-components';
import { useReportPerformance } from '../../hooks/useReportPerformance';

const DashboardContainer = styled.div`
  background: ${({ theme }) => theme.colors.background.secondary};
  border-radius: 8px;
  padding: 20px;
  margin: 20px 0;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
`;

const Title = styled.h3`
  color: ${({ theme }) => theme.colors.text.primary};
  margin-bottom: 20px;
  font-size: 18px;
  font-weight: 600;
`;

const MetricsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 16px;
  margin-bottom: 24px;
`;

const MetricCard = styled.div`
  background: ${({ theme }) => theme.colors.background.primary};
  padding: 16px;
  border-radius: 6px;
  border: 1px solid ${({ theme }) => theme.colors.border.primary};
`;

const MetricLabel = styled.div`
  color: ${({ theme }) => theme.colors.text.secondary};
  font-size: 12px;
  margin-bottom: 4px;
  text-transform: uppercase;
`;

const MetricValue = styled.div`
  color: ${({ theme }) => theme.colors.text.primary};
  font-size: 24px;
  font-weight: 600;
`;

const MetricUnit = styled.span`
  font-size: 14px;
  font-weight: 400;
  color: ${({ theme }) => theme.colors.text.secondary};
  margin-left: 4px;
`;

const Section = styled.div`
  margin-bottom: 20px;
`;

const SectionTitle = styled.h4`
  color: ${({ theme }) => theme.colors.text.primary};
  font-size: 16px;
  font-weight: 500;
  margin-bottom: 12px;
`;

const List = styled.ul`
  list-style: none;
  padding: 0;
  margin: 0;
`;

const ListItem = styled.li`
  color: ${({ theme }) => theme.colors.text.secondary};
  padding: 8px 0;
  border-bottom: 1px solid ${({ theme }) => theme.colors.border.secondary};
  font-size: 14px;
  
  &:last-child {
    border-bottom: none;
  }
`;

const ProgressBar = styled.div<{ percentage: number; color?: string }>`
  position: relative;
  width: 100%;
  height: 8px;
  background: ${({ theme }) => theme.colors.background.tertiary};
  border-radius: 4px;
  overflow: hidden;
  margin-top: 8px;
  
  &::after {
    content: '';
    position: absolute;
    left: 0;
    top: 0;
    height: 100%;
    width: ${({ percentage }) => percentage}%;
    background: ${({ color, theme }) => color || theme.colors.accent.primary};
    transition: width 0.3s ease;
  }
`;

const ControlsContainer = styled.div`
  display: flex;
  gap: 12px;
  margin-bottom: 20px;
`;

const Button = styled.button<{ variant?: 'primary' | 'secondary' }>`
  padding: 8px 16px;
  border-radius: 4px;
  border: none;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  
  ${({ variant, theme }) => variant === 'primary' ? `
    background: ${theme.colors.accent.primary};
    color: white;
    
    &:hover {
      background: ${theme.colors.accent.hover};
    }
  ` : `
    background: ${theme.colors.background.tertiary};
    color: ${theme.colors.text.primary};
    border: 1px solid ${theme.colors.border.primary};
    
    &:hover {
      background: ${theme.colors.background.secondary};
    }
  `}
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const StatusIndicator = styled.div<{ status: 'active' | 'idle' }>`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  color: ${({ theme }) => theme.colors.text.secondary};
  
  &::before {
    content: '';
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: ${({ status, theme }) => 
      status === 'active' ? theme.colors.status.success : theme.colors.text.tertiary
    };
  }
`;

export const PerformanceDashboard: React.FC = () => {
  const {
    metrics,
    startMonitoring,
    stopMonitoring,
    reset,
    isMonitoring
  } = useReportPerformance();
  
  const formatDuration = (ms: number): string => {
    if (ms < 1000) return `${Math.round(ms)}ms`;
    if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
    return `${(ms / 60000).toFixed(1)}m`;
  };
  
  const formatMemory = (mb: number): string => {
    if (mb < 1024) return `${mb}MB`;
    return `${(mb / 1024).toFixed(1)}GB`;
  };
  
  const getCacheHitRateColor = (rate: number): string => {
    if (rate >= 0.8) return '#10b981'; // green
    if (rate >= 0.5) return '#f59e0b'; // yellow
    return '#ef4444'; // red
  };
  
  return (
    <DashboardContainer>
      <Title>Performance Monitor</Title>
      
      <ControlsContainer>
        <Button
          variant="primary"
          onClick={isMonitoring ? stopMonitoring : startMonitoring}
        >
          {isMonitoring ? 'Stop Monitoring' : 'Start Monitoring'}
        </Button>
        <Button
          variant="secondary"
          onClick={reset}
          disabled={isMonitoring}
        >
          Reset Metrics
        </Button>
        <StatusIndicator status={isMonitoring ? 'active' : 'idle'}>
          {isMonitoring ? 'Monitoring Active' : 'Monitoring Stopped'}
        </StatusIndicator>
      </ControlsContainer>
      
      <MetricsGrid>
        <MetricCard>
          <MetricLabel>Operations Completed</MetricLabel>
          <MetricValue>{metrics.operationsCompleted}</MetricValue>
        </MetricCard>
        
        <MetricCard>
          <MetricLabel>Average Operation Time</MetricLabel>
          <MetricValue>
            {formatDuration(metrics.avgOperationTime)}
          </MetricValue>
        </MetricCard>
        
        <MetricCard>
          <MetricLabel>Memory Usage</MetricLabel>
          <MetricValue>
            {formatMemory(metrics.resourceUsage.memoryMB)}
          </MetricValue>
        </MetricCard>
        
        <MetricCard>
          <MetricLabel>API Calls</MetricLabel>
          <MetricValue>{metrics.resourceUsage.apiCalls}</MetricValue>
        </MetricCard>
        
        <MetricCard>
          <MetricLabel>Cache Hit Rate</MetricLabel>
          <MetricValue>
            {Math.round(metrics.resourceUsage.cacheHitRate * 100)}
            <MetricUnit>%</MetricUnit>
          </MetricValue>
          <ProgressBar 
            percentage={metrics.resourceUsage.cacheHitRate * 100}
            color={getCacheHitRateColor(metrics.resourceUsage.cacheHitRate)}
          />
        </MetricCard>
        
        <MetricCard>
          <MetricLabel>Active Operations</MetricLabel>
          <MetricValue>{metrics.resourceUsage.activeOperations}</MetricValue>
        </MetricCard>
      </MetricsGrid>
      
      {metrics.bottlenecks.length > 0 && (
        <Section>
          <SectionTitle>Performance Bottlenecks</SectionTitle>
          <List>
            {metrics.bottlenecks.map((bottleneck, index) => (
              <ListItem key={index}>{bottleneck}</ListItem>
            ))}
          </List>
        </Section>
      )}
      
      {metrics.recommendations.length > 0 && (
        <Section>
          <SectionTitle>Optimization Recommendations</SectionTitle>
          <List>
            {metrics.recommendations.map((recommendation, index) => (
              <ListItem key={index}>{recommendation}</ListItem>
            ))}
          </List>
        </Section>
      )}
    </DashboardContainer>
  );
};