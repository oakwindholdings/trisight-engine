// src/pages/ReportsPage.tsx
// Main Reports interface with customizable grid layout
// Context: Professional report generation command center

import React, { useState, useCallback, useEffect } from 'react';
import styled from 'styled-components';
import GridLayout, { Responsive as ResponsiveGridLayout, Layout, Layouts } from 'react-grid-layout';
import {
  FileText,
  Plus,
  Settings,
  Download,
  Clock,
  TrendingUp,
  Database,
  Zap,
  Eye,
  Send,
  Save,
  Maximize2,
  Minimize2,
  X,
  Menu
} from 'lucide-react';
import { ReportTemplateSelector } from '../components/Reports/ReportTemplateSelector';
import { DataSourceManager } from '../components/Reports/DataSourceManager';
import { ReportPreview } from '../components/Reports/ReportPreview';
import { ReportHistory } from '../components/Reports/ReportHistory';
import { QuickMetrics } from '../components/Reports/QuickMetrics';
import { ReportWizard } from '../components/Reports/ReportWizard';
import { ExportPanel } from '../components/Reports/ExportPanel';
import ReportsAdmin from './ReportsAdmin';
import { AIInsights } from '../components/Reports/AIInsights';
import 'react-grid-layout/css/styles.css';
import 'react-resizable/css/styles.css';

const PageContainer = styled.div`
  min-height: calc(100vh - 60px);
  background: #f9fafb;
  display: flex;
  flex-direction: column;
  margin-left: 180px; // Account for pattern feed sidebar
`;

const PageHeader = styled.div`
  background: white;
  padding: 1.5rem 2rem;
  border-bottom: 1px solid #e5e7eb;
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const PageTitle = styled.h1`
  font-size: 1.75rem;
  font-weight: 700;
  color: #1e293b;
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const HeaderActions = styled.div`
  display: flex;
  gap: 1rem;
  align-items: center;
`;

const Button = styled.button<{ $variant?: 'primary' | 'secondary' }>`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.625rem 1.25rem;
  border: none;
  border-radius: 0.5rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;

  ${props => props.$variant === 'primary' ? `
    background: #10b981;
    color: white;

    &:hover {
      background: #059669;
    }
  ` : `
    background: white;
    color: #374151;
    border: 1px solid #d1d5db;

    &:hover {
      background: #f3f4f6;
    }
  `}

  svg {
    width: 18px;
    height: 18px;
  }
`;

const LayoutControls = styled.div`
  display: flex;
  gap: 0.5rem;
  align-items: center;
  padding-right: 1rem;
  border-right: 1px solid #e5e7eb;
`;

const IconButton = styled.button`
  padding: 0.5rem;
  background: white;
  border: 1px solid #d1d5db;
  border-radius: 0.375rem;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    background: #f3f4f6;
  }

  svg {
    width: 16px;
    height: 16px;
    color: #6b7280;
  }
`;

const TabsBar = styled.div`
  display: flex;
  gap: 0.75rem;
  align-items: center;
`;
const TabPill = styled.button<{ $active?: boolean }>`
  padding: 0.375rem 0.75rem;
  border: 1px solid #d1d5db;
  border-radius: 0.5rem;
  background: ${p => p.$active ? '#10b981' : '#fff'};
  color: ${p => p.$active ? '#fff' : '#374151'};
  cursor: pointer;
  font-size: 0.9rem;
`;

const GridContainer = styled.div`
  flex: 1;
  padding: 1.5rem;
  overflow: auto;

  .react-grid-layout {
    min-height: calc(100vh - 180px);
  }

  .react-grid-item {
    background: white;
    border-radius: 0.5rem;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
    transition: all 0.2s ease;

    &:hover {
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    }

    &.react-grid-item--dragging {
      box-shadow: 0 10px 20px rgba(0, 0, 0, 0.2);
      z-index: 100;
    }
  }

  .react-resizable-handle {
    opacity: 0;
    transition: opacity 0.2s ease;
  }

  .react-grid-item:hover .react-resizable-handle {
    opacity: 1;
  }
`;

const Widget = styled.div<{ $maximized?: boolean }>`
  height: 100%;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  ${props => props.$maximized && `
    position: fixed;
    top: 60px;
    left: 0;
    right: 0;
    bottom: 0;
    z-index: 1000;
    border-radius: 0;
    background: white;
    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
  `}
`;

