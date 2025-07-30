// src/components/Reports/ReportTemplateSelector.tsx
// Template selection widget for report generation
// Context: Shows available report templates with descriptions

import React, { useState } from 'react';
import styled from 'styled-components';
import { FileText, TrendingUp, Filter, Zap, Calendar, PieChart } from 'lucide-react';

const Container = styled.div`
  padding: 1rem;
  height: 100%;
  overflow-y: auto;
`;

const SearchInput = styled.input`
  width: 100%;
  padding: 0.625rem;
  border: 1px solid #e5e7eb;
  border-radius: 0.375rem;
  font-size: 0.875rem;
  margin-bottom: 1rem;
  
  &:focus {
    outline: none;
    border-color: #10b981;
    box-shadow: 0 0 0 3px rgba(16, 185, 129, 0.1);
  }
`;

const TemplateList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
`;

const TemplateCard = styled.div<{ $selected?: boolean }>`
  padding: 1rem;
  border: 2px solid ${props => props.$selected ? '#10b981' : '#e5e7eb'};
  border-radius: 0.5rem;
  cursor: pointer;
  transition: all 0.2s;
  background: ${props => props.$selected ? '#f0fdf4' : 'white'};
  
  &:hover {
    border-color: ${props => props.$selected ? '#10b981' : '#cbd5e1'};
    transform: translateY(-1px);
  }
`;

const TemplateHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 0.5rem;
`;

const IconWrapper = styled.div<{ $color: string }>`
  width: 36px;
  height: 36px;
  background: ${props => props.$color}22;
  border-radius: 0.375rem;
  display: flex;
  align-items: center;
  justify-content: center;
  
  svg {
    width: 20px;
    height: 20px;
    color: ${props => props.$color};
  }
`;

const TemplateTitle = styled.h4`
  font-size: 0.875rem;
  font-weight: 600;
  color: #1f2937;
  margin: 0;
`;

const TemplateDescription = styled.p`
  font-size: 0.75rem;
  color: #6b7280;
  margin: 0;
  line-height: 1.4;
`;

const TemplateMeta = styled.div`
  display: flex;
  gap: 1rem;
  margin-top: 0.5rem;
  font-size: 0.75rem;
  color: #9ca3af;
`;

interface Template {
  id: string;
  name: string;
  description: string;
  icon: React.ElementType;
  color: string;
  pages: number;
  time: string;
}

const templates: Template[] = [
  {
    id: 'equity-research',
    name: 'Equity Research',
    description: 'Comprehensive stock analysis with financials, valuation, and recommendations',
    icon: TrendingUp,
    color: '#10b981',
    pages: 15,
    time: '5 min'
  },
  {
    id: 'technical-analysis',
    name: 'Technical Analysis',
    description: 'Chart patterns, indicators, and trading signals',
    icon: FileText,
    color: '#3b82f6',
    pages: 8,
    time: '3 min'
  },
  {
    id: 'market-screening',
    name: 'Market Screening',
    description: 'Multi-asset opportunity scan with ranking',
    icon: Filter,
    color: '#8b5cf6',
    pages: 12,
    time: '4 min'
  },
  {
    id: 'quick-take',
    name: 'Quick Take',
    description: 'One-page executive summary with key metrics',
    icon: Zap,
    color: '#f59e0b',
    pages: 1,
    time: '1 min'
  },
  {
    id: 'earnings-preview',
    name: 'Earnings Preview',
    description: 'Pre-earnings analysis with estimates and risks',
    icon: Calendar,
    color: '#ef4444',
    pages: 6,
    time: '2 min'
  },
  {
    id: 'sector-analysis',
    name: 'Sector Analysis',
    description: 'Industry comparison and peer benchmarking',
    icon: PieChart,
    color: '#06b6d4',
    pages: 10,
    time: '4 min'
  }
];

interface ReportTemplateSelectorProps {
  currentReport?: any;
  onReportChange?: (report: any) => void;
}

export const ReportTemplateSelector: React.FC<ReportTemplateSelectorProps> = ({
  currentReport,
  onReportChange
}) => {
  const [selectedTemplate, setSelectedTemplate] = useState<string>('equity-research');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredTemplates = templates.filter(template =>
    template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    template.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleTemplateSelect = (templateId: string) => {
    setSelectedTemplate(templateId);
    if (onReportChange && currentReport) {
      onReportChange({
        ...currentReport,
        template: templateId
      });
    }
  };

  return (
    <Container>
      <SearchInput
        placeholder="Search templates..."
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
      />
      
      <TemplateList>
        {filteredTemplates.map(template => {
          const Icon = template.icon;
          return (
            <TemplateCard
              key={template.id}
              $selected={selectedTemplate === template.id}
              onClick={() => handleTemplateSelect(template.id)}
            >
              <TemplateHeader>
                <IconWrapper $color={template.color}>
                  <Icon />
                </IconWrapper>
                <div>
                  <TemplateTitle>{template.name}</TemplateTitle>
                  <TemplateDescription>{template.description}</TemplateDescription>
                </div>
              </TemplateHeader>
              <TemplateMeta>
                <span>{template.pages} pages</span>
                <span>•</span>
                <span>~{template.time}</span>
              </TemplateMeta>
            </TemplateCard>
          );
        })}
      </TemplateList>
    </Container>
  );
};