# TriSight Pattern Training Interface

## Overview

The TriSight Pattern Training Interface is a next-generation AI-guided equity analyst interface for detecting and improving trading pattern recognition. This system allows financial analysts to interact with AI-detected trading patterns, provide corrective feedback, and improve the pattern detection algorithms through continuous learning.

## Features

### Market Data Integration

- **TwelveData API Integration** with real-time market data
- Automatic caching and request throttling
- Support for multiple timeframes (1min, 5min, 15min, 1hour, 1day, 5day)
- Symbol search functionality

### Advanced Chart Visualization

- High-performance HTML5 Canvas implementation
- Candlestick chart with volume indicators
- Multiple zoom levels with smooth transitions
- Horizontal panning with momentum scrolling
- Double buffering for smooth rendering

### Pattern Visualization

Detection and visualization of six key pattern types:

1. **Goldmine Channel** - Parallel lines connecting highs and lows
2. **Goldmine Shaft** - Arrow-like formation showing thrust direction
3. **Pivot** - Horizontal lines at support/resistance levels
4. **Rocketman** - Curved acceleration lines with intensity gradients
5. **Escalator** - Horizontal steps with consolidation areas
6. **Blackjack** - Price-volume correlation analysis

### Feedback Collection

- **Interactive Pattern Selection**: Click on any pattern with feedback enabled to provide input
- **Comprehensive Feedback Modal**: 
  - Accuracy rating slider (1-5 scale)
  - Confidence level assessment (0-100%)
  - Timing evaluation (early/perfect/late)
  - Validity verification with reason selection
  - Optional notes for additional context
- **Privacy-First Approach**:
  - Anonymous feedback collection
  - Granular consent management
  - 90-day automatic data retention
  - GDPR-compliant data handling

### Learning System

- **Automated Feedback Processing**:
  - Real-time pattern learning engine
  - Batch processing at configurable thresholds
  - Weighted metric calculations based on user confidence
- **Dynamic Pattern Adjustments**:
  - Confidence threshold adaptation
  - Timing offset corrections
  - Pattern enablement based on validity rates
- **Performance Monitoring**:
  - Feedback velocity tracking
  - Accuracy trend analysis
  - Model version management

## Technical Architecture

- React + TypeScript for robust frontend development
- Custom state management using React Context API
- Canvas-based rendering for optimal performance
- Local storage for model and feedback persistence

### Pattern Detection System

TriSight uses an **Adaptive Pattern Detection Architecture** with the following components:

- **AdaptiveBlackjackDetector** - Adaptive price-volume correlation analysis
- **AdaptiveEscalatorDetector** - Adaptive step formation detection with market context
- **AdaptiveGoldmineChannelDetector** - Adaptive parallel channel detection
- **AdaptiveGoldmineShaftDetector** - Adaptive thrust direction analysis
- **AdaptivePivotDetector** - Adaptive support/resistance level detection
- **AdaptiveRocketmanDetector** - Adaptive acceleration pattern detection

All pattern detectors extend `BasePatternDetector` and integrate with market context thresholds for improved accuracy and reduced false positives.

## Getting Started

### Prerequisites

- Node.js (v14 or later)
- npm (v6 or later)

### Installation

```bash
# Clone the repository (if applicable)
# git clone <repository-url>

# Navigate to the project directory
cd trisight-equity-analyst

# Install dependencies
npm install
```

### Running the Application

```bash
# Start the development server
npm start
```

Open [http://localhost:3000](http://localhost:3000) to view the application in your browser.

## Usage

1. **Search for a symbol** in the top search bar (e.g., AAPL, MSFT, GOOGL)
2. **View detected patterns** on the chart
3. **Click on a pattern** to provide feedback
4. **Switch to the Learning Dashboard** to view learning metrics

## API Configuration

The application uses the TwelveData API for market data. Create a `.env` file at
the project root (you can copy `.env.example`) and add your API key:

```bash
REACT_APP_TWELVE_DATA_API_KEY=your_api_key_here
```

This key is loaded by `src/api/twelveDataApi.ts` at runtime.

## Pattern Types and Detection

The system detects six primary pattern types, each with its own visual characteristics and detection algorithms:

### Blackjack Pattern

Scoring based on price and volume correlation:
- When price goes up and volume goes up: +1
- When price goes up and volume goes down: 0
- When price goes down and volume goes up: -1
- When price goes down and volume goes down: 0

A cumulative score is calculated over a 7-period window.

### Goldmine Channel

Parallel lines connecting highs and lows, with direction classified as:
- Horizontal
- Ascending
- Descending

### Other Patterns

See the pattern documentation for details on Goldmine Shaft, Pivot, Rocketman, and Escalator patterns.

## Contributing

To contribute to the TriSight Pattern Training Interface:

1. Add additional pattern detection algorithms
2. Improve visualization components
3. Enhance the learning system
4. Add additional testing and validation

## License

This project is proprietary and confidential.
