import { useCallback, useEffect, useMemo, useState, type Dispatch, type SetStateAction } from 'react';
import {
  Box,
  Typography,
  Tabs,
  Tab,
  Alert,
  Button,
  Chip,
  Card,
  CardContent,
  CardActions,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Snackbar,
  LinearProgress,
  Divider,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  Autocomplete,
  FormControlLabel,
  Checkbox,
  Drawer,
  Avatar,
} from '@mui/material';
import {
  AccountBalanceWallet,
  CardGiftcard,
  WorkOutline,
  Add,
  Gavel,
  Storefront,
  VerifiedUser,
  Shield,
} from '@mui/icons-material';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useAuthStore } from '@/stores/authStore';
import { useMarketplaceApi } from '../hooks/useMarketplaceApi';
import { useI18n } from '../context/I18nContext';
import { UserProfileLink } from '../components/member/UserProfileLink';
import type {
  ListingType,
  MarketListing,
  MarketOrder,
  OrderStatus,
  UserMarketStats,
} from '../lib/marketplace/types';
import { getSellerCreditTier, listingTotalEscrow, type SellerCreditTier } from '../lib/marketplace/credit';
import { US_STATE_OPTIONS } from '../lib/member/profile';
import { referralPrograms } from '../data/referralDeals';
import { formatFetchError } from '../lib/formatFetchError';

type ListingFormState = {
  title: string;
  description: string;
  brand: string;
  referLink: string;
  referCode: string;
  platformReward: string;
  buyerCashback: string;
  completionCriteria: string;
  requiresSsn: boolean;
  minDepositUsd: string;
  unlimitedSlots: boolean;
  sellerContactHint: string;
  state: string;
  city: string;
  jobTitle: string;
  employerHint: string;
  intelFee: string;
  intelPreview: string;
  intelDetail: string;
  maxSlots: string;
};

const emptyListingForm = (): ListingFormState => ({
  title: '',
  description: '',
  brand: '',
  referLink: '',
  referCode: '',
  platformReward: '',
  buyerCashback: '',
  completionCriteria: '',
  requiresSsn: false,
  minDepositUsd: '',
  unlimitedSlots: false,
  sellerContactHint: '',
  state: '',
  city: '',
  jobTitle: '',
  employerHint: '',
  intelFee: '',
  intelPreview: '',
  intelDetail: '',
  maxSlots: '5',
});

type MainTab = 'refer' | 'job_intel' | 'orders' | 'wallet' | 'my_listings';

const ORDER_STATUS_COLOR: Record<OrderStatus, 'default' | 'warning' | 'success' | 'error' | 'info'> = {
  claimed: 'info',
  proof_submitted: 'warning',
  seller_confirmed: 'info',
  completed: 'success',
  disputed: 'error',
  refunded: 'default',
  cancelled: 'default',
};

function fmtUsd(n: number) {
  return `$${n.toFixed(2)}`;
}

function listingToForm(item: MarketListing): ListingFormState {
  return {
    title: item.title || '',
    description: item.description || '',
    brand: item.brand || '',
    referLink: item.referLink || '',
    referCode: item.referCode || '',
    platformReward: item.platformReward != null ? String(item.platformReward) : '',
    buyerCashback: item.buyerCashback != null ? String(item.buyerCashback) : '',
    completionCriteria: item.completionCriteria || '',
    requiresSsn: Boolean(item.requiresSsn),
    minDepositUsd: item.minDepositUsd != null ? String(item.minDepositUsd) : '',
    unlimitedSlots: Boolean(item.unlimitedSlots),
    sellerContactHint: item.sellerContactHint || '',
    state: item.state || '',
    city: item.city || '',
    jobTitle: item.jobTitle || '',
    employerHint: item.employerHint || '',
    intelFee: item.intelFee != null ? String(item.intelFee) : '',
    intelPreview: item.intelPreview || '',
    intelDetail: item.intelDetail || '',
    maxSlots: item.maxSlots > 0 ? String(item.maxSlots) : '5',
  };
}

