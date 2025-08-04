// src/components/Reports/ReportWizard.tsx
// Enhanced 4-step report generation wizard with AI recommendations
// Context: Mission control for creating professional investment reports

import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { 
  FileText, Settings, Database, BarChart3, 
  ChevronRight, ChevronLeft, Sparkles, AlertCircle,
  TrendingUp, Shield, Clock, Target, Eye
} from 'lucide-react';
import { useAutomatedReportGeneration } from '../../hooks/useAutomatedReportGeneration';
import { getStorageService } from '../../services/reportStorageService';
import { reportApiService } from '../../services/reportApiService';
import { logDebug, logError } from '../../utils/logger';

const WizardContainer = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  flex-direction: column;
  background: #ffffff;
`;

const ProgressBar = styled.div`
  height: 4px;
  background: #e5e7eb;
  position: relative;
  overflow: hidden;
`;

const ProgressFill = styled.div<{ $progress: number }>`
  height: 100%;
  width: ${props => props.$progress}%;
  background: linear-gradient(90deg, #3b82f6 0%, #10b981 100%);
  transition: width 0.3s ease;
`;

const StepIndicator = styled.div`
  display: flex;
  padding: 1.5rem;
  border-bottom: 1px solid #e5e7eb;
`;

const Step = styled.div<{ $active?: boolean; $completed?: boolean }>`
  flex: 1;
  display: flex;
  align-items: center;
  gap: 0.75rem;
  position: relative;
  
  &:not(:last-child)::after {
    content: '';
    position: absolute;
    right: -50%;
    width: 100%;
    height: 1px;
    background: ${props => props.$completed ? '#10b981' : '#e5e7eb'};
    top: 50%;
  }
`;

const StepIcon = styled.div<{ $active?: boolean; $completed?: boolean }>`
  width: 40px;
  height: 40px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: ${props => props.$completed ? '#10b981' : props.$active ? '#3b82f6' : '#f3f4f6'};
  color: ${props => props.$completed || props.$active ? 'white' : '#9ca3af'};
  z-index: 1;
  position: relative;
  
  svg {
    width: 20px;
    height: 20px;
  }
`;

const StepLabel = styled.div<{ $active?: boolean }>`
  font-size: 0.875rem;
  font-weight: ${props => props.$active ? '600' : '400'};
  color: ${props => props.$active ? '#1f2937' : '#6b7280'};
`;

const ContentArea = styled.div`
  flex: 1;
  padding: 2rem;
  overflow-y: auto;
  min-height: 0;
  margin-top: 72px; /* Reserve space for ActionBar */
`;

const StepTitle = styled.h2`
  font-size: 1.5rem;
  font-weight: 700;
  color: #1f2937;
  margin-bottom: 0.5rem;
`;

const StepDescription = styled.p`
  font-size: 0.875rem;
  color: #6b7280;
  margin-bottom: 2rem;
`;

const AIRecommendation = styled.div`
  background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%);
  border: 1px solid #bae6fd;
  border-radius: 0.5rem;
  padding: 1rem;
  margin-bottom: 2rem;
  display: flex;
  gap: 1rem;
`;

const AIIcon = styled.div`
  width: 32px;
  height: 32px;
  background: #3b82f6;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  
  svg {
    width: 16px;
    height: 16px;
    color: white;
  }
`;

const AIContent = styled.div`
  flex: 1;
`;

const AITitle = styled.h4`
  font-size: 0.875rem;
  font-weight: 600;
  color: #1e40af;
  margin-bottom: 0.25rem;
`;

const AIText = styled.p`
  font-size: 0.75rem;
  color: #3730a3;
  line-height: 1.5;
`;

const TemplateGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 1rem;
  margin-bottom: 2rem;
`;

