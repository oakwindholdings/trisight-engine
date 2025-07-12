// src/components/Testing/TargetsTabAuditRunner.tsx
// Live Targets Tab Audit Runner Component
// Executes real-time diagnostic and generates downloadable audit report

import React, { useState } from 'react';
import styled from 'styled-components';
import { runTargetsTabDiagnostic } from '../../utils/audit/TargetsTabDiagnostic';

const AuditContainer = styled.div`
  padding: 24px;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  margin: 16px;
  font-family: 'Inter', sans-serif;
`;

const AuditButton = styled.button`
  background: #dc2626;
  color: white;
  padding: 12px 24px;
  border: none;
  border-radius: 6px;
  font-weight: 600;
  cursor: pointer;
  font-size: 14px;
  
  &:hover {
    background: #b91c1c;
  }
  
  &:disabled {
    background: #9ca3af;
    cursor: not-allowed;
  }
`;

const StatusMessage = styled.div<{ type: 'info' | 'success' | 'error' | 'warning' }>`
  padding: 12px;
  margin: 8px 0;
  border-radius: 4px;
  font-size: 13px;
  
  ${props => {
    switch (props.type) {
      case 'info':
        return 'background: #dbeafe; color: #1e40af; border-left: 4px solid #3b82f6;';
      case 'success':
        return 'background: #dcfce7; color: #166534; border-left: 4px solid #22c55e;';
      case 'error':
        return 'background: #fee2e2; color: #dc2626; border-left: 4px solid #ef4444;';
      case 'warning':
        return 'background: #fef3c7; color: #d97706; border-left: 4px solid #f59e0b;';
    }
  }}
`;

const ResultsPanel = styled.div`
  background: white;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  padding: 16px;
  margin-top: 16px;
  max-height: 400px;
  overflow-y: auto;
  font-family: 'Fira Code', monospace;
  font-size: 12px;
`;

export const TargetsTabAuditRunner: React.FC = () => {
  const [isRunning, setIsRunning] = useState(false);
  const [auditResults, setAuditResults] = useState<any>(null);
  const [statusMessages, setStatusMessages] = useState<Array<{type: string, message: string}>>([]);

  const addStatusMessage = (type: 'info' | 'success' | 'error' | 'warning', message: string) => {
    setStatusMessages(prev => [...prev, { type, message }]);
  };

  const runAudit = async () => {
    setIsRunning(true);
    setStatusMessages([]);
    setAuditResults(null);
    
    addStatusMessage('info', 'Starting comprehensive Targets Tab pipeline audit...');
    
    try {
      addStatusMessage('info', 'Step 1: Validating symbol input parsing...');
      addStatusMessage('info', 'Step 2: Testing Signal Scanner execution...');
      addStatusMessage('info', 'Step 3: Verifying signal rendering in TargetReportTable...');
      addStatusMessage('info', 'Step 4: Checking Table UI functionality...');
      addStatusMessage('info', 'Step 5: Testing row → chart sync...');
      
      const results = await runTargetsTabDiagnostic();
      setAuditResults(results);
      
      // Analyze results and provide status updates
      if (results.breakagePoints.length === 0) {
        addStatusMessage('success', '✅ All pipeline steps passed! Targets Tab is functioning correctly.');
      } else {
        addStatusMessage('error', `❌ ${results.breakagePoints.length} breakage point(s) identified:`);
        results.breakagePoints.forEach((breakage: string) => {
          addStatusMessage('error', `• ${breakage}`);
        });
      }
      
      if (results.recommendations.length > 0) {
        addStatusMessage('warning', 'Recommendations for fixes:');
        results.recommendations.forEach((rec: string) => {
          addStatusMessage('warning', `• ${rec}`);
        });
      }
      
      addStatusMessage('success', 'Audit completed successfully. Results downloaded as JSON file.');
      
    } catch (error) {
      addStatusMessage('error', `Fatal audit error: ${error}`);
      console.error('[TargetsTabAuditRunner] Audit failed:', error);
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <AuditContainer>
      <h2 style={{ margin: '0 0 16px 0', color: '#1e293b', fontSize: '18px' }}>
        🔍 TriSight Targets Tab Pipeline Audit
      </h2>
      
      <p style={{ margin: '0 0 16px 0', color: '#64748b', fontSize: '14px' }}>
        Comprehensive diagnostic to identify breakages in the import → scan → render → route pipeline.
        Tests with symbols: AAPL, NVDA, TSLA, and "Meta Platforms Inc." (invalid format).
      </p>
      
      <AuditButton onClick={runAudit} disabled={isRunning}>
        {isRunning ? '🔄 Running Audit...' : '🚀 Run Full Diagnostic'}
      </AuditButton>
      
      {statusMessages.map((msg, index) => (
        <StatusMessage key={index} type={msg.type as any}>
          {msg.message}
        </StatusMessage>
      ))}
      
      {auditResults && (
        <ResultsPanel>
          <h3 style={{ margin: '0 0 12px 0', color: '#374151' }}>Audit Results Summary</h3>
          <pre style={{ margin: 0, whiteSpace: 'pre-wrap' }}>
            {JSON.stringify(auditResults, null, 2)}
          </pre>
        </ResultsPanel>
      )}
      
      <div style={{ marginTop: '16px', padding: '12px', background: '#f1f5f9', borderRadius: '4px' }}>
        <h4 style={{ margin: '0 0 8px 0', color: '#475569', fontSize: '14px' }}>Expected Pipeline Flow:</h4>
        <div style={{ fontSize: '12px', color: '#64748b', fontFamily: 'monospace' }}>
          Excel Import → Symbol Cleaning → useSignalScanner → Pattern Detection → 
          Signal Generation → TargetReportTable → Row Rendering → Chart Navigation
        </div>
      </div>
    </AuditContainer>
  );
};

export default TargetsTabAuditRunner;
