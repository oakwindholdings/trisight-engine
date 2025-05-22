// src/components/Dashboard/LearningDashboard.tsx
// Legacy learning dashboard component
// Shows metrics in table form
import React, { useState } from 'react';
import styled from 'styled-components';
import { PatternType, patternStyles } from '../../models/PatternTypes';
import { useLearningContext } from '../../contexts/LearningContext';
import DataExportImport from '../Settings/DataExportImport';

const DashboardContainer = styled.div`
  background-color: white;
  border-radius: 4px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  padding: 24px;
`;

const DashboardHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
`;

const DashboardTitle = styled.h2`
  margin: 0;
  font-size: 18px;
  color: #212121;
`;

const ActionButtonsContainer = styled.div`
  display: flex;
  gap: 12px;
`;

const ActionButton = styled.button`
  padding: 8px 16px;
  background-color: #1976d2;
  color: white;
  border: none;
  border-radius: 4px;
  font-size: 14px;
  cursor: pointer;
  
  &:hover {
    background-color: #1565c0;
  }
  
  &:disabled {
    background-color: #e0e0e0;
    color: #9e9e9e;
    cursor: not-allowed;
  }
`;

const DashboardGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 24px;
`;

const MetricCard = styled.div`
  background-color: #f9f9f9;
  border-radius: 4px;
  padding: 16px;
`;

const MetricTitle = styled.h3`
  margin: 0 0 16px 0;
  font-size: 16px;
  color: #424242;
`;

const ChartContainer = styled.div`
  height: 200px;
  margin-bottom: 16px;
`;

const TableContainer = styled.div`
  max-height: 300px;
  overflow-y: auto;
`;

const Table = styled.table`
  width: 100%;
  border-collapse: collapse;
`;

const TableHeader = styled.th`
  text-align: left;
  padding: 8px;
  border-bottom: 1px solid #e0e0e0;
  font-size: 14px;
  color: #757575;
`;

const TableCell = styled.td`
  padding: 8px;
  border-bottom: 1px solid #e0e0e0;
  font-size: 14px;
`;

const EmptyState = styled.div`
  text-align: center;
  padding: 32px;
  color: #9e9e9e;
  font-size: 14px;
`;

const FileInput = styled.input`
  display: none;
`;

// Helper function to format pattern type
const formatPatternType = (type: string): string => {
  return type.split('_').map(word => 
    word.charAt(0) + word.slice(1).toLowerCase()
  ).join(' ');
};

