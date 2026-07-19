import Link from 'next/link';
import {
  Box,
  Button,
  Chip,
  Typography,
} from '@mui/material';
import DesktopLayout from '../layout/desktop/Layout';
import MobileLayout from '../layout/mobile/Layout';
import useDevice from '../hooks/useDevice';
import { useI18n } from '../context/I18nContext';
import { useAuthStore } from '@/stores/authStore';

function PricingContent() {
  const { t, tWithParams } = useI18n();
  const user = useAuthStore((s) => s.user);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  const plans = [
    {
      key: 'free',
      name: t('pricing.plans.freeName'),
      price: t('pricing.plans.freePrice'),
      desc: t('pricing.plans.freeDesc'),
      features: [
        t('pricing.plans.freeFeature1'),
        t('pricing.plans.freeFeature2'),
        t('pricing.plans.freeFeature3'),
      ],
      cta: t('pricing.backToChat'),
      href: isAuthenticated ? '/chat' : '/register',
      primary: false,
    },
    {
      key: 'basic',
      name: t('pricing.plans.basicName'),
      price: t('pricing.plans.basicPrice'),
      desc: t('pricing.plans.basicDesc'),
      features: [
        t('pricing.plans.basicFeature1'),
        t('pricing.plans.basicFeature2'),
        t('pricing.plans.basicFeature3'),
      ],
      cta: t('pricing.comingSoon'),
      href: null as string | null,
      primary: true,
    },
    {
      key: 'plus',
      name: t('pricing.plans.plusName'),
      price: t('pricing.plans.plusPrice'),
      desc: t('pricing.plans.plusDesc'),
      features: [
        t('pricing.plans.plusFeature1'),
        t('pricing.plans.plusFeature2'),
        t('pricing.plans.plusFeature3'),
      ],
      cta: t('pricing.contactHost'),
      href: '/chat',
      primary: false,
    },
  ];

  return (
    <Box sx={{ py: { xs: 2, md: 4 } }}>
      <Box sx={{ mb: 3, display: 'flex', flexWrap: 'wrap', alignItems: 'flex-start', justifyContent: 'space-between', gap: 2 }}>
        <Box>
          <Chip size="small" label={t('pricing.draftBadge')} color="warning" variant="outlined" sx={{ mb: 1.5 }} />
          <Typography variant="h4" fontWeight={700} gutterBottom>
            {t('pricing.title')}
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ maxWidth: 640 }}>
            {t('pricing.subtitle')}
          </Typography>
          {isAuthenticated && typeof user?.aiQuotaRemaining === 'number' ? (
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1.5 }}>
              {tWithParams('chat.quotaRemaining', {
                remaining: user.aiQuotaRemaining,
                total: user.aiQuotaTotal ?? 3,
              })}
            </Typography>
          ) : null}
        </Box>
        <Button component={Link} href="/chat" variant="outlined">
          {t('pricing.backToChat')}
        </Button>
      </Box>

      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', md: 'repeat(3, 1fr)' },
          gap: 2,
        }}
      >
        {plans.map((plan) => (
          <Box
            key={plan.key}
            sx={{
              border: 1,
              borderColor: plan.primary ? 'primary.main' : 'divider',
              borderRadius: 2,
              p: 2.5,
              display: 'flex',
              flexDirection: 'column',
              gap: 1.25,
              bgcolor: plan.primary ? 'action.hover' : 'background.paper',
            }}
          >
            <Typography variant="overline" color="text.secondary">
              {plan.name}
            </Typography>
            <Typography variant="h3" fontWeight={800} sx={{ lineHeight: 1.1 }}>
              {plan.price}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {plan.desc}
            </Typography>
            <Box component="ul" sx={{ m: 0, pl: 2.2, flex: 1 }}>
              {plan.features.map((feature) => (
                <Typography key={feature} component="li" variant="body2" sx={{ mb: 0.75 }}>
                  {feature}
                </Typography>
              ))}
            </Box>
            {plan.href ? (
              <Button
                component={Link}
                href={plan.href}
                variant={plan.primary ? 'contained' : 'outlined'}
                fullWidth
              >
                {plan.cta}
              </Button>
            ) : (
              <Button variant="contained" fullWidth disabled>
                {plan.cta}
              </Button>
            )}
          </Box>
        ))}
      </Box>

      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 3 }}>
        {t('pricing.contactHint')}
      </Typography>
    </Box>
  );
}

export default function PricingRoute() {
  const isMobile = useDevice();
  const content = <PricingContent />;

  return isMobile ? (
    <MobileLayout>{content}</MobileLayout>
  ) : (
    <DesktopLayout maxWidthClassName="max-w-5xl">{content}</DesktopLayout>
  );
}
