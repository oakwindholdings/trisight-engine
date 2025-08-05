// src/components/Reports/EnhancedReportWizard.tsx
// Enhanced report wizard with superior AI capabilities
// Context: Provides enhanced report generation UI with advanced features

import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { 
  Zap, 
  Brain, 
  TrendingUp, 
  Shield, 
  Download,
  CheckCircle,
  AlertCircle,
  Loader,
  Star,
  Sparkles
} from 'lucide-react';
import { useEnhancedReportGeneration } from '../../hooks/useEnhancedReportGeneration';
import { logDebug } from '../../utils/debug';

const WizardContainer = styled.div`
  display: flex;
  flex-direction: column;
  height: 100%;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 12px;
  overflow: hidden;
`;

const WizardHeader = styled.div`
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  padding: 1.5rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.2);
`;

const WizardTitle = styled.h2`
  color: white;
  margin: 0;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 1.5rem;
  font-weight: 600;
`;

const EnhancedBadge = styled.div`
  background: linear-gradient(45deg, #ffd700, #ffed4e);
  color: #1a1a1a;
  padding: 0.25rem 0.75rem;
  border-radius: 20px;
  font-size: 0.75rem;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 0.25rem;
`;

const WizardContent = styled.div`
  flex: 1;
  padding: 2rem;
  color: white;
`;

const FeatureGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1rem;
  margin-bottom: 2rem;
`;

const FeatureCard = styled.div`
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 8px;
  padding: 1.5rem;
  transition: all 0.3s ease;

  &:hover {
    background: rgba(255, 255, 255, 0.15);
    transform: translateY(-2px);
  }
`;

const FeatureIcon = styled.div`
  width: 48px;
  height: 48px;
  background: linear-gradient(45deg, #ffd700, #ffed4e);
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 1rem;
  color: #1a1a1a;
`;

const FeatureTitle = styled.h3`
  margin: 0 0 0.5rem 0;
  font-size: 1.1rem;
  font-weight: 600;
`;

const FeatureDescription = styled.p`
  margin: 0;
  font-size: 0.9rem;
  opacity: 0.9;
  line-height: 1.4;
`;

const FormSection = styled.div`
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 8px;
  padding: 1.5rem;
  margin-bottom: 1.5rem;
`;

const FormRow = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
  margin-bottom: 1rem;
`;

const FormGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
`;

const Label = styled.label`
  font-size: 0.9rem;
  font-weight: 500;
  color: rgba(255, 255, 255, 0.9);
`;

const Input = styled.input`
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.3);
  border-radius: 6px;
  padding: 0.75rem;
  color: white;
  font-size: 0.9rem;

  &::placeholder {
    color: rgba(255, 255, 255, 0.6);
  }

  &:focus {
    outline: none;
    border-color: #ffd700;
    box-shadow: 0 0 0 2px rgba(255, 215, 0, 0.2);
  }
`;

const Select = styled.select`
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.3);
  border-radius: 6px;
  padding: 0.75rem;
  color: white;
  font-size: 0.9rem;

  option {
    background: #1a1a1a;
    color: white;
  }

  &:focus {
    outline: none;
    border-color: #ffd700;
    box-shadow: 0 0 0 2px rgba(255, 215, 0, 0.2);
  }
