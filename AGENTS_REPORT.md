# TriSight AI Agent System Analysis

*Generated on: 5/21/2025, 9:14:14 AM*

## 📊 Executive Summary

This analysis examined 47 files in the TriSight codebase.

| Metric | Count | Description |
| ------ | ----- | ----------- |
| Files | 47 | Total files analyzed |
| Agents | 22 | AI/Agent components |
| Commands & Cascades | 8 | Event handling systems |
| Functions | 49 | Total function declarations |
| Classes | 2 | Total classes and components |
| Technical Debt Markers | 9 | Files with maintenance concerns |
| Unused Files | 38 | Files not imported elsewhere |
| Security Issues | 8 | Potential security vulnerabilities |
| Circular Dependencies | 57 | Import cycles |

## 🏗️ Architecture Overview

The TriSight system employs the following architectural patterns:

| Pattern | Count | Files |
| ------- | ----- | ----- |
| adapter | 2 | `detailed-pattern-training-prompt.md`, `trisight-equity-analyst\package-lock.json` |
| builder | 2 | `trisight-equity-analyst\package-lock.json`, `trisight-equity-analyst\package.json` |
| decorator | 1 | `trisight-equity-analyst\package-lock.json` |

### Component Relationships

```mermaid
graph TD
  trisight_equity_analyst_src_App_test_tsx["trisight-equity-analyst\src\App.test.tsx"]
  style trisight_equity_analyst_src_App_test_tsx fill:#ffb,stroke:#333,stroke-width:2px
  trisight_equity_analyst_src_App_tsx["trisight-equity-analyst\src\App.tsx"]
  style trisight_equity_analyst_src_App_tsx fill:#ffb,stroke:#333,stroke-width:2px
  trisight_equity_analyst_src_components_SymbolSearch_d_ts["trisight-equity-analyst\src\components\SymbolSearch.d.ts"]
  style trisight_equity_analyst_src_components_SymbolSearch_d_ts fill:#ffb,stroke:#333,stroke-width:2px
  trisight_equity_analyst_src_components_SymbolSearch_tsx["trisight-equity-analyst\src\components\SymbolSearch.tsx"]
  style trisight_equity_analyst_src_components_SymbolSearch_tsx fill:#ffb,stroke:#333,stroke-width:2px
  trisight_equity_analyst_src_contexts_FeedbackContext_tsx["trisight-equity-analyst\src\contexts\FeedbackContext.tsx"]
  style trisight_equity_analyst_src_contexts_FeedbackContext_tsx fill:#ffb,stroke:#333,stroke-width:2px
  trisight_equity_analyst_src_contexts_LearningContext_tsx["trisight-equity-analyst\src\contexts\LearningContext.tsx"]
  style trisight_equity_analyst_src_contexts_LearningContext_tsx fill:#ffb,stroke:#333,stroke-width:2px
  trisight_equity_analyst_src_contexts_MarketDataContext_tsx["trisight-equity-analyst\src\contexts\MarketDataContext.tsx"]
  style trisight_equity_analyst_src_contexts_MarketDataContext_tsx fill:#ffb,stroke:#333,stroke-width:2px
  trisight_equity_analyst_src_contexts_PatternContext_tsx["trisight-equity-analyst\src\contexts\PatternContext.tsx"]
  style trisight_equity_analyst_src_contexts_PatternContext_tsx fill:#ffb,stroke:#333,stroke-width:2px
  trisight_equity_analyst_src_index_tsx["trisight-equity-analyst\src\index.tsx"]
  style trisight_equity_analyst_src_index_tsx fill:#ffb,stroke:#333,stroke-width:2px
  trisight_equity_analyst_src_models_ChartTypes_ts["trisight-equity-analyst\src\models\ChartTypes.ts"]
  style trisight_equity_analyst_src_models_ChartTypes_ts fill:#bfb,stroke:#333,stroke-width:2px
  trisight_equity_analyst_src_models_FeedbackTypes_ts["trisight-equity-analyst\src\models\FeedbackTypes.ts"]
  style trisight_equity_analyst_src_models_FeedbackTypes_ts fill:#bfb,stroke:#333,stroke-width:2px
  trisight_equity_analyst_src_models_LearningTypes_ts["trisight-equity-analyst\src\models\LearningTypes.ts"]
  style trisight_equity_analyst_src_models_LearningTypes_ts fill:#bfb,stroke:#333,stroke-width:2px
  trisight_equity_analyst_src_models_PatternTypes_ts["trisight-equity-analyst\src\models\PatternTypes.ts"]
  style trisight_equity_analyst_src_models_PatternTypes_ts fill:#bfb,stroke:#333,stroke-width:2px
```

