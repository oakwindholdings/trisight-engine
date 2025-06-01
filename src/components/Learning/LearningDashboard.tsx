// src/components/Learning/LearningDashboard.tsx
// Dashboard with learning metrics
// Displays feedback statistics
import React, { useState } from 'react';
import styled from 'styled-components';
import { PatternType } from '../../models/PatternTypes';
import { useLearningContext } from '../../contexts/LearningContext';
import { LearningMetrics, PatternDetectionParameters } from '../../models/LearningTypes';

// Try to dynamically import chart library
let Chart: any;
try {
  Chart = require('react-chartjs-2');
} catch (e) {
  console.warn('Chart library not available:', e);
}

const DashboardContainer = styled.div`
  padding: 24px;
  background-color: #f9f9f9;
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
`;

const DashboardHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
`;

const Title = styled.h2`
  margin: 0;
  color: #333;
  font-size: 24px;
`;

const ControlsWrapper = styled.div`
  display: flex;
  gap: 16px;
`;

const ToggleButton = styled.button<{ $active: boolean }>`
  padding: 8px 16px;
  border-radius: 4px;
  border: none;
  background-color: ${props => props.$active ? '#1976d2' : '#e0e0e0'};
  color: ${props => props.$active ? 'white' : '#333'};
  font-weight: 500;
  cursor: pointer;
  transition: background-color 0.2s, color 0.2s;
  
  &:hover {
    background-color: ${props => props.$active ? '#1565c0' : '#d5d5d5'};
  }
`;

const ActionButton = styled.button`
  padding: 8px 16px;
  border-radius: 4px;
  border: none;
  background-color: #f5f5f5;
  color: #333;
  font-weight: 500;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 8px;
  
  &:hover {
    background-color: #e0e0e0;
  }
`;

const Grid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 24px;
  margin-bottom: 32px;
`;

const MetricCard = styled.div`
  background-color: white;
  border-radius: 8px;
  padding: 16px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
`;

const CardTitle = styled.h3`
  margin: 0 0 12px 0;
  font-size: 16px;
  color: #424242;
`;

const MetricValue = styled.div<{ positive?: boolean }>`
  font-size: 32px;
  font-weight: 700;
  color: ${props => props.positive ? '#4caf50' : '#f44336'};
  margin-bottom: 8px;
`;

const MetricDescription = styled.p`
  margin: 0;
  color: #757575;
  font-size: 14px;
`;

const PatternTypeSection = styled.div`
  margin-top: 32px;
`;

const SectionTitle = styled.h3`
  margin: 0 0 16px 0;
  color: #333;
`;

const TabsContainer = styled.div`
  display: flex;
  border-bottom: 1px solid #e0e0e0;
  margin-bottom: 24px;
`;

const Tab = styled.button<{ $active: boolean }>`
  padding: 12px 16px;
  border: none;
  background-color: transparent;
  border-bottom: 2px solid ${props => props.$active ? '#1976d2' : 'transparent'};
  color: ${props => props.$active ? '#1976d2' : '#757575'};
  font-weight: 500;
  cursor: pointer;
  
  &:hover {
    color: ${props => props.$active ? '#1976d2' : '#424242'};
  }
`;

const ChartContainer = styled.div`
  margin-bottom: 32px;
  padding: 16px;
  background-color: white;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
`;

const ParameterTable = styled.table`
  width: 100%;
  border-collapse: collapse;
  margin-top: 24px;
`;

const TableRow = styled.tr`
  &:nth-child(odd) {
    background-color: #f5f5f5;
  }
`;

const TableHeader = styled.th`
  text-align: left;
  padding: 12px 16px;
  font-weight: 500;
  color: #424242;
  border-bottom: 1px solid #e0e0e0;
`;

const TableCell = styled.td`
  padding: 12px 16px;
  border-bottom: 1px solid #e0e0e0;
`;

const InputRange = styled.input`
  width: 100%;
`;

const NoDataMessage = styled.div`
  padding: 24px;
  text-align: center;
  color: #757575;
  font-style: italic;
`;

// Helper function to format percentage
const formatPercent = (value: number): string => {
  return `${(value * 100).toFixed(1)}%`;
};

