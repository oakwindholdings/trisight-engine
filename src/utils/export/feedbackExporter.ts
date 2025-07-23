// src/utils/export/feedbackExporter.ts
// Utility for exporting pattern feedback data for model training
// Generates formatted datasets for ML pipeline

import { supabase } from '../supabase/client';
import { PatternType } from '../../models/PatternTypes';
import { logDebug } from '../debug';

interface ExportOptions {
  startDate?: Date;
  endDate?: Date;
  patternTypes?: PatternType[];
  minAccuracy?: number;
  includeInvalid?: boolean;
  format?: 'json' | 'csv' | 'training';
}

interface TrainingDataPoint {
  patternId: string;
  patternType: string;
  accuracy: number;
  confidence: number;
  timing: string;
  isValid: boolean;
  invalidityReason?: string;
  suggestedAdjustments?: {
    startTimeDelta?: number; // ms difference
    endTimeDelta?: number;
    priceHighDelta?: number; // percentage difference
    priceLowDelta?: number;
  };
  technicalNotes?: string;
  marketContext?: string;
  correctedType?: string;
  feedbackTimestamp: string;
  sessionId: string;
}

/**
 * Export feedback data for model training
 */
export async function exportFeedbackData(options: ExportOptions = {}): Promise<string> {
  try {
    logDebug('feedback', '[FeedbackExporter] Exporting feedback data:', options);
    
    if (!supabase) {
      throw new Error('Supabase client not initialized');
    }
    
    // Build query
    let query = supabase
      .from('pattern_feedback')
      .select('*')
      .eq('consent_given', true) // Only export consented data
      .order('created_at', { ascending: false });
    
    // Apply filters
    if (options.startDate) {
      query = query.gte('created_at', options.startDate.toISOString());
    }
    if (options.endDate) {
      query = query.lte('created_at', options.endDate.toISOString());
    }
    if (options.patternTypes?.length) {
      query = query.in('pattern_type', options.patternTypes);
    }
    if (options.minAccuracy) {
      query = query.gte('accuracy', options.minAccuracy);
    }
    if (!options.includeInvalid) {
      query = query.eq('is_valid', true);
    }
    
    const { data, error } = await query;
    
    if (error) {
      throw new Error(`Failed to fetch feedback data: ${error.message}`);
    }
    
    // Format based on requested format
    switch (options.format) {
      case 'csv':
        return formatAsCSV(data || []);
      case 'training':
        return formatAsTrainingData(data || []);
      default:
        return JSON.stringify(data || [], null, 2);
    }
  } catch (error) {
    console.error('[FeedbackExporter] Export error:', error);
    throw error;
  }
}

/**
 * Format feedback as CSV
 */
function formatAsCSV(data: any[]): string {
  if (data.length === 0) return '';
  
  // Define columns
  const columns = [
    'pattern_id',
    'pattern_type',
    'accuracy',
    'confidence',
    'timing',
    'is_valid',
    'invalidity_reason',
    'notes',
    'suggested_start_time',
    'suggested_end_time',
    'suggested_price_high',
    'suggested_price_low',
    'created_at',
    'session_id'
  ];
  
  // Create header
  const header = columns.join(',');
  
  // Create rows
  const rows = data.map(row => {
    return columns.map(col => {
      const value = row[col];
      if (value === null || value === undefined) return '';
      if (typeof value === 'string' && value.includes(',')) {
        return `"${value.replace(/"/g, '""')}"`;
      }
      return value;
    }).join(',');
  });
  
  return [header, ...rows].join('\n');
}

/**
 * Format feedback as training data with calculated deltas
 */
function formatAsTrainingData(data: any[]): string {
  const trainingData: TrainingDataPoint[] = data.map(row => {
    const point: TrainingDataPoint = {
      patternId: row.pattern_id,
      patternType: row.pattern_type,
      accuracy: row.accuracy,
      confidence: row.confidence,
      timing: row.timing,
      isValid: row.is_valid,
      invalidityReason: row.invalidity_reason,
      feedbackTimestamp: row.created_at,
      sessionId: row.session_id
    };
    
    // Extract technical and market context from notes
    if (row.notes) {
      const technicalMatch = row.notes.match(/Technical: ([^\n]+)/);
      const marketMatch = row.notes.match(/Market Context: ([^\n]+)/);
      
      if (technicalMatch) {
        point.technicalNotes = technicalMatch[1];
      }
      if (marketMatch) {
        point.marketContext = marketMatch[1];
      }
    }
    
    // Note: Calculating deltas would require fetching original pattern data
    // This is left as a TODO for the actual implementation
    
    return point;
  });
  
  return JSON.stringify(trainingData, null, 2);
}

/**
 * Get feedback statistics for analysis
 */
export async function getFeedbackStatistics(): Promise<{
  totalFeedbacks: number;
  byPatternType: Record<string, number>;
  averageAccuracy: number;
  validityRate: number;
  topContributors: Array<{ sessionId: string; count: number }>;
}> {
  try {
    if (!supabase) {
      throw new Error('Supabase client not initialized');
    }
    
    const { data, error } = await supabase
      .from('pattern_feedback')
      .select('pattern_type, accuracy, is_valid, session_id')
      .eq('consent_given', true);
    
    if (error) {
      throw new Error(`Failed to fetch feedback statistics: ${error.message}`);
    }
    
    const feedbacks = data || [];
    
    // Calculate statistics
    const byPatternType: Record<string, number> = {};
    const sessionCounts: Record<string, number> = {};
    let totalAccuracy = 0;
    let validCount = 0;
    
    feedbacks.forEach(fb => {
      // Pattern type counts
      byPatternType[fb.pattern_type] = (byPatternType[fb.pattern_type] || 0) + 1;
      
      // Session counts
      sessionCounts[fb.session_id] = (sessionCounts[fb.session_id] || 0) + 1;
      
      // Accuracy
      totalAccuracy += fb.accuracy;
      
      // Validity
      if (fb.is_valid) validCount++;
    });
    
    // Top contributors
    const topContributors = Object.entries(sessionCounts)
      .map(([sessionId, count]) => ({ sessionId, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
    
    return {
      totalFeedbacks: feedbacks.length,
      byPatternType,
      averageAccuracy: feedbacks.length > 0 ? totalAccuracy / feedbacks.length : 0,
      validityRate: feedbacks.length > 0 ? validCount / feedbacks.length : 0,
      topContributors
    };
  } catch (error) {
    console.error('[FeedbackExporter] Statistics error:', error);
    throw error;
  }
}

/**
 * Download feedback data as file
 */
export async function downloadFeedbackData(options: ExportOptions = {}): Promise<void> {
  try {
    const data = await exportFeedbackData(options);
    const filename = `pattern_feedback_${new Date().toISOString().split('T')[0]}.${options.format || 'json'}`;
    
    const blob = new Blob([data], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    logDebug('feedback', '[FeedbackExporter] Downloaded feedback data:', filename);
  } catch (error) {
    console.error('[FeedbackExporter] Download error:', error);
    throw error;
  }
} 