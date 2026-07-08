import type { NextApiRequest, NextApiResponse } from 'next';

import { getDocPollDefinition } from '../../../lib/docs/polls/definitions';
import {
  buildPollResults,
  readPollStore,
  voteKey,
  writePollStore,
  type PollVoteRecord,
} from '../../../lib/docs/polls/store';

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
    return (await res.json()) as CurrentUser;
  } catch {
    return null;
  }
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const pollId = typeof req.query.pollId === 'string' ? req.query.pollId : '';
  const definition = getDocPollDefinition(pollId);
  if (!definition) {
    return res.status(404).json({ ok: false, message: 'Poll not found' });
  }

  const user = await getUserFromRequest(req);

  if (req.method === 'GET') {
    const store = await readPollStore();
    const results = buildPollResults(store, pollId);
    const myVote = user ? store.votes[voteKey(pollId, user.userId)]?.optionId ?? null : null;
    return res.status(200).json({ ok: true, results, myVote, canVote: Boolean(user) });
  }

  if (req.method === 'POST') {
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
}
