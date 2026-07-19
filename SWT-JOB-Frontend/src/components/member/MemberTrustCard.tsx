'use client';

import { Dialog, DialogContent, DialogTitle } from '@mui/material';
import { getPublicMember } from '../../lib/member/resolveMember';
import { MemberProfileBody } from './MemberProfileBody';
import { useAuthStore } from '@/stores/authStore';
import type { DemoMember } from '../../lib/member/demoUsers';

export function MemberTrustCardBody({ member }: { member: DemoMember }) {
  return (
    <MemberProfileBody
      member={{
        userId: member.id,
        displayName: member.displayName,
        avatarColor: member.avatarColor,
        avatarUrl: member.avatarUrl,
        bio: member.bio,
        programYear: member.programYear,
        workState: member.workState,
        jobTitle: member.jobTitle,
        profileVisibility: member.profileVisibility ?? 'consent',
        phone: member.phone,
        email: member.email,
        wechat: member.wechat,
        badge: member.badge,
        joinedAt: member.joinedAt,
        contributionCount: member.contributionCount,
        contactHidden: member.profileVisibility !== 'public',
      }}
    />
  );
}

export function MemberTrustCardDialog({
  memberId,
  open,
  onClose,
}: {
  memberId: string | null;
  open: boolean;
  onClose: () => void;
}) {
  const viewerId = useAuthStore((s) => s.user?.userId);
  const member = memberId ? getPublicMember(memberId, viewerId) : null;
  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="xs">
      <DialogTitle>成员档案</DialogTitle>
      <DialogContent>{member ? <MemberProfileBody member={member} /> : null}</DialogContent>
    </Dialog>
  );
}
