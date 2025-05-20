import React, { useRef, useState } from 'react';
import styled from 'styled-components';
import { exportTrainingData, importTrainingData } from '../../utils/exportImport';

const Container = styled.div`
  margin: 20px 0;
  padding: 20px;
  background-color: #f5f5f5;
  border-radius: 5px;
  border-left: 4px solid #3498db;
`;

const Title = styled.h3`
  margin-top: 0;
  color: #2c3e50;
`;

const Description = styled.p`
  margin-bottom: 20px;
  color: #7f8c8d;
  font-size: 14px;
`;

const ButtonContainer = styled.div`
  display: flex;
  gap: 15px;
`;

const Button = styled.button<{ variant?: 'primary' | 'secondary' }>`
  padding: 8px 16px;
  background-color: ${props => props.variant === 'primary' ? '#3498db' : '#2ecc71'};
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-weight: 500;
  display: flex;
  align-items: center;
  gap: 8px;
  transition: all 0.2s ease;

  &:hover {
    background-color: ${props => props.variant === 'primary' ? '#2980b9' : '#27ae60'};
  }

  &:disabled {
    background-color: #95a5a6;
    cursor: not-allowed;
  }
`;

const FileInput = styled.input`
  display: none;
`;

const StatusMessage = styled.div<{ type: 'success' | 'error' | 'info' }>`
  margin-top: 15px;
  padding: 10px;
  border-radius: 4px;
  font-size: 14px;
  background-color: ${props => {
    switch (props.type) {
      case 'success': return '#d4edda';
      case 'error': return '#f8d7da';
      case 'info': return '#d1ecf1';
    }
  }};
  color: ${props => {
    switch (props.type) {
      case 'success': return '#155724';
      case 'error': return '#721c24';
      case 'info': return '#0c5460';
    }
  }};
`;

const DataExportImport: React.FC = () => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [status, setStatus] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);
  const [isImporting, setIsImporting] = useState(false);

  const handleExport = () => {
    try {
      exportTrainingData();
      setStatus({
        message: 'Training data exported successfully!',
        type: 'success'
      });
    } catch (error) {
      console.error('Export error:', error);
      setStatus({
        message: 'Failed to export training data. See console for details.',
        type: 'error'
      });
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsImporting(true);
    setStatus({
      message: 'Importing training data...',
      type: 'info'
    });

    try {
      const success = await importTrainingData(file);
      if (success) {
        setStatus({
          message: 'Training data imported successfully! Refresh the page to see the changes.',
          type: 'success'
        });
      } else {
        setStatus({
          message: 'Import cancelled.',
          type: 'info'
        });
      }
    } catch (error) {
      console.error('Import error:', error);
      setStatus({
        message: 'Failed to import training data. See console for details.',
        type: 'error'
      });
    } finally {
      setIsImporting(false);
      // Reset the file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  return (
    <Container>
      <Title>Training Data Management</Title>
      <Description>
        Export your pattern training data to share with others or backup for later use.
        You can also import training data from another Trisight instance.
      </Description>

      <ButtonContainer>
        <Button variant="primary" onClick={handleExport}>
          <span role="img" aria-label="Export">📤</span> Export Training Data
        </Button>
        <Button 
          variant="secondary" 
          onClick={triggerFileInput}
          disabled={isImporting}
        >
          <span role="img" aria-label="Import">📥</span> Import Training Data
        </Button>
        <FileInput 
          type="file" 
          ref={fileInputRef} 
          accept=".json" 
          onChange={handleFileChange} 
        />
      </ButtonContainer>

      {status && (
        <StatusMessage type={status.type}>
          {status.message}
        </StatusMessage>
      )}
    </Container>
  );
};

export default DataExportImport;
