// src/utils/analytics/HoverAnalytics.ts
// Telemetry and analytics for TriSight hover tooltip system
// Captures user interaction patterns, performance metrics, and usage statistics

export interface HoverEvent {
  type: 'HOVER_START' | 'HOVER_END' | 'ZONE_EXPAND' | 'ZONE_COLLAPSE' | 'HOLD_MODE_ACTIVATED' | 'ACTION_CLICKED';
  timestamp: number;
  candleIndex: number;
  symbol?: string;
  duration?: number;
  zoneNumber?: number;
  actionType?: string;
  metadata?: Record<string, any>;
}

export interface HoverSession {
  sessionId: string;
  startTime: number;
  endTime?: number;
  events: HoverEvent[];
  patternTypesEncountered: string[];
  totalHoverDuration: number;
  zoneInteractions: Record<number, number>;
  aiInsightViews: number;
}

export interface HoverMetrics {
  totalSessions: number;
  averageSessionDuration: number;
  mostUsedZones: number[];
  patternEngagementRates: Record<string, number>;
  holdModeActivationRate: number;
  aiInsightEngagementRate: number;
  performanceMetrics: {
    averageRenderTime: number;
    memoryUsage: number;
    errorRate: number;
  };
}

class HoverAnalyticsEngine {
  private currentSession: HoverSession | null = null;
  private sessions: HoverSession[] = [];
  private isEnabled: boolean = true;
  private maxSessionHistory = 100;

  /**
   * Initialize hover analytics tracking
   */
  startSession(symbol?: string): string {
    const sessionId = this.generateSessionId();
    this.currentSession = {
      sessionId,
      startTime: Date.now(),
      events: [],
      patternTypesEncountered: [],
      totalHoverDuration: 0,
      zoneInteractions: {},
      aiInsightViews: 0
    };

    this.trackEvent({
      type: 'HOVER_START',
      timestamp: Date.now(),
      candleIndex: -1,
      symbol,
      metadata: { sessionStart: true }
    });

    return sessionId;
  }

  /**
   * End current hover session
   */
  endSession(): HoverSession | null {
    if (!this.currentSession) return null;

    this.currentSession.endTime = Date.now();
    this.currentSession.totalHoverDuration = 
      this.currentSession.endTime - this.currentSession.startTime;

    this.trackEvent({
      type: 'HOVER_END',
      timestamp: Date.now(),
      candleIndex: -1,
      duration: this.currentSession.totalHoverDuration,
      metadata: { sessionEnd: true }
    });

    // Store session and manage history
    this.sessions.push(this.currentSession);
    if (this.sessions.length > this.maxSessionHistory) {
      this.sessions.shift();
    }

    const completedSession = this.currentSession;
    this.currentSession = null;
    return completedSession;
  }

  /**
   * Track hover-related events
   */
  trackEvent(event: Omit<HoverEvent, 'timestamp'> & { timestamp?: number }) {
    if (!this.isEnabled || !this.currentSession) return;

    const fullEvent: HoverEvent = {
      ...event,
      timestamp: event.timestamp || Date.now()
    };

    this.currentSession.events.push(fullEvent);

    // Update session metrics
    this.updateSessionMetrics(fullEvent);
  }

  /**
   * Track zone expansion/collapse
   */
  trackZoneInteraction(zoneNumber: number, action: 'expand' | 'collapse') {
    this.trackEvent({
      type: action === 'expand' ? 'ZONE_EXPAND' : 'ZONE_COLLAPSE',
      timestamp: Date.now(),
      candleIndex: -1,
      zoneNumber,
      metadata: { zoneInteraction: true }
    });
  }

  /**
   * Track hold mode activation
   */
  trackHoldModeActivation(candleIndex: number, patterns: string[]) {
    this.trackEvent({
      type: 'HOLD_MODE_ACTIVATED',
      timestamp: Date.now(),
      candleIndex,
      metadata: { patterns, holdMode: true }
    });
  }

  /**
   * Track action button clicks
   */
  trackActionClick(actionType: string, candleIndex: number) {
    this.trackEvent({
      type: 'ACTION_CLICKED',
      timestamp: Date.now(),
      candleIndex,
      actionType,
      metadata: { userAction: true }
    });
  }

  /**
   * Get current session metrics
   */
  getCurrentSessionMetrics(): Partial<HoverSession> {
    if (!this.currentSession) return {};

    return {
      sessionId: this.currentSession.sessionId,
      startTime: this.currentSession.startTime,
      events: [...this.currentSession.events],
      totalHoverDuration: Date.now() - this.currentSession.startTime,
      zoneInteractions: { ...this.currentSession.zoneInteractions },
      aiInsightViews: this.currentSession.aiInsightViews
    };
  }

