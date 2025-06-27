// src/components/PatternDetails/EscalatorStepDetails.tsx
// Pattern details component for EscalatorStep patterns
// Displays step metrics, direction, and breakout analysis
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

const DirectionBadge = styled.span<{ direction: string }>`
  padding: ${ThemeTokens.spacing.xsmall} ${ThemeTokens.spacing.small};
  border-radius: ${ThemeTokens.borderRadius.small};
  background-color: ${props => props.direction === 'RISING' ? '#dcfce7' : '#fef2f2'};
  color: ${props => props.direction === 'RISING' ? '#166534' : '#dc2626'};
  font-size: ${ThemeTokens.typography.size.xsmall};
  font-weight: ${ThemeTokens.typography.weight.semibold};
  text-transform: uppercase;
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

interface EscalatorStepDetailsProps {
  pattern: {
    direction?: string;
    floor?: number;
    ceiling?: number;
    stepRef?: string;
    stepBreakoutCount?: number;
    stepContinuanceCount?: number;
    stepIntrinsicCount?: number;
    startIndex?: number;
    endIndex?: number;
    height?: number;
  };
  onClose?: () => void;
}

export const EscalatorStepDetails: React.FC<EscalatorStepDetailsProps> = ({ 
  pattern, 
  onClose 
}) => {
  return (
    <Container>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Title>Escalator Step Details</Title>
        {onClose && (
          <CloseButton onClick={onClose} aria-label="Close">
            ×
          </CloseButton>
        )}
      </div>

      <DetailRow>
        <Label>Direction:</Label>
        <DirectionBadge direction={pattern?.direction || 'UNKNOWN'}>
          {pattern?.direction || 'UNKNOWN'}
        </DirectionBadge>
      </DetailRow>

      <DetailRow>
        <Label>Step Reference:</Label>
        <Value>{pattern?.stepRef || 'N/A'}</Value>
      </DetailRow>

      <DetailRow>
        <Label>Floor Price:</Label>
        <Value>{pattern?.floor ? `$${pattern.floor.toFixed(2)}` : 'N/A'}</Value>
      </DetailRow>

      <DetailRow>
        <Label>Ceiling Price:</Label>
        <Value>{pattern?.ceiling ? `$${pattern.ceiling.toFixed(2)}` : 'N/A'}</Value>
      </DetailRow>

      <DetailRow>
        <Label>Height:</Label>
        <Value>{pattern?.height ? `$${pattern.height.toFixed(2)}` : 'N/A'}</Value>
      </DetailRow>

      <DetailRow>
        <Label>Start Index:</Label>
        <Value>{pattern?.startIndex ?? 'N/A'}</Value>
      </DetailRow>

      <DetailRow>
        <Label>End Index:</Label>
        <Value>{pattern?.endIndex ?? 'N/A'}</Value>
      </DetailRow>

      <DetailRow>
        <Label>Intrinsic Count:</Label>
        <Value>{pattern?.stepIntrinsicCount ?? 0}</Value>
      </DetailRow>

      <DetailRow>
        <Label>Breakout Count:</Label>
        <Value>{pattern?.stepBreakoutCount ?? 0}</Value>
      </DetailRow>

      <DetailRow>
        <Label>Continuance Count:</Label>
        <Value>{pattern?.stepContinuanceCount ?? 0}</Value>
      </DetailRow>
    </Container>
  );
};

export default EscalatorStepDetails;