export default function MarketplacePage({ embedded = false }: { embedded?: boolean }) {
  const { t, tWithParams, language } = useI18n();
  const router = useRouter();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const authUser = useAuthStore((s) => s.user);
  const {
    fetchListings,
    fetchOrders,
    fetchWallet,
    createListing,
    updateListingStatus,
    updateListingSlotsUsed,
    updateListing,
    claimOrder,
    orderAction,
  } = useMarketplaceApi();

  const [tab, setTab] = useState<MainTab>('refer');
  const [listings, setListings] = useState<MarketListing[]>([]);
  const [orders, setOrders] = useState<(MarketOrder & { intelDetail?: string })[]>([]);
  const [loading, setLoading] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [createType, setCreateType] = useState<ListingType>('refer');
  const [orderDialog, setOrderDialog] = useState<(MarketOrder & { intelDetail?: string }) | null>(null);
  const [proofNote, setProofNote] = useState('');
  const [disputeReason, setDisputeReason] = useState('');
  const [snack, setSnack] = useState<{ open: boolean; message: string; severity: 'success' | 'error' | 'info' }>({
    open: false,
    message: '',
    severity: 'success',
  });

  const [form, setForm] = useState<ListingFormState>(emptyListingForm);
  const [referSort, setReferSort] = useState<'newest' | 'cashback' | 'rating' | 'escrow'>('newest');
  const [filterSsn, setFilterSsn] = useState<'all' | 'yes' | 'no'>('all');
  const [filterMinDeposit, setFilterMinDeposit] = useState('');
  const [filterBrand, setFilterBrand] = useState<string | null>(null);
  const [filterMinRating, setFilterMinRating] = useState<'all' | '3' | '4' | '4.5'>('all');
  const [detailListing, setDetailListing] = useState<MarketListing | null>(null);
  const [hideSoldOut, setHideSoldOut] = useState(true);

  const refreshListings = useCallback(async () => {
    const type = tab === 'refer' || tab === 'job_intel' ? tab : undefined;
    const mine = tab === 'my_listings';
    const data = await fetchListings({ type, mine });
    setListings(data);
  }, [fetchListings, tab]);

  const refreshOrders = useCallback(async () => {
    const data = await fetchOrders('all');
    setOrders(data);
  }, [fetchOrders]);

  const refreshWallet = useCallback(async () => {
    if (!isAuthenticated) return;
    try {
      await fetchWallet();
    } catch {
      // ignore — used to sync after claim/create; UI lives on profile
    }
  }, [fetchWallet, isAuthenticated]);

  useEffect(() => {
    if (!router.isReady) return;
    const qTab = router.query.tab;
    if (qTab === 'wallet' || qTab === 'orders' || qTab === 'refer' || qTab === 'job_intel' || qTab === 'my_listings') {
      setTab(qTab as MainTab);
    }
    const depositStatus = router.query.deposit;
    if (depositStatus === 'success') {
      setSnack({ open: true, message: t('marketplace.depositStripeSuccess'), severity: 'success' });
      if (authUser?.userId) {
        void router.replace(`/u/${authUser.userId}?tab=wallet&deposit=success`);
      } else {
        void refreshWallet();
      }
    } else if (depositStatus === 'cancel') {
      setSnack({ open: true, message: t('marketplace.depositStripeCancel'), severity: 'info' });
    }
  }, [router.isReady, router.query.tab, router.query.deposit, t, refreshWallet, authUser?.userId, router]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);

    const run = async () => {
      try {
        if (tab === 'orders') {
          const data = await fetchOrders('all');
          if (!cancelled) setOrders(data);
        } else if (tab === 'wallet') {
          // 钱包已迁至个人主页，此处仅展示引导
        } else {
          const type = tab === 'refer' || tab === 'job_intel' ? tab : undefined;
          const mine = tab === 'my_listings';
          const data = await fetchListings({ type, mine });
          if (!cancelled) setListings(data);
        }
      } catch (e) {
        if (!cancelled) {
          setSnack({
            open: true,
            message: formatFetchError(e, t('common.networkError')),
            severity: 'error',
          });
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    void run();
    return () => {
      cancelled = true;
    };
  }, [tab, isAuthenticated, fetchListings, fetchOrders, t]);

  const requireLogin = () => {
    if (!isAuthenticated) {
      useAuthStore.getState().openLoginDialog(t('marketplace.loginRequired'));
      return false;
    }
    return true;
  };

  const buildListingBody = () =>
    createType === 'refer'
      ? {
          type: 'refer' as const,
          title: form.title,
          description: form.description,
          brand: form.brand,
          referLink: form.referLink,
          referCode: form.referCode,
          platformReward: form.platformReward ? Number(form.platformReward) : undefined,
          buyerCashback: Number(form.buyerCashback),
          completionCriteria: form.completionCriteria,
          requiresSsn: form.requiresSsn,
          minDepositUsd: form.minDepositUsd ? Number(form.minDepositUsd) : undefined,
          unlimitedSlots: form.unlimitedSlots,
          sellerContactHint: form.sellerContactHint || undefined,
          maxSlots: form.unlimitedSlots ? undefined : Number(form.maxSlots),
        }
      : {
          type: 'job_intel' as const,
          title: form.title,
          description: form.description,
          state: form.state,
          city: form.city,
          jobTitle: form.jobTitle,
          employerHint: form.employerHint,
          intelFee: Number(form.intelFee),
          intelPreview: form.intelPreview,
          intelDetail: form.intelDetail,
          unlimitedSlots: form.unlimitedSlots,
          maxSlots: form.unlimitedSlots ? undefined : Number(form.maxSlots),
        };

  const handleCreate = async () => {
    if (!requireLogin()) return;
    try {
      if (!form.unlimitedSlots) {
        const slots = Number(form.maxSlots);
        if (!Number.isFinite(slots) || slots < 1 || slots > 10000) {
          setSnack({ open: true, message: t('marketplace.slotsRangeHint'), severity: 'error' });
          return;
        }
      }
      const body = buildListingBody();
      if (editingId) {
        await updateListing(editingId, body);
        setCreateOpen(false);
        setEditingId(null);
        setForm(emptyListingForm());
        setSnack({ open: true, message: t('marketplace.editSuccess'), severity: 'success' });
        await refreshListings();
        return;
      }
      await createListing(body);
      setCreateOpen(false);
      setForm(emptyListingForm());
      setSnack({ open: true, message: t('marketplace.createSuccess'), severity: 'success' });
      setTab('my_listings');
    } catch (e) {
      setSnack({ open: true, message: formatFetchError(e, t('common.networkError')), severity: 'error' });
    }
  };

  const openEditListing = (item: MarketListing) => {
    if (!requireLogin()) return;
    setEditingId(item.id);
    setCreateType(item.type);
    setForm(listingToForm(item));
    setCreateOpen(true);
  };

  const handleClaim = async (listingId: string) => {
    if (!requireLogin()) return;
    try {
      const order = await claimOrder(listingId);
      setSnack({ open: true, message: t('marketplace.claimSuccess'), severity: 'success' });
      setOrderDialog(order);
      setTab('orders');
      await refreshOrders();
      await refreshWallet();
    } catch (e) {
      setSnack({ open: true, message: formatFetchError(e, t('common.networkError')), severity: 'error' });
    }
  };

  const handleOrderAction = async (
    orderId: string,
    action: 'submit_proof' | 'confirm' | 'dispute' | 'cancel' | 'admin_resolve',
    extra?: { winner?: 'buyer' | 'seller' },
  ) => {
    try {
      const order = await orderAction(orderId, action, {
        proofNote,
        disputeReason,
        winner: extra?.winner,
      });
      setOrderDialog(order);
      setProofNote('');
      setDisputeReason('');
      await refreshOrders();
      await refreshWallet();
      setSnack({ open: true, message: t('marketplace.actionSuccess'), severity: 'success' });
    } catch (e) {
      setSnack({ open: true, message: formatFetchError(e, t('common.networkError')), severity: 'error' });
    }
  };

  const brandOptions = useMemo(() => {
    const fromPrograms = referralPrograms.flatMap((p) => [
      p.brandName.zh,
      p.brandName.en,
      p.id,
    ]);
    const fromListings = listings.map((l) => l.brand).filter((b): b is string => Boolean(b));
    return [...new Set([...fromPrograms, ...fromListings])].sort((a, b) =>
      a.localeCompare(b, language === 'zh' ? 'zh-CN' : 'en'),
    );
  }, [listings, language]);

  const visibleListings = useMemo(() => {
    let items = [...listings];
    if (tab === 'refer') {
      if (filterBrand) {
        items = items.filter((l) => l.brand === filterBrand);
      }
      if (filterSsn === 'yes') items = items.filter((l) => l.requiresSsn);
      if (filterSsn === 'no') items = items.filter((l) => !l.requiresSsn);
      const minDep = Number(filterMinDeposit);
      if (Number.isFinite(minDep) && minDep > 0) {
        items = items.filter((l) => (l.minDepositUsd ?? 0) <= minDep);
      }
      if (filterMinRating !== 'all') {
        const min = Number(filterMinRating);
        items = items.filter((l) => (l.sellerStats?.rating ?? 5) >= min);
      }
      if (hideSoldOut) {
        items = items.filter(
          (l) => l.unlimitedSlots || l.maxSlots <= 0 || l.slotsUsed < l.maxSlots,
        );
      }
      if (referSort === 'cashback') {
        items.sort(
          (a, b) =>
            (b.buyerCashback ?? 0) + (b.platformReward ?? 0) -
            ((a.buyerCashback ?? 0) + (a.platformReward ?? 0)),
        );
      } else if (referSort === 'rating') {
        items.sort(
          (a, b) => (b.sellerStats?.rating ?? 5) - (a.sellerStats?.rating ?? 5),
        );
      } else if (referSort === 'escrow') {
        items.sort((a, b) => listingTotalEscrow(b) - listingTotalEscrow(a));
      } else {
        items.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
      }
    }
    return items;
  }, [listings, tab, filterBrand, filterSsn, filterMinDeposit, filterMinRating, hideSoldOut, referSort]);

  const showLoadingBar =
    loading &&
    (tab === 'orders' ? orders.length === 0 : tab === 'wallet' ? false : listings.length === 0);

  return (
    <Box>
      {!embedded ? (
        <Box
          sx={{
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'space-between',
            gap: 2,
            mb: 2,
          }}
        >
          <Box>
            <Typography variant="h4" fontWeight={700} sx={{ mb: 0.5 }}>
              {t('marketplace.title')}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {t('marketplace.subtitleShort')}
            </Typography>
          </Box>
          <Button
            variant="contained"
            size="small"
            startIcon={<Add />}
            sx={{ flexShrink: 0, mt: 0.5 }}
            onClick={() => {
              if (!requireLogin()) return;
              setEditingId(null);
              setForm(emptyListingForm());
              setCreateOpen(true);
            }}
          >
            {t('marketplace.createListing')}
          </Button>
        </Box>
      ) : (
        <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 1.5 }}>
          <Button
            variant="contained"
            size="small"
            startIcon={<Add />}
            onClick={() => {
              if (!requireLogin()) return;
              setEditingId(null);
              setForm(emptyListingForm());
              setCreateOpen(true);
            }}
          >
            {t('marketplace.createListing')}
          </Button>
        </Box>
      )}

      <Alert severity="info" sx={{ mb: 2 }}>
        <Typography fontWeight={700} sx={{ mb: 0.5 }}>
          {t('marketplace.escrowPitchTitle')}
        </Typography>
        <Typography variant="body2">{t('marketplace.escrowPitchBody')}</Typography>
      </Alert>

      <Tabs
        data-tour="market-tabs"
        value={tab}
        onChange={(_, v) => setTab(v)}
        variant="scrollable"
        scrollButtons="auto"
        sx={{ mb: 2, borderBottom: 1, borderColor: 'divider', minHeight: 40 }}
      >
        <Tab value="refer" icon={<CardGiftcard />} iconPosition="start" label={t('marketplace.tabs.refer')} sx={{ minHeight: 40 }} />
        <Tab value="job_intel" icon={<WorkOutline />} iconPosition="start" label={t('marketplace.tabs.jobIntel')} sx={{ minHeight: 40 }} />
        <Tab value="my_listings" icon={<Storefront />} iconPosition="start" label={t('marketplace.tabs.myListings')} sx={{ minHeight: 40 }} />
        <Tab value="orders" icon={<Gavel />} iconPosition="start" label={t('marketplace.tabs.orders')} sx={{ minHeight: 40 }} />
        <Tab value="wallet" icon={<AccountBalanceWallet />} iconPosition="start" label={t('marketplace.tabs.wallet')} sx={{ minHeight: 40 }} />
      </Tabs>

      {showLoadingBar ? <LinearProgress sx={{ mb: 2 }} /> : null}

      {tab === 'wallet' ? (
        <Alert severity="info" sx={{ maxWidth: 560 }}>
          <Typography fontWeight={600} sx={{ mb: 1 }}>
            {t('marketplace.walletMovedHint')}
          </Typography>
          {authUser?.userId ? (
            <Button
              component={Link}
              href={`/u/${authUser.userId}?tab=wallet`}
              variant="contained"
              size="small"
            >
              {t('marketplace.goProfileWallet')}
            </Button>
          ) : (
            <Button
              size="small"
              variant="outlined"
              onClick={() => useAuthStore.getState().openLoginDialog(t('marketplace.loginRequired'))}
            >
              {t('marketplace.loginRequired')}
            </Button>
          )}
        </Alert>
      ) : null}

      {tab === 'orders' ? (
        <OrdersSection
          orders={orders}
          onSelect={setOrderDialog}
          t={t}
        />
      ) : null}

      {(tab === 'refer' || tab === 'job_intel' || tab === 'my_listings') && (
        <>
          {tab === 'refer' ? (
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1.5, mb: 2, alignItems: 'center' }}>
              <FormControl size="small" sx={{ minWidth: 140 }}>
                <InputLabel>{t('marketplace.sortBy')}</InputLabel>
                <Select
                  label={t('marketplace.sortBy')}
                  value={referSort}
                  onChange={(e) => setReferSort(e.target.value as 'newest' | 'cashback' | 'rating' | 'escrow')}
                >
                  <MenuItem value="newest">{t('marketplace.sortNewest')}</MenuItem>
                  <MenuItem value="cashback">{t('marketplace.sortCashback')}</MenuItem>
                  <MenuItem value="rating">{t('marketplace.sortRating')}</MenuItem>
                  <MenuItem value="escrow">{t('marketplace.sortEscrow')}</MenuItem>
                </Select>
              </FormControl>
              <Autocomplete
                size="small"
                options={brandOptions}
                value={filterBrand}
                onChange={(_, v) => setFilterBrand(v)}
                sx={{ minWidth: 160 }}
                renderInput={(params) => (
                  <TextField {...params} label={t('marketplace.filterBrand')} />
                )}
              />
              <FormControl size="small" sx={{ minWidth: 120 }}>
                <InputLabel>SSN</InputLabel>
                <Select
                  label="SSN"
                  value={filterSsn}
                  onChange={(e) => setFilterSsn(e.target.value as 'all' | 'yes' | 'no')}
                >
                  <MenuItem value="all">{t('marketplace.filterAll')}</MenuItem>
                  <MenuItem value="yes">{t('marketplace.filterSsnYes')}</MenuItem>
                  <MenuItem value="no">{t('marketplace.filterSsnNo')}</MenuItem>
                </Select>
              </FormControl>
              <FormControl size="small" sx={{ minWidth: 130 }}>
                <InputLabel>{t('marketplace.filterMinRating')}</InputLabel>
                <Select
                  label={t('marketplace.filterMinRating')}
                  value={filterMinRating}
                  onChange={(e) => setFilterMinRating(e.target.value as 'all' | '3' | '4' | '4.5')}
                >
                  <MenuItem value="all">{t('marketplace.filterAll')}</MenuItem>
                  <MenuItem value="3">≥ 3.0</MenuItem>
                  <MenuItem value="4">≥ 4.0</MenuItem>
                  <MenuItem value="4.5">≥ 4.5</MenuItem>
                </Select>
              </FormControl>
              <TextField
                size="small"
                type="number"
                label={t('marketplace.filterMinDeposit')}
                value={filterMinDeposit}
                onChange={(e) => setFilterMinDeposit(e.target.value)}
                sx={{ width: 140 }}
              />
              <FormControlLabel
                control={<Checkbox checked={hideSoldOut} onChange={(e) => setHideSoldOut(e.target.checked)} size="small" />}
                label={t('marketplace.hideSoldOut')}
              />
            </Box>
          ) : null}
          <ListingsGrid
            listings={visibleListings}
            tab={tab}
            onClaim={handleClaim}
            onOpenDetail={setDetailListing}
            onEdit={openEditListing}
            onPause={async (id) => {
              await updateListingStatus(id, 'paused');
              setSnack({ open: true, message: t('marketplace.pauseSuccess'), severity: 'success' });
              await refreshListings();
            }}
            onResume={async (id) => {
              await updateListingStatus(id, 'active');
              setSnack({ open: true, message: t('marketplace.resumeSuccess'), severity: 'success' });
              await refreshListings();
            }}
            onClose={async (id) => {
              await updateListingStatus(id, 'closed');
              setSnack({ open: true, message: t('marketplace.closeSuccess'), severity: 'success' });
              await refreshListings();
            }}
            onUpdateSlots={async (id, slotsUsed) => {
              await updateListingSlotsUsed(id, slotsUsed);
              await refreshListings();
            }}
            t={t}
            tWithParams={tWithParams}
          />
        </>
      )}

      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 3 }}>
        {t('marketplace.footerHint')}{' '}
        <Link href="/deals" style={{ color: 'inherit' }}>
          {t('marketplace.officialDeals')}
        </Link>
        {' · '}
        <Link href="/jobs" style={{ color: 'inherit' }}>
          {t('marketplace.publicIntel')}
        </Link>
      </Typography>

      <CreateListingDialog
        open={createOpen}
        onClose={() => {
          setCreateOpen(false);
          setEditingId(null);
        }}
        createType={createType}
        onTypeChange={setCreateType}
        form={form}
        onFormChange={setForm}
        brandOptions={brandOptions}
        onSubmit={handleCreate}
        editing={Boolean(editingId)}
        t={t}
      />

      <Drawer
        anchor="right"
        open={Boolean(detailListing)}
        onClose={() => setDetailListing(null)}
        PaperProps={{ sx: { width: { xs: '100%', sm: 420 } } }}
      >
        {detailListing ? (
          <Box sx={{ p: 3 }}>
            <Typography variant="h6" fontWeight={700} gutterBottom>
              {detailListing.title}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              {detailListing.description}
            </Typography>
            {detailListing.type === 'refer' ? (
              <Box sx={{ mb: 2 }}>
                <Typography variant="body2">
                  {t('marketplace.cashback')}: {fmtUsd(detailListing.buyerCashback ?? 0)}
                </Typography>
                {detailListing.platformReward ? (
                  <Typography variant="body2">
                    {t('marketplace.platformReward')}: {fmtUsd(detailListing.platformReward)}
                  </Typography>
                ) : null}
                <Typography variant="h6" fontWeight={800} color="error.main" sx={{ mt: 1 }}>
                  {t('marketplace.totalTake')}:{' '}
                  {fmtUsd((detailListing.buyerCashback ?? 0) + (detailListing.platformReward ?? 0))}
                </Typography>
                {detailListing.completionCriteria ? (
                  <Typography variant="body2" sx={{ mt: 1 }}>
                    {t('marketplace.fieldCriteria')}: {detailListing.completionCriteria}
                  </Typography>
                ) : null}
                <Alert severity="success" variant="outlined" sx={{ mt: 1.5 }}>
                  <Typography variant="body2" fontWeight={700}>
                    {t('marketplace.escrowLocked')}: {fmtUsd(listingTotalEscrow(detailListing))}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {tWithParams('marketplace.escrowDetailHint', {
                      perSlot: fmtUsd(detailListing.escrowPerSlot),
                    })}
                  </Typography>
                </Alert>
                {detailListing.requiresSsn ? <Chip size="small" label="SSN" sx={{ mt: 1, mr: 0.5 }} /> : null}
                {detailListing.minDepositUsd ? (
                  <Chip size="small" label={`≥$${detailListing.minDepositUsd}`} sx={{ mt: 1 }} />
                ) : null}
              </Box>
            ) : null}
            <Divider sx={{ my: 2 }} />
            <Typography variant="subtitle2" gutterBottom>
              {t('marketplace.publisher')}
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap', mb: 1 }}>
              <UserProfileLink userId={detailListing.sellerId} displayName={detailListing.sellerName} size={40} />
              {detailListing.type === 'refer' ? (
                <SellerCreditChip stats={detailListing.sellerStats} t={t} />
              ) : null}
            </Box>
            {detailListing.sellerStats ? (
              <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 1 }}>
                {tWithParams('marketplace.sellerTrackRecord', {
                  sold: detailListing.sellerStats.completedAsSeller,
                  disputes: detailListing.sellerStats.disputes,
                })}
              </Typography>
            ) : null}
            {detailListing.sellerContactHint ? (
              <Typography variant="body2" sx={{ mt: 1.5 }}>
                {t('marketplace.fieldSellerContact')}: {detailListing.sellerContactHint}
              </Typography>
            ) : (
              <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 1 }}>
                {t('marketplace.contactViaProfile')}
              </Typography>
            )}
            <Box sx={{ mt: 3, display: 'flex', gap: 1 }}>
              {!isSoldOut(detailListing) && detailListing.status === 'active' ? (
                <Button
                  variant="contained"
                  onClick={() => {
                    setDetailListing(null);
                    void handleClaim(detailListing.id);
                  }}
                >
                  {detailListing.type === 'refer' ? t('marketplace.useRefer') : t('marketplace.buyIntel')}
                </Button>
              ) : null}
              <Button onClick={() => setDetailListing(null)}>{t('common.close')}</Button>
            </Box>
          </Box>
        ) : null}
      </Drawer>

      <OrderDetailDialog
        order={orderDialog}
        onClose={() => setOrderDialog(null)}
        proofNote={proofNote}
        onProofNote={setProofNote}
        disputeReason={disputeReason}
        onDisputeReason={setDisputeReason}
        onAction={handleOrderAction}
        t={t}
        tWithParams={tWithParams}
      />

      <Snackbar
        open={snack.open}
        autoHideDuration={4000}
        onClose={() => setSnack((s) => ({ ...s, open: false }))}
      >
        <Alert severity={snack.severity}>{snack.message}</Alert>
      </Snackbar>
    </Box>
  );
}

