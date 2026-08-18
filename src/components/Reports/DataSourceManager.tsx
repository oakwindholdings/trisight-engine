// src/components/Reports/DataSourceManager.tsx
// Data source management widget
// Context: Shows connected data sources and their status

import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { Database, Check, X, RefreshCw, AlertCircle } from 'lucide-react';
import { checkMarketStatus } from '../../api/marketApi';
import { logDebug } from '../../utils/logger';

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

interface DataSourceManagerProps {
  currentReport?: any;
  onReportChange?: (report: any) => void;
}

export const DataSourceManager: React.FC<DataSourceManagerProps> = () => {
  const [dataSources, setDataSources] = useState<DataSource[]>([
    {
      id: 'twelvedata',
      name: 'TwelveData API',
      status: 'disconnected',
      lastSync: 'Checking...',
      dataPoints: 0,
      latency: 0,
      coverage: 'Real-time'
    },
    {
      id: 'financials',
      name: 'Financial Statements',
      status: 'disconnected',
      lastSync: 'Not synced',
      dataPoints: 0,
      coverage: 'Quarterly'
    },
    {
      id: 'patterns',
      name: 'Pattern Detection',
      status: 'disconnected',
      lastSync: 'Not synced',
      dataPoints: 0
    },
    {
      id: 'news',
      name: 'News & Sentiment',
      status: 'disconnected',
      lastSync: 'Not connected'
    },
    {
      id: 'ai',
      name: 'AI Analysis',
      status: 'disconnected',
      lastSync: 'Not connected',
      dataPoints: 0
    }
  ]);
  
  const [refreshing, setRefreshing] = useState<Set<string>>(new Set());
  
  useEffect(() => {
    checkDataSources();
    const interval = setInterval(checkDataSources, 60000); // Check every minute
    return () => clearInterval(interval);
  }, []);
  
  const checkDataSources = async () => {
    const newSources = [...dataSources];
    
    // Check TwelveData API
    try {
      const apiKey = localStorage.getItem('twelvedata_api_key') || process.env.REACT_APP_TWELVE_DATA_API_KEY;
      if (apiKey) {
        const startTime = Date.now();
        const marketStatus = await checkMarketStatus();
        const latency = Date.now() - startTime;
        
        const twelveDataSource = newSources.find(s => s.id === 'twelvedata');
        if (twelveDataSource) {
          twelveDataSource.status = 'connected';
          twelveDataSource.lastSync = 'Just now';
          twelveDataSource.latency = latency;
          // Get cached data count
          const cachedData = JSON.parse(localStorage.getItem('trisight_market_data_cache') || '{}');
          twelveDataSource.dataPoints = Object.keys(cachedData).length;
        }
      } else {
        const twelveDataSource = newSources.find(s => s.id === 'twelvedata');
        if (twelveDataSource) {
          twelveDataSource.status = 'disconnected';
          twelveDataSource.lastSync = 'API key required';
        }
      }
    } catch (error) {
      const twelveDataSource = newSources.find(s => s.id === 'twelvedata');
      if (twelveDataSource) {
        twelveDataSource.status = 'error';
        twelveDataSource.lastSync = 'Connection failed';
      }
    }
    
    // Check Financial Statements (from report storage)
    try {
      const reports = JSON.parse(localStorage.getItem('trisight_reports') || '[]');
      const financialReports = reports.filter((r: any) => r.companyData?.financials);
      const financialsSource = newSources.find(s => s.id === 'financials');
      if (financialsSource) {
        if (financialReports.length > 0) {
          financialsSource.status = 'connected';
          const lastReport = financialReports[financialReports.length - 1];
          const lastUpdate = new Date(lastReport.createdAt);
          const minutesAgo = Math.floor((Date.now() - lastUpdate.getTime()) / 60000);
          financialsSource.lastSync = minutesAgo < 60 ? `${minutesAgo} min ago` : `${Math.floor(minutesAgo / 60)} hours ago`;
          financialsSource.dataPoints = financialReports.length;
        } else {
          financialsSource.status = 'disconnected';
          financialsSource.lastSync = 'No data';
        }
      }
    } catch (error) {
      logDebug('DataSourceManager', 'Error checking financial data:', error);
    }
    
    // Check Pattern Detection
    try {
      const patterns = JSON.parse(localStorage.getItem('trisight_patterns') || '[]');
      const patternSource = newSources.find(s => s.id === 'patterns');
      if (patternSource) {
        if (patterns.length > 0) {
          patternSource.status = 'connected';
          patternSource.dataPoints = patterns.length;
          patternSource.lastSync = 'Active';
        } else {
          patternSource.status = 'disconnected';
          patternSource.lastSync = 'No patterns';
        }
      }
    } catch (error) {
      logDebug('DataSourceManager', 'Error checking pattern data:', error);
    }
    
    // Check News (from Anthropic API)
    const newsSource = newSources.find(s => s.id === 'news');
    if (newsSource) {
      const anthropicKey = process.env.REACT_APP_ANTHROPIC_API_KEY;
      if (anthropicKey) {
        newsSource.status = 'connected';
        newsSource.lastSync = 'Available';
      } else {
        newsSource.status = 'disconnected';
        newsSource.lastSync = 'API key required';
      }
    }
    
    // Check AI Analysis
    const aiSource = newSources.find(s => s.id === 'ai');
    if (aiSource) {
      const anthropicKey = process.env.REACT_APP_ANTHROPIC_API_KEY;
      if (anthropicKey) {
        aiSource.status = 'connected';
        aiSource.lastSync = 'Ready';
      } else {
        aiSource.status = 'disconnected';
        aiSource.lastSync = 'API key required';
      }
    }
    
    setDataSources(newSources);
  };
  
  const handleRefresh = async (sourceId: string) => {
    setRefreshing(prev => new Set([...prev, sourceId]));
    
    // Update the source to syncing status
    setDataSources(prev => prev.map(source => 
      source.id === sourceId ? { ...source, status: 'syncing', lastSync: 'Syncing...' } : source
    ));
    
    // Simulate refresh with actual check
    setTimeout(async () => {
      await checkDataSources();
      setRefreshing(prev => {
        const next = new Set(prev);
        next.delete(sourceId);
        return next;
      });
    }, 2000);
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