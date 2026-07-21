'use client';

import Link from 'next/link';
import { Avatar, Box, Typography } from '@mui/material';
import { getDemoMember } from '../../lib/member/demoUsers';

type UserProfileLinkProps = {
  userId: string;
  size?: number;
  showName?: boolean;
  nameVariant?: 'caption' | 'body2' | 'subtitle2';
};

export function UserProfileLink({
  userId,
  size = 32,
  showName = false,
  nameVariant = 'caption',
}: UserProfileLinkProps) {
  const member = getDemoMember(userId);
  if (!member) return null;

  return (
    <Box
      component={Link}
      href={`/u/${member.id}`}
      sx={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 0.75,
        textDecoration: 'none',
        color: 'inherit',
        borderRadius: 1,
        '&:hover .user-profile-link-name': { textDecoration: 'underline' },
      }}
    >
      <Avatar
        sx={{
          width: size,
          height: size,
          bgcolor: member.avatarColor,
          fontSize: size * 0.42,
          fontWeight: 700,
        }}
      >
        {member.displayName.slice(0, 1)}
      </Avatar>
      {showName ? (
        <Typography className="user-profile-link-name" variant={nameVariant} fontWeight={600}>
          {member.displayName}
        </Typography>
      ) : null}
    </Box>
  );
}
