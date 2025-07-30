// src/components/Reports/ReportPreview.tsx
// Live preview of report as it's being built
// Context: Shows real-time updates as users configure their report

import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { Eye, Maximize2, Download, RefreshCw } from 'lucide-react';

const PreviewContainer = styled.div`
  height: 100%;
  display: flex;
  flex-direction: column;
`;

const PreviewHeader = styled.div`
  padding: 1rem 1.5rem;
  border-bottom: 1px solid #e5e7eb;
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const ViewToggle = styled.div`
  display: flex;
  background: #f3f4f6;
  border-radius: 0.375rem;
  padding: 0.25rem;
`;

const ViewButton = styled.button<{ $active: boolean }>`
  padding: 0.375rem 0.75rem;
  background: ${props => props.$active ? 'white' : 'transparent'};
  border: none;
  border-radius: 0.25rem;
  font-size: 0.813rem;
  font-weight: 500;
  color: ${props => props.$active ? '#1e293b' : '#6b7280'};
  cursor: pointer;
  transition: all 0.2s ease;
  
  &:hover {
    color: #1e293b;
  }
`;

const PreviewActions = styled.div`
  display: flex;
  gap: 0.5rem;
`;

const IconButton = styled.button`
  padding: 0.375rem;
  background: none;
  border: none;
  color: #6b7280;
  cursor: pointer;
  border-radius: 0.25rem;
  transition: all 0.2s ease;
  
  &:hover {
    background: #f3f4f6;
    color: #374151;
  }
  
  svg {
    width: 16px;
    height: 16px;
  }
`;

const PreviewContent = styled.div`
  flex: 1;
  overflow: auto;
  background: #fff;
`;

const PreviewDocument = styled.div`
  padding: 3rem;
  max-width: 800px;
  margin: 0 auto;
  
  h1 {
    font-size: 2rem;
    font-weight: 700;
    color: #1e293b;
    margin-bottom: 0.5rem;
  }
  
  h2 {
    font-size: 1.5rem;
    font-weight: 600;
    color: #1e293b;
    margin-top: 2rem;
    margin-bottom: 1rem;
  }
  
  h3 {
    font-size: 1.25rem;
    font-weight: 600;
    color: #374151;
    margin-top: 1.5rem;
    margin-bottom: 0.75rem;
  }
  
  p {
    line-height: 1.75;
    color: #4b5563;
    margin-bottom: 1rem;
  }
  
  ul, ol {
    margin-left: 2rem;
    margin-bottom: 1rem;
    color: #4b5563;
  }
  
  li {
    margin-bottom: 0.5rem;
  }
  
  table {
    width: 100%;
    border-collapse: collapse;
    margin: 1.5rem 0;
  }
  
  th, td {
    padding: 0.75rem;
    text-align: left;
    border-bottom: 1px solid #e5e7eb;
  }
  
  th {
    background: #f9fafb;
    font-weight: 600;
    color: #374151;
  }
  
  .chart-placeholder {
    background: #f3f4f6;
    border: 2px dashed #d1d5db;
    border-radius: 0.5rem;
    padding: 3rem;
    text-align: center;
    color: #6b7280;
    margin: 1.5rem 0;
  }
`;

const LoadingOverlay = styled.div`
  position: absolute;
  inset: 0;
  background: rgba(255, 255, 255, 0.9);
  display: flex;
  align-items: center;
  justify-content: center;
  
  svg {
    width: 32px;
    height: 32px;
    color: #3b82f6;
    animation: spin 1s linear infinite;
  }
  
  @keyframes spin {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }
`;

interface ReportPreviewProps {
  currentReport: any;
  onReportChange: (report: any) => void;
}

export const ReportPreview: React.FC<ReportPreviewProps> = ({
  currentReport,
  onReportChange
}) => {
  const [view, setView] = useState<'document' | 'presentation'>('document');
  const [isLoading, setIsLoading] = useState(false);
  const [previewContent, setPreviewContent] = useState('');
  
  useEffect(() => {
    if (currentReport && currentReport.status === 'generating') {
      generatePreview();
    }
  }, [currentReport]);
  
  const generatePreview = async () => {
    setIsLoading(true);
    
    // Simulate preview generation
    setTimeout(() => {
      const mockContent = `
