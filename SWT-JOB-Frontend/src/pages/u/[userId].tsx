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
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import ChatBubbleOutlineIcon from '@mui/icons-material/ChatBubbleOutline';
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
import { toast } from 'sonner';
import AddIcon from '@mui/icons-material/Add';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import IconButton from '@mui/material/IconButton';
import ProfileDealList from '../../components/profile/ProfileDealList';
import { useI18n } from '../../context/I18nContext';

function authHeaders(): HeadersInit {
  const token = storage.getToken();
  return token
    ? { Authorization: token, 'Content-Type': 'application/json' }
    : { 'Content-Type': 'application/json' };
}

type ProfileSection = 'edit' | 'password' | 'deals';

const displayFont = 'var(--font-display, "Space Grotesk", "Noto Sans SC", sans-serif)';
const bodyFont = 'var(--font-body, "DM Sans", "Noto Sans SC", sans-serif)';

function SectionLabel({ children }: { children: ReactNode }) {
  return (
    <Typography
      component="h2"
      sx={{
        fontFamily: displayFont,
        fontWeight: 700,
        fontSize: { xs: '1.25rem', md: '1.45rem' },
        letterSpacing: '-0.02em',
        color: '#0f172a',
        mb: 1.25,
      }}
    >
      {children}
    </Typography>
  );
}