## 🧠 Active Agents

List all currently invoked agents, their file locations, and their stated or inferred responsibilities.

| File | Keywords Found | Description |
| ---- | -------------- | ----------- |
| `AGENTS_REPORT.md` | agent, cascade, command, pattern | No description available |
| `detailed-pattern-training-prompt.md` | pattern | No description available |
| `trisight-equity-analyst\package-lock.json` | agent, cascade, command | No description available |
| `trisight-equity-analyst\README.md` | pattern | No description available |
| `trisight-equity-analyst\src\api\patternApi.ts` | pattern | No description available |
| `trisight-equity-analyst\src\api\twelveDataApi.ts` |  | No description available |
| `trisight-equity-analyst\src\App.tsx` | trigger, pattern | No description available |
| `trisight-equity-analyst\src\contexts\FeedbackContext.tsx` | pattern | No description available |
| `trisight-equity-analyst\src\contexts\LearningContext.tsx` | pattern | No description available |
| `trisight-equity-analyst\src\contexts\MarketDataContext.tsx` |  | No description available |
| `trisight-equity-analyst\src\contexts\PatternContext.tsx` | pattern | No description available |
| `trisight-equity-analyst\src\hooks\useFeedback.ts` | pattern | No description available |
| `trisight-equity-analyst\src\hooks\useLearning.ts` | pattern | No description available |
| `trisight-equity-analyst\src\hooks\useMarketData.ts` |  | No description available |
| `trisight-equity-analyst\src\hooks\usePatternDetectionPreferences.ts` | pattern | No description available |
| `trisight-equity-analyst\src\hooks\usePatterns.ts` | pattern | No description available |
| `trisight-equity-analyst\src\models\LearningTypes.ts` | pattern | No description available |
| `trisight-equity-analyst\src\types\global.d.ts` |  | No description available |
| `trisight-equity-analyst\src\utils\compressedTimeScale.ts` |  | No description available |
| `trisight-equity-analyst\src\utils\exportImport.ts` | pattern | No description available |
| `trisight-equity-analyst\src\utils\scaling.ts` |  | No description available |
| `trisight-equity-analyst\src\utils\timeScaleUtils.ts` |  | No description available |

### AI Components

The following components use machine learning or AI techniques:

| File | Type | Patterns |
| ---- | ---- | -------- |
| `detailed-pattern-training-prompt.md` | training |  |
| `trisight-equity-analyst\src\api\patternApi.ts` | inference |  |
| `trisight-equity-analyst\src\hooks\useLearning.ts` | inference |  |
| `trisight-equity-analyst\src\utils\exportImport.ts` | training |  |

## 🧱 Legacy Claude Structures

Enumerate any scaffolding, partial classes, or commented-out logic that appears unused or outdated from Claude-generated code.

| File | TODO | FIXME | HACK | Legacy | Example TODOs |
| ---- | ---- | ----- | ---- | ------ | ------------ |
| `AGENTS_REPORT.md` | 1 | 0 | 0 | 6 | `TODO Count | Legacy/Claude References |`<br/>`TODOs.`<br/>`TODOs` |
| `trisight-equity-analyst\src\App.tsx` | 0 | 0 | 0 | 2 |  |

### TODO Topic Clusters

Common topics in TODOs across the codebase:

| Topic | Count |
| ----- | ----- |
| count | 1 |
| legacy | 1 |
| claude | 1 |
| references | 1 |

## ⚙️ Command Cascades & Execution Logic

Show how execution flows from command invocation through cascade layers and into agent behavior.

