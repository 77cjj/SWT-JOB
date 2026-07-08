export function formatFetchError(e: unknown, fallback: string): string {
  const msg = e instanceof Error ? e.message : String(e);
  if (
    msg === 'Failed to fetch' ||
    msg.includes('NetworkError') ||
    msg.includes('Load failed') ||
    msg.includes('fetch failed')
  ) {
    return fallback;
  }
  return msg || fallback;
}
