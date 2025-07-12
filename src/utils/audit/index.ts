// src/utils/audit/index.ts
// SIGINT Audit System Barrel Export
// Comprehensive Signal Integrity Audit for TriSight Pattern Pipeline

export { 
  SignalIntegrityAudit, 
  executeSignalIntegrityAudit,
  type SignalIntegrityAuditReport,
  type DetectionAuditResult,
  type EmissionAuditResult,
  type RenderAuditResult,
  type DiffAnalysisResult
} from './SignalIntegrityAudit';

export {
  SignalIntegrityAuditExecutor,
  executeDefaultSIGINTAudit,
  executeSIGINTAuditFromConfig,
  type AuditConfiguration,
  type MultiTimeframeAuditReport
} from './SignalIntegrityAuditExecutor';

export {
  runSIGINTAuditDemo,
  demoSingleTimeframeAudit,
  demoMultiTimeframeAudit,
  demoPatternSpecificAnalysis,
  generateSampleMarketData,
  generatePatternedMarketData
} from './SignalIntegrityAuditDemo';
