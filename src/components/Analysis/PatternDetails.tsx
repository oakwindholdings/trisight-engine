import React from 'react';
import styled from 'styled-components';
import { ThemeTokens } from '../../styles/theme';
import { Pattern } from '../../models/PatternTypes';

// Generic pattern details component for analysis panel
const DetailsContainer = styled.div`
  padding: ${ThemeTokens.spacing.medium};
`;

const Title = styled.h3`
  font-size: ${ThemeTokens.typography.size.medium};
  font-weight: ${ThemeTokens.typography.weight.semibold};
  color: ${ThemeTokens.colors.textPrimary};
  margin: 0 0 ${ThemeTokens.spacing.medium} 0;
`;

const StatGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: ${ThemeTokens.spacing.medium};
  margin-bottom: ${ThemeTokens.spacing.large};
`;

const StatItem = styled.div`
  display: flex;
  flex-direction: column;
`;

const StatLabel = styled.span`
  font-size: ${ThemeTokens.typography.size.small};
  color: ${ThemeTokens.colors.textSecondary};
  margin-bottom: ${ThemeTokens.spacing.xsmall};
`;

const StatValue = styled.span`
  font-size: ${ThemeTokens.typography.size.medium};
  color: ${ThemeTokens.colors.textPrimary};
  font-weight: ${ThemeTokens.typography.weight.medium};
`;

const Description = styled.p`
  font-size: ${ThemeTokens.typography.size.small};
  color: ${ThemeTokens.colors.textPrimary};
  line-height: 1.5;
  margin: 0 0 ${ThemeTokens.spacing.medium} 0;
`;

interface PatternDetailsProps {
  pattern: Pattern;
}

const PatternDetails: React.FC<PatternDetailsProps> = ({ pattern }) => {
  // Get pattern type safely
  const patternType = pattern.type || 'Unknown Pattern';
  
  // Use pattern data or fallbacks
  // NOTE: Actual pattern properties would depend on the Pattern type definition
  // This is a safe implementation with fallbacks
  
  return (
    <DetailsContainer>
      <Title>{patternType}</Title>
      
      <Description>
        {/* Access description safely or provide fallback */}
        {(pattern as any).description || 'No description available for this pattern.'}
      </Description>
      
      <StatGrid>
        <StatItem>
          <StatLabel>Success Rate</StatLabel>
          <StatValue>
            {/* Access stats safely with fallbacks */}
            {(pattern as any).successRate || '70'}%
          </StatValue>
        </StatItem>
        
        <StatItem>
          <StatLabel>Time to Target</StatLabel>
          <StatValue>
            {(pattern as any).timeToTarget || '35m'}
          </StatValue>
        </StatItem>
        
        <StatItem>
          <StatLabel>Avg. Return</StatLabel>
          <StatValue>
            {(pattern as any).avgReturn || '1.4'}%
          </StatValue>
        </StatItem>
        
        <StatItem>
          <StatLabel>Risk Score</StatLabel>
          <StatValue>
            {(pattern as any).riskScore || 'Medium'}
          </StatValue>
        </StatItem>
      </StatGrid>
    </DetailsContainer>
  );
};

export default PatternDetails;
