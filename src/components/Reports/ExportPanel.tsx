// src/components/Reports/ExportPanel.tsx
// Export options and queue widget
// Context: Manages export formats and shows export progress

import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { Download, FileText, FileSpreadsheet, Presentation, Code, CheckCircle, Loader } from 'lucide-react';
import { getStorageService } from '../../services/reportStorageService';
import { logDebug } from '../../utils/logger';

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
        
        // Simulate export progress (in real implementation, this would be actual export)
        for (let progress = 20; progress <= 90; progress += 10) {
          await new Promise(resolve => setTimeout(resolve, 200));
          updateQueueItem(queueItem.id, { progress });
        }
        
        // For now, we'll use the download functionality from storage service
        if (currentReport.id && queueItem.format === 'pdf') {
          await storageService.downloadReport(currentReport.id);
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