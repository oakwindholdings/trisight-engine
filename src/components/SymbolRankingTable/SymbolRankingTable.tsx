// src/components/SymbolRankingTable/SymbolRankingTable.tsx
// Clickable table showing ranked symbols with metrics
// Allows users to select symbols to display in chart

import React, { useState, useMemo } from 'react';
import styled from 'styled-components';
import { SymbolRanking, SymbolRankingTableProps } from '../../types/SymbolRanking';

const TableContainer = styled.div`
  width: 100%;
  background: #ffffff;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
`;

const TableWrapper = styled.div`
  max-height: 400px;
  overflow-y: auto;
  overflow-x: auto;
  
  &::-webkit-scrollbar {
    width: 8px;
    height: 8px;
  }
  
  &::-webkit-scrollbar-track {
    background: #f1f5f9;
  }
  
  &::-webkit-scrollbar-thumb {
    background: #cbd5e1;
    border-radius: 4px;
    
    &:hover {
      background: #94a3b8;
    }
  }
`;

const Table = styled.table`
  width: 100%;
  border-collapse: collapse;
  font-size: 14px;
`;

const TableHeader = styled.thead`
  background: #f8fafc;
  position: sticky;
  top: 0;
  z-index: 10;
`;

const HeaderCell = styled.th<{ sortable?: boolean }>`
  padding: 12px 16px;
  text-align: left;
  font-weight: 600;
  color: #475569;
  border-bottom: 2px solid #e5e7eb;
  cursor: ${props => props.sortable ? 'pointer' : 'default'};
  user-select: none;
  white-space: nowrap;
  
  &:hover {
    background: ${props => props.sortable ? '#f1f5f9' : 'transparent'};
  }
  
  &.sorted {
    color: #1e293b;
  }
`;

const SortIcon = styled.span`
  display: inline-block;
  margin-left: 4px;
  font-size: 12px;
  color: #94a3b8;
`;

const TableBody = styled.tbody`
  background: #ffffff;
`;

const TableRow = styled.tr<{ selected?: boolean }>`
  cursor: pointer;
  transition: background-color 0.2s;
  background: ${props => props.selected ? '#e0f2fe' : 'transparent'};
  
  &:hover {
    background: ${props => props.selected ? '#e0f2fe' : '#f8fafc'};
  }
  
  &:not(:last-child) {
    border-bottom: 1px solid #f1f5f9;
  }
`;

const TableCell = styled.td`
  padding: 12px 16px;
  color: #1e293b;
`;

const SymbolCell = styled(TableCell)`
  font-weight: 600;
  color: #0ea5e9;
`;

const RatingCell = styled(TableCell)<{ value: number; type: 'risk' | 'positive' }>`
  font-weight: 500;
  color: ${props => {
    if (props.type === 'risk') {
      // Risk: lower is better (green < 30, yellow 30-60, red > 60)
      if (props.value < 30) return '#10b981';
      if (props.value < 60) return '#f59e0b';
      return '#ef4444';
    } else {
      // Others: higher is better (green > 70, yellow 40-70, red < 40)
      if (props.value > 70) return '#10b981';
      if (props.value > 40) return '#f59e0b';
      return '#ef4444';
    }
  }};
`;

const PriceCell = styled(TableCell)`
  font-family: 'Monaco', 'Courier New', monospace;
  text-align: right;
`;

const PlaceholderMessage = styled.div`
  padding: 48px;
  text-align: center;
  color: #64748b;
  font-size: 16px;
`;

type SortField = keyof SymbolRanking;
type SortDirection = 'asc' | 'desc';

