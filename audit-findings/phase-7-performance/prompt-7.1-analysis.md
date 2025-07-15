# Prompt 7.1: Performance Bottlenecks

## Finding #1
- **Type**: Performance Issue
- **Severity**: High
- **Component**: usePatternBus.ts
- **Line Numbers**: 149-190
- **Description**: Expensive pattern detection on every candle update.
- **Root Cause**: Multiple O(n) detections per tick.
- **Impact**: FPS drops with large data.
- **Recommendation**: Debounce detections.
- **Effort**: 2 hours

## Finding #2
- **Type**: Performance Issue
- **Severity**: Medium
- **Component**: InfiniteZoomChart.tsx
- **Line Numbers**: 456-512
- **Description**: Frequent canvas redraws.
- **Root Cause**: No render batching.
- **Impact**: High CPU usage during zoom/pan.
- **Recommendation**: Implement requestAnimationFrame.
- **Effort**: 3 hours 