'use client';

import { useState } from 'react';
import { Avatar, Box, Chip, Stack, Typography } from '@mui/material';
import ThumbUpOutlinedIcon from '@mui/icons-material/ThumbUpOutlined';
import { getCommentsForJob } from '../../lib/jobs/jobComments';
import { getDemoMember } from '../../lib/member/demoUsers';
import { MemberTrustCardDialog } from '../member/MemberTrustCard';

export function JobCardComments({ jobId }: { jobId: string }) {
  const comments = getCommentsForJob(jobId);
  const [profileId, setProfileId] = useState<string | null>(null);

  if (comments.length === 0) return null;

  return (
    <Box sx={{ mt: 1.5, pt: 1.5, borderTop: '1px dashed', borderColor: 'divider' }}>
      <Typography variant="caption" fontWeight={700} color="text.secondary" sx={{ display: 'block', mb: 1 }}>
        往届经验
      </Typography>
      <Stack spacing={1.25}>
        {comments.map((comment) => {
          const member = getDemoMember(comment.userId);
          if (!member) return null;
          return (
            <Box key={comment.id} sx={{ display: 'flex', gap: 1, alignItems: 'flex-start' }}>
              <Avatar
                sx={{
                  width: 28,
                  height: 28,
                  bgcolor: member.avatarColor,
                  fontSize: '0.75rem',
                  cursor: 'pointer',
                }}
                onClick={() => setProfileId(member.id)}
              >
                {member.displayName.slice(0, 1)}
              </Avatar>
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 0.5, mb: 0.25 }}>
                  <Typography
                    variant="caption"
                    fontWeight={700}
                    sx={{ cursor: 'pointer' }}
                    onClick={() => setProfileId(member.id)}
                  >
                    {member.displayName}
                  </Typography>
                  <Chip
                    size="small"
                    label={`${comment.programYear} · ${comment.workState}`}
                    variant="outlined"
                    sx={{ height: 20, fontSize: '0.65rem' }}
                  />
                </Box>
                <Typography variant="caption" color="text.secondary" sx={{ lineHeight: 1.55, display: 'block' }}>
                  {comment.body}
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.25, mt: 0.5 }}>
                  <ThumbUpOutlinedIcon sx={{ fontSize: 13, color: 'text.disabled' }} />
                  <Typography variant="caption" color="text.disabled">
                    {comment.helpfulCount}
                  </Typography>
                </Box>
              </Box>
            </Box>
          );
        })}
      </Stack>

      <MemberTrustCardDialog
        memberId={profileId}
        open={Boolean(profileId)}
        onClose={() => setProfileId(null)}
      />
    </Box>
  );
}