function slotsRemaining(item: MarketListing) {
  if (item.unlimitedSlots || item.maxSlots <= 0) return null;
  return Math.max(0, item.maxSlots - item.slotsUsed);
}

function slotsLow(item: MarketListing) {
  const left = slotsRemaining(item);
  if (left == null || item.maxSlots <= 0) return false;
  return left / item.maxSlots <= 0.4;
}

function isSoldOut(item: MarketListing) {
  if (item.unlimitedSlots || item.maxSlots <= 0) return false;
  return item.slotsUsed >= item.maxSlots || item.status === 'sold_out';
}

const CREDIT_TIER_COLOR: Record<SellerCreditTier, 'default' | 'primary' | 'success' | 'warning' | 'error'> = {
  new: 'default',
  good: 'primary',
  excellent: 'success',
  gold: 'warning',
  caution: 'error',
};

function SellerCreditChip({
  stats,
  t,
}: {
  stats?: UserMarketStats;
  t: (k: string) => string;
}) {
  if (!stats) return null;
  const tier = getSellerCreditTier(stats);
  return (
    <Chip
      size="small"
      icon={<VerifiedUser sx={{ fontSize: 14 }} />}
      label={`${t(`marketplace.creditTier.${tier}`)} · ${stats.rating.toFixed(1)}`}
      color={CREDIT_TIER_COLOR[tier]}
      variant={tier === 'new' ? 'outlined' : 'filled'}
      sx={{ fontWeight: 600 }}
    />
  );
}

