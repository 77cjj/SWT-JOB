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
  CurrencyExchange,
  ShoppingBag,
  Apps,
  Science,
  PhoneAndroid,
  CheckCircleOutline,
  WarningAmber,
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
  resolveProgramCategory,
  type ResolvedProgram,
} from '../lib/deals/deal-utils';
import { resolveDealCornerBadge } from '../lib/deals/reward-badge';
import { useI18n } from '../context/I18nContext';
import type { Language } from '../i18n/types';
import { pickBilingual } from '../i18n/bilingual';
import { useReferralPrograms } from '../lib/deals/useReferralPrograms';
import { useAuthStore } from '@/stores/authStore';
import DealsHubHeader from '../components/deals/DealsHubHeader';

const categoryIcons: Record<DealCategory, React.ReactNode> = {
  bank: <AccountBalance fontSize="small" />,
  remittance: <CurrencyExchange fontSize="small" />,
  cashback: <ShoppingBag fontSize="small" />,
  app: <Apps fontSize="small" />,
  study: <Science fontSize="small" />,
  mobile: <PhoneAndroid fontSize="small" />,
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
  const guideBrief = (
    (edition.cardGuideBrief ? pickBilingual(edition.cardGuideBrief, lang) : '') ||
    pickBilingual(edition.summary, lang)
  ).trim();
  const extraBrief = (
    (edition.cardExtraBrief ? pickBilingual(edition.cardExtraBrief, lang) : '') ||
    (program.siteRebateUsd != null &&
    program.siteRebateUsd > 0 &&
    program.siteRebateLabel
      ? pickBilingual(program.siteRebateLabel, lang)
      : '')
  ).trim();
  const showReferral = hasReferralLink(item);
  const period = formatEditionPeriod(edition, lang);
  const officialUrl = edition.officialUrl;
  const cornerBadge = resolveDealCornerBadge(program);
  const decision = edition.decisionProfile;
  const showAmountBadge =
    !isStale &&
    cornerBadge != null &&
    (cornerBadge.kind === 'cash' || cornerBadge.kind === 'credit');
  const amountValue =
    showAmountBadge && (cornerBadge.kind === 'cash' || cornerBadge.kind === 'credit')
      ? cornerBadge.amount
      : null;

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
        borderRadius: 2.5,
        p: 2.25,
        display: 'flex',
        flexDirection: 'column',
        gap: 1.25,
        height: '100%',
        background: (theme) =>
          isStale
            ? theme.palette.action.hover
            : theme.palette.mode === 'dark'
              ? 'linear-gradient(180deg, rgba(99,102,241,.08), rgba(23,23,23,1) 28%)'
              : 'linear-gradient(180deg, rgba(238,242,255,.72), #fff 28%)',
        transition: 'transform .2s ease, box-shadow .2s ease, border-color .2s ease, opacity .2s',
        overflow: 'hidden',
        cursor: isStale ? 'default' : 'pointer',
        ...(isStale
          ? {
              opacity: 0.52,
              filter: 'grayscale(0.85)',
              bgcolor: 'action.hover',
              '&:hover': { boxShadow: 0 },
            }
          : {
              '&:hover': {
                boxShadow: '0 18px 45px rgba(15,23,42,.10)',
                borderColor: 'primary.light',
                transform: 'translateY(-3px)',
              },
            }),
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
      ) : showAmountBadge && amountValue != null ? (
        <Box
          sx={{
            position: 'absolute',
            top: 10,
            right: 10,
            zIndex: 1,
            px: 1.25,
            py: 0.5,
            borderRadius: 1.5,
            background:
              cornerBadge?.kind === 'credit'
                ? 'linear-gradient(135deg, #0ea5e9 0%, #6366f1 100%)'
                : 'linear-gradient(135deg, #f59e0b 0%, #ef4444 55%, #ec4899 100%)',
            color: '#fff',
            boxShadow: '0 6px 16px rgba(239,68,68,0.35)',
          }}
        >
          <Typography variant="caption" sx={{ display: 'block', opacity: 0.9, lineHeight: 1.1, fontWeight: 600 }}>
            {t(cornerBadge!.labelKey)}
          </Typography>
          <Typography variant="h6" fontWeight={900} sx={{ lineHeight: 1.1, letterSpacing: '-0.02em' }}>
            ${amountValue.toFixed(amountValue % 1 === 0 ? 0 : 1)}
          </Typography>
        </Box>
      ) : cornerBadge?.kind === 'coupon' && !isStale ? (
        <Box
          sx={{
            position: 'absolute',
            top: 10,
            right: 10,
            zIndex: 1,
            px: 1.25,
            py: 0.45,
            borderRadius: 1.5,
            bgcolor: 'action.hover',
            color: 'text.secondary',
            border: 1,
            borderColor: 'divider',
          }}
        >
          <Typography variant="caption" fontWeight={700}>
            {t('deals.highlightCoupon')}
          </Typography>
        </Box>
      ) : null}

      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          gap: 1,
          pr: isStale || showAmountBadge || cornerBadge?.kind === 'coupon' ? 7 : 0,
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

      {decision && !isStale ? (
        <Box
          sx={{
            p: 1.25,
            borderRadius: 1.75,
            bgcolor: 'action.hover',
            border: 1,
            borderColor: 'divider',
          }}
        >
          <Typography variant="caption" color="primary.main" fontWeight={800}>
            {t('deals.bestFor')}
          </Typography>
          <Typography variant="body2" fontWeight={650} sx={{ mt: 0.2, lineHeight: 1.45 }}>
            {pickBilingual(decision.bestFor, lang)}
          </Typography>
          <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 1, mt: 1 }}>
            {decision.facts.slice(0, 4).map((fact) => (
              <Box key={`${fact.label.zh}-${fact.value.zh}`} sx={{ minWidth: 0 }}>
                <Typography variant="caption" color="text.secondary" display="block">
                  {pickBilingual(fact.label, lang)}
                </Typography>
                <Typography variant="caption" fontWeight={750} sx={{ lineHeight: 1.35 }}>
                  {pickBilingual(fact.value, lang)}
                </Typography>
              </Box>
            ))}
          </Box>
        </Box>
      ) : null}

      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.75 }}>
        <Box>
          <Typography
            variant="caption"
            fontWeight={700}
            sx={{ color: isStale ? 'text.disabled' : 'text.secondary', letterSpacing: '0.02em' }}
          >
            {t('deals.cardGuideLabel')}
          </Typography>
          <Typography
            variant="body2"
            color={isStale ? 'text.disabled' : 'text.primary'}
            sx={{ lineHeight: 1.5, mt: 0.15 }}
          >
            {guideBrief}
          </Typography>
        </Box>
        {extraBrief ? (
          <Box>
            <Typography
              variant="caption"
              fontWeight={700}
              sx={{ color: isStale ? 'text.disabled' : 'warning.dark', letterSpacing: '0.02em' }}
            >
              {t('deals.cardExtraLabel')}
            </Typography>
            <Typography
              variant="body2"
              color={isStale ? 'text.disabled' : 'text.secondary'}
              sx={{ lineHeight: 1.5, mt: 0.15 }}
            >
              {extraBrief}
            </Typography>
          </Box>
        ) : null}
      </Box>

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
      {decision && !isStale ? (
        <Typography variant="caption" color="text.secondary" sx={{ mt: -0.25 }}>
          {tWithParams('deals.verifiedAt', { date: decision.verifiedAt })} ·{' '}
          {decision.evidence === 'official' ? t('deals.evidenceOfficial') : t('deals.evidenceMixed')}
        </Typography>
      ) : null}
    </Box>
  );
}

