'use client';

import { useRouter } from 'next/router';
import { Box, Typography } from '@mui/material';
import { useSiteFeatures } from '../../context/SiteFeaturesContext';
import { featureKeyForPath } from '../../lib/site/siteFeaturesApi';
import { useI18n } from '../../context/I18nContext';

/**
 * 功能未开放时：页面内容仍渲染，上层叠加毛玻璃 + 维护提示。
 * 不遮挡顶部菜单栏（以及移动端底栏），保证用户能离开当前页。
 */
export function FeatureMaintenanceGate() {
  const router = useRouter();
  const { t, tWithParams } = useI18n();
  const { features, loading } = useSiteFeatures();
  const pathname = router.pathname || '';

  if (pathname.startsWith('/admin')) return null;

  const key = featureKeyForPath(pathname);
  if (!key) return null;
  if (loading) return null;
  if (features[key] !== false) return null;

  const label = t(`siteFeatures.labels.${key}`);

  return (
    <Box
      role="dialog"
      aria-modal="true"
      aria-label={tWithParams('siteFeatures.ariaMaintaining', { label })}
      sx={{
        position: 'fixed',
        top: 'var(--app-header-height, 56px)',
        left: 0,
        right: 0,
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
          {tWithParams('siteFeatures.underDevelopment', { label })}
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.7 }}>
          {t('siteFeatures.underDevelopmentHint')}
        </Typography>
      </Box>
    </Box>
  );
}
