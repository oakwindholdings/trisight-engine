// src/feed/components/ReviewedIndicator.tsx
// Component for displaying reviewed status on pattern feed cards
// Shows check mark when pattern has been reviewed by an analyst

import React from 'react';
import styled from 'styled-components';

interface ReviewedIndicatorProps {
  reviewed?: boolean;
  reviewedBy?: string;
  reviewedAt?: string;
  className?: string;
}

const IndicatorContainer = styled.div<{ reviewed: boolean }>`
  display: flex;
  align-items: center;
  gap: 0.25rem;
  font-size: 0.75rem;
  color: ${props => props.reviewed ? '#059669' : '#6b7280'};
  opacity: ${props => props.reviewed ? 1 : 0.5};
`;

const CheckIcon = styled.div<{ reviewed: boolean }>`
  width: 1rem;
  height: 1rem;
  border-radius: 0.125rem;
  border: 1px solid ${props => props.reviewed ? '#059669' : '#d1d5db'};
  background-color: ${props => props.reviewed ? '#059669' : 'transparent'};
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 0.625rem;
  font-weight: bold;
`;

const ReviewedText = styled.span`
  font-weight: 500;
`;

const ReviewedDetails = styled.div`
  font-size: 0.625rem;
  color: #6b7280;
  margin-top: 0.125rem;
`;

/**
 * ReviewedIndicator component displays the reviewed status of a pattern
 * - Shows a check mark when reviewed
 * - Optionally shows reviewer name and timestamp
 * - Non-interactive (read-only)
 */
export const ReviewedIndicator: React.FC<ReviewedIndicatorProps> = ({
  reviewed = false,
  reviewedBy,
  reviewedAt,
  className
}) => {
  const formatReviewedAt = (timestamp?: string): string => {
    if (!timestamp) return '';
    
    try {
      const date = new Date(timestamp);
      return date.toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return '';
    }
  };

  const getReviewerInitials = (reviewerId?: string): string => {
    if (!reviewerId) return '';
    
    // For now, just use first 2 characters of user ID
    // In the future, this could be enhanced to fetch actual user names
    return reviewerId.substring(0, 2).toUpperCase();
  };

  return (
    <IndicatorContainer reviewed={reviewed} className={className}>
      <CheckIcon reviewed={reviewed}>
        {reviewed && '✓'}
      </CheckIcon>
      <ReviewedText>
        {reviewed ? 'Reviewed' : 'Pending Review'}
      </ReviewedText>
      
      {reviewed && (reviewedBy || reviewedAt) && (
        <ReviewedDetails>
          {reviewedBy && (
            <span title={`Reviewed by: ${reviewedBy}`}>
              by {getReviewerInitials(reviewedBy)}
            </span>
          )}
          {reviewedBy && reviewedAt && ' • '}
          {reviewedAt && (
            <span title={`Reviewed at: ${new Date(reviewedAt).toLocaleString()}`}>
              {formatReviewedAt(reviewedAt)}
            </span>
          )}
        </ReviewedDetails>
      )}
    </IndicatorContainer>
  );
};

export default ReviewedIndicator;