  /**
   * Generate comprehensive hover analytics report
   */
  generateAnalyticsReport(): HoverMetrics {
    const totalSessions = this.sessions.length;
    if (totalSessions === 0) {
      return this.getEmptyMetrics();
    }

    const totalDuration = this.sessions.reduce((sum, s) => sum + s.totalHoverDuration, 0);
    const averageSessionDuration = totalDuration / totalSessions;

    // Zone usage analysis
    const zoneUsage: Record<number, number> = {};
    this.sessions.forEach(session => {
      Object.entries(session.zoneInteractions).forEach(([zone, count]) => {
        zoneUsage[Number(zone)] = (zoneUsage[Number(zone)] || 0) + count;
      });
    });

    const mostUsedZones = Object.entries(zoneUsage)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 3)
      .map(([zone]) => Number(zone));

    // Pattern engagement analysis
    const patternEngagement: Record<string, number> = {};
    this.sessions.forEach(session => {
      session.patternTypesEncountered.forEach(pattern => {
        patternEngagement[pattern] = (patternEngagement[pattern] || 0) + 1;
      });
    });

    // Calculate rates
    const holdModeActivations = this.sessions.reduce((count, session) => 
      count + session.events.filter(e => e.type === 'HOLD_MODE_ACTIVATED').length, 0);
    const holdModeActivationRate = holdModeActivations / totalSessions;

    const aiInsightViews = this.sessions.reduce((sum, session) => sum + session.aiInsightViews, 0);
    const aiInsightEngagementRate = aiInsightViews / totalSessions;

    return {
      totalSessions,
      averageSessionDuration,
      mostUsedZones,
      patternEngagementRates: patternEngagement,
      holdModeActivationRate,
      aiInsightEngagementRate,
      performanceMetrics: {
        averageRenderTime: this.calculateAverageRenderTime(),
        memoryUsage: this.getMemoryUsage(),
        errorRate: this.calculateErrorRate()
      }
    };
  }

  /**
   * Export analytics data for external analysis
   */
  exportAnalyticsData(): {
    sessions: HoverSession[];
    metrics: HoverMetrics;
    exportTimestamp: number;
  } {
    return {
      sessions: [...this.sessions],
      metrics: this.generateAnalyticsReport(),
      exportTimestamp: Date.now()
    };
  }

  /**
   * Enable/disable analytics tracking
   */
  setEnabled(enabled: boolean) {
    this.isEnabled = enabled;
  }

  /**
   * Clear all analytics data
   */
  clearData() {
    this.sessions = [];
    this.currentSession = null;
  }

  // Private helper methods
  private generateSessionId(): string {
    return `hover_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private updateSessionMetrics(event: HoverEvent) {
    if (!this.currentSession) return;

    // Track zone interactions
    if (event.zoneNumber) {
      this.currentSession.zoneInteractions[event.zoneNumber] = 
        (this.currentSession.zoneInteractions[event.zoneNumber] || 0) + 1;
    }

    // Track pattern encounters
    if (event.metadata?.patterns) {
      event.metadata.patterns.forEach((pattern: string) => {
        if (!this.currentSession!.patternTypesEncountered.includes(pattern)) {
          this.currentSession!.patternTypesEncountered.push(pattern);
        }
      });
    }

    // Track AI insight views
    if (event.metadata?.aiInsight) {
      this.currentSession.aiInsightViews++;
    }
  }

  private getEmptyMetrics(): HoverMetrics {
    return {
      totalSessions: 0,
      averageSessionDuration: 0,
      mostUsedZones: [],
      patternEngagementRates: {},
      holdModeActivationRate: 0,
      aiInsightEngagementRate: 0,
      performanceMetrics: {
        averageRenderTime: 0,
        memoryUsage: 0,
        errorRate: 0
      }
    };
  }

  private calculateAverageRenderTime(): number {
    // Placeholder for performance timing
    return 16.7; // Target 60fps
  }

  private getMemoryUsage(): number {
    // Placeholder for memory usage tracking
    if (typeof performance !== 'undefined' && (performance as any).memory) {
      return (performance as any).memory.usedJSHeapSize / 1024 / 1024; // MB
    }
    return 0;
  }

  private calculateErrorRate(): number {
    const totalEvents = this.sessions.reduce((sum, session) => sum + session.events.length, 0);
    const errorEvents = this.sessions.reduce((sum, session) => 
      sum + session.events.filter(e => e.metadata?.error).length, 0);
    
    return totalEvents > 0 ? errorEvents / totalEvents : 0;
  }
}

// Global analytics instance
export const HoverAnalytics = new HoverAnalyticsEngine();

// React hook for hover analytics
export function useHoverAnalytics() {
  return {
    startSession: (symbol?: string) => HoverAnalytics.startSession(symbol),
    endSession: () => HoverAnalytics.endSession(),
    trackEvent: (event: Omit<HoverEvent, 'timestamp'>) => HoverAnalytics.trackEvent(event),
    trackZoneInteraction: (zone: number, action: 'expand' | 'collapse') => 
      HoverAnalytics.trackZoneInteraction(zone, action),
    trackHoldMode: (candleIndex: number, patterns: string[]) => 
      HoverAnalytics.trackHoldModeActivation(candleIndex, patterns),
    trackAction: (actionType: string, candleIndex: number) => 
      HoverAnalytics.trackActionClick(actionType, candleIndex),
    getMetrics: () => HoverAnalytics.generateAnalyticsReport(),
    exportData: () => HoverAnalytics.exportAnalyticsData()
  };
}
