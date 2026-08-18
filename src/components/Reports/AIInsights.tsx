// src/components/Reports/AIInsights.tsx
// AI-powered insights and recommendations widget
// Context: Provides intelligent suggestions for report improvement

import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { Zap, TrendingUp, AlertCircle, Lightbulb, ChevronRight, Brain, Target } from 'lucide-react';
import { getStorageService } from '../../services/reportStorageService';
import { logDebug } from '../../utils/logger';

const Container = styled.div`
  padding: 1rem;
  height: 100%;
  overflow-y: auto;
`;

const InsightsList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
`;

const InsightCard = styled.div<{ $type: 'success' | 'warning' | 'info' | 'tip' }>`
  padding: 1rem;
  border-radius: 0.5rem;
  border: 1px solid ${props => {
    switch (props.$type) {
      case 'success': return '#bbf7d0';
      case 'warning': return '#fde68a';
      case 'info': return '#bfdbfe';
      case 'tip': return '#e9d5ff';
    }
  }};
  background: ${props => {
    switch (props.$type) {
      case 'success': return '#f0fdf4';
      case 'warning': return '#fef3c7';
      case 'info': return '#eff6ff';
      case 'tip': return '#f3e8ff';
    }
  }};
`;

const InsightHeader = styled.div`
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
  margin-bottom: 0.5rem;
`;

const InsightIcon = styled.div<{ $color: string }>`
  width: 24px;
  height: 24px;
  flex-shrink: 0;
  
  svg {
    width: 24px;
    height: 24px;
    color: ${props => props.$color};
  }
`;

const InsightContent = styled.div`
  flex: 1;
`;

const InsightTitle = styled.h4`
  font-size: 0.875rem;
  font-weight: 600;
  color: #1f2937;
  margin: 0 0 0.25rem 0;
`;

const InsightText = styled.p`
  font-size: 0.75rem;
  color: #4b5563;
  margin: 0;
  line-height: 1.5;
`;

const InsightAction = styled.button`
  margin-top: 0.5rem;
  padding: 0.375rem 0.75rem;
  background: white;
  border: 1px solid #d1d5db;
  border-radius: 0.375rem;
  font-size: 0.75rem;
  font-weight: 500;
  color: #374151;
  cursor: pointer;
  transition: all 0.2s;
  
  &:hover {
    background: #f9fafb;
  }
`;

const InsightMeta = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-top: 0.5rem;
  font-size: 0.625rem;
  color: #9ca3af;
`;

interface Insight {
  id: string;
  type: 'success' | 'warning' | 'info' | 'tip';
  title: string;
  text: string;
  action?: string;
  impact?: string;
  icon: React.ElementType;
  color: string;
  data?: any;
}

interface AIInsightsProps {
  currentReport?: any;
  onReportChange?: (report: any) => void;
}

