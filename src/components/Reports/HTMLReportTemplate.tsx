// src/components/Reports/HTMLReportTemplate.tsx
// HTML-based report template for reliable PDF generation via html2canvas + jsPDF
// This avoids React-PDF reconciler issues entirely

import React from 'react';
import styled from 'styled-components';

const ReportContainer = styled.div`
  width: 210mm;
  min-height: 297mm;
  padding: 20mm;
  background: white;
  font-family: 'Inter', Arial, sans-serif;
  color: #1a1a1a;
  line-height: 1.6;
  box-sizing: border-box;
`;

const Header = styled.div`
  text-align: center;
  margin-bottom: 30px;
  border-bottom: 2px solid #10b981;
  padding-bottom: 20px;
`;

const Title = styled.h1`
  font-size: 28px;
  font-weight: 700;
  color: #1a1a1a;
  margin: 0 0 10px 0;
`;

const Subtitle = styled.h2`
  font-size: 16px;
  color: #6b7280;
  margin: 0;
  font-weight: 400;
`;

const Section = styled.div`
  margin-bottom: 25px;
  page-break-inside: avoid;
`;

const SectionTitle = styled.h3`
  font-size: 18px;
  font-weight: 600;
  color: #10b981;
  margin: 0 0 15px 0;
  border-left: 4px solid #10b981;
  padding-left: 12px;
`;

const Content = styled.div`
  font-size: 12px;
  line-height: 1.5;
  margin-bottom: 15px;
`;

const MetricGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 15px;
  margin: 15px 0;
`;

const MetricCard = styled.div`
  background: #f8fafc;
  padding: 12px;
  border-radius: 6px;
  border-left: 3px solid #10b981;
`;

const MetricLabel = styled.div`
  font-size: 11px;
  color: #6b7280;
  font-weight: 500;
  margin-bottom: 4px;
`;

const MetricValue = styled.div<{ style?: React.CSSProperties }>`
  font-size: 14px;
  font-weight: 600;
  color: #1a1a1a;
`;

const KeyPointsList = styled.ul`
  margin: 10px 0;
  padding-left: 20px;
`;

const KeyPoint = styled.li`
  font-size: 12px;
  margin-bottom: 6px;
  line-height: 1.4;
`;

const Footer = styled.div`
  margin-top: 40px;
  padding-top: 20px;
  border-top: 1px solid #e5e7eb;
  text-align: center;
  font-size: 10px;
  color: #6b7280;
