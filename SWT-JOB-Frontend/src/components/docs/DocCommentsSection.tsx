'use client';

import Link from 'next/link';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Avatar,
  Box,
  Button,
  ButtonGroup,
  Chip,
  Collapse,
  Divider,
  IconButton,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import ThumbUpOutlinedIcon from '@mui/icons-material/ThumbUpOutlined';
import ThumbUpIcon from '@mui/icons-material/ThumbUp';
import ThumbDownOutlinedIcon from '@mui/icons-material/ThumbDownOutlined';
import ThumbDownIcon from '@mui/icons-material/ThumbDown';
import SendIcon from '@mui/icons-material/Send';
import ChatBubbleOutlineIcon from '@mui/icons-material/ChatBubbleOutline';
import type { CommentContextKind } from '../../lib/comments/commentContext';
import { getCommentsForContext } from '../../lib/comments/getCommentsForContext';
import { formatCommentProgramLabel } from '../../lib/docs/comments/demoComments';
import { getDemoMember } from '../../lib/member/demoUsers';
import {
  canSubmitCommentNow,
  createIdempotencyKey,
  markCommentSubmitted,
} from '../../lib/docs/comments/commentApiContract';
import {
  appendLocalComment,
  appendLocalReply,
  mergeComments,
  readUserVotes,
  toggleCommentDislike,
  toggleCommentLike,
  displayDislikeCount,
  displayLikeCount,
  type CommentSort,
} from '../../lib/docs/comments/commentInteractions';
import { buildCommentForest, type CommentNode } from '../../lib/docs/comments/commentTree';
import { useAuthStore } from '@/stores/authStore';

const INDENT_PX = 28;
const MAX_DEPTH = 6;

