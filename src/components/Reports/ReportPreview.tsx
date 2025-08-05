// src/components/Reports/ReportPreview.tsx
// Live preview of report as it's being built
// Context: Shows real-time updates as users configure their report

import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { Eye, Maximize2, Download, RefreshCw } from 'lucide-react';
import { getStorageService } from '../../services/reportStorageService';
import { logDebug, logError } from '../../utils/logger';

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

// Helper function to generate text version of report for fallback download
const generateTextReport = (report: any): string => {
  const slides = report.slides || report.reportData?.slides || [];
  const title = report.title || 'Investment Analysis Report';
  const ticker = report.ticker || 'N/A';
  const template = report.template || 'Unknown';
  const author = report.author || report.metadata?.author || 'TriSight Analytics';
  const generatedAt = report.completedAt || report.createdAt || new Date().toISOString();
  
  let content = `${title}\n`;
  content += `${'='.repeat(title.length)}\n\n`;
  content += `Ticker: ${ticker}\n`;
  content += `Template: ${template}\n`;
  content += `Author: ${author}\n`;
  content += `Generated: ${new Date(generatedAt).toLocaleString()}\n`;
  content += `Total Slides: ${slides.length}\n\n`;
  
  slides.forEach((slide: any, index: number) => {
    content += `\n${index + 1}. ${slide.title || `Slide ${index + 1}`}\n`;
    content += `${'-'.repeat((slide.title || `Slide ${index + 1}`).length + 3)}\n`;
    
    if (slide.content && slide.content.length > 0) {
      slide.content.forEach((contentItem: any) => {
        if (contentItem.type === 'text') {
          if (contentItem.data.text) {
            content += `\n${contentItem.data.text}\n`;
          }
          if (contentItem.data.bullets && Array.isArray(contentItem.data.bullets)) {
            content += '\n';
            contentItem.data.bullets.forEach((bullet: string) => {
              content += `• ${bullet}\n`;
            });
          }
        } else if (contentItem.type === 'table' && contentItem.data.headers) {
          content += '\n';
          const headers = contentItem.data.headers;
          content += headers.join('\t') + '\n';
          content += headers.map(() => '---').join('\t') + '\n';
          
          if (contentItem.data.rows && Array.isArray(contentItem.data.rows)) {
            contentItem.data.rows.forEach((row: string[]) => {
              content += row.join('\t') + '\n';
            });
          }
        } else if (contentItem.type === 'chart') {
          content += `\n[Chart: ${contentItem.data.title || 'Untitled Chart'}]\n`;
        }
      });
    }
    content += '\n';
  });
  
  content += `\n\n---\nGenerated by TriSight Analytics\n${new Date().toLocaleString()}`;
  
  return content;
};

