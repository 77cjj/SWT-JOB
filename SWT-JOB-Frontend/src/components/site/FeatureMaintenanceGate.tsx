'use client';

import { useRouter } from 'next/router';
import { Box, Typography } from '@mui/material';
import { useSiteFeatures } from '../../context/SiteFeaturesContext';
import { featureKeyForPath } from '../../lib/site/siteFeaturesApi';

const LABELS: Record<string, string> = {
  chat: 'AI 问答',
  deals: '薅羊毛',
  compare: '选岗计算器',
  jobs: '岗位情报',
  docs: 'SWT 文档',
};

/**
 * 功能未开放时：页面内容仍渲染，上层叠加毛玻璃 + 维护提示。
 * 不遮挡顶部菜单栏（以及移动端底栏），保证用户能离开当前页。
 */
export function FeatureMaintenanceGate() {
  const router = useRouter();
  const { features, loading } = useSiteFeatures();
  const pathname = router.pathname || '';

  if (pathname.startsWith('/admin')) return null;

  const key = featureKeyForPath(pathname);
  if (!key) return null;
  if (loading) return null;
  if (features[key] !== false) return null;

  const label = LABELS[key] || '该功能';

  return (
    <Box
      role="dialog"
      aria-modal="true"
      aria-label={`${label}维护中`}
      sx={{
        position: 'fixed',
        // 避开顶栏，保留导航可点
        top: 'var(--app-header-height, 56px)',
        left: 0,
        right: 0,
        // 移动端避开底栏
        bottom: {
          xs: 'calc(var(--app-bottom-nav-height, 5rem) + env(safe-area-inset-bottom, 0px))',
          md: 0,
        },
        zIndex: 1200,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        px: 2,
        background: 'rgba(15, 23, 42, 0.28)',
        backdropFilter: 'blur(14px) saturate(1.15)',
        WebkitBackdropFilter: 'blur(14px) saturate(1.15)',
        pointerEvents: 'auto',
      }}
    >
      <Box
        sx={{
          maxWidth: 420,
          width: '100%',
          textAlign: 'center',
          px: { xs: 3, sm: 4 },
          py: { xs: 3.5, sm: 4 },
          borderRadius: 3,
          border: '1px solid',
          borderColor: 'rgba(255,255,255,0.35)',
          bgcolor: 'rgba(255,255,255,0.72)',
          boxShadow: '0 18px 50px rgba(15,23,42,0.18)',
          color: 'text.primary',
        }}
      >
        <Typography
          variant="overline"
          sx={{ letterSpacing: '0.14em', color: 'text.secondary', fontWeight: 700 }}
        >
          SWT Helper
        </Typography>
        <Typography variant="h5" sx={{ mt: 1, mb: 1.25, fontWeight: 800, letterSpacing: '-0.02em' }}>
          {label}仍在开发中
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.7 }}>
          网站维护者正在完善此页面。可点击上方菜单切换到其他功能；正式开放前暂不可操作。
        </Typography>
      </Box>
    </Box>
  );
}
