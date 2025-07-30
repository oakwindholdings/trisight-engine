// src/components/Reports/ExportModal.tsx
// Export options modal for generated reports
// Context: Allows users to export reports in various formats

import React, { useState } from 'react';
import styled from 'styled-components';
import { X, FileText, Presentation, Image, FileSpreadsheet, Download, Check } from 'lucide-react';

const ModalOverlay = styled.div`
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
`;

const ModalContainer = styled.div`
  background: white;
  border-radius: 0.75rem;
  width: 90%;
  max-width: 600px;
  max-height: 90vh;
  overflow: hidden;
  display: flex;
  flex-direction: column;
`;

const ModalHeader = styled.div`
  padding: 1.5rem;
  border-bottom: 1px solid #e5e7eb;
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const ModalTitle = styled.h2`
  font-size: 1.25rem;
  font-weight: 600;
  color: #1e293b;
`;

const CloseButton = styled.button`
  background: none;
  border: none;
  padding: 0.5rem;
  cursor: pointer;
  color: #6b7280;
  border-radius: 0.375rem;
  transition: all 0.2s ease;
  
  &:hover {
    background: #f3f4f6;
    color: #374151;
  }
`;

const ModalContent = styled.div`
  padding: 1.5rem;
  overflow-y: auto;
  flex: 1;
`;

const FormatGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 1rem;
  margin-bottom: 1.5rem;
`;

const FormatCard = styled.button<{ $selected: boolean }>`
  padding: 1.5rem;
  border: 2px solid ${props => props.$selected ? '#3b82f6' : '#e5e7eb'};
  background: ${props => props.$selected ? '#eff6ff' : 'white'};
  border-radius: 0.5rem;
  cursor: pointer;
  transition: all 0.2s ease;
  position: relative;
  
  &:hover {
    border-color: ${props => props.$selected ? '#3b82f6' : '#d1d5db'};
    background: ${props => props.$selected ? '#eff6ff' : '#f9fafb'};
  }
`;

const FormatIcon = styled.div<{ $color: string }>`
  width: 48px;
  height: 48px;
  background: ${props => props.$color}22;
  border-radius: 0.5rem;
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

const FormatName = styled.div`
  font-weight: 600;
  color: #1e293b;
  margin-bottom: 0.25rem;
`;

const FormatDescription = styled.div`
  font-size: 0.813rem;
  color: #6b7280;
  text-align: left;
`;

const SelectedBadge = styled.div`
  position: absolute;
  top: 0.75rem;
  right: 0.75rem;
  width: 20px;
  height: 20px;
  background: #3b82f6;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  
  svg {
    width: 12px;
    height: 12px;
    color: white;
  }
`;

const OptionsSection = styled.div`
  border-top: 1px solid #e5e7eb;
  padding-top: 1.5rem;
`;

const OptionLabel = styled.label`
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 1rem;
  cursor: pointer;
  
  input {
    width: 16px;
    height: 16px;
    cursor: pointer;
  }
  
  span {
    font-size: 0.875rem;
    color: #374151;
  }
`;

const ModalFooter = styled.div`
  padding: 1.5rem;
  border-top: 1px solid #e5e7eb;
  display: flex;
  justify-content: flex-end;
  gap: 0.75rem;
`;

const Button = styled.button<{ $variant?: 'primary' | 'secondary' }>`
  padding: 0.625rem 1.25rem;
  border-radius: 0.375rem;
  font-weight: 500;
  font-size: 0.875rem;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  
  ${props => props.$variant === 'primary' ? `
    background: #3b82f6;
    color: white;
    border: none;
    
    &:hover {
      background: #2563eb;
    }
  ` : `
    background: white;
    color: #374151;
    border: 1px solid #d1d5db;
    
    &:hover {
      background: #f9fafb;
    }
  `}
`;

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  reportData: any;
}

export const ExportModal: React.FC<ExportModalProps> = ({
  isOpen,
  onClose,
  reportData
}) => {
  const [selectedFormat, setSelectedFormat] = useState('pdf');
  const [includeCharts, setIncludeCharts] = useState(true);
  const [includeAppendix, setIncludeAppendix] = useState(false);
  const [includeTimestamp, setIncludeTimestamp] = useState(true);
  
  if (!isOpen) return null;
  
  const formats = [
    {
      id: 'pdf',
      name: 'PDF Document',
      description: 'Best for sharing and printing',
      icon: FileText,
      color: '#ef4444'
    },
    {
      id: 'pptx',
      name: 'PowerPoint',
      description: 'Editable presentation format',
      icon: Presentation,
      color: '#f59e0b'
    },
    {
      id: 'png',
      name: 'Image (PNG)',
      description: 'High-quality screenshots',
      icon: Image,
      color: '#10b981'
    },
    {
      id: 'xlsx',
      name: 'Excel Spreadsheet',
      description: 'Data tables and analytics',
      icon: FileSpreadsheet,
      color: '#8b5cf6'
    }
  ];
  
  const handleExport = () => {
    // Simulate export
    console.log('Exporting as:', selectedFormat, {
      includeCharts,
      includeAppendix,
      includeTimestamp
    });
    
    // Close modal after brief delay
    setTimeout(() => {
      onClose();
    }, 1000);
  };
  
  return (
    <ModalOverlay onClick={onClose}>
      <ModalContainer onClick={e => e.stopPropagation()}>
        <ModalHeader>
          <ModalTitle>Export Report</ModalTitle>
          <CloseButton onClick={onClose}>
            <X />
          </CloseButton>
        </ModalHeader>
        
        <ModalContent>
          <FormatGrid>
            {formats.map(format => {
              const Icon = format.icon;
              return (
                <FormatCard
                  key={format.id}
                  $selected={selectedFormat === format.id}
                  onClick={() => setSelectedFormat(format.id)}
                >
                  {selectedFormat === format.id && (
                    <SelectedBadge>
                      <Check />
                    </SelectedBadge>
                  )}
                  <FormatIcon $color={format.color}>
                    <Icon />
                  </FormatIcon>
                  <FormatName>{format.name}</FormatName>
                  <FormatDescription>{format.description}</FormatDescription>
                </FormatCard>
              );
            })}
          </FormatGrid>
          
          <OptionsSection>
            <OptionLabel>
              <input
                type="checkbox"
                checked={includeCharts}
                onChange={e => setIncludeCharts(e.target.checked)}
              />
              <span>Include charts and visualizations</span>
            </OptionLabel>
            
            <OptionLabel>
              <input
                type="checkbox"
                checked={includeAppendix}
                onChange={e => setIncludeAppendix(e.target.checked)}
              />
              <span>Include data appendix</span>
            </OptionLabel>
            
            <OptionLabel>
              <input
                type="checkbox"
                checked={includeTimestamp}
                onChange={e => setIncludeTimestamp(e.target.checked)}
              />
              <span>Add generation timestamp</span>
            </OptionLabel>
          </OptionsSection>
        </ModalContent>
        
        <ModalFooter>
          <Button onClick={onClose}>
            Cancel
          </Button>
          <Button $variant="primary" onClick={handleExport}>
            <Download />
            Export Report
          </Button>
        </ModalFooter>
      </ModalContainer>
    </ModalOverlay>
  );
};