function CommentRow({
  node,
  depth,
  votes,
  onVoteChange,
  replyToId,
  setReplyToId,
  onSubmitReply,
}: {
  node: CommentNode;
  depth: number;
  votes: { likes: Set<string>; dislikes: Set<string> };
  onVoteChange: () => void;
  replyToId: string | null;
  setReplyToId: (id: string | null) => void;
  onSubmitReply: (parentId: string, body: string) => void;
}) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const openLoginDialog = useAuthStore((s) => s.openLoginDialog);
  const [replyDraft, setReplyDraft] = useState('');
  const [collapsed, setCollapsed] = useState(false);

  const member = getDemoMember(node.userId);
  const displayName = member?.displayName ?? node.userId;
  const avatarColor = member?.avatarColor ?? '#64748b';
  const likedByMe = votes.likes.has(node.id);
  const dislikedByMe = votes.dislikes.has(node.id);
  const likeCount = displayLikeCount(node, votes.likes);
  const dislikeCount = displayDislikeCount(node, votes.dislikes);
  const isReplying = replyToId === node.id;
  const childCount = node.children.length;

  const handleLike = () => {
    if (!isAuthenticated) {
      openLoginDialog('登录后即可点赞');
      return;
    }
    toggleCommentLike(node.id);
    onVoteChange();
  };

  const handleDislike = () => {
    if (!isAuthenticated) {
      openLoginDialog('登录后即可点踩');
      return;
    }
    toggleCommentDislike(node.id);
    onVoteChange();
  };

  const sendReply = () => {
    const body = replyDraft.trim();
    if (!body) return;
    onSubmitReply(node.id, body);
    setReplyDraft('');
    setReplyToId(null);
  };

  return (
    <Box
      sx={{
        ml: depth > 0 ? `${Math.min(depth, MAX_DEPTH) * INDENT_PX}px` : 0,
        borderLeft: depth > 0 ? '2px solid' : 'none',
        borderColor: depth > 0 ? 'divider' : 'transparent',
        pl: depth > 0 ? 1.5 : 0,
        py: 1.25,
      }}
    >
      <Box
        sx={{
          display: 'flex',
          gap: 1.25,
          alignItems: 'flex-start',
          borderRadius: 1,
          px: 1,
          mx: -1,
          transition: 'background-color 0.15s ease',
          '&:hover': { bgcolor: 'action.hover' },
        }}
      >
        <Avatar
          component={member ? Link : 'span'}
          href={member ? `/u/${member.id}` : undefined}
          sx={{
            width: depth > 0 ? 36 : 40,
            height: depth > 0 ? 36 : 40,
            bgcolor: avatarColor,
            cursor: member ? 'pointer' : 'default',
            fontSize: '0.9rem',
            textDecoration: 'none',
            mt: 0.25,
          }}
        >
          {displayName.slice(0, 1)}
        </Avatar>

        <Box sx={{ flex: 1, minWidth: 0, position: 'relative', pb: 3 }}>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 0.75, mb: 0.5 }}>
            <Typography
              component={member ? Link : 'span'}
              href={member ? `/u/${member.id}` : undefined}
              variant="subtitle2"
              fontWeight={600}
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
              label={formatCommentProgramLabel(node)}
              variant="outlined"
              sx={{
                height: 20,
                fontSize: '0.65rem',
                borderColor: 'divider',
                bgcolor: 'transparent',
              }}
            />
            <Typography variant="caption" color="text.secondary">
              {node.createdAt}
            </Typography>
          </Box>

          <Typography variant="body2" sx={{ lineHeight: 1.65, color: 'text.primary', pr: { xs: 0, sm: 10 } }}>
            {node.body}
          </Typography>

          <Stack
            direction="row"
            spacing={0.25}
            alignItems="center"
            sx={{
              position: 'absolute',
              right: 0,
              bottom: 0,
            }}
          >
            <IconButton size="small" onClick={handleLike} aria-label="点赞" sx={{ color: likedByMe ? 'primary.main' : 'text.secondary' }}>
              {likedByMe ? <ThumbUpIcon sx={{ fontSize: 18 }} /> : <ThumbUpOutlinedIcon sx={{ fontSize: 18 }} />}
            </IconButton>
            <Typography variant="caption" color="text.secondary" sx={{ minWidth: 14, textAlign: 'center' }}>
              {likeCount}
            </Typography>
            <IconButton
              size="small"
              onClick={handleDislike}
              aria-label="点踩"
              sx={{ color: dislikedByMe ? 'error.main' : 'text.secondary', ml: 0.5 }}
            >
              {dislikedByMe ? <ThumbDownIcon sx={{ fontSize: 18 }} /> : <ThumbDownOutlinedIcon sx={{ fontSize: 18 }} />}
            </IconButton>
            <Typography variant="caption" color="text.secondary" sx={{ minWidth: 14, textAlign: 'center' }}>
              {dislikeCount}
            </Typography>
            <Button
              size="small"
              startIcon={<ChatBubbleOutlineIcon sx={{ fontSize: 16 }} />}
              onClick={() => {
                if (!isAuthenticated) {
                  openLoginDialog('登录后即可回复');
                  return;
                }
                setReplyToId(isReplying ? null : node.id);
              }}
              sx={{ ml: 0.5, minWidth: 0, color: 'text.secondary', textTransform: 'none' }}
            >
              回复
            </Button>
            {childCount > 0 ? (
              <Button size="small" onClick={() => setCollapsed((v) => !v)} sx={{ minWidth: 0, color: 'text.secondary', textTransform: 'none' }}>
                {collapsed ? `展开 ${childCount} 条` : '收起'}
              </Button>
            ) : null}
          </Stack>
        </Box>
      </Box>

      <Collapse in={isReplying}>
        <Box sx={{ display: 'flex', gap: 1, mt: 1, ml: depth > 0 ? 5 : 6, mr: 1 }}>
          <TextField
            fullWidth
            size="small"
            multiline
            minRows={2}
            placeholder={`回复 ${displayName}…`}
            value={replyDraft}
            onChange={(e) => setReplyDraft(e.target.value)}
            variant="standard"
            slotProps={{ input: { disableUnderline: false } }}
          />
          <IconButton color="primary" onClick={sendReply} disabled={!replyDraft.trim()} aria-label="发送回复">
            <SendIcon />
          </IconButton>
        </Box>
      </Collapse>

      <Collapse in={!collapsed}>
        {node.children.map((child) => (
          <CommentRow
            key={child.id}
            node={child}
            depth={depth + 1}
            votes={votes}
            onVoteChange={onVoteChange}
            replyToId={replyToId}
            setReplyToId={setReplyToId}
            onSubmitReply={onSubmitReply}
          />
        ))}
      </Collapse>
    </Box>
  );
}

export type CommentsSectionProps = {
  contextKind: CommentContextKind;
  contextId: string;
};

