// src/components/PatternDetails/GoldmineShaftDetails.tsx
// Pattern details component for Goldmine Shaft patterns
// Displays shaft entry metrics, blackjack score, and trigger information

import React from 'react';
import styled from 'styled-components';
import { ThemeTokens } from '../../styles/theme';

const Container = styled.div`
  padding: ${ThemeTokens.spacing.medium};
  background-color: ${ThemeTokens.colors.surface};
  border-radius: ${ThemeTokens.borderRadius.medium};
  border: 1px solid ${ThemeTokens.colors.border};
`;

const Title = styled.h3`
  margin: 0 0 ${ThemeTokens.spacing.medium} 0;
  color: ${ThemeTokens.colors.textPrimary};
  font-size: ${ThemeTokens.typography.size.large};
  font-weight: ${ThemeTokens.typography.weight.semibold};
`;

const DetailRow = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: ${ThemeTokens.spacing.small};
  padding: ${ThemeTokens.spacing.small} 0;
  border-bottom: 1px solid ${ThemeTokens.colors.border};
`;

const Label = styled.span`
  color: ${ThemeTokens.colors.textSecondary};
  font-size: ${ThemeTokens.typography.size.small};
  font-weight: ${ThemeTokens.typography.weight.medium};
`;

const Value = styled.span`
  color: ${ThemeTokens.colors.textPrimary};
  font-size: ${ThemeTokens.typography.size.small};
  font-weight: ${ThemeTokens.typography.weight.medium};
`;

const CloseButton = styled.button`
  background: none;
  border: none;
  color: ${ThemeTokens.colors.textSecondary};
  cursor: pointer;
  font-size: ${ThemeTokens.typography.size.medium};
  padding: ${ThemeTokens.spacing.small};
  
  &:hover {
    color: ${ThemeTokens.colors.textPrimary};
  }
`;

interface GoldmineShaftDetailsProps {
  pattern: {
    entryIndex?: number;
    blackjackScore?: number;
    direction?: string;
    fromPattern?: string;
    side?: string;
    entryPrice?: number;
    stepRef?: string;
  };
  onClose?: () => void;
}

export const GoldmineShaftDetails: React.FC<GoldmineShaftDetailsProps> = ({ 
  pattern, 
  onClose 
}) => {
  return (
    <Container>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Title>Goldmine Shaft Details</Title>
        {onClose && (
          <CloseButton onClick={onClose} aria-label="Close">
            ×
          </CloseButton>
        )}
      </div>

      <DetailRow>
        <Label>Entry Index:</Label>
        <Value>{pattern?.entryIndex ?? 'N/A'}</Value>
      </DetailRow>

      <DetailRow>
        <Label>Blackjack Score:</Label>
        <Value>{pattern?.blackjackScore?.toFixed(2) ?? 'N/A'}</Value>
      </DetailRow>

      <DetailRow>
        <Label>Direction:</Label>
        <Value>{pattern?.direction || pattern?.side || 'N/A'}</Value>
      </DetailRow>

      <DetailRow>
        <Label>Triggered From:</Label>
        <Value>{pattern?.fromPattern || 'Unknown'}</Value>
      </DetailRow>

      <DetailRow>
        <Label>Entry Price:</Label>
        <Value>{pattern?.entryPrice ? `$${pattern.entryPrice.toFixed(2)}` : 'N/A'}</Value>
      </DetailRow>

      <DetailRow>
        <Label>Step Reference:</Label>
        <Value>{pattern?.stepRef || 'N/A'}</Value>
      </DetailRow>
    </Container>
  );
};

export default GoldmineShaftDetails;
