// src/utils/auditLogger.ts
// JSON audit report download utility for TriSight pattern analysis
// Supports full trace audit of symbol → signal → row calculations

import { logDebug } from './debug';

/**
 * Downloads audit data as JSON file with timestamp
 * @param data - Object to serialize as JSON
 * @param filename - Target filename (optional)
 */
export const downloadAuditJSON = (data: any, filename?: string): void => {
  try {
    const jsonString = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = filename || `trisight_audit_${Date.now()}.json`;
    document.body.appendChild(link);
    link.click();
    
    // Cleanup
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    logDebug('DEBUG_AUDIT', `[AuditLogger] Downloaded audit report: ${link.download}`);
  } catch (error) {
    console.error('[AuditLogger] Failed to download audit JSON:', error);
  }
};

/**
 * Logs audit data to console in formatted way
 * @param data - Object to log
 * @param label - Optional label for the log
 */
export const logAuditData = (data: any, label: string = 'Audit Data'): void => {
  logDebug('DEBUG_AUDIT', `[AuditLogger] ${label}`, data);
};