const WidgetHeader = styled.div`
  padding: 1rem 1.5rem;
  border-bottom: 1px solid #e5e7eb;
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: #f9fafb;
`;

const WidgetTitle = styled.h3`
  font-size: 1rem;
  font-weight: 600;
  color: #374151;
  display: flex;
  align-items: center;
  gap: 0.5rem;

  svg {
    width: 18px;
    height: 18px;
    color: #6b7280;
  }
`;

const WidgetActions = styled.div`
  display: flex;
  gap: 0.25rem;
`;

const WidgetButton = styled.button`
  padding: 0.25rem;
  background: none;
  border: none;
  cursor: pointer;
  color: #6b7280;
  border-radius: 0.25rem;
  transition: all 0.2s ease;

  &:hover {
    background: #e5e7eb;
    color: #374151;
  }

  svg {
    width: 16px;
    height: 16px;
  }
`;

const WidgetContent = styled.div<{ $widgetId?: string }>`
  flex: 1;
  overflow: ${props => props.$widgetId === 'wizard' ? 'hidden' : 'auto'};
  position: relative;
  display: flex;
  flex-direction: column;
`;

const EmptyState = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: #6b7280;

  svg {
    width: 48px;
    height: 48px;
    margin-bottom: 1rem;
    opacity: 0.5;
  }

  p {
    font-size: 0.875rem;
  }
