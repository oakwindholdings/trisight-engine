// src/services/telemetry.ts
// Minimal telemetry shim. In tests it can be mocked; in dev it logs to console.

export interface TelemetryPayload {
  [k: string]: any
}

export function track(event: string, payload: TelemetryPayload = {}): void {
  try {
    if (process.env.NODE_ENV === 'test') return; // noop in tests unless mocked
    // eslint-disable-next-line no-console
    console.debug(`[telemetry] ${event}`, payload);
  } catch {}
}

