'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  Box,
  Button,
  TextField,
  Typography,
  Alert,
  FormControl,
  FormLabel,
  RadioGroup,
  FormControlLabel,
  Radio,
} from '@mui/material';
import { useAuthStore } from '@/stores/authStore';
import { addDealExperience } from '../../lib/deals/dealExperienceStore';
import type { ResolvedProgram } from '../../lib/deals/deal-utils';
import { useI18n } from '../../context/I18nContext';
import type { ProfileVisibility } from '../../lib/member/types';

export function DealExperienceForm({
  item,
  onSubmitted,
}: {
  item: ResolvedProgram;
  onSubmitted: () => void;
}) {
  const { t } = useI18n();
  const user = useAuthStore((s) => s.user);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const [body, setBody] = useState('');
  const [ddMethod, setDdMethod] = useState('');
  const [ddDate, setDdDate] = useState('');
  const [bonusReceivedDate, setBonusReceivedDate] = useState('');
  const [bonusAmount, setBonusAmount] = useState('');
  const [openingMethod, setOpeningMethod] = useState('');
  const [materials, setMaterials] = useState('');
  const [visibility, setVisibility] = useState<ProfileVisibility>('consent');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (!isAuthenticated || !user?.userId) {
    return (
      <Alert severity="info" sx={{ mb: 2 }}>
        {t('deals.experience.loginToPost')}{' '}
        <Link href="/login" style={{ color: 'inherit', fontWeight: 600 }}>
          {t('common.login')}
        </Link>
      </Alert>
    );
  }

  const handleSubmit = async () => {
    if (body.trim().length < 10) {
      setError(t('deals.experience.bodyTooShort'));
      return;
    }
    setSubmitting(true);
    setError('');
    try {
      const profileVisibility = visibility;
      await addDealExperience({
        programId: item.program.id,
        editionId: item.edition.id,
        bodyZh: body.trim(),
        bodyEn: body.trim(),
        openingMethodZh: openingMethod.trim() || undefined,
        openingMethodEn: openingMethod.trim() || undefined,
        ddMethodZh: ddMethod.trim() || undefined,
        ddMethodEn: ddMethod.trim() || undefined,
        materialsZh: materials.trim() || undefined,
        materialsEn: materials.trim() || undefined,
        ddDate: ddDate.trim() || undefined,
        bonusReceivedDate: bonusReceivedDate.trim() || undefined,
        bonusAmount: bonusAmount.trim() || undefined,
        profileVisibility,
      });

      setBody('');
      setDdMethod('');
      setDdDate('');
      setBonusReceivedDate('');
      setBonusAmount('');
      setOpeningMethod('');
      setMaterials('');
      onSubmitted();
    } catch (err) {
      setError((err as Error).message || '发布失败');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Box
      sx={{
        border: 1,
        borderColor: 'divider',
        borderRadius: 2,
        p: 2,
        mb: 2,
        bgcolor: 'action.hover',
      }}
    >
      <Typography variant="subtitle2" fontWeight={700} gutterBottom>
        {t('deals.experience.postTitle')}
      </Typography>
      <TextField
        fullWidth
        multiline
        minRows={3}
        size="small"
        label={t('deals.experience.bodyLabel')}
        value={body}
        onChange={(e) => setBody(e.target.value)}
        sx={{ mb: 1.5 }}
      />
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 1.5, mb: 1.5 }}>
        <TextField size="small" label={t('deals.experience.openingMethod')} value={openingMethod} onChange={(e) => setOpeningMethod(e.target.value)} />
        <TextField size="small" label={t('deals.experience.materials')} placeholder="DS-2019, 护照, SSN" value={materials} onChange={(e) => setMaterials(e.target.value)} />
        <TextField size="small" label={t('deals.experience.ddMethod')} value={ddMethod} onChange={(e) => setDdMethod(e.target.value)} />
        <TextField size="small" label={t('deals.experience.ddDate')} placeholder="YYYY-MM-DD" value={ddDate} onChange={(e) => setDdDate(e.target.value)} />
        <TextField size="small" label={t('deals.experience.bonusReceivedDate')} placeholder="YYYY-MM-DD" value={bonusReceivedDate} onChange={(e) => setBonusReceivedDate(e.target.value)} />
        <TextField size="small" label={t('deals.experience.bonusAmount')} placeholder="$325" value={bonusAmount} onChange={(e) => setBonusAmount(e.target.value)} />
      </Box>
      <FormControl sx={{ mb: 1.5 }}>
        <FormLabel sx={{ fontSize: '0.875rem', mb: 0.5 }}>{t('member.profileVisibility')}</FormLabel>
        <RadioGroup row value={visibility} onChange={(e) => setVisibility(e.target.value as ProfileVisibility)}>
          <FormControlLabel value="consent" control={<Radio size="small" />} label={t('member.visibilityConsent')} />
          <FormControlLabel value="public" control={<Radio size="small" />} label={t('member.visibilityPublic')} />
        </RadioGroup>
      </FormControl>
      {error ? (
        <Typography variant="caption" color="error" display="block" sx={{ mb: 1 }}>
          {error}
        </Typography>
      ) : null}
      <Button variant="contained" size="small" onClick={() => void handleSubmit()} disabled={submitting}>
        {submitting ? t('common.loading') : t('deals.experience.submit')}
      </Button>
    </Box>
  );
}
