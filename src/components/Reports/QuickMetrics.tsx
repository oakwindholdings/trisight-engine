// src/components/Reports/QuickMetrics.tsx
// Real-time metrics dashboard for report generation
// Context: Shows live statistics about report performance

import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { TrendingUp, Users, Clock, Award } from 'lucide-react';
import { getStorageService } from '../../services/reportStorageService';
import { logDebug } from '../../utils/logger';

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
    const fetchMetrics = async () => {
      try {
        const storageService = getStorageService();
        const reports = await storageService.listReports();
        
        // Calculate real metrics
        const totalReports = reports.length;
        const lastWeekReports = reports.filter(r => {
          const createdAt = new Date(r.createdAt);
          const weekAgo = new Date();
          weekAgo.setDate(weekAgo.getDate() - 7);
          return createdAt > weekAgo;
        }).length;
        
        // Calculate average generation time
        const completedReports = reports.filter(r => r.status === 'completed' && r.performance?.totalDuration);
        const avgTime = completedReports.length > 0
          ? completedReports.reduce((sum, r) => sum + (r.performance?.totalDuration || 0), 0) / completedReports.length / 60000
          : 0;
        
        // Calculate data quality score
        const qualityScores = reports
          .filter(r => r.metadata?.quality?.overall)
          .map(r => r.metadata.quality.overall);
        const avgQuality = qualityScores.length > 0
          ? qualityScores.reduce((sum, score) => sum + score, 0) / qualityScores.length * 100
          : 0;
        
        // Calculate changes (simplified - comparing to previous period)
        const prevWeekReports = reports.filter(r => {
          const createdAt = new Date(r.createdAt);
          const weekAgo = new Date();
          const twoWeeksAgo = new Date();
          weekAgo.setDate(weekAgo.getDate() - 7);
          twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);
          return createdAt > twoWeeksAgo && createdAt <= weekAgo;
        }).length;
        
        const reportChange = prevWeekReports > 0 
          ? ((lastWeekReports - prevWeekReports) / prevWeekReports * 100).toFixed(0)
          : '0';
        
        // Count active sessions (reports created in last hour)
        const activeSessions = reports.filter(r => {
          const createdAt = new Date(r.createdAt);
          const hourAgo = new Date();
          hourAgo.setHours(hourAgo.getHours() - 1);
          return createdAt > hourAgo;
        }).length;
        
        setMetrics([
          {
            label: 'Reports Generated',
            value: totalReports.toString(),
            change: `${reportChange > 0 ? '+' : ''}${reportChange}%`,
            positive: Number(reportChange) >= 0,
            icon: TrendingUp,
            color: '#3b82f6'
          },
          {
            label: 'Active Sessions',
            value: activeSessions.toString(),
            change: lastWeekReports > 0 ? '+' + lastWeekReports : '0',
            positive: true,
            icon: Users,
            color: '#10b981'
          },
          {
            label: 'Avg. Time',
            value: `${avgTime.toFixed(1)}m`,
            change: avgTime < 5 ? '-' + ((5 - avgTime) / 5 * 100).toFixed(0) + '%' : '+0%',
            positive: avgTime < 5,
            icon: Clock,
            color: '#f59e0b'
          },
          {
            label: 'Data Quality',
            value: `${avgQuality.toFixed(0)}%`,
            change: avgQuality > 80 ? '+' + (avgQuality - 80).toFixed(0) + '%' : '0%',
            positive: avgQuality > 80,
            icon: Award,
            color: '#8b5cf6'
          }
        ]);
        
        logDebug('QuickMetrics', 'Metrics updated', { totalReports, activeSessions, avgTime, avgQuality });
      } catch (error) {
        logDebug('QuickMetrics', 'Error fetching metrics:', error);
      }
    };
    
    fetchMetrics();
    const interval = setInterval(fetchMetrics, 30000); // Update every 30 seconds
    
    // Listen for new reports
    const handleReportGenerated = () => fetchMetrics();
    window.addEventListener('reportGenerated', handleReportGenerated);
    
    return () => {
      clearInterval(interval);
      window.removeEventListener('reportGenerated', handleReportGenerated);
    };
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