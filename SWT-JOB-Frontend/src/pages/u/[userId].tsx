import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { Box, Container, Paper, Typography, CircularProgress, Alert } from '@mui/material';
import DesktopLayout from '../../layout/desktop/Layout';
import MobileLayout from '../../layout/mobile/Layout';
import useDevice from '../../hooks/useDevice';
import { MemberProfileBody } from '../../components/member/MemberProfileBody';
import { DEMO_DOC_COMMENTS } from '../../lib/docs/comments/demoComments';
import { getExperiencesForUser } from '../../lib/deals/dealExperienceStore';
import { useAuthStore } from '@/stores/authStore';
import { fetchUserProfile, type UserProfileApi } from '@/services/profileService';
import type { PublicMemberView } from '../../lib/member/types';
import type { DealExperience } from '../../data/dealExperiences';
import { getDemoMember } from '../../lib/member/demoUsers';

function apiToPublicView(profile: UserProfileApi): PublicMemberView {
  return {
    userId: profile.userId,
    displayName: profile.displayName,
    avatarUrl: profile.avatarUrl,
    avatarColor: profile.avatarColor,
    bio: profile.bio,
    programYear: profile.programYear,
    workState: profile.workState,
    jobTitle: profile.jobTitle,
    phone: profile.phone,
    email: profile.email,
    wechat: profile.wechat,
    profileVisibility: profile.profileVisibility,
    badge: profile.badge as PublicMemberView['badge'],
    joinedAt: profile.joinedAt ?? '',
    contributionCount: profile.contributionCount,
    contactHidden: profile.contactHidden,
  };
}

export default function UserProfilePage() {
  const router = useRouter();
  const isMobile = useDevice();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const viewerId = useAuthStore((s) => s.user?.userId);
  const userId = typeof router.query.userId === 'string' ? router.query.userId : '';
  const [member, setMember] = useState<PublicMemberView | null>(null);
  const [dealComments, setDealComments] = useState<DealExperience[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!userId) return;
    let cancelled = false;
    setLoading(true);
    setError('');

    void (async () => {
      try {
        const profile = await fetchUserProfile(userId, isAuthenticated);
        if (cancelled) return;
        setMember(apiToPublicView(profile));
        const deals = await getExperiencesForUser(userId);
        if (!cancelled) setDealComments(deals);
      } catch {
        const demo = getDemoMember(userId);
        if (demo && !cancelled) {
          setMember({
            userId: demo.id,
            displayName: demo.displayName,
            avatarColor: demo.avatarColor,
            avatarUrl: demo.avatarUrl,
            bio: demo.bio,
            programYear: demo.programYear,
            workState: demo.workState,
            jobTitle: demo.jobTitle,
            profileVisibility: demo.profileVisibility ?? 'consent',
            phone: demo.phone,
            email: demo.email,
            wechat: demo.wechat,
            badge: demo.badge,
            joinedAt: demo.joinedAt,
            contributionCount: demo.contributionCount,
            contactHidden: demo.profileVisibility !== 'public',
          });
        } else if (!cancelled) {
          setError('未找到该用户');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [userId, isAuthenticated, viewerId]);

  const userComments = member ? DEMO_DOC_COMMENTS.filter((c) => c.userId === member.userId) : [];

  const content = (
    <Container maxWidth="sm" sx={{ py: 4 }}>
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
          <CircularProgress />
        </Box>
      ) : error ? (
        <Typography color="text.secondary">{error}</Typography>
      ) : !member ? (
        <Typography color="text.secondary">未找到该用户。</Typography>
      ) : (
        <Paper variant="outlined" sx={{ p: 3 }}>
          <MemberProfileBody member={member} />

          {dealComments.length > 0 ? (
            <Box sx={{ mt: 3 }}>
              <Typography variant="subtitle2" fontWeight={700} gutterBottom>
                薅羊毛亲测分享
              </Typography>
              {dealComments.map((c) => (
                <Box key={c.id} sx={{ mb: 2, p: 1.5, borderRadius: 1, bgcolor: 'action.hover' }}>
                  <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 0.5 }}>
                    {c.reportedAt} · {c.programId}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {c.body.zh}
                  </Typography>
                </Box>
              ))}
            </Box>
          ) : null}

          {userComments.length > 0 ? (
            <Box sx={{ mt: 3 }}>
              <Typography variant="subtitle2" fontWeight={700} gutterBottom>
                文档评论贡献
              </Typography>
              {userComments.map((c) => (
                <Typography key={c.id} variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
                  · {c.body}
                </Typography>
              ))}
            </Box>
          ) : null}
        </Paper>
      )}
    </Container>
  );

  return isMobile ? (
    <MobileLayout>{content}</MobileLayout>
  ) : (
    <DesktopLayout maxWidthClassName="max-w-3xl">{content}</DesktopLayout>
  );
}
