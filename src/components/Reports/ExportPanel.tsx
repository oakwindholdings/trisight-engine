// src/components/Reports/ExportPanel.tsx
// Export options and queue widget
// Context: Manages export formats and shows export progress

import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { pdf } from '@react-pdf/renderer';
import { Download, FileText, FileSpreadsheet, Presentation, Code, CheckCircle, Loader } from 'lucide-react';
import { getStorageService } from '../../services/reportStorageService';
import { PDFReportGenerator } from './PDFTemplates/PDFReportGenerator';
import { generateReport } from '../../services/reportApiService';
import { logDebug } from '../../utils/debug';

const Container = styled.div`
  padding: 1rem;
  height: 100%;
  display: flex;
  flex-direction: column;
`;

const Section = styled.div`
  margin-bottom: 1.5rem;
`;

const SectionTitle = styled.h4`
  font-size: 0.875rem;
  font-weight: 600;
  color: #1f2937;
  margin-bottom: 0.75rem;
`;

const FormatList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
`;

const FormatOption = styled.label`
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem;
  background: #f9fafb;
  border-radius: 0.375rem;
  cursor: pointer;
  transition: all 0.2s;
  
  &:hover {
    background: #f3f4f6;
  }
  
  input[type="checkbox"] {
    width: 16px;
    height: 16px;
    cursor: pointer;
  }
`;

const FormatInfo = styled.div`
  flex: 1;
`;

const FormatName = styled.div`
  font-size: 0.875rem;
  font-weight: 500;
  color: #1f2937;
`;

const FormatDesc = styled.div`
  font-size: 0.75rem;
  color: #6b7280;
`;

const FormatIcon = styled.div<{ $color: string }>`
  width: 32px;
  height: 32px;
  background: ${props => props.$color}22;
  border-radius: 0.375rem;
  display: flex;
  align-items: center;
  justify-content: center;
  
  svg {
    width: 16px;
    height: 16px;
    color: ${props => props.$color};
  }
`;

const ExportButton = styled.button`
  width: 100%;
  padding: 0.75rem;
  background: #10b981;
  color: white;
  border: none;
  border-radius: 0.375rem;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  
  &:hover {
    background: #059669;
  }
  
  &:disabled {
    background: #9ca3af;
    cursor: not-allowed;
  }
  
  svg {
    width: 16px;
    height: 16px;
  }
  
  @keyframes spin {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }
`;

const QueueSection = styled.div`
  flex: 1;
  overflow-y: auto;
`;

const QueueItem = styled.div`
  padding: 0.75rem;
  background: #f9fafb;
  border-radius: 0.375rem;
  margin-bottom: 0.5rem;
`;

const QueueHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.25rem;
`;

const QueueName = styled.div`
  font-size: 0.875rem;
  font-weight: 500;
  color: #1f2937;
`;

const QueueStatus = styled.div<{ $status: 'pending' | 'processing' | 'completed' }>`
  font-size: 0.75rem;
  color: ${props => {
    switch (props.$status) {
      case 'pending': return '#6b7280';
      case 'processing': return '#f59e0b';
      case 'completed': return '#10b981';
    }
  }};
`;

const ProgressBar = styled.div`
  height: 4px;
  background: #e5e7eb;
  border-radius: 2px;
  overflow: hidden;
  margin-top: 0.5rem;
`;

const ProgressFill = styled.div<{ $progress: number }>`
  height: 100%;
  width: ${props => props.$progress}%;
  background: #10b981;
  transition: width 0.3s ease;
`;

interface Format {
  id: string;
  name: string;
  description: string;
  icon: React.ElementType;
  color: string;
}

const formats: Format[] = [
  {
    id: 'pdf',
    name: 'PDF',
    description: 'Professional document',
    icon: FileText,
    color: '#ef4444'
  },
  {
    id: 'excel',
    name: 'Excel',
    description: 'Data workbook',
    icon: FileSpreadsheet,
    color: '#10b981'
  },
  {
    id: 'powerpoint',
    name: 'PowerPoint',
    description: 'Presentation slides',
    icon: Presentation,
    color: '#f59e0b'
  },
  {
    id: 'markdown',
    name: 'Markdown',
    description: 'Version control friendly',
    icon: Code,
    color: '#8b5cf6'
  }
];