| File | Commands | Cascades | Triggers | Events | PubSub | Patterns |
| ---- | -------- | -------- | -------- | ------ | ------ | -------- |
| `AGENTS_REPORT.md` | ✓ | ✓ | ✗ | ✗ | ✗ |  |
| `trisight-equity-analyst\package-lock.json` | ✓ | ✓ | ✗ | ✓ | ✗ |  |
| `trisight-equity-analyst\package.json` | ✗ | ✗ | ✗ | ✓ | ✗ |  |
| `trisight-equity-analyst\public\electron.js` | ✗ | ✗ | ✗ | ✓ | ✗ |  |
| `trisight-equity-analyst\src\App.tsx` | ✗ | ✗ | ✓ | ✓ | ✗ |  |
| `trisight-equity-analyst\src\components\SymbolSearch.tsx` | ✗ | ✗ | ✗ | ✓ | ✗ |  |
| `trisight-equity-analyst\src\hooks\usePatterns.ts` | ✗ | ✗ | ✗ | ✓ | ✗ |  |
| `trisight-equity-analyst\src\utils\exportImport.ts` | ✗ | ✗ | ✗ | ✓ | ✗ |  |

## 🧼 Technical Debt Markers

Highlight large files, circular dependencies, magic numbers, duplicate logic, or stale TODOs.

| File | Lines | Size (chars) | Issues |
| ---- | ----- | ------------ | ------ |
| `trisight-equity-analyst\package-lock.json` | 22204 | 832583 | Large file (>500 lines), Very large file size (>50KB), Potential hardcoded credentials |
| `trisight-equity-analyst\README.md` | 139 | 3991 | Potential hardcoded credentials |
| `trisight-equity-analyst\src\api\patternApi.ts` | 495 | 15786 | Potential hardcoded credentials |
| `trisight-equity-analyst\src\api\twelveDataApi.ts` | 362 | 10125 | Potential hardcoded credentials |
| `trisight-equity-analyst\src\App.tsx` | 740 | 23265 | Large file (>500 lines), Potential hardcoded credentials, Magic numbers |
| `trisight-equity-analyst\src\components\SymbolSearch.tsx` | 165 | 4065 | Potential hardcoded credentials |
| `trisight-equity-analyst\src\hooks\useLearning.ts` | 487 | 18144 | Potential hardcoded credentials |
| `trisight-equity-analyst\src\models\LearningTypes.ts` | 173 | 4708 | Potential hardcoded credentials |
| `trisight-equity-analyst\src\styles\theme.ts` | 103 | 2143 | Magic numbers |

### Complex Files

These files have high cyclomatic complexity and may need refactoring:

| File | Complexity Score | Decision Points | Functions | Lines |
| ---- | --------------- | --------------- | --------- | ----- |
| `trisight-equity-analyst\package-lock.json` | 1359 | 1187 | 172 | 22204 |
| `trisight-equity-analyst\src\App.tsx` | 132 | 84 | 48 | 740 |
| `trisight-equity-analyst\src\hooks\useLearning.ts` | 125 | 66 | 59 | 487 |
| `trisight-equity-analyst\src\utils\scaling.ts` | 110 | 62 | 48 | 362 |
| `detailed-pattern-training-prompt.md` | 85 | 61 | 24 | 391 |
| `trisight-equity-analyst\src\api\twelveDataApi.ts` | 80 | 64 | 16 | 362 |
| `trisight-equity-analyst\src\api\patternApi.ts` | 60 | 35 | 25 | 495 |
| `trisight-equity-analyst\src\hooks\usePatterns.ts` | 45 | 23 | 22 | 172 |
| `trisight-equity-analyst\src\utils\exportImport.ts` | 44 | 32 | 12 | 168 |
| `trisight-equity-analyst\src\utils\compressedTimeScale.ts` | 39 | 29 | 10 | 142 |

### Duplicate Code

The following code patterns are duplicated and could be refactored:

#### Duplicate 1

Found in: `trisight-equity-analyst\src\contexts\LearningContext.tsx`, `trisight-equity-analyst\src\hooks\useLearning.ts`

```javascript
  importModel: (file: File) => Promise<boolean>;
  processFeedback: (feedback: PatternFeedback) => Promise<ProcessingResult | null>;
  getPatternParameters: (patternType: PatternType) => PatternDetectionParameters;
  updatePatternParameters: (patternType: PatternType, parameters: Partial<PatternDetectionParameters>) => void;
  toggleLearning: () => void;
  resetLearningParameters: (patternType?: PatternType) => Promise<void>;
```

#### Duplicate 2