function ListingsGrid({
  listings,
  tab,
  onClaim,
  onOpenDetail,
  onEdit,
  onPause,
  onResume,
  onClose,
  onUpdateSlots,
  t,
  tWithParams,
}: {
  listings: MarketListing[];
  tab: MainTab;
  onClaim: (id: string) => void;
  onOpenDetail: (item: MarketListing) => void;
  onEdit: (item: MarketListing) => void;
  onPause: (id: string) => Promise<void>;
  onResume: (id: string) => Promise<void>;
  onClose: (id: string) => Promise<void>;
  onUpdateSlots: (id: string, slotsUsed: number) => Promise<void>;
  t: (k: string) => string;
  tWithParams: (k: string, p: Record<string, string | number>) => string;
}) {
  if (listings.length === 0) {
    return (
      <Typography color="text.secondary" sx={{ py: 4, textAlign: 'center' }}>
        {t('marketplace.noListings')}
      </Typography>
    );
  }

  return (
    <Box
      sx={{
        display: 'grid',
        gridTemplateColumns: { xs: '1fr', md: 'repeat(2, 1fr)', lg: 'repeat(3, 1fr)' },
        gap: 2,
      }}
    >
      {listings.map((item) => {
        const soldOut = isSoldOut(item);
        const total =
          item.type === 'refer'
            ? (item.platformReward ?? 0) + (item.buyerCashback ?? 0)
            : item.intelFee ?? 0;
        const left = slotsRemaining(item);
        const low = slotsLow(item);
        const totalEscrow = item.type === 'refer' ? listingTotalEscrow(item) : item.escrowPerSlot * (item.maxSlots || 1);
        return (
          <Card
            key={item.id}
            variant="outlined"
            sx={{
              display: 'flex',
              flexDirection: 'column',
              position: 'relative',
              opacity: soldOut ? 0.55 : 1,
              filter: soldOut ? 'grayscale(0.7)' : 'none',
              bgcolor: soldOut ? 'action.hover' : undefined,
            }}
          >
            {item.type === 'refer' && total > 0 ? (
              <Box
                sx={{
                  position: 'absolute',
                  top: 10,
                  right: 10,
                  zIndex: 1,
                  px: 1.1,
                  py: 0.4,
                  borderRadius: 1.5,
                  background: 'linear-gradient(135deg, #f59e0b, #ef4444 60%, #ec4899)',
                  color: '#fff',
                  boxShadow: '0 4px 14px rgba(239,68,68,0.35)',
                }}
              >
                <Typography variant="caption" sx={{ opacity: 0.9, fontWeight: 600, display: 'block', lineHeight: 1 }}>
                  {t('marketplace.totalTake')}
                </Typography>
                <Typography fontWeight={900} sx={{ lineHeight: 1.15 }}>
                  ${total.toFixed(total % 1 ? 1 : 0)}
                </Typography>
              </Box>
            ) : null}
            <CardContent sx={{ flex: 1, pr: item.type === 'refer' ? 10 : 2 }} onClick={() => onOpenDetail(item)} style={{ cursor: 'pointer' }}>
              <Box sx={{ display: 'flex', gap: 1, mb: 1, flexWrap: 'wrap' }}>
                <Chip
                  size="small"
                  label={item.type === 'refer' ? t('marketplace.typeRefer') : t('marketplace.typeJobIntel')}
                  color={item.type === 'refer' ? 'secondary' : 'primary'}
                />
                {item.requiresSsn ? <Chip size="small" label="SSN" variant="outlined" /> : null}
                {item.minDepositUsd ? (
                  <Chip size="small" label={`≥$${item.minDepositUsd}`} variant="outlined" />
                ) : null}
                {soldOut ? <Chip size="small" label={t('marketplace.soldOut')} color="default" /> : null}
              </Box>
              <Typography variant="h6" fontWeight={600} gutterBottom>
                {item.title}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                {item.description}
              </Typography>
              {item.type === 'refer' ? (
                <>
                  <Typography variant="body2">
                    {t('marketplace.cashback')}: <strong>{fmtUsd(item.buyerCashback ?? 0)}</strong>
                    {item.platformReward ? ` + ${t('marketplace.platformReward')} ${fmtUsd(item.platformReward)}` : ''}
                  </Typography>
                  <Box
                    sx={{
                      mt: 1,
                      p: 1,
                      borderRadius: 1,
                      bgcolor: 'success.50',
                      border: '1px solid',
                      borderColor: 'success.200',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 0.75,
                    }}
                  >
                    <Shield sx={{ fontSize: 18, color: 'success.main' }} />
                    <Box>
                      <Typography variant="caption" color="success.dark" fontWeight={700} display="block">
                        {t('marketplace.escrowLocked')}
                      </Typography>
                      <Typography variant="body2" fontWeight={700}>
                        {fmtUsd(totalEscrow)}
                        <Typography component="span" variant="caption" color="text.secondary" sx={{ ml: 0.5 }}>
                          ({tWithParams('marketplace.escrowPerSlot', { amount: fmtUsd(item.escrowPerSlot) })})
                        </Typography>
                      </Typography>
                    </Box>
                  </Box>
                  {item.brand ? (
                    <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 0.5 }}>
                      {item.brand}
                    </Typography>
                  ) : null}
                </>
              ) : (
                <>
                  <Typography variant="body2">
                    {t('marketplace.intelFee')}: <strong>{fmtUsd(item.intelFee ?? 0)}</strong>
                  </Typography>
                  <Typography variant="caption" color="text.secondary" display="block">
                    {item.state} · {item.jobTitle}
                  </Typography>
                </>
              )}
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 1.25, flexWrap: 'wrap' }}>
                <Avatar sx={{ width: 28, height: 28, fontSize: 14 }}>
                  {(item.sellerName || '?').slice(0, 1)}
                </Avatar>
                <Box sx={{ minWidth: 0 }} onClick={(e) => e.stopPropagation()}>
                  <UserProfileLink userId={item.sellerId} displayName={item.sellerName} />
                </Box>
                {item.type === 'refer' ? <SellerCreditChip stats={item.sellerStats} t={t} /> : null}
              </Box>
              {item.type === 'refer' && item.sellerStats ? (
                <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 0.5 }}>
                  {tWithParams('marketplace.sellerTrackRecord', {
                    sold: item.sellerStats.completedAsSeller,
                    disputes: item.sellerStats.disputes,
                  })}
                </Typography>
              ) : null}
              <Box
                sx={{
                  mt: 0.75,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1,
                }}
              >
                <Typography
                  variant="caption"
                  sx={{
                    color: low ? 'error.main' : 'text.secondary',
                    fontWeight: low ? 700 : 400,
                    flexShrink: 0,
                  }}
                >
                  {item.unlimitedSlots || item.maxSlots <= 0
                    ? tWithParams('marketplace.slotsUnlimited', { used: item.slotsUsed })
                    : tWithParams('marketplace.slotsLeft', { left: left ?? 0, max: item.maxSlots })}
                </Typography>
                {!item.unlimitedSlots && item.maxSlots > 0 ? (
                  <LinearProgress
                    variant="determinate"
                    value={Math.max(0, Math.min(100, ((left ?? 0) / item.maxSlots) * 100))}
                    color={low ? 'error' : 'primary'}
                    sx={{ flex: 1, height: 6, borderRadius: 999, bgcolor: 'action.hover' }}
                  />
                ) : null}
              </Box>
            </CardContent>
            <CardActions sx={{ px: 2, pb: 2, flexWrap: 'wrap', gap: 0.5 }}>
              {tab === 'my_listings' ? (
                <>
                  <Button size="small" onClick={() => onEdit(item)}>
                    {t('marketplace.editListing')}
                  </Button>
                  {item.status === 'active' ? (
                    <Button size="small" onClick={() => void onPause(item.id)}>
                      {t('marketplace.pause')}
                    </Button>
                  ) : null}
                  {item.status === 'paused' || item.status === 'closed' ? (
                    <Button size="small" color="success" onClick={() => void onResume(item.id)}>
                      {t('marketplace.resume')}
                    </Button>
                  ) : null}
                  {item.status !== 'closed' ? (
                    <Button size="small" color="error" onClick={() => void onClose(item.id)}>
                      {t('marketplace.close')}
                    </Button>
                  ) : null}
                  <Chip size="small" label={item.status} sx={{ mr: 0.5 }} />
                  <TextField
                    size="small"
                    type="number"
                    label={t('marketplace.updateParticipants')}
                    defaultValue={item.slotsUsed}
                    sx={{ width: 120 }}
                    onBlur={(e) => {
                      const n = Number(e.target.value);
                      if (Number.isFinite(n) && n !== item.slotsUsed) {
                        void onUpdateSlots(item.id, n);
                      }
                    }}
                  />
                </>
              ) : !soldOut && item.status === 'active' ? (
                <Button size="small" variant="contained" onClick={() => onClaim(item.id)}>
                  {item.type === 'refer' ? t('marketplace.useRefer') : t('marketplace.buyIntel')}
                </Button>
              ) : (
                <Button size="small" onClick={() => onOpenDetail(item)}>
                  {t('marketplace.viewDetail')}
                </Button>
              )}
            </CardActions>
          </Card>
        );
      })}
    </Box>
  );
}

