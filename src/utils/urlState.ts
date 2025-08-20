// src/utils/urlState.ts
// Helpers for reading/updating URL query params

export function getSearchParams(): URLSearchParams {
  return new URLSearchParams(window.location.search);
}

export function getParam(key: string): string | null {
  return getSearchParams().get(key);
}

export function setParams(next: Record<string, string | null | undefined>, push: boolean = true): void {
  const url = new URL(window.location.href);
  const params = url.searchParams;
  Object.entries(next).forEach(([k, v]) => {
    if (v === null || v === undefined || v === '') params.delete(k);
    else params.set(k, String(v));
  });
  url.search = params.toString();
  if (push) window.history.pushState({}, '', url.toString());
  else window.history.replaceState({}, '', url.toString());
}

export function onPopState(handler: () => void): () => void {
  window.addEventListener('popstate', handler);
  return () => window.removeEventListener('popstate', handler);
}

