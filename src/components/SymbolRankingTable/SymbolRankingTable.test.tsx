// src/components/SymbolRankingTable/SymbolRankingTable.test.tsx
// Unit tests for SymbolRankingTable component
// Tests rendering, sorting, selection, and edge cases

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { SymbolRankingTable } from './SymbolRankingTable';
import { SymbolRanking } from '../../types/SymbolRanking';

const mockRankings: SymbolRanking[] = [
  {
    symbol: 'AAPL',
    riskRating: 35,
    tractionRating: 71,
    strengthRating: 82,
    timingRating: 45,
    businessModelRatio: 2.1,
    acceleration: 3.2,
    sectorRating: 75,
    currentPrice: 189.23
  },
  {
    symbol: 'MSFT',
    riskRating: 28,
    tractionRating: 68,
    strengthRating: 76,
    timingRating: 52,
    businessModelRatio: 1.9,
    acceleration: 2.8,
    sectorRating: 80,
    currentPrice: 426.78
  },
  {
    symbol: 'GOOGL',
    riskRating: 38,
    tractionRating: 59,
    strengthRating: 68,
    timingRating: 41,
    businessModelRatio: 1.6,
    acceleration: 4.1,
    sectorRating: 72,
    currentPrice: 142.56
  }
];

describe('SymbolRankingTable', () => {
  const mockOnSymbolSelect = jest.fn();
  
  beforeEach(() => {
    mockOnSymbolSelect.mockClear();
  });
  
  describe('Rendering', () => {
    it('renders all columns', () => {
      render(
        <SymbolRankingTable
          rankings={mockRankings}
          onSymbolSelect={mockOnSymbolSelect}
        />
      );
      
      expect(screen.getByText('Symbol')).toBeInTheDocument();
      expect(screen.getByText('Risk Rating')).toBeInTheDocument();
      expect(screen.getByText('Traction')).toBeInTheDocument();
      expect(screen.getByText('Strength')).toBeInTheDocument();
      expect(screen.getByText('Timing')).toBeInTheDocument();
      expect(screen.getByText('TOM Ratio')).toBeInTheDocument();
      expect(screen.getByText('Acceleration')).toBeInTheDocument();
      expect(screen.getByText('Sector')).toBeInTheDocument();
      expect(screen.getByText('Price')).toBeInTheDocument();
    });
    
    it('renders all rows', () => {
      render(
        <SymbolRankingTable
          rankings={mockRankings}
          onSymbolSelect={mockOnSymbolSelect}
        />
      );
      
      expect(screen.getByText('AAPL')).toBeInTheDocument();
      expect(screen.getByText('MSFT')).toBeInTheDocument();
      expect(screen.getByText('GOOGL')).toBeInTheDocument();
    });
    
    it('formats prices correctly', () => {
      render(
        <SymbolRankingTable
          rankings={mockRankings}
          onSymbolSelect={mockOnSymbolSelect}
        />
      );
      
      expect(screen.getByText('$189.23')).toBeInTheDocument();
      expect(screen.getByText('$426.78')).toBeInTheDocument();
      expect(screen.getByText('$142.56')).toBeInTheDocument();
    });
    
    it('formats ratios correctly', () => {
      render(
        <SymbolRankingTable
          rankings={mockRankings}
          onSymbolSelect={mockOnSymbolSelect}
        />
      );
      
      expect(screen.getByText('2.1')).toBeInTheDocument(); // TOM ratio
      expect(screen.getByText('3.2')).toBeInTheDocument(); // Acceleration
    });
  });
  
  describe('Loading and Empty States', () => {
    it('displays loading message when loading', () => {
      render(
        <SymbolRankingTable
          rankings={[]}
          onSymbolSelect={mockOnSymbolSelect}
          loading={true}
        />
      );
      
      expect(screen.getByText('Loading rankings...')).toBeInTheDocument();
    });
    
    it('displays empty message when no data', () => {
      render(
        <SymbolRankingTable
          rankings={[]}
          onSymbolSelect={mockOnSymbolSelect}
          loading={false}
        />
      );
      
      expect(screen.getByText('No ranked signals found.')).toBeInTheDocument();
    });
  });
  
  describe('Row Selection', () => {
    it('calls onSymbolSelect when row is clicked', () => {
      render(
        <SymbolRankingTable
          rankings={mockRankings}
          onSymbolSelect={mockOnSymbolSelect}
        />
      );
      
      fireEvent.click(screen.getByText('MSFT'));
      expect(mockOnSymbolSelect).toHaveBeenCalledWith('MSFT');
    });
    
    it('highlights selected row', () => {
      const { container } = render(
        <SymbolRankingTable
          rankings={mockRankings}
          selectedSymbol="AAPL"
          onSymbolSelect={mockOnSymbolSelect}
        />
      );
      
      const appleRow = container.querySelector('tr[selected]');
      expect(appleRow).toBeInTheDocument();
    });
  });
  
  describe('Sorting', () => {
    it('sorts by traction rating by default (descending)', () => {
      const { container } = render(
        <SymbolRankingTable
          rankings={mockRankings}
          onSymbolSelect={mockOnSymbolSelect}
        />
      );
      
      const symbols = container.querySelectorAll('tbody tr td:first-child');
      expect(symbols[0]).toHaveTextContent('AAPL'); // Highest traction (71)
      expect(symbols[1]).toHaveTextContent('MSFT'); // Second (68)
      expect(symbols[2]).toHaveTextContent('GOOGL'); // Lowest (59)
    });
    
    it('toggles sort direction when header is clicked', () => {
      const { container } = render(
        <SymbolRankingTable
          rankings={mockRankings}
          onSymbolSelect={mockOnSymbolSelect}
        />
      );
      
      // Click traction header to toggle to ascending
      fireEvent.click(screen.getByText('Traction'));
      
      const symbols = container.querySelectorAll('tbody tr td:first-child');
      expect(symbols[0]).toHaveTextContent('GOOGL'); // Lowest traction (59)
      expect(symbols[2]).toHaveTextContent('AAPL'); // Highest (71)
    });
    
    it('sorts by different columns when headers are clicked', () => {
      const { container } = render(
        <SymbolRankingTable
          rankings={mockRankings}
          onSymbolSelect={mockOnSymbolSelect}
        />
      );
      
      // Click risk rating header
      fireEvent.click(screen.getByText('Risk Rating'));
      
      const symbols = container.querySelectorAll('tbody tr td:first-child');
      expect(symbols[0]).toHaveTextContent('GOOGL'); // Highest risk (38)
      expect(symbols[1]).toHaveTextContent('AAPL'); // Second (35)
      expect(symbols[2]).toHaveTextContent('MSFT'); // Lowest (28)
    });
  });
  
  describe('Color Coding', () => {
    it('applies correct colors for risk ratings', () => {
      const { container } = render(
        <SymbolRankingTable
          rankings={[
            { ...mockRankings[0], riskRating: 25 }, // Green (< 30)
            { ...mockRankings[1], riskRating: 45 }, // Yellow (30-60)
            { ...mockRankings[2], riskRating: 75 }  // Red (> 60)
          ]}
          onSymbolSelect={mockOnSymbolSelect}
        />
      );
      
      const riskCells = container.querySelectorAll('tbody tr td:nth-child(2)');
      expect(riskCells[0]).toHaveStyle('color: #10b981'); // Green
      expect(riskCells[1]).toHaveStyle('color: #f59e0b'); // Yellow
      expect(riskCells[2]).toHaveStyle('color: #ef4444'); // Red
    });
    
    it('applies correct colors for positive ratings', () => {
      const { container } = render(
        <SymbolRankingTable
          rankings={[
            { ...mockRankings[0], strengthRating: 80 }, // Green (> 70)
            { ...mockRankings[1], strengthRating: 50 }, // Yellow (40-70)
            { ...mockRankings[2], strengthRating: 30 }  // Red (< 40)
          ]}
          onSymbolSelect={mockOnSymbolSelect}
        />
      );
      
      const strengthCells = container.querySelectorAll('tbody tr td:nth-child(4)');
      expect(strengthCells[0]).toHaveStyle('color: #10b981'); // Green
      expect(strengthCells[1]).toHaveStyle('color: #f59e0b'); // Yellow
      expect(strengthCells[2]).toHaveStyle('color: #ef4444'); // Red
    });
  });
  
  describe('Edge Cases', () => {
    it('handles null/undefined values gracefully', () => {
      const edgeCaseRankings: SymbolRanking[] = [{
        symbol: 'TEST',
        riskRating: null as any,
        tractionRating: undefined as any,
        strengthRating: 50,
        timingRating: 50,
        businessModelRatio: null as any,
        acceleration: undefined as any,
        sectorRating: 50,
        currentPrice: null as any
      }];
      
      render(
        <SymbolRankingTable
          rankings={edgeCaseRankings}
          onSymbolSelect={mockOnSymbolSelect}
        />
      );
      
      expect(screen.getByText('TEST')).toBeInTheDocument();
      // Should not crash
    });
    
    it('handles very large numbers', () => {
      const largeNumberRankings: SymbolRanking[] = [{
        symbol: 'BIG',
        riskRating: 99999,
        tractionRating: 99999,
        strengthRating: 99999,
        timingRating: 99999,
        businessModelRatio: 99999.9,
        acceleration: 99999.9,
        sectorRating: 99999,
        currentPrice: 99999.99
      }];
      
      render(
        <SymbolRankingTable
          rankings={largeNumberRankings}
          onSymbolSelect={mockOnSymbolSelect}
        />
      );
      
      expect(screen.getByText('$99999.99')).toBeInTheDocument();
      expect(screen.getByText('100000.0')).toBeInTheDocument(); // Rounded ratio
    });
  });
});
