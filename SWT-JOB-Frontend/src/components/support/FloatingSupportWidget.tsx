'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import {
  Box,
  Fab,
  IconButton,
  Paper,
  Tab,
  Tabs,
  TextField,
  Button,
  Typography,
  CircularProgress,
  Alert,
} from '@mui/material';
import {
  Close,
  ChatBubbleOutline,
  Send,
  SupportAgent,
  SmartToy,
} from '@mui/icons-material';
import { createStreamResponse } from '@/hooks/useStreamResponse';
import { RAGENT_API_BASE_URL, RAGENT_BYPASS_AUTH } from '@/config/runtimeEnv';
import { buildQuery } from '@/utils/helpers';
import { storage } from '@/utils/storage';
import { useAuthStore } from '@/stores/authStore';
import { useSupportWidgetStore } from '../../stores/supportWidgetStore';
import { getDemoMember } from '../../lib/member/demoUsers';
import { useI18n } from '../../context/I18nContext';
import useDevice from '../../hooks/useDevice';
import { MOBILE_BOTTOM_NAV_OFFSET } from '../../lib/mobileLayout';
import type { MessageDeltaPayload } from '@/types';

type PanelTab = 'ai' | 'human';

type ChatLine = {
  role: 'user' | 'assistant';
  text: string;
};

function shouldHideWidget(pathname: string) {
  if (pathname === '/') return true;
  if (pathname.startsWith('/login')) return true;
  if (pathname.startsWith('/admin')) return true;
  return false;
}

function fabBottomOffset(pathname: string, isMobile: boolean): number | string {
  if (pathname.startsWith('/chat')) {
    if (isMobile) {
      return 'calc(5rem + env(safe-area-inset-bottom, 0px) + 5.5rem)';
    }
    return 96;
  }
  return isMobile ? MOBILE_BOTTOM_NAV_OFFSET : 20;
}

