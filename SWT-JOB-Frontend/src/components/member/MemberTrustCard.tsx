'use client';

import Link from 'next/link';
import {
  Avatar,
  Box,
  Chip,
  Dialog,
  DialogContent,
  DialogTitle,
  Divider,
  Stack,
  Typography,
} from '@mui/material';
import VerifiedIcon from '@mui/icons-material/Verified';
import { getDemoMember, type DemoMember } from '../../lib/member/demoUsers';

function badgeLabel(badge?: DemoMember['badge']) {
  if (badge === 'verified') return '已验证';
  if (badge === 'contributor') return '贡献者';
  if (badge === 'alumni') return '往届';
  return null;
}

export function MemberTrustCardBody({ member }: { member: DemoMember }) {
  const badge = badgeLabel(member.badge);
  return (
    <Stack spacing={2}>
      <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
        <Avatar sx={{ width: 56, height: 56, bgcolor: member.avatarColor, fontWeight: 700 }}>
          {member.displayName.slice(0, 1)}
        </Avatar>
        <Box>
          <Typography variant="h6" fontWeight={700}>
            {member.displayName}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            SWT {member.programYear} · {member.workState}
            {member.jobTitle ? ` · ${member.jobTitle}` : ''}
          </Typography>
          {badge ? (
            <Chip
              size="small"
              icon={<VerifiedIcon />}
              label={badge}
              color="primary"
              variant="outlined"
              sx={{ mt: 0.75 }}
            />
          ) : null}
        </Box>
      </Box>
      <Typography variant="body2">{member.bio}</Typography>
      <Divider />
      <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
        <Typography variant="caption" color="text.secondary">
          贡献 {member.contributionCount} 条
        </Typography>
        <Typography variant="caption" color="text.secondary">
          加入于 {member.joinedAt}
        </Typography>
      </Box>
      <ButtonLink memberId={member.id} />
    </Stack>
  );
}

function ButtonLink({ memberId }: { memberId: string }) {
  return (
    <Typography
      component={Link}
      href={`/u/${memberId}`}
      variant="body2"
      color="primary"
      sx={{ textDecoration: 'none', '&:hover': { textDecoration: 'underline' } }}
    >
      查看完整主页 →
    </Typography>
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
  const member = memberId ? getDemoMember(memberId) : null;
  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="xs">
      <DialogTitle>成员档案</DialogTitle>
      <DialogContent>{member ? <MemberTrustCardBody member={member} /> : null}</DialogContent>
    </Dialog>
  );
}
