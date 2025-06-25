# TriSight Pattern Visual Specification

> This document defines the unified visual styling and labeling standards for all TriSight pattern types.

## Pattern Color Scheme

All patterns now use a standardized color palette defined in `src/models/PatternTypes.ts`:

| Pattern Type | Color | Hex Code | Usage |
|--------------|-------|----------|-------|
| ESCALATOR | Purple | #8E24AA | Steps, labels, borders |
| BLACKJACK | Indigo | #3949AB | Scoring overlays, metrics |
| BREAKOUTBOX | Blue | #2196F3 | Box outlines, labels |
| GOLDMINE_CHANNEL | Deep Blue | #1E88E5 | Channel boundaries, labels |
| GOLDMINE_SHAFT | Green | #43A047 | Shaft patterns, qualified highlights |
| PIVOT | Orange | #FB8C00 | Pivot levels, support/resistance |
| ROCKETMAN | Magenta | #D81B60 | Acceleration patterns, momentum |

## Unified Label Format

All pattern labels follow the standardized format: `{PATTERN_ABBREVIATION} {DIRECTION_ARROW}`

### Pattern Abbreviations
- `ESC` - Escalator patterns
- `BJ` - Blackjack patterns  
- `BREAKOUT` - BreakoutBox patterns
- `GOLDMINE CH` - GoldmineChannel patterns
- `GOLDMINE SH` - GoldmineShaft patterns
- `PIVOT` - Pivot patterns
- `ROCKET` - Rocketman patterns

### Direction Arrows
- `↑` - Rising/Bullish/Up direction
- `↓` - Falling/Bearish/Down direction

### Examples
- `ESC ↑` - Rising escalator pattern
- `BJ` - Blackjack pattern (no direction)
- `BREAKOUT ↑` - Rising breakout box
- `GOLDMINE SH ↓` - Falling goldmine shaft
- `PIVOT ↑` - Support pivot (upward from support)
- `ROCKET ↑` - Bullish rocketman acceleration

## Font Specification

All pattern labels use the unified font specification:
- **Font**: `bold 11px sans-serif`
- **Color**: Pattern-specific color or high-contrast text color
- **Alignment**: Center-aligned within label containers

## Gold Highlight Rules

Qualified goldmine patterns receive special visual treatment:
- **Background**: `rgba(255, 215, 0, 0.9)` (gold with high opacity)
- **Text Color**: `#8B4513` (dark brown for readability on gold)
- **Criteria**: 
  - GoldmineShaft/GoldmineChannel with confidence > 0.7
  - BreakoutBox with `qualifiesForGoldmine` flag set

## Label Placement Rules

### Canvas Rendering (PatternRenderer.tsx)
- **Position**: Center of pattern bounding box
- **Background**: White with pattern-colored border
- **Gold Background**: Applied for qualified goldmine patterns
- **Collision Detection**: Integrated with existing label placement system

### SVG Overlays (StepBox.tsx)
- **Zoomed Out**: Simplified line with centered label above
- **Zoomed In**: Full box with label in top-left corner
- **Background**: White background for text readability
- **Border**: Pattern color, gold when goldmine qualified

### Metric Popovers (MetricPopover.tsx)
- **Pattern Labels**: Use standardized abbreviations and colors
- **Color Consistency**: Match pattern colors from unified scheme
- **Format**: Include direction arrows where applicable

## Implementation Files

The following files have been updated to implement this specification:

### Core Pattern Definitions
- `src/models/PatternTypes.ts` - Color scheme and pattern type definitions

### Rendering Components  
- `src/components/Chart/PatternRenderer.tsx` - Canvas rendering with unified labels
- `src/components/Markers/StepBox.tsx` - SVG overlay with standardized labels
- `src/components/Chart/MetricPopover.tsx` - Popover colors matching pattern scheme

### Helper Functions
- Pattern label generation: `generatePatternLabel(pattern: Pattern)`
- Gold highlight detection: `shouldApplyGoldHighlight(pattern: Pattern)`
- Direction arrow mapping: `DIRECTION_ARROWS` constant

## Context Field Consistency

Pattern interfaces maintain consistent field naming:
- **Direction Fields**: Use `direction` property with appropriate enum types
  - `ThrustDirection` (BULLISH/BEARISH) for trending patterns
  - `ChannelDirection` (HORIZONTAL/ASCENDING/DESCENDING) for channel patterns
  - `PivotType` (SUPPORT/RESISTANCE) for pivot patterns
- **Label Integration**: All patterns support the unified labeling system

## Debug and Development

Pattern visual debugging follows these standards:
- Debug logging uses `DEBUG_PATTERN_DETECT` channel
- Pattern lifecycle comments present in all files
- Visual consistency verified across zoom levels
- Color accessibility maintained for all pattern types

---

**Last Updated**: June 2024  
**Version**: 1.0  
**Status**: Implemented across all pattern types
