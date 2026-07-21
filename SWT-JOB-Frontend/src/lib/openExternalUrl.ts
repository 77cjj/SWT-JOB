/** 在用户手势内打开外链，降低被拦截概率 */
export function openExternalUrl(url: string): boolean {
  if (!url || url === '#') return false;
  try {
    const parsed = new URL(url, typeof window !== 'undefined' ? window.location.href : undefined);
    if (!/^https?:$/i.test(parsed.protocol)) return false;
  } catch {
    return false;
  }

  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.target = '_blank';
  anchor.rel = 'noopener noreferrer';
  anchor.style.display = 'none';
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);

  const popup = window.open(url, '_blank', 'noopener,noreferrer');
  return Boolean(popup) || true;
}