// Simple bar chart component for accuracy visualization
const AccuracyChart: React.FC<{ 
  data: Record<PatternType, number> | undefined 
}> = ({ data }) => {
  if (!data || Object.keys(data).length === 0) {
    return (
      <EmptyState>No accuracy data available</EmptyState>
    );
  }
  
  return (
    <div style={{ height: '100%' }}>
      {Object.entries(data).map(([type, accuracy]) => (
        <div key={type} style={{ 
          marginBottom: '8px',
          display: 'flex',
          alignItems: 'center'
        }}>
          <div style={{ width: '120px', fontSize: '12px' }}>
            {formatPatternType(type)}
          </div>
          <div style={{ 
            flex: 1,
            height: '20px',
            backgroundColor: '#f0f0f0',
            borderRadius: '2px',
            overflow: 'hidden'
          }}>
            <div style={{
              width: `${accuracy * 100}%`,
              height: '100%',
              backgroundColor: patternStyles[type as PatternType].color,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'flex-end',
              paddingRight: '8px',
            }}>
              <span style={{ 
                color: 'white', 
                fontSize: '12px',
                fontWeight: 'bold'
              }}>
                {(accuracy * 100).toFixed(0)}%
              </span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

const LearningDashboard: React.FC = () => {
  const { 
    metrics, 
    loading, 
    error, 
    refreshMetrics, 
    exportModel, 
    importModel 
  } = useLearningContext();
  
  const [importing, setImporting] = useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  
  // Handle file import
  const handleFileImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setImporting(true);
    try {
      await importModel(file);
    } catch (error) {
      console.error('Error importing model:', error);
      alert('Failed to import model. Please check the file format.');
    } finally {
      setImporting(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };
  
  // Handle export
  const handleExport = async () => {
    await exportModel();
  };
  
  return (
    <DashboardContainer>
      <DashboardHeader>
        <DashboardTitle>Pattern Learning Dashboard</DashboardTitle>
        
        <ActionButtonsContainer>
          <ActionButton 
            onClick={refreshMetrics}
            disabled={loading}
          >
            {loading ? 'Loading...' : 'Refresh Metrics'}
          </ActionButton>
          
          <ActionButton 
            onClick={handleExport}
            disabled={loading || !metrics}
          >
            Export Model
          </ActionButton>
          
          <ActionButton 
            onClick={() => fileInputRef.current?.click()}
            disabled={loading || importing}
          >
            {importing ? 'Importing...' : 'Import Model'}
          </ActionButton>
          
          <FileInput 
            type="file" 
            ref={fileInputRef}
            accept=".json"
            onChange={handleFileImport}
          />
        </ActionButtonsContainer>
      </DashboardHeader>
      
      {/* Data Export/Import Component */}
      <DataExportImport />
      
      {error && (
        <div style={{ color: 'red', marginBottom: '16px' }}>
          Error: {error.message}
        </div>
      )}
      
      {!metrics && !loading && !error && (
        <EmptyState>
          No learning data available yet. Start providing pattern feedback to build the learning model.
        </EmptyState>
      )}
      
      {metrics && (
        <DashboardGrid>
          {/* Accuracy by Pattern Type */}
          <MetricCard>
            <MetricTitle>Pattern Detection Accuracy</MetricTitle>
            <ChartContainer>
              <AccuracyChart data={metrics.accuracyByPatternType} />
            </ChartContainer>
          </MetricCard>
          
          {/* Feedback Volume */}
          <MetricCard>
            <MetricTitle>Pattern Feedback Volume</MetricTitle>
            <TableContainer>
              <Table>
                <thead>
                  <tr>
                    <TableHeader>Pattern Type</TableHeader>
                    <TableHeader>Feedback Count</TableHeader>
                    <TableHeader>Accuracy</TableHeader>
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(metrics.feedbackCountByPatternType)
                    .sort((a, b) => b[1] - a[1])
                    .map(([type, count]) => (
                      <tr key={type}>
                        <TableCell>{formatPatternType(type)}</TableCell>
                        <TableCell>{count}</TableCell>
                        <TableCell>
                          {(metrics.accuracyByPatternType[type as PatternType] * 100).toFixed(0)}%
                        </TableCell>
                      </tr>
                    ))
                  }
                </tbody>
              </Table>
            </TableContainer>
          </MetricCard>
          
          {/* Pattern Corrections */}
          <MetricCard>
            <MetricTitle>Common Pattern Corrections</MetricTitle>
            <TableContainer>
              {metrics.correctionsByType.length > 0 ? (
                <Table>
                  <thead>
                    <tr>
                      <TableHeader>Original Type</TableHeader>
                      <TableHeader>Corrected Type</TableHeader>
                      <TableHeader>Count</TableHeader>
                    </tr>
                  </thead>
                  <tbody>
                    {metrics.correctionsByType
                      .sort((a, b) => b.count - a.count)
                      .map((correction, index) => (
                        <tr key={index}>
                          <TableCell>{formatPatternType(correction.from)}</TableCell>
                          <TableCell>{formatPatternType(correction.to)}</TableCell>
                          <TableCell>{correction.count}</TableCell>
                        </tr>
                      ))
                    }
                  </tbody>
                </Table>
              ) : (
                <EmptyState>No pattern corrections yet</EmptyState>
              )}
            </TableContainer>
          </MetricCard>
          
          {/* Top Contributors */}
          <MetricCard>
            <MetricTitle>Top Contributors</MetricTitle>
            <TableContainer>
              {metrics.topContributors.length > 0 ? (
                <Table>
                  <thead>
                    <tr>
                      <TableHeader>User ID</TableHeader>
                      <TableHeader>Feedback Count</TableHeader>
                      <TableHeader>Accuracy Rate</TableHeader>
                    </tr>
                  </thead>
                  <tbody>
                    {metrics.topContributors.map((contributor, index) => (
                      <tr key={index}>
                        <TableCell>{contributor.userId}</TableCell>
                        <TableCell>{contributor.feedbackCount}</TableCell>
                        <TableCell>
                          {(contributor.accuracyRate * 100).toFixed(0)}%
                        </TableCell>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              ) : (
                <EmptyState>No contributors yet</EmptyState>
              )}
            </TableContainer>
          </MetricCard>
        </DashboardGrid>
      )}
    </DashboardContainer>
  );
};

export default LearningDashboard;
