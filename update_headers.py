import sys, re
from pathlib import Path

descriptions = {
    'src/App.tsx': ('Main application component', 'Composes TriSight interface'),
    'src/App.test.tsx': ('Basic CRA test harness', 'Ensures App renders'),
    'src/index.tsx': ('React entry point', 'Mounts App into DOM'),
    'src/reportWebVitals.ts': ('Web vitals reporting helper', 'Optional performance logging'),
    'src/setupTests.ts': ('Jest setup file', 'Configures testing utilities'),
    'src/augmentations.d.ts': ('TypeScript module augmentations', 'Extends external libraries'),
    'src/react-app-env.d.ts': ('CRA environment declarations', 'Auto-generated type refs'),
    'src/api/patternApi.ts': ('Local storage API for pattern feedback', 'Simulates server calls'),
    'src/api/twelveDataApi.ts': ('TwelveData HTTP client', 'Fetches market data and symbols'),
    'src/hooks/useFeedback.ts': ('Hook for submitting pattern feedback', 'Loads history from local storage'),
    'src/hooks/useLearning.ts': ('Hook for pattern learning logic', 'Aggregates feedback and metrics'),
    'src/hooks/useMarketData.ts': ('Hook for retrieving market data', 'Wraps TwelveData API calls'),
    'src/hooks/usePatternDetectionPreferences.ts': ('Stores detection feature settings', 'Persists user preferences'),
    'src/hooks/usePatterns.ts': ('Detects patterns in candle data', 'Uses adaptive detection service'),
    'src/contexts/PatternContext.tsx': ('Context for detected patterns', 'Exposes detection actions'),
    'src/contexts/LearningContext.tsx': ('Context exposing learning metrics', 'Wraps useLearning hook'),
    'src/contexts/FeedbackContext.tsx': ('Context managing feedback state', 'Uses useFeedback internally'),
    'src/contexts/MarketDataContext.tsx': ('Context providing market data', 'Wraps useMarketData hook'),
    'src/models/ChartTypes.ts': ('Chart data type definitions', 'Candlestick and dimension models'),
    'src/models/FeedbackTypes.ts': ('Types for user feedback', 'Shared between hooks and API'),
    'src/models/LearningTypes.ts': ('Learning system data types', 'Detection parameters and metrics'),
    'src/models/PatternTypes.ts': ('Pattern enumeration and models', 'Defines domain pattern shapes'),
    'src/styles/theme.ts': ('Design tokens for styling', 'Colors and spacing for UI'),
    'src/utils/compressedTimeScale.ts': ('Time scale skipping gaps', 'Compresses non-trading hours'),
    'src/utils/continuousTimeScale.ts': ('Continuous trading time scale', 'Removes overnight gaps'),
    'src/utils/exportImport.ts': ('Export and import helper', 'Persists training data to files'),
    'src/utils/featureFlags.ts': ('Client feature flag utility', 'Toggles experimental features'),
    'src/utils/formatters.ts': ('Formatting helper functions', 'Used across UI'),
    'src/utils/marketHours.ts': ('Trading hours utilities', 'Determines market open/close'),
    'src/utils/scaling.ts': ('Chart scale utilities', 'Builds time and price scales'),
    'src/utils/timeScaleUtils.ts': ('Time scale helpers', 'Handles trading hours filtering'),
    'src/utils/learning/FeedbackStorage.ts': ('Stores feedback in localStorage', 'Also saves learning parameters'),
    'src/utils/learning/LearningProcessor.ts': ('Processes feedback to tune detectors', 'Adjusts detection parameters'),
    'src/utils/learning/FeedbackAggregator.ts': ('Aggregates feedback statistics', 'Supports learning metrics'),
}

