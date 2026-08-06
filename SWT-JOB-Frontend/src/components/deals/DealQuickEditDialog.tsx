'use client';

import { useEffect, useState } from 'react';
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  MenuItem,
  Stack,
  Switch,
  TextField,
  Typography,
} from '@mui/material';
import type { ReferralProgram } from '../../data/referralDeals';
import {
  adminFormToProgram,
  emptyDealAdminForm,
  programToAdminForm,
  type DealAdminForm,
} from '../../lib/deals/deal-admin-form';
import {
  fetchAdminReferralDeals,
  programToSavePayload,
  saveReferralDeal,
} from '../../lib/deals/referral-deal-api';

type DealQuickEditDialogProps = {
  open: boolean;
  program: ReferralProgram | null;
  onClose: () => void;
  onSaved: (program: ReferralProgram) => void;
};

export default function DealQuickEditDialog({
  open,
  program,
  onClose,
  onSaved,
}: DealQuickEditDialogProps) {
  const [form, setForm] = useState<DealAdminForm>(emptyDealAdminForm());
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [meta, setMeta] = useState({ published: 1, sortOrder: 0, aiEnabled: 1, inDatabase: false });

  useEffect(() => {
    if (!open || !program) return;
    let cancelled = false;
    setError('');
    (async () => {
      let published = 1;
      let sortOrder = 0;
      let aiEnabled = 1;
      let inDatabase = false;
      try {
        const records = await fetchAdminReferralDeals();
        const hit = records.find((r) => r.id === program.id);
        if (hit) {
          published = hit.published ?? 1;
          sortOrder = hit.sortOrder ?? 0;
          aiEnabled = hit.aiEnabled ?? 1;
          inDatabase = true;
        }
      } catch {
        // 无 admin 列表时仍允许用当前 program 编辑后 upsert
      }
      if (cancelled) return;
      setMeta({ published, sortOrder, aiEnabled, inDatabase });
      setForm(programToAdminForm(program, { published, sortOrder, aiEnabled }));
    })();
    return () => {
      cancelled = true;
    };
  }, [open, program]);

  const setField = <K extends keyof DealAdminForm>(key: K, value: DealAdminForm[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleSave = async () => {
    if (!program) return;
    const title = form.title.trim();
    if (!title) {
      setError('请填写标题');
      return;
    }
    setSaving(true);
    setError('');
    try {
      const next = adminFormToProgram({ ...form, id: program.id }, program);
      const published = Number(form.published) || 0;
      const aiEnabled = Number(form.aiEnabled) || 0;
      const sortOrder = Number(form.sortOrder) || 0;
      const payload = programToSavePayload(next, published, sortOrder, aiEnabled);
      await saveReferralDeal(program.id, payload, !meta.inDatabase);
      onSaved(next);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : '保存失败');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>编辑薅羊毛项目</DialogTitle>
      <DialogContent>
        <Stack spacing={1.5} sx={{ mt: 1 }}>
          <TextField
            label="标题"
            size="small"
            fullWidth
            value={form.title}
            onChange={(e) => setField('title', e.target.value)}
          />
          <TextField
            label="用户获得好处（奖励文案）"
            size="small"
            fullWidth
            value={form.userBenefit}
            onChange={(e) => setField('userBenefit', e.target.value)}
          />
          <TextField
            label="本站返现"
            size="small"
            fullWidth
            value={form.siteRebate}
            onChange={(e) => setField('siteRebate', e.target.value)}
            helperText="如 10刀 / 40"
          />
          <TextField
            label="邀请链接"
            size="small"
            fullWidth
            multiline
            minRows={2}
            value={form.referralLink}
            onChange={(e) => setField('referralLink', e.target.value)}
          />
          <TextField
            label="Refer 码"
            size="small"
            fullWidth
            value={form.referralCode}
            onChange={(e) => setField('referralCode', e.target.value)}
          />
          <TextField
            label="触发奖励条件"
            size="small"
            fullWidth
            multiline
            minRows={2}
            value={form.triggerCondition}
            onChange={(e) => setField('triggerCondition', e.target.value)}
          />
          <TextField
            label="返现条件 / 领取步骤"
            size="small"
            fullWidth
            multiline
            minRows={2}
            value={form.cashbackCondition}
            onChange={(e) => setField('cashbackCondition', e.target.value)}
          />
          <TextField
            label="备注 / 攻略要点"
            size="small"
            fullWidth
            multiline
            minRows={2}
            value={form.notes}
            onChange={(e) => setField('notes', e.target.value)}
          />
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
            <TextField
              label="开始日期"
              type="date"
              size="small"
              fullWidth
              InputLabelProps={{ shrink: true }}
              value={form.validFrom}
              onChange={(e) => setField('validFrom', e.target.value)}
            />
            <TextField
              label="结束日期"
              type="date"
              size="small"
              fullWidth
              InputLabelProps={{ shrink: true }}
              value={form.validUntil}
              onChange={(e) => setField('validUntil', e.target.value)}
            />
          </Stack>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
            <TextField
              select
              label="上架"
              size="small"
              fullWidth
              value={form.published}
              onChange={(e) => setField('published', e.target.value)}
            >
              <MenuItem value="1">上架</MenuItem>
              <MenuItem value="0">下架</MenuItem>
            </TextField>
            <TextField
              label="排序"
              type="number"
              size="small"
              fullWidth
              value={form.sortOrder}
              onChange={(e) => setField('sortOrder', e.target.value)}
            />
          </Stack>
          <FormControlLabel
            control={
              <Switch
                checked={form.pinned}
                onChange={(e) => setField('pinned', e.target.checked)}
              />
            }
            label="置顶"
          />
          {error ? (
            <Typography variant="body2" color="error">
              {error}
            </Typography>
          ) : null}
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={saving}>
          取消
        </Button>
        <Button variant="contained" onClick={() => void handleSave()} disabled={saving}>
          {saving ? '保存中…' : '保存'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