export const SymbolRankingTable: React.FC<SymbolRankingTableProps> = ({
  rankings,
  selectedSymbol,
  onSymbolSelect,
  loading = false
}) => {
  const [sortField, setSortField] = useState<SortField>('tractionRating');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  
  const handleSort = (field: SortField) => {
    if (field === sortField) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };
  
  const sortedRankings = useMemo(() => {
    return [...rankings].sort((a, b) => {
      const aValue = a[sortField];
      const bValue = b[sortField];
      
      if (typeof aValue === 'number' && typeof bValue === 'number') {
        return sortDirection === 'asc' ? aValue - bValue : bValue - aValue;
      }
      
      if (typeof aValue === 'string' && typeof bValue === 'string') {
        return sortDirection === 'asc' 
          ? aValue.localeCompare(bValue)
          : bValue.localeCompare(aValue);
      }
      
      return 0;
    });
  }, [rankings, sortField, sortDirection]);
  
  if (loading) {
    return (
      <TableContainer>
        <PlaceholderMessage>Loading rankings...</PlaceholderMessage>
      </TableContainer>
    );
  }
  
  if (rankings.length === 0) {
    return (
      <TableContainer>
        <PlaceholderMessage>No ranked signals found.</PlaceholderMessage>
      </TableContainer>
    );
  }
  
  const formatPrice = (price: number) => {
    return `$${price.toFixed(2)}`;
  };
  
  const formatRatio = (ratio: number) => {
    return ratio.toFixed(1);
  };
  
  const getSortIcon = (field: SortField) => {
    if (sortField !== field) return '↕';
    return sortDirection === 'asc' ? '↑' : '↓';
  };
  
  return (
    <TableContainer>
      <TableWrapper>
        <Table>
          <TableHeader>
            <tr>
              <HeaderCell>Symbol</HeaderCell>
              <HeaderCell sortable onClick={() => handleSort('riskRating')}>
                Risk Rating
                <SortIcon>{getSortIcon('riskRating')}</SortIcon>
              </HeaderCell>
              <HeaderCell sortable onClick={() => handleSort('tractionRating')}>
                Traction
                <SortIcon>{getSortIcon('tractionRating')}</SortIcon>
              </HeaderCell>
              <HeaderCell sortable onClick={() => handleSort('strengthRating')}>
                Strength
                <SortIcon>{getSortIcon('strengthRating')}</SortIcon>
              </HeaderCell>
              <HeaderCell sortable onClick={() => handleSort('timingRating')}>
                Timing
                <SortIcon>{getSortIcon('timingRating')}</SortIcon>
              </HeaderCell>
              <HeaderCell sortable onClick={() => handleSort('businessModelRatio')}>
                TOM Ratio
                <SortIcon>{getSortIcon('businessModelRatio')}</SortIcon>
              </HeaderCell>
              <HeaderCell sortable onClick={() => handleSort('acceleration')}>
                Acceleration
                <SortIcon>{getSortIcon('acceleration')}</SortIcon>
              </HeaderCell>
              <HeaderCell sortable onClick={() => handleSort('sectorRating')}>
                Sector
                <SortIcon>{getSortIcon('sectorRating')}</SortIcon>
              </HeaderCell>
              <HeaderCell sortable onClick={() => handleSort('currentPrice')}>
                Price
                <SortIcon>{getSortIcon('currentPrice')}</SortIcon>
              </HeaderCell>
            </tr>
          </TableHeader>
          <TableBody>
            {sortedRankings.map((ranking) => (
              <TableRow
                key={ranking.symbol}
                selected={ranking.symbol === selectedSymbol}
                onClick={() => onSymbolSelect(ranking.symbol)}
              >
                <SymbolCell>{ranking.symbol}</SymbolCell>
                <RatingCell value={ranking.riskRating} type="risk">
                  {ranking.riskRating}
                </RatingCell>
                <RatingCell value={ranking.tractionRating} type="positive">
                  {ranking.tractionRating}
                </RatingCell>
                <RatingCell value={ranking.strengthRating} type="positive">
                  {ranking.strengthRating}
                </RatingCell>
                <RatingCell value={ranking.timingRating} type="positive">
                  {ranking.timingRating}
                </RatingCell>
                <TableCell>{formatRatio(ranking.businessModelRatio)}</TableCell>
                <TableCell>{formatRatio(ranking.acceleration)}</TableCell>
                <RatingCell value={ranking.sectorRating} type="positive">
                  {ranking.sectorRating}
                </RatingCell>
                <PriceCell>{formatPrice(ranking.currentPrice)}</PriceCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableWrapper>
    </TableContainer>
  );
};
