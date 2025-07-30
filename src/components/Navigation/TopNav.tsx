// src/components/Navigation/TopNav.tsx
// Main navigation bar with tabs
// Context: Adding Reports as the fourth primary navigation option

import React from 'react';
import styled from 'styled-components';
import { 
  TrendingUp, 
  LayoutDashboard, 
  Target, 
  FileText,
  Bell,
  Settings,
  User
} from 'lucide-react';

const NavContainer = styled.nav`
  background: #1e293b;
  height: 60px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 2rem;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  position: sticky;
  top: 0;
  z-index: 1000;
`;

const NavTabs = styled.div`
  display: flex;
  gap: 0.5rem;
  align-items: center;
`;

const NavTab = styled.button<{ $active: boolean }>`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.5rem;
  color: ${props => props.$active ? '#10b981' : '#94a3b8'};
  text-decoration: none;
  font-weight: 500;
  border: none;
  border-bottom: 3px solid ${props => props.$active ? '#10b981' : 'transparent'};
  background: transparent;
  cursor: pointer;
  font-family: inherit;
  font-size: inherit;
  transition: all 0.2s ease;
  
  &:hover {
    color: #10b981;
    background: rgba(16, 185, 129, 0.1);
  }
  
  svg {
    width: 20px;
    height: 20px;
  }
`;

const NavActions = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
`;

const IconButton = styled.button`
  background: none;
  border: none;
  color: #94a3b8;
  cursor: pointer;
  padding: 0.5rem;
  border-radius: 0.5rem;
  transition: all 0.2s ease;
  
  &:hover {
    color: #10b981;
    background: rgba(16, 185, 129, 0.1);
  }
  
  svg {
    width: 20px;
    height: 20px;
  }
`;

const NotificationBadge = styled.span`
  position: absolute;
  top: -4px;
  right: -4px;
  background: #ef4444;
  color: white;
  font-size: 10px;
  padding: 2px 4px;
  border-radius: 999px;
  font-weight: bold;
`;

interface TopNavProps {
  activeTab: 'chart' | 'dashboard' | 'targets' | 'reports';
  onTabChange: (tab: 'chart' | 'dashboard' | 'targets' | 'reports') => void;
}

export const TopNav: React.FC<TopNavProps> = ({ activeTab, onTabChange }) => {
  const tabs = [
    { id: 'chart', label: 'Chart', icon: TrendingUp },
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'targets', label: 'Targets', icon: Target },
    { id: 'reports', label: 'Reports', icon: FileText }
  ] as const;
  
  return (
    <NavContainer>
      <NavTabs>
        {tabs.map(tab => {
          const Icon = tab.icon;
          return (
            <NavTab
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              $active={activeTab === tab.id}
            >
              <Icon />
              {tab.label}
            </NavTab>
          );
        })}
      </NavTabs>
      
      <NavActions>
        <IconButton style={{ position: 'relative' }}>
          <Bell />
          <NotificationBadge>3</NotificationBadge>
        </IconButton>
        <IconButton>
          <Settings />
        </IconButton>
        <IconButton>
          <User />
        </IconButton>
      </NavActions>
    </NavContainer>
  );
};