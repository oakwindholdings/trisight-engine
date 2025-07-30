// src/components/Reports/AIInsights.tsx
// AI-powered insights and recommendations widget
// Context: Provides intelligent suggestions for report improvement

import React from 'react';
import styled from 'styled-components';
import { Zap, TrendingUp, AlertCircle, Lightbulb } from 'lucide-react';

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
}

const insights: Insight[] = [
  {
    id: '1',
    type: 'success',
    title: 'Strong engagement pattern detected',
    text: 'Your AAPL reports have 15% higher engagement when including risk/return scatter plots. Consider making this a default visualization.',
    action: 'Apply to template',
    impact: 'High impact',
    icon: TrendingUp,
    color: '#10b981'
  },
  {
    id: '2',
    type: 'warning',
    title: 'Data freshness alert',
    text: 'Financial statements data is 2 days old. Recent earnings release available - update recommended for accuracy.',
    action: 'Refresh data',
    impact: 'Critical',
    icon: AlertCircle,
    color: '#f59e0b'
  },
  {
    id: '3',
    type: 'info',
    title: 'Export optimization available',
    text: 'Enable batch processing for Excel exports to reduce generation time by ~40% when creating multiple format exports.',
    action: 'Enable',
    impact: 'Medium impact',
    icon: Zap,
    color: '#3b82f6'
  },
  {
    id: '4',
    type: 'tip',
    title: 'Usage pattern insight',
    text: 'Most reports are generated Monday mornings between 8-10 AM. Consider pre-loading common data sources during this window.',
    impact: 'Low impact',
    icon: Lightbulb,
    color: '#8b5cf6'
  }
];

interface AIInsightsProps {
  currentReport?: any;
  onReportChange?: (report: any) => void;
}

export const AIInsights: React.FC<AIInsightsProps> = () => {
  const handleAction = (insightId: string, action?: string) => {
    console.log('Applying insight:', insightId, action);
  };

  return (
    <Container>
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
    </Container>
  );
};