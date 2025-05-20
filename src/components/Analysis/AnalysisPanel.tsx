import React from 'react';
import styled from 'styled-components';
import PatternDetails from './PatternDetails';
import { ThemeTokens } from '../../styles/theme';
import { Pattern } from '../../models/PatternTypes';

const PanelContainer = styled.div`
  display: flex;
  flex-direction: column;
  width: 300px;
  height: 100%;
  background-color: ${ThemeTokens.colors.surface};
  border-left: 1px solid ${ThemeTokens.colors.border};
`;

const PanelHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: ${ThemeTokens.spacing.medium};
  border-bottom: 1px solid ${ThemeTokens.colors.border};
`;

const PanelTitle = styled.h2`
  font-size: ${ThemeTokens.typography.size.medium};
  font-weight: ${ThemeTokens.typography.weight.semibold};
  color: ${ThemeTokens.colors.textPrimary};
  margin: 0;
`;

const PanelBody = styled.div`
  flex: 1;
  overflow-y: auto;
  padding: ${ThemeTokens.spacing.medium};
`;

const ButtonGroup = styled.div`
  display: flex;
  gap: ${ThemeTokens.spacing.medium};
  margin-top: ${ThemeTokens.spacing.large};
`;

interface ActionButtonProps {
  primary?: boolean;
}

const ActionButton = styled.button<ActionButtonProps>`
  background-color: ${props => props.primary ? ThemeTokens.colors.accent : ThemeTokens.colors.surface};
  color: ${props => props.primary ? ThemeTokens.colors.textOnAccent : ThemeTokens.colors.textPrimary};
  border: 1px solid ${props => props.primary ? ThemeTokens.colors.accent : ThemeTokens.colors.border};
  border-radius: ${ThemeTokens.borderRadius.small};
  padding: ${ThemeTokens.spacing.small} ${ThemeTokens.spacing.medium};
  font-size: ${ThemeTokens.typography.size.small};
  font-weight: ${ThemeTokens.typography.weight.medium};
  cursor: pointer;
  flex: 1;
  
  &:hover {
    background-color: ${props => props.primary 
      ? ThemeTokens.colors.accentHover 
      : ThemeTokens.colors.surfaceHover};
  }
`;

const NoSelectionMessage = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 200px;
  color: ${ThemeTokens.colors.textSecondary};
  text-align: center;
  padding: ${ThemeTokens.spacing.large};
`;

interface AnalysisPanelProps {
  selectedPattern: Pattern | null;
  onFeedbackClick: () => void;
  onSaveClick: () => void;
}

const AnalysisPanel: React.FC<AnalysisPanelProps> = ({
  selectedPattern,
  onFeedbackClick,
  onSaveClick,
}) => {
  return (
    <PanelContainer>
      <PanelHeader>
        <PanelTitle>Pattern Analysis</PanelTitle>
      </PanelHeader>
      
      <PanelBody>
        {selectedPattern ? (
          <>
            <PatternDetails pattern={selectedPattern} />
            
            <ButtonGroup>
              <ActionButton onClick={onFeedbackClick}>
                Provide Feedback
              </ActionButton>
              <ActionButton primary onClick={onSaveClick}>
                Save Pattern
              </ActionButton>
            </ButtonGroup>
          </>
        ) : (
          <NoSelectionMessage>
            <p>Select a pattern to view detailed analysis</p>
          </NoSelectionMessage>
        )}
      </PanelBody>
    </PanelContainer>
  );
};

export default AnalysisPanel;
