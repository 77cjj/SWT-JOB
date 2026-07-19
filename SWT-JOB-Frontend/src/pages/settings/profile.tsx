'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import {
  Box,
  Button,
  Container,
  FormControl,
  FormControlLabel,
  FormLabel,
  MenuItem,
  Paper,
  Radio,
  RadioGroup,
  TextField,
  Typography,
  Alert,
  CircularProgress,
} from '@mui/material';
import DesktopLayout from '../../layout/desktop/Layout';
import MobileLayout from '../../layout/mobile/Layout';
import useDevice from '../../hooks/useDevice';
import { useAuthStore } from '@/stores/authStore';
import type { ProfileVisibility } from '../../lib/member/types';
import { US_STATE_OPTIONS } from '../../lib/member/profile';
import { fetchMyProfile, updateMyProfile, type UserProfileApi } from '@/services/profileService';

export default function ProfileSettingsPage() {
  const router = useRouter();
  const isMobile = useDevice();
  const user = useAuthStore((s) => s.user);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const [form, setForm] = useState<UserProfileApi | null>(null);
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isAuthenticated || !user?.userId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    void fetchMyProfile()
      .then((profile) => setForm(profile))
      .catch((err) => setError((err as Error).message || '加载失败'))
      .finally(() => setLoading(false));
  }, [isAuthenticated, user?.userId]);

  if (!isAuthenticated || !user?.userId) {
    const unauth = (
      <Container maxWidth="sm" sx={{ py: 4 }}>
        <Alert severity="info">请先登录后再编辑个人主页。</Alert>
      </Container>
    );
    return isMobile ? <MobileLayout>{unauth}</MobileLayout> : <DesktopLayout>{unauth}</DesktopLayout>;
  }

  if (loading || !form) {
    const loadingView = (
      <Container maxWidth="sm" sx={{ py: 6, display: 'flex', justifyContent: 'center' }}>
        {error ? <Alert severity="error">{error}</Alert> : <CircularProgress />}
      </Container>
    );
    return isMobile ? <MobileLayout>{loadingView}</MobileLayout> : <DesktopLayout>{loadingView}</DesktopLayout>;
  }

  const handleSave = async () => {
    setError('');
    try {
      const updated = await updateMyProfile({
        displayName: form.displayName,
        avatarColor: form.avatarColor,
        bio: form.bio,
        programYear: form.programYear,
        workState: form.workState,
        jobTitle: form.jobTitle,
        phone: form.phone,
        email: form.email,
        wechat: form.wechat,
        profileVisibility: form.profileVisibility,
      });
      setForm(updated);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (err) {
      setError((err as Error).message || '保存失败');
    }
  };

  const content = (
    <Container maxWidth="sm" sx={{ py: 4 }}>
      <Paper variant="outlined" sx={{ p: 3 }}>
        <Typography variant="h5" fontWeight={700} gutterBottom>
          编辑个人主页
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          资料已保存至服务器。隐私设置决定他人在你的主页能否直接看到手机/邮箱。
        </Typography>

        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <TextField label="显示名称" value={form.displayName} onChange={(e) => setForm({ ...form, displayName: e.target.value })} fullWidth size="small" />
          <TextField label="个人简介" value={form.bio} onChange={(e) => setForm({ ...form, bio: e.target.value })} fullWidth multiline minRows={2} size="small" />
          <TextField label="SWT 年份" placeholder="2026" value={form.programYear ?? ''} onChange={(e) => setForm({ ...form, programYear: e.target.value })} fullWidth size="small" />
          <TextField select label="工作州" value={form.workState ?? ''} onChange={(e) => setForm({ ...form, workState: e.target.value })} fullWidth size="small">
            <MenuItem value="">未填写</MenuItem>
            {US_STATE_OPTIONS.map((s) => (
              <MenuItem key={s} value={s}>{s}</MenuItem>
            ))}
          </TextField>
          <TextField label="岗位/一工" value={form.jobTitle ?? ''} onChange={(e) => setForm({ ...form, jobTitle: e.target.value })} fullWidth size="small" />
          <TextField label="手机号" value={form.phone ?? ''} onChange={(e) => setForm({ ...form, phone: e.target.value })} fullWidth size="small" />
          <TextField label="邮箱" value={form.email ?? ''} onChange={(e) => setForm({ ...form, email: e.target.value })} fullWidth size="small" />
          <TextField label="微信" value={form.wechat ?? ''} onChange={(e) => setForm({ ...form, wechat: e.target.value })} fullWidth size="small" />

          <FormControl>
            <FormLabel sx={{ mb: 0.5 }}>联系方式披露方式</FormLabel>
            <RadioGroup
              value={form.profileVisibility}
              onChange={(e) => setForm({ ...form, profileVisibility: e.target.value as ProfileVisibility })}
            >
              <FormControlLabel value="consent" control={<Radio size="small" />} label="经同意才披露（默认）：主页不展示手机/邮箱" />
              <FormControlLabel value="public" control={<Radio size="small" />} label="直接公开：主页展示手机、邮箱、微信等" />
            </RadioGroup>
          </FormControl>

          {error ? <Alert severity="error">{error}</Alert> : null}
          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
            <Button variant="contained" onClick={() => void handleSave()}>保存</Button>
            <Button variant="outlined" onClick={() => void router.push(`/u/${user.userId}`)}>预览主页</Button>
          </Box>
          {saved ? <Alert severity="success">已保存到服务器</Alert> : null}
        </Box>
      </Paper>
    </Container>
  );

  return isMobile ? <MobileLayout>{content}</MobileLayout> : <DesktopLayout maxWidthClassName="max-w-3xl">{content}</DesktopLayout>;
}
