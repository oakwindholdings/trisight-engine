// src/components/Settings/SettingsPanel.tsx
// Main settings panel/drawer that contains all application settings
// Triggered by the settings button in ContextBar

import React from 'react';
import styled from 'styled-components';
import { ThemeTokens } from '../../styles/theme';
import ChartSettingsPanel from './ChartSettingsPanel';
import DebugSettingsPanel from './DebugSettingsPanel';

interface SettingsPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

const Overlay = styled.div<{ $isOpen: boolean }>`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: ${props => props.$isOpen ? 'block' : 'none'};
  z-index: 1000;
`;

const DrawerContainer = styled.div<{ $isOpen: boolean }>`
  position: fixed;
  top: 0;
  right: 0;
  bottom: 0;
  width: 400px;
  background-color: ${ThemeTokens.colors.surface};
  border-left: 1px solid ${ThemeTokens.colors.border};
  transform: translateX(${props => props.$isOpen ? '0' : '100%'});
  transition: transform 0.3s ease-in-out;
  z-index: 1001;
  display: flex;
  flex-direction: column;
`;

const Header = styled.div`
  padding: ${ThemeTokens.spacing.large};
  border-bottom: 1px solid ${ThemeTokens.colors.border};
  display: flex;
  justify-content: space-between;
  align-items: center;
  background-color: ${ThemeTokens.colors.primary};
  color: white;
`;

const Title = styled.h2`
  margin: 0;
  font-size: ${ThemeTokens.typography.size.large};
  font-weight: 600;
`;

const CloseButton = styled.button`
  background: none;
  border: none;
  color: white;
  cursor: pointer;
  padding: ${ThemeTokens.spacing.small};
  border-radius: ${ThemeTokens.borderRadius.small};
  display: flex;
  align-items: center;
  justify-content: center;
  
  &:hover {
    background-color: rgba(255, 255, 255, 0.1);
  }
`;

const Content = styled.div`
  flex: 1;
  overflow-y: auto;
  padding: ${ThemeTokens.spacing.large};
`;

const Section = styled.div`
  margin-bottom: ${ThemeTokens.spacing.large};
`;

const SectionTitle = styled.h3`
  margin: 0 0 ${ThemeTokens.spacing.medium} 0;
  color: ${ThemeTokens.colors.textPrimary};
  font-size: ${ThemeTokens.typography.size.medium};
  font-weight: 600;
  border-bottom: 1px solid ${ThemeTokens.colors.border};
  padding-bottom: ${ThemeTokens.spacing.small};
`;

const SettingsPanel: React.FC<SettingsPanelProps> = ({ isOpen, onClose }) => {
  // Close panel when clicking overlay
  const handleOverlayClick = () => {
    onClose();
  };

  // Prevent closing when clicking inside the drawer
  const handleDrawerClick = (e: React.MouseEvent) => {
    e.stopPropagation();
  };

  return (
    <>
      <Overlay $isOpen={isOpen} onClick={handleOverlayClick} />
      <DrawerContainer $isOpen={isOpen} onClick={handleDrawerClick}>
        <Header>
          <Title>Settings</Title>
          <CloseButton onClick={onClose}>
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <path 
                d="M15 5L5 15M5 5l10 10" 
                stroke="currentColor" 
                strokeWidth="2" 
                strokeLinecap="round" 
                strokeLinejoin="round"
              />
            </svg>
          </CloseButton>
        </Header>
        
        <Content>
          <Section>
            <SectionTitle>Chart Display</SectionTitle>
            <ChartSettingsPanel />
          </Section>
          
          <Section>
            <SectionTitle>Debug Settings</SectionTitle>
            <DebugSettingsPanel />
          </Section>
        </Content>
      </DrawerContainer>
    </>
  );
};

export default SettingsPanel;
