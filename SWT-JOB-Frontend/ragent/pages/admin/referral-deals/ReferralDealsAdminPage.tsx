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
  NOTION_COLUMN_MAP,
  notionRowToAdminForm,
  programToAdminForm,
  type DealAdminForm,
  type NotionDealRow,
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

function slugifyId(title: string) {
  return title
    .trim()
    .toLowerCase()
    .replace(/[^\w\u4e00-\u9fff]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 48);
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
    const title = form.title.trim();
    if (!title) {
      toast.error('请填写标题（品牌名）');
      return;
    }
    const id = form.id.trim().toLowerCase() || slugifyId(title);
    if (!id) {
      toast.error('无法生成项目 ID，请手动填写');
      return;
    }

    const base =
      editing ||
      staticPrograms.find((p) => p.id === id) ||
      undefined;

    const program = adminFormToProgram(
      {
        ...form,
        id,
        published: form.siteReady === '1' ? form.published : '0',
      },
      base,
    );
    const payload = programToSavePayload(
      program,
      Number(form.siteReady === '1' ? form.published : 0) || 0,
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

  /** 粘贴 Notion 导出的 JSON 行批量导入（字段名与 Notion 数据库列一致） */
  const importNotionJson = async () => {
    const raw = window.prompt(
      '粘贴 Notion 数据库导出的 JSON 数组（含「标题」「列 3」等字段）',
    );
    if (!raw?.trim()) return;
    try {
      const rows = JSON.parse(raw) as NotionDealRow[];
      if (!Array.isArray(rows)) throw new Error('需要 JSON 数组');
      const forms = rows
        .map((row) => notionRowToAdminForm(row))
        .filter((f): f is DealAdminForm => f != null);
      if (!forms.length) {
        toast.error('未解析到有效项目行');
        return;
      }
      const items = forms.map((f, index) =>
        programToSavePayload(adminFormToProgram(f), Number(f.published) || 1, index),
      );
      await bulkUpsertReferralDeals(items);
      toast.success(`已从 Notion 格式导入 ${items.length} 个项目`);
      await load();
    } catch (error) {
      toast.error(getErrorMessage(error, 'Notion JSON 导入失败'));
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
            字段与 Notion「薅羊毛页面」数据库列对齐。前台：/deals/[项目ID]
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" onClick={() => void load()} disabled={loading}>
            <RefreshCw className="mr-2 h-4 w-4" />
            刷新
          </Button>
          <Button variant="outline" size="sm" onClick={() => void importNotionJson()}>
            <Upload className="mr-2 h-4 w-4" />
            导入 Notion JSON
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
                <TableHead>{NOTION_COLUMN_MAP.title}</TableHead>
                <TableHead>{NOTION_COLUMN_MAP.userBenefit}</TableHead>
                <TableHead>{NOTION_COLUMN_MAP.siteRebate}</TableHead>
                <TableHead>{NOTION_COLUMN_MAP.dateRange}</TableHead>
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
                    <TableCell className="max-w-[180px] truncate">{edition?.reward.zh || '—'}</TableCell>
                    <TableCell>
                      {program.siteRebateLabel?.zh ||
                        (program.siteRebateUsd != null ? `$${program.siteRebateUsd}` : '—')}
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
              <Label htmlFor="deal-id">项目 ID（URL 路径，如 lemfi）</Label>
              <Input
                id="deal-id"
                placeholder="留空则根据标题自动生成"
                value={form.id}
                disabled={!isNew}
                onChange={(e) => setField('id', e.target.value)}
              />
            </div>

            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="title">{NOTION_COLUMN_MAP.title}</Label>
              <Input
                id="title"
                placeholder="如 lemfi、Revolut"
                value={form.title}
                onChange={(e) => setField('title', e.target.value)}
              />
            </div>

            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="referral-link">{NOTION_COLUMN_MAP.referralLink}</Label>
              <Textarea
                id="referral-link"
                rows={2}
                placeholder="可粘贴带说明的 refer 文案 + 链接"
                value={form.referralLink}
                onChange={(e) => setField('referralLink', e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="referral-code">{NOTION_COLUMN_MAP.referralCode}</Label>
              <Input
                id="referral-code"
                value={form.referralCode}
                onChange={(e) => setField('referralCode', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="site-rebate">{NOTION_COLUMN_MAP.siteRebate}</Label>
              <Input
                id="site-rebate"
                placeholder="如 10刀、40"
                value={form.siteRebate}
                onChange={(e) => setField('siteRebate', e.target.value)}
              />
            </div>

            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="user-benefit">{NOTION_COLUMN_MAP.userBenefit}</Label>
              <Input
                id="user-benefit"
                placeholder="用户总共能得到什么"
                value={form.userBenefit}
                onChange={(e) => setField('userBenefit', e.target.value)}
              />
            </div>

            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="trigger">{NOTION_COLUMN_MAP.triggerCondition}</Label>
              <Textarea
                id="trigger"
                rows={2}
                placeholder="如：汇款100刀；完成三笔10刀以上消费"
                value={form.triggerCondition}
                onChange={(e) => setField('triggerCondition', e.target.value)}
              />
            </div>

            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="cashback-condition">{NOTION_COLUMN_MAP.cashbackCondition}</Label>
              <Textarea
                id="cashback-condition"
                rows={2}
                placeholder="如：使用 refer 码并成功汇款，等待一天可获得"
                value={form.cashbackCondition}
                onChange={(e) => setField('cashbackCondition', e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="valid-from">活动开始</Label>
              <Input
                id="valid-from"
                type="date"
                value={form.validFrom}
                onChange={(e) => setField('validFrom', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="valid-until">活动结束（留空=长期）</Label>
              <Input
                id="valid-until"
                type="date"
                value={form.validUntil}
                onChange={(e) => setField('validUntil', e.target.value)}
              />
            </div>

            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="date-note">{NOTION_COLUMN_MAP.dateRange}（原文，可选）</Label>
              <Input
                id="date-note"
                placeholder="如 2026 年 8 月 1 日到 2026 年 9 月 30 日"
                value={form.dateRangeNote}
                onChange={(e) => setField('dateRangeNote', e.target.value)}
              />
            </div>

            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="notes">{NOTION_COLUMN_MAP.notes}</Label>
              <Textarea
                id="notes"
                rows={2}
                placeholder="避坑、实操提醒"
                value={form.notes}
                onChange={(e) => setField('notes', e.target.value)}
              />
            </div>

            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="rate-note">{NOTION_COLUMN_MAP.exchangeRateNote}</Label>
              <Input
                id="rate-note"
                placeholder="换汇类项目可填实际汇率"
                value={form.exchangeRateNote}
                onChange={(e) => setField('exchangeRateNote', e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="referrer-net">{NOTION_COLUMN_MAP.referrerNetReward}</Label>
              <Input
                id="referrer-net"
                placeholder="邀请人净收益（可选）"
                value={form.referrerNetReward}
                onChange={(e) => setField('referrerNetReward', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>{NOTION_COLUMN_MAP.siteReady}</Label>
              <Select value={form.siteReady} onValueChange={(v) => setField('siteReady', v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">已完成 ✅</SelectItem>
                  <SelectItem value="0">未完成</SelectItem>
                </SelectContent>
              </Select>
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

            <div className="space-y-2">
              <Label htmlFor="sort-order">排序</Label>
              <Input
                id="sort-order"
                type="number"
                value={form.sortOrder}
                onChange={(e) => setField('sortOrder', e.target.value)}
              />
            </div>
            <div className="flex items-center gap-2">
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
