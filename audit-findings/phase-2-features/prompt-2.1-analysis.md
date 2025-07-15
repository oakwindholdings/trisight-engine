# Prompt 2.1: Multi-Factor Confidence Scoring Findings

## Finding #1
- **Type**: Partial
- **Severity**: Medium
- **Component**: Pattern detectors
- **Line Numbers**: Various
- **Description**: Detector-specific confidence calcs exist but not unified.
- **Root Cause**: Decentralized implementation.
- **Impact**: Inconsistent scoring across patterns.
- **Evidence**: Multiple calc functions in detectors.
- **Recommendation**: Centralize in scoreEngine.ts.
- **Effort Estimate**: 2 hours
- **Dependencies**: None 