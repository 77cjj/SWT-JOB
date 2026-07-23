import type { NextApiRequest, NextApiResponse } from 'next';

import { getMarketUserFromRequest } from '../../../lib/marketplace/auth';
import { readProfileStore, writeProfileStore } from '../../../lib/profile/store';
import {
  defaultProfile,
  normalizeExperiences,
  seedFromMarketUser,
  syncLegacyFields,
  toPublicView,
  type SwtExperience,
} from '../../../lib/profile/types';

function parseExperiences(body: Record<string, unknown>, prev: ReturnType<typeof defaultProfile>): SwtExperience[] {
  if (Array.isArray(body.swtExperiences)) {
    return normalizeExperiences({ swtExperiences: body.swtExperiences as SwtExperience[] });
  }
  // 兼容只改旧字段
  return normalizeExperiences({
    programYear: String(body.programYear ?? prev.programYear),
    workState: String(body.workState ?? prev.workState),
    jobTitle: String(body.jobTitle ?? prev.jobTitle),
    swtExperiences: prev.swtExperiences,
  });
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const userId = typeof req.query.userId === 'string' ? req.query.userId : '';
  if (!userId) return res.status(400).json({ ok: false, message: 'Missing userId' });

  const viewer = await getMarketUserFromRequest(req);
  const isOwnerViewer = Boolean(viewer && (viewer.userId === userId || viewer.role === 'admin'));

  if (req.method === 'GET') {
    const store = await readProfileStore();
    const profile = defaultProfile(userId, store.profiles[userId]);
    return res.status(200).json({
      ok: true,
      profile: toPublicView(profile, isOwnerViewer),
      isOwner: Boolean(viewer?.userId === userId),
    });
  }

  if (req.method === 'PUT' || req.method === 'PATCH') {
    if (!viewer || viewer.userId !== userId) {
      return res.status(401).json({ ok: false, message: '只能编辑自己的主页' });
    }
    const body = (req.body || {}) as Record<string, unknown>;
    const store = await readProfileStore();
    const prev = defaultProfile(userId, store.profiles[userId] ?? seedFromMarketUser(viewer));
    const experiences = parseExperiences(body, prev);
    const legacy = syncLegacyFields(experiences);
    const next = {
      ...prev,
      displayName: String(body.displayName ?? prev.displayName).slice(0, 64),
      bio: String(body.bio ?? prev.bio).slice(0, 500),
      ...legacy,
      swtExperiences: experiences,
      wechat: String(body.wechat ?? prev.wechat).slice(0, 64),
      email: String(body.email ?? prev.email).slice(0, 128),
      showWechat: Boolean(body.showWechat ?? prev.showWechat),
      showEmail: Boolean(body.showEmail ?? prev.showEmail),
      showJobInfo: body.showJobInfo === undefined ? prev.showJobInfo : Boolean(body.showJobInfo),
      showBio: body.showBio === undefined ? prev.showBio : Boolean(body.showBio),
      updatedAt: new Date().toISOString(),
    };
    store.profiles[userId] = next;
    await writeProfileStore(store);
    return res.status(200).json({ ok: true, profile: next, isOwner: true });
  }

  res.setHeader('Allow', 'GET, PUT, PATCH');
  return res.status(405).json({ ok: false, message: 'Method not allowed' });
}
