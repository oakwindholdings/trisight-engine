// src/App.test.tsx
// Basic CRA test harness
// Ensures App renders

jest.mock('d3-scale'); // 👈 MUST be first, before imports that might trigger the real d3-scale

import React from 'react';
import { render, screen } from '@testing-library/react';
import App from './App';

test('renders learn react link', () => {
  render(<App />);
  const linkElement = screen.getByText(/learn react/i);
  expect(linkElement).toBeInTheDocument();
});
