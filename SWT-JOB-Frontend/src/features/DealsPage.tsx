import { useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import {
  Box,
  Typography,
  Tabs,
  Tab,
  Chip,
  Button,
  Snackbar,
  Alert,
  Collapse,
  IconButton,
  Tooltip,
} from '@mui/material';
import {
  ContentCopy,
  OpenInNew,
  Storefront,
  AccountBalance,
  PhoneIphone,
  MoreHoriz,
  ExpandMore,
  ExpandLess,
  History,
  InfoOutlined,
} from '@mui/icons-material';
import {
  dealCategoryOrder,
  referralPrograms,
  type DealCategory,
  type OfferKind,
} from '../data/referralDeals';
import DealHistoryDialog from '../components/deals/DealHistoryDialog';
import ExternalLinkDialog from '../components/deals/ExternalLinkDialog';
import {
  formatEditionPeriod,
  resolveAllPrograms,
  sortProgramsForDisplay,
  type ResolvedProgram,
} from '../lib/deals/deal-utils';
import { useI18n } from '../context/I18nContext';
import type { Language } from '../i18n/types';
import MarketplacePage from './MarketplacePage';

const categoryIcons: Record<DealCategory, React.ReactNode> = {
  bank: <AccountBalance fontSize="small" />,
  cashback: <Storefront fontSize="small" />,
  mobile: <PhoneIphone fontSize="small" />,
  other: <MoreHoriz fontSize="small" />,
};

function pickLang(obj: { zh: string; en: string }, lang: Language): string {
  return lang === 'zh' ? obj.zh : obj.en;
}

function pickLangList(obj: { zh: string[]; en: string[] }, lang: Language): string[] {
  return lang === 'zh' ? obj.zh : obj.en;
}

function hasReferralLink(item: ResolvedProgram): boolean {
  const url = item.edition.referralUrl;
  return item.program.offerKind === 'refer' && Boolean(url) && url !== '#';
}

function DealCard({
  item,
  lang,
  onCopy,
  onOpenExternal,
  onViewHistory,
}: {
  item: ResolvedProgram;
  lang: Language;
  onCopy: (url: string, title: string) => void;
  onOpenExternal: (url: string, title: string) => void;
  onViewHistory: () => void;
}) {
  const { t, tWithParams } = useI18n();
  const [expanded, setExpanded] = useState(false);
  const { program, edition, status, isStale, daysUntilExpiry } = item;
  const title = pickLang(program.brandName, lang);
  const reward = pickLang(edition.reward, lang);
  const summary = pickLang(edition.summary, lang);
  const requirements = pickLangList(edition.requirements, lang);
  const tags = edition.tags ? pickLangList(edition.tags, lang) : [];
  const showReferral = hasReferralLink(item);
  const period = formatEditionPeriod(edition, lang);
  const offerKind = program.offerKind as OfferKind;
  const officialUrl = edition.officialUrl;

  return (
    <Box
      sx={{
        border: 1,
        borderColor: isStale ? 'action.disabled' : 'divider',
        borderStyle: isStale ? 'dashed' : 'solid',
        borderRadius: 2,
        p: 2,
        display: 'flex',
        flexDirection: 'column',
        gap: 1.25,
        height: '100%',
        transition: 'box-shadow 0.2s, opacity 0.2s',
        ...(isStale
          ? {
              opacity: 0.52,
              filter: 'grayscale(0.85)',
              bgcolor: 'action.hover',
              '&:hover': { boxShadow: 0 },
            }
          : { '&:hover': { boxShadow: 2 } }),
      }}
    >
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 1 }}>
        <Box sx={{ minWidth: 0, flex: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, mb: 0.25 }}>
            <Typography
              variant="subtitle1"
              fontWeight={700}
              sx={{ color: isStale ? 'text.disabled' : 'text.primary' }}
            >
              {title}
            </Typography>
            {officialUrl ? (
              <Tooltip title={t('deals.officialInfo')}>
                <IconButton
                  size="small"
                  aria-label={t('deals.officialInfo')}
                  onClick={() => onOpenExternal(officialUrl, t('deals.officialTerms'))}
                  sx={{
                    p: 0.35,
                    color: 'primary.main',
                    bgcolor: 'action.hover',
                    '&:hover': { bgcolor: 'action.selected' },
                  }}
                >
                  <InfoOutlined sx={{ fontSize: 18 }} />
                </IconButton>
              </Tooltip>
            ) : null}
          </Box>
          <Typography
            variant="h5"
            fontWeight={800}
            sx={{ color: isStale ? 'text.disabled' : 'primary.main', lineHeight: 1.2 }}
          >
            {reward}
          </Typography>
        </Box>
      </Box>

      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
        <Chip
          size="small"
          label={t(`deals.offerKind.${offerKind}`)}
          variant="outlined"
          color={offerKind === 'refer' ? 'primary' : 'default'}
          disabled={isStale}
        />
        {edition.requiresInPerson ? (
          <Chip size="small" label={t('deals.inPersonOnly')} variant="outlined" disabled={isStale} />
        ) : null}
        {tags.map((tag) => (
          <Chip key={tag} size="small" label={tag} variant="outlined" disabled={isStale} />
        ))}
      </Box>

      <Typography variant="caption" color={isStale ? 'text.disabled' : 'text.secondary'}>
        {period}
      </Typography>

      <Typography variant="body2" color={isStale ? 'text.disabled' : 'text.secondary'} sx={{ lineHeight: 1.55 }}>
        {summary}
      </Typography>

      {isStale ? (
        <Alert severity="warning" variant="outlined" sx={{ py: 0, fontSize: '0.75rem' }}>
          {t('deals.staleHint')}
        </Alert>
      ) : null}

      {!isStale && edition.validUntil && daysUntilExpiry !== null && daysUntilExpiry >= 0 ? (
        <Typography variant="caption" color={status === 'expiring' ? 'warning.main' : 'text.secondary'}>
          {status === 'expiring'
            ? tWithParams('deals.expiresInDays', { days: daysUntilExpiry })
            : tWithParams('deals.expiresOn', { date: edition.validUntil })}
        </Typography>
      ) : null}

      {isStale && edition.validUntil ? (
        <Typography variant="caption" color="text.disabled">
          {tWithParams('deals.endedOn', { date: edition.validUntil })}
        </Typography>
      ) : null}

      <Collapse in={expanded}>
        <Box component="ul" sx={{ m: 0, pl: 2.5, color: isStale ? 'text.disabled' : 'text.secondary' }}>
          {requirements.map((req) => (
            <Typography component="li" variant="body2" key={req} sx={{ mb: 0.5 }}>
              {req}
            </Typography>
          ))}
        </Box>
      </Collapse>

      <Box sx={{ display: 'flex', alignItems: 'center' }}>
        <IconButton size="small" onClick={() => setExpanded((v) => !v)} aria-label="toggle details">
          {expanded ? <ExpandLess /> : <ExpandMore />}
        </IconButton>
        <Typography variant="caption" color="text.secondary">
          {expanded ? t('deals.hideDetails') : t('deals.showDetails')}
        </Typography>
      </Box>

      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 'auto', pt: 0.5 }}>
        {!isStale && showReferral ? (
          <>
            <Button
              variant="contained"
              size="small"
              startIcon={<OpenInNew />}
              onClick={() => onOpenExternal(edition.referralUrl!, title)}
            >
              {t('deals.openReferralLink')}
            </Button>
            <Button
              variant="outlined"
              size="small"
              startIcon={<ContentCopy />}
              onClick={() => onCopy(edition.referralUrl!, title)}
            >
              {t('deals.copyReferralLink')}
            </Button>
          </>
        ) : null}
        {program.editions.length > 1 ? (
          <Button
            variant={isStale ? 'contained' : 'outlined'}
            size="small"
            startIcon={<History />}
            onClick={onViewHistory}
            color={isStale ? 'inherit' : 'primary'}
          >
            {t('deals.viewHistory')}
          </Button>
        ) : null}
      </Box>

      {!isStale && !showReferral && offerKind === 'signup_bonus' ? (
        <Typography variant="caption" color="text.secondary">
          {t('deals.signupBonusHint')}
        </Typography>
      ) : null}
    </Box>
  );
}