function OrdersSection({
  orders,
  onSelect,
  t,
}: {
  orders: (MarketOrder & { intelDetail?: string })[];
  onSelect: (o: MarketOrder & { intelDetail?: string }) => void;
  t: (k: string) => string;
}) {
  if (orders.length === 0) {
    return (
      <Typography color="text.secondary" sx={{ py: 4, textAlign: 'center' }}>
        {t('marketplace.noOrders')}
      </Typography>
    );
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
      {orders.map((order) => (
        <Card key={order.id} variant="outlined">
          <CardContent sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, alignItems: 'center' }}>
            <Box sx={{ flex: 1, minWidth: 200 }}>
              <Typography fontWeight={600}>{order.listingTitle}</Typography>
              <Typography variant="caption" color="text.secondary">
                {order.listingType === 'refer' ? t('marketplace.typeRefer') : t('marketplace.typeJobIntel')}
              </Typography>
            </Box>
            <Chip size="small" label={t(`marketplace.orderStatus.${order.status}`)} color={ORDER_STATUS_COLOR[order.status]} />
            <Typography variant="body2">{fmtUsd(order.buyerPayout)}</Typography>
            <Button size="small" onClick={() => onSelect(order)}>
              {t('marketplace.viewOrder')}
            </Button>
          </CardContent>
        </Card>
      ))}
    </Box>
  );
}

