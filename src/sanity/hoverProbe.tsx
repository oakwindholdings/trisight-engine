// src/sanity/hoverProbe.tsx
// Probe to verify InfiniteZoomChart with PatternProvider compiles correctly
// Tests SSR rendering of the wrapped component

import React from 'react';
import { renderToString } from 'react-dom/server';
import InfiniteZoomChart from '../components/Chart/InfiniteZoomChart';

renderToString(<InfiniteZoomChart 
  symbol="AAPL"
  width={800}
  height={600}
/>);

console.log('[HoverProbe] render ok');
