import { useEffect, useMemo, useState } from 'react';
import { Pencil, Plus, RefreshCw, Trash2, Upload } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { referralPrograms as staticPrograms } from '../../../../src/data/referralDeals';
import type { ReferralProgram } from '../../../../src/data/referralDeals';
import {
  adminFormToProgram,
  emptyDealAdminForm,
  programToAdminForm,
  type DealAdminForm,
} from '../../../../src/lib/deals/deal-admin-form';
import {
  bulkUpsertReferralDeals,
  deleteReferralDeal,
  fetchAdminReferralDeals,
  mergeReferralPrograms,
  programToSavePayload,
  saveReferralDeal,
  type ReferralDealRecord,
} from '../../../../src/lib/deals/referral-deal-api';
import { getErrorMessage } from '@/utils/error';

function activeEditionSummary(program: ReferralProgram) {
  const edition = [...program.editions].sort((a, b) => b.validFrom.localeCompare(a.validFrom))[0];
  return edition;
}

function formatPeriod(program: ReferralProgram) {
  const edition = activeEditionSummary(program);
  if (!edition) return '—';
  const end = edition.validUntil ?? '长期';
  return `${edition.validFrom} → ${end}`;
}

export function ReferralDealsAdminPage() {
  const [apiRecords, setApiRecords] = useState<ReferralDealRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<ReferralProgram | null>(null);
  const [isNew, setIsNew] = useState(false);
  const [form, setForm] = useState<DealAdminForm>(emptyDealAdminForm());

  const recordMeta = useMemo(() => {
    const map = new Map<string, { published: number; sortOrder: number }>();
    for (const record of apiRecords) {
      map.set(record.id, {
        published: record.published ?? 1,
        sortOrder: record.sortOrder ?? 0,
      });
    }
    return map;
  }, [apiRecords]);

  const mergedPrograms = useMemo(
    () => mergeReferralPrograms(apiRecords),
    [apiRecords],
  );

  const load = async () => {
    try {
      setLoading(true);
      const data = await fetchAdminReferralDeals();
      setApiRecords(data);
    } catch (error) {
      toast.error(getErrorMessage(error, '加载薅羊毛项目失败'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const setField = <K extends keyof DealAdminForm>(key: K, value: DealAdminForm[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const openEdit = (program: ReferralProgram) => {
    const inDb = apiRecords.some((r) => r.id === program.id);
    setIsNew(!inDb);
    setEditing(program);
    setForm(programToAdminForm(program, recordMeta.get(program.id)));
    setDialogOpen(true);
  };

  const openCreate = () => {
    setIsNew(true);
    setEditing(null);
    setForm(emptyDealAdminForm());
    setDialogOpen(true);
  };

  const handleSave = async () => {
    const id = form.id.trim().toLowerCase();
    if (!id) {
      toast.error('请填写项目 ID（如 revolut）');
      return;
    }
    if (!form.brandNameZh.trim()) {
      toast.error('请填写品牌名称');
      return;
    }

    const base =
      editing ||
      staticPrograms.find((p) => p.id === id) ||
      undefined;

    const program = adminFormToProgram({ ...form, id }, base);
    const payload = programToSavePayload(
      program,
      Number(form.published) || 0,
      Number(form.sortOrder) || 0,
    );

    try {
      await saveReferralDeal(id, payload, isNew);
      toast.success('已保存');
      setDialogOpen(false);
      await load();
    } catch (error) {
      toast.error(getErrorMessage(error, '保存失败'));
    }
  };

  const importStatic = async () => {
    try {
      const items = staticPrograms.map((p, index) =>
        programToSavePayload(
          {
            ...p,
            siteRebateUsd: p.siteRebateUsd ?? null,
            siteRebateLabel: p.siteRebateLabel ?? { zh: '', en: '' },
          },
          1,
          index,
        ),
      );
      await bulkUpsertReferralDeals(items);
      toast.success('已从静态数据导入/更新到数据库');
      await load();
    } catch (error) {
      toast.error(getErrorMessage(error, '导入失败'));
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm(`确定删除项目「${id}」？仅删除数据库覆盖项，静态列表仍会保留。`)) {
      return;
    }
    try {
      await deleteReferralDeal(id);
      toast.success('已删除');
      await load();
    } catch (error) {
      toast.error(getErrorMessage(error, '删除失败'));
    }
  };

  return (
    <div className="space-y-4 p-1">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-semibold">薅羊毛项目管理</h1>
          <p className="text-sm text-muted-foreground">
            通用字段管理：品牌、奖励、活动时间、邀请链接、本站返现与步骤。前台：/deals/[项目ID]
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" onClick={() => void load()} disabled={loading}>
            <RefreshCw className="mr-2 h-4 w-4" />
            刷新
          </Button>
          <Button variant="outline" size="sm" onClick={() => void importStatic()}>
            <Upload className="mr-2 h-4 w-4" />
            导入静态数据
          </Button>
          <Button size="sm" onClick={openCreate}>
            <Plus className="mr-2 h-4 w-4" />
            新建
          </Button>
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>品牌</TableHead>
                <TableHead>官方奖励</TableHead>
                <TableHead>本站返现</TableHead>
                <TableHead>活动时间</TableHead>
                <TableHead>状态</TableHead>
                <TableHead className="text-right">操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {mergedPrograms.map((program) => {
                const edition = activeEditionSummary(program);
                const meta = recordMeta.get(program.id);
                const inDb = apiRecords.some((r) => r.id === program.id);
                return (
                  <TableRow key={program.id}>
                    <TableCell className="font-mono text-xs">{program.id}</TableCell>
                    <TableCell>{program.brandName.zh}</TableCell>
                    <TableCell className="max-w-[140px] truncate">{edition?.reward.zh || '—'}</TableCell>
                    <TableCell>
                      {program.siteRebateUsd != null
                        ? `$${program.siteRebateUsd}`
                        : program.siteRebateLabel?.zh || '—'}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">{formatPeriod(program)}</TableCell>
                    <TableCell>
                      {inDb ? (meta?.published === 1 ? '已上架' : '已下架') : '仅静态'}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm" onClick={() => openEdit(program)}>
                        <Pencil className="mr-1 h-4 w-4" />
                        编辑
                      </Button>
                      {inDb ? (
                        <Button variant="ghost" size="sm" onClick={() => void handleDelete(program.id)}>
                          <Trash2 className="mr-1 h-4 w-4 text-destructive" />
                          删除
                        </Button>
                      ) : null}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{isNew ? '新建薅羊毛项目' : '编辑薅羊毛项目'}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-2 sm:grid-cols-2">
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="deal-id">项目 ID</Label>
              <Input
                id="deal-id"
                placeholder="如 revolut、chime"
                value={form.id}
                disabled={!isNew}
                onChange={(e) => setField('id', e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="brand-zh">品牌名称（中文）</Label>
              <Input
                id="brand-zh"
                value={form.brandNameZh}
                onChange={(e) => setField('brandNameZh', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="brand-en">品牌名称（英文，可选）</Label>
              <Input
                id="brand-en"
                value={form.brandNameEn}
                onChange={(e) => setField('brandNameEn', e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label>分类</Label>
              <Select value={form.category} onValueChange={(v) => setField('category', v as DealAdminForm['category'])}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="bank">银行</SelectItem>
                  <SelectItem value="other">其他</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>类型</Label>
              <Select value={form.offerKind} onValueChange={(v) => setField('offerKind', v as DealAdminForm['offerKind'])}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="refer">邀请返现</SelectItem>
                  <SelectItem value="signup_bonus">开户奖励</SelectItem>
                  <SelectItem value="promo">促销/活动</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="reward-zh">官方奖励（中文）</Label>
              <Input
                id="reward-zh"
                placeholder="如 最高 $100、官方邀请奖励"
                value={form.rewardZh}
                onChange={(e) => setField('rewardZh', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="reward-en">官方奖励（英文，可选）</Label>
              <Input
                id="reward-en"
                value={form.rewardEn}
                onChange={(e) => setField('rewardEn', e.target.value)}
              />
            </div>

            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="summary-zh">活动简介（中文）</Label>
              <Textarea
                id="summary-zh"
                rows={2}
                value={form.summaryZh}
                onChange={(e) => setField('summaryZh', e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="valid-from">开始日期</Label>
              <Input
                id="valid-from"
                type="date"
                value={form.validFrom}
                onChange={(e) => setField('validFrom', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="valid-until">结束日期（留空=长期）</Label>
              <Input
                id="valid-until"
                type="date"
                value={form.validUntil}
                onChange={(e) => setField('validUntil', e.target.value)}
              />
            </div>

            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="referral-url">邀请链接</Label>
              <Input
                id="referral-url"
                placeholder="https://..."
                value={form.referralUrl}
                onChange={(e) => setField('referralUrl', e.target.value)}
              />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="official-url">官方说明页（可选）</Label>
              <Input
                id="official-url"
                placeholder="https://..."
                value={form.officialUrl}
                onChange={(e) => setField('officialUrl', e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="site-rebate-usd">本站返现金额 (USD)</Label>
              <Input
                id="site-rebate-usd"
                type="number"
                placeholder="如 40"
                value={form.siteRebateUsd}
                onChange={(e) => setField('siteRebateUsd', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="site-rebate-label">本站返现文案（可选）</Label>
              <Input
                id="site-rebate-label"
                placeholder="如 本站返现 $40"
                value={form.siteRebateLabelZh}
                onChange={(e) => setField('siteRebateLabelZh', e.target.value)}
              />
            </div>

            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="requirements">参与条件（每行一条）</Label>
              <Textarea
                id="requirements"
                rows={4}
                placeholder="须通过邀请链接注册&#10;Residence 选择美国"
                value={form.requirementsZh}
                onChange={(e) => setField('requirementsZh', e.target.value)}
              />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="how-to-claim">领取步骤（每行一步）</Label>
              <Textarea
                id="how-to-claim"
                rows={5}
                value={form.howToClaimZh}
                onChange={(e) => setField('howToClaimZh', e.target.value)}
              />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="practical-steps">实操说明 / 避坑（每行一条）</Label>
              <Textarea
                id="practical-steps"
                rows={4}
                value={form.practicalStepsZh}
                onChange={(e) => setField('practicalStepsZh', e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="sort-order">排序（越小越靠前）</Label>
              <Input
                id="sort-order"
                type="number"
                value={form.sortOrder}
                onChange={(e) => setField('sortOrder', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>上架状态</Label>
              <Select value={form.published} onValueChange={(v) => setField('published', v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">上架</SelectItem>
                  <SelectItem value="0">下架</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center gap-2 sm:col-span-2">
              <input
                id="pinned"
                type="checkbox"
                checked={form.pinned}
                onChange={(e) => setField('pinned', e.target.checked)}
                className="h-4 w-4 rounded border-input"
              />
              <Label htmlFor="pinned">置顶展示</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              取消
            </Button>
            <Button onClick={() => void handleSave()}>保存</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
