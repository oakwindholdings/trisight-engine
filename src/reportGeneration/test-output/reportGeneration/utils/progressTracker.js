"use strict";
// src/reportGeneration/utils/progressTracker.ts
// Real-time progress tracking for report generation
// Context: Provides granular progress updates and time estimation
exports.__esModule = true;
exports.ProgressTracker = void 0;
var logger_1 = require("../../utils/logger");
/**
 * Advanced progress tracker with time estimation and granular updates
 */
var ProgressTracker = /** @class */ (function () {
    function ProgressTracker() {
        this.steps = new Map();
        this.startTime = Date.now();
        this.callbacks = new Set();
        this.currentStage = 'fetching';
        this.aborted = false;
        this.initializeSteps();
    }
    /**
     * Initialize the standard report generation steps
     */
    ProgressTracker.prototype.initializeSteps = function () {
        var _this = this;
        var steps = [
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
        steps.forEach(function (step) { return _this.steps.set(step.id, step); });
    };
    /**
     * Register a progress callback
     */
    ProgressTracker.prototype.onProgress = function (callback) {
        var _this = this;
        this.callbacks.add(callback);
        // Return unsubscribe function
        return function () { return _this.callbacks["delete"](callback); };
    };
    /**
     * Start tracking a major step
     */
    ProgressTracker.prototype.startStep = function (stepId) {
        if (this.aborted)
            return;
        var step = this.steps.get(stepId);
        if (!step) {
            (0, logger_1.logDebug)('ProgressTracker', "Unknown step: ".concat(stepId));
            return;
        }
        step.status = 'in-progress';
        step.startTime = Date.now();
        // Update stage based on step
        if (stepId === 'fetch-data')
            this.currentStage = 'fetching';
        else if (stepId === 'process-data')
            this.currentStage = 'processing';
        else if (stepId === 'generate-content')
            this.currentStage = 'generating';
        else if (stepId === 'assemble-report')
            this.currentStage = 'assembling';
        this.emitProgress();
    };
    /**
     * Start tracking a sub-step
     */
    ProgressTracker.prototype.startSubStep = function (parentId, subStepId) {
        if (this.aborted)
            return;
        var parent = this.steps.get(parentId);
        if (!parent || !parent.subSteps)
            return;
        var subStep = parent.subSteps.find(function (s) { return s.id === subStepId; });
        if (!subStep)
            return;
        subStep.status = 'in-progress';
        subStep.startTime = Date.now();
        this.emitProgress();
    };
    /**
     * Complete a sub-step
     */
    ProgressTracker.prototype.completeSubStep = function (parentId, subStepId) {
        if (this.aborted)
            return;
        var parent = this.steps.get(parentId);
        if (!parent || !parent.subSteps)
            return;
        var subStep = parent.subSteps.find(function (s) { return s.id === subStepId; });
        if (!subStep)
            return;
        subStep.status = 'completed';
        subStep.endTime = Date.now();
        // Check if parent step is complete
        var allSubStepsComplete = parent.subSteps.every(function (s) { return s.status === 'completed' || s.status === 'skipped'; });
        if (allSubStepsComplete && parent.status === 'in-progress') {
            this.completeStep(parentId);
        }
        else {
            this.emitProgress();
        }
    };
    /**
     * Skip a sub-step
     */
    ProgressTracker.prototype.skipSubStep = function (parentId, subStepId) {
        if (this.aborted)
            return;
        var parent = this.steps.get(parentId);
        if (!parent || !parent.subSteps)
            return;
        var subStep = parent.subSteps.find(function (s) { return s.id === subStepId; });
        if (!subStep)
            return;
        subStep.status = 'skipped';
        this.emitProgress();
    };
    /**
     * Fail a sub-step
     */
    ProgressTracker.prototype.failSubStep = function (parentId, subStepId, error) {
        if (this.aborted)
            return;
        var parent = this.steps.get(parentId);
        if (!parent || !parent.subSteps)
            return;
        var subStep = parent.subSteps.find(function (s) { return s.id === subStepId; });
        if (!subStep)
            return;
        subStep.status = 'failed';
        subStep.error = error;
        subStep.endTime = Date.now();
        this.emitProgress();
    };
    /**
     * Complete a major step
     */
    ProgressTracker.prototype.completeStep = function (stepId) {
        if (this.aborted)
            return;
        var step = this.steps.get(stepId);
        if (!step)
            return;
        step.status = 'completed';
        step.endTime = Date.now();
        // Check if all steps are complete
        var allComplete = Array.from(this.steps.values()).every(function (s) { return s.status === 'completed' || s.status === 'skipped'; });
        if (allComplete) {
            this.currentStage = 'complete';
        }
        this.emitProgress();
    };
    /**
     * Calculate overall progress percentage
     */
    ProgressTracker.prototype.calculateProgress = function () {
        var _this = this;
        var totalWeight = 0;
        var completedWeight = 0;
        this.steps.forEach(function (step) {
            totalWeight += step.weight;
            if (step.status === 'completed' || step.status === 'skipped') {
                completedWeight += step.weight;
            }
            else if (step.status === 'in-progress' && step.subSteps) {
                // Calculate partial progress for in-progress steps
                var subStepProgress = _this.calculateSubStepProgress(step);
                completedWeight += step.weight * subStepProgress;
            }
        });
        return Math.round((completedWeight / totalWeight) * 100);
    };
    /**
     * Calculate progress within a step based on sub-steps
     */
    ProgressTracker.prototype.calculateSubStepProgress = function (step) {
        if (!step.subSteps || step.subSteps.length === 0)
            return 0;
        var totalSubWeight = step.subSteps.reduce(function (sum, s) { return sum + s.weight; }, 0);
        var completedSubWeight = step.subSteps.reduce(function (sum, s) {
            if (s.status === 'completed' || s.status === 'skipped') {
                return sum + s.weight;
            }
            return sum;
        }, 0);
        return completedSubWeight / totalSubWeight;
    };
    /**
     * Estimate time remaining based on completed steps
     */
    ProgressTracker.prototype.estimateTimeRemaining = function () {
        var completedSteps = Array.from(this.steps.values()).filter(function (s) { return s.status === 'completed' && s.startTime && s.endTime; });
        if (completedSteps.length === 0)
            return undefined;
        // Calculate average time per weight unit
        var totalCompletedWeight = completedSteps.reduce(function (sum, s) { return sum + s.weight; }, 0);
        var totalCompletedTime = completedSteps.reduce(function (sum, s) { return sum + (s.endTime - s.startTime); }, 0);
        if (totalCompletedWeight === 0)
            return undefined;
        var timePerWeight = totalCompletedTime / totalCompletedWeight;
        // Calculate remaining weight
        var remainingWeight = Array.from(this.steps.values())
            .filter(function (s) { return s.status === 'pending' || s.status === 'in-progress'; })
            .reduce(function (sum, s) { return sum + s.weight; }, 0);
        return Math.round(timePerWeight * remainingWeight);
    };
    /**
     * Get current task description
     */
    ProgressTracker.prototype.getCurrentTask = function () {
        // Find the most recent in-progress sub-step
        for (var _i = 0, _a = this.steps.values(); _i < _a.length; _i++) {
            var step = _a[_i];
            if (step.status === 'in-progress' && step.subSteps) {
                var activeSubStep = step.subSteps.find(function (s) { return s.status === 'in-progress'; });
                if (activeSubStep) {
                    return activeSubStep.name;
                }
            }
        }
        // Fall back to the in-progress major step
        var activeStep = Array.from(this.steps.values()).find(function (s) { return s.status === 'in-progress'; });
        return (activeStep === null || activeStep === void 0 ? void 0 : activeStep.name) || 'Initializing...';
    };
    /**
     * Emit progress update to all listeners
     */
    ProgressTracker.prototype.emitProgress = function () {
        var progress = this.calculateProgress();
        var _a = this.getStepCounts(), completed = _a.completed, total = _a.total;
        var update = {
            stage: this.currentStage,
            progress: progress,
            currentTask: this.getCurrentTask(),
            estimatedTimeRemaining: this.estimateTimeRemaining(),
            completedSteps: completed,
            totalSteps: total
        };
        (0, logger_1.logDebug)('ProgressTracker', "Progress: ".concat(progress, "% - ").concat(update.currentTask));
        this.callbacks.forEach(function (callback) {
            try {
                callback(update);
            }
            catch (error) {
                (0, logger_1.logDebug)('ProgressTracker', "Callback error: ".concat(error));
            }
        });
    };
    /**
     * Get step counts
     */
    ProgressTracker.prototype.getStepCounts = function () {
        var completed = 0;
        var total = 0;
        this.steps.forEach(function (step) {
            if (step.subSteps) {
                total += step.subSteps.length;
                completed += step.subSteps.filter(function (s) { return s.status === 'completed' || s.status === 'skipped'; }).length;
            }
            else {
                total += 1;
                if (step.status === 'completed' || step.status === 'skipped') {
                    completed += 1;
                }
            }
        });
        return { completed: completed, total: total };
    };
    /**
     * Abort tracking
     */
    ProgressTracker.prototype.abort = function () {
        this.aborted = true;
        this.currentStage = 'error';
        this.emitProgress();
    };
    /**
     * Reset tracker for new report
     */
    ProgressTracker.prototype.reset = function () {
        this.aborted = false;
        this.startTime = Date.now();
        this.currentStage = 'fetching';
        this.steps.clear();
        this.initializeSteps();
        this.emitProgress();
    };
    return ProgressTracker;
}());
exports.ProgressTracker = ProgressTracker;
