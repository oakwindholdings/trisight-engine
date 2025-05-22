// src/components/Modals/BlackjackPatternModal.tsx
// Modal displaying Blackjack details
// Used in analysis panel
import React from 'react';
import styled from 'styled-components';
import { BlackjackPattern } from '../../models/PatternTypes';
import BlackjackPatternDetails from '../PatternDetails/BlackjackPatternDetails';

interface BlackjackPatternModalProps {
  pattern: BlackjackPattern;
  onClose: () => void;
}

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

const BlackjackPatternModal: React.FC<BlackjackPatternModalProps> = ({ 
  pattern, 
  onClose 
}) => {
  // Close modal when clicking outside of content
  const handleOverlayClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };
  
  return (
    <ModalOverlay onClick={handleOverlayClick}>
      <ModalContainer>
        <BlackjackPatternDetails 
          pattern={pattern} 
          onClose={onClose} 
        />
      </ModalContainer>
    </ModalOverlay>
  );
};

export default BlackjackPatternModal;
