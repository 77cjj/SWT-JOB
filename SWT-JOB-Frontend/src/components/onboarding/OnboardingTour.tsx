'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/router';
import { Box, Button, Fab, Paper, Tooltip, Typography } from '@mui/material';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';
import { useAuthStore } from '@/stores/authStore';
import useDevice from '../../hooks/useDevice';
import {
  getStepsForRoute,
  isOnboardingDone,
  markOnboardingDone,
  type OnboardingStep,
} from '../../lib/onboarding/steps';

type OnboardingContextValue = {
  startTour: () => void;
};

const OnboardingContext = createContext<OnboardingContextValue | null>(null);

function getRect(selector: string): DOMRect | null {
  const el = document.querySelector(selector);
  if (!el) return null;
  return el.getBoundingClientRect();
}

function shouldHideHelpFab(pathname: string) {
  if (pathname === '/') return true;
  if (pathname.startsWith('/chat')) return true;
  if (pathname.startsWith('/login')) return true;
  if (pathname.startsWith('/admin')) return true;
  return false;
}

function shouldHideSupportWidget(pathname: string) {
  return shouldHideHelpFab(pathname);
}

export function useOnboarding() {
  return useContext(OnboardingContext);
}

function OnboardingHelpFab({
  done,
  isMobile,
  supportVisible,
}: {
  done: boolean;
  isMobile: boolean;
  supportVisible: boolean;
}) {
  const router = useRouter();
  const ctx = useOnboarding();
  const section =
    router.pathname === '/deals' && router.query.section === 'market' ? 'market' : undefined;
  const steps = getStepsForRoute(router.pathname, section);

  if (!ctx || steps.length === 0 || shouldHideHelpFab(router.pathname) || done) return null;

  const bottomOffset = isMobile
    ? supportVisible
      ? 132
      : 76
    : supportVisible
      ? 92
      : 20;

  return (
    <Tooltip title="新手引导" placement="left">
      <Fab
        size="medium"
        aria-label="打开新手引导"
        onClick={ctx.startTour}
        sx={{
          position: 'fixed',
          right: { xs: 16, sm: 20 },
          bottom: bottomOffset,
          zIndex: 1390,
          boxShadow: 4,
          bgcolor: 'background.paper',
          color: 'primary.main',
          border: '1px solid',
          borderColor: 'divider',
          transition: 'transform 0.2s ease, box-shadow 0.2s ease',
          '&:hover': {
            bgcolor: 'action.hover',
            transform: 'scale(1.05)',
          },
          '&:active': {
            transform: 'scale(0.96)',
          },
        }}
      >
        <HelpOutlineIcon />
      </Fab>
    </Tooltip>
  );
}

