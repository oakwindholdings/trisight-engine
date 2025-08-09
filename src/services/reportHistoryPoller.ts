// src/services/reportHistoryPoller.ts
// Centralized reports history poller with backoff, visibility pause, and shared subscribers
// Rule: StableList

import { ReportApiService } from './reportApiService';

export interface ReportsUpdatePayload {
  reports: any[];
  errorCode?: string; // e.g., LSUP-001, LFS-001
}

type Subscriber = (payload: ReportsUpdatePayload) => void;

class ReportHistoryPoller {
  private subscribers: Set<Subscriber> = new Set();
  private timer: any = null;
  private running: boolean = false;
  private backoffMs: number = 30000; // normal cadence when healthy
  private errorBackoffMs: number = 2000; // starts at 2s on error, doubles to 60s
  private readonly maxErrorBackoffMs: number = 60000;
  private lastPayload: ReportsUpdatePayload | null = null;
  private hidden: boolean = typeof document !== 'undefined' ? document.hidden : false;
  private api: ReportApiService = new ReportApiService();
  private paused: boolean = false; // Rule: Backoff + PauseUntilReady

  constructor() {
    if (typeof document !== 'undefined') {
      document.addEventListener('visibilitychange', () => {
        this.hidden = document.hidden;
        if (this.hidden) this.stopTimer();
        else if (this.subscribers.size > 0 && !this.paused) this.scheduleNext(0);
      });
    }
  }

  subscribe(cb: Subscriber): () => void {
    this.subscribers.add(cb);
    // Immediately deliver last payload if we have one
    if (this.lastPayload) cb(this.lastPayload);

    if (!this.running && !this.hidden && !this.paused) {
      this.running = true;
      this.scheduleNext(0);
    }

    return () => {
      this.subscribers.delete(cb);
      if (this.subscribers.size === 0) {
        this.stopTimer();
        this.running = false;
      }
    };
  }

  pause() {
    this.paused = true;
    this.stopTimer();
  }

  resume() {
    this.paused = false;
    if (this.subscribers.size > 0 && !this.hidden) this.scheduleNext(0);
  }

  private stopTimer() {
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }
  }

  private scheduleNext(delayMs: number) {
    this.stopTimer();
    if (this.paused) return;
    this.timer = setTimeout(() => this.pollOnce(), delayMs);
  }

  private async pollOnce() {
    try {
      const response = await this.api.listReports();
      const payload: ReportsUpdatePayload = {
        reports: response.reports || [],
        errorCode: (response as any).errorCode, // surfaced by backend on failure
      };
      this.lastPayload = payload;
      this.subscribers.forEach(cb => cb(payload));

      // Pause if Supabase-related error: require resume()
      if (payload.errorCode && payload.errorCode.startsWith('LSUP-')) {
        this.pause();
        return;
      }

      // Healthy: reset error backoff, schedule normal cadence
      this.errorBackoffMs = 2000;
      this.scheduleNext(this.backoffMs);
    } catch (e: any) {
      // Error: do not spam; emit a single inline error with last known error code if available

// Expose for optional UI calls (no-op safe in tests)
try {
  if (typeof window !== 'undefined') {
    (window as any).reportHistoryPoller = reportHistoryPoller;
  }
} catch {}

      const payload: ReportsUpdatePayload = {
        reports: [],
        errorCode: e?.code || e?.response?.data?.errorCode || 'LGEN-ERR'
      };
      this.lastPayload = payload;
      this.subscribers.forEach(cb => cb(payload));

      // Exponential backoff on error
      const wait = this.errorBackoffMs;
      this.errorBackoffMs = Math.min(this.errorBackoffMs * 2, this.maxErrorBackoffMs);
      this.scheduleNext(wait);
    }
  }
}

export const reportHistoryPoller = new ReportHistoryPoller();