Found in: `AGENTS_REPORT.md`, `AGENTS_REPORT.md`

```javascript
1. **Consolidate Agent Logic**: Centralize agent definitions and reduce duplication
2. **Remove Legacy Code**: Clean up and remove commented-out code and TODOs
3. **Standardize Command Patterns**: Establish consistent patterns for command handling
4. **Refactor Large Files**: Break down files exceeding 500 lines
5. **Document Agent Responsibilities**: Add clear documentation for each agent

```

#### Duplicate 3

Found in: `trisight-equity-analyst\src\contexts\LearningContext.tsx`, `trisight-equity-analyst\src\hooks\useLearning.ts`

```javascript
  refreshMetrics: () => Promise<void>;
  exportModel: () => Promise<boolean>;
  importModel: (file: File) => Promise<boolean>;
  processFeedback: (feedback: PatternFeedback) => Promise<ProcessingResult | null>;
  getPatternParameters: (patternType: PatternType) => PatternDetectionParameters;
  updatePatternParameters: (patternType: PatternType, parameters: Partial<PatternDetectionParameters>) => void;
```

#### Duplicate 4

Found in: `trisight-equity-analyst\src\contexts\LearningContext.tsx`, `trisight-equity-analyst\src\hooks\useLearning.ts`

```javascript
  exportModel: () => Promise<boolean>;
  importModel: (file: File) => Promise<boolean>;
  processFeedback: (feedback: PatternFeedback) => Promise<ProcessingResult | null>;
  getPatternParameters: (patternType: PatternType) => PatternDetectionParameters;
  updatePatternParameters: (patternType: PatternType, parameters: Partial<PatternDetectionParameters>) => void;
  toggleLearning: () => void;
```

#### Duplicate 5

Found in: `trisight-equity-analyst\README.md`, `trisight-equity-analyst\README.md`

```javascript
The TriSight Pattern Training Interface is a next-generation AI-guided equity analyst interface for detecting and improving trading pattern recognition. This system allows financial analysts to interact with AI-detected trading patterns, provide corrective feedback, and improve the pattern detection algorithms through continuous learning.

## Features

### Market Data Integration

```

#### Duplicate 6

Found in: `trisight-equity-analyst\README.md`, `trisight-equity-analyst\README.md`

```javascript
## Overview

The TriSight Pattern Training Interface is a next-generation AI-guided equity analyst interface for detecting and improving trading pattern recognition. This system allows financial analysts to interact with AI-detected trading patterns, provide corrective feedback, and improve the pattern detection algorithms through continuous learning.

## Features

```

#### Duplicate 7

Found in: `trisight-equity-analyst\src\utils\scaling.ts`, `trisight-equity-analyst\src\utils\scaling.ts`

```javascript
  const timestamps = visibleData.map(item => new Date(item.timestamp));
  
  // For price data, we need to extract from candlestick format
  const priceLow = d3Array.min(visibleData, (d: T) => d.low !== undefined ? d.low : (d.close || 0)) || 0;
  const priceHigh = d3Array.max(visibleData, (d: T) => d.high !== undefined ? d.high : (d.close || 100)) || 100;
  
```

#### Duplicate 8

Found in: `trisight-equity-analyst\src\hooks\useLearning.ts`, `trisight-equity-analyst\src\hooks\useLearning.ts`

```javascript
  // Helper function to get parameters evolution
  const getParametersEvolution = (): LearningMetrics['parametersEvolution'] => {
    // This would be extracted from the feedback history
    // For now, we'll return a placeholder
    const allParams: Record<PatternType, PatternDetectionParameters> = {} as Record<PatternType, PatternDetectionParameters>;
    
```

#### Duplicate 9

Found in: `trisight-equity-analyst\src\contexts\LearningContext.tsx`, `trisight-equity-analyst\src\hooks\useLearning.ts`

```javascript
  isLearningEnabled: boolean;
  refreshMetrics: () => Promise<void>;
  exportModel: () => Promise<boolean>;
  importModel: (file: File) => Promise<boolean>;
  processFeedback: (feedback: PatternFeedback) => Promise<ProcessingResult | null>;
  getPatternParameters: (patternType: PatternType) => PatternDetectionParameters;
```

#### Duplicate 10

Found in: `trisight-equity-analyst\src\hooks\useLearning.ts`, `trisight-equity-analyst\src\hooks\useLearning.ts`

