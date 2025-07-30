// src/components/Reports/QuickMetrics.tsx
// Real-time metrics dashboard for report generation
// Context: Shows live statistics about report performance

import React from 'react';
import styled from 'styled-components';
import { TrendingUp, Users, Clock, Award } from 'lucide-react';

const MetricsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 1rem;
  padding: 1rem;
`;

const MetricCard = styled.div`
  padding: 1rem;
  background: #f9fafb;
  border-radius: 0.5rem;
  border: 1px solid #e5e7eb;
`;

const MetricHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.5rem;
`;

const MetricIcon = styled.div<{ $color: string }>`
  width: 32px;
  height: 32px;
  background: ${props => props.$color}22;
  border-radius: 0.375rem;
  display: flex;
  align-items: center;
  justify-content: center;
  
  svg {
    width: 16px;
    height: 16px;
    color: ${props => props.$color};
  }
`;

const MetricLabel = styled.span`
  font-size: 0.75rem;
  color: #6b7280;
  font-weight: 500;
`;

const MetricValue = styled.div`
  font-size: 1.5rem;
  font-weight: 700;
  color: #1e293b;
  line-height: 1;
`;

const MetricChange = styled.span<{ $positive: boolean }>`
  font-size: 0.75rem;
  color: ${props => props.$positive ? '#10b981' : '#ef4444'};
  font-weight: 500;
`;

interface QuickMetricsProps {
  currentReport: any;
  onReportChange: (report: any) => void;
}

export const QuickMetrics: React.FC<QuickMetricsProps> = ({
  currentReport,
  onReportChange
}) => {
  const metrics = [
    {
      label: 'Reports Generated',
      value: '147',
      change: '+12%',
      positive: true,
      icon: TrendingUp,
      color: '#3b82f6'
    },
    {
      label: 'Active Users',
      value: '38',
      change: '+5%',
      positive: true,
      icon: Users,
      color: '#10b981'
    },
    {
      label: 'Avg. Time',
      value: '4.2m',
      change: '-18%',
      positive: true,
      icon: Clock,
      color: '#f59e0b'
    },
    {
      label: 'Quality Score',
      value: '94%',
      change: '+3%',
      positive: true,
      icon: Award,
      color: '#8b5cf6'
    }
  ];
  
  return (
    <MetricsGrid>
      {metrics.map((metric, index) => {
        const Icon = metric.icon;
        return (
          <MetricCard key={index}>
            <MetricHeader>
              <MetricIcon $color={metric.color}>
                <Icon />
              </MetricIcon>
              <MetricLabel>{metric.label}</MetricLabel>
            </MetricHeader>
            <MetricValue>
              {metric.value}
              <MetricChange $positive={metric.positive}>
                {' '}{metric.change}
              </MetricChange>
            </MetricValue>
          </MetricCard>
        );
      })}
    </MetricsGrid>
  );
};