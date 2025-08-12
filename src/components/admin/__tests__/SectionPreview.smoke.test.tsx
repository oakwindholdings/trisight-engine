import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { SectionPreview } from '../SectionPreview';

beforeEach(() => {
  (global as any).fetch = jest.fn(async () => ({ json: async () => ({ success: true, data: { content: 'OK', format: 'markdown', meta: {} } }) })) as any;
});

test('SectionPreview exposes critical testids', async () => {
  render(<SectionPreview section_key="executive_summary" />);
  expect(screen.getByTestId('admin-prev-ticker')).toBeInTheDocument();
  expect(screen.getByTestId('admin-prev-timeframe')).toBeInTheDocument();
  expect(screen.getByTestId('admin-prev-provider')).toBeInTheDocument();
  expect(screen.getByTestId('admin-prev-format')).toBeInTheDocument();
  expect(screen.getByTestId('admin-prev-template')).toBeInTheDocument();
  fireEvent.click(screen.getByTestId('admin-prev-run'));
  const output = await screen.findByTestId('admin-prev-output');
  expect(output).toHaveTextContent('OK');
});

