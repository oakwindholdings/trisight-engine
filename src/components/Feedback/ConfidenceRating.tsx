// src/components/Feedback/ConfidenceRating.tsx
// Star rating component
// Captures user confidence
import React from 'react';
import styled from 'styled-components';
import type { ConfidenceRatingProps } from './feedback-components';

const RatingContainer = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
`;

const StarContainer = styled.div`
  display: flex;
  gap: 4px;
`;

const Star = styled.button<{ filled: boolean }>`
  background: none;
  border: none;
  cursor: pointer;
  color: ${props => props.filled ? '#FFC107' : '#E0E0E0'};
  font-size: 24px;
  padding: 0;
  transition: color 0.2s ease;
  
  &:hover {
    color: #FFCA28;
  }
`;

const RatingLabel = styled.div`
  font-size: 14px;
  color: #757575;
  margin-left: 8px;
`;

const ConfidenceLabels = [
  'Very Low',
  'Low',
  'Moderate',
  'High',
  'Very High'
];

/**
 * Component for rating confidence levels in pattern feedback
 * Uses a star-based rating system with descriptive labels
 */
const ConfidenceRatingComponent: React.FC<ConfidenceRatingProps> = ({ value, onChange }) => {
  return (
    <RatingContainer>
      <StarContainer>
        {[1, 2, 3, 4, 5].map(rating => (
          <Star
            key={rating}
            filled={rating <= value}
            onClick={() => onChange(rating)}
            aria-label={`Rate ${rating} out of 5`}
          >
            ★
          </Star>
        ))}
      </StarContainer>
      <RatingLabel>{ConfidenceLabels[value - 1]}</RatingLabel>
    </RatingContainer>
  );
};

// Simply export the component directly
export default ConfidenceRatingComponent;
