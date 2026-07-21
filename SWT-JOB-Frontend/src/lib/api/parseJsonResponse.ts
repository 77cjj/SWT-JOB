export async function parseJsonResponse<T>(res: Response): Promise<T> {
  const text = await res.text();
  if (!text.trim()) {
    return {} as T;
  }
  try {
    return JSON.parse(text) as T;
  } catch {
    const snippet = text.slice(0, 120).replace(/\s+/g, ' ');
    throw new Error(
      res.ok
        ? `服务器返回非 JSON：${snippet}`
        : `请求失败 (${res.status})：${snippet}`,
    );
  }
}

/** Ragent API 统一 Result 包装 */
export function unwrapRagentResult<T>(body: unknown): T | null {
  if (!body || typeof body !== 'object') return null;
  const record = body as { code?: number; data?: T; message?: string };
  if (record.code === 0 || record.code === 200) {
    return record.data ?? null;
  }
  if ('userId' in (body as object)) {
    return body as T;
  }
  return null;
}
