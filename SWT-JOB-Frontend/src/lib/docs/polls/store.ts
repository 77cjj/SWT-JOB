import fs from 'node:fs/promises';
import path from 'node:path';

import { getDocPollDefinition, listDocPollIds } from './definitions';

export type PollVoteRecord = {
  optionId: string;
  userId: string;
  workState?: string;
  programYear?: string;
  votedAt: string;
};

export type PollStoreData = {
  counts: Record<string, Record<string, number>>;
  votes: Record<string, PollVoteRecord>;
};

function resolveStorePath() {
  if (process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME) {
    return '/tmp/swt-doc-poll-votes.json';
  }
  return path.join(process.cwd(), '.data/doc-poll-votes.json');
}

function storePath() {
  return resolveStorePath();
}

function emptyStore(): PollStoreData {
  const counts: PollStoreData['counts'] = {};
  for (const pollId of listDocPollIds()) {
    counts[pollId] = {};
  }
  return { counts, votes: {} };
}

async function ensureStoreFile() {
  const STORE_PATH = storePath();
  await fs.mkdir(path.dirname(STORE_PATH), { recursive: true });
  try {
    await fs.access(STORE_PATH);
  } catch {
    await fs.writeFile(STORE_PATH, JSON.stringify(emptyStore(), null, 2), 'utf8');
  }
}

export async function readPollStore(): Promise<PollStoreData> {
  await ensureStoreFile();
  const STORE_PATH = storePath();
  try {
    const raw = await fs.readFile(STORE_PATH, 'utf8');
    const parsed = JSON.parse(raw) as PollStoreData;
    return {
      counts: parsed.counts ?? {},
      votes: parsed.votes ?? {},
    };
  } catch {
    return emptyStore();
  }
}

export async function writePollStore(data: PollStoreData) {
  await ensureStoreFile();
  const STORE_PATH = storePath();
  await fs.writeFile(STORE_PATH, JSON.stringify(data, null, 2), 'utf8');
}

export function voteKey(pollId: string, userId: string) {
  return `${pollId}:${userId}`;
}

export function buildPollResults(store: PollStoreData, pollId: string) {
  const definition = getDocPollDefinition(pollId);
  if (!definition) return null;

  const counts = store.counts[pollId] ?? {};
  const total = Object.values(counts).reduce((sum, n) => sum + n, 0);

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