export default function UserProfilePage() {
  const router = useRouter();
  const { language } = useI18n();
  const isMobile = useDevice();
  const authUser = useAuthStore((s) => s.user);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const openLoginDialog = useAuthStore((s) => s.openLoginDialog);
  const requestSupportOpen = useSupportWidgetStore((s) => s.requestOpen);

  const userId = typeof router.query.userId === 'string' ? router.query.userId : '';
  const isOwner = Boolean(isAuthenticated && authUser?.userId && authUser.userId === userId);

  const [profile, setProfile] = useState<UserPublicProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
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

  useEffect(() => {
    void loadProfile();
  }, [loadProfile]);

  useEffect(() => {
    if (!router.isReady) return;
    const section = router.query.tab;
    if (typeof section === 'string' && ['edit', 'password', 'deals'].includes(section)) {
      window.setTimeout(() => {
        document.getElementById(`profile-${section}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 120);
    }
  }, [router.isReady, router.query.tab]);

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
  const showExperiences = profile && (profile.showJobInfo || isOwner) && experiences.some(
    (e) => e.jobTitle || e.programYear || e.workState || e.city,
  );

  const scrollTo = (section: ProfileSection) => {
    document.getElementById(`profile-${section}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const content = (
    <Box
      sx={{
        position: 'relative',
        minHeight: '75vh',
        fontFamily: bodyFont,
        '&::before': {
          content: '""',
          position: 'absolute',
          inset: 0,
          zIndex: 0,
          pointerEvents: 'none',
          background:
            'radial-gradient(1100px 420px at 10% -12%, rgba(15,118,110,0.13), transparent 58%), radial-gradient(800px 360px at 90% 0%, rgba(234,179,8,0.10), transparent 52%), linear-gradient(180deg, #f4f1eb 0%, #eef3f2 40%, #f7f8f8 100%)',
        },
      }}
    >
      <Container maxWidth="md" sx={{ position: 'relative', zIndex: 1, py: { xs: 4, md: 6 }, px: { xs: 2.5, sm: 3 } }}>
        {loading ? (
          <Typography color="text.secondary">{language === 'zh' ? '加载中…' : 'Loading…'}</Typography>
        ) : !profile ? (
          <Alert severity="warning">{language === 'zh' ? '无法加载该用户主页' : 'Could not load this profile'}</Alert>
        ) : (
          <Stack spacing={{ xs: 4, md: 5 }}>
            {/* Identity */}
            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: { xs: '1fr', sm: 'auto 1fr' },
                gap: { xs: 2.5, sm: 3.5 },
                alignItems: 'center',
              }}
            >
              <Avatar
                sx={{
                  width: { xs: 92, md: 112 },
                  height: { xs: 92, md: 112 },
                  bgcolor: '#115e59',
                  fontFamily: displayFont,
                  fontSize: { xs: 38, md: 46 },
                  fontWeight: 700,
                  mx: { xs: 'auto', sm: 0 },
                  boxShadow: '0 22px 44px -28px rgba(17,94,89,0.9)',
                }}
              >
                {(profile.displayName || '?').slice(0, 1).toUpperCase()}
              </Avatar>
              <Box sx={{ textAlign: { xs: 'center', sm: 'left' } }}>
                <Typography
                  sx={{
                    fontFamily: displayFont,
                    fontSize: 12,
                    fontWeight: 700,
                    letterSpacing: '0.2em',
                    textTransform: 'uppercase',
                    color: 'rgba(17,94,89,0.8)',
                    mb: 0.75,
                  }}
                >
                  SWT · Profile
                </Typography>
                <Typography
                  component="h1"
                  sx={{
                    fontFamily: displayFont,
                    fontWeight: 800,
                    fontSize: { xs: '2.15rem', md: '2.75rem' },
                    lineHeight: 1.05,
                    letterSpacing: '-0.03em',
                    color: '#0f172a',
                  }}
                >
                  {profile.displayName}
                </Typography>
                {(profile.showBio || isOwner) && (
                  <Typography
                    sx={{
                      mt: 1.25,
                      maxWidth: 560,
                      mx: { xs: 'auto', sm: 0 },
                      color: 'rgba(15,23,42,0.62)',
                      lineHeight: 1.7,
                      fontSize: '1.02rem',
                    }}
                  >
                    {profile.bio ||
                      (isOwner
                        ? language === 'zh'
                          ? '写一句简介：你在哪儿、干过什么、能帮别人什么。'
                          : 'Add a short bio: where you are, what you’ve done, how you can help.'
                        : language === 'zh'
                          ? '暂无简介'
                          : 'No bio yet')}
                  </Typography>
                )}
                <Stack
                  direction="row"
                  spacing={1}
                  sx={{ mt: 2.25 }}
                  flexWrap="wrap"
                  useFlexGap
                  justifyContent={{ xs: 'center', sm: 'flex-start' }}
                >
                  {isOwner ? (
                    <>
                      <Button
                        size="small"
                        variant="contained"
                        startIcon={<EditIcon />}
                        onClick={() => scrollTo('edit')}
                        sx={{ bgcolor: '#115e59', '&:hover': { bgcolor: '#0f766e' } }}
                      >
                        {language === 'zh' ? '编辑资料' : 'Edit profile'}
                      </Button>
                      <Button
                        size="small"
                        variant="text"
                        onClick={() => scrollTo('deals')}
                        sx={{ color: '#0f172a' }}
                      >
                        {language === 'zh' ? '我的薅羊毛' : 'My deals'}
                      </Button>
                      <Button
                        size="small"
                        variant="text"
                        component={Link}
                        href="/deals/market?tab=my_listings"
                        sx={{ color: 'rgba(15,23,42,0.7)' }}
                      >
                        {language === 'zh' ? '市集帖子' : 'Listings'}
                      </Button>
                      {authUser?.role === 'admin' ? (
                        <Button
                          size="small"
                          variant="text"
                          component={Link}
                          href="/admin/dashboard"
                          sx={{ color: 'rgba(15,23,42,0.7)' }}
                        >
                          {language === 'zh' ? '管理后台' : 'Admin'}
                        </Button>
                      ) : null}
                    </>
                  ) : (
                    <>
                      <Button
                        variant="contained"
                        startIcon={<ChatBubbleOutlineIcon />}
                        onClick={() => {
                          const prefill = `想联系用户 ${profile.displayName}（${userId}）：\n`;
                          if (!isAuthenticated) {
                            openLoginDialog(language === 'zh' ? '登录后可留言联系该用户' : 'Sign in to contact this user');
                            return;
                          }
                          requestSupportOpen('human', prefill);
                        }}
                        sx={{ bgcolor: '#115e59', '&:hover': { bgcolor: '#0f766e' } }}
                      >
                        {language === 'zh' ? '联系 Ta' : 'Contact'}
                      </Button>
                      {profile.showWechat && profile.wechat ? (
                        <Button
                          variant="outlined"
                          onClick={() => void navigator.clipboard.writeText(profile.wechat)}
                          sx={{ borderColor: 'rgba(15,23,42,0.16)' }}
                        >
                          {language === 'zh' ? '复制微信' : 'Copy WeChat'}
                        </Button>
                      ) : null}
                      {profile.showEmail && profile.email ? (
                        <Button
                          variant="outlined"
                          href={`mailto:${profile.email}`}
                          sx={{ borderColor: 'rgba(15,23,42,0.16)' }}
                        >
                          {language === 'zh' ? '发邮件' : 'Email'}
                        </Button>
                      ) : null}
                    </>
                  )}
                </Stack>
              </Box>
            </Box>

            {/* Experiences as list */}
            {showExperiences ? (
              <Box>
                <SectionLabel>{language === 'zh' ? 'SWT 经历' : 'SWT experience'}</SectionLabel>
                <Box sx={{ borderTop: '1px solid rgba(15,23,42,0.1)' }}>
                  {experiences
                    .filter((e) => e.jobTitle || e.programYear || e.workState || e.city)
                    .map((exp, index) => (
                      <Box
                        key={exp.id}
                        sx={{
                          display: 'grid',
                          gridTemplateColumns: { xs: '1fr', sm: '120px 1fr' },
                          gap: { xs: 0.5, sm: 2 },
                          py: 1.75,
                          borderBottom: '1px solid rgba(15,23,42,0.08)',
                          animation: 'profileRowIn .35s ease both',
                          animationDelay: `${index * 0.05}s`,
                          '@keyframes profileRowIn': {
                            from: { opacity: 0, transform: 'translateY(6px)' },
                            to: { opacity: 1, transform: 'none' },
                          },
                        }}
                      >
                        <Typography
                          sx={{
                            fontFamily: displayFont,
                            fontWeight: 700,
                            color: '#115e59',
                            fontSize: '0.95rem',
                          }}
                        >
                          {exp.programYear ? `SWT ${exp.programYear}` : 'SWT'}
                        </Typography>
                        <Box>
                          <Typography sx={{ fontWeight: 700, color: '#0f172a' }}>
                            {exp.jobTitle || (language === 'zh' ? '岗位待填写' : 'Role TBD')}
                          </Typography>
                          <Typography variant="body2" sx={{ color: 'rgba(15,23,42,0.55)', mt: 0.25 }}>
                            {[exp.workState, exp.city, exp.employerHint].filter(Boolean).join(' · ') || '—'}
                          </Typography>
                        </Box>
                      </Box>
                    ))}
                </Box>
              </Box>
            ) : null}

            {/* Deals list */}
            <Box id="profile-deals" sx={{ scrollMarginTop: 88 }}>
              <ProfileDealList userId={userId} language={language} editable={isOwner} />
            </Box>

            {/* Owner settings — quieter, secondary */}
            {isOwner ? (
              <Box
                id="profile-edit"
                sx={{
                  scrollMarginTop: 88,
                  pt: { xs: 1, md: 2 },
                  borderTop: '1px solid rgba(15,23,42,0.1)',
                }}
              >
                <Stack
                  direction="row"
                  alignItems="center"
                  justifyContent="space-between"
                  gap={1}
                  sx={{ mb: 2 }}
                >
                  <SectionLabel>{language === 'zh' ? '资料与隐私' : 'Profile & privacy'}</SectionLabel>
                  <Button
                    variant="contained"
                    size="small"
                    onClick={() => void saveProfile()}
                    disabled={saving}
                    sx={{ bgcolor: '#115e59', '&:hover': { bgcolor: '#0f766e' } }}
                  >
                    {saving
                      ? language === 'zh'
                        ? '保存中…'
                        : 'Saving…'
                      : language === 'zh'
                        ? '保存'
                        : 'Save'}
                  </Button>
                </Stack>

                <Stack spacing={2.5}>
                  <Stack direction="row" alignItems="center" justifyContent="space-between" gap={1}>
                    <Typography fontWeight={700}>{language === 'zh' ? '基本信息' : 'Basics'}</Typography>
                    <FormControlLabel
                      sx={{ m: 0 }}
                      control={
                        <Checkbox
                          size="small"
                          checked={profile.showBio}
                          onChange={(e) => setProfile({ ...profile, showBio: e.target.checked })}
                        />
                      }
                      label={<Typography variant="body2">{language === 'zh' ? '公开简介' : 'Show bio'}</Typography>}
                    />
                  </Stack>
                  <TextField
                    label={language === 'zh' ? '显示名称' : 'Display name'}
                    size="small"
                    fullWidth
                    value={profile.displayName}
                    onChange={(e) => setProfile({ ...profile, displayName: e.target.value })}
                  />
                  <TextField
                    label={language === 'zh' ? '简介' : 'Bio'}
                    size="small"
                    fullWidth
                    multiline
                    minRows={3}
                    value={profile.bio}
                    onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
                  />

                  <Divider sx={{ borderColor: 'rgba(15,23,42,0.08)' }} />

                  <Stack direction="row" alignItems="center" justifyContent="space-between" gap={1}>
                    <Typography fontWeight={700}>{language === 'zh' ? 'SWT 经历' : 'SWT experience'}</Typography>
                    <FormControlLabel
                      sx={{ m: 0 }}
                      control={
                        <Checkbox
                          size="small"
                          checked={profile.showJobInfo}
                          onChange={(e) => setProfile({ ...profile, showJobInfo: e.target.checked })}
                        />
                      }
                      label={<Typography variant="body2">{language === 'zh' ? '公开经历' : 'Show experience'}</Typography>}
                    />
                  </Stack>

                  <Stack spacing={1.5}>
                    {(profile.swtExperiences?.length ? profile.swtExperiences : [emptyExperience()]).map(
                      (exp, index) => (
                        <Box
                          key={exp.id || index}
                          sx={{
                            py: 1.5,
                            borderBottom: '1px solid rgba(15,23,42,0.06)',
                          }}
                        >
                          <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
                            <Typography variant="body2" fontWeight={700}>
                              {language === 'zh' ? `第 ${index + 1} 届` : `Season ${index + 1}`}
                            </Typography>
                            <IconButton
                              size="small"
                              aria-label="删除经历"
                              disabled={(profile.swtExperiences?.length || 0) <= 1}
                              onClick={() => {
                                const next = (profile.swtExperiences || []).filter((x) => x.id !== exp.id);
                                setProfile({
                                  ...profile,
                                  swtExperiences: next.length ? next : [emptyExperience()],
                                });
                              }}
                            >
                              <DeleteOutlineIcon fontSize="small" />
                            </IconButton>
                          </Stack>
                          <Box
                            sx={{
                              display: 'grid',
                              gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' },
                              gap: 1.25,
                            }}
                          >
                            <TextField
                              label={language === 'zh' ? '项目年份' : 'Year'}
                              size="small"
                              placeholder="2025"
                              value={exp.programYear}
                              onChange={(e) => {
                                const next = [...(profile.swtExperiences || [])];
                                next[index] = { ...exp, programYear: e.target.value };
                                setProfile({ ...profile, swtExperiences: next });
                              }}
                            />
                            <TextField
                              label={language === 'zh' ? '工作州' : 'State'}
                              size="small"
                              placeholder="NJ"
                              value={exp.workState}
                              onChange={(e) => {
                                const next = [...(profile.swtExperiences || [])];
                                next[index] = { ...exp, workState: e.target.value };
                                setProfile({ ...profile, swtExperiences: next });
                              }}
                            />
                            <TextField
                              label={language === 'zh' ? '城市' : 'City'}
                              size="small"
                              value={exp.city || ''}
                              onChange={(e) => {
                                const next = [...(profile.swtExperiences || [])];
                                next[index] = { ...exp, city: e.target.value };
                                setProfile({ ...profile, swtExperiences: next });
                              }}
                            />
                            <TextField
                              label={language === 'zh' ? '岗位' : 'Job title'}
                              size="small"
                              value={exp.jobTitle}
                              onChange={(e) => {
                                const next = [...(profile.swtExperiences || [])];
                                next[index] = { ...exp, jobTitle: e.target.value };
                                setProfile({ ...profile, swtExperiences: next });
                              }}
                            />
                            <TextField
                              label={language === 'zh' ? '雇主提示' : 'Employer hint'}
                              size="small"
                              value={exp.employerHint || ''}
                              onChange={(e) => {
                                const next = [...(profile.swtExperiences || [])];
                                next[index] = { ...exp, employerHint: e.target.value };
                                setProfile({ ...profile, swtExperiences: next });
                              }}
                              sx={{ gridColumn: { sm: '1 / -1' } }}
                            />
                          </Box>
                        </Box>
                      ),
                    )}
                  </Stack>
                  <Button
                    startIcon={<AddIcon />}
                    variant="outlined"
                    onClick={() =>
                      setProfile({
                        ...profile,
                        swtExperiences: [...(profile.swtExperiences || []), emptyExperience()],
                      })
                    }
                    sx={{ alignSelf: 'flex-start', borderColor: 'rgba(15,23,42,0.16)' }}
                  >
                    {language === 'zh' ? '添加一届经历' : 'Add experience'}
                  </Button>

                  <Divider sx={{ borderColor: 'rgba(15,23,42,0.08)' }} />

                  <Typography fontWeight={700}>{language === 'zh' ? '联系方式' : 'Contact'}</Typography>
                  <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2 }}>
                    <Box>
                      <Stack direction="row" alignItems="center" justifyContent="space-between">
                        <Typography variant="body2" color="text.secondary">
                          {language === 'zh' ? '微信' : 'WeChat'}
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
                          label={<Typography variant="body2">{language === 'zh' ? '公开' : 'Public'}</Typography>}
                        />
                      </Stack>
                      <TextField
                        size="small"
                        fullWidth
                        sx={{ mt: 0.5 }}
                        value={profile.wechat}
                        onChange={(e) => setProfile({ ...profile, wechat: e.target.value })}
                      />
                    </Box>
                    <Box>
                      <Stack direction="row" alignItems="center" justifyContent="space-between">
                        <Typography variant="body2" color="text.secondary">
                          {language === 'zh' ? '邮箱' : 'Email'}
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
                          label={<Typography variant="body2">{language === 'zh' ? '公开' : 'Public'}</Typography>}
                        />
                      </Stack>
                      <TextField
                        size="small"
                        fullWidth
                        sx={{ mt: 0.5 }}
                        value={profile.email}
                        onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                      />
                    </Box>
                  </Box>
                </Stack>

                <Box id="profile-password" sx={{ mt: 4, scrollMarginTop: 88 }}>
                  <Stack direction="row" alignItems="center" gap={1} sx={{ mb: 1.5 }}>
                    <VpnKeyIcon fontSize="small" sx={{ color: 'rgba(15,23,42,0.45)' }} />
                    <SectionLabel>{language === 'zh' ? '修改密码' : 'Password'}</SectionLabel>
                  </Stack>
                  <Stack spacing={1.5} sx={{ maxWidth: 420 }}>
                    <Alert severity="info" sx={{ py: 0.5 }}>
                      {language === 'zh'
                        ? '忘记密码？登录弹窗点「忘记密码？」联系站长重置。'
                        : 'Forgot password? Use “Forgot password?” in the sign-in dialog.'}
                    </Alert>
                    <TextField
                      label={language === 'zh' ? '当前密码' : 'Current password'}
                      type="password"
                      size="small"
                      value={passwordForm.currentPassword}
                      onChange={(e) => setPasswordForm((p) => ({ ...p, currentPassword: e.target.value }))}
                    />
                    <TextField
                      label={language === 'zh' ? '新密码' : 'New password'}
                      type="password"
                      size="small"
                      value={passwordForm.newPassword}
                      onChange={(e) => setPasswordForm((p) => ({ ...p, newPassword: e.target.value }))}
                    />
                    <TextField
                      label={language === 'zh' ? '确认新密码' : 'Confirm password'}
                      type="password"
                      size="small"
                      value={passwordForm.confirmPassword}
                      onChange={(e) => setPasswordForm((p) => ({ ...p, confirmPassword: e.target.value }))}
                    />
                    <Stack direction="row" spacing={1}>
                      <Button
                        variant="contained"
                        onClick={() => void handlePassword()}
                        sx={{ bgcolor: '#115e59', '&:hover': { bgcolor: '#0f766e' } }}
                      >
                        {language === 'zh' ? '更新密码' : 'Update password'}
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
                        {language === 'zh' ? '联系站长' : 'Contact admin'}
                      </Button>
                    </Stack>
                  </Stack>
                </Box>
              </Box>
            ) : null}
          </Stack>
        )}
      </Container>
    </Box>
  );

  return isMobile ? (
    <MobileLayout>{content}</MobileLayout>
  ) : (
    <DesktopLayout maxWidthClassName="max-w-3xl">{content}</DesktopLayout>
  );
}
