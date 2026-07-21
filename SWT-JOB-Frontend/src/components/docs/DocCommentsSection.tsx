'use client';

import Link from 'next/link';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Avatar,
  Box,
  Button,
  ButtonGroup,
  Chip,
  Divider,
  Paper,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import ThumbUpOutlinedIcon from '@mui/icons-material/ThumbUpOutlined';
import ThumbUpIcon from '@mui/icons-material/ThumbUp';
import { getCommentsForDoc } from '../../lib/docs/comments/demoComments';
import { getDemoMember } from '../../lib/member/demoUsers';
import {
  appendLocalComment,
  mergeComments,
  readLikedCommentIds,
  sortComments,
  toggleCommentLike,
  type CommentSort,
} from '../../lib/docs/comments/commentInteractions';
import { useAuthStore } from '@/stores/authStore';

export function DocCommentsSection({ docSlug }: { docSlug: string }) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const openLoginDialog = useAuthStore((s) => s.openLoginDialog);

  const [sort, setSort] = useState<CommentSort>('latest');
  const [liked, setLiked] = useState<Set<string>>(() => new Set());
  const [localVersion, setLocalVersion] = useState(0);
  const [draft, setDraft] = useState('');
  const [composeOpen, setComposeOpen] = useState(false);

  useEffect(() => {
    setLiked(readLikedCommentIds());
  }, [localVersion]);

  const comments = useMemo(() => {
    const base = getCommentsForDoc(docSlug);
    const merged = mergeComments(base, docSlug);
    void localVersion;
    return sortComments(merged, sort, liked);
  }, [docSlug, sort, liked, localVersion]);

  const handleLike = useCallback(
    (commentId: string) => {
      if (!isAuthenticated) {
        openLoginDialog('登录后即可为经验补充点赞');
        return;
      }
      setLiked(toggleCommentLike(commentId));
      setLocalVersion((v) => v + 1);
    },
    [isAuthenticated, openLoginDialog],
  );

  const submitComment = () => {
    const body = draft.trim();
    if (!body) return;
    if (!isAuthenticated) {
      openLoginDialog('登录后即可发表经验补充');
      return;
    }
    const user = useAuthStore.getState().user;
    const userId = user?.userId?.startsWith('u-') ? user.userId : 'u-maya-2025';
    appendLocalComment({
      id: `local-${Date.now()}`,
      docSlug,
      userId,
      body,
      programYear: '2025',
      workState: '—',
      helpfulCount: 0,
      createdAt: new Date().toISOString().slice(0, 10),
      local: true,
    });
    setDraft('');
    setComposeOpen(false);
    setLocalVersion((v) => v + 1);
  };

  if (!docSlug) return null;

  return (
    <Box sx={{ mt: 6 }}>
      <Divider sx={{ mb: 3 }} />
      <Box
        sx={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 2,
          mb: 2,
        }}
      >
        <Box>
          <Typography variant="h6" fontWeight={700}>
            经验补充
          </Typography>
          <Typography variant="body2" color="text.secondary">
            来自 SWT 同学的脱敏反馈；点头像进入个人主页联系或查看更多贡献。
          </Typography>
        </Box>
        <ButtonGroup size="small" variant="outlined">
          <Button variant={sort === 'latest' ? 'contained' : 'outlined'} onClick={() => setSort('latest')}>
            最新
          </Button>
          <Button variant={sort === 'hot' ? 'contained' : 'outlined'} onClick={() => setSort('hot')}>
            最热
          </Button>
        </ButtonGroup>
      </Box>

      {comments.length === 0 ? (
        <Paper variant="outlined" sx={{ p: 2 }}>
          <Typography variant="body2" color="text.secondary">
            暂无评论，欢迎成为第一个补充经验的人。
          </Typography>
        </Paper>
      ) : (
        <Stack spacing={2}>
          {comments.map((comment) => {
            const member = getDemoMember(comment.userId);
            const displayName = member?.displayName ?? comment.userId;
            const avatarColor = member?.avatarColor ?? '#64748b';
            const likedByMe = liked.has(comment.id);
            const helpfulDisplay = comment.helpfulCount + (likedByMe ? 1 : 0);

            return (
              <Paper key={comment.id} variant="outlined" sx={{ p: 2 }}>
                <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'flex-start' }}>
                  <Avatar
                    component={Link}
                    href={member ? `/u/${member.id}` : '#'}
                    sx={{
                      width: 40,
                      height: 40,
                      bgcolor: avatarColor,
                      cursor: member ? 'pointer' : 'default',
                      fontSize: '1rem',
                      textDecoration: 'none',
                    }}
                  >
                    {displayName.slice(0, 1)}
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
                        component={member ? Link : 'span'}
                        href={member ? `/u/${member.id}` : undefined}
                        variant="subtitle2"
                        fontWeight={700}
                        sx={{
                          textDecoration: 'none',
                          color: 'text.primary',
                          '&:hover': member ? { textDecoration: 'underline' } : undefined,
                        }}
                      >
                        {displayName}
                      </Typography>
                      <Chip size="small" label={`${comment.programYear} · ${comment.workState}`} variant="outlined" />
                      <Typography variant="caption" color="text.secondary">
                        {comment.createdAt}
                      </Typography>
                    </Box>
                    <Typography variant="body2" sx={{ lineHeight: 1.7 }}>
                      {comment.body}
                    </Typography>
                    <Button
                      size="small"
                      startIcon={likedByMe ? <ThumbUpIcon /> : <ThumbUpOutlinedIcon />}
                      onClick={() => handleLike(comment.id)}
                      sx={{ mt: 0.75, minWidth: 0, color: likedByMe ? 'primary.main' : 'text.secondary' }}
                    >
                      {helpfulDisplay} 人觉得有帮助
                    </Button>
                  </Box>
                </Box>
              </Paper>
            );
          })}
        </Stack>
      )}

      {composeOpen ? (
        <Box sx={{ mt: 2 }}>
          <TextField
            fullWidth
            multiline
            minRows={3}
            placeholder="分享你的真实经历（请勿泄露雇主全名与个人隐私）"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
          />
          <Stack direction="row" spacing={1} sx={{ mt: 1 }}>
            <Button variant="contained" size="small" onClick={submitComment}>
              发布
            </Button>
            <Button size="small" onClick={() => setComposeOpen(false)}>
              取消
            </Button>
          </Stack>
        </Box>
      ) : (
        <Button size="small" sx={{ mt: 2 }} variant="outlined" onClick={() => setComposeOpen(true)}>
          写一条经验补充
        </Button>
      )}
    </Box>
  );
}
