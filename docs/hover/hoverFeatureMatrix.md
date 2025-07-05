# TriSight Hover Feature Matrix - Cognitive Spec Mapping

## Overview
This document maps the existing TriSight hover tooltip system to the Cognitive Hover Spec zones, identifying current capabilities, gaps, and transformation requirements.

## Cognitive Hover Spec Zone Definitions

### ZONE 1: ENTRY CONTEXT
**Purpose**: Immediate pattern identification and entry point details
**Cognitive Load**: Low - Quick visual identification
**Contents**: Pattern type, direction, confidence badge, entry price

### ZONE 2: CONFIDENCE & VALIDATION  
**Purpose**: Risk assessment and signal quality indicators
**Cognitive Load**: Medium - Decision support information
**Contents**: Confidence score, validation flags, risk level, signal strength

### ZONE 3: TECHNICAL STACK TRACE
**Purpose**: Detailed pattern metrics and underlying calculations
**Cognitive Load**: High - Deep analysis and debugging
**Contents**: Step details, floor/ceiling, blackjack scores, metric arrays

### ZONE 4: PROGRESSIVE DETAIL EXPANSION
**Purpose**: On-demand access to full pattern context and history
**Cognitive Load**: Variable - User-controlled detail level
**Contents**: Expandable sections, sparklines, historical context

### ZONE 5: ACTION & FORECAST PANEL
**Purpose**: Forward-looking insights and actionable recommendations
**Cognitive Load**: Strategic - Decision-making support
**Contents**: AI insights, forecast bias, anomaly flags, suggested actions

---

## Current TriSight Hover Implementation Mapping

| **Current Feature** | **Source File** | **Data Source** | **Cognitive Zone** | **Status** | **Gap Analysis** |
|---------------------|-----------------|-----------------|-------------------|------------|------------------|
| **Pattern Identification** | | | **ZONE 1** | | |
| Basic candle index | MetricPopover.tsx | useHoverMetrics | ZONE 1 | ✅ COMPLETE | Good foundation |
| Blackjack count | MetricPopover.tsx | PatternContext.bjCounts | ZONE 1 | ✅ COMPLETE | Could be enhanced with confidence styling |
| Pattern type detection | MetricPopover.tsx | Pattern arrays | ZONE 1 | ⚠️ PARTIAL | No unified pattern identification |
| Entry price display | SignalRenderer.tsx | TradeActionSignal | ZONE 1 | ❌ MISSING | Signal hover not integrated |
| **Confidence & Validation** | | | **ZONE 2** | | |
| Pattern confidence | MetricPopover.tsx | Pattern.confidence | ZONE 2 | ⚠️ PARTIAL | Not consistently displayed |
| Signal validation flags | SignalRenderer.tsx | ValidationResults | ZONE 2 | ❌ MISSING | Canvas signals not in hover |
| Risk level indicators | SignalRenderer.tsx | TradeActionSignal.riskLevel | ZONE 2 | ❌ MISSING | No risk display in tooltip |
| Goldmine qualification | MetricPopover.tsx | BreakoutBox/Step data | ZONE 2 | ✅ COMPLETE | Good goldmine status display |
| **Technical Details** | | | **ZONE 3** | | |
| EscalatorStep details | MetricPopover.tsx | escalatorSteps array | ZONE 3 | ✅ COMPLETE | Comprehensive step metrics |
| BreakoutBox metrics | MetricPopover.tsx | breakoutBoxes array | ZONE 3 | ✅ COMPLETE | Full breakout context |
| Floor/ceiling prices | MetricPopover.tsx | Step/Box data | ZONE 3 | ✅ COMPLETE | Precise level display |
| Blackjack scoring | MetricPopover.tsx | BJ arrays | ZONE 3 | ✅ COMPLETE | Detailed score breakdown |
| MetricRegistry values | MetricPopover.tsx | MetricRegistry | ZONE 3 | ✅ COMPLETE | All registered metrics |
| HA candle alignment | MetricPopover.tsx | convertToHeikinAshi | ZONE 3 | ✅ COMPLETE | HA infrastructure integrated |
| **Progressive Detail** | | | **ZONE 4** | | |
| Expandable sections | - | - | ZONE 4 | ❌ MISSING | No expand/collapse UI |
| Historical context | - | - | ZONE 4 | ❌ MISSING | No pattern history |
| Sparkline charts | - | - | ZONE 4 | ❌ MISSING | No micro-visualizations |
| Audit trail | - | - | ZONE 4 | ❌ MISSING | No pattern lifecycle trace |
| **Action & Forecast** | | | **ZONE 5** | | |
| AI insights | - | - | ZONE 5 | ❌ MISSING | No AI-powered recommendations |
| Forecast bias | - | - | ZONE 5 | ❌ MISSING | No forward-looking analysis |
| Anomaly detection | - | - | ZONE 5 | ❌ MISSING | No anomaly flagging |
| Action recommendations | - | - | ZONE 5 | ❌ MISSING | No suggested actions |