# ${currentReport?.title || 'Investment Analysis Report'}

**Executive Summary**

${currentReport?.description || 'This report provides a comprehensive analysis of market opportunities and investment recommendations based on current market conditions and proprietary pattern detection algorithms.'}

## Market Overview

The current market environment presents both challenges and opportunities for investors. Key trends include:

- Strong momentum in technology sector
- Rotation from growth to value stocks
- Increased volatility due to macroeconomic uncertainty

<div class="chart-placeholder">
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor">
    <path d="M3 3v18h18" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
    <path d="M18 17V9M13 17V5M8 17v-3" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
  </svg>
  <p>Market Performance Chart</p>
</div>

## Technical Analysis

Our proprietary pattern detection system has identified several key formations:

### Goldmine Channel Pattern
- **Detection Date**: ${new Date().toLocaleDateString()}
- **Confidence Level**: 87%
- **Expected Move**: +12.5%

### Support and Resistance Levels

| Level Type | Price | Strength |
|------------|-------|----------|
| Resistance | $185.50 | Strong |
| Support | $172.30 | Moderate |
| Support | $165.00 | Weak |

## Investment Recommendation

Based on our comprehensive analysis, we recommend a **BUY** rating with the following targets:

- **Entry Price**: $175.00 - $177.50
- **Target Price**: $195.00 (12-month)
- **Stop Loss**: $168.00

## Risk Factors

- Market volatility remains elevated
- Regulatory changes could impact sector
- Competition from emerging technologies

---

*This report is generated in real-time and updates as you modify settings.*
      `;
      
      setPreviewContent(mockContent);
      setIsLoading(false);
    }, 1500);
  };
  
  const handleRefresh = () => {
    generatePreview();
  };
  
  const renderPreview = () => {
    if (!currentReport) {
      return (
        <PreviewDocument>
          <div style={{ textAlign: 'center', color: '#6b7280', padding: '4rem' }}>
            <Eye style={{ width: 48, height: 48, margin: '0 auto 1rem', opacity: 0.5 }} />
            <p>Create a report to see the preview</p>
          </div>
        </PreviewDocument>
      );
    }
    
    if (view === 'document') {
      return (
        <PreviewDocument>
          <div dangerouslySetInnerHTML={{ __html: previewContent }} />
        </PreviewDocument>
      );
    } else {
      // Presentation view would show slide preview
      return (
        <PreviewDocument>
          <div style={{ textAlign: 'center', padding: '4rem', color: '#6b7280' }}>
            <p>Presentation preview coming soon</p>
          </div>
        </PreviewDocument>
      );
    }
  };
  
  return (
    <PreviewContainer>
      <PreviewHeader>
        <ViewToggle>
          <ViewButton
            $active={view === 'document'}
            onClick={() => setView('document')}
          >
            Document
          </ViewButton>
          <ViewButton
            $active={view === 'presentation'}
            onClick={() => setView('presentation')}
          >
            Presentation
          </ViewButton>
        </ViewToggle>
        
        <PreviewActions>
          <IconButton onClick={handleRefresh} title="Refresh preview">
            <RefreshCw />
          </IconButton>
          <IconButton title="Full screen">
            <Maximize2 />
          </IconButton>
          <IconButton title="Download preview">
            <Download />
          </IconButton>
        </PreviewActions>
      </PreviewHeader>
      
      <PreviewContent style={{ position: 'relative' }}>
        {renderPreview()}
        {isLoading && (
          <LoadingOverlay>
            <RefreshCw />
          </LoadingOverlay>
        )}
      </PreviewContent>
    </PreviewContainer>
  );
};