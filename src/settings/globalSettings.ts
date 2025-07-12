export const DEFAULT_POLLING_INTERVAL_SECONDS = 60;

export function getPollingInterval(): number {
  const stored = localStorage.getItem('trisight_polling_interval');
  return stored ? parseInt(stored, 10) : DEFAULT_POLLING_INTERVAL_SECONDS;
}

export function setPollingInterval(seconds: number): void {
  localStorage.setItem('trisight_polling_interval', seconds.toString());
}
