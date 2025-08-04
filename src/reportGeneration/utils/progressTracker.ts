// src/reportGeneration/utils/progressTracker.ts
// Real-time progress tracking for report generation
// Context: Provides granular progress updates and time estimation

import { ProcessingStatus } from '../models/reportTypes';
import { logDebug } from '../../utils/logger';

export interface ProgressStep {
  id: string;
  name: string;
  weight: number; // Relative weight in overall progress
  status: 'pending' | 'in-progress' | 'completed' | 'failed' | 'skipped';
  startTime?: number;
  endTime?: number;
  subSteps?: ProgressStep[];
  error?: Error;
}

export interface ProgressUpdate {
  stage: ProcessingStatus['stage'];
  progress: number;
  currentTask: string;
  estimatedTimeRemaining?: number;
  completedSteps: number;
  totalSteps: number;
}

export type ProgressCallback = (update: ProgressUpdate) => void;

/**
 * Advanced progress tracker with time estimation and granular updates
 */
export class ProgressTracker {
  private steps: Map<string, ProgressStep> = new Map();
  private startTime: number = Date.now();
  private callbacks: Set<ProgressCallback> = new Set();
  private currentStage: ProcessingStatus['stage'] = 'fetching';
  private aborted: boolean = false;

  constructor() {
    this.initializeSteps();
  }

  /**
   * Initialize the standard report generation steps
   */
  private initializeSteps(): void {
    const steps: ProgressStep[] = [
      {
        id: 'fetch-data',
        name: 'Fetching Data',
        weight: 25,
        status: 'pending',
        subSteps: [
          { id: 'fetch-quote', name: 'Fetch market quote', weight: 2, status: 'pending' },
          { id: 'fetch-fundamentals', name: 'Fetch fundamentals', weight: 5, status: 'pending' },
          { id: 'fetch-historical', name: 'Fetch historical prices', weight: 3, status: 'pending' },
          { id: 'fetch-earnings', name: 'Fetch earnings data', weight: 3, status: 'pending' },
          { id: 'fetch-technicals', name: 'Fetch technical indicators', weight: 3, status: 'pending' },
          { id: 'fetch-news', name: 'Fetch news articles', weight: 4, status: 'pending' },
          { id: 'fetch-analysts', name: 'Fetch analyst data', weight: 3, status: 'pending' },
          { id: 'fetch-transcripts', name: 'Fetch earnings transcripts', weight: 2, status: 'pending' }
        ]
      },
      {
        id: 'process-data',
        name: 'Processing Data',
        weight: 25,
        status: 'pending',
        subSteps: [
          { id: 'validate-data', name: 'Validate data quality', weight: 2, status: 'pending' },
          { id: 'calculate-growth', name: 'Calculate growth metrics', weight: 4, status: 'pending' },
          { id: 'calculate-valuation', name: 'Calculate valuation metrics', weight: 4, status: 'pending' },
          { id: 'calculate-risk', name: 'Calculate risk metrics', weight: 4, status: 'pending' },
          { id: 'calculate-quality', name: 'Calculate quality scores', weight: 4, status: 'pending' },
          { id: 'detect-patterns', name: 'Detect price patterns', weight: 3, status: 'pending' },
          { id: 'analyze-sentiment', name: 'Analyze sentiment', weight: 2, status: 'pending' },
          { id: 'peer-comparison', name: 'Compare with peers', weight: 2, status: 'pending' }
        ]
      },
      {
        id: 'generate-content',
        name: 'Generating Content',
        weight: 30,
        status: 'pending',
        subSteps: [
          { id: 'gen-executive-summary', name: 'Generate executive summary', weight: 5, status: 'pending' },
          { id: 'gen-financial-analysis', name: 'Generate financial analysis', weight: 5, status: 'pending' },
          { id: 'gen-technical-analysis', name: 'Generate technical analysis', weight: 4, status: 'pending' },
          { id: 'gen-risk-assessment', name: 'Generate risk assessment', weight: 4, status: 'pending' },
          { id: 'gen-investment-thesis', name: 'Generate investment thesis', weight: 4, status: 'pending' },
          { id: 'gen-recommendations', name: 'Generate recommendations', weight: 4, status: 'pending' },
          { id: 'gen-appendix', name: 'Generate appendix', weight: 2, status: 'pending' },
          { id: 'gen-disclaimers', name: 'Generate disclaimers', weight: 2, status: 'pending' }
        ]
      },
      {
        id: 'assemble-report',
        name: 'Assembling Report',
        weight: 20,
        status: 'pending',
        subSteps: [
          { id: 'gen-charts', name: 'Generate charts', weight: 8, status: 'pending' },
          { id: 'create-slides', name: 'Create presentation slides', weight: 4, status: 'pending' },
          { id: 'format-content', name: 'Format content', weight: 3, status: 'pending' },
          { id: 'gen-pdf', name: 'Generate PDF', weight: 3, status: 'pending' },
          { id: 'save-output', name: 'Save output files', weight: 2, status: 'pending' }
        ]
      }
    ];

    steps.forEach(step => this.steps.set(step.id, step));
  }