const TemplateCard = styled.div<{ $selected?: boolean }>`
  padding: 1.5rem;
  border: 2px solid ${props => props.$selected ? '#3b82f6' : '#e5e7eb'};
  border-radius: 0.5rem;
  cursor: pointer;
  transition: all 0.2s;
  background: ${props => props.$selected ? '#eff6ff' : 'white'};
  position: relative;
  
  &:hover {
    border-color: #3b82f6;
    transform: translateY(-2px);
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
  }
  
  ${props => props.$selected && `
    &::after {
      content: '✓';
      position: absolute;
      top: 0.75rem;
      right: 0.75rem;
      width: 24px;
      height: 24px;
      background: #3b82f6;
      color: white;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: bold;
    }
  `}
`;

const TemplateIcon = styled.div<{ $color: string }>`
  width: 48px;
  height: 48px;
  background: ${props => props.$color}22;
  border-radius: 0.375rem;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 1rem;
  
  svg {
    width: 24px;
    height: 24px;
    color: ${props => props.$color};
  }
`;

const TemplateName = styled.h4`
  font-size: 0.875rem;
  font-weight: 600;
  color: #1f2937;
  margin-bottom: 0.25rem;
`;

const TemplateDesc = styled.p`
  font-size: 0.75rem;
  color: #6b7280;
`;

const FormSection = styled.div`
  margin-bottom: 2rem;
`;

const FormGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1rem;
`;

const FormGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
`;

const Label = styled.label`
  font-size: 0.875rem;
  font-weight: 500;
  color: #374151;
`;

const Input = styled.input`
  padding: 0.625rem;
  border: 1px solid #d1d5db;
  border-radius: 0.375rem;
  font-size: 0.875rem;
  transition: all 0.2s;
  
  &:focus {
    outline: none;
    border-color: #3b82f6;
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
  }
`;

const Select = styled.select`
  padding: 0.625rem;
  border: 1px solid #d1d5db;
  border-radius: 0.375rem;
  font-size: 0.875rem;
  background: white;
  transition: all 0.2s;
  
  &:focus {
    outline: none;
    border-color: #3b82f6;
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
  }
`;

const DataSourceList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
`;

const DataSourceItem = styled.label`
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 1rem;
  border: 1px solid #e5e7eb;
  border-radius: 0.375rem;
  cursor: pointer;
  transition: all 0.2s;
  
  &:hover {
    background: #f9fafb;
  }
  
  input[type="checkbox"] {
    width: 20px;
    height: 20px;
  }
`;

const DataSourceInfo = styled.div`
  flex: 1;
`;

const DataSourceName = styled.div`
  font-size: 0.875rem;
  font-weight: 500;
  color: #1f2937;
`;

const DataSourceDesc = styled.div`
  font-size: 0.75rem;
  color: #6b7280;
`;

const ConfigurationPanel = styled.div`
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 2rem;
`;

const ConfigSection = styled.div`
  padding: 1.5rem;
  border: 1px solid #e5e7eb;
  border-radius: 0.5rem;
`;

const ConfigTitle = styled.h3`
  font-size: 1rem;
  font-weight: 600;
  color: #1f2937;
  margin-bottom: 1rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  
  svg {
    width: 20px;
    height: 20px;
    color: #6b7280;
  }
`;

const ToggleGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
`;

const Toggle = styled.label`
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 0.875rem;
  color: #374151;
  cursor: pointer;
`;

const ToggleSwitch = styled.input.attrs({ type: 'checkbox' })`
  width: 40px;
  height: 20px;
  appearance: none;
  background: #e5e7eb;
  border-radius: 10px;
  position: relative;
  cursor: pointer;
  transition: all 0.2s;
  
  &:checked {
    background: #10b981;
  }
  
  &::after {
    content: '';
    position: absolute;
    width: 16px;
    height: 16px;
    background: white;
    border-radius: 50%;
    top: 2px;
    left: ${props => props.checked ? '22px' : '2px'};
    transition: left 0.2s;
  }
`;

const ActionBar = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5rem 2rem;
  border-bottom: 1px solid #e5e7eb;
  background: #f9fafb;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
  min-height: 72px;
  z-index: 10;
`;

const ActionButtons = styled.div`
  display: flex;
  gap: 0.75rem;
