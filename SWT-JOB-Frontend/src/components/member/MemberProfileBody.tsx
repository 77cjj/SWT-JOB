'use client';

import {
  Avatar,
  Box,
  Chip,
  Divider,
  Stack,
  Typography,
} from '@mui/material';
import VerifiedIcon from '@mui/icons-material/Verified';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import type { PublicMemberView } from '../../lib/member/types';

function badgeLabel(badge?: PublicMemberView['badge']) {
  if (badge === 'verified') return '已验证';
  if (badge === 'contributor') return '贡献者';
  if (badge === 'alumni') return '往届';
  return null;
}

export function MemberProfileBody({ member }: { member: PublicMemberView }) {
  const badge = badgeLabel(member.badge);
  const initial = member.displayName.slice(0, 1).toUpperCase();

  return (
    <Stack spacing={2}>
      <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
        <Avatar
          src={member.avatarUrl}
          sx={{ width: 64, height: 64, bgcolor: member.avatarColor, fontWeight: 700, fontSize: '1.5rem' }}
        >
          {initial}
        </Avatar>
        <Box>
          <Typography variant="h6" fontWeight={700}>
            {member.displayName}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {member.programYear ? `SWT ${member.programYear}` : 'SWT 参与者'}
            {member.workState ? ` · ${member.workState}` : ''}
            {member.jobTitle ? ` · ${member.jobTitle}` : ''}
          </Typography>
          {badge ? (
            <Chip size="small" icon={<VerifiedIcon />} label={badge} color="primary" variant="outlined" sx={{ mt: 0.75 }} />
          ) : null}
        </Box>
      </Box>

      {member.bio ? <Typography variant="body2">{member.bio}</Typography> : null}

      <Divider />

      <Box>
        <Typography variant="subtitle2" fontWeight={700} gutterBottom>
          联系方式
        </Typography>
        {member.contactHidden ? (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <LockOutlinedIcon fontSize="small" color="action" />
            <Typography variant="body2" color="text.secondary">
              该用户选择「经同意才披露」；手机号、邮箱等不会公开展示。
            </Typography>
          </Box>
        ) : (
          <Stack spacing={0.75}>
            {member.phone ? <Typography variant="body2" color="text.secondary">手机：{member.phone}</Typography> : null}
            {member.email ? <Typography variant="body2" color="text.secondary">邮箱：{member.email}</Typography> : null}
            {member.wechat ? <Typography variant="body2" color="text.secondary">微信：{member.wechat}</Typography> : null}
            {!member.phone && !member.email && !member.wechat ? (
              <Typography variant="body2" color="text.secondary">暂未填写公开联系方式。</Typography>
            ) : null}
          </Stack>
        )}
      </Box>

      <Divider />

      <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
        <Typography variant="caption" color="text.secondary">贡献 {member.contributionCount} 条</Typography>
        <Typography variant="caption" color="text.secondary">加入于 {member.joinedAt}</Typography>
        <Typography variant="caption" color="text.secondary">
          隐私：{member.profileVisibility === 'public' ? '公开联系方式' : '经同意才披露'}
        </Typography>
      </Box>
    </Stack>
  );
}
