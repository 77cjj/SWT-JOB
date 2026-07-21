import type { NextApiRequest, NextApiResponse } from 'next';

import { getDocPollDefinition } from '../../../lib/docs/polls/definitions';
import {
  buildPollResults,
  readPollStore,
  voteKey,
  writePollStore,
  type PollVoteRecord,
} from '../../../lib/docs/polls/store';
import { parseJsonResponse, unwrapRagentResult } from '../../../lib/api/parseJsonResponse';

type VoteBody = {
  optionId?: string;
  workState?: string;
  programYear?: string;
};

type CurrentUser = {
  userId: string;
  username?: string;
  role?: string;
};

function resolveRagentApiBase() {
  const raw = process.env.NEXT_PUBLIC_RAGENT_API_BASE_URL?.trim().replace(/\/$/, '');
  if (raw) return raw;
  if (process.env.NODE_ENV !== 'production') return 'https://ragent.nageoffer.com';
  return null;
}

async function getUserFromRequest(req: NextApiRequest): Promise<CurrentUser | null> {
  const bypass = process.env.NEXT_PUBLIC_RAGENT_BYPASS_AUTH === 'true';
  if (bypass && process.env.NODE_ENV !== 'production') {
    const auth = req.headers.authorization;
    if (auth?.includes('local-dev-token')) {
      return { userId: 'local-admin', username: 'admin', role: 'admin' };
    }
  }

  const auth = req.headers.authorization;
  if (!auth) return null;

  const base = resolveRagentApiBase();
  if (!base) return null;

  try {
    const res = await fetch(`${base}/user/me`, {
      headers: { Authorization: auth },
    });
    if (!res.ok) return null;
    const body = await parseJsonResponse<unknown>(res);
    const data = unwrapRagentResult<CurrentUser>(body);
    if (data?.userId) return data;
    return body as CurrentUser;
  } catch {
    return null;
  }
}

function buildResultsFromBackendCounts(
  pollId: string,
  counts: Record<string, number>,
  total: number,
) {
  const definition = getDocPollDefinition(pollId);
  if (!definition) return null;
  return {
    pollId,
    total,
    options: definition.options.map((option) => {
      const count = counts[option.id] ?? 0;
      return {
        id: option.id,
        label: option.label,
        count,
        percent: total > 0 ? Math.round((count / total) * 100) : 0,
      };
    }),
  };
}

type BackendPollPayload = {
  counts?: Record<string, number>;
  total?: number;
  myVote?: string | null;
};

async function proxyPollGet(req: NextApiRequest, pollId: string) {
  const base = resolveRagentApiBase();
  if (!base) return null;
  const headers: Record<string, string> = {};
  const auth = req.headers.authorization;
  if (typeof auth === 'string') headers.Authorization = auth;

  const res = await fetch(`${base}/public/doc-polls/${encodeURIComponent(pollId)}`, { headers });
  const body = await parseJsonResponse<{ code?: number; data?: BackendPollPayload } & BackendPollPayload>(res);
  if (!res.ok) {
    throw new Error(`Poll API ${res.status}`);
  }
  const data: BackendPollPayload | null =
    unwrapRagentResult<BackendPollPayload>(body) ??
    (typeof body === 'object' && body && 'counts' in body ? (body as BackendPollPayload) : null);
  if (!data?.counts) return null;
  const total = data.total ?? Object.values(data.counts).reduce((a, b) => a + b, 0);
  const results = buildResultsFromBackendCounts(pollId, data.counts, total);
  if (!results) return null;
  return { results, myVote: data.myVote ?? null };
}

