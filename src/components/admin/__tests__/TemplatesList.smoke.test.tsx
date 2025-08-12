import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { TemplatesList } from '../TemplatesList';

jest.mock('../../../services/adminApi');

test('TemplatesList exposes critical testids', async () => {
  const onSelect = jest.fn();
  render(<TemplatesList onSelect={onSelect} />);

  expect(await screen.findByTestId('admin-templateslist-adminkey-input')).toBeInTheDocument();
  fireEvent.change(screen.getByTestId('admin-templateslist-adminkey-input'), { target: { value: 'KEY' } });
  fireEvent.click(screen.getByTestId('admin-templateslist-save-adminkey'));

  fireEvent.change(screen.getByTestId('admin-templateslist-new-name'), { target: { value: 'New T' } });
  fireEvent.change(screen.getByTestId('admin-templateslist-new-desc'), { target: { value: 'Desc' } });
  fireEvent.click(screen.getByTestId('admin-templateslist-create'));

  const list = await screen.findByTestId('admin-templateslist-list');
  expect(list).toBeInTheDocument();
  expect(list.querySelector('[data-testid="admin-templateslist-row-t1"]')).toBeTruthy();
});