`;

const GenerateButton = styled.button`
  background: linear-gradient(45deg, #ffd700, #ffed4e);
  color: #1a1a1a;
  border: none;
  border-radius: 8px;
  padding: 1rem 2rem;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  width: 100%;
  justify-content: center;

  &:hover:not(:disabled) {
    transform: translateY(-2px);
    box-shadow: 0 8px 25px rgba(255, 215, 0, 0.3);
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`;

const ProgressSection = styled.div`
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 8px;
  padding: 1.5rem;
  margin-bottom: 1.5rem;
`;

const ProgressBar = styled.div`
  background: rgba(255, 255, 255, 0.2);
  border-radius: 10px;
  height: 8px;
  margin: 1rem 0;
  overflow: hidden;
`;

const ProgressFill = styled.div<{ progress: number }>`
  background: linear-gradient(45deg, #ffd700, #ffed4e);
  height: 100%;
  width: ${props => props.progress}%;
  transition: width 0.3s ease;
`;

const StatusText = styled.div`
  font-size: 0.9rem;
  opacity: 0.9;
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

interface EnhancedReportWizardProps {
  currentReport?: any;
  onReportChange?: (report: any) => void;
  onViewReport?: (report: any) => void;
}

export const EnhancedReportWizard: React.FC<EnhancedReportWizardProps> = ({
  currentReport,
  onReportChange,
  onViewReport
}) => {
  const [formData, setFormData] = useState({
    ticker: '',
    title: '',
    author: 'TriSight Enhanced Analytics',
    template: 'comprehensive',
    timeframe: '1Y',
    outputFormat: 'pdf'
  });

  const {
    status,
    result,
    generateEnhancedReport,
    isEnhanced,
    isGenerating,
    hasError,
    hasResult,
    progress,
    enhancedFeatures
  } = useEnhancedReportGeneration();

  useEffect(() => {
    logDebug('EnhancedReportWizard', 'Enhanced features available:', enhancedFeatures);
  }, [enhancedFeatures]);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleGenerate = async () => {
    if (!formData.ticker) {
      alert('Please enter a ticker symbol');
      return;
    }

    try {
      const request = {
        ticker: formData.ticker.toUpperCase(),
        template: formData.template,
        title: formData.title || `${formData.ticker.toUpperCase()} Enhanced Analysis`,
        author: formData.author,
        outputFormat: formData.outputFormat as 'pdf' | 'pptx',
        timeframe: formData.timeframe,
        dataSources: ['market-data', 'financials', 'news', 'web-intelligence'],
        sections: ['executive-summary', 'market-analysis', 'ai-insights', 'risk-assessment', 'recommendations']
      };

      const report = await generateEnhancedReport(request);

      // Create UI-compatible report object
      const completeReport = {
        id: report.reportId,
        ticker: formData.ticker.toUpperCase(),
        title: formData.title,
        template: formData.template,
        author: formData.author,
        createdAt: new Date(),
        status: 'completed',
        outputFormat: report.format || formData.outputFormat,
        fileSize: report.fileSize || 0,
        downloadUrl: result.downloadUrl,
        reportData: report,
        slides: report.slides || [],
        metadata: report.metadata || {},
        companyData: report.companyData || {},
        enhanced: true,
        dataQuality: report.metadata?.dataQuality || 0,
        confidence: report.metadata?.confidence || 0
      };

      if (onReportChange) {
        onReportChange(completeReport);
      }

      if (onViewReport) {
        onViewReport(completeReport);
      }

    } catch (error) {
      console.error('Enhanced report generation failed:', error);
    }
  };

  const enhancedFeaturesData = [
    {
      icon: Brain,
      title: 'Claude Opus 4 Max',
      description: 'Advanced AI reasoning with thinking capabilities for superior analysis'
    },
    {
      icon: TrendingUp,
      title: 'TwelveData Ultra',
      description: 'Real-time market data with extended history and advanced technicals'
    },
    {
      icon: Sparkles,
      title: 'Web Intelligence',
      description: 'Comprehensive news analysis and company profiling via Firecrawl'
    },
    {
      icon: Shield,
      title: 'Risk Assessment',
      description: 'Multi-dimensional risk analysis with AI-powered insights'
    }
  ];

  return (
    <WizardContainer>
      <WizardHeader>
        <WizardTitle>
          <Zap />
          Enhanced Report Generator
          <EnhancedBadge>
            <Star size={12} />
            PREMIUM
          </EnhancedBadge>
        </WizardTitle>
      </WizardHeader>

      <WizardContent>
        {!isGenerating && !hasResult && (
          <>
            <FeatureGrid>
              {enhancedFeaturesData.map((feature, index) => (
                <FeatureCard key={index}>
                  <FeatureIcon>
                    <feature.icon size={24} />
                  </FeatureIcon>
                  <FeatureTitle>{feature.title}</FeatureTitle>
                  <FeatureDescription>{feature.description}</FeatureDescription>
                </FeatureCard>
              ))}
            </FeatureGrid>

            <FormSection>
              <FormRow>
                <FormGroup>
                  <Label>Ticker Symbol *</Label>
                  <Input
                    type="text"
                    placeholder="e.g., AAPL"
                    value={formData.ticker}
                    onChange={(e) => handleInputChange('ticker', e.target.value)}
                  />
                </FormGroup>
                <FormGroup>
                  <Label>Report Template</Label>
                  <Select
                    value={formData.template}
                    onChange={(e) => handleInputChange('template', e.target.value)}
                  >
                    <option value="comprehensive">Comprehensive Analysis</option>
                    <option value="technical">Technical Analysis</option>
                    <option value="fundamental">Fundamental Analysis</option>
                    <option value="risk">Risk Assessment</option>
                  </Select>
                </FormGroup>
              </FormRow>

              <FormRow>
                <FormGroup>
                  <Label>Report Title</Label>
                  <Input
                    type="text"
                    placeholder="Auto-generated if empty"
                    value={formData.title}
                    onChange={(e) => handleInputChange('title', e.target.value)}
                  />
                </FormGroup>
                <FormGroup>
                  <Label>Timeframe</Label>
                  <Select
                    value={formData.timeframe}
                    onChange={(e) => handleInputChange('timeframe', e.target.value)}
                  >
                    <option value="1M">1 Month</option>
                    <option value="3M">3 Months</option>
                    <option value="6M">6 Months</option>
                    <option value="1Y">1 Year</option>
                    <option value="2Y">2 Years</option>
                  </Select>
                </FormGroup>
              </FormRow>

              <FormRow>
                <FormGroup>
                  <Label>Output Format</Label>
                  <Select
                    value={formData.outputFormat}
                    onChange={(e) => handleInputChange('outputFormat', e.target.value)}
                  >
                    <option value="pdf">PDF Report</option>
                    <option value="pptx">PowerPoint Presentation</option>
                  </Select>
                </FormGroup>
              </FormRow>
            </FormSection>

            <GenerateButton
              onClick={handleGenerate}
              disabled={!formData.ticker || isGenerating}
            >
              <Sparkles size={20} />
              Generate Enhanced Report
            </GenerateButton>
          </>
        )}

        {isGenerating && (
          <ProgressSection>
            <StatusText>
              <Loader className="animate-spin" size={16} />
              {status.currentTask}
            </StatusText>
            <ProgressBar>
              <ProgressFill progress={progress} />
            </ProgressBar>
            <div style={{ fontSize: '0.8rem', opacity: 0.8 }}>
              {progress}% complete • Enhanced AI processing in progress
            </div>
          </ProgressSection>
        )}

        {hasError && (
          <ProgressSection>
            <StatusText>
              <AlertCircle size={16} />
              {status.error}
            </StatusText>
          </ProgressSection>
        )}

        {hasResult && (
          <ProgressSection>
            <StatusText>
              <CheckCircle size={16} />
              Enhanced report generated successfully!
            </StatusText>
            {result.downloadUrl && (
              <GenerateButton
                as="a"
                href={result.downloadUrl}
                download
                style={{ marginTop: '1rem' }}
              >
                <Download size={20} />
                Download Enhanced Report
              </GenerateButton>
            )}
          </ProgressSection>
        )}
      </WizardContent>
    </WizardContainer>
  );
};

export default EnhancedReportWizard;
