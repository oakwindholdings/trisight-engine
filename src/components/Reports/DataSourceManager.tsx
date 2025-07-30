// src/components/Reports/DataSourceManager.tsx
// Data source management widget
// Context: Shows connected data sources and their status

import React from 'react';
import styled from 'styled-components';
import { Database, Check, X, RefreshCw, AlertCircle } from 'lucide-react';

const Container = styled.div`
  padding: 1rem;
  height: 100%;
  overflow-y: auto;
`;

const SourceList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
`;

const SourceCard = styled.div`
  padding: 1rem;
  background: #f9fafb;
  border-radius: 0.5rem;
  border: 1px solid #e5e7eb;
`;

const SourceHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 0.5rem;
`;

const SourceInfo = styled.div`
  display: flex;
  align-items: center;
  gap: 0.75rem;
`;

const StatusIndicator = styled.div<{ $status: 'connected' | 'disconnected' | 'syncing' | 'error' }>`
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: ${props => {
    switch (props.$status) {
      case 'connected': return '#10b981';
      case 'disconnected': return '#6b7280';
      case 'syncing': return '#f59e0b';
      case 'error': return '#ef4444';
    }
  }};
  animation: ${props => props.$status === 'syncing' ? 'pulse 2s infinite' : 'none'};
  
  @keyframes pulse {
    0% { opacity: 1; }
    50% { opacity: 0.5; }
    100% { opacity: 1; }
  }
`;

const SourceName = styled.h4`
  font-size: 0.875rem;
  font-weight: 600;
  color: #1f2937;
  margin: 0;
`;

const IconButton = styled.button`
  padding: 0.25rem;
  background: none;
  border: none;
  cursor: pointer;
  color: #6b7280;
  border-radius: 0.25rem;
  transition: all 0.2s;
  
  &:hover {
    background: #e5e7eb;
    color: #374151;
  }
  
  svg {
    width: 16px;
    height: 16px;
  }
`;

const SourceDetails = styled.div`
  font-size: 0.75rem;
  color: #6b7280;
  margin-left: 1.25rem;
`;

const MetricRow = styled.div`
  display: flex;
  justify-content: space-between;
  margin-top: 0.25rem;
`;

const ActionBar = styled.div`
  margin-top: 1.5rem;
  padding-top: 1.5rem;
  border-top: 1px solid #e5e7eb;
`;

const Button = styled.button`
  width: 100%;
  padding: 0.625rem;
  background: white;
  border: 1px solid #d1d5db;
  border-radius: 0.375rem;
  font-size: 0.875rem;
  font-weight: 500;
  color: #374151;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  
  &:hover {
    background: #f9fafb;
    border-color: #9ca3af;
  }
  
  svg {
    width: 16px;
    height: 16px;
  }
`;

interface DataSource {
  id: string;
  name: string;
  status: 'connected' | 'disconnected' | 'syncing' | 'error';
  lastSync?: string;
  dataPoints?: number;
  latency?: number;
  coverage?: string;
}

const dataSources: DataSource[] = [
  {
    id: 'twelvedata',
    name: 'TwelveData API',
    status: 'connected',
    lastSync: '2 min ago',
    dataPoints: 142300,
    latency: 45,
    coverage: 'Real-time'
  },
  {
    id: 'financials',
    name: 'Financial Statements',
    status: 'connected',
    lastSync: '1 hour ago',
    dataPoints: 8432,
    coverage: 'Quarterly'
  },
  {
    id: 'patterns',
    name: 'Pattern Detection',
    status: 'syncing',
    lastSync: 'Syncing...',
    dataPoints: 1247
  },
  {
    id: 'sentiment',
    name: 'News Sentiment',
    status: 'disconnected',
    lastSync: 'Not connected'
  },
  {
    id: 'analyst',
    name: 'Analyst Ratings',
    status: 'error',
    lastSync: 'Error',
    dataPoints: 0
  }
];

interface DataSourceManagerProps {
  currentReport?: any;
  onReportChange?: (report: any) => void;
}

export const DataSourceManager: React.FC<DataSourceManagerProps> = () => {
  const handleRefresh = (sourceId: string) => {
    console.log('Refreshing source:', sourceId);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'connected': return <Check />;
      case 'disconnected': return <X />;
      case 'syncing': return <RefreshCw />;
      case 'error': return <AlertCircle />;
      default: return null;
    }
  };

  return (
    <Container>
      <SourceList>
        {dataSources.map(source => (
          <SourceCard key={source.id}>
            <SourceHeader>
              <SourceInfo>
                <StatusIndicator $status={source.status} />
                <SourceName>{source.name}</SourceName>
              </SourceInfo>
              <IconButton 
                onClick={() => handleRefresh(source.id)}
                title="Refresh"
              >
                <RefreshCw />
              </IconButton>
            </SourceHeader>
            <SourceDetails>
              {source.status === 'connected' && (
                <>
                  <MetricRow>
                    <span>Last sync:</span>
                    <span>{source.lastSync}</span>
                  </MetricRow>
                  {source.dataPoints !== undefined && (
                    <MetricRow>
                      <span>Data points:</span>
                      <span>{source.dataPoints.toLocaleString()}</span>
                    </MetricRow>
                  )}
                  {source.latency && (
                    <MetricRow>
                      <span>Latency:</span>
                      <span>{source.latency}ms</span>
                    </MetricRow>
                  )}
                  {source.coverage && (
                    <MetricRow>
                      <span>Coverage:</span>
                      <span>{source.coverage}</span>
                    </MetricRow>
                  )}
                </>
              )}
              {source.status === 'disconnected' && (
                <div style={{ color: '#6b7280' }}>Not connected</div>
              )}
              {source.status === 'error' && (
                <div style={{ color: '#ef4444' }}>Connection failed</div>
              )}
            </SourceDetails>
          </SourceCard>
        ))}
      </SourceList>
      
      <ActionBar>
        <Button>
          <Database />
          Manage Data Sources
        </Button>
      </ActionBar>
    </Container>
  );
};