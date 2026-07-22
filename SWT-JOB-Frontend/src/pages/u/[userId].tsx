'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import {
  Alert,
  Avatar,
  Box,
  Button,
  Checkbox,
  Container,
  Divider,
  FormControlLabel,
  Paper,
  Stack,
  Tab,
  Tabs,
  TextField,
  Typography,
} from '@mui/material';
import ChatBubbleOutlineIcon from '@mui/icons-material/ChatBubbleOutline';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import DesktopLayout from '../../layout/desktop/Layout';
import MobileLayout from '../../layout/mobile/Layout';
import useDevice from '../../hooks/useDevice';
import { useAuthStore } from '@/stores/authStore';
import { useSupportWidgetStore } from '../../stores/supportWidgetStore';
import { changePassword } from '@/services/userService';
import { storage } from '@/utils/storage';
import type { UserPublicProfile } from '../../lib/profile/types';
import type { WalletAccount, WalletTransaction } from '../../lib/marketplace/types';
import { toast } from 'sonner';

function authHeaders(): HeadersInit {
  const token = storage.getToken();
  return token
    ? { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }
    : { 'Content-Type': 'application/json' };
}

type ProfileTab = 'overview' | 'edit' | 'wallet' | 'password';

export default function UserProfilePage() {
  const router = useRouter();
  const isMobile = useDevice();
  const authUser = useAuthStore((s) => s.user);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const openLoginDialog = useAuthStore((s) => s.openLoginDialog);
  const fetchCurrentUser = useAuthStore((s) => s.fetchCurrentUser);
  const requestSupportOpen = useSupportWidgetStore((s) => s.requestOpen);

  const userId = typeof router.query.userId === 'string' ? router.query.userId : '';
  const isOwner = Boolean(isAuthenticated && authUser?.userId && authUser.userId === userId);

  const [tab, setTab] = useState<ProfileTab>('overview');
  const [profile, setProfile] = useState<UserPublicProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [wallet, setWallet] = useState<WalletAccount | null>(null);
  const [txs, setTxs] = useState<WalletTransaction[]>([]);
  const [depositAmount, setDepositAmount] = useState('20');
  const [aiBuyCount, setAiBuyCount] = useState('5');
  const [stripeEnabled, setStripeEnabled] = useState(false);
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const loadProfile = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/profile/${encodeURIComponent(userId)}`, {
        headers: authHeaders(),
      });
      const data = (await res.json()) as {
        ok?: boolean;
        profile?: UserPublicProfile;
        message?: string;
      };
      if (!res.ok || !data.profile) throw new Error(data.message || '加载失败');
      setProfile(data.profile);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : '加载主页失败');
      setProfile(null);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  const loadWallet = useCallback(async () => {
    if (!isOwner) return;
    try {
      const [cfg, w] = await Promise.all([
        fetch('/api/marketplace/payments-config').then((r) => r.json()),
        fetch('/api/marketplace/wallet', { headers: authHeaders() }).then((r) => r.json()),
      ]);
      setStripeEnabled(Boolean(cfg?.stripeEnabled));
      if (w?.ok === false || !w?.wallet) {
        setWallet(null);
        setTxs([]);
        return;
      }
      setWallet(w.wallet);
      setTxs(w.transactions || []);
    } catch {
      setWallet(null);
    }
  }, [isOwner]);

  useEffect(() => {
    void loadProfile();
  }, [loadProfile]);

  useEffect(() => {
    if (isOwner && (tab === 'wallet' || tab === 'overview')) {
      void loadWallet();
    }
  }, [isOwner, tab, loadWallet]);

  useEffect(() => {
    if (isOwner && router.query.tab === 'wallet') setTab('wallet');
    if (isOwner && router.query.tab === 'edit') setTab('edit');
    if (isOwner && router.query.tab === 'password') setTab('password');
  }, [isOwner, router.query.tab]);

  useEffect(() => {
    if (!isOwner || !router.isReady) return;
    if (router.query.deposit === 'success') {
      toast.success('支付完成，余额将在几秒内更新');
      setTab('wallet');
      void loadWallet();
      let attempts = 0;
      const id = window.setInterval(() => {
        attempts += 1;
        void loadWallet();
        if (attempts >= 8) window.clearInterval(id);
      }, 2500);
      return () => window.clearInterval(id);
    }
    if (router.query.deposit === 'cancel') {
      toast.message('已取消支付');
    }
  }, [isOwner, router.isReady, router.query.deposit, loadWallet]);

  const saveProfile = async () => {
    if (!profile || !isOwner) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/profile/${encodeURIComponent(userId)}`, {
        method: 'PUT',
        headers: authHeaders(),
        body: JSON.stringify(profile),
      });
      const data = await res.json();
      if (!res.ok || data.ok === false) throw new Error(data.message || '保存失败');
      setProfile(data.profile);
      toast.success('主页已保存');
    } catch (e) {
      toast.error(e instanceof Error ? e.message : '保存失败');
    } finally {
      setSaving(false);
    }
  };

  const handleDeposit = async () => {
    if (!isOwner) return;
    const amount = Number(depositAmount);
    if (!Number.isFinite(amount) || amount < 5) {
      toast.error('充值至少 $5');
      return;
    }
    try {
      if (stripeEnabled) {
        const res = await fetch('/api/marketplace/wallet/checkout', {
          method: 'POST',
          headers: authHeaders(),
          body: JSON.stringify({ amount }),
        });
        const data = await res.json();
        if (!res.ok || !data.url) throw new Error(data.message || '无法创建支付');
        window.location.href = data.url;
        return;
      }
      const res = await fetch('/api/marketplace/wallet', {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({ amount }),
      });
      const data = await res.json();
      if (!res.ok || data.ok === false) throw new Error(data.message || '充值失败');
      setWallet(data.wallet);
      toast.success('充值成功');
      void loadWallet();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : '充值失败');
    }
  };

  const handleBuyAi = async () => {
    const count = Math.floor(Number(aiBuyCount));
    if (!Number.isFinite(count) || count < 1) {
      toast.error('请输入购买次数');
      return;
    }
    try {
      const res = await fetch('/api/marketplace/wallet/buy-ai', {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({ count }),
      });
      const data = await res.json();
      if (!res.ok || data.ok === false) throw new Error(data.message || '购买失败');
      toast.success(data.message || '购买成功');
      setWallet(data.wallet);
      void fetchCurrentUser?.();
      void loadWallet();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : '购买失败');
    }
  };

  const handlePassword = async () => {
    if (!passwordForm.currentPassword || !passwordForm.newPassword) {
      toast.error('请填写密码');
      return;
    }
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast.error('两次新密码不一致');
      return;
    }
    try {
      await changePassword({
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword,
      });
      toast.success('密码已更新');
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : '修改失败');
    }
  };

  const content = (
    <Container maxWidth="md" sx={{ py: 4 }}>
      {loading ? (
        <Typography color="text.secondary">加载中…</Typography>
      ) : !profile ? (
        <Alert severity="warning">无法加载该用户主页</Alert>
      ) : (
        <Stack spacing={2}>
          <Paper variant="outlined" sx={{ p: 3 }}>
            <Stack direction="row" spacing={2} alignItems="center">
              <Avatar sx={{ width: 64, height: 64, bgcolor: 'primary.main', fontSize: 28 }}>
                {(profile.displayName || '?').slice(0, 1).toUpperCase()}
              </Avatar>
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Typography variant="h5" fontWeight={800}>
                  {profile.displayName}
                </Typography>
                {profile.showBio || isOwner ? (
                  <Typography variant="body2" color="text.secondary">
                    {profile.bio || (isOwner ? '完善简介，让其他用户更信任你。' : '')}
                  </Typography>
                ) : null}
                {(profile.showJobInfo || isOwner) && (profile.programYear || profile.workState || profile.jobTitle) ? (
                  <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 0.5 }}>
                    {[profile.programYear && `SWT ${profile.programYear}`, profile.workState, profile.jobTitle]
                      .filter(Boolean)
                      .join(' · ')}
                  </Typography>
                ) : null}
              </Box>
            </Stack>

            {!isOwner ? (
              <Stack direction="row" spacing={1} sx={{ mt: 2 }} flexWrap="wrap" useFlexGap>
                <Button
                  variant="contained"
                  startIcon={<ChatBubbleOutlineIcon />}
                  onClick={() => {
                    const prefill = `想联系用户 ${profile.displayName}（${userId}）：\n`;
                    if (!isAuthenticated) {
                      openLoginDialog('登录后可留言联系该用户');
                      return;
                    }
                    requestSupportOpen('human', prefill);
                  }}
                >
                  联系 Ta
                </Button>
                {profile.showWechat && profile.wechat ? (
                  <Button variant="outlined" onClick={() => void navigator.clipboard.writeText(profile.wechat)}>
                    复制微信
                  </Button>
                ) : null}
                {profile.showEmail && profile.email ? (
                  <Button variant="outlined" href={`mailto:${profile.email}`}>
                    发邮件
                  </Button>
                ) : null}
              </Stack>
            ) : null}
          </Paper>

          {isOwner ? (
            <Tabs
              value={tab}
              onChange={(_, v) => setTab(v)}
              variant="scrollable"
              scrollButtons="auto"
              sx={{ borderBottom: 1, borderColor: 'divider' }}
            >
              <Tab value="overview" label="概览" />
              <Tab value="edit" label="资料与隐私" />
              <Tab value="wallet" label="钱包与 AI" icon={<AccountBalanceWalletIcon />} iconPosition="start" />
              <Tab value="password" label="修改密码" />
            </Tabs>
          ) : null}

          {(!isOwner || tab === 'overview') && (
            <Paper variant="outlined" sx={{ p: 2.5 }}>
              <Typography variant="subtitle1" fontWeight={700} gutterBottom>
                公开信息
              </Typography>
              <Typography variant="body2" color="text.secondary">
                联系方式默认不公开。访客仅能看到你勾选展示的字段。
              </Typography>
              {isOwner ? (
                <Stack direction="row" spacing={1} sx={{ mt: 2 }} flexWrap="wrap" useFlexGap>
                  <Button variant="contained" onClick={() => setTab('edit')}>
                    编辑资料
                  </Button>
                  <Button variant="outlined" onClick={() => setTab('wallet')}>
                    打开钱包
                  </Button>
                  <Button variant="outlined" component={Link} href="/deals/market?tab=my_listings">
                    我的帖子
                  </Button>
                  {authUser?.role === 'admin' ? (
                    <Button variant="outlined" component={Link} href="/admin/dashboard">
                      管理后台
                    </Button>
                  ) : null}
                </Stack>
              ) : null}
            </Paper>
          )}

          {isOwner && tab === 'edit' ? (
            <Paper variant="outlined" sx={{ p: 2.5 }}>
              <Stack spacing={2}>
                <Typography variant="subtitle1" fontWeight={700}>
                  基本信息
                </Typography>
                <TextField
                  label="显示名称"
                  size="small"
                  fullWidth
                  value={profile.displayName}
                  onChange={(e) => setProfile({ ...profile, displayName: e.target.value })}
                />
                <TextField
                  label="简介"
                  size="small"
                  fullWidth
                  multiline
                  minRows={3}
                  value={profile.bio}
                  onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
                />
                <Divider />
                <Typography variant="subtitle1" fontWeight={700}>
                  SWT / 岗位信息
                </Typography>
                <TextField
                  label="项目年份"
                  size="small"
                  placeholder="如 2025"
                  value={profile.programYear}
                  onChange={(e) => setProfile({ ...profile, programYear: e.target.value })}
                />
                <TextField
                  label="工作州 (State)"
                  size="small"
                  placeholder="如 NJ"
                  value={profile.workState}
                  onChange={(e) => setProfile({ ...profile, workState: e.target.value })}
                />
                <TextField
                  label="岗位"
                  size="small"
                  value={profile.jobTitle}
                  onChange={(e) => setProfile({ ...profile, jobTitle: e.target.value })}
                />
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={profile.showJobInfo}
                      onChange={(e) => setProfile({ ...profile, showJobInfo: e.target.checked })}
                    />
                  }
                  label="公开展示 SWT / 岗位信息"
                />
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={profile.showBio}
                      onChange={(e) => setProfile({ ...profile, showBio: e.target.checked })}
                    />
                  }
                  label="公开展示简介"
                />
                <Divider />
                <Typography variant="subtitle1" fontWeight={700}>
                  联系方式（默认不公开）
                </Typography>
                <TextField
                  label="微信号"
                  size="small"
                  fullWidth
                  value={profile.wechat}
                  onChange={(e) => setProfile({ ...profile, wechat: e.target.value })}
                />
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={profile.showWechat}
                      onChange={(e) => setProfile({ ...profile, showWechat: e.target.checked })}
                    />
                  }
                  label="公开微信号"
                />
                <TextField
                  label="邮箱"
                  size="small"
                  fullWidth
                  value={profile.email}
                  onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                />
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={profile.showEmail}
                      onChange={(e) => setProfile({ ...profile, showEmail: e.target.checked })}
                    />
                  }
                  label="公开邮箱"
                />
                <Button variant="contained" onClick={() => void saveProfile()} disabled={saving}>
                  {saving ? '保存中…' : '保存'}
                </Button>
              </Stack>
            </Paper>
          ) : null}

          {isOwner && tab === 'wallet' ? (
            <Paper variant="outlined" sx={{ p: 2.5 }}>
              <Alert severity="info" sx={{ mb: 2 }}>
                钱包余额可用于：交易市集托管押金，以及购买 AI 问答次数（默认 $0.5/次）。发布帖子需提前存入押金，让行动者更安心。
              </Alert>
              {!isAuthenticated ? (
                <Alert severity="warning">请先登录</Alert>
              ) : (
                <Stack spacing={2}>
                  <Typography variant="h4" fontWeight={800}>
                    ${(wallet?.balance ?? 0).toFixed(2)}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    托管中 ${(wallet?.locked ?? 0).toFixed(2)} · 累计充值 ${(wallet?.deposited ?? 0).toFixed(2)}
                  </Typography>
                  {authUser?.freeChatRemaining != null ? (
                    <Typography variant="body2">剩余 AI 问答：{authUser.freeChatRemaining} 次</Typography>
                  ) : (
                    <Typography variant="body2" color="text.secondary">
                      AI 问答：管理员/老用户通常不限次
                    </Typography>
                  )}
                  <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1}>
                    <TextField
                      size="small"
                      type="number"
                      label="充值金额 USD"
                      value={depositAmount}
                      onChange={(e) => setDepositAmount(e.target.value)}
                      sx={{ width: 160 }}
                    />
                    <Button variant="contained" onClick={() => void handleDeposit()}>
                      {stripeEnabled ? 'Stripe 充值' : '演示充值'}
                    </Button>
                  </Stack>
                  <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} alignItems="center">
                    <TextField
                      size="small"
                      type="number"
                      label="购买问答次数"
                      value={aiBuyCount}
                      onChange={(e) => setAiBuyCount(e.target.value)}
                      sx={{ width: 160 }}
                    />
                    <Button variant="outlined" onClick={() => void handleBuyAi()}>
                      用余额购买 AI 次数
                    </Button>
                  </Stack>
                  {txs.length > 0 ? (
                    <Box>
                      <Typography variant="subtitle2" gutterBottom>
                        最近流水
                      </Typography>
                      {txs.slice(0, 10).map((tx) => (
                        <Typography key={tx.id} variant="caption" display="block" color="text.secondary">
                          {new Date(tx.createdAt).toLocaleString()} · {tx.type} · ${tx.amount.toFixed(2)}
                          {tx.note ? ` — ${tx.note}` : ''}
                        </Typography>
                      ))}
                    </Box>
                  ) : null}
                </Stack>
              )}
            </Paper>
          ) : null}

          {isOwner && tab === 'password' ? (
            <Paper variant="outlined" sx={{ p: 2.5 }}>
              <Stack spacing={2} maxWidth={400}>
                <TextField
                  label="当前密码"
                  type="password"
                  size="small"
                  value={passwordForm.currentPassword}
                  onChange={(e) => setPasswordForm((p) => ({ ...p, currentPassword: e.target.value }))}
                />
                <TextField
                  label="新密码"
                  type="password"
                  size="small"
                  value={passwordForm.newPassword}
                  onChange={(e) => setPasswordForm((p) => ({ ...p, newPassword: e.target.value }))}
                />
                <TextField
                  label="确认新密码"
                  type="password"
                  size="small"
                  value={passwordForm.confirmPassword}
                  onChange={(e) => setPasswordForm((p) => ({ ...p, confirmPassword: e.target.value }))}
                />
                <Button variant="contained" onClick={() => void handlePassword()}>
                  更新密码
                </Button>
              </Stack>
            </Paper>
          ) : null}
        </Stack>
      )}
    </Container>
  );

  return isMobile ? (
    <MobileLayout>{content}</MobileLayout>
  ) : (
    <DesktopLayout maxWidthClassName="max-w-3xl">{content}</DesktopLayout>
  );
}
