import { useMemo, useState } from 'react';
import Link from 'next/link';
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
  AccountBalance,
  MoreHoriz,
  ExpandMore,
  ExpandLess,
  History,
  InfoOutlined,
} from '@mui/icons-material';
import {
  dealCategoryOrder,
  type DealCategory,
  type OfferKind,
} from '../data/referralDeals';
import DealHistoryDialog from '../components/deals/DealHistoryDialog';
import ExternalLinkDialog from '../components/deals/ExternalLinkDialog';
import DealGuideDrawer from '../components/deals/DealGuideDrawer';
import type { ReferralProgram } from '../data/referralDeals';
import {
  formatEditionPeriod,
  resolveAllPrograms,
  sortProgramsForDisplay,
  type ResolvedProgram,
} from '../lib/deals/deal-utils';
import { useI18n } from '../context/I18nContext';
import type { Language } from '../i18n/types';
import { useReferralPrograms } from '../lib/deals/useReferralPrograms';
import { openExternalUrl } from '../lib/openExternalUrl';

const categoryIcons: Record<'bank' | 'other', React.ReactNode> = {
  bank: <AccountBalance fontSize="small" />,
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
  onOpenGuide,
}: {
  item: ResolvedProgram;
  lang: Language;
  onCopy: (url: string, title: string) => void;
  onOpenExternal: (url: string, title: string) => void;
  onViewHistory: () => void;
  onOpenGuide: () => void;
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
  const siteRebateChip =
    !isStale &&
    (program.siteRebateLabel?.[lang]?.trim() ||
      (program.siteRebateUsd != null ? tWithParams('deals.siteRebateChip', { amount: program.siteRebateUsd }) : ''));

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
              component="button"
              type="button"
              variant="subtitle1"
              fontWeight={700}
              onClick={onOpenGuide}
              sx={{
                color: isStale ? 'text.disabled' : 'text.primary',
                textDecoration: 'none',
                border: 0,
                background: 'none',
                cursor: 'pointer',
                p: 0,
                textAlign: 'left',
                '&:hover': { textDecoration: isStale ? 'none' : 'underline' },
              }}
            >
              {title}
            </Typography>
            {program.pinned ? (
              <Chip size="small" label={lang === 'zh' ? '置顶' : 'Pinned'} color="warning" sx={{ ml: 0.5 }} />
            ) : null}
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
        {siteRebateChip ? (
          <Chip size="small" label={siteRebateChip} color="secondary" variant="filled" disabled={isStale} />
        ) : null}
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
        {!isStale ? (
          <Button variant="outlined" size="small" onClick={onOpenGuide}>
            {t('deals.viewGuide')}
          </Button>
        ) : null}
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
  const { programs } = useReferralPrograms();
  const [category, setCategory] = useState<DealCategory | 'all'>('all');
  const [snack, setSnack] = useState<{ open: boolean; message: string; severity?: 'success' | 'info' }>({
    open: false,
    message: '',
    severity: 'success',
  });
  const [historyTarget, setHistoryTarget] = useState<ResolvedProgram | null>(null);
  const [guideProgram, setGuideProgram] = useState<ReferralProgram | null>(null);
  const [externalLink, setExternalLink] = useState<{ url: string; label: string } | null>(null);

  const allResolved = useMemo(() => resolveAllPrograms(programs), [programs]);

  const filtered = useMemo(() => {
    const base =
      category === 'all'
        ? allResolved
        : category === 'other'
          ? allResolved.filter((r) => r.program.category !== 'bank')
          : allResolved.filter((r) => r.program.category === category);
    return sortProgramsForDisplay(base);
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
    if (externalLink?.url) {
      openExternalUrl(externalLink.url);
    }
    setExternalLink(null);
  };

  return (
    <Box>
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
            icon={(categoryIcons[cat === 'bank' ? 'bank' : 'other']) as React.ReactElement}
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
            onOpenGuide={() => setGuideProgram(item.program)}
          />
        ))}
      </Box>

      <DealGuideDrawer
        open={Boolean(guideProgram)}
        onClose={() => setGuideProgram(null)}
        program={guideProgram}
      />

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
        <Link href="/deals/market" style={{ color: 'inherit' }}>
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
