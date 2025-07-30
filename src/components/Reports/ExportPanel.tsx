// src/components/Reports/ExportPanel.tsx
// Export options and queue widget
// Context: Manages export formats and shows export progress

import React, { useState } from 'react';
import styled from 'styled-components';
import { Download, FileText, FileSpreadsheet, Presentation, Code, CheckCircle } from 'lucide-react';

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

export const ExportPanel: React.FC<ExportPanelProps> = () => {
  const [selectedFormats, setSelectedFormats] = useState<Set<string>>(new Set(['pdf']));
  const [exportQueue, setExportQueue] = useState([
    { id: '1', name: 'AAPL_Report.pdf', status: 'completed', progress: 100 },
    { id: '2', name: 'AAPL_Report.xlsx', status: 'processing', progress: 65 },
    { id: '3', name: 'AAPL_Report.pptx', status: 'pending', progress: 0 }
  ]);

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

  const handleExport = () => {
    console.log('Exporting to formats:', Array.from(selectedFormats));
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
        disabled={selectedFormats.size === 0}
      >
        <Download />
        Export Report
      </ExportButton>
      
      <Section style={{ marginTop: '1.5rem' }}>
        <SectionTitle>Export Queue</SectionTitle>
        <QueueSection>
          {exportQueue.map(item => (
            <QueueItem key={item.id}>
              <QueueHeader>
                <QueueName>{item.name}</QueueName>
                <QueueStatus $status={item.status as any}>
                  {item.status === 'completed' && <CheckCircle style={{ width: 14, height: 14 }} />}
                  {' '}{item.status}
                </QueueStatus>
              </QueueHeader>
              {item.status === 'processing' && (
                <ProgressBar>
                  <ProgressFill $progress={item.progress} />
                </ProgressBar>
              )}
            </QueueItem>
          ))}
        </QueueSection>
      </Section>
    </Container>
  );
};