'use client';

import { useMemo, useState } from 'react';
import {
  Avatar,
  Box,
  Button,
  Chip,
  Divider,
  Paper,
  Stack,
  Typography,
} from '@mui/material';
import ThumbUpOutlinedIcon from '@mui/icons-material/ThumbUpOutlined';
import { getCommentsForDoc } from '../../lib/docs/comments/demoComments';
import { getDemoMember } from '../../lib/member/demoUsers';
import { MemberTrustCardDialog } from '../member/MemberTrustCard';

export function DocCommentsSection({ docSlug }: { docSlug: string }) {
  const comments = useMemo(() => getCommentsForDoc(docSlug), [docSlug]);
  const [profileId, setProfileId] = useState<string | null>(null);

  if (!docSlug) return null;

  return (
    <Box sx={{ mt: 6 }}>
      <Divider sx={{ mb: 3 }} />
      <Typography variant="h6" fontWeight={700} gutterBottom>
        经验补充
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        来自往届/在途 SWT 同学的脱敏反馈（示例数据，点击头像查看档案）。
      </Typography>

      {comments.length === 0 ? (
        <Paper variant="outlined" sx={{ p: 2 }}>
          <Typography variant="body2" color="text.secondary">
            暂无评论。成为第一个补充经验的人（功能即将开放）。
          </Typography>
        </Paper>
      ) : (
        <Stack spacing={2}>
          {comments.map((comment) => {
            const member = getDemoMember(comment.userId);
            if (!member) return null;
            return (
              <Paper key={comment.id} variant="outlined" sx={{ p: 2 }}>
                <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'flex-start' }}>
                  <Avatar
                    sx={{
                      width: 40,
                      height: 40,
                      bgcolor: member.avatarColor,
                      cursor: 'pointer',
                      fontSize: '1rem',
                    }}
                    onClick={() => setProfileId(member.id)}
                  >
                    {member.displayName.slice(0, 1)}
                  </Avatar>
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Box
                      sx={{
                        display: 'flex',
                        flexWrap: 'wrap',
                        alignItems: 'center',
                        gap: 1,
                        mb: 0.5,
                      }}
                    >
                      <Typography
                        variant="subtitle2"
                        fontWeight={700}
                        sx={{ cursor: 'pointer' }}
                        onClick={() => setProfileId(member.id)}
                      >
                        {member.displayName}
                      </Typography>
                      <Chip size="small" label={`${comment.programYear} · ${comment.workState}`} variant="outlined" />
                      <Typography variant="caption" color="text.secondary">
                        {comment.createdAt}
                      </Typography>
                    </Box>
                    <Typography variant="body2" sx={{ lineHeight: 1.7 }}>
                      {comment.body}
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 1 }}>
                      <ThumbUpOutlinedIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                      <Typography variant="caption" color="text.secondary">
                        {comment.helpfulCount} 人觉得有帮助
                      </Typography>
                    </Box>
                  </Box>
                </Box>
              </Paper>
            );
          })}
        </Stack>
      )}

      <Button size="small" sx={{ mt: 2 }} disabled variant="outlined">
        写一条经验补充（即将开放）
      </Button>

      <MemberTrustCardDialog
        memberId={profileId}
        open={Boolean(profileId)}
        onClose={() => setProfileId(null)}
      />
    </Box>
  );
}
