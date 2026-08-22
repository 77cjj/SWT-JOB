import Link from 'next/link';
import { Box, Button, Chip, Typography } from '@mui/material';
import { ArrowForward, AutoAwesome, Storefront } from '@mui/icons-material';

import { useI18n } from '../../context/I18nContext';

type DealsHubHeaderProps = {
  active: 'official' | 'market';
  activeCount?: number;
  staleCount?: number;
  onPrimaryAction?: () => void;
};

export default function DealsHubHeader({
  active,
  activeCount,
  staleCount,
  onPrimaryAction,
}: DealsHubHeaderProps) {
  const { t, tWithParams } = useI18n();
  const isOfficial = active === 'official';

  return (
    <Box
      sx={{
        position: 'relative',
        overflow: 'hidden',
        border: 1,
        borderColor: 'divider',
        borderRadius: { xs: 2.5, md: 3 },
        px: { xs: 2, md: 3.5 },
        py: { xs: 2.5, md: 3.25 },
        mb: 2.5,
        background: (theme) =>
          theme.palette.mode === 'dark'
            ? 'linear-gradient(135deg, rgba(99,102,241,.20), rgba(23,23,23,.96) 46%, rgba(16,185,129,.10))'
            : 'linear-gradient(135deg, #eef2ff 0%, #ffffff 48%, #ecfdf5 100%)',
      }}
    >
      <Box
        sx={{
          position: 'absolute',
          width: 220,
          height: 220,
          borderRadius: '50%',
          right: -70,
          top: -120,
          background: 'radial-gradient(circle, rgba(99,102,241,.25), transparent 68%)',
          pointerEvents: 'none',
        }}
      />
      <Box sx={{ position: 'relative', display: 'flex', justifyContent: 'space-between', gap: 2, flexWrap: 'wrap' }}>
        <Box sx={{ maxWidth: 720 }}>
          <Typography
            variant="overline"
            sx={{ color: 'primary.main', fontWeight: 800, letterSpacing: '.12em' }}
          >
            {t('deals.hubEyebrow')}
          </Typography>
          <Typography
            component="h1"
            sx={{
              mt: 0.25,
              fontFamily: 'var(--font-display, "Space Grotesk", sans-serif)',
              fontSize: { xs: '1.75rem', md: '2.35rem' },
              lineHeight: 1.12,
              fontWeight: 800,
              letterSpacing: '-.035em',
            }}
          >
            {isOfficial ? t('deals.officialHeroTitle') : t('marketplace.heroTitle')}
          </Typography>
          <Typography color="text.secondary" sx={{ mt: 1, maxWidth: 660, lineHeight: 1.65 }}>
            {isOfficial ? t('deals.officialHeroBody') : t('marketplace.heroBody')}
          </Typography>

          <Box sx={{ display: 'flex', gap: 1, mt: 2, flexWrap: 'wrap' }}>
            {isOfficial && activeCount != null ? (
              <Chip size="small" color="success" variant="outlined" label={tWithParams('deals.statsActive', { count: activeCount })} />
            ) : null}
            {isOfficial && staleCount != null && staleCount > 0 ? (
              <Chip size="small" variant="outlined" label={tWithParams('deals.statsStale', { count: staleCount })} />
            ) : null}
            {!isOfficial ? (
              <>
                <Chip size="small" variant="outlined" label={t('marketplace.selfServeChip')} />
                <Chip size="small" variant="outlined" label={t('marketplace.trustChip')} />
              </>
            ) : null}
          </Box>
        </Box>

        {!isOfficial && onPrimaryAction ? (
          <Button
            variant="contained"
            startIcon={<Storefront />}
            onClick={onPrimaryAction}
            sx={{ alignSelf: 'flex-start', flexShrink: 0 }}
          >
            {t('marketplace.createListing')}
          </Button>
        ) : null}
      </Box>

      <Box
        sx={{
          position: 'relative',
          display: 'inline-flex',
          gap: 0.5,
          mt: 2.5,
          p: 0.5,
          borderRadius: 2,
          bgcolor: 'background.paper',
          border: 1,
          borderColor: 'divider',
          boxShadow: '0 10px 30px rgba(15,23,42,.06)',
        }}
      >
        <Button
          component={Link}
          href="/deals"
          size="small"
          startIcon={<AutoAwesome />}
          variant={isOfficial ? 'contained' : 'text'}
          color={isOfficial ? 'primary' : 'inherit'}
          sx={{ borderRadius: 1.5 }}
        >
          {t('deals.sectionOfficial')}
        </Button>
        <Button
          component={Link}
          href="/deals/market"
          size="small"
          endIcon={!isOfficial ? undefined : <ArrowForward />}
          startIcon={<Storefront />}
          variant={!isOfficial ? 'contained' : 'text'}
          color={!isOfficial ? 'primary' : 'inherit'}
          sx={{ borderRadius: 1.5 }}
        >
          {t('deals.sectionMarket')}
        </Button>
      </Box>
    </Box>
  );
}