---

## Infrastructure Mapping

| **Infrastructure Component** | **Current Status** | **Cognitive Spec Requirement** | **Transformation Needed** |
|----------------------------|-------------------|-------------------------------|---------------------------|
| **Mouse Tracking** | ✅ DOM-based via useHoverMetrics | Canvas + DOM unified | Merge with SignalRenderer hover |
| **Data Context** | ✅ PatternContext integration | Unified HoverContext | Create consolidated hover state |
| **Positioning Logic** | ⚠️ Cursor-following only | Smart bounds detection | Add chart boundary awareness |
| **Animation System** | ❌ Hard snap positioning | Smooth transitions | Implement fade-in/fade-out |
| **Canvas Integration** | ❌ SignalRenderer hover unused | Canvas + DOM hybrid | Bridge canvas signals to tooltip |
| **Zone Layout System** | ❌ Flat metric list | Structured zones 1-5 | Complete UI architecture redesign |
| **Performance** | ⚠️ Real-time HA conversion | Memoized calculations | Optimize expensive operations |
| **Telemetry** | ❌ No analytics | Hover usage tracking | Implement hover analytics |

---

## Integration Assessment

### ✅ **STRONG FOUNDATIONS**
- **Pattern Context Integration**: Comprehensive pattern arrays available
- **HA Infrastructure**: All hover calculations use Heikin-Ashi candles
- **Technical Metrics**: Deep pattern analysis data available
- **Real-time Updates**: Live pattern detection integration

### ⚠️ **PARTIAL IMPLEMENTATIONS**
- **Signal Integration**: Canvas signals exist but not connected to hover
- **Confidence Display**: Pattern confidence available but not consistently shown
- **Performance**: Real-time calculations work but could be optimized

### ❌ **MAJOR GAPS**
- **Zone Architecture**: No structured zone layout system
- **Progressive Detail**: No expand/collapse or user-controlled detail levels
- **Canvas-DOM Bridge**: SignalRenderer hover functions completely unused
- **AI Layer**: No cognitive insights, forecasts, or recommendations
- **Advanced Interactions**: No animation, bounds detection, or hover-hold states

---

## Transformation Roadmap Priority

### **HIGH PRIORITY** (Phases 2-3)
1. **Canvas-DOM Bridge**: Integrate SignalRenderer hover detection
2. **Zone Architecture**: Refactor MetricPopover to structured zones
3. **Unified Context**: Merge pattern and signal contexts
4. **Bounds Detection**: Prevent tooltip overflow

### **MEDIUM PRIORITY** (Phase 4)
1. **Progressive Detail**: Implement expand/collapse interactions
2. **Animation System**: Add smooth transitions
3. **Performance**: Memoize expensive calculations
4. **Hover-Hold States**: Extended hover interactions

### **LOW PRIORITY** (Phases 5-6)
1. **AI Layer**: Cognitive insights and forecasting
2. **Telemetry**: Usage analytics and optimization
3. **Advanced Interactions**: Sparklines and micro-visualizations
4. **UX Polish**: Advanced animation and interaction patterns

---

## Success Metrics

### **Phase Completion Indicators**
- **Phase 1**: ✅ Mapping complete, transformation plan established
- **Phase 2**: Canvas signals appear in hover tooltip
- **Phase 3**: Structured zone layout renders correctly
- **Phase 4**: Expand/collapse interactions functional
- **Phase 5**: AI insights display in tooltip
- **Phase 6**: Hover analytics dashboard operational

### **User Experience Goals**
- **Cognitive Load Reduction**: Information organized by complexity
- **Progressive Disclosure**: User-controlled detail level
- **Unified Experience**: Consistent hover behavior across all chart elements
- **Performance**: Sub-50ms hover response time
- **Accessibility**: Keyboard navigation and screen reader support