```javascript
          // Calculate metrics for each user
          const contributors = Array.from(userGroups.entries()).map(([userId, feedbacks]) => {
            const feedbackCount = feedbacks.length;
            const accurateCount = feedbacks.filter(f => !f.falsePositive).length;
            const accuracyRate = feedbackCount > 0 ? accurateCount / feedbackCount : 0;
            
```

### Security Issues

| File | Issue | Severity |
| ---- | ----- | -------- |
| `trisight-equity-analyst\package-lock.json` | Potential hardcoded credentials | High |
| `trisight-equity-analyst\README.md` | Potential hardcoded credentials | High |
| `trisight-equity-analyst\src\api\patternApi.ts` | Potential hardcoded credentials | High |
| `trisight-equity-analyst\src\api\twelveDataApi.ts` | Potential hardcoded credentials | High |
| `trisight-equity-analyst\src\App.tsx` | Potential hardcoded credentials | High |
| `trisight-equity-analyst\src\components\SymbolSearch.tsx` | Potential hardcoded credentials | High |
| `trisight-equity-analyst\src\hooks\useLearning.ts` | Potential hardcoded credentials | High |
| `trisight-equity-analyst\src\models\LearningTypes.ts` | Potential hardcoded credentials | High |

## 🗂 Unused or Orphaned Files

List any files that are never imported or used in the execution graph.

| File | Size | Type |
| ---- | ---- | ---- |
| `trisight-equity-analyst\.eslintrc.js` | 0.4 KB | js |
| `trisight-equity-analyst\public\electron.js` | 2.2 KB | js |
| `trisight-equity-analyst\src\api\patternApi.ts` | 15.4 KB | ts |
| `trisight-equity-analyst\src\api\twelveDataApi.ts` | 9.9 KB | ts |
| `trisight-equity-analyst\src\App.tsx` | 22.7 KB | tsx |
| `trisight-equity-analyst\src\augmentations.d.ts` | 0.3 KB | ts |
| `trisight-equity-analyst\src\components\SymbolSearch.d.ts` | 0.2 KB | ts |
| `trisight-equity-analyst\src\components\SymbolSearch.tsx` | 4.0 KB | tsx |
| `trisight-equity-analyst\src\contexts\FeedbackContext.tsx` | 1.6 KB | tsx |
| `trisight-equity-analyst\src\contexts\LearningContext.tsx` | 3.6 KB | tsx |
| `trisight-equity-analyst\src\contexts\MarketDataContext.tsx` | 1.7 KB | tsx |
| `trisight-equity-analyst\src\contexts\PatternContext.tsx` | 2.6 KB | tsx |
| `trisight-equity-analyst\src\hooks\useFeedback.ts` | 2.6 KB | ts |
| `trisight-equity-analyst\src\hooks\useLearning.ts` | 17.7 KB | ts |
| `trisight-equity-analyst\src\hooks\useMarketData.ts` | 2.5 KB | ts |
| `trisight-equity-analyst\src\hooks\usePatternDetectionPreferences.ts` | 3.5 KB | ts |
| `trisight-equity-analyst\src\hooks\usePatterns.ts` | 6.3 KB | ts |
| `trisight-equity-analyst\src\models\ChartTypes.ts` | 2.2 KB | ts |
| `trisight-equity-analyst\src\models\FeedbackTypes.ts` | 1.9 KB | ts |
| `trisight-equity-analyst\src\models\LearningTypes.ts` | 4.6 KB | ts |
| `trisight-equity-analyst\src\models\PatternTypes.ts` | 5.7 KB | ts |
| `trisight-equity-analyst\src\react-app-env.d.ts` | 0.0 KB | ts |
| `trisight-equity-analyst\src\reportWebVitals.ts` | 0.4 KB | ts |
| `trisight-equity-analyst\src\setupTests.ts` | 0.2 KB | ts |
| `trisight-equity-analyst\src\styles\theme.ts` | 2.1 KB | ts |
| `trisight-equity-analyst\src\types\d3-array.d.ts` | 0.0 KB | ts |
| `trisight-equity-analyst\src\types\d3-scale.d.ts` | 0.0 KB | ts |
| `trisight-equity-analyst\src\types\d3-time-format.d.ts` | 0.0 KB | ts |
| `trisight-equity-analyst\src\types\global.d.ts` | 0.7 KB | ts |
| `trisight-equity-analyst\src\types\uuid.d.ts` | 0.0 KB | ts |
| `trisight-equity-analyst\src\utils\compressedTimeScale.ts` | 4.9 KB | ts |
| `trisight-equity-analyst\src\utils\continuousTimeScale.ts` | 2.2 KB | ts |
| `trisight-equity-analyst\src\utils\exportImport.ts` | 5.2 KB | ts |
| `trisight-equity-analyst\src\utils\featureFlags.ts` | 0.8 KB | ts |
| `trisight-equity-analyst\src\utils\formatters.ts` | 2.0 KB | ts |
| `trisight-equity-analyst\src\utils\marketHours.ts` | 1.6 KB | ts |
| `trisight-equity-analyst\src\utils\scaling.ts` | 10.1 KB | ts |
| `trisight-equity-analyst\src\utils\timeScaleUtils.ts` | 1.5 KB | ts |