export default function DealsPage() {
  const { t, tWithParams, language } = useI18n();
  const router = useRouter();
  const section = router.query.section === 'market' ? 'market' : 'deals';
  const [category, setCategory] = useState<DealCategory | 'all'>('all');
  const [snack, setSnack] = useState<{ open: boolean; message: string; severity?: 'success' | 'info' }>({
    open: false,
    message: '',
    severity: 'success',
  });
  const [historyTarget, setHistoryTarget] = useState<ResolvedProgram | null>(null);
  const [externalLink, setExternalLink] = useState<{ url: string; label: string } | null>(null);

  const allResolved = useMemo(() => resolveAllPrograms(referralPrograms), []);

  const filtered = useMemo(() => {
    const list =
      category === 'all'
        ? allResolved
        : allResolved.filter((r) => r.program.category === category);
    return sortProgramsForDisplay(list);
  }, [allResolved, category]);

  const handleCopy = async (url: string, title: string) => {
    try {
      await navigator.clipboard.writeText(url);
      setSnack({
        open: true,
        severity: 'success',
        message: tWithParams('deals.copied', { title }),
      });
    } catch {
      setSnack({ open: true, severity: 'info', message: t('deals.copyFailed') });
    }
  };

  const handleConfirmExternal = () => {
    if (externalLink) {
      window.open(externalLink.url, '_blank', 'noopener,noreferrer');
    }
    setExternalLink(null);
  };

  const setSection = (next: 'deals' | 'market') => {
    void router.replace(
      next === 'market' ? { pathname: '/deals', query: { section: 'market' } } : '/deals',
      undefined,
      { shallow: true },
    );
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 2, mb: 2 }}>
        <Typography variant="body2" color="text.secondary">
          {t('deals.subtitle')}
        </Typography>
        <Tooltip title={t('deals.disclaimer')} placement="left">
          <IconButton size="small" aria-label={t('deals.disclaimer')} sx={{ mt: -0.25, flexShrink: 0 }}>
            <InfoOutlined fontSize="small" />
          </IconButton>
        </Tooltip>
      </Box>

      <Tabs
        data-tour="deals-section"
        value={section}
        onChange={(_, v) => setSection(v)}
        variant="fullWidth"
        sx={{ mb: 2.5, borderBottom: 1, borderColor: 'divider', minHeight: 40 }}
      >
        <Tab value="deals" label={t('deals.sectionOfficial')} sx={{ minHeight: 40, py: 1 }} />
        <Tab value="market" label={t('deals.sectionMarket')} sx={{ minHeight: 40, py: 1 }} />
      </Tabs>

      {section === 'market' ? (
        <MarketplacePage embedded />
      ) : (
        <>
      <Tabs
        value={category}
        onChange={(_, v) => setCategory(v)}
        variant="scrollable"
        scrollButtons="auto"
        sx={{ mb: 2.5, borderBottom: 1, borderColor: 'divider', minHeight: 40 }}
      >
        <Tab value="all" label={t('common.all')} sx={{ minHeight: 40, py: 1 }} />
        {dealCategoryOrder.map((cat) => (
          <Tab
            key={cat}
            value={cat}
            icon={categoryIcons[cat] as React.ReactElement}
            iconPosition="start"
            label={t(`deals.categories.${cat}`)}
            sx={{ minHeight: 40, py: 1 }}
          />
        ))}
      </Tabs>

      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', md: 'repeat(2, 1fr)', lg: 'repeat(3, 1fr)' },
          gap: 2,
        }}
      >
        {filtered.map((item) => (
          <DealCard
            key={item.program.id}
            item={item}
            lang={language}
            onCopy={handleCopy}
            onOpenExternal={(url, label) => setExternalLink({ url, label })}
            onViewHistory={() => setHistoryTarget(item)}
          />
        ))}
      </Box>

      {filtered.length === 0 ? (
        <Typography color="text.secondary" sx={{ py: 6, textAlign: 'center' }}>
          {t('common.noData')}
        </Typography>
      ) : null}

      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 3 }}>
        {t('deals.footerHint')}{' '}
        <Link href="/docs/return/side-hustles" style={{ color: 'inherit' }}>
          {t('deals.readFullGuide')}
        </Link>
        {' · '}
        <Link href="/deals?section=market" style={{ color: 'inherit' }}>
          {t('deals.marketLink')}
        </Link>
      </Typography>

      <DealHistoryDialog
        open={Boolean(historyTarget)}
        onClose={() => setHistoryTarget(null)}
        program={historyTarget?.program ?? null}
        resolved={historyTarget}
      />

      <ExternalLinkDialog
        open={Boolean(externalLink)}
        targetLabel={externalLink?.label ?? ''}
        targetUrl={externalLink?.url ?? ''}
        onClose={() => setExternalLink(null)}
        onConfirm={handleConfirmExternal}
      />
        </>
      )}

      <Snackbar
        open={snack.open}
        autoHideDuration={3000}
        onClose={() => setSnack((s) => ({ ...s, open: false }))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          severity={snack.severity ?? 'success'}
          onClose={() => setSnack((s) => ({ ...s, open: false }))}
        >
          {snack.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}
