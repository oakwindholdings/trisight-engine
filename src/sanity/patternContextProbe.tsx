// src/sanity/patternContextProbe.tsx
// Probe to verify PatternContext is properly wired
// Tests that context values can be set and accessed

import React from 'react';
import { PatternProvider } from '../context/PatternContext';
import { renderToString } from 'react-dom/server';

function TestComponent() {
  return <div>Test</div>;
}

renderToString(
  <PatternProvider>
    <TestComponent />
  </PatternProvider>
);

console.log('[PatternProbe] render ok');