export default function FloatingSupportWidget() {
  const router = useRouter();
  const { t } = useI18n();
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState<PanelTab>('ai');
  const [aiInput, setAiInput] = useState('');
  const [aiLines, setAiLines] = useState<ChatLine[]>([]);
  const [aiStreaming, setAiStreaming] = useState(false);
  const [humanMessage, setHumanMessage] = useState('');
  const [humanContact, setHumanContact] = useState('');
  const [humanSending, setHumanSending] = useState(false);
  const [humanDone, setHumanDone] = useState(false);
  const [humanError, setHumanError] = useState('');
  const abortRef = useRef<(() => void) | null>(null);
  const scrollRef = useRef<HTMLDivElement | null>(null);

  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const openLoginDialog = useAuthStore((s) => s.openLoginDialog);
  const openSignal = useSupportWidgetStore((s) => s.openSignal);
  const widgetTab = useSupportWidgetStore((s) => s.tab);
  const humanMessagePrefill = useSupportWidgetStore((s) => s.humanMessagePrefill);
  const isMobile = useDevice();
  const hidden = shouldHideWidget(router.pathname);
  const wechatHint = process.env.NEXT_PUBLIC_SITE_WECHAT_HINT?.trim();
  const isChatRoute = router.pathname.startsWith('/chat');

  useEffect(() => {
    if (openSignal === 0) return;
    setOpen(true);
    setTab(widgetTab);
    if (humanMessagePrefill) {
      setHumanMessage(humanMessagePrefill);
    }
  }, [openSignal, widgetTab, humanMessagePrefill]);

  useEffect(() => {
    const raw = router.query.contact;
    const contactId = typeof raw === 'string' ? raw.trim() : '';
    if (!contactId || !router.isReady) return;
    const member = getDemoMember(contactId);
    if (!member) return;

    const prefill = `想联系用户 ${member.displayName}（${member.id}）：\n`;
    if (!isAuthenticated) {
      openLoginDialog('登录后可留言，站长会协助转发联系');
      return;
    }
    setOpen(true);
    setTab('human');
    setHumanMessage(prefill);
    const { contact: _c, ...rest } = router.query;
    void router.replace({ pathname: router.pathname, query: rest }, undefined, { shallow: true });
  }, [router.isReady, router.query.contact, router.pathname, isAuthenticated, openLoginDialog, router]);

  useEffect(() => {
    return () => abortRef.current?.();
  }, []);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [aiLines, aiStreaming, open, tab]);

  const canUseAi = RAGENT_BYPASS_AUTH || isAuthenticated;

  const sendAi = useCallback(async () => {
    const q = aiInput.trim();
    if (!q || aiStreaming) return;
    if (!canUseAi) return;

    setAiInput('');
    setAiLines((prev) => [...prev, { role: 'user', text: q }, { role: 'assistant', text: '' }]);
    setAiStreaming(true);

    let assistant = '';
    const headers: Record<string, string> = {};
    const token = storage.getToken();
    if (token) headers.Authorization = token;

    const url = `${RAGENT_API_BASE_URL}/rag/v3/chat${buildQuery({
      question: q,
      deepThinking: false,
    })}`;

    const stream = createStreamResponse(
      { url, headers },
      {
        onMessage: (payload: MessageDeltaPayload) => {
          if (payload?.type !== 'response' || typeof payload.delta !== 'string') return;
          assistant += payload.delta;
          setAiLines((prev) => {
            const next = [...prev];
            const last = next[next.length - 1];
            if (last?.role === 'assistant') next[next.length - 1] = { ...last, text: assistant };
            return next;
          });
        },
        onReject: (payload: MessageDeltaPayload) => {
          if (typeof payload.delta === 'string') {
            assistant += payload.delta;
            setAiLines((prev) => {
              const next = [...prev];
              const last = next[next.length - 1];
              if (last?.role === 'assistant') next[next.length - 1] = { ...last, text: assistant };
              return next;
            });
          }
        },
        onError: () => {
          setAiLines((prev) => {
            const next = [...prev];
            const last = next[next.length - 1];
            if (last?.role === 'assistant' && !last.text) {
              next[next.length - 1] = { ...last, text: t('support.aiError') };
            }
            return next;
          });
        },
        onDone: () => setAiStreaming(false),
        onFinish: () => setAiStreaming(false),
      },
    );

    abortRef.current = () => stream.cancel();
    void stream.start();
  }, [aiInput, aiStreaming, canUseAi, t]);

  const submitHuman = useCallback(async () => {
    const message = humanMessage.trim();
    if (message.length < 4 || humanSending) return;
    if (!isAuthenticated) {
      openLoginDialog('登录后即可给站长留言');
      return;
    }
    setHumanSending(true);
    setHumanError('');
    setHumanDone(false);
    try {
      const res = await fetch('/api/site-inquiry', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message,
          contact: humanContact.trim(),
          pageUrl: typeof window !== 'undefined' ? window.location.href : '',
          topic: router.pathname.startsWith('/deals') ? 'deals' : 'general',
        }),
      });
      const { parseJsonResponse } = await import('../../lib/api/parseJsonResponse');
      const data = await parseJsonResponse<{ ok?: boolean; message?: string }>(res);
      if (!res.ok || !data.ok) {
        throw new Error(data.message || t('support.humanError'));
      }
      setHumanDone(true);
      setHumanMessage('');
    } catch (e) {
      setHumanError(e instanceof Error ? e.message : t('support.humanError'));
    } finally {
      setHumanSending(false);
    }
  }, [humanContact, humanMessage, humanSending, isAuthenticated, openLoginDialog, router.pathname, t]);

  if (hidden) return null;

  return (
    <Box
      sx={{
        position: 'fixed',
        right: { xs: 16, sm: 20 },
        bottom: fabBottomOffset(router.pathname, isMobile),
        zIndex: 1400,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'flex-end',
      }}
    >
      {open ? (
        <Paper
          elevation={8}
          sx={{
            width: { xs: 'min(92vw, 360px)', sm: 380 },
            height: 480,
            mb: 1.5,
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            borderRadius: 2,
          }}
        >
          <Box
            sx={{
              px: 1.5,
              py: 1,
              display: 'flex',
              alignItems: 'center',
              borderBottom: 1,
              borderColor: 'divider',
              bgcolor: 'primary.main',
              color: 'primary.contrastText',
            }}
          >
            <Typography variant="subtitle2" fontWeight={700}>
              {t('support.title')}
            </Typography>
          </Box>

          <Tabs
            value={tab}
            onChange={(_, v) => setTab(v)}
            variant="fullWidth"
            sx={{ minHeight: 40, borderBottom: 1, borderColor: 'divider' }}
          >
            <Tab icon={<SmartToy sx={{ fontSize: 18 }} />} iconPosition="start" value="ai" label={t('support.tabAi')} sx={{ minHeight: 40, py: 0.5 }} />
            <Tab icon={<SupportAgent sx={{ fontSize: 18 }} />} iconPosition="start" value="human" label={t('support.tabHuman')} sx={{ minHeight: 40, py: 0.5 }} />
          </Tabs>

          {tab === 'ai' ? (
            <>
              <Box ref={scrollRef} sx={{ flex: 1, overflowY: 'auto', p: 1.5, bgcolor: 'action.hover' }}>
                {aiLines.length === 0 ? (
                  <Typography variant="body2" color="text.secondary">
                    {t('support.aiEmpty')}
                  </Typography>
                ) : null}
                {aiLines.map((line, i) => (
                  <Box
                    key={`${line.role}-${i}`}
                    sx={{
                      mb: 1,
                      display: 'flex',
                      justifyContent: line.role === 'user' ? 'flex-end' : 'flex-start',
                    }}
                  >
                    <Box
                      sx={{
                        maxWidth: '88%',
                        px: 1.2,
                        py: 0.8,
                        borderRadius: 1.5,
                        bgcolor: line.role === 'user' ? 'primary.main' : 'background.paper',
                        color: line.role === 'user' ? 'primary.contrastText' : 'text.primary',
                        fontSize: '0.86rem',
                        whiteSpace: 'pre-wrap',
                        border: line.role === 'assistant' ? 1 : 0,
                        borderColor: 'divider',
                      }}
                    >
                      {line.text || (aiStreaming && i === aiLines.length - 1 ? '…' : '')}
                    </Box>
                  </Box>
                ))}
                {!canUseAi ? (
                  <Alert severity="info" sx={{ mt: 1 }}>
                    {t('support.aiNeedLogin')}{' '}
                    <Link href="/login">{t('support.goLogin')}</Link>
                  </Alert>
                ) : null}
              </Box>
              <Box sx={{ p: 1.2, borderTop: 1, borderColor: 'divider', display: 'flex', gap: 1 }}>
                <TextField
                  size="small"
                  fullWidth
                  placeholder={t('support.aiPlaceholder')}
                  value={aiInput}
                  onChange={(e) => setAiInput(e.target.value)}
                  disabled={!canUseAi || aiStreaming}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      void sendAi();
                    }
                  }}
                />
                <IconButton color="primary" disabled={!canUseAi || aiStreaming || !aiInput.trim()} onClick={() => void sendAi()}>
                  {aiStreaming ? <CircularProgress size={20} /> : <Send />}
                </IconButton>
              </Box>
            </>
          ) : (
            <Box sx={{ flex: 1, overflowY: 'auto', p: 1.5, pb: 2, display: 'flex', flexDirection: 'column', gap: 1.2 }}>
              <Typography variant="body2" color="text.secondary">
                {t('support.humanDesc')}
              </Typography>
              {wechatHint ? (
                <Alert severity="success" variant="outlined" sx={{ py: 0.3 }}>
                  {wechatHint}
                </Alert>
              ) : null}
              <TextField
                label={t('support.contactLabel')}
                size="small"
                value={humanContact}
                onChange={(e) => setHumanContact(e.target.value)}
                placeholder={t('support.contactPlaceholder')}
              />
              <TextField
                label={t('support.messageLabel')}
                multiline
                minRows={4}
                value={humanMessage}
                onChange={(e) => setHumanMessage(e.target.value)}
                placeholder={t('support.messagePlaceholder')}
              />
              {humanError ? <Alert severity="error">{humanError}</Alert> : null}
              {humanDone ? <Alert severity="success">{t('support.humanSuccess')}</Alert> : null}
              <Button
                type="button"
                variant="contained"
                fullWidth
                onClick={() => void submitHuman()}
                disabled={humanSending || humanMessage.trim().length < 4}
                startIcon={humanSending ? <CircularProgress size={16} color="inherit" /> : <Send />}
              >
                {t('support.humanSubmit')}
              </Button>
            </Box>
          )}
        </Paper>
      ) : null}

      <Fab
        color="primary"
        aria-label={open ? t('support.close') : t('support.open')}
        onClick={() => {
          if (isChatRoute && !open) {
            setTab('human');
          }
          setOpen((v) => !v);
        }}
        sx={{ flexShrink: 0 }}
      >
        {open ? <Close /> : <ChatBubbleOutline />}
      </Fab>
    </Box>
  );
}