  /**
   * Register a progress callback
   */
  onProgress(callback: ProgressCallback): () => void {
    this.callbacks.add(callback);
    // Return unsubscribe function
    return () => this.callbacks.delete(callback);
  }

  /**
   * Start tracking a major step
   */
  startStep(stepId: string): void {
    if (this.aborted) return;

    const step = this.steps.get(stepId);
    if (!step) {
      logDebug('ProgressTracker', `Unknown step: ${stepId}`);
      return;
    }

    step.status = 'in-progress';
    step.startTime = Date.now();
    
    // Update stage based on step
    if (stepId === 'fetch-data') this.currentStage = 'fetching';
    else if (stepId === 'process-data') this.currentStage = 'processing';
    else if (stepId === 'generate-content') this.currentStage = 'generating';
    else if (stepId === 'assemble-report') this.currentStage = 'assembling';

    this.emitProgress();
  }

  /**
   * Start tracking a sub-step
   */
  startSubStep(parentId: string, subStepId: string): void {
    if (this.aborted) return;

    const parent = this.steps.get(parentId);
    if (!parent || !parent.subSteps) return;

    const subStep = parent.subSteps.find(s => s.id === subStepId);
    if (!subStep) return;

    subStep.status = 'in-progress';
    subStep.startTime = Date.now();
    
    this.emitProgress();
  }

  /**
   * Complete a sub-step
   */
  completeSubStep(parentId: string, subStepId: string): void {
    if (this.aborted) return;

    const parent = this.steps.get(parentId);
    if (!parent || !parent.subSteps) return;

    const subStep = parent.subSteps.find(s => s.id === subStepId);
    if (!subStep) return;

    subStep.status = 'completed';
    subStep.endTime = Date.now();
    
    // Check if parent step is complete
    const allSubStepsComplete = parent.subSteps.every(
      s => s.status === 'completed' || s.status === 'skipped'
    );
    
    if (allSubStepsComplete && parent.status === 'in-progress') {
      this.completeStep(parentId);
    } else {
      this.emitProgress();
    }
  }

  /**
   * Skip a sub-step
   */
  skipSubStep(parentId: string, subStepId: string): void {
    if (this.aborted) return;

    const parent = this.steps.get(parentId);
    if (!parent || !parent.subSteps) return;

    const subStep = parent.subSteps.find(s => s.id === subStepId);
    if (!subStep) return;

    subStep.status = 'skipped';
    
    this.emitProgress();
  }

  /**
   * Fail a sub-step
   */
  failSubStep(parentId: string, subStepId: string, error: Error): void {
    if (this.aborted) return;

    const parent = this.steps.get(parentId);
    if (!parent || !parent.subSteps) return;

    const subStep = parent.subSteps.find(s => s.id === subStepId);
    if (!subStep) return;

    subStep.status = 'failed';
    subStep.error = error;
    subStep.endTime = Date.now();
    
    this.emitProgress();
  }

  /**
   * Complete a major step
   */
  completeStep(stepId: string): void {
    if (this.aborted) return;

    const step = this.steps.get(stepId);
    if (!step) return;

    step.status = 'completed';
    step.endTime = Date.now();
    
    // Check if all steps are complete
    const allComplete = Array.from(this.steps.values()).every(
      s => s.status === 'completed' || s.status === 'skipped'
    );
    
    if (allComplete) {
      this.currentStage = 'complete';
    }
    
    this.emitProgress();
  }

