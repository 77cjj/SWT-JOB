'use client';

import Link from 'next/link';
import { Avatar, Box, Typography } from '@mui/material';
import { getDemoMember } from '../../lib/member/demoUsers';

type UserProfileLinkProps = {
  userId: string;
  displayName?: string;
  size?: number;
  showName?: boolean;
  nameVariant?: 'caption' | 'body2' | 'subtitle2';
};

export function UserProfileLink({
  userId,
  displayName,
  size = 32,
  showName = true,
  nameVariant = 'caption',
}: UserProfileLinkProps) {
  const member = getDemoMember(userId);
  const name = member?.displayName || displayName || userId.slice(0, 8);
  const href = `/u/${userId}`;

  return (
    <Box
      component={Link}
      href={href}
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
          bgcolor: member?.avatarColor || 'primary.main',
          fontSize: size * 0.42,
          fontWeight: 700,
        }}
      >
        {name.slice(0, 1).toUpperCase()}
      </Avatar>
      {showName ? (
        <Typography className="user-profile-link-name" variant={nameVariant} fontWeight={600} noWrap>
          {name}
        </Typography>
      ) : null}
    </Box>
  );
}
