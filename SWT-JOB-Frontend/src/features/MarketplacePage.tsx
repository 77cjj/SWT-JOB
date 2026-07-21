import { useCallback, useEffect, useMemo, useState } from 'react';
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
} from '@mui/material';
import {
  AccountBalanceWallet,
  CardGiftcard,
  WorkOutline,
  Add,
  Gavel,
  Storefront,
} from '@mui/icons-material';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useAuthStore } from '@/stores/authStore';
import { useMarketplaceApi } from '../hooks/useMarketplaceApi';
import { useI18n } from '../context/I18nContext';
import type {
  ListingType,
  MarketListing,
  MarketOrder,
  OrderStatus,
  UserMarketStats,
  WalletAccount,
} from '../lib/marketplace/types';
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

export default function MarketplacePage({ embedded = false }: { embedded?: boolean }) {
  const { t, tWithParams, language } = useI18n();
  const router = useRouter();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const {
    fetchListings,
    fetchOrders,
    fetchWallet,
    createListing,
    updateListingStatus,
    claimOrder,
    orderAction,
    deposit,
    startStripeCheckout,
    fetchPaymentsConfig,
  } = useMarketplaceApi();

  const [tab, setTab] = useState<MainTab>('refer');
  const [stripeEnabled, setStripeEnabled] = useState(false);
  const [listings, setListings] = useState<MarketListing[]>([]);
  const [orders, setOrders] = useState<(MarketOrder & { intelDetail?: string })[]>([]);
  const [wallet, setWallet] = useState<WalletAccount | null>(null);
  const [stats, setStats] = useState<UserMarketStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [createType, setCreateType] = useState<ListingType>('refer');
  const [orderDialog, setOrderDialog] = useState<(MarketOrder & { intelDetail?: string }) | null>(null);
  const [proofNote, setProofNote] = useState('');
  const [disputeReason, setDisputeReason] = useState('');
  const [depositAmount, setDepositAmount] = useState('50');
  const [snack, setSnack] = useState<{ open: boolean; message: string; severity: 'success' | 'error' | 'info' }>({
    open: false,
    message: '',
    severity: 'success',
  });

  const [form, setForm] = useState<ListingFormState>(emptyListingForm);

  useEffect(() => {
    void fetchPaymentsConfig().then(setStripeEnabled).catch(() => setStripeEnabled(false));
  }, [fetchPaymentsConfig]);

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
    const data = await fetchWallet();
    setWallet(data.wallet);
    setStats(data.stats);
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
      void refreshWallet();
    } else if (depositStatus === 'cancel') {
      setSnack({ open: true, message: t('marketplace.depositStripeCancel'), severity: 'info' });
    }
  }, [router.isReady, router.query.tab, router.query.deposit, t, refreshWallet]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);

    const run = async () => {
      try {
        if (tab === 'orders') {
          const data = await fetchOrders('all');
          if (!cancelled) setOrders(data);
        } else if (tab === 'wallet') {
          if (isAuthenticated) {
            const data = await fetchWallet();
            if (!cancelled) {
              setWallet(data.wallet);
              setStats(data.stats);
            }
          }
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
  }, [tab, isAuthenticated, fetchListings, fetchOrders, fetchWallet, t]);

  const requireLogin = () => {
    if (!isAuthenticated) {
      useAuthStore.getState().openLoginDialog(t('marketplace.loginRequired'));
      return false;
    }
    return true;
  };

  const handleCreate = async () => {
    if (!requireLogin()) return;
    try {
      const body =
        createType === 'refer'
          ? {
              type: 'refer',
              title: form.title,
              description: form.description,
              brand: form.brand,
              referLink: form.referLink,
              referCode: form.referCode,
              platformReward: form.platformReward ? Number(form.platformReward) : undefined,
              buyerCashback: Number(form.buyerCashback),
              completionCriteria: form.completionCriteria,
              maxSlots: Number(form.maxSlots),
            }
          : {
              type: 'job_intel',
              title: form.title,
              description: form.description,
              state: form.state,
              city: form.city,
              jobTitle: form.jobTitle,
              employerHint: form.employerHint,
              intelFee: Number(form.intelFee),
              intelPreview: form.intelPreview,
              intelDetail: form.intelDetail,
              maxSlots: Number(form.maxSlots),
            };
      await createListing(body);
      setCreateOpen(false);
      setSnack({ open: true, message: t('marketplace.createSuccess'), severity: 'success' });
      setTab('my_listings');
    } catch (e) {
      setSnack({ open: true, message: formatFetchError(e, t('common.networkError')), severity: 'error' });
    }
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

  const handleDeposit = async () => {
    if (!requireLogin()) return;
    const amount = Number(depositAmount);
    if (!Number.isFinite(amount) || amount < 5) {
      setSnack({ open: true, message: t('marketplace.depositMinHint'), severity: 'error' });
      return;
    }
    try {
      if (stripeEnabled) {
        await startStripeCheckout(amount);
        return;
      }
      const w = await deposit(amount);
      setWallet(w);
      setSnack({ open: true, message: t('marketplace.depositSuccess'), severity: 'success' });
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

  const showLoadingBar =
    loading &&
    (tab === 'orders'
      ? orders.length === 0
      : tab === 'wallet'
        ? isAuthenticated && wallet === null
        : listings.length === 0);

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
              setCreateOpen(true);
            }}
          >
            {t('marketplace.createListing')}
          </Button>
        </Box>
      )}

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
        <WalletSection
          wallet={wallet}
          stats={stats}
          depositAmount={depositAmount}
          onDepositAmount={setDepositAmount}
          onDeposit={handleDeposit}
          isAuthenticated={isAuthenticated}
          stripeEnabled={stripeEnabled}
          t={t}
        />
      ) : null}

      {tab === 'orders' ? (
        <OrdersSection
          orders={orders}
          onSelect={setOrderDialog}
          t={t}
        />
      ) : null}

      {(tab === 'refer' || tab === 'job_intel' || tab === 'my_listings') && (
        <ListingsGrid
          listings={listings}
          tab={tab}
          onClaim={handleClaim}
          onPause={async (id) => {
            await updateListingStatus(id, 'paused');
            await refreshListings();
          }}
          onClose={async (id) => {
            await updateListingStatus(id, 'closed');
            await refreshListings();
          }}
          t={t}
          tWithParams={tWithParams}
        />
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
        onClose={() => setCreateOpen(false)}
        createType={createType}
        onTypeChange={setCreateType}
        form={form}
        onFormChange={setForm}
        brandOptions={brandOptions}
        onSubmit={handleCreate}
        t={t}
      />

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

function WalletSection({
  wallet,
  stats,
  depositAmount,
  onDepositAmount,
  onDeposit,
  isAuthenticated,
  stripeEnabled,
  t,
}: {
  wallet: WalletAccount | null;
  stats: UserMarketStats | null;
  depositAmount: string;
  onDepositAmount: (v: string) => void;
  onDeposit: () => void;
  isAuthenticated: boolean;
  stripeEnabled: boolean;
  t: (k: string) => string;
}) {
  if (!isAuthenticated) {
    return <Alert severity="warning">{t('marketplace.loginRequired')}</Alert>;
  }

  return (
    <Box sx={{ maxWidth: 520 }}>
      <Card variant="outlined" sx={{ mb: 2 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            {t('marketplace.walletBalance')}
          </Typography>
          <Typography variant="h3" fontWeight={700} color="primary">
            {fmtUsd(wallet?.balance ?? 0)}
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            {t('marketplace.walletLocked')}: {fmtUsd(wallet?.locked ?? 0)}
          </Typography>
          {stats ? (
            <Box sx={{ mt: 2, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
              <Chip size="small" label={`${t('marketplace.statsSeller')}: ${stats.completedAsSeller}`} />
              <Chip size="small" label={`${t('marketplace.statsBuyer')}: ${stats.completedAsBuyer}`} />
              <Chip size="small" label={`${t('marketplace.statsRating')}: ${stats.rating.toFixed(1)}`} />
            </Box>
          ) : null}
        </CardContent>
      </Card>
      <Alert severity={stripeEnabled ? 'info' : 'warning'} sx={{ mb: 2 }}>
        {stripeEnabled ? t('marketplace.depositStripeNote') : t('marketplace.depositDemoNote')}
      </Alert>
      <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
        <TextField
          size="small"
          label={t('marketplace.depositAmount')}
          type="number"
          value={depositAmount}
          onChange={(e) => onDepositAmount(e.target.value)}
          sx={{ width: 160 }}
        />
        <Button variant="contained" onClick={onDeposit}>
          {stripeEnabled ? t('marketplace.depositStripe') : t('marketplace.deposit')}
        </Button>
      </Box>
    </Box>
  );
}

function ListingsGrid({
  listings,
  tab,
  onClaim,
  onPause,
  onClose,
  t,
  tWithParams,
}: {
  listings: MarketListing[];
  tab: MainTab;
  onClaim: (id: string) => void;
  onPause: (id: string) => Promise<void>;
  onClose: (id: string) => Promise<void>;
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
      {listings.map((item) => (
        <Card key={item.id} variant="outlined" sx={{ display: 'flex', flexDirection: 'column' }}>
          <CardContent sx={{ flex: 1 }}>
            <Box sx={{ display: 'flex', gap: 1, mb: 1, flexWrap: 'wrap' }}>
              <Chip
                size="small"
                label={item.type === 'refer' ? t('marketplace.typeRefer') : t('marketplace.typeJobIntel')}
                color={item.type === 'refer' ? 'secondary' : 'primary'}
              />
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
                </Typography>
                {item.brand ? (
                  <Typography variant="caption" color="text.secondary">
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
                {item.intelPreview ? (
                  <Typography variant="body2" sx={{ mt: 1, fontStyle: 'italic' }}>
                    {item.intelPreview}
                  </Typography>
                ) : null}
              </>
            )}
            <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 1 }}>
              {tWithParams('marketplace.slotsLeft', {
                left: item.maxSlots - item.slotsUsed,
                max: item.maxSlots,
              })}{' '}
              · {item.sellerName}
            </Typography>
          </CardContent>
          <CardActions sx={{ px: 2, pb: 2 }}>
            {tab === 'my_listings' ? (
              <>
                <Button size="small" onClick={() => void onPause(item.id)}>
                  {t('marketplace.pause')}
                </Button>
                <Button size="small" color="error" onClick={() => void onClose(item.id)}>
                  {t('marketplace.close')}
                </Button>
              </>
            ) : item.status === 'active' && item.slotsUsed < item.maxSlots ? (
              <Button size="small" variant="contained" onClick={() => onClaim(item.id)}>
                {item.type === 'refer' ? t('marketplace.useRefer') : t('marketplace.buyIntel')}
              </Button>
            ) : null}
          </CardActions>
        </Card>
      ))}
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
  t,
}: {
  open: boolean;
  onClose: () => void;
  createType: ListingType;
  onTypeChange: (t: ListingType) => void;
  form: ListingFormState;
  onFormChange: React.Dispatch<React.SetStateAction<ListingFormState>>;
  brandOptions: string[];
  onSubmit: () => void;
  t: (k: string) => string;
}) {
  const set = (key: keyof ListingFormState, val: string) =>
    onFormChange((prev) => ({ ...prev, [key]: val }));

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>{t('marketplace.createListing')}</DialogTitle>
      <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
        <Tabs value={createType} onChange={(_, v) => onTypeChange(v)}>
          <Tab value="refer" label={t('marketplace.typeRefer')} />
          <Tab value="job_intel" label={t('marketplace.typeJobIntel')} />
        </Tabs>
        <TextField label={t('marketplace.fieldTitle')} value={form.title} onChange={(e) => set('title', e.target.value)} size="small" fullWidth />
        <TextField label={t('marketplace.fieldDesc')} value={form.description} onChange={(e) => set('description', e.target.value)} size="small" fullWidth multiline minRows={2} />
        <TextField label={t('marketplace.fieldMaxSlots')} value={form.maxSlots} onChange={(e) => set('maxSlots', e.target.value)} size="small" type="number" />

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
            <TextField label={t('marketplace.fieldCashback')} value={form.buyerCashback} onChange={(e) => set('buyerCashback', e.target.value)} size="small" type="number" />
            <TextField label={t('marketplace.fieldCriteria')} value={form.completionCriteria} onChange={(e) => set('completionCriteria', e.target.value)} size="small" fullWidth multiline minRows={2} />
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