  /**
   * Calculate overall progress percentage
   */
  private calculateProgress(): number {
    let totalWeight = 0;
    let completedWeight = 0;

    this.steps.forEach(step => {
      totalWeight += step.weight;
      
      if (step.status === 'completed' || step.status === 'skipped') {
        completedWeight += step.weight;
      } else if (step.status === 'in-progress' && step.subSteps) {
        // Calculate partial progress for in-progress steps
        const subStepProgress = this.calculateSubStepProgress(step);
        completedWeight += step.weight * subStepProgress;
      }
    });

    return Math.round((completedWeight / totalWeight) * 100);
  }

  /**
   * Calculate progress within a step based on sub-steps
   */
  private calculateSubStepProgress(step: ProgressStep): number {
    if (!step.subSteps || step.subSteps.length === 0) return 0;

    const totalSubWeight = step.subSteps.reduce((sum, s) => sum + s.weight, 0);
    const completedSubWeight = step.subSteps.reduce((sum, s) => {
      if (s.status === 'completed' || s.status === 'skipped') {
        return sum + s.weight;
      }
      return sum;
    }, 0);

    return completedSubWeight / totalSubWeight;
  }

  /**
   * Estimate time remaining based on completed steps
   */
  private estimateTimeRemaining(): number | undefined {
    const completedSteps = Array.from(this.steps.values()).filter(
      s => s.status === 'completed' && s.startTime && s.endTime
    );

    if (completedSteps.length === 0) return undefined;

    // Calculate average time per weight unit
    const totalCompletedWeight = completedSteps.reduce((sum, s) => sum + s.weight, 0);
    const totalCompletedTime = completedSteps.reduce(
      (sum, s) => sum + (s.endTime! - s.startTime!), 0
    );
    
    if (totalCompletedWeight === 0) return undefined;

    const timePerWeight = totalCompletedTime / totalCompletedWeight;
    
    // Calculate remaining weight
    const remainingWeight = Array.from(this.steps.values())
      .filter(s => s.status === 'pending' || s.status === 'in-progress')
      .reduce((sum, s) => sum + s.weight, 0);

    return Math.round(timePerWeight * remainingWeight);
  }

  /**
   * Get current task description
   */
  private getCurrentTask(): string {
    // Find the most recent in-progress sub-step
    for (const step of this.steps.values()) {
      if (step.status === 'in-progress' && step.subSteps) {
        const activeSubStep = step.subSteps.find(s => s.status === 'in-progress');
        if (activeSubStep) {
          return activeSubStep.name;
        }
      }
    }

    // Fall back to the in-progress major step
    const activeStep = Array.from(this.steps.values()).find(s => s.status === 'in-progress');
    return activeStep?.name || 'Initializing...';
  }

  /**
   * Emit progress update to all listeners
   */
  private emitProgress(): void {
    const progress = this.calculateProgress();
    const { completed, total } = this.getStepCounts();
    
    const update: ProgressUpdate = {
      stage: this.currentStage,
      progress,
      currentTask: this.getCurrentTask(),
      estimatedTimeRemaining: this.estimateTimeRemaining(),
      completedSteps: completed,
      totalSteps: total
    };

    logDebug('ProgressTracker', `Progress: ${progress}% - ${update.currentTask}`);
    
    this.callbacks.forEach(callback => {
      try {
        callback(update);
      } catch (error) {
        logDebug('ProgressTracker', `Callback error: ${error}`);
      }
    });
  }

  /**
   * Get step counts
   */
  private getStepCounts(): { completed: number; total: number } {
    let completed = 0;
    let total = 0;

    this.steps.forEach(step => {
      if (step.subSteps) {
        total += step.subSteps.length;
        completed += step.subSteps.filter(
          s => s.status === 'completed' || s.status === 'skipped'
        ).length;
      } else {
        total += 1;
        if (step.status === 'completed' || step.status === 'skipped') {
          completed += 1;
        }
      }
    });

    return { completed, total };
  }

  /**
   * Abort tracking
   */
  abort(): void {
    this.aborted = true;
    this.currentStage = 'error';
    this.emitProgress();
  }

  /**
   * Reset tracker for new report
   */
  reset(): void {
    this.aborted = false;
    this.startTime = Date.now();
    this.currentStage = 'fetching';
    this.steps.clear();
    this.initializeSteps();
    this.emitProgress();
  }
}