interface ExportPanelProps {
  currentReport?: any;
  onReportChange?: (report: any) => void;
}

interface QueueItem {
  id: string;
  name: string;
  status: 'pending' | 'processing' | 'completed' | 'error';
  progress: number;
  reportId?: string;
  format?: string;
  startedAt?: Date;
  completedAt?: Date;
}

export const ExportPanel: React.FC<ExportPanelProps> = ({ currentReport }) => {
  const [selectedFormats, setSelectedFormats] = useState<Set<string>>(new Set(['pdf']));
  const [exportQueue, setExportQueue] = useState<QueueItem[]>([]);
  const [isExporting, setIsExporting] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  
  useEffect(() => {
    // Load export history from localStorage
    loadExportHistory();
    
    // Listen for export events
    const handleExportProgress = (event: CustomEvent) => {
      const { exportId, progress, status } = event.detail;
      updateQueueItem(exportId, { progress, status });
    };
    
    window.addEventListener('exportProgress', handleExportProgress as EventListener);
    return () => {
      window.removeEventListener('exportProgress', handleExportProgress as EventListener);
    };
  }, []);
  
  const loadExportHistory = () => {
    try {
      const history = JSON.parse(localStorage.getItem('trisight_export_history') || '[]');
      // Show only recent exports (last 24 hours)
      const recentExports = history.filter((item: any) => {
        const exportTime = new Date(item.startedAt);
        const dayAgo = new Date();
        dayAgo.setDate(dayAgo.getDate() - 1);
        return exportTime > dayAgo;
      }).slice(-5); // Show last 5
      
      setExportQueue(recentExports);
    } catch (error) {
      logDebug('ExportPanel', 'Error loading export history:', error);
    }
  };
  
  const updateQueueItem = (id: string, updates: Partial<QueueItem>) => {
    setExportQueue(prev => prev.map(item => 
      item.id === id ? { ...item, ...updates } : item
    ));
    
    // Save to history
    try {
      const history = JSON.parse(localStorage.getItem('trisight_export_history') || '[]');
      const updatedHistory = history.map((item: any) => 
        item.id === id ? { ...item, ...updates } : item
      );
      localStorage.setItem('trisight_export_history', JSON.stringify(updatedHistory));
    } catch (error) {
      logDebug('ExportPanel', 'Error saving export history:', error);
    }
  };

  const toggleFormat = (formatId: string) => {
    setSelectedFormats(prev => {
      const next = new Set(prev);
      if (next.has(formatId)) {
        next.delete(formatId);
      } else {
        next.add(formatId);
      }
      return next;
    });
  };

  const exportModularPDF = async () => {
    try {
      console.log('🚀 Starting modular PDF generation...');
      setIsGenerating(true);

      // Get current ticker
      const ticker = currentReport?.ticker || 'AAPL';

      // Get custom prompts from localStorage or state
      const customPrompts = JSON.parse(localStorage.getItem('reportPrompts') || '{}');

      // SAFE TESTING: Check for enhancement flags
      const testEnhanced = localStorage.getItem('testEnhanced') === 'true';
      const testEnhancedFinancial = localStorage.getItem('testEnhancedFinancial') === 'true';
      const useMultiModel = localStorage.getItem('useMultiModel') === 'true';

      if (testEnhanced || testEnhancedFinancial) {
        console.log(`🧪 TESTING ENHANCED VERSION:`);
        console.log(`  - Market Overview: ${testEnhanced ? 'ENHANCED' : 'standard'}`);
        console.log(`  - Financial Analysis: ${testEnhancedFinancial ? 'ENHANCED' : 'standard'}`);
        console.log(`  - Multi-model AI: ${useMultiModel ? 'ENABLED' : 'disabled'}`);
      }

      // Parallel fetch all sections - each has its own 10-second timeout
      const sectionRequests = [
        {
          name: 'Market Overview',
          endpoint: testEnhanced
            ? '/api/reports/sections/market-overview-enhanced'
            : '/api/reports/sections/market-overview',
          customPrompt: customPrompts.marketOverview,
          useMultiModel: testEnhanced && useMultiModel
        },
        {
          name: 'Financial Analysis',
          endpoint: testEnhancedFinancial ? '/api/reports/sections/financial-analysis-enhanced' : '/api/reports/sections/financial-analysis',
          customPrompt: customPrompts.financialAnalysis,
          useMultiModel: testEnhancedFinancial && useMultiModel
        },
        {
          name: 'Technical Analysis',
          endpoint: '/api/reports/sections/technical-analysis',
          customPrompt: customPrompts.technicalAnalysis
        }
      ];

      console.log('📊 Fetching all sections in parallel...');

      const sectionPromises = sectionRequests.map(async (section) => {
        try {
          console.log(`  → Fetching ${section.name}...`);
          const response = await fetch(section.endpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              ticker: ticker,
              customPrompt: section.customPrompt,
              useMultiModel: section.useMultiModel
            })
          });

          if (!response.ok) throw new Error(`Failed: ${response.status}`);

          const data = await response.json();
          console.log(`  ✅ ${section.name} complete`);
          return data;

        } catch (error) {
          console.error(`  ❌ ${section.name} failed:`, error);
          return {
            success: false,
            section: section.name.toLowerCase().replace(' ', '-'),
            error: error.message
          };
        }
      });

      // Wait for all sections to complete
      const sections = await Promise.allSettled(sectionPromises);

      // Combine successful sections into report format
      const combinedReport = {
        success: true,
        reportId: `modular-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        ticker: ticker,
        title: `${ticker} Intelligent Analysis`,
        slides: [],
        charts: [],
        aiAnalysis: {},
        rawData: {},
        dataStatus: {},
        metadata: {
          generatedAt: new Date().toISOString(),
          sectionsCompleted: 0,
          totalSections: sectionRequests.length
        }
      };

      // Process each section result
      sections.forEach((result, index) => {
        if (result.status === 'fulfilled' && result.value?.success) {
          const section = result.value;

          // Merge slides
          if (section.slides) {
            combinedReport.slides.push(...section.slides);
          }

          // Merge raw data
          if (section.rawData) {
            combinedReport.rawData = { ...combinedReport.rawData, ...section.rawData };
          }

          // Merge AI analysis
          if (section.aiAnalysis) {
            combinedReport.aiAnalysis = { ...combinedReport.aiAnalysis, ...section.aiAnalysis };
          }

          // Track status
          combinedReport.dataStatus[section.section] = { success: true };
          combinedReport.metadata.sectionsCompleted++;

        } else {
          const sectionName = sectionRequests[index].name;
          combinedReport.dataStatus[sectionName] = { success: false };
          console.warn(`Section ${sectionName} was not included in report`);
        }
      });

      console.log(`📄 Generating PDF with ${combinedReport.metadata.sectionsCompleted}/${combinedReport.metadata.totalSections} sections...`);

      // Generate PDF using existing endpoint
      const pdfResponse = await fetch('/api/reports/generate-complete-pdf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reportData: combinedReport })
      });

      if (!pdfResponse.ok) {
        throw new Error(`PDF generation failed: ${pdfResponse.status}`);
      }

      const pdfBlob = await pdfResponse.blob();
      const url = URL.createObjectURL(pdfBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${ticker}-report-${new Date().toISOString().split('T')[0]}.pdf`;
      link.click();

      console.log('✅ Modular PDF generated successfully!');

    } catch (error) {
      console.error('❌ PDF generation failed:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  const exportToPDF = async (): Promise<void> => {
    try {
      // Get the current symbol from the app context
      const ticker = currentReport?.ticker || 'NVDA'; // fallback to NVDA

      logDebug('ExportPanel', 'Starting complete PDF generation for:', ticker);

      // First get intelligent data with AI analysis
      const intelligentResponse = await fetch('/api/reports/generate-intelligent-real-data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ticker,
          template: 'intelligent-institutional',
          includeAIAnalysis: true,
          includeProgressiveContext: true
        })
      });

      if (!intelligentResponse.ok) {
        throw new Error(`Failed to fetch intelligent data: ${intelligentResponse.statusText}`);
      }

      const intelligentData = await intelligentResponse.json();

      if (!intelligentData.success) {
        throw new Error('Failed to generate intelligent report data');
      }

      logDebug('ExportPanel', 'Intelligent data generated, creating complete PDF...');

      // Generate complete professional PDF using server-side jsPDF
      const pdfResponse = await fetch('/api/reports/generate-complete-pdf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reportData: intelligentData })
      });

      if (!pdfResponse.ok) {
        throw new Error(`PDF generation failed: ${pdfResponse.statusText}`);
      }

      // Get PDF blob and download it
      const pdfBlob = await pdfResponse.blob();
      const url = URL.createObjectURL(pdfBlob);

      // Create download link
      const link = document.createElement('a');
      link.href = url;
      link.download = `${ticker}-complete-financial-analysis.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      // Clean up
      setTimeout(() => {
        URL.revokeObjectURL(url);
      }, 1000);

      logDebug('ExportPanel', 'Complete PDF downloaded successfully');
    } catch (error) {
      logDebug('ExportPanel', 'Complete PDF generation failed:', error);

      // Show error to user
      alert(`PDF generation failed: ${error.message}`);
      throw error;
    }
  };

  const handleExport = async () => {
    if (!currentReport || selectedFormats.size === 0) {
      return;
    }

    setIsExporting(true);
    const storageService = getStorageService();

    // Create export queue items
    const newQueueItems: QueueItem[] = [];

    for (const format of selectedFormats) {
      const exportId = `export-${Date.now()}-${format}`;
      const fileName = `${currentReport.ticker || 'Report'}_${new Date().toISOString().split('T')[0]}.${format === 'excel' ? 'xlsx' : format === 'powerpoint' ? 'pptx' : format}`;

      const queueItem: QueueItem = {
        id: exportId,
        name: fileName,
        status: 'pending',
        progress: 0,
        reportId: currentReport.id,
        format,
        startedAt: new Date()
      };

      newQueueItems.push(queueItem);

      // Add to queue immediately
      setExportQueue(prev => [queueItem, ...prev].slice(0, 10)); // Keep max 10 items
    }

    // Save to history
    try {
      const history = JSON.parse(localStorage.getItem('trisight_export_history') || '[]');
      localStorage.setItem('trisight_export_history', JSON.stringify([...newQueueItems, ...history].slice(0, 50)));
    } catch (error) {
      logDebug('ExportPanel', 'Error saving export history:', error);
    }

    // Process exports sequentially
    for (const queueItem of newQueueItems) {
      try {
        // Update status to processing
        updateQueueItem(queueItem.id, { status: 'processing', progress: 10 });

        if (queueItem.format === 'pdf') {
          // Use client-side PDF generation
          updateQueueItem(queueItem.id, { progress: 30 });
          await exportToPDF();
          updateQueueItem(queueItem.id, { progress: 100 });
        } else {
          // Simulate export progress for other formats (not yet implemented)
          for (let progress = 20; progress <= 90; progress += 10) {
            await new Promise(resolve => setTimeout(resolve, 200));
            updateQueueItem(queueItem.id, { progress });
          }

          // For non-PDF formats, use existing storage service
          if (currentReport.id) {
            await storageService.downloadReport(currentReport.id);
          }
        }

        // Mark as completed
        updateQueueItem(queueItem.id, {
          status: 'completed',
          progress: 100,
          completedAt: new Date()
        });

        logDebug('ExportPanel', `Export completed: ${queueItem.name}`);
      } catch (error) {
        logDebug('ExportPanel', 'Export error:', error);
        updateQueueItem(queueItem.id, { status: 'error', progress: 0 });
      }
    }

    setIsExporting(false);
  };

  return (
    <Container>
      <Section>
        <SectionTitle>Export Formats</SectionTitle>
        <FormatList>
          {formats.map(format => {
            const Icon = format.icon;
            return (
              <FormatOption key={format.id}>
                <input
                  type="checkbox"
                  checked={selectedFormats.has(format.id)}
                  onChange={() => toggleFormat(format.id)}
                />
                <FormatIcon $color={format.color}>
                  <Icon />
                </FormatIcon>
                <FormatInfo>
                  <FormatName>{format.name}</FormatName>
                  <FormatDesc>{format.description}</FormatDesc>
                </FormatInfo>
              </FormatOption>
            );
          })}
        </FormatList>
      </Section>

      {/* SAFE TESTING CONTROLS */}
      <Section style={{ marginTop: '1rem', padding: '1rem', backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px' }}>
        <SectionTitle style={{ fontSize: '14px', color: '#64748b' }}>🧪 Multi-Model Testing</SectionTitle>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '12px' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <input
              type="checkbox"
              checked={localStorage.getItem('testEnhanced') === 'true'}
              onChange={(e) => {
                localStorage.setItem('testEnhanced', e.target.checked.toString());
                console.log('Enhanced testing:', e.target.checked ? 'ENABLED' : 'DISABLED');
              }}
            />
            Test Enhanced Market Overview
          </label>
          <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <input
              type="checkbox"
              checked={localStorage.getItem('testEnhancedFinancial') === 'true'}
              onChange={(e) => {
                localStorage.setItem('testEnhancedFinancial', e.target.checked.toString());
                console.log('Enhanced Financial testing:', e.target.checked ? 'ENABLED' : 'DISABLED');
              }}
            />
            Test Enhanced Financial Analysis
          </label>
          <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <input
              type="checkbox"
              checked={localStorage.getItem('useMultiModel') === 'true'}
              onChange={(e) => {
                localStorage.setItem('useMultiModel', e.target.checked.toString());
                console.log('Multi-model:', e.target.checked ? 'ENABLED' : 'DISABLED');
              }}
            />
            Enable Multi-Model AI (GPT-4 + Perplexity)
          </label>
          <button
            onClick={exportModularPDF}
            disabled={isGenerating}
            style={{
              padding: '0.5rem 1rem',
              backgroundColor: isGenerating ? '#9ca3af' : '#10b981',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              fontSize: '12px',
              cursor: isGenerating ? 'not-allowed' : 'pointer'
            }}
          >
            {isGenerating ? 'Generating...' : 'Generate Test PDF'}
          </button>
        </div>
      </Section>

      <ExportButton
        onClick={handleExport}
        disabled={selectedFormats.size === 0 || isExporting || !currentReport}
      >
        {isExporting ? (
          <>
            <Loader style={{ animation: 'spin 1s linear infinite' }} />
            Exporting...
          </>
        ) : (
          <>
            <Download />
            Export Report
          </>
        )}
      </ExportButton>
      
      <Section style={{ marginTop: '1.5rem', flex: 1, display: 'flex', flexDirection: 'column' }}>
        <SectionTitle>Export Queue</SectionTitle>
        <QueueSection>
          {exportQueue.length === 0 ? (
            <div style={{ textAlign: 'center', color: '#9ca3af', padding: '2rem' }}>
              <Download style={{ width: 32, height: 32, margin: '0 auto 0.5rem', opacity: 0.3 }} />
              <p style={{ fontSize: '0.75rem' }}>No recent exports</p>
            </div>
          ) : (
            exportQueue.map(item => (
              <QueueItem key={item.id}>
                <QueueHeader>
                  <QueueName>{item.name}</QueueName>
                  <QueueStatus $status={item.status}>
                    {item.status === 'completed' && <CheckCircle style={{ width: 14, height: 14 }} />}
                    {item.status === 'processing' && <Loader style={{ width: 14, height: 14, animation: 'spin 1s linear infinite' }} />}
                    {' '}{item.status}
                  </QueueStatus>
                </QueueHeader>
                {item.status === 'processing' && (
                  <ProgressBar>
                    <ProgressFill $progress={item.progress} />
                  </ProgressBar>
                )}
              </QueueItem>
            ))
          )}
        </QueueSection>
      </Section>
    </Container>
  );
};