async function proxyPollPost(req: NextApiRequest, pollId: string, vote: VoteBody) {
  const base = resolveRagentApiBase();
  if (!base) return null;
  const auth = req.headers.authorization;
  if (!auth) return null;

  const res = await fetch(`${base}/doc-polls/${encodeURIComponent(pollId)}/vote`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: auth },
    body: JSON.stringify(vote),
  });
  const body = await parseJsonResponse<{ code?: number; data?: BackendPollPayload; message?: string } & BackendPollPayload>(res);
  if (!res.ok) {
    const msg = (body as { message?: string }).message ?? `投票失败 (${res.status})`;
    throw new Error(msg);
  }
  const data: BackendPollPayload | null = unwrapRagentResult<BackendPollPayload>(body);
  if (!data?.counts) return null;
  const total = data.total ?? Object.values(data.counts).reduce((a, b) => a + b, 0);
  const results = buildResultsFromBackendCounts(pollId, data.counts, total);
  if (!results) return null;
  return { results, myVote: data.myVote ?? vote.optionId ?? null };
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const pollId = typeof req.query.pollId === 'string' ? req.query.pollId : '';
  const definition = getDocPollDefinition(pollId);
  if (!definition) {
    return res.status(404).json({ ok: false, message: 'Poll not found' });
  }

  try {
    if (req.method === 'GET') {
      const proxied = await proxyPollGet(req, pollId);
      if (proxied) {
        const user = await getUserFromRequest(req);
        return res.status(200).json({
          ok: true,
          results: proxied.results,
          myVote: proxied.myVote,
          canVote: Boolean(user),
        });
      }

      const user = await getUserFromRequest(req);
      const store = await readPollStore();
      const results = buildPollResults(store, pollId);
      const myVote = user ? store.votes[voteKey(pollId, user.userId)]?.optionId ?? null : null;
      return res.status(200).json({ ok: true, results, myVote, canVote: Boolean(user) });
    }

    if (req.method === 'POST') {
      const user = await getUserFromRequest(req);
      if (!user) {
        return res.status(401).json({ ok: false, message: 'Login required' });
      }

      const body = (req.body ?? {}) as VoteBody;
      const optionId = typeof body.optionId === 'string' ? body.optionId.trim() : '';
      const workState = typeof body.workState === 'string' ? body.workState.trim().toUpperCase() : '';
      const programYear = typeof body.programYear === 'string' ? body.programYear.trim() : '';

      if (!optionId || !definition.options.some((o) => o.id === optionId)) {
        return res.status(400).json({ ok: false, message: 'Invalid option' });
      }
      if (!workState || workState.length !== 2) {
        return res.status(400).json({ ok: false, message: 'Work state required' });
      }
      if (!/^\d{4}$/.test(programYear)) {
        return res.status(400).json({ ok: false, message: 'Program year required' });
      }

      const proxied = await proxyPollPost(req, pollId, { optionId, workState, programYear });
      if (proxied) {
        return res.status(200).json({ ok: true, results: proxied.results, myVote: proxied.myVote });
      }

      const store = await readPollStore();
      const key = voteKey(pollId, user.userId);
      const existing = store.votes[key];

      if (existing?.optionId === optionId) {
        store.votes[key] = {
          ...existing,
          workState,
          programYear,
          votedAt: new Date().toISOString(),
        };
        await writePollStore(store);
        const results = buildPollResults(store, pollId);
        return res.status(200).json({ ok: true, results, myVote: optionId });
      }

      if (existing) {
        const prevCounts = store.counts[pollId] ?? {};
        if (prevCounts[existing.optionId] > 0) {
          prevCounts[existing.optionId] -= 1;
        }
      }

      const nextRecord: PollVoteRecord = {
        optionId,
        userId: user.userId,
        workState,
        programYear,
        votedAt: new Date().toISOString(),
      };

      store.votes[key] = nextRecord;
      store.counts[pollId] ??= {};
      store.counts[pollId][optionId] = (store.counts[pollId][optionId] ?? 0) + 1;

      await writePollStore(store);
      const results = buildPollResults(store, pollId);
      return res.status(200).json({ ok: true, results, myVote: optionId });
    }

    res.setHeader('Allow', 'GET, POST');
    return res.status(405).json({ ok: false, message: 'Method not allowed' });
  } catch (error) {
    console.error('[doc-polls]', pollId, error);
    return res.status(500).json({
      ok: false,
      message: error instanceof Error ? error.message : 'Poll error',
    });
  }
}
