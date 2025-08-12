import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { PromptDrawer } from '../PromptDrawer';

jest.mock('../../../services/adminApi');

test('PromptDrawer exposes critical testids', async () => {
  render(<PromptDrawer />);
  expect(await screen.findByTestId('admin-pd-section')).toBeInTheDocument();
  expect(screen.getByTestId('admin-pd-provider')).toBeInTheDocument();
  expect(screen.getByTestId('admin-pd-model')).toBeInTheDocument();
  expect(screen.getByTestId('admin-pd-format')).toBeInTheDocument();
  expect(screen.getByTestId('admin-pd-template')).toBeInTheDocument();
  fireEvent.click(await screen.findByTestId('admin-pd-var-INPUT-ticker'));
  fireEvent.click(screen.getByTestId('admin-pd-save'));
});