export const ReportPreview: React.FC<ReportPreviewProps> = ({
  currentReport,
  onReportChange
}) => {
  const [view, setView] = useState<'document' | 'presentation'>('document');
  const [isLoading, setIsLoading] = useState(false);
  const [previewContent, setPreviewContent] = useState('');
  
  useEffect(() => {
    console.log('[ReportPreview] CurrentReport changed:', currentReport);
    
    if (currentReport) {
      // If we have slides or reportData with slides, show the completed report
      if (currentReport.slides || currentReport.reportData?.slides) {
        generateCompletedReportPreview();
      } else if (currentReport.status === 'generating') {
        generatePreview();
      } else {
        // Default to preview generation
        generatePreview();
      }
    }
  }, [currentReport]);
  
  const generateCompletedReportPreview = () => {
    console.log('[ReportPreview] Generating completed report preview');
    setIsLoading(true);
    
    try {
      const slides = currentReport.slides || currentReport.reportData?.slides || [];
      let htmlContent = `<h1>${currentReport.title || 'Investment Analysis Report'}</h1>`;
      
      // Add metadata
      htmlContent += `<div style="margin-bottom: 2rem; padding: 1rem; background: #f8f9fa; border-radius: 0.5rem;">`;
      htmlContent += `<p><strong>Ticker:</strong> ${currentReport.ticker}</p>`;
      htmlContent += `<p><strong>Template:</strong> ${currentReport.template}</p>`;
      htmlContent += `<p><strong>Generated:</strong> ${currentReport.completedAt ? new Date(currentReport.completedAt).toLocaleString() : 'Just now'}</p>`;
      htmlContent += `<p><strong>Total Slides:</strong> ${slides.length}</p>`;
      htmlContent += `</div>`;
      
      // Render each slide
      slides.forEach((slide: any) => {
        htmlContent += `<h2>${slide.title}</h2>`;
        
        if (slide.content && slide.content.length > 0) {
          slide.content.forEach((content: any) => {
            if (content.type === 'text') {
              if (content.data.text) {
                htmlContent += `<p>${content.data.text}</p>`;
              }
              if (content.data.bullets) {
                htmlContent += '<ul>';
                content.data.bullets.forEach((bullet: string) => {
                  htmlContent += `<li>${bullet}</li>`;
                });
                htmlContent += '</ul>';
              }
            } else if (content.type === 'table' && content.data.headers) {
              htmlContent += '<table>';
              htmlContent += '<thead><tr>';
              content.data.headers.forEach((header: string) => {
                htmlContent += `<th>${header}</th>`;
              });
              htmlContent += '</tr></thead><tbody>';
              if (content.data.rows) {
                content.data.rows.forEach((row: string[]) => {
                  htmlContent += '<tr>';
                  row.forEach((cell: string) => {
                    htmlContent += `<td>${cell}</td>`;
                  });
                  htmlContent += '</tr>';
                });
              }
              htmlContent += '</tbody></table>';
            } else if (content.type === 'chart') {
              // Display actual chart if available, otherwise show placeholder
              if (content.data && content.data.data) {
                // Chart data is base64 encoded SVG or image
                htmlContent += `
                  <div class="chart-container" style="text-align: center; margin: 1rem 0;">
                    <h3 style="margin-bottom: 0.5rem;">${content.data.title || 'Chart'}</h3>
                    <img src="${content.data.data}" alt="${content.data.title || 'Chart'}" style="max-width: 100%; height: auto; border: 1px solid #e5e7eb; border-radius: 0.5rem;" />
                  </div>
                `;
              } else {
                // Fallback to placeholder if no chart data
                htmlContent += `
                  <div class="chart-placeholder">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                      <path d="M3 3v18h18" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                      <path d="M18 17V9M13 17V5M8 17v-3" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                    </svg>
                    <p>${content.data?.title || 'Chart'} - [DIAGNOSTIC] Chart data not available</p>
                  </div>
                `;
              }
            }
          });
        }
      });
      
      setPreviewContent(htmlContent);
      setIsLoading(false);
    } catch (error) {
      console.error('[ReportPreview] Error generating completed report preview:', error);
      setPreviewContent('<p>Error loading report preview</p>');
      setIsLoading(false);
    }
  };
  
  const generatePreview = async () => {
    if (!currentReport) return;
    
    setIsLoading(true);
    
    try {
      // If we have a completed report with slides, use that data
      if (currentReport.slides || currentReport.reportData?.slides) {
        generateCompletedReportPreview();
        return;
      }
      
      // Otherwise, generate a preview based on current configuration
      let previewHtml = `<h1>${currentReport.title || 'Investment Analysis Report'}</h1>`;
      
      // Add report metadata
      if (currentReport.ticker || currentReport.template) {
        previewHtml += `<div style="margin-bottom: 2rem; padding: 1rem; background: #f8f9fa; border-radius: 0.5rem;">`;
        if (currentReport.ticker) {
          previewHtml += `<p><strong>Ticker:</strong> ${currentReport.ticker}</p>`;
        }
        if (currentReport.template) {
          previewHtml += `<p><strong>Template:</strong> ${currentReport.template}</p>`;
        }
        if (currentReport.author) {
          previewHtml += `<p><strong>Author:</strong> ${currentReport.author}</p>`;
        }
        previewHtml += `</div>`;
      }
      
      // Add sections based on template
      if (currentReport.template === 'equity-research') {
        previewHtml += `
          <h2>Executive Summary</h2>
          <p>Comprehensive equity analysis report for ${currentReport.ticker || 'selected security'}.</p>
          
          <h2>Financial Analysis</h2>
          <p>Financial performance metrics and trends will be analyzed based on latest available data.</p>
          <div class="chart-placeholder">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path d="M3 3v18h18" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              <path d="M18 17V9M13 17V5M8 17v-3" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
            <p>Financial Performance Chart</p>
          </div>
          
          <h2>Valuation Analysis</h2>
          <p>Valuation metrics compared to industry peers and historical averages.</p>
          
          <h2>Investment Recommendation</h2>
          <p>Data-driven recommendation based on comprehensive analysis.</p>
        `;
      } else if (currentReport.template === 'technical-analysis') {
        previewHtml += `
          <h2>Price Action Overview</h2>
          <p>Technical analysis of price patterns and momentum indicators.</p>
          <div class="chart-placeholder">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path d="M3 3v18h18" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              <path d="M18 17V9M13 17V5M8 17v-3" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
            <p>Candlestick Chart</p>
          </div>
          
          <h2>Trend Analysis</h2>
          <p>Moving averages and trend strength indicators.</p>
          
          <h2>Trading Signals</h2>
          <p>Entry and exit points based on technical indicators.</p>
        `;
      } else if (currentReport.template === 'risk-assessment') {
        previewHtml += `
          <h2>Risk Overview</h2>
          <p>Comprehensive risk analysis across multiple dimensions.</p>
          
          <h2>Market Risk</h2>
          <p>Beta analysis, volatility metrics, and correlation studies.</p>
          
          <h2>Risk Mitigation</h2>
          <p>Strategies for managing identified risks.</p>
        `;
      } else {
        // Default preview
        previewHtml += `
          <h2>Report Preview</h2>
          <p>Configure your report settings to see a preview of the content that will be generated.</p>
          
          <h3>Available Sections</h3>
          <ul>
            <li>Executive Summary</li>
            <li>Market Analysis</li>
            <li>Financial Metrics</li>
            <li>Technical Indicators</li>
            <li>Risk Assessment</li>
            <li>Investment Recommendation</li>
          </ul>
        `;
      }
      
      // Add footer
      previewHtml += `
        <hr style="margin-top: 3rem; border-color: #e5e7eb;" />
        <p style="font-size: 0.875rem; color: #6b7280; text-align: center;">
          This is a preview. Click "Generate Report" to create the full report with real data.
        </p>
      `;
      
      setPreviewContent(previewHtml);
    } catch (error) {
      console.error('[ReportPreview] Error generating preview:', error);
      setPreviewContent('<p>Error generating preview</p>');
    } finally {
      setIsLoading(false);
    }
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
      // Presentation view - show slide-based layout
      return (
        <PreviewDocument>
          <div style={{ padding: '2rem' }}>
            <h2 style={{ marginBottom: '2rem' }}>Presentation View</h2>
            {(currentReport?.slides || currentReport?.reportData?.slides) ? (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1rem' }}>
                {(currentReport.slides || currentReport.reportData?.slides || []).slice(0, 6).map((slide: any, index: number) => (
                  <div key={index} style={{
                    border: '1px solid #e5e7eb',
                    borderRadius: '0.5rem',
                    padding: '1rem',
                    background: '#f9fafb',
                    minHeight: '200px'
                  }}>
                    <h4 style={{ fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.5rem' }}>
                      Slide {slide.slideNumber || index + 1}: {slide.title}
                    </h4>
                    <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>
                      {slide.layout} layout
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ textAlign: 'center', color: '#6b7280' }}>
                <p>Generate a report to see the presentation slides</p>
              </div>
            )}
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
          <IconButton 
            title="Download preview"
            onClick={async () => {
              if (currentReport?.id) {
                try {
                  // First try to download from storage service
                  const storageService = getStorageService();
                  const result = await storageService.downloadReport(currentReport.id);
                  
                  // Check if result is JSON data (client-side generation needed)
                  if (result && typeof result === 'object' && result.constructor.name === 'Object') {
                    // This is JSON data, not a blob - we need client-side PDF generation
                    alert('Client-side PDF generation not yet implemented. Report data is available in the preview.');
                    logDebug('ReportPreview', 'Report data retrieved for client-side generation:', result);
                  } else {
                    // This is a blob - direct download
                    const url = URL.createObjectURL(result);
                    const link = document.createElement('a');
                    link.href = url;
                    link.download = currentReport.title ? 
                      `${currentReport.title.replace(/[^a-zA-Z0-9]/g, '_')}.${currentReport.format || 'pdf'}` :
                      `report_${currentReport.ticker || 'unknown'}.${currentReport.format || 'pdf'}`;
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                    URL.revokeObjectURL(url);
                    logDebug('ReportPreview', 'Report downloaded successfully');
                  }
                } catch (error) {
                  logError('ReportPreview', 'Failed to download report:', error);
                  
                  // Fallback: Create a text file with the report content if we have it
                  if (currentReport && (currentReport.slides || currentReport.reportData?.slides)) {
                    try {
                      const reportContent = generateTextReport(currentReport);
                      const blob = new Blob([reportContent], { type: 'text/plain' });
                      const url = URL.createObjectURL(blob);
                      const link = document.createElement('a');
                      link.href = url;
                      link.download = currentReport.title ? 
                        `${currentReport.title.replace(/[^a-zA-Z0-9]/g, '_')}.txt` :
                        `report_${currentReport.ticker || 'unknown'}.txt`;
                      document.body.appendChild(link);
                      link.click();
                      document.body.removeChild(link);
                      URL.revokeObjectURL(url);
                      logDebug('ReportPreview', 'Report downloaded as text file successfully');
                    } catch (textError) {
                      logError('ReportPreview', 'Failed to create text report:', textError);
                      alert('Failed to download report. The report is displayed in the preview above.');
                    }
                  } else {
                    alert('Failed to download report. The report is displayed in the preview above.');
                  }
                }
              } else {
                alert('Please complete the report generation first.');
              }
            }}
          >
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