`;

// Widget type definitions
type WidgetType =
  | 'wizard'
  | 'templates'
  | 'dataSources'
  | 'preview'
  | 'history'
  | 'metrics'
  | 'export'
  | 'insights';

interface WidgetConfig {
  id: WidgetType;
  title: string;
  icon: React.ElementType;
  defaultSize: { w: number; h: number; minW?: number; minH?: number };
  component: React.ComponentType<any>;
}

// Widget configurations
const widgetConfigs: Record<WidgetType, WidgetConfig> = {
  wizard: {
    id: 'wizard',
    title: 'Report Wizard',
    icon: Zap,
    defaultSize: { w: 6, h: 8, minW: 4, minH: 6 },
    component: ReportWizard
  },
  templates: {
    id: 'templates',
    title: 'Templates',
    icon: FileText,
    defaultSize: { w: 3, h: 8, minW: 2, minH: 4 },
    component: ReportTemplateSelector
  },
  dataSources: {
    id: 'dataSources',
    title: 'Data Sources',
    icon: Database,
    defaultSize: { w: 3, h: 8, minW: 2, minH: 4 },
    component: DataSourceManager
  },
  preview: {
    id: 'preview',
    title: 'Live Preview',
    icon: Eye,
    defaultSize: { w: 6, h: 10, minW: 4, minH: 6 },
    component: ReportPreview
  },
  history: {
    id: 'history',
    title: 'Recent Reports',
    icon: Clock,
    defaultSize: { w: 3, h: 6, minW: 2, minH: 4 },
    component: ReportHistory
  },
  metrics: {
    id: 'metrics',
    title: 'Quick Metrics',
    icon: TrendingUp,
    defaultSize: { w: 3, h: 4, minW: 2, minH: 3 },
    component: QuickMetrics
  },
  export: {
    id: 'export',
    title: 'Export Options',
    icon: Download,
    defaultSize: { w: 3, h: 6, minW: 2, minH: 4 },
    component: ExportPanel
  },
  insights: {
    id: 'insights',
    title: 'AI Insights',
    icon: Zap,
    defaultSize: { w: 3, h: 6, minW: 2, minH: 4 },
    component: AIInsights
  }
};

// Default layout configuration
const getDefaultLayout = (): Layout[] => [
  { i: 'wizard', x: 0, y: 0, w: 6, h: 8, minW: 4, minH: 6, static: false },
  { i: 'templates', x: 6, y: 0, w: 3, h: 4, minW: 2, minH: 3, static: false },
  { i: 'dataSources', x: 9, y: 0, w: 3, h: 4, minW: 2, minH: 3, static: false },
  { i: 'preview', x: 0, y: 8, w: 6, h: 6, minW: 4, minH: 4, static: false },
  { i: 'history', x: 6, y: 4, w: 3, h: 6, minW: 2, minH: 4, static: false },
  { i: 'metrics', x: 9, y: 4, w: 3, h: 3, minW: 2, minH: 2, static: false },
  { i: 'export', x: 6, y: 10, w: 3, h: 4, minW: 2, minH: 3, static: false },
  { i: 'insights', x: 9, y: 7, w: 3, h: 7, minW: 2, minH: 4, static: false }
];

const defaultLayouts: Layouts = {
  lg: getDefaultLayout(),
  md: getDefaultLayout(),
  sm: getDefaultLayout(),
  xs: getDefaultLayout(),
  xxs: getDefaultLayout()
};

const ReportsPage: React.FC = () => {
  const [layouts, setLayouts] = useState<Layouts>(defaultLayouts);
  const [activeWidgets, setActiveWidgets] = useState<Set<WidgetType>>(
    new Set(Object.keys(widgetConfigs) as WidgetType[])
  );
  const [maximizedWidget, setMaximizedWidget] = useState<WidgetType | null>(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [currentReport, setCurrentReport] = useState<any>(null);
  const [mounted, setMounted] = useState(false);
  const [activeTab, setActiveTab] = useState<'generate'|'admin'>('generate');

  // Load saved layout from localStorage
  useEffect(() => {
    try {
      const savedLayouts = localStorage.getItem('trisight-reports-layout');
      if (savedLayouts && savedLayouts !== 'undefined') {
        const parsed = JSON.parse(savedLayouts);
        if (parsed && typeof parsed === 'object') {
          setLayouts(parsed);
        }
      }
    } catch (error) {
      console.error('Error loading saved layouts:', error);
      // Clear corrupted data
      localStorage.removeItem('trisight-reports-layout');
    }
    console.log('[ReportsPage] Initial layouts:', layouts);
    console.log('[ReportsPage] Active widgets:', Array.from(activeWidgets));
    setMounted(true);
  }, []);

  // Handle layout changes
  const handleLayoutChange = useCallback((currentLayout: Layout[], allLayouts: Layouts) => {
    setLayouts(allLayouts);
    try {
      if (allLayouts && typeof allLayouts === 'object') {
        localStorage.setItem('trisight-reports-layout', JSON.stringify(allLayouts));
      }
    } catch (error) {
      console.error('Error saving layouts:', error);
    }
  }, []);

  // Toggle widget visibility
  const toggleWidget = useCallback((widgetId: WidgetType) => {
    setActiveWidgets(prev => {
      const next = new Set(prev);
      if (next.has(widgetId)) {
        next.delete(widgetId);
      } else {
        next.add(widgetId);
      }
      return next;
    });
  }, []);

  // Maximize/minimize widget
  const toggleMaximize = useCallback((widgetId: WidgetType) => {
    setMaximizedWidget(prev => prev === widgetId ? null : widgetId);
  }, []);

  // Reset layout to default
  const resetLayout = useCallback(() => {
    const newLayouts = {
      lg: getDefaultLayout(),
      md: getDefaultLayout(),
      sm: getDefaultLayout(),
      xs: getDefaultLayout(),
      xxs: getDefaultLayout()
    };
    setLayouts(newLayouts);
    setActiveWidgets(new Set(Object.keys(widgetConfigs) as WidgetType[]));
    localStorage.removeItem('trisight-reports-layout');
  }, []);

  // Create new report
  const handleNewReport = useCallback(() => {
    setCurrentReport({
      id: `report-${Date.now()}`,
      title: 'Untitled Report',
      createdAt: new Date(),
      status: 'draft'
    });

    // Show wizard widget and maximize it
    setActiveWidgets(prev => new Set([...prev, 'wizard']));
    setMaximizedWidget('wizard');
  }, []);

  // View report handler
  const handleViewReport = useCallback((report: any) => {
    console.log('[ReportsPage] Viewing report:', report);

    // Update current report
    setCurrentReport(report);

    // Show preview widget and maximize it
    setActiveWidgets(prev => new Set([...prev, 'preview']));
    setMaximizedWidget('preview');

    // Close wizard if it was open
    if (maximizedWidget === 'wizard') {
      setMaximizedWidget('preview');
    }
  }, [maximizedWidget]);

  // Listen for report view events
  useEffect(() => {
    const handleViewReportEvent = (event: CustomEvent) => {
      const { report } = event.detail;
      handleViewReport(report);
    };

    window.addEventListener('viewReport', handleViewReportEvent as EventListener);

    return () => {
      window.removeEventListener('viewReport', handleViewReportEvent as EventListener);
    };
  }, [handleViewReport]);

  // Render widget content
  const renderWidget = (widgetId: WidgetType, forMaximized: boolean = false) => {
    const config = widgetConfigs[widgetId];
    const Component = config.component;
    const Icon = config.icon;
    const isMaximized = maximizedWidget === widgetId;

    // Only render if it matches the forMaximized state
    if (forMaximized !== isMaximized) {
      return forMaximized ? null : null;
    }

    // For grid items, add key directly to Widget component
    const widget = (
      <Widget key={!forMaximized ? widgetId : undefined} $maximized={isMaximized}>
        <WidgetHeader>
          <WidgetTitle>
            <Icon />
            {config.title}
          </WidgetTitle>
          <WidgetActions>
            <WidgetButton onClick={() => toggleMaximize(widgetId)}>
              {isMaximized ? <Minimize2 /> : <Maximize2 />}
            </WidgetButton>
            {isEditMode && !isMaximized && (
              <WidgetButton onClick={() => toggleWidget(widgetId)}>
                <X />
              </WidgetButton>
            )}
          </WidgetActions>
        </WidgetHeader>
        <WidgetContent $widgetId={widgetId}>
          <Component
            currentReport={currentReport}
            onReportChange={setCurrentReport}
            onViewReport={widgetId === 'wizard' ? handleViewReport : undefined}
          />
        </WidgetContent>
      </Widget>
    );

    return widget;
  };

  return (
    <PageContainer>
      <PageHeader>
        <PageTitle>
          <FileText />
          Report Generation Center
        </PageTitle>
        <HeaderActions>
          <LayoutControls>
            <IconButton
              onClick={() => setIsEditMode(!isEditMode)}
              title="Toggle edit mode"
            >
              <Menu />
            </IconButton>
            <IconButton
              onClick={resetLayout}
              title="Reset layout"
            >
              <Settings />
            </IconButton>
          </LayoutControls>
          <Button $variant="secondary">
            <Save />
            Save Draft
          </Button>
          <Button $variant="secondary">
            <Send />
            Share
          </Button>
          <Button $variant="primary" onClick={handleNewReport}>
            <Plus />
            New Report
          </Button>
          {/* Admin/Generate tabs */}
          <TabsBar>
            <TabPill type="button" $active={activeTab==='generate'} onClick={() => setActiveTab('generate')}>Generate</TabPill>
            <TabPill type="button" $active={activeTab==='admin'} onClick={() => setActiveTab('admin')}>Admin</TabPill>
          </TabsBar>

          {activeTab === 'admin' ? (
            <ReportsAdmin />
          ) : null}

        </HeaderActions>
      </PageHeader>

      <GridContainer>
        {mounted && (
          <GridLayout
            className="layout"
            layout={layouts.lg}
            cols={12}
            rowHeight={60}
            width={1200}
            isDraggable={isEditMode}
            isResizable={isEditMode}
            margin={[16, 16]}
            containerPadding={[0, 0]}
            compactType="vertical"
            useCSSTransforms={true}
            onLayoutChange={(layout) => handleLayoutChange(layout, layouts)}
          >
            {Array.from(activeWidgets).map(widgetId => {
              const config = widgetConfigs[widgetId];
              const Component = config.component;
              const Icon = config.icon;

              return (
                <Widget key={widgetId}>
                  <WidgetHeader>
                    <WidgetTitle>
                      <Icon />
                      {config.title}
                    </WidgetTitle>
                    <WidgetActions>
                      <WidgetButton onClick={() => toggleMaximize(widgetId)}>
                        <Maximize2 />
                      </WidgetButton>
                      {isEditMode && (
                        <WidgetButton onClick={() => toggleWidget(widgetId)}>
                          <X />
                        </WidgetButton>
                      )}
                    </WidgetActions>
                  </WidgetHeader>
                  <WidgetContent $widgetId={widgetId}>
                    <Component
                      currentReport={currentReport}
                      onReportChange={setCurrentReport}
                      onViewReport={widgetId === 'wizard' ? handleViewReport : undefined}
                    />
                  </WidgetContent>
                </Widget>
              );
            })}
          </GridLayout>
        )}

        {/* Render maximized widget outside of grid */}
        {maximizedWidget && renderWidget(maximizedWidget, true)}
      </GridContainer>
    </PageContainer>
  );
};

export default ReportsPage;