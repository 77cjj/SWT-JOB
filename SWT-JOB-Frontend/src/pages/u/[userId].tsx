'use client';

import { useCallback, useEffect, useState, type ReactNode } from 'react';
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
  TextField,
  Typography,
} from '@mui/material';
import ChatBubbleOutlineIcon from '@mui/icons-material/ChatBubbleOutline';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import VpnKeyIcon from '@mui/icons-material/VpnKey';
import EditIcon from '@mui/icons-material/Edit';
import DesktopLayout from '../../layout/desktop/Layout';
import MobileLayout from '../../layout/mobile/Layout';
import useDevice from '../../hooks/useDevice';
import { useAuthStore } from '@/stores/authStore';
import { useSupportWidgetStore } from '../../stores/supportWidgetStore';
import { changePassword } from '@/services/userService';
import { storage } from '@/utils/storage';
import type { UserPublicProfile } from '../../lib/profile/types';
import { emptyExperience, normalizeExperiences } from '../../lib/profile/types';
import type { WalletAccount, WalletTransaction } from '../../lib/marketplace/types';
import { toast } from 'sonner';
import AddIcon from '@mui/icons-material/Add';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import IconButton from '@mui/material/IconButton';

function authHeaders(): HeadersInit {
  const token = storage.getToken();
  // Sa-Token 使用裸 token；勿加 Bearer（市集 API 侧也会剥离，双保险）
  return token
    ? { Authorization: token, 'Content-Type': 'application/json' }
    : { 'Content-Type': 'application/json' };
}

type ProfileSection = 'edit' | 'wallet' | 'password';

