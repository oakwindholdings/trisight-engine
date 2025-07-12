# TriSight Pattern Lifecycle Architecture

> **CRITICAL**: This document defines the canonical 5-stage pattern lifecycle that ALL patterns in TriSight must follow. This architecture is immutable and must be referenced when implementing new patterns or modifying existing ones.

## Core Principles

1. **Canvas-Only Rendering**: TriSight uses HTML5 Canvas for all chart rendering. NEVER use SVG or other technologies.
2. **Consistent Data Flow**: All patterns follow the same 5-stage lifecycle without exception.
3. **Separation of Concerns**: Each stage has a specific responsibility and should not overlap with others.

## The 5-Stage Pattern Lifecycle

### Stage 1: DETECT
**Purpose**: Find qualifying candle sequences that match pattern criteria.

**Location**: `/src/patternEngine/[patternName].ts`

**Responsibilities**:
- Analyze candlestick data for pattern-specific sequences
- Apply minimum length requirements and validation rules
- Return structured pattern objects with indices and measurements

**Example**:
```typescript
// breakoutBox.ts
export function detectBreakoutBoxes(candles: Candle[]): BreakoutBox[] {
  // Find stall sequences where candles consolidate
  // Validate breakout direction based on close price
  // Return BreakoutBox objects with floor, ceiling, indices
}
```

### Stage 2: EMIT
**Purpose**: Create unique PatternEvent objects with structured data.

**Location**: `/src/hooks/usePatternBus.ts`

**Responsibilities**:
- Convert detected patterns to PatternEvent format
- Add metadata (timestamp, type, candles array)
- Ensure consistent event structure across all patterns

**Event Structure**:
```typescript
interface PatternEvent {
  type: 'ESCALATOR_STEP' | 'BREAKOUT_BOX' | 'GOLDMINE_SIGNAL' | etc.
  data: {
    // Pattern-specific fields
    startIndex: number
    endIndex: number
    stepRef: string  // Format: "startIndex-endIndex"
    direction: 'RISING' | 'FALLING'
    // Additional pattern data...
  }
  timestamp: number
}
```

### Stage 3: CONTEXT
**Purpose**: Store pattern events in centralized PatternContext for UI access.

**Location**: `/src/contexts/PatternContext.tsx`

**Responsibilities**:
- Maintain arrays for each pattern type (escalatorSteps[], breakoutBoxes[], etc.)
- Provide React context for component access
- Handle pattern state updates and clearing

**Context Fields**:
```typescript
interface PatternContextType {
  escalatorSteps: PatternEvent[]
  breakoutBoxes: PatternEvent[]
  goldmineSignals: PatternEvent[]
  // Pattern-specific setters...
}
```

### Stage 4: RENDER
**Purpose**: Visualize patterns on the canvas using 2D drawing operations.

**Location**: `/src/components/Chart/PatternRenderer.tsx`

**Flow**: `InfiniteZoomChart → RenderOrchestrator → PatternRenderer`

**Responsibilities**:
- Calculate pixel positions using time/price scales
- Draw patterns using canvas 2D context methods
- Apply consistent styling (colors, line widths, labels)

**Rendering Methods**:
```typescript
// PatternRenderer.tsx
renderBreakoutBox(ctx, box, dimensions, timeScale, priceScale) {
  // Use ctx.fillRect, ctx.strokeRect for drawing
  // Position using timeScale.scale() and priceScale.scale()
}
```

### Stage 5: SCORE (Optional)
**Purpose**: Apply scoring logic to validate or qualify patterns.

**Location**: Pattern-specific or `/src/patternEngine/blackjack.ts`

**Responsibilities**:
- Calculate scores for pattern zones (e.g., Blackjack for stalls)
- Qualify patterns for advanced signals (e.g., Goldmine)
- Store scores in pattern data for display

**Example**:
```typescript
// After breakout detection, apply Blackjack scoring to stall
const blackjackScore = calcStepBlackjack(stallCandles)
box.blackjackScore = blackjackScore
box.qualifiesForGoldmine = meetsScoreThreshold(blackjackScore)
```

## Pattern Implementation Checklist

When implementing a new pattern, ensure:

- [ ] Detection function in `/src/patternEngine/[pattern].ts`
- [ ] Event emission in `usePatternBus` hook
- [ ] Context array and setter in `PatternContext`
- [ ] Render method in `PatternRenderer`
- [ ] Optional scoring logic if pattern qualifies for advanced signals
- [ ] Lifecycle comment at top of each file
- [ ] Anchor notes at key logic points

## Naming Conventions

### Direction
**ALWAYS** use: `'RISING' | 'FALLING'`
- RISING: Bullish/upward price movement
- FALLING: Bearish/downward price movement

### Pattern References
**ALWAYS** use: `stepRef: "startIndex-endIndex"`
- Consistent format for all patterns
- Enables unique identification and range queries

### Visual Classification
**AVOID** overloading `type` field. Use specific names:
- `boxType`: For visual classification ('consolidation', 'compression')
- `patternShape`: For geometric descriptions
- Keep `type` for PatternEvent type only

## Common Pitfalls to Avoid

1. **SVG Temptation**: Never use SVG elements. All rendering must use Canvas 2D context.
2. **Stage Mixing**: Don't render in detection functions or detect in render functions.
3. **Naming Collisions**: Don't reuse `type` for visual properties. Use specific field names.
4. **Score Timing**: Apply scores after pattern detection, not during rendering.
5. **Context Bypass**: Always store patterns in PatternContext. Don't pass directly to renderers.

## Debugging Pattern Flow

To trace a pattern through the lifecycle:

1. **Detection**: Add console.log in pattern detection function
2. **Emission**: Log in usePatternBus when creating PatternEvent
3. **Context**: Log in PatternContext when updating arrays
4. **Render**: Log in PatternRenderer render methods
5. **Score**: Log scoring calculations and results

## Future Pattern Integration

New patterns MUST:
1. Follow this 5-stage lifecycle exactly
2. Use consistent naming conventions
3. Add lifecycle comments to all files
4. Update this document with pattern-specific details
5. Test full flow from detection to rendering

---

**Remember**: This architecture is the backbone of TriSight's pattern engine. Consistency across all patterns ensures maintainability, debuggability, and extensibility.