# Components and other files
component_descriptions = {
    'src/components/SymbolSearch.tsx': ('Search box for ticker symbols', 'Queries TwelveData suggestions'),
    'src/components/SymbolSearch.d.ts': ('Type definitions for SymbolSearch', 'Exports prop interfaces'),
    'src/components/Chart/TimeAxis.tsx': ('Canvas time axis renderer', 'Formats timestamps for chart'),
    'src/components/Chart/TimeAxis.d.ts': ('Type defs for TimeAxis', 'Matches canvas implementation'),
    'src/components/Chart/PriceAxis.tsx': ('Canvas price axis renderer', 'Formats price labels'),
    'src/components/Chart/PriceAxis.d.ts': ('Type defs for PriceAxis', 'Matches canvas implementation'),
    'src/components/Chart/CandlestickRenderer.tsx': ('Renders candlestick shapes', 'Draws OHLC bars on canvas'),
    'src/components/Chart/CandlestickRenderer.d.ts': ('Type defs for CandlestickRenderer', 'Matches canvas implementation'),
    'src/components/Chart/PatternRenderer.tsx': ('Renders detected patterns on chart', 'Colors based on confidence'),
    'src/components/Chart/PatternRenderer.d.ts': ('Type defs for PatternRenderer', 'Matches canvas implementation'),
    'src/components/Chart/ChartControlBar.tsx': ('Toolbar with chart controls', 'Timeframe and range selectors'),
    'src/components/Chart/ChartWorkspace.tsx': ('Layout wrapper for chart area', 'Combines chart and controls'),
    'src/components/Chart/ChartComponents.d.ts': ('Shared chart component types', 'Used for canvas renderers'),
    'src/components/Chart/TriSightChart.tsx': ('Main candlestick chart component', 'Handles zoom and pattern overlay'),
    'src/components/Chart/TimeRangeSelector.tsx': ('Buttons for selecting time range', 'Updates chart viewport'),
    'src/components/Analysis/AnalysisPanel.tsx': ('Panel showing details of a pattern', 'Provides save and feedback options'),
    'src/components/Analysis/PatternDetails.tsx': ('Small component listing pattern meta', 'Used inside AnalysisPanel'),
    'src/components/Visualizations/PivotVisualization.tsx': ('Visualization for Pivot pattern', 'Highlights pivot points'),
    'src/components/Visualizations/BlackjackVisualization.tsx': ('Visualization for Blackjack pattern', 'Shows scoring and confidence'),
    'src/components/Visualizations/EscalatorVisualization.tsx': ('Visualization for Escalator pattern', 'Shows step structure'),
    'src/components/Visualizations/RocketmanVisualization.tsx': ('Visualization for Rocketman pattern', 'Illustrates thrust stages'),
    'src/components/Settings/PivotSettingsPanel.tsx': ('Settings for Pivot detector', 'Adjusts sensitivity values'),
    'src/components/Settings/RocketmanSettingsPanel.tsx': ('Settings for Rocketman detector', 'Edit thrust thresholds'),
    'src/components/Settings/DataExportImport.tsx': ('UI for exporting and importing data', 'Handles JSON files'),
    'src/components/Learning/LearningDashboard.tsx': ('Dashboard with learning metrics', 'Displays feedback statistics'),
    'src/components/Dashboard/LearningDashboard.tsx': ('Legacy learning dashboard component', 'Shows metrics in table form'),
    'src/components/Dashboard/LearningDashboard.d.ts': ('Type defs for LearningDashboard', 'Interfaces for props'),
    'src/components/Navigation/ContextBar.tsx': ('Top bar with search and date', 'Switches between app tabs'),
    'src/components/Feedback/FeedbackModal.tsx': ('Modal to submit pattern feedback', 'Allows boundary adjustments'),
    'src/components/Feedback/EnhancedFeedbackModal.tsx': ('Advanced feedback modal', 'Shows history and rating'),
    'src/components/Feedback/BoundaryAdjuster.tsx': ('UI for tweaking pattern boundaries', 'Used within feedback modals'),
    'src/components/Feedback/GoldmineChannelAdjuster.tsx': ('Adjusts channel boundaries', 'Specific to Goldmine pattern'),
    'src/components/Feedback/ConfidenceRating.tsx': ('Star rating component', 'Captures user confidence'),
    'src/components/Feedback/PatternTypeSelector.tsx': ('Selector for correct pattern type', 'Supports feedback flow'),
    'src/components/Feedback/feedback-components.d.ts': ('Type defs for feedback components', 'Shared prop interfaces'),
    'src/components/Feedback/index.ts': ('Entry point for feedback components', 'Re-exports implementations'),
    'src/components/Patterns/PatternPanel.tsx': ('Side panel listing patterns', 'Includes adaptive controls'),
    'src/components/Patterns/PatternSelector.tsx': ('Dropdown to enable patterns', 'Filters detection types'),
    'src/components/Patterns/PatternSelector.d.ts': ('Type defs for PatternSelector', 'Prop interfaces'),
    'src/components/Patterns/AdaptivePatternControls.tsx': ('Controls for adaptive detectors', 'Enables per-pattern settings'),
    'src/components/Patterns/BlackjackSettingsPanel.tsx': ('Settings for Blackjack detector', 'Edit scoring parameters'),
    'src/components/Patterns/EscalatorSettingsPanel.tsx': ('Settings for Escalator detector', 'Configure step thresholds'),
    'src/components/Patterns/GoldmineChannelSettingsPanel.tsx': ('Settings for Goldmine Channel', 'Adjust channel detection options'),
    'src/components/Patterns/GoldmineShaftSettingsPanel.tsx': ('Settings for Goldmine Shaft', 'Adjust thrust and retrace options'),
    'src/components/Patterns/RocketmanSettingsPanel.tsx': ('Settings for Rocketman detector', 'Control thrust phases'),
    'src/components/PatternDetails/PivotPatternDetails.tsx': ('Details view for Pivot pattern', 'Shows pivot dates and prices'),
    'src/components/PatternDetails/BlackjackPatternDetails.tsx': ('Details view for Blackjack pattern', 'Shows score breakdown'),
    'src/components/PatternDetails/EscalatorPatternDetails.tsx': ('Details view for Escalator pattern', 'Shows step analysis'),
    'src/components/PatternDetails/RocketmanPatternDetails.tsx': ('Details view for Rocketman pattern', 'Shows thrust calculations'),
    'src/components/Modals/PatternDetailsModal.tsx': ('Modal wrapper for pattern details', 'Used in legacy UI'),
    'src/components/Modals/BlackjackPatternModal.tsx': ('Modal displaying Blackjack details', 'Used in analysis panel'),
}

