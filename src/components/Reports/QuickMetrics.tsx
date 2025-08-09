// src/components/Reports/QuickMetrics.tsx
// Real-time metrics dashboard for report generation
// Context: Shows live statistics about report performance

import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { TrendingUp, Users, Clock, Award } from 'lucide-react';
import { getStorageService } from '../../services/reportStorageService';
import { logDebug } from '../../utils/logger';
import { reportHistoryPoller } from '../../services/reportHistoryPoller'; // Rule: Simple

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
  const [metrics, setMetrics] = useState([
    {
      label: 'Reports Generated',
      value: '0',
      change: '+0%',
      positive: true,
      icon: TrendingUp,
      color: '#3b82f6'
    },
    {
      label: 'Active Sessions',
      value: '0',
      change: '+0%',
      positive: true,
      icon: Users,
      color: '#10b981'
    },
    {
      label: 'Avg. Time',
      value: '0m',
      change: '0%',
      positive: true,
      icon: Clock,
      color: '#f59e0b'
    },
    {
      label: 'Data Quality',
      value: '0%',
      change: '+0%',
      positive: true,
      icon: Award,
      color: '#8b5cf6'
    }
  ]);

  useEffect(() => {
    // Rule: Simple — reuse poller instead of independent intervals
    const unsub = reportHistoryPoller.subscribe(({ reports }) => {
      try {
        const r = reports || [];
        const totalReports = r.length;
        const lastWeekReports = r.filter(x => new Date(x.createdAt) > new Date(Date.now() - 7*24*60*60*1000)).length;
        const prevWeekReports = r.filter(x => {
          const created = new Date(x.createdAt).getTime();
          const now = Date.now();
          return created <= now - 7*24*60*60*1000 && created > now - 14*24*60*60*1000;
        }).length;
        const reportChange = prevWeekReports > 0 ? (((lastWeekReports - prevWeekReports) / prevWeekReports) * 100).toFixed(0) : '0';
        const activeSessions = r.filter(x => new Date(x.createdAt) > new Date(Date.now() - 60*60*1000)).length;
        const avgTime = 0; // not tracked here in stable list
        const avgQuality = 0; // not tracked here in stable list

        setMetrics([
          { label: 'Reports Generated', value: String(totalReports), change: `${Number(reportChange) >= 0 ? '+' : ''}${reportChange}%`, positive: Number(reportChange) >= 0, icon: TrendingUp, color: '#3b82f6' },
          { label: 'Active Sessions', value: String(activeSessions), change: lastWeekReports > 0 ? '+' + lastWeekReports : '0', positive: true, icon: Users, color: '#10b981' },
          { label: 'Avg. Time', value: `${avgTime.toFixed(1)}m`, change: '+0%', positive: true, icon: Clock, color: '#f59e0b' },
          { label: 'Data Quality', value: `${avgQuality.toFixed(0)}%`, change: '0%', positive: true, icon: Award, color: '#8b5cf6' }
        ]);
        logDebug('QuickMetrics', 'Metrics updated (poller)', { totalReports, activeSessions });
      } catch (e) {
        // ignore metric errors
      }
    });
    return () => unsub();
  }, [currentReport]);
  
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