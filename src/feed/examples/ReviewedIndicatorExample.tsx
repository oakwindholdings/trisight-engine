// src/feed/examples/ReviewedIndicatorExample.tsx
// Example usage of the ReviewedIndicator component
// Shows how to implement reviewed status in pattern feed cards

import React from 'react';
import styled from 'styled-components';
import { ReviewedIndicator } from '../components/ReviewedIndicator';
import { PatternFeedEntry } from '../types/PatternFeedTypes';

const ExampleContainer = styled.div`
  padding: 1rem;
  max-width: 600px;
  margin: 0 auto;
`;

const ExampleCard = styled.div`
  border: 1px solid #e5e5e5;
  border-radius: 0.375rem;
  padding: 1rem;
  margin-bottom: 1rem;
  background: white;
`;

const CardHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 0.5rem;
`;

const PatternTitle = styled.h3`
  margin: 0;
  font-size: 1rem;
  font-weight: 600;
`;

const PatternDetails = styled.div`
  font-size: 0.875rem;
  color: #6b7280;
  margin-bottom: 0.5rem;
`;

// Example data
const examplePatterns: PatternFeedEntry[] = [
  {
    id: '1',
    symbol: 'AAPL',
    patternType: 'ESCALATOR',
    eventType: 'PATTERN',
    timestamp: '2025-01-26T10:30:00Z',
    humanSummary: 'Strong escalator pattern detected with 5 clear steps',
    mcpVersion: '0.1.0',
    confidence: 0.85,
    reviewed: true,
    reviewedBy: 'dick-analyst',
    reviewedAt: '2025-01-26T11:15:00Z'
  },
  {
    id: '2',
    symbol: 'TSLA',
    patternType: 'GOLDMINE_SHAFT',
    eventType: 'PATTERN',
    timestamp: '2025-01-26T09:45:00Z',
    humanSummary: 'Goldmine shaft pattern with fibonacci retracement',
    mcpVersion: '0.1.0',
    confidence: 0.72,
    reviewed: false
  },
  {
    id: '3',
    symbol: 'MSFT',
    patternType: 'BLACKJACK',
    eventType: 'TRADE_ENTRY',
    timestamp: '2025-01-26T14:20:00Z',
    humanSummary: 'Blackjack entry signal with high confidence',
    mcpVersion: '0.1.0',
    confidence: 0.91,
    reviewed: true,
    reviewedBy: 'jane-analyst',
    reviewedAt: '2025-01-26T14:45:00Z'
  }
];

/**
 * Example component showing how to use ReviewedIndicator
 * in pattern feed cards
 */
export const ReviewedIndicatorExample: React.FC = () => {
  return (
    <ExampleContainer>
      <h2>Pattern Feed Cards with Reviewed Status</h2>
      <p>
        This example shows how the ReviewedIndicator component appears 
        in pattern feed cards with different review states.
      </p>
      
      {examplePatterns.map((pattern) => (
        <ExampleCard key={pattern.id}>
          <CardHeader>
            <PatternTitle>
              {pattern.patternType.replace(/_/g, ' ')}
            </PatternTitle>
            <ReviewedIndicator
              reviewed={pattern.reviewed}
              reviewedBy={pattern.reviewedBy}
              reviewedAt={pattern.reviewedAt}
            />
          </CardHeader>
          
          <PatternDetails>
            {pattern.symbol} • {new Date(pattern.timestamp).toLocaleString()}
          </PatternDetails>
          
          {pattern.confidence && (
            <PatternDetails>
              Confidence: {(pattern.confidence * 100).toFixed(1)}%
            </PatternDetails>
          )}
          
          <div style={{ fontSize: '0.875rem', marginTop: '0.5rem' }}>
            {pattern.humanSummary}
          </div>
        </ExampleCard>
      ))}
      
      <div style={{ marginTop: '2rem', padding: '1rem', backgroundColor: '#f9fafb', borderRadius: '0.375rem' }}>
        <h3>Implementation Notes</h3>
        <ul style={{ fontSize: '0.875rem', lineHeight: '1.5' }}>
          <li>
            <strong>Reviewed patterns</strong> show a green checkmark with "Reviewed" text
          </li>
          <li>
            <strong>Unreviewed patterns</strong> show an empty checkbox with "Pending Review" text
          </li>
          <li>
            <strong>Reviewer information</strong> is displayed when available (initials and timestamp)
          </li>
          <li>
            <strong>Non-interactive</strong> - the indicator is read-only and reflects database state
          </li>
          <li>
            <strong>Real-time updates</strong> - status updates when feedback is submitted
          </li>
        </ul>
      </div>
    </ExampleContainer>
  );
};

export default ReviewedIndicatorExample;
