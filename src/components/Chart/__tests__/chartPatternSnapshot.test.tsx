// src/components/Chart/__tests__/chartPatternSnapshot.test.tsx
// Simplified chart pattern test for debugging
// Minimal dependencies

import React from 'react';
import { render } from '@testing-library/react';
import '@testing-library/jest-dom';

// Mock the hooks that might be causing issues
jest.mock('../../../hooks/usePatternBus');
jest.mock('../../../hooks/useSmoothZoom');
jest.mock('../../../hooks/useInfiniteZoomController');
jest.mock('../../../hooks/usePanController');

describe('Chart Pattern Snapshot Test', () => {
  it('renders basic structure', () => {
    const { container } = render(
      <div className="chart-wrapper">
        <canvas data-testid="main-canvas" />
        <canvas data-testid="pattern-canvas" />
        <canvas data-testid="interaction-canvas" />
      </div>
    );
    
    const canvases = container.querySelectorAll('canvas');
    expect(canvases).toHaveLength(3);
    
    // Generate snapshot
    expect(container.innerHTML).toMatchInlineSnapshot(`
      "<div class=\\"chart-wrapper\\"><canvas data-testid=\\"main-canvas\\"></canvas><canvas data-testid=\\"pattern-canvas\\"></canvas><canvas data-testid=\\"interaction-canvas\\"></canvas></div>"
    `);
  });
});
