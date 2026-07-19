'use client';

import Link from 'next/link';
import { Avatar, Box, Typography } from '@mui/material';
import { getPublicMember } from '../../lib/member/resolveMember';
import { useAuthStore } from '@/stores/authStore';

export function MemberAvatarLink({
  userId,
  size = 36,
  showName = true,
  nameVariant = 'subtitle2' as 'subtitle2' | 'body2',
  displayName,
  avatarUrl,
  avatarColor,
}: {
  userId: string;
  size?: number;
  showName?: boolean;
  nameVariant?: 'subtitle2' | 'body2';
  displayName?: string;
  avatarUrl?: string;
  avatarColor?: string;
}) {
  const viewerId = useAuthStore((s) => s.user?.userId);
  const member = displayName
    ? {
        displayName,
        avatarUrl,
        avatarColor: avatarColor ?? '#6366f1',
      }
    : getPublicMember(userId, viewerId);

  if (!member) {
    return (
      <Typography variant={nameVariant} fontWeight={600} color="text.secondary">
        匿名用户
      </Typography>
    );
  }

  const initial = member.displayName.slice(0, 1).toUpperCase();

  return (
    <Box
      component={Link}
      href={`/u/${userId}`}
      onClick={(e) => e.stopPropagation()}
      sx={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 1,
        textDecoration: 'none',
        color: 'inherit',
        borderRadius: 1,
        px: 0.5,
        mx: -0.5,
        '&:hover': { bgcolor: 'action.hover' },
      }}
    >
      <Avatar
        src={member.avatarUrl}
        sx={{
          width: size,
          height: size,
          bgcolor: member.avatarColor,
          fontSize: size * 0.42,
          fontWeight: 700,
        }}
      >
        {initial}
      </Avatar>
      {showName ? (
        <Typography variant={nameVariant} fontWeight={700} color="text.primary">
          {member.displayName}
        </Typography>
      ) : null}
    </Box>
  );
}
