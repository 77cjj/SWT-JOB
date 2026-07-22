import type { NextApiRequest, NextApiResponse } from 'next';

import { getMarketUserFromRequest } from '../../../lib/marketplace/auth';
import { readProfileStore, writeProfileStore } from '../../../lib/profile/store';
import { defaultProfile, seedFromMarketUser, toPublicView } from '../../../lib/profile/types';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const userId = typeof req.query.userId === 'string' ? req.query.userId : '';
  if (!userId) return res.status(400).json({ ok: false, message: 'Missing userId' });

  const viewer = await getMarketUserFromRequest(req);
  const isOwner = Boolean(viewer && (viewer.userId === userId || viewer.role === 'admin'));

  if (req.method === 'GET') {
    const store = await readProfileStore();
    const profile = store.profiles[userId] ?? defaultProfile(userId);
    return res.status(200).json({
      ok: true,
      profile: toPublicView(profile, isOwner),
      isOwner: Boolean(viewer?.userId === userId),
    });
  }

  if (req.method === 'PUT' || req.method === 'PATCH') {
    if (!viewer || viewer.userId !== userId) {
      return res.status(401).json({ ok: false, message: '只能编辑自己的主页' });
    }
    const body = (req.body || {}) as Record<string, unknown>;
    const store = await readProfileStore();
    const prev = store.profiles[userId] ?? defaultProfile(userId, seedFromMarketUser(viewer));
    const next = {
      ...prev,
      displayName: String(body.displayName ?? prev.displayName).slice(0, 64),
      bio: String(body.bio ?? prev.bio).slice(0, 500),
      programYear: String(body.programYear ?? prev.programYear).slice(0, 16),
      workState: String(body.workState ?? prev.workState).slice(0, 8).toUpperCase(),
      jobTitle: String(body.jobTitle ?? prev.jobTitle).slice(0, 128),
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
