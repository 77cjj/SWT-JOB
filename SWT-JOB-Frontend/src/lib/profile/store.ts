import fs from 'fs/promises';
import path from 'path';
import type { ProfileStoreData } from './types';

function storePath() {
  if (process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME) {
    return '/tmp/swt-user-profiles.json';
  }
  return path.join(process.cwd(), '.data', 'user-profiles.json');
}

export async function readProfileStore(): Promise<ProfileStoreData> {
  try {
    const raw = await fs.readFile(storePath(), 'utf8');
    const parsed = JSON.parse(raw) as ProfileStoreData;
    return { profiles: parsed.profiles ?? {} };
  } catch {
    return { profiles: {} };
  }
}

export async function writeProfileStore(data: ProfileStoreData): Promise<void> {
  const file = storePath();
  await fs.mkdir(path.dirname(file), { recursive: true });
  await fs.writeFile(file, JSON.stringify(data, null, 2), 'utf8');
}