function OnboardingOverlay({
  steps,
  index,
  onFinish,
  onNext,
}: {
  steps: OnboardingStep[];
  index: number;
  onFinish: () => void;
  onNext: () => void;
}) {
  const current = steps[index];
  const [spot, setSpot] = useState<DOMRect | null>(null);

  useEffect(() => {
    setSpot(null);
  }, [current?.target]);

  useEffect(() => {
    if (!current) return;
    let cancelled = false;

    const refresh = () => {
      const rect = getRect(current.target);
      if (rect && rect.width > 0 && rect.height > 0) {
        setSpot(rect);
        return true;
      }
      return false;
    };

    if (!refresh()) {
      const poll = () => {
        if (cancelled) return;
        if (!refresh()) window.setTimeout(poll, 120);
      };
      window.setTimeout(poll, 120);
    }

    const onResize = () => refresh();
    window.addEventListener('resize', onResize);
    window.addEventListener('scroll', onResize, true);
    return () => {
      cancelled = true;
      window.removeEventListener('resize', onResize);
      window.removeEventListener('scroll', onResize, true);
    };
  }, [current]);

  if (!current || !spot) return null;

  const pad = 8;
  const top = Math.max(12, spot.top - pad);
  const left = Math.max(12, spot.left - pad);
  const width = spot.width + pad * 2;
  const height = spot.height + pad * 2;
  const tooltipTop =
    top + height + 12 > window.innerHeight - 160 ? Math.max(12, top - 140) : top + height + 12;

  return (
    <Box sx={{ position: 'fixed', inset: 0, zIndex: 1400 }}>
      <Box
        sx={{
          position: 'absolute',
          inset: 0,
          bgcolor: 'rgba(0,0,0,0.5)',
        }}
        onClick={onFinish}
      />
      <Box
        sx={{
          position: 'absolute',
          top,
          left,
          width,
          height,
          borderRadius: 1,
          border: '2px solid',
          borderColor: 'primary.main',
          boxShadow: '0 0 0 4px rgba(99,102,241,0.35)',
          pointerEvents: 'none',
          zIndex: 1,
        }}
      />
      <Paper
        elevation={8}
        sx={{
          position: 'absolute',
          top: tooltipTop,
          left: Math.min(left, Math.max(12, window.innerWidth - 320)),
          width: 300,
          p: 2,
          zIndex: 2,
        }}
      >
        <Typography variant="overline" color="primary">
          新手引导 {index + 1}/{steps.length}
        </Typography>
        <Typography variant="subtitle1" fontWeight={700} gutterBottom>
          {current.title}
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          {current.body}
        </Typography>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 1 }}>
          <Button size="small" onClick={onFinish}>
            跳过
          </Button>
          <Button size="small" variant="contained" onClick={onNext}>
            {index < steps.length - 1 ? '下一步' : '完成'}
          </Button>
        </Box>
      </Paper>
    </Box>
  );
}

/** 全局引导：每账户首次自动播放；完成后不再显示「?」按钮 */
export function OnboardingTour() {
  const router = useRouter();
  const isMobile = useDevice();
  const userId = useAuthStore((s) => s.user?.userId ?? null);
  const [active, setActive] = useState(false);
  const [index, setIndex] = useState(0);
  const [done, setDone] = useState(true);

  const section =
    router.pathname === '/deals' && router.query.section === 'market' ? 'market' : undefined;
  const steps = useMemo(
    () => getStepsForRoute(router.pathname, section),
    [router.pathname, section],
  );

  useEffect(() => {
    setDone(isOnboardingDone(userId));
  }, [userId]);

  const startTour = useCallback(() => {
    setIndex(0);
    setActive(true);
  }, []);

  const finish = useCallback(() => {
    markOnboardingDone(userId);
    setDone(true);
    setActive(false);
  }, [userId]);

  const next = useCallback(() => {
    if (index < steps.length - 1) {
      setIndex((i) => i + 1);
      return;
    }
    finish();
  }, [finish, index, steps.length]);

  useEffect(() => {
    setActive(false);
    setIndex(0);
  }, [router.pathname, section]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (isOnboardingDone(userId)) return;
    if (steps.length === 0) return;

    let cancelled = false;
    let attempts = 0;

    const tryStart = () => {
      if (cancelled) return;
      const firstTarget = steps[0]?.target;
      const el = firstTarget ? document.querySelector(firstTarget) : null;
      if (el) {
        setActive(true);
        return;
      }
      attempts += 1;
      if (attempts < 40) {
        window.setTimeout(tryStart, 150);
      }
    };

    const t = window.setTimeout(tryStart, 200);
    return () => {
      cancelled = true;
      window.clearTimeout(t);
    };
  }, [router.pathname, section, steps, userId]);

  const supportVisible = !shouldHideSupportWidget(router.pathname);

  return (
    <OnboardingContext.Provider value={{ startTour }}>
      {active && steps.length > 0 ? (
        <OnboardingOverlay steps={steps} index={index} onFinish={finish} onNext={next} />
      ) : null}
      <OnboardingHelpFab done={done} isMobile={isMobile} supportVisible={supportVisible} />
    </OnboardingContext.Provider>
  );
}