function CreateListingDialog({
  open,
  onClose,
  createType,
  onTypeChange,
  form,
  onFormChange,
  brandOptions,
  onSubmit,
  editing,
  t,
}: {
  open: boolean;
  onClose: () => void;
  createType: ListingType;
  onTypeChange: (t: ListingType) => void;
  form: ListingFormState;
  onFormChange: Dispatch<SetStateAction<ListingFormState>>;
  brandOptions: string[];
  onSubmit: () => void;
  editing?: boolean;
  t: (k: string) => string;
}) {
  const set = (key: keyof ListingFormState, val: string | boolean) =>
    onFormChange((prev) => ({ ...prev, [key]: val }));

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>{editing ? t('marketplace.editListing') : t('marketplace.createListing')}</DialogTitle>
      <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
        <Tabs value={createType} onChange={(_, v) => !editing && onTypeChange(v)}>
          <Tab value="refer" label={t('marketplace.typeRefer')} disabled={Boolean(editing)} />
          <Tab value="job_intel" label={t('marketplace.typeJobIntel')} disabled={Boolean(editing)} />
        </Tabs>
        {editing ? (
          <Alert severity="info">已有成交后不可改金额与名额（避免破坏保证金）；文案与条件可随时改。</Alert>
        ) : null}
        <TextField label={t('marketplace.fieldTitle')} value={form.title} onChange={(e) => set('title', e.target.value)} size="small" fullWidth />
        <TextField label={t('marketplace.fieldDesc')} value={form.description} onChange={(e) => set('description', e.target.value)} size="small" fullWidth multiline minRows={2} />
        <FormControlLabel
          control={
            <Checkbox
              checked={form.unlimitedSlots}
              onChange={(e) => onFormChange((prev) => ({ ...prev, unlimitedSlots: e.target.checked }))}
            />
          }
          label={t('marketplace.unlimitedSlots')}
        />
        {!form.unlimitedSlots ? (
          <TextField
            label={t('marketplace.fieldMaxSlots')}
            value={form.maxSlots}
            onChange={(e) => set('maxSlots', e.target.value)}
            size="small"
            type="number"
            inputProps={{ min: 1, max: 10000 }}
            helperText={t('marketplace.slotsRangeHint')}
          />
        ) : null}

        {createType === 'refer' ? (
          <>
            <Autocomplete
              freeSolo
              options={brandOptions}
              value={form.brand}
              onInputChange={(_, value) => set('brand', value)}
              onChange={(_, value) => set('brand', typeof value === 'string' ? value : value ?? '')}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label={t('marketplace.fieldBrand')}
                  size="small"
                  placeholder={t('marketplace.fieldBrand')}
                  helperText="可自填品牌，或选择与官方精选相同的项目"
                />
              )}
            />
            <TextField label={t('marketplace.fieldReferLink')} value={form.referLink} onChange={(e) => set('referLink', e.target.value)} size="small" fullWidth />
            <TextField label={t('marketplace.fieldReferCode')} value={form.referCode} onChange={(e) => set('referCode', e.target.value)} size="small" fullWidth />
            <TextField label={t('marketplace.fieldPlatformReward')} value={form.platformReward} onChange={(e) => set('platformReward', e.target.value)} size="small" type="number" helperText={t('marketplace.fieldPlatformRewardHint')} />
            <TextField label={t('marketplace.fieldCashback')} value={form.buyerCashback} onChange={(e) => set('buyerCashback', e.target.value)} size="small" type="number" />
            <TextField label={t('marketplace.fieldCriteria')} value={form.completionCriteria} onChange={(e) => set('completionCriteria', e.target.value)} size="small" fullWidth multiline minRows={2} />
            <FormControlLabel
              control={
                <Checkbox
                  checked={form.requiresSsn}
                  onChange={(e) => onFormChange((prev) => ({ ...prev, requiresSsn: e.target.checked }))}
                />
              }
              label={t('marketplace.requiresSsn')}
            />
            <TextField label={t('marketplace.fieldMinDeposit')} value={form.minDepositUsd} onChange={(e) => set('minDepositUsd', e.target.value)} size="small" type="number" />
            <TextField label={t('marketplace.fieldSellerContact')} value={form.sellerContactHint} onChange={(e) => set('sellerContactHint', e.target.value)} size="small" fullWidth helperText={t('marketplace.fieldSellerContactHint')} />
            <Alert severity="info">{t('marketplace.referEscrowHint')}</Alert>
          </>
        ) : (
          <>
            <FormControl size="small" fullWidth>
              <InputLabel>{t('marketplace.fieldState')}</InputLabel>
              <Select label={t('marketplace.fieldState')} value={form.state} onChange={(e) => set('state', e.target.value)}>
                {US_STATE_OPTIONS.map((s) => (
                  <MenuItem key={s} value={s}>{s}</MenuItem>
                ))}
              </Select>
            </FormControl>
            <TextField label={t('marketplace.fieldCity')} value={form.city} onChange={(e) => set('city', e.target.value)} size="small" fullWidth />
            <TextField label={t('marketplace.fieldJobTitle')} value={form.jobTitle} onChange={(e) => set('jobTitle', e.target.value)} size="small" fullWidth />
            <TextField label={t('marketplace.fieldEmployerHint')} value={form.employerHint} onChange={(e) => set('employerHint', e.target.value)} size="small" fullWidth />
            <TextField label={t('marketplace.fieldIntelFee')} value={form.intelFee} onChange={(e) => set('intelFee', e.target.value)} size="small" type="number" />
            <TextField label={t('marketplace.fieldIntelPreview')} value={form.intelPreview} onChange={(e) => set('intelPreview', e.target.value)} size="small" fullWidth multiline minRows={2} />
            <TextField label={t('marketplace.fieldIntelDetail')} value={form.intelDetail} onChange={(e) => set('intelDetail', e.target.value)} size="small" fullWidth multiline minRows={3} helperText={t('marketplace.intelDetailHint')} />
            <Alert severity="info">{t('marketplace.jobEscrowHint')}</Alert>
          </>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>{t('common.cancel')}</Button>
        <Button variant="contained" onClick={onSubmit}>{t('common.confirm')}</Button>
      </DialogActions>
    </Dialog>
  );
}

