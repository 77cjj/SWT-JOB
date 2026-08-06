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
  IconButton,
  Tooltip,
} from '@mui/material';
import {
  OpenInNew,
  AccountBalance,
  MoreHoriz,
  History,
  InfoOutlined,
  Edit,
} from '@mui/icons-material';
import {
  dealCategoryOrder,
  type DealCategory,
} from '../data/referralDeals';
import DealHistoryDialog from '../components/deals/DealHistoryDialog';
import ExternalLinkDialog from '../components/deals/ExternalLinkDialog';
import DealGuideDrawer from '../components/deals/DealGuideDrawer';
import DealQuickEditDialog from '../components/deals/DealQuickEditDialog';
import type { ReferralProgram } from '../data/referralDeals';
import {
  formatEditionPeriod,
  resolveAllPrograms,
  sortProgramsForDisplay,
  type ResolvedProgram,
} from '../lib/deals/deal-utils';
import { calcDealTotalUsd } from '../lib/deals/reward-total';
import { useI18n } from '../context/I18nContext';
import type { Language } from '../i18n/types';
import { pickBilingual } from '../i18n/bilingual';
import { useReferralPrograms } from '../lib/deals/useReferralPrograms';
import { useAuthStore } from '@/stores/authStore';

const categoryIcons: Record<'bank' | 'other', React.ReactNode> = {
  bank: <AccountBalance fontSize="small" />,
  other: <MoreHoriz fontSize="small" />,
};

function hasReferralLink(item: ResolvedProgram): boolean {
  const url = item.edition.referralUrl;
  return item.program.offerKind === 'refer' && Boolean(url) && url !== '#';
}

