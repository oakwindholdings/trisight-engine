// src/feed/components/__tests__/FilterBar.test.tsx
// Tests for FilterBar component
// Ensures proper rendering and interaction

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { FilterBar } from '../FilterBar';
import { FeedFilterProvider } from '../../contexts/FeedFilterContext';

// Mock the individual filter components
jest.mock('../PatternTypeFilter', () => ({
  PatternTypeFilter: () => <div data-testid="pattern-type-filter">Pattern Type Filter</div>
}));

jest.mock('../TimeWindowFilter', () => ({
  TimeWindowFilter: () => <div data-testid="time-window-filter">Time Window Filter</div>
}));

jest.mock('../IntervalFilter', () => ({
  IntervalFilter: () => <div data-testid="interval-filter">Interval Filter</div>
}));

jest.mock('../FilterChips', () => ({
  FilterChips: () => <div data-testid="filter-chips">Filter Chips</div>
}));

const renderWithProvider = (component: React.ReactElement) => {
  return render(
    <FeedFilterProvider>
      {component}
    </FeedFilterProvider>
  );
};

describe('FilterBar', () => {
  const defaultProps = {
    totalCount: 100,
    filteredCount: 100
  };

  it('should render all filter components', () => {
    renderWithProvider(<FilterBar {...defaultProps} />);
    
    expect(screen.getByTestId('pattern-type-filter')).toBeInTheDocument();
    expect(screen.getByTestId('time-window-filter')).toBeInTheDocument();
    expect(screen.getByTestId('interval-filter')).toBeInTheDocument();
  });

  it('should display correct filter stats when no filters active', () => {
    renderWithProvider(<FilterBar {...defaultProps} />);
    
    expect(screen.getByText('100 patterns')).toBeInTheDocument();
  });

  it('should display correct filter stats when filters are active', () => {
    renderWithProvider(
      <FilterBar totalCount={100} filteredCount={25} />
    );
    
    expect(screen.getByText(/25 of 100 patterns/)).toBeInTheDocument();
  });

  it('should show clear all button', () => {
    renderWithProvider(<FilterBar {...defaultProps} />);
    
    const clearButton = screen.getByText('Clear All');
    expect(clearButton).toBeInTheDocument();
  });

  it('should not show filter chips when no active filters', () => {
    renderWithProvider(<FilterBar {...defaultProps} />);
    
    expect(screen.queryByTestId('filter-chips')).not.toBeInTheDocument();
  });

  it('should apply custom className', () => {
    const { container } = renderWithProvider(
      <FilterBar {...defaultProps} className="custom-class" />
    );
    
    expect(container.firstChild).toHaveClass('custom-class');
  });
});

describe('FilterBar Integration', () => {
  it('should handle clear all filters action', () => {
    renderWithProvider(<FilterBar totalCount={100} filteredCount={50} />);
    
    const clearButton = screen.getByText('Clear All');
    fireEvent.click(clearButton);
    
    // The button should be disabled after clearing (no active filters)
    expect(clearButton).toBeDisabled();
  });
});