### Circular Dependencies

The following import cycles were detected:

1. `trisight-equity-analyst\src\api\twelveDataApi.ts` → trisight-equity-analyst\src\api\twelveDataApi.ts
2. `trisight-equity-analyst\src\contexts\MarketDataContext.tsx` → trisight-equity-analyst\src\contexts\MarketDataContext.tsx
3. `trisight-equity-analyst\src\contexts\MarketDataContext.tsx` → trisight-equity-analyst\src\contexts\MarketDataContext.tsx
4. `trisight-equity-analyst\src\models\FeedbackTypes.ts` → trisight-equity-analyst\src\models\FeedbackTypes.ts
5. `trisight-equity-analyst\src\models\FeedbackTypes.ts` → trisight-equity-analyst\src\models\FeedbackTypes.ts
6. `trisight-equity-analyst\src\contexts\PatternContext.tsx` → trisight-equity-analyst\src\contexts\PatternContext.tsx
7. `trisight-equity-analyst\src\models\FeedbackTypes.ts` → trisight-equity-analyst\src\models\FeedbackTypes.ts
8. `trisight-equity-analyst\src\models\FeedbackTypes.ts` → trisight-equity-analyst\src\models\FeedbackTypes.ts
9. `trisight-equity-analyst\src\models\FeedbackTypes.ts` → trisight-equity-analyst\src\models\FeedbackTypes.ts
10. `trisight-equity-analyst\src\models\LearningTypes.ts` → trisight-equity-analyst\src\models\LearningTypes.ts

## 📌 Recommendations for Cleanup

Based on the above findings, provide a bullet-point list of proposed improvements or deletions.

1. **Consolidate Agent Logic**: Centralize agent definitions and reduce duplication
2. **Standardize Command Patterns**: Establish consistent patterns for command handling
3. **Refactor Large Files**: Break down files exceeding 500 lines
4. **Resolve Circular Dependencies**: Restructure the following modules to break import cycles: `trisight-equity-analyst\src\api\twelveDataApi.ts`, `trisight-equity-analyst\src\contexts\MarketDataContext.tsx`, `trisight-equity-analyst\src\contexts\MarketDataContext.tsx`
5. **Clean Up Unused Files**: Remove or repurpose orphaned files
6. **Refactor Duplicate Code**: Extract common functionality into shared utilities
7. **Address Security Issues**: Fix potential security vulnerabilities
8. **Add Service Layer**: Introduce service components to separate business logic from controllers

### Priority Action Items

#### High-Complexity Files to Refactor First

1. `trisight-equity-analyst\package-lock.json` (complexity: 1359)
   - Split into smaller, focused components
   - Extract utility functions
   - Reduce nested conditionals
2. `trisight-equity-analyst\src\App.tsx` (complexity: 132)
   - Split into smaller, focused components
   - Extract utility functions
   - Reduce nested conditionals
3. `trisight-equity-analyst\src\hooks\useLearning.ts` (complexity: 125)
   - Split into smaller, focused components
   - Extract utility functions
   - Reduce nested conditionals

#### Critical TODOs to Address

1. In `AGENTS_REPORT.md`:
   - `TODO Count | Legacy/Claude References |`
   - `TODOs.`
   - `TODOs`

