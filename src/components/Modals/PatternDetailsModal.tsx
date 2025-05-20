import React from 'react';
import styled from 'styled-components';
import { Pattern, PatternType, BlackjackPattern, EscalatorPattern, PivotPattern } from '../../models/PatternTypes';
import BlackjackPatternDetails from '../PatternDetails/BlackjackPatternDetails';
import EscalatorPatternDetails from '../PatternDetails/EscalatorPatternDetails';
import PivotPatternDetails from '../PatternDetails/PivotPatternDetails';
import { usePatternContext } from '../../contexts/PatternContext';

const ModalOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
`;

const ModalContainer = styled.div`
  background-color: white;
  border-radius: 8px;
  width: 80%;
  max-width: 700px;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.3);
  padding: 16px;
`;

const PatternPlaceholder = styled.div`
  padding: 16px;
  text-align: center;
  color: #616161;
`;

const PatternDetailsModal: React.FC = () => {
  const { selectedPattern, setSelectedPattern } = usePatternContext();
  
  // Close modal when clicking outside of content
  const handleOverlayClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      setSelectedPattern(null);
    }
  };
  
  if (!selectedPattern) {
    return null;
  }
  
  return (
    <ModalOverlay onClick={handleOverlayClick}>
      <ModalContainer>
        {selectedPattern.type === PatternType.BLACKJACK ? (
          <BlackjackPatternDetails 
            pattern={selectedPattern as BlackjackPattern}
            onClose={() => setSelectedPattern(null)}
          />
        ) : selectedPattern.type === PatternType.ESCALATOR ? (
          <EscalatorPatternDetails 
            pattern={selectedPattern as EscalatorPattern}
            onClose={() => setSelectedPattern(null)}
          />
        ) : selectedPattern.type === PatternType.PIVOT ? (
          <PivotPatternDetails 
            pattern={selectedPattern as PivotPattern}
          />
        ) : (
          <PatternPlaceholder>
            {selectedPattern.type} Pattern Details
            <p>Details for this pattern type are not currently available.</p>
            <button onClick={() => setSelectedPattern(null)}>Close</button>
          </PatternPlaceholder>
        )}
      </ModalContainer>
    </ModalOverlay>
  );
};

export default PatternDetailsModal;