`;

const Button = styled.button<{ $variant?: 'primary' | 'secondary' | 'ghost' }>`
  padding: 0.625rem 1.25rem;
  border-radius: 0.375rem;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  
  ${props => {
    switch (props.$variant) {
      case 'primary':
        return `
          background: #3b82f6;
          color: white;
          border: none;
          
          &:hover {
            background: #2563eb;
          }
          
          &:disabled {
            background: #9ca3af;
            cursor: not-allowed;
          }
        `;
      case 'ghost':
        return `
          background: transparent;
          color: #6b7280;
          border: none;
          
          &:hover {
            background: #f3f4f6;
            color: #374151;
          }
        `;
      default:
        return `
          background: white;
          color: #374151;
          border: 1px solid #d1d5db;
          
          &:hover {
            background: #f9fafb;
          }
        `;
    }
  }}
  
  svg {
    width: 16px;
    height: 16px;
  }
`;

const StatusText = styled.div`
  font-size: 0.875rem;
  color: #6b7280;
`;

// Step data
const steps = [
  { id: 'template', label: 'Template', icon: FileText },
  { id: 'details', label: 'Details', icon: Settings },
  { id: 'data', label: 'Data', icon: Database },
  { id: 'config', label: 'Configure', icon: BarChart3 }
];

const templates = [
  {
    id: 'equity-research',
    name: 'Equity Research',
    description: 'Comprehensive stock analysis',
    icon: TrendingUp,
    color: '#10b981'
  },
  {
    id: 'technical-analysis',
    name: 'Technical Analysis',
    description: 'Chart patterns & indicators',
    icon: BarChart3,
    color: '#3b82f6'
  },
  {
    id: 'risk-assessment',
    name: 'Risk Assessment',
    description: 'Portfolio risk analysis',
    icon: Shield,
    color: '#ef4444'
  },
  {
    id: 'quick-take',
    name: 'Quick Take',
    description: '1-page executive summary',
    icon: Clock,
    color: '#f59e0b'
  }
];

interface ReportWizardProps {
  currentReport?: any;
  onReportChange?: (report: any) => void;
  onViewReport?: (report: any) => void;
}

export const ReportWizard: React.FC<ReportWizardProps> = ({ 
  currentReport,
  onReportChange,
  onViewReport
}) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [reportConfig, setReportConfig] = useState({
    template: '',
    title: '',
    ticker: '',
    author: '',
    timeframe: '1Y',
    dataSources: ['market-data', 'financials'],
    sections: {
      executiveSummary: true,
      financialAnalysis: true,
      technicalAnalysis: true,
      riskAssessment: true,
      aiInsights: true
    },
    visualizations: {
      priceChart: true,
      volumeAnalysis: true,
      patternDetection: true,
      performanceMetrics: true
    }
  });

  const { generateReport, status } = useAutomatedReportGeneration();

  const progress = ((currentStep + 1) / steps.length) * 100;
  
  // Debug state changes
  useEffect(() => {
    console.log('[ReportWizard] State updated:', {
      currentStep,
      template: reportConfig.template,
      title: reportConfig.title,
      ticker: reportConfig.ticker
    });
  }, [currentStep, reportConfig]);

  const handleNext = () => {
    console.log('[ReportWizard] Next clicked, currentStep:', currentStep);
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleGenerateReport();
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleGenerateReport = async () => {
    logDebug('ReportWizard', 'Generate Report clicked with config:', reportConfig);
    
    try {
      // Show loading state
      setCurrentStep(-1); // Use -1 to indicate loading
      
      const config = {
        ticker: reportConfig.ticker,
        reportType: reportConfig.template,
        sections: Object.keys(reportConfig.sections)
          .filter(key => reportConfig.sections[key as keyof typeof reportConfig.sections])
          .map(key => key.replace(/([A-Z])/g, '-$1').toLowerCase()),
        timeframe: reportConfig.timeframe,
        format: 'pdf',
        template: reportConfig.template,
        title: reportConfig.title,
        author: reportConfig.author,
        dataSources: reportConfig.dataSources,
        visualizations: reportConfig.visualizations,
        outputFormat: 'pdf' as const
      };
      
      logDebug('ReportWizard', 'Calling reportApiService.generateReport with:', config);
      
      // Use the new API service for serverless compatibility
      const result = await reportApiService.generateReport(config);
      
      logDebug('ReportWizard', 'Report generated successfully:', result);
      
      // The report is already saved on the server side by generateReport
      // We just need to format it for the UI
      const completeReport = {
        id: result.generationId || result.reportId || `report-${Date.now()}`,
        ticker: reportConfig.ticker,
        title: reportConfig.title,
        template: reportConfig.template,
        author: reportConfig.author,
        createdAt: new Date(),
        status: 'completed',
        outputFormat: result.downloadInfo?.format || result.format || 'pdf',
        fileSize: result.fileSize || 0,
        downloadUrl: result.downloadInfo?.filename || result.downloadUrl,
        reportData: result,
        slides: result.slides || [],
        metadata: result.metadata || {},
        companyData: result.companyData || {},
        tags: [],
        ...reportConfig
      };
      
      // Update parent with the complete report
      if (onReportChange) {
        onReportChange(completeReport);
      }
      
      // Dispatch event to notify other components about the new report
      window.dispatchEvent(new CustomEvent('reportGenerated', {
        detail: { report: completeReport }
      }));
      
      // Instead of just showing alert, transition to a success state
      setCurrentStep(steps.length); // Move beyond last step to show completion
      
    } catch (error) {
      logError('ReportWizard', 'Failed to generate report:', error);
      alert(`Report generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      // Reset to last step
      setCurrentStep(steps.length - 1);
    }
  };

  const renderStepContent = () => {
    // Loading state
    if (currentStep === -1) {
      return (
        <>
          <StepTitle>Generating Report...</StepTitle>
          <StepDescription>
            Please wait while we create your {reportConfig.template} report for {reportConfig.ticker}
          </StepDescription>
          
          <AIRecommendation>
            <AIIcon><Sparkles /></AIIcon>
            <AIContent>
              <AITitle>Processing</AITitle>
              <AIText>
                {status?.currentTask || 'Initializing report generation...'}
              </AIText>
            </AIContent>
          </AIRecommendation>
        </>
      );
    }
    
    // Completion state - show report summary
    if (currentStep === steps.length) {
      return (
        <>
          <StepTitle>Report Generated Successfully!</StepTitle>
          <StepDescription>
            Your {reportConfig.template} report for {reportConfig.ticker} has been created.
          </StepDescription>
          
          <FormSection>
            <h3>Report Summary</h3>
            <ul>
              <li>Total slides: {currentReport?.slides?.length || 0}</li>
              <li>Generated: {currentReport?.completedAt ? new Date(currentReport.completedAt).toLocaleString() : 'Just now'}</li>
              <li>Template: {reportConfig.template}</li>
              <li>Ticker: {reportConfig.ticker}</li>
            </ul>
            
            {currentReport?.slides && currentReport.slides.length > 0 && (
              <>
                <h4>Report Contents:</h4>
                <ol>
                  {currentReport.slides.map((slide: any, index: number) => (
                    <li key={index}>{slide.title || `Slide ${index + 1}`}</li>
                  ))}
                </ol>
              </>
            )}
          </FormSection>
          
          <AIRecommendation>
            <AIIcon><Eye /></AIIcon>
            <AIContent>
              <AITitle>Next Steps</AITitle>
              <AIText>
                Your report is now available in the Reports tab. You can view, edit, or export it from there.
              </AIText>
            </AIContent>
          </AIRecommendation>
        </>
      );
    }
    
    console.log('[ReportWizard] Rendering step:', steps[currentStep].id, 'Selected template:', reportConfig.template);
    switch (steps[currentStep].id) {
      case 'template':
        return (
          <>
            <StepTitle>Choose Report Template</StepTitle>
            <StepDescription>
              Select a template that best fits your analysis needs
            </StepDescription>
            
            <AIRecommendation>
              <AIIcon><Sparkles /></AIIcon>
              <AIContent>
                <AITitle>AI Recommendation</AITitle>
                <AIText>
                  Based on your recent activity, we recommend the "Equity Research" template. 
                  It includes comprehensive financial analysis and pattern detection that aligns 
                  with your typical workflow.
                </AIText>
              </AIContent>
            </AIRecommendation>

            <TemplateGrid>
              {templates.map(template => {
                const Icon = template.icon;
                return (
                  <TemplateCard
                    key={template.id}
                    $selected={reportConfig.template === template.id}
                    onClick={() => {
                      console.log('[ReportWizard] Template selected:', template.id);
                      setReportConfig({ ...reportConfig, template: template.id });
                    }}
                  >
                    <TemplateIcon $color={template.color}>
                      <Icon />
                    </TemplateIcon>
                    <TemplateName>{template.name}</TemplateName>
                    <TemplateDesc>{template.description}</TemplateDesc>
                  </TemplateCard>
                );
              })}
            </TemplateGrid>
          </>
        );

      case 'details':
        return (
          <>
            <StepTitle>Report Details</StepTitle>
            <StepDescription>
              Provide basic information about your report
            </StepDescription>

            <FormSection>
              <FormGrid>
                <FormGroup>
                  <Label>Report Title</Label>
                  <Input
                    value={reportConfig.title}
                    onChange={(e) => setReportConfig({ ...reportConfig, title: e.target.value })}
                    placeholder="e.g., Apple Inc. Q4 2024 Analysis"
                  />
                </FormGroup>
                <FormGroup>
                  <Label>Ticker Symbol</Label>
                  <Input
                    value={reportConfig.ticker}
                    onChange={(e) => setReportConfig({ ...reportConfig, ticker: e.target.value.toUpperCase() })}
                    placeholder="e.g., AAPL"
                  />
                </FormGroup>
                <FormGroup>
                  <Label>Author Name</Label>
                  <Input
                    value={reportConfig.author}
                    onChange={(e) => setReportConfig({ ...reportConfig, author: e.target.value })}
                    placeholder="Your name"
                  />
                </FormGroup>
                <FormGroup>
                  <Label>Time Period</Label>
                  <Select
                    value={reportConfig.timeframe}
                    onChange={(e) => setReportConfig({ ...reportConfig, timeframe: e.target.value })}
                  >
                    <option value="1M">1 Month</option>
                    <option value="3M">3 Months</option>
                    <option value="6M">6 Months</option>
                    <option value="1Y">1 Year</option>
                    <option value="3Y">3 Years</option>
                    <option value="5Y">5 Years</option>
                  </Select>
                </FormGroup>
              </FormGrid>
            </FormSection>
          </>
        );

      case 'data':
        return (
          <>
            <StepTitle>Select Data Sources</StepTitle>
            <StepDescription>
              Choose which data to include in your analysis
            </StepDescription>

            <AIRecommendation>
              <AIIcon><AlertCircle /></AIIcon>
              <AIContent>
                <AITitle>Data Quality Alert</AITitle>
                <AIText>
                  Financial statements data was last updated 2 days ago. 
                  We recommend refreshing before generating the report for the most accurate analysis.
                </AIText>
              </AIContent>
            </AIRecommendation>

            <DataSourceList>
              <DataSourceItem>
                <input
                  type="checkbox"
                  checked={reportConfig.dataSources.includes('market-data')}
                  onChange={(e) => {
                    const sources = e.target.checked 
                      ? [...reportConfig.dataSources, 'market-data']
                      : reportConfig.dataSources.filter(s => s !== 'market-data');
                    setReportConfig({ ...reportConfig, dataSources: sources });
                  }}
                />
                <DataSourceInfo>
                  <DataSourceName>Market Data</DataSourceName>
                  <DataSourceDesc>Real-time prices, volume, and technical indicators</DataSourceDesc>
                </DataSourceInfo>
              </DataSourceItem>

              <DataSourceItem>
                <input
                  type="checkbox"
                  checked={reportConfig.dataSources.includes('financials')}
                  onChange={(e) => {
                    const sources = e.target.checked 
                      ? [...reportConfig.dataSources, 'financials']
                      : reportConfig.dataSources.filter(s => s !== 'financials');
                    setReportConfig({ ...reportConfig, dataSources: sources });
                  }}
                />
                <DataSourceInfo>
                  <DataSourceName>Financial Statements</DataSourceName>
                  <DataSourceDesc>Income statements, balance sheets, cash flow</DataSourceDesc>
                </DataSourceInfo>
              </DataSourceItem>

              <DataSourceItem>
                <input
                  type="checkbox"
                  checked={reportConfig.dataSources.includes('patterns')}
                  onChange={(e) => {
                    const sources = e.target.checked 
                      ? [...reportConfig.dataSources, 'patterns']
                      : reportConfig.dataSources.filter(s => s !== 'patterns');
                    setReportConfig({ ...reportConfig, dataSources: sources });
                  }}
                />
                <DataSourceInfo>
                  <DataSourceName>Pattern Analysis</DataSourceName>
                  <DataSourceDesc>AI-detected chart patterns and signals</DataSourceDesc>
                </DataSourceInfo>
              </DataSourceItem>

              <DataSourceItem>
                <input
                  type="checkbox"
                  checked={reportConfig.dataSources.includes('news')}
                  onChange={(e) => {
                    const sources = e.target.checked 
                      ? [...reportConfig.dataSources, 'news']
                      : reportConfig.dataSources.filter(s => s !== 'news');
                    setReportConfig({ ...reportConfig, dataSources: sources });
                  }}
                />
                <DataSourceInfo>
                  <DataSourceName>News & Sentiment</DataSourceName>
                  <DataSourceDesc>Recent news and social sentiment analysis</DataSourceDesc>
                </DataSourceInfo>
              </DataSourceItem>
            </DataSourceList>
          </>
        );

      case 'config':
        return (
          <>
            <StepTitle>Configure Report</StepTitle>
            <StepDescription>
              Customize sections and visualizations to include
            </StepDescription>

            <ConfigurationPanel>
              <ConfigSection>
                <ConfigTitle>
                  <FileText />
                  Report Sections
                </ConfigTitle>
                <ToggleGroup>
                  <Toggle>
                    Executive Summary
                    <ToggleSwitch
                      checked={reportConfig.sections.executiveSummary}
                      onChange={(e) => setReportConfig({
                        ...reportConfig,
                        sections: { ...reportConfig.sections, executiveSummary: e.target.checked }
                      })}
                    />
                  </Toggle>
                  <Toggle>
                    Financial Analysis
                    <ToggleSwitch
                      checked={reportConfig.sections.financialAnalysis}
                      onChange={(e) => setReportConfig({
                        ...reportConfig,
                        sections: { ...reportConfig.sections, financialAnalysis: e.target.checked }
                      })}
                    />
                  </Toggle>
                  <Toggle>
                    Technical Analysis
                    <ToggleSwitch
                      checked={reportConfig.sections.technicalAnalysis}
                      onChange={(e) => setReportConfig({
                        ...reportConfig,
                        sections: { ...reportConfig.sections, technicalAnalysis: e.target.checked }
                      })}
                    />
                  </Toggle>
                  <Toggle>
                    Risk Assessment
                    <ToggleSwitch
                      checked={reportConfig.sections.riskAssessment}
                      onChange={(e) => setReportConfig({
                        ...reportConfig,
                        sections: { ...reportConfig.sections, riskAssessment: e.target.checked }
                      })}
                    />
                  </Toggle>
                  <Toggle>
                    AI Insights
                    <ToggleSwitch
                      checked={reportConfig.sections.aiInsights}
                      onChange={(e) => setReportConfig({
                        ...reportConfig,
                        sections: { ...reportConfig.sections, aiInsights: e.target.checked }
                      })}
                    />
                  </Toggle>
                </ToggleGroup>
              </ConfigSection>

              <ConfigSection>
                <ConfigTitle>
                  <BarChart3 />
                  Visualizations
                </ConfigTitle>
                <ToggleGroup>
                  <Toggle>
                    Price Chart
                    <ToggleSwitch
                      checked={reportConfig.visualizations.priceChart}
                      onChange={(e) => setReportConfig({
                        ...reportConfig,
                        visualizations: { ...reportConfig.visualizations, priceChart: e.target.checked }
                      })}
                    />
                  </Toggle>
                  <Toggle>
                    Volume Analysis
                    <ToggleSwitch
                      checked={reportConfig.visualizations.volumeAnalysis}
                      onChange={(e) => setReportConfig({
                        ...reportConfig,
                        visualizations: { ...reportConfig.visualizations, volumeAnalysis: e.target.checked }
                      })}
                    />
                  </Toggle>
                  <Toggle>
                    Pattern Detection
                    <ToggleSwitch
                      checked={reportConfig.visualizations.patternDetection}
                      onChange={(e) => setReportConfig({
                        ...reportConfig,
                        visualizations: { ...reportConfig.visualizations, patternDetection: e.target.checked }
                      })}
                    />
                  </Toggle>
                  <Toggle>
                    Performance Metrics
                    <ToggleSwitch
                      checked={reportConfig.visualizations.performanceMetrics}
                      onChange={(e) => setReportConfig({
                        ...reportConfig,
                        visualizations: { ...reportConfig.visualizations, performanceMetrics: e.target.checked }
                      })}
                    />
                  </Toggle>
                </ToggleGroup>
              </ConfigSection>
            </ConfigurationPanel>
          </>
        );
    }
  };

  const isValid = () => {
    switch (steps[currentStep].id) {
      case 'template':
        return reportConfig.template !== '';
      case 'details':
        return reportConfig.title !== '' && reportConfig.ticker !== '';
      case 'data':
        return reportConfig.dataSources.length > 0;
      case 'config':
        return Object.values(reportConfig.sections).some(v => v) || 
               Object.values(reportConfig.visualizations).some(v => v);
      default:
        return true;
    }
  };

  return (
    <WizardContainer>
      <ProgressBar>
        <ProgressFill $progress={progress} />
      </ProgressBar>

      <StepIndicator>
        {steps.map((step, index) => {
          const Icon = step.icon;
          return (
            <Step
              key={step.id}
              $active={index === currentStep}
              $completed={index < currentStep}
            >
              <StepIcon
                $active={index === currentStep}
                $completed={index < currentStep}
              >
                <Icon />
              </StepIcon>
              <StepLabel $active={index === currentStep}>
                {step.label}
              </StepLabel>
            </Step>
          );
        })}
      </StepIndicator>

      <ContentArea>
        {renderStepContent()}
      </ContentArea>

      <ActionBar>
        <StatusText>
          {currentStep === -1 
            ? (status?.currentTask || 'Generating report...') 
            : currentStep === steps.length
            ? 'Report completed successfully'
            : (status?.currentStep || `Step ${currentStep + 1} of ${steps.length}`)
          }
        </StatusText>
        
        <ActionButtons>
          {currentStep === -1 ? (
            <Button $variant="ghost" disabled>
              Generating...
            </Button>
          ) : currentStep === steps.length ? (
            <>
              <Button $variant="ghost" onClick={() => setCurrentStep(0)}>
                Create New Report
              </Button>
              <Button 
                $variant="primary" 
                onClick={() => {
                  if (onViewReport && currentReport) {
                    // Ensure report has correct status for preview
                    const reportForPreview = {
                      ...currentReport,
                      status: 'completed'
                    };
                    onViewReport(reportForPreview);
                  } else {
                    // Fallback: emit event to switch tabs
                    const reportForPreview = {
                      ...currentReport,
                      status: 'completed'
                    };
                    window.dispatchEvent(new CustomEvent('viewReport', {
                      detail: { report: reportForPreview }
                    }));
                  }
                }}
              >
                <Eye />
                View in Reports Tab
              </Button>
            </>
          ) : (
            <>
              {currentStep > 0 && (
                <Button $variant="ghost" onClick={handleBack}>
                  <ChevronLeft />
                  Back
                </Button>
              )}
              
              <Button
                $variant="primary"
                onClick={handleNext}
                disabled={!isValid()}
              >
                {currentStep === steps.length - 1 ? 'Generate Report' : 'Next'}
                <ChevronRight />
              </Button>
            </>
          )}
        </ActionButtons>
      </ActionBar>
    </WizardContainer>
  );
};