`;

interface HTMLReportTemplateProps {
  reportData: any;
}

export const HTMLReportTemplate: React.FC<HTMLReportTemplateProps> = ({ reportData }) => {
  const { ticker, title, slides, rawData, metadata, aiAnalysis, progressiveContext } = reportData;

  // Helper function to format AI analysis content
  const formatAnalysisContent = (content: string) => {
    if (!content) return ['Analysis not available']; // array: every call site .map()s the result

    // Split by double newlines to create paragraphs
    const paragraphs = content.split('\n\n').filter(p => p.trim());
    return paragraphs;
  };

  // Helper function to extract key insights from AI content
  const extractKeyInsights = (content: string) => {
    if (!content) return [];

    // Look for bullet points or numbered lists
    const lines = content.split('\n');
    const insights = lines
      .filter(line => line.match(/^[\-\*\•]\s+|^\d+\.\s+/))
      .map(line => line.replace(/^[\-\*\•]\s+|^\d+\.\s+/, '').trim())
      .filter(insight => insight.length > 10); // Filter out very short items

    return insights.slice(0, 5); // Limit to 5 key insights
  };

  return (
    <ReportContainer id="pdf-report-content">
      <Header>
        <Title>{title || `${ticker} Comprehensive Financial Analysis`}</Title>
        <Subtitle>AI-Enhanced Intelligence Report • Generated on {new Date().toLocaleDateString()}</Subtitle>
      </Header>

      {/* Executive Summary from AI Analysis */}
      {aiAnalysis?.executiveSummary && (
        <Section>
          <SectionTitle>Executive Summary</SectionTitle>
          {formatAnalysisContent(aiAnalysis.executiveSummary).map((paragraph, index) => (
            <Content key={index}>{paragraph}</Content>
          ))}
        </Section>
      )}

      {/* Market Data Overview */}
      {rawData?.quote && (
        <Section>
          <SectionTitle>Market Data Overview</SectionTitle>
          <MetricGrid>
            <MetricCard>
              <MetricLabel>Current Price</MetricLabel>
              <MetricValue>${rawData.quote.close}</MetricValue>
            </MetricCard>
            <MetricCard>
              <MetricLabel>Daily Change</MetricLabel>
              <MetricValue style={{ color: parseFloat(rawData.quote.percent_change) >= 0 ? '#10b981' : '#ef4444' }}>
                {rawData.quote.percent_change}%
              </MetricValue>
            </MetricCard>
            <MetricCard>
              <MetricLabel>Volume</MetricLabel>
              <MetricValue>{parseInt(rawData.quote.volume).toLocaleString()}</MetricValue>
            </MetricCard>
            <MetricCard>
              <MetricLabel>52W Range</MetricLabel>
              <MetricValue>{rawData.quote.fifty_two_week?.range || 'N/A'}</MetricValue>
            </MetricCard>
          </MetricGrid>

          {rawData?.profile && (
            <Content style={{ marginTop: '15px' }}>
              <strong>{rawData.profile.name}</strong> ({rawData.profile.sector}) - {rawData.profile.industry}
            </Content>
          )}
        </Section>
      )}

      {/* AI Market Assessment */}
      {progressiveContext?.marketAssessment && (
        <Section>
          <SectionTitle>AI Market Assessment</SectionTitle>
          {formatAnalysisContent(progressiveContext.marketAssessment).map((paragraph, index) => (
            <Content key={index}>{paragraph}</Content>
          ))}

          {extractKeyInsights(progressiveContext.marketAssessment).length > 0 && (
            <>
              <MetricLabel style={{ marginTop: '15px' }}>Key Market Insights:</MetricLabel>
              <KeyPointsList>
                {extractKeyInsights(progressiveContext.marketAssessment).map((insight, index) => (
                  <KeyPoint key={index}>{insight}</KeyPoint>
                ))}
              </KeyPointsList>
            </>
          )}
        </Section>
      )}

      {/* AI Financial Health Analysis */}
      {progressiveContext?.financialHealth && (
        <Section>
          <SectionTitle>Financial Health Analysis</SectionTitle>
          {formatAnalysisContent(progressiveContext.financialHealth).map((paragraph, index) => (
            <Content key={index}>{paragraph}</Content>
          ))}

          {extractKeyInsights(progressiveContext.financialHealth).length > 0 && (
            <>
              <MetricLabel style={{ marginTop: '15px' }}>Financial Health Indicators:</MetricLabel>
              <KeyPointsList>
                {extractKeyInsights(progressiveContext.financialHealth).map((insight, index) => (
                  <KeyPoint key={index}>{insight}</KeyPoint>
                ))}
              </KeyPointsList>
            </>
          )}
        </Section>
      )}

      {/* AI Technical Analysis */}
      {progressiveContext?.technicalAnalysis && (
        <Section>
          <SectionTitle>Technical Analysis</SectionTitle>
          {formatAnalysisContent(progressiveContext.technicalAnalysis).map((paragraph, index) => (
            <Content key={index}>{paragraph}</Content>
          ))}

          {extractKeyInsights(progressiveContext.technicalAnalysis).length > 0 && (
            <>
              <MetricLabel style={{ marginTop: '15px' }}>Technical Indicators:</MetricLabel>
              <KeyPointsList>
                {extractKeyInsights(progressiveContext.technicalAnalysis).map((insight, index) => (
                  <KeyPoint key={index}>{insight}</KeyPoint>
                ))}
              </KeyPointsList>
            </>
          )}
        </Section>
      )}

      {/* AI Risk Assessment */}
      {progressiveContext?.riskAssessment && (
        <Section>
          <SectionTitle>Risk Assessment</SectionTitle>
          {formatAnalysisContent(progressiveContext.riskAssessment).map((paragraph, index) => (
            <Content key={index}>{paragraph}</Content>
          ))}

          {extractKeyInsights(progressiveContext.riskAssessment).length > 0 && (
            <>
              <MetricLabel style={{ marginTop: '15px' }}>Risk Factors:</MetricLabel>
              <KeyPointsList>
                {extractKeyInsights(progressiveContext.riskAssessment).map((insight, index) => (
                  <KeyPoint key={index}>{insight}</KeyPoint>
                ))}
              </KeyPointsList>
            </>
          )}
        </Section>
      )}

      {/* Investment Recommendation */}
      {progressiveContext?.investmentRecommendation && (
        <Section>
          <SectionTitle>Investment Recommendation</SectionTitle>
          {formatAnalysisContent(progressiveContext.investmentRecommendation).map((paragraph, index) => (
            <Content key={index}>{paragraph}</Content>
          ))}

          {extractKeyInsights(progressiveContext.investmentRecommendation).length > 0 && (
            <>
              <MetricLabel style={{ marginTop: '15px' }}>Investment Highlights:</MetricLabel>
              <KeyPointsList>
                {extractKeyInsights(progressiveContext.investmentRecommendation).map((insight, index) => (
                  <KeyPoint key={index}>{insight}</KeyPoint>
                ))}
              </KeyPointsList>
            </>
          )}
        </Section>
      )}

      {/* Additional Analysis Sections from Slides */}
      {slides && Array.isArray(slides) && slides.filter(slide => slide.type === 'analysis').map((slide, index) => (
        <Section key={index}>
          <SectionTitle>{slide.title || `Additional Analysis ${index + 1}`}</SectionTitle>
          {formatAnalysisContent(slide.content || slide.text || '').map((paragraph, pIndex) => (
            <Content key={pIndex}>{paragraph}</Content>
          ))}

          {slide.keyPoints && Array.isArray(slide.keyPoints) && slide.keyPoints.length > 0 && (
            <>
              <MetricLabel style={{ marginTop: '15px' }}>Key Points:</MetricLabel>
              <KeyPointsList>
                {slide.keyPoints.map((point, pointIndex) => (
                  <KeyPoint key={pointIndex}>{point}</KeyPoint>
                ))}
              </KeyPointsList>
            </>
          )}
        </Section>
      ))}

      {/* Data Quality & Transparency */}
      <Section>
        <SectionTitle>Data Quality & Sources</SectionTitle>
        <Content>
          This report was generated using {metadata?.realDataSources || 0} real-time data sources
          with a data quality score of {metadata?.dataQuality || 0}%.
          {metadata?.intelligenceLevel === 'ENHANCED_AI' ?
            ' Enhanced with AI analysis from Claude Sonnet.' :
            ' Basic data analysis without AI enhancement.'}
        </Content>

        {metadata?.realDataSources > 0 && (
          <Content style={{ marginTop: '10px', fontSize: '11px', color: '#6b7280' }}>
            Data sources include real-time market quotes, company profiles, financial statements,
            technical indicators, and comprehensive AI analysis. All data is sourced from
            professional financial data providers.
          </Content>
        )}
      </Section>

      <Footer>
        <div>Generated by TriSight Financial Intelligence Platform</div>
        <div>Report ID: {reportData.reportId || 'N/A'} • Intelligence Level: {metadata?.intelligenceLevel || 'BASIC'}</div>
        <div style={{ marginTop: '5px', fontSize: '9px' }}>
          This report contains AI-generated analysis and should be used for informational purposes only.
        </div>
      </Footer>
    </ReportContainer>
  );
};
