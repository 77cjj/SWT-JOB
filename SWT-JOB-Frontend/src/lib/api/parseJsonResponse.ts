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

/** 后端 Result.code 可能是字符串 "0" 或数字 0 */
export function isRagentSuccessCode(code: unknown): boolean {
  return code === 0 || code === 200 || code === '0' || code === '200';
}

/** Ragent API 统一 Result 包装 */
export function unwrapRagentResult<T>(body: unknown): T | null {
  if (!body || typeof body !== 'object') return null;
  const record = body as { code?: number | string; data?: T; message?: string };
  if (isRagentSuccessCode(record.code)) {
    return (record.data ?? null) as T | null;
  }
  if ('userId' in (body as object)) {
    return body as T;
  }
  return null;
}

/** fetch Response → 解包 Result.data；失败抛出业务 message */
export async function parseRagentResultResponse<T>(res: Response): Promise<T> {
  const json = (await parseJsonResponse<{
    code?: number | string;
    data?: T;
    message?: string;
  }>(res)) as { code?: number | string; data?: T; message?: string };
  if (isRagentSuccessCode(json.code)) {
    return json.data as T;
  }
  throw new Error(json.message || (res.ok ? '请求失败' : `HTTP ${res.status}`));
}