# Declarations
for path in Path('src').rglob('*.*'):  # iterate all files
    if path.suffix not in ('.ts', '.tsx'):  # skip others
        continue
    lines = path.read_text().splitlines()
    if not lines or not lines[0].startswith('// '):
        continue
    desc, ctx = descriptions.get(str(path), component_descriptions.get(str(path), (None, None)))
    if desc is None:
        # heuristic for remaining patternDetection files
        p = str(path)
        name = path.stem
        if 'patternDetection' in p:
            if 'Adaptive' in name:
                base = name.replace('Adaptive', '').replace('Detector', '')
                desc = f'Adaptive detector for {base} pattern'
                ctx = 'Uses market context thresholds'
            elif name.endswith('DetectorFactory'):
                base = name.replace('DetectorFactory', '')
                desc = f'Factory for {base} detectors'
                ctx = 'Creates configured detector instances'
            elif name.endswith('Detector'):
                base = name.replace('Detector', '')
                desc = f'Detector for {base} pattern'
                ctx = 'Identifies occurrences in price data'
            elif name.endswith('Service'):
                desc = 'Adaptive pattern detection service'
                ctx = 'Orchestrates multiple detectors'
            elif name in ['PatternDetector', 'PatternDetectionFactory', 'PatternDetectionOrchestrator']:
                if name == 'PatternDetector':
                    desc = 'Runs all pattern detectors'
                    ctx = 'Aggregates results into list'
                elif name == 'PatternDetectionFactory':
                    desc = 'Creates pattern detector instances'
                    ctx = 'Central factory logic'
                elif name == 'PatternDetectionOrchestrator':
                    desc = 'Coordinates detectors and tracks relationships'
                    ctx = 'Handles detection workflow'
            elif name.endswith('Utils'):
                base = name.replace('DetectionUtils','').replace('Utils','')
                desc = f'Helper utilities for {base} detection'
                ctx = 'Shared by detectors'
            elif name == 'index':
                desc = 'Pattern detection module exports'
                ctx = 'Registers detector factories'
            elif name == 'MarketContext':
                desc = 'Encapsulates market environment info'
                ctx = 'Passed to detectors for thresholds'
            elif name == 'BasePatternDetector':
                desc = 'Base class for pattern detectors'
                ctx = 'Provides shared logic'
            elif name == 'PatternRegistry':
                desc = 'Registry of available detectors'
                ctx = 'Maps names to factory functions'
            elif name == 'MarketStructureAnalyzer':
                desc = 'Analyzes market structure'
                ctx = 'Used by complex detectors'
            elif name == 'PatternRelationshipTracker':
                desc = 'Tracks relationships between patterns'
                ctx = 'Used for advanced analytics'
            else:
                desc = name
                ctx = 'TriSight detection module'
        elif 'utils' in p and 'learning' not in p:
            if name == 'continuousTimeScale':
                desc = 'Continuous trading time scale'
                ctx = 'Removes overnight gaps'
            elif name == 'compressedTimeScale':
                desc = 'Compressed time scale'
                ctx = 'Skips non-trading periods'
            else:
                desc = name.replace('_',' ')
                ctx = 'Utility function'
        elif 'contexts' in p:
            desc = f'React context for {name.replace("Context", "").lower()}'
            ctx = 'Provides application state'
        elif 'hooks' in p:
            desc = f'React hook {name}'
            ctx = 'TriSight application hook'
        elif 'components' in p:
            desc = name
            ctx = 'UI component'
        else:
            desc = name
            ctx = 'TriSight source file'
    # Replace lines 1-3
    header = [f'// {path}', f'// {desc}', f'// {ctx}']
    remaining = lines[3:] if len(lines)>=3 else []
    path.write_text('\n'.join(header + remaining) + '\n')