function OrderDetailDialog({
  order,
  onClose,
  proofNote,
  onProofNote,
  disputeReason,
  onDisputeReason,
  onAction,
  t,
  tWithParams,
}: {
  order: (MarketOrder & { intelDetail?: string; referAccess?: { referLink?: string; referCode?: string } }) | null;
  onClose: () => void;
  proofNote: string;
  onProofNote: (v: string) => void;
  disputeReason: string;
  onDisputeReason: (v: string) => void;
  onAction: (
    id: string,
    action: 'submit_proof' | 'confirm' | 'dispute' | 'cancel' | 'admin_resolve',
    extra?: { winner?: 'buyer' | 'seller' },
  ) => void;
  t: (k: string) => string;
  tWithParams: (k: string, p: Record<string, string | number>) => string;
}) {
  const user = useAuthStore((s) => s.user);
  if (!order) return null;

  const isBuyer = user?.userId === order.buyerId;
  const isSeller = user?.userId === order.sellerId;
  const isAdmin = user?.role === 'admin';

  return (
    <Dialog open={Boolean(order)} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>{order.listingTitle}</DialogTitle>
      <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        <Chip label={t(`marketplace.orderStatus.${order.status}`)} color={ORDER_STATUS_COLOR[order.status]} size="small" sx={{ alignSelf: 'flex-start' }} />
        <Typography variant="body2">
          {t('marketplace.payout')}: {fmtUsd(order.buyerPayout)} · {t('marketplace.platformFee')}: {fmtUsd(order.platformFee)}
        </Typography>
        {order.referAccess?.referLink || order.referAccess?.referCode ? (
          <>
            <Divider />
            <Typography variant="subtitle2">{t('marketplace.referCodeTitle')}</Typography>
            {order.referAccess.referLink ? (
              <Typography variant="body2" sx={{ wordBreak: 'break-all' }}>
                {order.referAccess.referLink}
              </Typography>
            ) : null}
            {order.referAccess.referCode ? (
              <Typography variant="body2">Code: {order.referAccess.referCode}</Typography>
            ) : null}
          </>
        ) : null}
        {order.proofNote ? (
          <>
            <Divider />
            <Typography variant="subtitle2">{t('marketplace.proofSubmitted')}</Typography>
            <Typography variant="body2">{order.proofNote}</Typography>
          </>
        ) : null}
        {order.intelDetail ? (
          <>
            <Divider />
            <Typography variant="subtitle2">{t('marketplace.intelUnlocked')}</Typography>
            <Alert severity="success">{order.intelDetail}</Alert>
          </>
        ) : null}
        {order.autoConfirmDeadline && order.status === 'proof_submitted' ? (
          <Typography variant="caption" color="text.secondary">
            {tWithParams('marketplace.autoConfirm', { date: new Date(order.autoConfirmDeadline).toLocaleDateString() })}
          </Typography>
        ) : null}

        {isBuyer && order.status === 'claimed' ? (
          <>
            <TextField label={t('marketplace.proofPlaceholder')} value={proofNote} onChange={(e) => onProofNote(e.target.value)} multiline minRows={3} fullWidth size="small" />
            <Button variant="contained" onClick={() => onAction(order.id, 'submit_proof')}>{t('marketplace.submitProof')}</Button>
            <Button color="error" onClick={() => onAction(order.id, 'cancel')}>{t('marketplace.cancelOrder')}</Button>
          </>
        ) : null}

        {isSeller && order.status === 'proof_submitted' ? (
          <>
            <Button variant="contained" onClick={() => onAction(order.id, 'confirm')}>{t('marketplace.confirmComplete')}</Button>
            <TextField label={t('marketplace.disputeReason')} value={disputeReason} onChange={(e) => onDisputeReason(e.target.value)} size="small" fullWidth />
            <Button color="warning" onClick={() => onAction(order.id, 'dispute')}>{t('marketplace.openDispute')}</Button>
          </>
        ) : null}

        {isBuyer && order.status === 'proof_submitted' ? (
          <>
            <TextField label={t('marketplace.disputeReason')} value={disputeReason} onChange={(e) => onDisputeReason(e.target.value)} size="small" fullWidth />
            <Button color="warning" onClick={() => onAction(order.id, 'dispute')}>{t('marketplace.openDispute')}</Button>
          </>
        ) : null}

        {isAdmin && order.status === 'disputed' ? (
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button variant="contained" onClick={() => onAction(order.id, 'admin_resolve', { winner: 'buyer' })}>
              {t('marketplace.resolveBuyer')}
            </Button>
            <Button variant="outlined" onClick={() => onAction(order.id, 'admin_resolve', { winner: 'seller' })}>
              {t('marketplace.resolveSeller')}
            </Button>
          </Box>
        ) : null}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>{t('common.close')}</Button>
      </DialogActions>
    </Dialog>
  );
}