export default function DealsPage() {
  const { t, tWithParams, language } = useI18n();
  const { programs, refresh } = useReferralPrograms();
  const user = useAuthStore((s) => s.user);
  const isAdmin = user?.role === 'admin';
  const [category, setCategory] = useState<DealCategory | 'all'>('all');
  const [viewMode, setViewMode] = useState<'list' | 'cards'>('cards');
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
  const activeCount = allResolved.filter((item) => !item.isStale).length;
  const staleCount = allResolved.length - activeCount;
  const categoryCounts = useMemo(() => {
    const counts = new Map<DealCategory, number>();
    allResolved.forEach((item) => {
      const key = resolveProgramCategory(item.program);
      counts.set(key, (counts.get(key) ?? 0) + 1);
    });
    return counts;
  }, [allResolved]);

  const filtered = useMemo(() => {
    const base =
      category === 'all'
        ? allResolved
        : allResolved.filter((r) => resolveProgramCategory(r.program) === category);
    return sortProgramsForDisplay(base);
  }, [allResolved, category]);

  const handleConfirmExternal = () => {
    setExternalLink(null);
  };

  return (
    <Box>
      <DealsHubHeader active="official" activeCount={activeCount} staleCount={staleCount} />

      <Tabs
        value={category}
        onChange={(_, v) => setCategory(v)}
        variant="scrollable"
        scrollButtons="auto"
        sx={{ mb: 1.5, borderBottom: 1, borderColor: 'divider', minHeight: 40 }}
      >
        <Tab value="all" label={`${t('common.all')} ${allResolved.length}`} sx={{ minHeight: 40, py: 1 }} />
        {dealCategoryOrder.map((cat) => (
          <Tab
            key={cat}
            value={cat}
            icon={(categoryIcons[cat] ?? categoryIcons.other) as React.ReactElement}
            iconPosition="start"
            label={`${t(`deals.categories.${cat}`)} ${categoryCounts.get(cat) ?? 0}`}
            sx={{ minHeight: 40, py: 1 }}
          />
        ))}
      </Tabs>

      {category === 'remittance' ? (
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', md: 'minmax(0,1.7fr) minmax(260px,.8fr)' },
            gap: 2,
            p: { xs: 2, md: 2.5 },
            mb: 2,
            borderRadius: 2.5,
            border: 1,
            borderColor: 'divider',
            bgcolor: 'action.hover',
          }}
        >
          <Box>
            <Typography variant="h6" fontWeight={800}>
              {t('deals.remittanceGuideTitle')}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.75, lineHeight: 1.65 }}>
              {t('deals.remittanceGuideBody')}
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.75 }}>
            {[t('deals.remittanceCheck1'), t('deals.remittanceCheck2'), t('deals.remittanceCheck3')].map((label) => (
              <Box key={label} sx={{ display: 'flex', gap: 0.75, alignItems: 'flex-start' }}>
                <CheckCircleOutline sx={{ fontSize: 18, color: 'success.main', mt: 0.1 }} />
                <Typography variant="body2">{label}</Typography>
              </Box>
            ))}
          </Box>
          <Box sx={{ gridColumn: { md: '1 / -1' }, display: 'flex', gap: 0.75, alignItems: 'flex-start' }}>
            <WarningAmber sx={{ fontSize: 17, color: 'warning.main', mt: 0.1 }} />
            <Typography variant="caption" color="text.secondary">
              {t('deals.remittanceDynamicHint')}
            </Typography>
          </Box>
        </Box>
      ) : null}

      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 1,
          mb: 1.5,
          flexWrap: 'wrap',
        }}
      >
        <Typography variant="body2" color="text.secondary">
          {t('deals.clickCardHint')}
        </Typography>
        <Box sx={{ display: 'inline-flex', border: 1, borderColor: 'divider', borderRadius: 999, p: 0.25 }}>
          <Button
            size="small"
            onClick={() => setViewMode('list')}
            sx={{
              borderRadius: 999,
              px: 1.5,
              minWidth: 0,
              bgcolor: viewMode === 'list' ? 'text.primary' : 'transparent',
              color: viewMode === 'list' ? 'background.paper' : 'text.secondary',
              '&:hover': { bgcolor: viewMode === 'list' ? 'text.primary' : 'action.hover' },
            }}
          >
            {language === 'zh' ? '列表' : 'List'}
          </Button>
          <Button
            size="small"
            onClick={() => setViewMode('cards')}
            sx={{
              borderRadius: 999,
              px: 1.5,
              minWidth: 0,
              bgcolor: viewMode === 'cards' ? 'text.primary' : 'transparent',
              color: viewMode === 'cards' ? 'background.paper' : 'text.secondary',
              '&:hover': { bgcolor: viewMode === 'cards' ? 'text.primary' : 'action.hover' },
            }}
          >
            {language === 'zh' ? '卡片' : 'Cards'}
          </Button>
        </Box>
      </Box>

      {viewMode === 'list' ? (
        <Box sx={{ borderTop: 1, borderColor: 'divider' }}>
          {filtered.map((item) => {
            const title = pickBilingual(item.program.brandName, language);
            const reward = pickBilingual(item.edition.reward, language);
            const guideBrief = (
              (item.edition.cardGuideBrief
                ? pickBilingual(item.edition.cardGuideBrief, language)
                : '') || pickBilingual(item.edition.summary, language)
            ).trim();
            const cornerBadge = resolveDealCornerBadge(item.program);
            const amount =
              !item.isStale &&
              cornerBadge &&
              (cornerBadge.kind === 'cash' || cornerBadge.kind === 'credit')
                ? cornerBadge.amount
                : null;
            return (
              <Box
                key={item.program.id}
                role="button"
                tabIndex={0}
                onClick={() => {
                  if (!item.isStale) setGuideProgram(item.program);
                }}
                onKeyDown={(e) => {
                  if (item.isStale) return;
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    setGuideProgram(item.program);
                  }
                }}
                sx={{
                  display: 'grid',
                  gridTemplateColumns: {
                    xs: '1fr',
                    sm: 'minmax(0, 1.2fr) minmax(0, 1.6fr) auto',
                  },
                  gap: { xs: 0.75, sm: 2 },
                  alignItems: 'center',
                  py: 1.75,
                  borderBottom: 1,
                  borderColor: 'divider',
                  cursor: item.isStale ? 'default' : 'pointer',
                  opacity: item.isStale ? 0.55 : 1,
                  transition: 'background-color .15s ease',
                  '&:hover': { bgcolor: item.isStale ? 'transparent' : 'action.hover' },
                }}
              >
                <Box sx={{ minWidth: 0 }}>
                  <Typography
                    sx={{
                      fontFamily: 'var(--font-display, "Space Grotesk", sans-serif)',
                      fontWeight: 700,
                      fontSize: '1.05rem',
                    }}
                  >
                    {title}
                  </Typography>
                  <Typography variant="body2" color="primary.main" fontWeight={700}>
                    {reward}
                  </Typography>
                </Box>
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{
                    display: { xs: '-webkit-box', sm: 'block' },
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden',
                    lineHeight: 1.5,
                  }}
                >
                  {guideBrief}
                </Typography>
                <Box sx={{ textAlign: { sm: 'right' }, flexShrink: 0 }}>
                  {amount != null ? (
                    <Typography fontWeight={800} color="error.main">
                      ${amount.toFixed(amount % 1 === 0 ? 0 : 1)}
                    </Typography>
                  ) : item.isStale ? (
                    <Chip size="small" label={t('deals.expiredBadge')} />
                  ) : null}
                  <Typography variant="caption" color="text.secondary" display="block">
                    {formatEditionPeriod(item.edition, language)}
                  </Typography>
                </Box>
              </Box>
            );
          })}
        </Box>
      ) : (
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
      )}

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
