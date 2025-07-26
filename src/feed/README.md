# Pattern Feed Filtering System

A comprehensive, performant filtering system for the TriSight Pattern Feed that supports real-time filtering by pattern type, time windows, chart intervals, and more.

## Features

- **Multi-dimensional Filtering**: Pattern type, time windows, chart intervals, confidence ranges
- **High Performance**: Optimized for 10,000+ feed items with memoization
- **Real-time Updates**: Filters update immediately as new patterns arrive
- **Extensible Architecture**: Easy to add new filter types
- **Composable UI**: Modular filter components that can be used independently
- **Comprehensive Testing**: Full test coverage for reliability

## Quick Start

### Basic Usage

```tsx
import { FeedFilterProvider, FilterBar } from './feed/components';
import { usePatternFeed } from './feed/hooks/usePatternFeed';

function MyFeedComponent() {
  return (
    <FeedFilterProvider>
      <FeedContent />
    </FeedFilterProvider>
  );
}

function FeedContent() {
  const { entries, filteredCount, totalCount } = usePatternFeed();
  
  return (
    <div>
      <FilterBar totalCount={totalCount} filteredCount={filteredCount} />
      {entries.map(entry => (
        <div key={entry.id}>{entry.humanSummary}</div>
      ))}
    </div>
  );
}
```

### Advanced Filtering

```tsx
import { useFeedFilter } from './feed/contexts/FeedFilterContext';
import { PatternType } from './models/PatternTypes';

function AdvancedFiltering() {
  const { setFilters, clearAllFilters } = useFeedFilter();
  
  const applyHighConfidenceFilter = () => {
    setFilters({
      confidence: { min: 0.8 },
      timeWindow: '1h',
      patternType: PatternType.GOLDMINE_SHAFT
    });
  };
  
  return (
    <div>
      <button onClick={applyHighConfidenceFilter}>
        High Confidence Goldmine Patterns
      </button>
      <button onClick={clearAllFilters}>Clear All</button>
    </div>
  );
}
```

## Architecture

### Core Components

1. **FeedFilterContext**: Global state management for filters
2. **usePatternFeed**: Enhanced hook with filtering, sorting, and performance optimizations
3. **FilterBar**: Main UI component with all filter controls
4. **Individual Filters**: PatternTypeFilter, TimeWindowFilter, IntervalFilter
5. **FilterUtils**: High-performance filtering functions

### Data Flow

```
PatternBus Events → FeedContext → usePatternFeed → FilterUtils → Filtered Results
                                      ↑
                              FeedFilterContext (Filter State)
```

## Filter Types

### Pattern Type Filter
- Filters by specific pattern types (Goldmine Shaft, Blackjack, Pivot, etc.)
- Shows pattern counts for each type
- Supports "All Patterns" option

### Time Window Filter
- Predefined time ranges: 5m, 15m, 30m, 1h, 4h, 24h
- Filters based on pattern timestamp
- "All Time" option for no time filtering

### Chart Interval Filter
- Filters by chart timeframe: 1m, 5m, 15m, 30m, 1h, 4h, 1d
- Uses metadata.interval field
- "All Intervals" option

### Confidence Range Filter
- Min/max confidence thresholds
- Supports partial ranges (min only, max only)
- Handles null/undefined confidence values

## Performance Optimizations

### Memoization
- Filter results are memoized using React.useMemo
- Pattern type counts are cached
- Filter functions avoid unnecessary recalculations

### Efficient Filtering
- Single-pass filtering with early returns
- Native Array.filter() for best performance
- Batch operations for large datasets

### Memory Management
- Debounced filter updates
- Cleanup of event listeners
- Efficient data structures

## Extending the System

### Adding New Filter Types

1. **Add to EnhancedPatternFeedFilters interface**:
```tsx
export interface EnhancedPatternFeedFilters {
  // ... existing filters
  newFilter?: string;
}
```

2. **Update filterUtils.ts**:
```tsx
export function matchesFilters(entry: PatternFeedEntry, filters: EnhancedPatternFeedFilters): boolean {
  // ... existing checks
  
  if (filters.newFilter && !matchesNewFilter(entry, filters.newFilter)) {
    return false;
  }
  
  return true;
}
```

3. **Create filter component**:
```tsx
export const NewFilter: React.FC = () => {
  const { filters, setNewFilter } = useFeedFilter();
  // ... component implementation
};
```

4. **Add to FilterBar**:
```tsx
<FilterGroup>
  <FilterLabel>New Filter:</FilterLabel>
  <NewFilter />
</FilterGroup>
```

### Adding Filter Presets

```tsx
const { savePreset, applyPreset } = useFeedFilter();

// Save current filters as preset
savePreset('high-confidence', {
  confidence: { min: 0.8 },
  timeWindow: '1h'
});

// Apply saved preset
applyPreset('high-confidence');
```

## Testing

### Running Tests
```bash
npm test src/feed/
```

### Test Coverage
- Unit tests for all filtering functions
- Component tests for UI interactions
- Performance tests for large datasets
- Integration tests for complete workflows

### Performance Benchmarks
- 10,000 items: < 50ms filtering time
- Real-time updates: < 10ms response time
- Memory usage: Stable with large datasets

## API Reference

### useFeedFilter Hook

```tsx
const {
  filters,                    // Current filter state
  setPatternType,            // Set pattern type filter
  setTimeWindow,             // Set time window filter
  setInterval,               // Set interval filter
  setConfidenceRange,        // Set confidence range
  clearAllFilters,           // Clear all active filters
  hasActiveFilters,          // Boolean: any filters active
  activeFilterCount,         // Number of active filters
  patternTypeOptions,        // Pattern types with counts
  updatePatternTypeCounts    // Update pattern counts
} = useFeedFilter();
```

### usePatternFeed Hook

```tsx
const {
  entries,                   // Filtered and sorted entries
  filteredCount,            // Number of filtered entries
  totalCount,               // Total number of entries
  patternTypeCounts,        // Counts by pattern type
  isLoading                 // Loading state
} = usePatternFeed({
  filters,                  // Filter criteria
  sortBy,                   // Sort field
  sortDirection,            // Sort direction
  limit                     // Result limit
});
```

## Best Practices

1. **Always wrap components in FeedFilterProvider**
2. **Use memoization for expensive computations**
3. **Implement proper cleanup in useEffect hooks**
4. **Test with large datasets (10,000+ items)**
5. **Follow existing TriSight styling patterns**
6. **Document any new filter types thoroughly**

## Troubleshooting

### Common Issues

**Filters not updating**: Ensure component is wrapped in FeedFilterProvider

**Performance issues**: Check if memoization is working correctly

**Missing pattern counts**: Verify updatePatternTypeCounts is called

**Timestamp parsing errors**: Ensure timestamps are valid ISO strings

### Debug Mode

Enable debug logging:
```tsx
// In development
if (process.env.NODE_ENV === 'development') {
  console.log('[Filter Debug]', { filters, entries, counts });
}
```
