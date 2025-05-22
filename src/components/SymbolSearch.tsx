// src/components/SymbolSearch.tsx
// Search box for ticker symbols
// Queries TwelveData suggestions
import React, { useState, useEffect, useRef } from 'react';
import styled from 'styled-components';
import { searchSymbols } from '../api/twelveDataApi';
import { useMarketDataContext } from '../contexts/MarketDataContext';

const SearchContainer = styled.div`
  position: relative;
  width: 300px;
`;

const SearchInput = styled.input`
  width: 100%;
  padding: 8px 12px;
  border: none;
  border-radius: 4px;
  background-color: rgba(255, 255, 255, 0.15);
  color: white;
  font-size: 14px;
  
  &::placeholder {
    color: rgba(255, 255, 255, 0.7);
  }
  
  &:focus {
    outline: none;
    background-color: rgba(255, 255, 255, 0.25);
  }
`;

const ResultsDropdown = styled.div`
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  background-color: white;
  border-radius: 4px;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
  margin-top: 4px;
  max-height: 300px;
  overflow-y: auto;
  z-index: 10;
`;

const ResultItem = styled.div`
  padding: 8px 12px;
  cursor: pointer;
  
  &:hover {
    background-color: #f5f5f5;
  }
`;

const SymbolName = styled.div`
  font-weight: 500;
  font-size: 14px;
`;

const SymbolDetails = styled.div`
  font-size: 12px;
  color: #757575;
`;

const LoadingIndicator = styled.div`
  padding: 8px 12px;
  color: #757575;
  font-size: 14px;
  text-align: center;
`;

const SymbolSearch: React.FC = () => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Array<{
    symbol: string;
    name: string;
    exchange: string;
    type: string;
  }>>([]);
  const [loading, setLoading] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const searchContainerRef = useRef<HTMLDivElement>(null);
  
  const { symbol, setSymbol } = useMarketDataContext();
  
  // Search for symbols when query changes
  useEffect(() => {
    const searchTimer = setTimeout(async () => {
      if (query.length >= 2) {
        setLoading(true);
        try {
          const searchResults = await searchSymbols(query);
          setResults(searchResults);
        } catch (error) {
          console.error('Error searching symbols:', error);
        } finally {
          setLoading(false);
        }
      } else {
        setResults([]);
      }
    }, 300);
    
    return () => clearTimeout(searchTimer);
  }, [query]);
  
  // Handle clicks outside the search component
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        searchContainerRef.current && 
        !searchContainerRef.current.contains(event.target as Node)
      ) {
        setShowResults(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);
  
  // Handle symbol selection
  const handleSelectSymbol = (selectedSymbol: string) => {
    setSymbol(selectedSymbol);
    setQuery(selectedSymbol);
    setShowResults(false);
  };
  
  return (
    <SearchContainer ref={searchContainerRef}>
      <SearchInput
        type="text"
        placeholder="Search for a symbol..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onFocus={() => setShowResults(true)}
      />
      
      {showResults && (query.length >= 2 || loading) && (
        <ResultsDropdown>
          {loading ? (
            <LoadingIndicator>Searching...</LoadingIndicator>
          ) : results.length > 0 ? (
            results.map((result) => (
              <ResultItem 
                key={result.symbol}
                onClick={() => handleSelectSymbol(result.symbol)}
              >
                <SymbolName>{result.symbol}</SymbolName>
                <SymbolDetails>
                  {result.name} • {result.exchange}
                </SymbolDetails>
              </ResultItem>
            ))
          ) : query.length >= 2 ? (
            <LoadingIndicator>No results found</LoadingIndicator>
          ) : null}
        </ResultsDropdown>
      )}
    </SearchContainer>
  );
};

export default SymbolSearch;
