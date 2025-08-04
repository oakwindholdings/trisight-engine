// src/__mocks__/lucide-react.js
// Mock for lucide-react icons
// Context: Simplifies icon testing by replacing with simple components

const React = require('react');

// Create a mock component for each icon
const createIcon = (name) => {
  const Icon = React.forwardRef((props, ref) => 
    React.createElement('svg', {
      ...props,
      ref,
      'data-testid': `icon-${name}`,
      'aria-label': name
    })
  );
  Icon.displayName = name;
  return Icon;
};

// Export all commonly used icons
module.exports = {
  FileText: createIcon('FileText'),
  LineChart: createIcon('LineChart'),
  Shield: createIcon('Shield'),
  Zap: createIcon('Zap'),
  Download: createIcon('Download'),
  Eye: createIcon('Eye'),
  Trash2: createIcon('Trash2'),
  Check: createIcon('Check'),
  X: createIcon('X'),
  ChevronRight: createIcon('ChevronRight'),
  ChevronLeft: createIcon('ChevronLeft'),
  Plus: createIcon('Plus'),
  Search: createIcon('Search'),
  Filter: createIcon('Filter'),
  Calendar: createIcon('Calendar'),
  Clock: createIcon('Clock'),
  AlertCircle: createIcon('AlertCircle'),
  Loader2: createIcon('Loader2'),
  RefreshCw: createIcon('RefreshCw'),
  Maximize2: createIcon('Maximize2'),
  FileDown: createIcon('FileDown'),
  Sparkles: createIcon('Sparkles'),
  TrendingUp: createIcon('TrendingUp'),
  BarChart3: createIcon('BarChart3'),
  PieChart: createIcon('PieChart'),
  Activity: createIcon('Activity'),
  CandlestickChart: createIcon('CandlestickChart'),
  Building2: createIcon('Building2'),
  Briefcase: createIcon('Briefcase')
};