function SectionTitle({
  title,
  action,
  icon,
}: {
  title: string;
  action?: ReactNode;
  icon?: ReactNode;
}) {
  return (
    <Stack direction="row" alignItems="center" justifyContent="space-between" gap={1} sx={{ mb: 2 }}>
      <Stack direction="row" alignItems="center" gap={1}>
        {icon}
        <Typography variant="h6" fontWeight={700}>
          {title}
        </Typography>
      </Stack>
      {action}
    </Stack>
  );
}

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
      setProfile({
        ...data.profile,
        swtExperiences:
          normalizeExperiences(data.profile).length > 0
            ? normalizeExperiences(data.profile)
            : [emptyExperience()],
      });
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
    if (isOwner) void loadWallet();
  }, [isOwner, loadWallet]);

  useEffect(() => {
    if (!router.isReady) return;
    const section = router.query.tab;
    if (typeof section === 'string' && ['edit', 'wallet', 'password'].includes(section)) {
      window.setTimeout(() => {
        document.getElementById(`profile-${section}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 120);
    }
  }, [router.isReady, router.query.tab]);

  useEffect(() => {
    if (!isOwner || !router.isReady) return;
    if (router.query.deposit === 'success') {
      toast.success('支付完成，余额将在几秒内更新');
      document.getElementById('profile-wallet')?.scrollIntoView({ behavior: 'smooth' });
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

  const experiences = profile ? normalizeExperiences(profile) : [];
  const showExperiences = profile && (profile.showJobInfo || isOwner) && experiences.length > 0;

  const scrollTo = (section: ProfileSection) => {
    document.getElementById(`profile-${section}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const content = (
    <Container maxWidth="lg" sx={{ py: { xs: 3, md: 4 }, px: { xs: 2, sm: 3 } }}>
      {loading ? (
        <Typography color="text.secondary">加载中…</Typography>
      ) : !profile ? (
        <Alert severity="warning">无法加载该用户主页</Alert>
      ) : (
        <Stack spacing={3}>
          {/* 顶栏：头像 + 简介 */}
          <Paper variant="outlined" sx={{ p: { xs: 2.5, md: 3.5 }, borderRadius: 2 }}>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2.5} alignItems={{ sm: 'center' }}>
              <Avatar sx={{ width: 88, height: 88, bgcolor: 'primary.main', fontSize: 36, mx: { xs: 'auto', sm: 0 } }}>
                {(profile.displayName || '?').slice(0, 1).toUpperCase()}
              </Avatar>
              <Box sx={{ flex: 1, minWidth: 0, textAlign: { xs: 'center', sm: 'left' } }}>
                <Typography variant="h4" fontWeight={800} gutterBottom>
                  {profile.displayName}
                </Typography>
                {(profile.showBio || isOwner) && (
                  <Typography variant="body1" color="text.secondary" sx={{ maxWidth: 720 }}>
                    {profile.bio || (isOwner ? '完善简介，让其他用户更信任你。' : '暂无简介')}
                  </Typography>
                )}
                {isOwner ? (
                  <Stack direction="row" spacing={1} sx={{ mt: 2 }} flexWrap="wrap" useFlexGap justifyContent={{ xs: 'center', sm: 'flex-start' }}>
                    <Button size="small" variant="outlined" startIcon={<EditIcon />} onClick={() => scrollTo('edit')}>
                      编辑资料
                    </Button>
                    <Button size="small" variant="outlined" startIcon={<AccountBalanceWalletIcon />} onClick={() => scrollTo('wallet')}>
                      钱包
                    </Button>
                    <Button size="small" variant="outlined" component={Link} href="/deals/market?tab=my_listings">
                      我的帖子
                    </Button>
                    {authUser?.role === 'admin' ? (
                      <Button size="small" variant="outlined" component={Link} href="/admin/dashboard">
                        管理后台
                      </Button>
                    ) : null}
                  </Stack>
                ) : null}
              </Box>
            </Stack>

            {!isOwner ? (
              <Stack direction="row" spacing={1} sx={{ mt: 2.5 }} flexWrap="wrap" useFlexGap justifyContent="center">
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

          {/* SWT 经历平铺卡片 */}
          {showExperiences ? (
            <Box>
              <Typography variant="h6" fontWeight={700} sx={{ mb: 1.5 }}>
                SWT 经历
              </Typography>
              <Box
                sx={{
                  display: 'grid',
                  gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', md: 'repeat(3, 1fr)' },
                  gap: 2,
                }}
              >
                {experiences.map((exp) => (
                  <Paper key={exp.id} variant="outlined" sx={{ p: 2, height: '100%', borderRadius: 2 }}>
                      <Typography variant="subtitle2" fontWeight={700} color="primary.main" gutterBottom>
                        {exp.programYear ? `SWT ${exp.programYear}` : 'SWT 经历'}
                      </Typography>
                      <Typography variant="body2" fontWeight={600}>
                        {exp.jobTitle || '岗位待填写'}
                      </Typography>
                      <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 0.5 }}>
                        {[exp.workState, exp.city, exp.employerHint].filter(Boolean).join(' · ')}
                      </Typography>
                    </Paper>
                ))}
              </Box>
            </Box>
          ) : null}

          {/* 本人：各区块平铺 */}
          {isOwner ? (
            <>
              <Paper id="profile-edit" variant="outlined" sx={{ p: { xs: 2, md: 3 }, borderRadius: 2, scrollMarginTop: 88 }}>
                <SectionTitle
                  title="资料与隐私"
                  icon={<EditIcon fontSize="small" color="action" />}
                  action={
                    <Button variant="contained" size="small" onClick={() => void saveProfile()} disabled={saving}>
                      {saving ? '保存中…' : '保存全部'}
                    </Button>
                  }
                />
                <Stack spacing={2}>
                  <Stack direction="row" alignItems="center" justifyContent="space-between" gap={1}>
                    <Typography variant="subtitle1" fontWeight={700}>
                      基本信息
                    </Typography>
                    <FormControlLabel
                      sx={{ m: 0 }}
                      control={
                        <Checkbox
                          size="small"
                          checked={profile.showBio}
                          onChange={(e) => setProfile({ ...profile, showBio: e.target.checked })}
                        />
                      }
                      label={<Typography variant="body2">公开简介</Typography>}
                    />
                  </Stack>
                  <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 2 }}>
                    <TextField
                      label="显示名称"
                      size="small"
                      fullWidth
                      value={profile.displayName}
                      onChange={(e) => setProfile({ ...profile, displayName: e.target.value })}
                    />
                    <Box sx={{ gridColumn: '1 / -1' }}>
                      <TextField
                        label="简介"
                        size="small"
                        fullWidth
                        multiline
                        minRows={3}
                        value={profile.bio}
                        onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
                      />
                    </Box>
                  </Box>

                  <Divider />

                  <Stack direction="row" alignItems="center" justifyContent="space-between" gap={1}>
                    <Typography variant="subtitle1" fontWeight={700}>
                      SWT 经历（可多届）
                    </Typography>
                    <FormControlLabel
                      sx={{ m: 0 }}
                      control={
                        <Checkbox
                          size="small"
                          checked={profile.showJobInfo}
                          onChange={(e) => setProfile({ ...profile, showJobInfo: e.target.checked })}
                        />
                      }
                      label={<Typography variant="body2">公开经历</Typography>}
                    />
                  </Stack>

                  <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 2 }}>
                    {(profile.swtExperiences?.length ? profile.swtExperiences : [emptyExperience()]).map((exp, index) => (
                      <Paper key={exp.id || index} variant="outlined" sx={{ p: 2, height: '100%' }}>
                          <Stack spacing={1.25}>
                            <Stack direction="row" justifyContent="space-between" alignItems="center">
                              <Typography variant="body2" fontWeight={600}>
                                第 {index + 1} 届
                              </Typography>
                              <IconButton
                                size="small"
                                aria-label="删除经历"
                                disabled={(profile.swtExperiences?.length || 0) <= 1}
                                onClick={() => {
                                  const next = (profile.swtExperiences || []).filter((x) => x.id !== exp.id);
                                  setProfile({ ...profile, swtExperiences: next.length ? next : [emptyExperience()] });
                                }}
                              >
                                <DeleteOutlineIcon fontSize="small" />
                              </IconButton>
                            </Stack>
                            <TextField
                              label="项目年份"
                              size="small"
                              placeholder="如 2025"
                              value={exp.programYear}
                              onChange={(e) => {
                                const next = [...(profile.swtExperiences || [])];
                                next[index] = { ...exp, programYear: e.target.value };
                                setProfile({ ...profile, swtExperiences: next });
                              }}
                            />
                            <TextField
                              label="工作州"
                              size="small"
                              placeholder="如 NJ"
                              value={exp.workState}
                              onChange={(e) => {
                                const next = [...(profile.swtExperiences || [])];
                                next[index] = { ...exp, workState: e.target.value };
                                setProfile({ ...profile, swtExperiences: next });
                              }}
                            />
                            <TextField
                              label="城市（选填）"
                              size="small"
                              value={exp.city || ''}
                              onChange={(e) => {
                                const next = [...(profile.swtExperiences || [])];
                                next[index] = { ...exp, city: e.target.value };
                                setProfile({ ...profile, swtExperiences: next });
                              }}
                            />
                            <TextField
                              label="岗位"
                              size="small"
                              value={exp.jobTitle}
                              onChange={(e) => {
                                const next = [...(profile.swtExperiences || [])];
                                next[index] = { ...exp, jobTitle: e.target.value };
                                setProfile({ ...profile, swtExperiences: next });
                              }}
                            />
                            <TextField
                              label="雇主提示（选填）"
                              size="small"
                              value={exp.employerHint || ''}
                              onChange={(e) => {
                                const next = [...(profile.swtExperiences || [])];
                                next[index] = { ...exp, employerHint: e.target.value };
                                setProfile({ ...profile, swtExperiences: next });
                              }}
                            />
                          </Stack>
                        </Paper>
                    ))}
                  </Box>
                  <Button
                    startIcon={<AddIcon />}
                    variant="outlined"
                    onClick={() =>
                      setProfile({
                        ...profile,
                        swtExperiences: [...(profile.swtExperiences || []), emptyExperience()],
                      })
                    }
                  >
                    添加一届经历
                  </Button>

                  <Divider />

                  <Typography variant="subtitle1" fontWeight={700}>
                    联系方式
                  </Typography>
                  <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 2 }}>
                    <Box>
                      <Stack direction="row" alignItems="center" justifyContent="space-between" gap={1}>
                        <Typography variant="body2" color="text.secondary">
                          微信号
                        </Typography>
                        <FormControlLabel
                          sx={{ m: 0 }}
                          control={
                            <Checkbox
                              size="small"
                              checked={profile.showWechat}
                              onChange={(e) => setProfile({ ...profile, showWechat: e.target.checked })}
                            />
                          }
                          label={<Typography variant="body2">公开</Typography>}
                        />
                      </Stack>
                      <TextField
                        size="small"
                        fullWidth
                        sx={{ mt: 0.5 }}
                        value={profile.wechat}
                        onChange={(e) => setProfile({ ...profile, wechat: e.target.value })}
                        placeholder="微信号"
                      />
                    </Box>
                    <Box>
                      <Stack direction="row" alignItems="center" justifyContent="space-between" gap={1}>
                        <Typography variant="body2" color="text.secondary">
                          邮箱
                        </Typography>
                        <FormControlLabel
                          sx={{ m: 0 }}
                          control={
                            <Checkbox
                              size="small"
                              checked={profile.showEmail}
                              onChange={(e) => setProfile({ ...profile, showEmail: e.target.checked })}
                            />
                          }
                          label={<Typography variant="body2">公开</Typography>}
                        />
                      </Stack>
                      <TextField
                        size="small"
                        fullWidth
                        sx={{ mt: 0.5 }}
                        value={profile.email}
                        onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                        placeholder="邮箱"
                      />
                    </Box>
                  </Box>
                </Stack>
              </Paper>

              <Paper id="profile-wallet" variant="outlined" sx={{ p: { xs: 2, md: 3 }, borderRadius: 2, scrollMarginTop: 88 }}>
                <SectionTitle title="钱包与 AI" icon={<AccountBalanceWalletIcon fontSize="small" color="action" />} />
                <Alert severity="info" sx={{ mb: 2 }}>
                  余额可用于市集托管押金与 AI 问答（约 $0.5/次）。发布帖子需提前存押金，让行动者更安心。
                </Alert>
                {!isAuthenticated ? (
                  <Alert severity="warning">请先登录</Alert>
                ) : (
                  <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 2fr' }, gap: 3 }}>
                    <Box>
                      <Typography variant="h3" fontWeight={800} color="primary.main">
                        ${(wallet?.balance ?? 0).toFixed(2)}
                      </Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                        托管中 ${(wallet?.locked ?? 0).toFixed(2)}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        累计充值 ${(wallet?.deposited ?? 0).toFixed(2)}
                      </Typography>
                      {authUser?.freeChatRemaining != null ? (
                        <Typography variant="body2" sx={{ mt: 1 }}>
                          剩余 AI 问答：{authUser.freeChatRemaining} 次
                        </Typography>
                      ) : (
                        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                          AI 问答：管理员/老用户通常不限次
                        </Typography>
                      )}
                    </Box>
                    <Box>
                      <Stack spacing={1.5}>
                        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1}>
                          <TextField
                            size="small"
                            type="number"
                            label="充值 USD"
                            value={depositAmount}
                            onChange={(e) => setDepositAmount(e.target.value)}
                            sx={{ width: 160 }}
                          />
                          <Button variant="contained" onClick={() => void handleDeposit()}>
                            {stripeEnabled ? 'Stripe 充值' : '演示充值'}
                          </Button>
                        </Stack>
                        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1}>
                          <TextField
                            size="small"
                            type="number"
                            label="购买问答次数"
                            value={aiBuyCount}
                            onChange={(e) => setAiBuyCount(e.target.value)}
                            sx={{ width: 160 }}
                          />
                          <Button variant="outlined" onClick={() => void handleBuyAi()}>
                            用余额购买
                          </Button>
                        </Stack>
                      </Stack>
                      {txs.length > 0 ? (
                        <Box sx={{ mt: 2 }}>
                          <Typography variant="subtitle2" gutterBottom>
                            最近流水
                          </Typography>
                          {txs.slice(0, 8).map((tx) => (
                            <Typography key={tx.id} variant="caption" display="block" color="text.secondary">
                              {new Date(tx.createdAt).toLocaleString()} · {tx.type} · ${tx.amount.toFixed(2)}
                              {tx.note ? ` — ${tx.note}` : ''}
                            </Typography>
                          ))}
                        </Box>
                      ) : null}
                    </Box>
                  </Box>
                )}
              </Paper>

              <Paper id="profile-password" variant="outlined" sx={{ p: { xs: 2, md: 3 }, borderRadius: 2, scrollMarginTop: 88 }}>
                <SectionTitle title="修改密码" icon={<VpnKeyIcon fontSize="small" color="action" />} />
                <Box sx={{ maxWidth: 480 }}>
                    <Stack spacing={2}>
                      <Alert severity="info" sx={{ py: 0.5 }}>
                        忘记密码？请在登录弹窗点「忘记密码？」联系站长重置。
                      </Alert>
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
                      <Stack direction="row" spacing={1}>
                        <Button variant="contained" onClick={() => void handlePassword()}>
                          更新密码
                        </Button>
                        <Button
                          variant="text"
                          onClick={() => {
                            requestSupportOpen(
                              'human',
                              `【忘记密码】\n用户：${authUser?.username || userId}\n请协助重置密码。\n`,
                            );
                          }}
                        >
                          联系站长
                        </Button>
                      </Stack>
                    </Stack>
                </Box>
              </Paper>
            </>
          ) : null}
        </Stack>
      )}
    </Container>
  );

  return isMobile ? (
    <MobileLayout>{content}</MobileLayout>
  ) : (
    <DesktopLayout maxWidthClassName="max-w-5xl">{content}</DesktopLayout>
  );
}
