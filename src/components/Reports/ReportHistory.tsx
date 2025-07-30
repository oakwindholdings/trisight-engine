// src/components/Reports/ReportHistory.tsx
// Past reports list with search and filtering
// Context: Shows previously generated reports for quick access

import React, { useState } from 'react';
import styled from 'styled-components';
import { Search, Filter, Calendar, Download, Eye, Trash2, Clock, FileText } from 'lucide-react';

const HistoryContainer = styled.div`
  padding: 1.5rem;
  height: 100%;
  display: flex;
  flex-direction: column;
`;

const HistoryHeader = styled.div`
  margin-bottom: 1.5rem;
`;

const SearchBar = styled.div`
  position: relative;
  margin-bottom: 1rem;
`;

const SearchIcon = styled(Search)`
  position: absolute;
  left: 1rem;
  top: 50%;
  transform: translateY(-50%);
  width: 18px;
  height: 18px;
  color: #6b7280;
`;

const SearchInput = styled.input`
  width: 100%;
  padding: 0.75rem 1rem 0.75rem 3rem;
  border: 1px solid #e5e7eb;
  border-radius: 0.5rem;
  font-size: 0.875rem;
  outline: none;
  transition: all 0.2s ease;
  
  &:focus {
    border-color: #3b82f6;
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
  }
  
  &::placeholder {
    color: #9ca3af;
  }
`;

const FilterRow = styled.div`
  display: flex;
  gap: 0.75rem;
  flex-wrap: wrap;
`;

const FilterButton = styled.button<{ $active?: boolean }>`
  padding: 0.5rem 1rem;
  border: 1px solid ${props => props.$active ? '#3b82f6' : '#e5e7eb'};
  background: ${props => props.$active ? '#eff6ff' : 'white'};
  color: ${props => props.$active ? '#3b82f6' : '#6b7280'};
  border-radius: 0.375rem;
  font-size: 0.813rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  
  &:hover {
    border-color: #3b82f6;
    color: #3b82f6;
  }
  
  svg {
    width: 14px;
    height: 14px;
  }
`;

const ReportsList = styled.div`
  flex: 1;
  overflow-y: auto;
`;

const ReportCard = styled.div`
  padding: 1rem;
  border: 1px solid #e5e7eb;
  border-radius: 0.5rem;
  margin-bottom: 0.75rem;
  cursor: pointer;
  transition: all 0.2s ease;
  
  &:hover {
    border-color: #d1d5db;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  }
`;

const ReportHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: start;
  margin-bottom: 0.5rem;
`;

const ReportTitle = styled.h3`
  font-size: 0.938rem;
  font-weight: 600;
  color: #1e293b;
  margin: 0;
`;

const ReportActions = styled.div`
  display: flex;
  gap: 0.5rem;
`;

const ActionButton = styled.button`
  padding: 0.375rem;
  background: none;
  border: none;
  color: #6b7280;
  cursor: pointer;
  border-radius: 0.25rem;
  transition: all 0.2s ease;
  
  &:hover {
    background: #f3f4f6;
    color: #374151;
  }
  
  svg {
    width: 16px;
    height: 16px;
  }
`;

const ReportMeta = styled.div`
  display: flex;
  gap: 1.5rem;
  font-size: 0.813rem;
  color: #6b7280;
`;

const MetaItem = styled.div`
  display: flex;
  align-items: center;
  gap: 0.375rem;
  
  svg {
    width: 14px;
    height: 14px;
  }
`;

const ReportDescription = styled.p`
  font-size: 0.813rem;
  color: #6b7280;
  margin: 0.5rem 0 0 0;
  line-height: 1.5;
`;

const EmptyState = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 3rem;
  text-align: center;
  color: #6b7280;
  
  svg {
    width: 48px;
    height: 48px;
    margin-bottom: 1rem;
    opacity: 0.5;
  }
  
  p {
    margin: 0;
  }
`;

interface ReportHistoryProps {
  currentReport: any;
  onReportChange: (report: any) => void;
}

export const ReportHistory: React.FC<ReportHistoryProps> = ({
  currentReport,
  onReportChange
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('all');
  
  // Mock data for reports
  const reports = [
    {
      id: '1',
      title: 'Q4 2024 Market Analysis',
      description: 'Comprehensive analysis of technology sector performance with focus on AI-driven companies',
      createdAt: new Date('2024-11-15'),
      format: 'pdf',
      size: '2.4 MB'
    },
    {
      id: '2',
      title: 'Portfolio Performance Review',
      description: 'Monthly performance metrics and risk assessment for diversified portfolio',
      createdAt: new Date('2024-11-10'),
      format: 'pptx',
      size: '5.1 MB'
    },
    {
      id: '3',
      title: 'Emerging Markets Opportunities',
      description: 'Deep dive into APAC market trends and investment opportunities',
      createdAt: new Date('2024-11-05'),
      format: 'pdf',
      size: '3.2 MB'
    },
    {
      id: '4',
      title: 'Risk Assessment Report',
      description: 'Volatility analysis and hedging strategies for current market conditions',
      createdAt: new Date('2024-11-01'),
      format: 'xlsx',
      size: '1.8 MB'
    }
  ];
  
  const filteredReports = reports.filter(report => {
    const matchesSearch = report.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         report.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = filterType === 'all' || report.format === filterType;
    return matchesSearch && matchesFilter;
  });
  
  const formatDate = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    
    if (days === 0) return 'Today';
    if (days === 1) return 'Yesterday';
    if (days < 7) return `${days} days ago`;
    return date.toLocaleDateString();
  };
  
  return (
    <HistoryContainer>
      <HistoryHeader>
        <SearchBar>
          <SearchIcon />
          <SearchInput
            type="text"
            placeholder="Search reports..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
          />
        </SearchBar>
        
        <FilterRow>
          <FilterButton
            $active={filterType === 'all'}
            onClick={() => setFilterType('all')}
          >
            <Filter />
            All Types
          </FilterButton>
          <FilterButton
            $active={filterType === 'pdf'}
            onClick={() => setFilterType('pdf')}
          >
            PDF
          </FilterButton>
          <FilterButton
            $active={filterType === 'pptx'}
            onClick={() => setFilterType('pptx')}
          >
            PowerPoint
          </FilterButton>
          <FilterButton
            $active={filterType === 'xlsx'}
            onClick={() => setFilterType('xlsx')}
          >
            Excel
          </FilterButton>
        </FilterRow>
      </HistoryHeader>
      
      <ReportsList>
        {filteredReports.length > 0 ? (
          filteredReports.map(report => (
            <ReportCard key={report.id}>
              <ReportHeader>
                <ReportTitle>{report.title}</ReportTitle>
                <ReportActions>
                  <ActionButton title="View report">
                    <Eye />
                  </ActionButton>
                  <ActionButton title="Download">
                    <Download />
                  </ActionButton>
                  <ActionButton title="Delete">
                    <Trash2 />
                  </ActionButton>
                </ReportActions>
              </ReportHeader>
              
              <ReportMeta>
                <MetaItem>
                  <Calendar />
                  {formatDate(report.createdAt)}
                </MetaItem>
                <MetaItem>
                  <FileText />
                  {report.format.toUpperCase()}
                </MetaItem>
                <MetaItem>
                  <Clock />
                  {report.size}
                </MetaItem>
              </ReportMeta>
              
              <ReportDescription>{report.description}</ReportDescription>
            </ReportCard>
          ))
        ) : (
          <EmptyState>
            <FileText />
            <p>No reports found</p>
          </EmptyState>
        )}
      </ReportsList>
    </HistoryContainer>
  );
};