export const AIInsights: React.FC<AIInsightsProps> = ({ currentReport }) => {
  const [insights, setInsights] = useState<Insight[]>([]);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    generateInsights();
  }, [currentReport]);
  
  const generateInsights = async () => {
    setLoading(true);
    const newInsights: Insight[] = [];
    
    try {
      const storageService = getStorageService();
      // Loosely typed: this heuristic panel probes optional fields (quality/config/performance)
      // that only some report payloads carry; optional chaining below guards every access.
      const reports: any[] = await storageService.listReports();
      
      // Analyze current report for insights
      if (currentReport) {
        // Check data freshness
        if (currentReport.companyData?.metadata?.lastUpdated) {
          const lastUpdate = new Date(currentReport.companyData.metadata.lastUpdated);
          const hoursOld = (Date.now() - lastUpdate.getTime()) / (1000 * 60 * 60);
          
          if (hoursOld > 24) {
            newInsights.push({
              id: 'freshness',
              type: 'warning',
              title: 'Data freshness alert',
              text: `Market data is ${Math.floor(hoursOld)} hours old. Consider refreshing for the latest information.`,
              action: 'Refresh data',
              impact: 'Critical',
              icon: AlertCircle,
              color: '#f59e0b'
            });
          }
        }
        
        // Check data quality
        if (currentReport.metadata?.quality) {
          const quality = currentReport.metadata.quality;
          if (quality.overall < 0.7) {
            newInsights.push({
              id: 'quality',
              type: 'warning',
              title: 'Data quality improvement needed',
              text: `Current data quality score: ${(quality.overall * 100).toFixed(0)}%. ${quality.recommendations?.[0] || 'Consider adding more data sources.'}`,
              action: 'Improve quality',
              impact: 'High impact',
              icon: Target,
              color: '#ef4444'
            });
          } else if (quality.overall > 0.9) {
            newInsights.push({
              id: 'quality-good',
              type: 'success',
              title: 'Excellent data quality',
              text: `Data quality score: ${(quality.overall * 100).toFixed(0)}%. Your report has comprehensive and accurate data.`,
              impact: 'Positive',
              icon: TrendingUp,
              color: '#10b981'
            });
          }
        }
      }
      
      // Analyze historical patterns
      if (reports.length > 5) {
        // Find most successful report features
        const successfulReports = reports
          .filter(r => r.metadata?.quality?.overall > 0.8)
          .slice(-10); // Last 10 high-quality reports
        
        if (successfulReports.length > 3) {
          // Check common patterns
          const chartTypes = successfulReports
            .flatMap(r => r.config?.chartConfigs || [])
            .map(c => c.type);
          
          const chartFrequency: Record<string, number> = {};
          chartTypes.forEach(type => {
            chartFrequency[type] = (chartFrequency[type] || 0) + 1;
          });
          
          const mostCommonChart = Object.entries(chartFrequency)
            .sort(([, a], [, b]) => b - a)[0];
          
          if (mostCommonChart && mostCommonChart[1] > successfulReports.length * 0.7) {
            newInsights.push({
              id: 'pattern',
              type: 'success',
              title: 'Successful pattern detected',
              text: `${mostCommonChart[1]} of your best reports include ${mostCommonChart[0]} charts. This visualization resonates well with your audience.`,
              action: 'Apply pattern',
              impact: 'High impact',
              icon: Brain,
              color: '#10b981'
            });
          }
        }
        
        // Performance optimization
        const avgGenTime = reports
          .filter(r => r.performance?.totalDuration)
          .map(r => r.performance.totalDuration)
          .reduce((sum, time, _, arr) => sum + time / arr.length, 0);
        
        if (avgGenTime > 60000) { // More than 1 minute
          newInsights.push({
            id: 'performance',
            type: 'info',
            title: 'Performance optimization available',
            text: `Average report generation time: ${(avgGenTime / 1000).toFixed(0)}s. Enable caching to reduce by up to 50%.`,
            action: 'Optimize',
            impact: 'Medium impact',
            icon: Zap,
            color: '#3b82f6'
          });
        }
      }
      
      // General tips based on usage
      const recentReports = reports.filter(r => {
        const created = new Date(r.createdAt);
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);
        return created > weekAgo;
      });
      
      if (recentReports.length > 10) {
        // Analyze generation times
        const hourCounts: Record<number, number> = {};
        recentReports.forEach(r => {
          const hour = new Date(r.createdAt).getHours();
          hourCounts[hour] = (hourCounts[hour] || 0) + 1;
        });
        
        const peakHour = Object.entries(hourCounts)
          .sort(([, a], [, b]) => b - a)[0];
        
        if (peakHour && peakHour[1] > recentReports.length * 0.3) {
          newInsights.push({
            id: 'usage',
            type: 'tip',
            title: 'Usage pattern detected',
            text: `You frequently generate reports around ${peakHour[0]}:00. Consider scheduling data pre-loading for faster generation.`,
            impact: 'Optimization',
            icon: Lightbulb,
            color: '#8b5cf6'
          });
        }
      }
      
      // If no specific insights, provide general tips
      if (newInsights.length === 0) {
        newInsights.push({
          id: 'welcome',
          type: 'info',
          title: 'Welcome to AI Insights',
          text: 'Generate a few reports to unlock personalized recommendations and optimization tips.',
          icon: Brain,
          color: '#3b82f6'
        });
      }
      
      setInsights(newInsights);
    } catch (error) {
      logDebug('AIInsights', 'Error generating insights:', error);
      setInsights([{
        id: 'error',
        type: 'info',
        title: 'Insights temporarily unavailable',
        text: 'Unable to generate insights at this time. Please try again later.',
        icon: AlertCircle,
        color: '#6b7280'
      }]);
    } finally {
      setLoading(false);
    }
  };
  
  const handleAction = async (insightId: string, action?: string) => {
    logDebug('AIInsights', 'Applying insight:', { insightId, action });
    
    const insight = insights.find(i => i.id === insightId);
    if (!insight) return;
    
    switch (action) {
      case 'Refresh data':
        // Trigger data refresh
        window.dispatchEvent(new CustomEvent('refreshReportData'));
        break;
      
      case 'Apply pattern':
      case 'Apply to template':
        // Apply successful pattern to current report
        if (insight.data) {
          window.dispatchEvent(new CustomEvent('applyReportPattern', { detail: insight.data }));
        }
        break;
      
      case 'Optimize':
      case 'Enable':
        // Enable performance optimizations
        localStorage.setItem('trisight_report_caching', 'enabled');
        localStorage.setItem('trisight_batch_export', 'enabled');
        // Refresh insights to reflect changes
        setTimeout(generateInsights, 500);
        break;
      
      case 'Improve quality':
        // Navigate to data sources
        window.dispatchEvent(new CustomEvent('showDataSources'));
        break;
    }
  };

  return (
    <Container>
      {loading ? (
        <div style={{ padding: '2rem', textAlign: 'center', color: '#6b7280' }}>
          <Brain style={{ width: 32, height: 32, margin: '0 auto 1rem', opacity: 0.5 }} />
          <p style={{ fontSize: '0.875rem' }}>Analyzing data...</p>
        </div>
      ) : (
        <InsightsList>
          {insights.map(insight => {
            const Icon = insight.icon;
            return (
              <InsightCard key={insight.id} $type={insight.type}>
                <InsightHeader>
                  <InsightIcon $color={insight.color}>
                    <Icon />
                  </InsightIcon>
                  <InsightContent>
                    <InsightTitle>{insight.title}</InsightTitle>
                    <InsightText>{insight.text}</InsightText>
                    {insight.action && (
                      <InsightAction onClick={() => handleAction(insight.id, insight.action)}>
                        {insight.action}
                      </InsightAction>
                    )}
                    {insight.impact && (
                      <InsightMeta>
                        <span>{insight.impact}</span>
                      </InsightMeta>
                    )}
                  </InsightContent>
                </InsightHeader>
              </InsightCard>
            );
          })}
        </InsightsList>
      )}
    </Container>
  );
};