export function CommentsSection({ contextKind, contextId }: CommentsSectionProps) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const openLoginDialog = useAuthStore((s) => s.openLoginDialog);

  const [sort, setSort] = useState<CommentSort>('latest');
  const [votes, setVotes] = useState(() => readUserVotes());
  const [localVersion, setLocalVersion] = useState(0);
  const [draft, setDraft] = useState('');
  const [replyToId, setReplyToId] = useState<string | null>(null);

  useEffect(() => {
    setVotes(readUserVotes());
  }, [localVersion]);

  const forest = useMemo(() => {
    const base = getCommentsForContext(contextKind, contextId);
    const merged = mergeComments(base, contextKind, contextId);
    void localVersion;
    return buildCommentForest(merged, sort, votes.likes, votes.dislikes);
  }, [contextKind, contextId, sort, votes.likes, votes.dislikes, localVersion]);

  const totalCount = useMemo(() => {
    const base = getCommentsForContext(contextKind, contextId);
    return mergeComments(base, contextKind, contextId).length;
  }, [contextKind, contextId, localVersion]);

  const inputPlaceholder = totalCount === 0 ? '暂无评论' : '写下你的评论…';

  const bump = useCallback(() => setLocalVersion((v) => v + 1), []);

  const submitTopLevel = () => {
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
      ...(contextKind === 'doc' ? { docSlug: contextId } : { dealId: contextId }),
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
    bump();
  };

  const submitReply = (parentId: string, body: string) => {
    if (!isAuthenticated) {
      openLoginDialog('登录后即可回复');
      return;
    }
    if (!canSubmitCommentNow()) return;
    const user = useAuthStore.getState().user;
    const userId = user?.userId?.startsWith('u-') ? user.userId : 'u-maya-2025';
    void createIdempotencyKey('reply');
    appendLocalReply(parentId, {
      id: `local-r-${Date.now()}`,
      ...(contextKind === 'doc' ? { docSlug: contextId } : { dealId: contextId }),
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
    bump();
  };

  if (!contextId) return null;

  return (
    <Box sx={{ mt: 6, width: '100%' }}>
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
        <ButtonGroup size="small" variant="text" sx={{ '& .MuiButton-root': { borderColor: 'divider' } }}>
          <Button variant={sort === 'latest' ? 'contained' : 'outlined'} onClick={() => setSort('latest')}>
            最新
          </Button>
          <Button variant={sort === 'hot' ? 'contained' : 'outlined'} onClick={() => setSort('hot')}>
            最热
          </Button>
        </ButtonGroup>
      </Box>

      <Box sx={{ width: '100%', mb: 3 }}>
        <TextField
          fullWidth
          multiline
          minRows={2}
          maxRows={8}
          placeholder={inputPlaceholder}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
              e.preventDefault();
              submitTopLevel();
            }
          }}
          variant="standard"
          slotProps={{
            input: {
              endAdornment: (
                <IconButton
                  color="primary"
                  aria-label="发送评论"
                  onClick={submitTopLevel}
                  disabled={!draft.trim()}
                  sx={{ alignSelf: 'flex-end' }}
                >
                  <SendIcon />
                </IconButton>
              ),
            },
          }}
          sx={{
            width: '100%',
            '& .MuiInputBase-root': {
              alignItems: 'flex-end',
              bgcolor: 'action.hover',
              borderRadius: 1,
              px: 1.5,
              py: 1,
              transition: 'background-color 0.15s ease',
              '&:hover': { bgcolor: 'action.selected' },
              '&:before, &:after': { display: 'none' },
            },
          }}
        />
      </Box>

      {forest.length === 0 ? (
        <Typography variant="body2" color="text.secondary" sx={{ py: 2, textAlign: 'center' }}>
          暂无评论
        </Typography>
      ) : (
        <Stack spacing={0} divider={<Divider flexItem sx={{ borderColor: 'divider', opacity: 0.6 }} />}>
          {forest.map((node) => (
            <CommentRow
              key={node.id}
              node={node}
              depth={0}
              votes={votes}
              onVoteChange={bump}
              replyToId={replyToId}
              setReplyToId={setReplyToId}
              onSubmitReply={submitReply}
            />
          ))}
        </Stack>
      )}
    </Box>
  );
}

export function DocCommentsSection({ docSlug }: { docSlug: string }) {
  return <CommentsSection contextKind="doc" contextId={docSlug} />;
}

export function DealCommentsSection({ dealId }: { dealId: string }) {
  return <CommentsSection contextKind="deal" contextId={dealId} />;
}