function DealCard({
  item,
  lang,
  isAdmin,
  onOpenExternal,
  onViewHistory,
  onOpenGuide,
  onEdit,
}: {
  item: ResolvedProgram;
  lang: Language;
  isAdmin: boolean;
  onOpenExternal: (url: string, title: string) => void;
  onViewHistory: () => void;
  onOpenGuide: () => void;
  onEdit: () => void;
}) {
  const { t, tWithParams } = useI18n();
  const { program, edition, status, isStale, daysUntilExpiry } = item;
  const title = pickBilingual(program.brandName, lang);
  const reward = pickBilingual(edition.reward, lang);
  const summary = pickBilingual(edition.summary, lang);
  const showReferral = hasReferralLink(item);
  const period = formatEditionPeriod(edition, lang);
  const officialUrl = edition.officialUrl;
  const totalMoney = calcDealTotalUsd({
    rewardText: reward,
    siteRebateUsd: program.siteRebateUsd,
  });

  return (
    <Box
      role="button"
      tabIndex={0}
      onClick={() => {
        if (!isStale) onOpenGuide();
      }}
      onKeyDown={(e) => {
        if (isStale) return;
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onOpenGuide();
        }
      }}
      sx={{
        position: 'relative',
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
        overflow: 'hidden',
        cursor: isStale ? 'default' : 'pointer',
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
      {isStale ? (
        <Box
          sx={{
            position: 'absolute',
            top: 10,
            right: 10,
            zIndex: 1,
            px: 1.25,
            py: 0.4,
            borderRadius: 1.5,
            bgcolor: 'action.disabledBackground',
            color: 'text.secondary',
            border: 1,
            borderColor: 'divider',
          }}
        >
          <Typography variant="caption" fontWeight={800} sx={{ letterSpacing: '0.06em' }}>
            {t('deals.expiredBadge')}
          </Typography>
        </Box>
      ) : totalMoney.total != null ? (
        <Box
          sx={{
            position: 'absolute',
            top: 10,
            right: 10,
            zIndex: 1,
            px: 1.25,
            py: 0.5,
            borderRadius: 1.5,
            background: 'linear-gradient(135deg, #f59e0b 0%, #ef4444 55%, #ec4899 100%)',
            color: '#fff',
            boxShadow: '0 6px 16px rgba(239,68,68,0.35)',
          }}
        >
          <Typography variant="caption" sx={{ display: 'block', opacity: 0.9, lineHeight: 1.1, fontWeight: 600 }}>
            {t('deals.totalTake')}
          </Typography>
          <Typography variant="h6" fontWeight={900} sx={{ lineHeight: 1.1, letterSpacing: '-0.02em' }}>
            ${totalMoney.total.toFixed(totalMoney.total % 1 === 0 ? 0 : 1)}
          </Typography>
        </Box>
      ) : null}

      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          gap: 1,
          pr: isStale || totalMoney.total != null ? 7 : 0,
        }}
      >
        <Box sx={{ minWidth: 0, flex: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, mb: 0.25 }}>
            <Typography
              variant="subtitle1"
              fontWeight={700}
              sx={{ color: isStale ? 'text.disabled' : 'text.primary' }}
            >
              {title}
            </Typography>
            {program.pinned ? (
              <Chip size="small" label={lang === 'zh' ? '置顶' : 'Pinned'} color="warning" />
            ) : null}
            {officialUrl ? (
              <Tooltip title={t('deals.officialInfo')}>
                <IconButton
                  size="small"
                  aria-label={t('deals.officialInfo')}
                  onClick={(e) => {
                    e.stopPropagation();
                    onOpenExternal(officialUrl, t('deals.officialTerms'));
                  }}
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
            {isAdmin ? (
              <Tooltip title="编辑项目">
                <IconButton
                  size="small"
                  aria-label="编辑项目"
                  onClick={(e) => {
                    e.stopPropagation();
                    onEdit();
                  }}
                  sx={{ p: 0.35 }}
                >
                  <Edit sx={{ fontSize: 18 }} />
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

      <Typography variant="caption" color={isStale ? 'text.disabled' : 'text.secondary'}>
        {period}
      </Typography>

      <Typography variant="body2" color={isStale ? 'text.disabled' : 'text.secondary'} sx={{ lineHeight: 1.55 }}>
        {summary}
      </Typography>

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

      <Box
        sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 'auto', pt: 0.5 }}
        onClick={(e) => e.stopPropagation()}
      >
        {!isStale && showReferral ? (
          <Button
            variant="contained"
            size="small"
            startIcon={<OpenInNew />}
            onClick={() => onOpenExternal(edition.referralUrl!, title)}
          >
            {t('deals.openReferralLink')}
          </Button>
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
        {isAdmin ? (
          <Button variant="outlined" size="small" startIcon={<Edit />} onClick={onEdit}>
            编辑
          </Button>
        ) : null}
      </Box>
    </Box>
  );
}

export default function DealsPage() {
  const { t, tWithParams, language } = useI18n();
  const { programs, refresh } = useReferralPrograms();
  const user = useAuthStore((s) => s.user);
  const isAdmin = user?.role === 'admin';
  const [category, setCategory] = useState<DealCategory | 'all'>('all');
  const [snack, setSnack] = useState<{ open: boolean; message: string; severity?: 'success' | 'info' }>({
    open: false,
    message: '',
    severity: 'success',
  });
  const [historyTarget, setHistoryTarget] = useState<ResolvedProgram | null>(null);
  const [guideProgram, setGuideProgram] = useState<ReferralProgram | null>(null);
  const [editProgram, setEditProgram] = useState<ReferralProgram | null>(null);
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

  const handleConfirmExternal = () => {
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
            isAdmin={isAdmin}
            onOpenExternal={(url, label) => setExternalLink({ url, label })}
            onViewHistory={() => setHistoryTarget(item)}
            onOpenGuide={() => setGuideProgram(item.program)}
            onEdit={() => setEditProgram(item.program)}
          />
        ))}
      </Box>

      <DealGuideDrawer
        open={Boolean(guideProgram)}
        onClose={() => setGuideProgram(null)}
        program={guideProgram}
        onCopied={(ok) =>
          setSnack({
            open: true,
            severity: ok ? 'success' : 'info',
            message: ok
              ? tWithParams('deals.copied', { title: guideProgram?.brandName.zh || '' })
              : t('deals.copyFailed'),
          })
        }
      />

      <DealQuickEditDialog
        open={Boolean(editProgram)}
        program={editProgram}
        onClose={() => setEditProgram(null)}
        onSaved={async () => {
          setSnack({ open: true, severity: 'success', message: '已保存项目' });
          await refresh();
        }}
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
        copyOnConfirm
        onCopied={(ok) =>
          setSnack({
            open: true,
            severity: ok ? 'success' : 'info',
            message: ok
              ? tWithParams('deals.copied', { title: externalLink?.label ?? '' })
              : t('deals.copyFailed'),
          })
        }
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