// Dashboard component
const LearningDashboard: React.FC = () => {
  const {
    metrics,
    loading,
    error,
    isLearningEnabled,
    refreshMetrics,
    getPatternParameters,
    updatePatternParameters,
    toggleLearning,
    resetLearningParameters,
    exportModel,
    importModel
  } = useLearningContext();
  
  const [activePatternType, setActivePatternType] = useState<PatternType>(PatternType.GOLDMINE_CHANNEL);
  const [activeTab, setActiveTab] = useState<'performance' | 'parameters'>('performance');
  const [fileInput, setFileInput] = useState<HTMLInputElement | null>(null);
  
  // Create file input ref for import
  const handleImportClick = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        const success = await importModel(file);
        if (success) {
          refreshMetrics();
          alert('Learning model imported successfully!');
        } else {
          alert('Failed to import learning model');
        }
      }
    };
    setFileInput(input);
    input.click();
  };
  
  const handleExportClick = async () => {
    const success = await exportModel();
    if (!success) {
      alert('Failed to export learning model');
    }
  };
  
  const handleResetClick = async () => {
    if (window.confirm('Are you sure you want to reset learning parameters? This cannot be undone.')) {
      await resetLearningParameters(activePatternType);
    }
  };
  
  const handleParameterChange = (paramName: string, value: number) => {
    const currentParams = getPatternParameters(activePatternType);
    const updates: Partial<PatternDetectionParameters> = { 
      [paramName]: value 
    };
    
    updatePatternParameters(activePatternType, updates);
  };
  
  if (loading) {
    return <div>Loading learning metrics...</div>;
  }
  
  if (error) {
    return <div>Error loading metrics: {error.message}</div>;
  }
  
  if (!metrics) {
    return (
      <DashboardContainer>
        <DashboardHeader>
          <Title>Learning Dashboard</Title>
          <ControlsWrapper>
            <ToggleButton
              $active={isLearningEnabled}
              onClick={toggleLearning}
            >
              Learning: {isLearningEnabled ? 'Enabled' : 'Disabled'}
            </ToggleButton>
            <ActionButton onClick={refreshMetrics}>
              Refresh Metrics
            </ActionButton>
          </ControlsWrapper>
        </DashboardHeader>
        <NoDataMessage>No learning metrics available yet. Submit pattern feedback to start learning.</NoDataMessage>
      </DashboardContainer>
    );
  }
  
  // Get current parameters for the active pattern type
  const currentParameters = getPatternParameters(activePatternType);
  
  // Get performance data for the active pattern type
  const patternPerformance = metrics.patternTypePerformance[activePatternType];
  
  return (
    <DashboardContainer>
      <DashboardHeader>
        <Title>Learning Dashboard</Title>
        <ControlsWrapper>
          <ToggleButton
            $active={isLearningEnabled}
            onClick={toggleLearning}
          >
            Learning: {isLearningEnabled ? 'Enabled' : 'Disabled'}
          </ToggleButton>
          <ActionButton onClick={handleImportClick}>
            Import Model
          </ActionButton>
          <ActionButton onClick={handleExportClick}>
            Export Model
          </ActionButton>
          <ActionButton onClick={refreshMetrics}>
            Refresh
          </ActionButton>
        </ControlsWrapper>
      </DashboardHeader>
      
      {/* Overall metrics */}
      <Grid>
        <MetricCard>
          <CardTitle>Overall Accuracy</CardTitle>
          <MetricValue positive={metrics.overallPerformance.accuracy > 0.7}>
            {formatPercent(metrics.overallPerformance.accuracy)}
          </MetricValue>
          <MetricDescription>
            Percentage of patterns correctly identified
          </MetricDescription>
        </MetricCard>
        
        <MetricCard>
          <CardTitle>Precision</CardTitle>
          <MetricValue positive={metrics.overallPerformance.precision > 0.7}>
            {formatPercent(metrics.overallPerformance.precision)}
          </MetricValue>
          <MetricDescription>
            Ratio of true positives to all positive predictions
          </MetricDescription>
        </MetricCard>
        
        <MetricCard>
          <CardTitle>Recall</CardTitle>
          <MetricValue positive={metrics.overallPerformance.recall > 0.7}>
            {formatPercent(metrics.overallPerformance.recall)}
          </MetricValue>
          <MetricDescription>
            Ratio of true positives to all actual positives
          </MetricDescription>
        </MetricCard>
        
        <MetricCard>
          <CardTitle>F1 Score</CardTitle>
          <MetricValue positive={metrics.overallPerformance.f1Score > 0.7}>
            {formatPercent(metrics.overallPerformance.f1Score)}
          </MetricValue>
          <MetricDescription>
            Harmonic mean of precision and recall
          </MetricDescription>
        </MetricCard>
      </Grid>
      
      {/* Pattern type specific metrics */}
      <PatternTypeSection>
        <SectionTitle>Pattern Type Performance</SectionTitle>
        
        <TabsContainer>
          {Object.values(PatternType).map(patternType => (
            <Tab
              key={patternType}
              $active={activePatternType === patternType}
              onClick={() => setActivePatternType(patternType)}
            >
              {patternType.replace('_', ' ')}
            </Tab>
          ))}
        </TabsContainer>
        
        <TabsContainer>
          <Tab
            $active={activeTab === 'performance'}
            onClick={() => setActiveTab('performance')}
          >
            Performance
          </Tab>
          <Tab
            $active={activeTab === 'parameters'}
            onClick={() => setActiveTab('parameters')}
          >
            Parameters
          </Tab>
        </TabsContainer>
        
        {activeTab === 'performance' && (
          <>
            <Grid>
              <MetricCard>
                <CardTitle>Detection Count</CardTitle>
                <MetricValue>
                  {patternPerformance.detectionCount}
                </MetricValue>
                <MetricDescription>
                  Number of patterns detected
                </MetricDescription>
              </MetricCard>
              
              <MetricCard>
                <CardTitle>False Positive Rate</CardTitle>
                <MetricValue positive={patternPerformance.falsePositiveRate < 0.3}>
                  {formatPercent(patternPerformance.falsePositiveRate)}
                </MetricValue>
                <MetricDescription>
                  Percentage of incorrect pattern detections
                </MetricDescription>
              </MetricCard>
              
              <MetricCard>
                <CardTitle>Average Confidence</CardTitle>
                <MetricValue positive={patternPerformance.averageConfidence > 0.7}>
                  {formatPercent(patternPerformance.averageConfidence)}
                </MetricValue>
                <MetricDescription>
                  Average confidence in detected patterns
                </MetricDescription>
              </MetricCard>
              
              <MetricCard>
                <CardTitle>Feedback Incorporation</CardTitle>
                <MetricValue positive={patternPerformance.feedbackIncorporationRate > 0.7}>
                  {formatPercent(patternPerformance.feedbackIncorporationRate)}
                </MetricValue>
                <MetricDescription>
                  How much feedback has been incorporated
                </MetricDescription>
              </MetricCard>
            </Grid>
            
            {Chart && patternPerformance.improvementTrend.length > 0 && (
              <ChartContainer>
                <CardTitle>Improvement Trend</CardTitle>
                <Chart.Line
                  data={{
                    labels: patternPerformance.improvementTrend.map((_, i) => `Iteration ${i+1}`),
                    datasets: [{
                      label: 'Accuracy',
                      data: patternPerformance.improvementTrend,
                      fill: false,
                      backgroundColor: '#1976d2',
                      borderColor: '#1976d2',
                    }]
                  }}
                  options={{
                    responsive: true,
                    scales: {
                      y: {
                        beginAtZero: true,
                        max: 1
                      }
                    }
                  }}
                />
              </ChartContainer>
            )}
          </>
        )}
        
        {activeTab === 'parameters' && (
          <>
            <ActionButton 
              onClick={handleResetClick}
              style={{ marginBottom: 16 }}
            >
              Reset Parameters
            </ActionButton>
            
            <ParameterTable>
              <thead>
                <tr>
                  <TableHeader>Parameter</TableHeader>
                  <TableHeader>Value</TableHeader>
                  <TableHeader>Description</TableHeader>
                </tr>
              </thead>
              <tbody>
                <TableRow>
                  <TableCell>Sensitivity</TableCell>
                  <TableCell>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <InputRange
                        type="range"
                        min="0"
                        max="1"
                        step="0.05"
                        value={currentParameters.sensitivity}
                        onChange={(e) => handleParameterChange('sensitivity', parseFloat(e.target.value))}
                      />
                      <span>{formatPercent(currentParameters.sensitivity)}</span>
                    </div>
                  </TableCell>
                  <TableCell>How sensitive the detection algorithm is to pattern formation</TableCell>
                </TableRow>
                
                <TableRow>
                  <TableCell>Minimum Confidence</TableCell>
                  <TableCell>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <InputRange
                        type="range"
                        min="0"
                        max="1"
                        step="0.05"
                        value={currentParameters.minConfidence}
                        onChange={(e) => handleParameterChange('minConfidence', parseFloat(e.target.value))}
                      />
                      <span>{formatPercent(currentParameters.minConfidence)}</span>
                    </div>
                  </TableCell>
                  <TableCell>Minimum confidence threshold for pattern detection</TableCell>
                </TableRow>
                
                <TableRow>
                  <TableCell>Boundary Padding</TableCell>
                  <TableCell>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <InputRange
                        type="range"
                        min="0"
                        max="0.2"
                        step="0.01"
                        value={currentParameters.boundaryPadding}
                        onChange={(e) => handleParameterChange('boundaryPadding', parseFloat(e.target.value))}
                      />
                      <span>{formatPercent(currentParameters.boundaryPadding)}</span>
                    </div>
                  </TableCell>
                  <TableCell>Padding added to pattern boundaries</TableCell>
                </TableRow>
                
                {/* Type-specific parameters would be shown here */}
                {Object.entries(currentParameters.typeSpecificParameters).map(([paramName, value]) => (
                  <TableRow key={paramName}>
                    <TableCell>{paramName}</TableCell>
                    <TableCell>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <InputRange
                          type="range"
                          min="0"
                          max="1"
                          step="0.05"
                          value={value as number}
                          onChange={(e) => handleParameterChange(
                            `typeSpecificParameters.${paramName}`, 
                            parseFloat(e.target.value)
                          )}
                        />
                        <span>{typeof value === 'number' ? formatPercent(value) : value}</span>
                      </div>
                    </TableCell>
                    <TableCell>Pattern-specific parameter</TableCell>
                  </TableRow>
                ))}
              </tbody>
            </ParameterTable>
          </>
        )}
      </PatternTypeSection>
    </DashboardContainer>
  );
};

export default LearningDashboard;
