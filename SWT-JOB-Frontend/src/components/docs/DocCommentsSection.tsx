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
  IconButton,
  InputAdornment,
  Paper,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import ThumbUpOutlinedIcon from '@mui/icons-material/ThumbUpOutlined';
import ThumbUpIcon from '@mui/icons-material/ThumbUp';
import ThumbDownOutlinedIcon from '@mui/icons-material/ThumbDownOutlined';
import ThumbDownIcon from '@mui/icons-material/ThumbDown';
import SendIcon from '@mui/icons-material/Send';
import { formatCommentProgramLabel, getCommentsForDoc } from '../../lib/docs/comments/demoComments';
import { getDemoMember } from '../../lib/member/demoUsers';
import {
  canSubmitCommentNow,
  createIdempotencyKey,
  markCommentSubmitted,
} from '../../lib/docs/comments/commentApiContract';
import {
  appendLocalComment,
  mergeComments,
  readUserVotes,
  sortComments,
  toggleCommentDislike,
  toggleCommentLike,
  displayDislikeCount,
  displayLikeCount,
  type CommentSort,
} from '../../lib/docs/comments/commentInteractions';
import { useAuthStore } from '@/stores/authStore';

export function DocCommentsSection({ docSlug }: { docSlug: string }) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const openLoginDialog = useAuthStore((s) => s.openLoginDialog);

  const [sort, setSort] = useState<CommentSort>('latest');
  const [votes, setVotes] = useState(() => readUserVotes());
  const [localVersion, setLocalVersion] = useState(0);
  const [draft, setDraft] = useState('');

  useEffect(() => {
    setVotes(readUserVotes());
  }, [localVersion]);

  const comments = useMemo(() => {
    const base = getCommentsForDoc(docSlug);
    const merged = mergeComments(base, docSlug);
    void localVersion;
    return sortComments(merged, sort, votes.likes, votes.dislikes);
  }, [docSlug, sort, votes.likes, votes.dislikes, localVersion]);

  const inputPlaceholder = comments.length === 0 ? '暂无评论' : '写下你的评论…';

  const handleLike = useCallback(
    (commentId: string) => {
      if (!isAuthenticated) {
        openLoginDialog('登录后即可点赞');
        return;
      }
      setVotes(toggleCommentLike(commentId));
      setLocalVersion((v) => v + 1);
    },
    [isAuthenticated, openLoginDialog],
  );

  const handleDislike = useCallback(
    (commentId: string) => {
      if (!isAuthenticated) {
        openLoginDialog('登录后即可点踩');
        return;
      }
      setVotes(toggleCommentDislike(commentId));
      setLocalVersion((v) => v + 1);
    },
    [isAuthenticated, openLoginDialog],
  );

  const submitComment = () => {
    const body = draft.trim();
    if (!body) return;
    if (!isAuthenticated) {
      openLoginDialog('登录后即可发表评论');
      return;
    }
    if (!canSubmitCommentNow()) return;
    const user = useAuthStore.getState().user;
    const userId = user?.userId?.startsWith('u-') ? user.userId : 'u-maya-2025';
    void createIdempotencyKey('comment');
    appendLocalComment({
      id: `local-${Date.now()}`,
      docSlug,
      userId,
      body,
      programYear: '2025',
      workState: '—',
      helpfulCount: 0,
      dislikeCount: 0,
      createdAt: new Date().toISOString().slice(0, 10),
      local: true,
    });
    markCommentSubmitted();
    setDraft('');
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
        <Typography variant="h6" fontWeight={700}>
          评论区
        </Typography>
        <ButtonGroup size="small" variant="outlined">
          <Button variant={sort === 'latest' ? 'contained' : 'outlined'} onClick={() => setSort('latest')}>
            最新
          </Button>
          <Button variant={sort === 'hot' ? 'contained' : 'outlined'} onClick={() => setSort('hot')}>
            最热
          </Button>
        </ButtonGroup>
      </Box>

      <Paper variant="outlined" sx={{ p: 1.5, mb: 3 }}>
        <TextField
          fullWidth
          multiline
          minRows={2}
          maxRows={6}
          placeholder={inputPlaceholder}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
              e.preventDefault();
              submitComment();
            }
          }}
          slotProps={{
            input: {
              endAdornment: (
                <InputAdornment position="end" sx={{ alignSelf: 'flex-end', pb: 0.5 }}>
                  <IconButton
                    color="primary"
                    aria-label="发送评论"
                    onClick={submitComment}
                    disabled={!draft.trim()}
                  >
                    <SendIcon />
                  </IconButton>
                </InputAdornment>
              ),
            },
          }}
          sx={{ '& .MuiInputBase-root': { alignItems: 'flex-end' } }}
        />
      </Paper>

      {comments.length === 0 ? (
        <Typography variant="body2" color="text.secondary" sx={{ py: 2, textAlign: 'center' }}>
          暂无评论
        </Typography>
      ) : (
        <Stack spacing={2}>
          {comments.map((comment) => {
            const member = getDemoMember(comment.userId);
            const displayName = member?.displayName ?? comment.userId;
            const avatarColor = member?.avatarColor ?? '#64748b';
            const likedByMe = votes.likes.has(comment.id);
            const dislikedByMe = votes.dislikes.has(comment.id);
            const likeCount = displayLikeCount(comment, votes.likes);
            const dislikeCount = displayDislikeCount(comment, votes.dislikes);

            return (
              <Paper key={comment.id} variant="outlined" sx={{ p: 2 }}>
                <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'flex-start' }}>
                  <Avatar
                    component={member ? Link : 'span'}
                    href={member ? `/u/${member.id}` : undefined}
                    sx={{
                      width: 44,
                      height: 44,
                      bgcolor: avatarColor,
                      cursor: member ? 'pointer' : 'default',
                      fontSize: '1rem',
                      textDecoration: 'none',
                    }}
                  >
                    {displayName.slice(0, 1)}
                  </Avatar>
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 1, mb: 0.75 }}>
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
                      <Chip
                        size="small"
                        label={formatCommentProgramLabel(comment)}
                        variant="outlined"
                        sx={{ height: 22, fontSize: '0.7rem' }}
                      />
                      <Typography variant="caption" color="text.secondary">
                        {comment.createdAt}
                      </Typography>
                    </Box>
                    <Typography variant="body2" sx={{ lineHeight: 1.7, mb: 1 }}>
                      {comment.body}
                    </Typography>
                    <Stack direction="row" spacing={0.5} alignItems="center">
                      <Button
                        size="small"
                        startIcon={likedByMe ? <ThumbUpIcon fontSize="small" /> : <ThumbUpOutlinedIcon fontSize="small" />}
                        onClick={() => handleLike(comment.id)}
                        sx={{ minWidth: 0, color: likedByMe ? 'primary.main' : 'text.secondary' }}
                      >
                        {likeCount}
                      </Button>
                      <Button
                        size="small"
                        startIcon={
                          dislikedByMe ? <ThumbDownIcon fontSize="small" /> : <ThumbDownOutlinedIcon fontSize="small" />
                        }
                        onClick={() => handleDislike(comment.id)}
                        sx={{ minWidth: 0, color: dislikedByMe ? 'error.main' : 'text.secondary' }}
                      >
                        {dislikeCount}
                      </Button>
                    </Stack>
                  </Box>
                </Box>
              </Paper>
            );
          })}
        </Stack>
      )}
    </Box>
  );
}
