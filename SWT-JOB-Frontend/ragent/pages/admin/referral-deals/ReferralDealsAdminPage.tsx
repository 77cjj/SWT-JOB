import { useEffect, useMemo, useState } from 'react';
import { EyeOff, Pencil, Plus, RefreshCw, Trash2, Upload } from 'lucide-react';
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
import { notionRemittancePrograms, NOTION_REMITTANCE_ROWS } from '../../../../src/data/notionDealsSeed';
import {
  adminFormToProgram,
  emptyDealAdminForm,
  NOTION_COLUMN_MAP,
  notionRowsToPrograms,
  programToAdminForm,
  type DealAdminForm,
} from '../../../../src/lib/deals/deal-admin-form';
import {
  buildAdminDealRows,
  bulkUpsertReferralDeals,
  deleteReferralDeal,
  fetchAdminReferralDeals,
  hideReferralDeal,
  programToSavePayload,
  saveReferralDeal,
  type AdminDealRow,
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

function statusLabel(row: AdminDealRow) {
  if (row.published === 0) return '已隐藏';
  if (row.inDatabase) return '已上架';
  return '仅静态';
}

export function ReferralDealsAdminPage() {
  const [apiRecords, setApiRecords] = useState<ReferralDealRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingRow, setEditingRow] = useState<AdminDealRow | null>(null);
  const [isNew, setIsNew] = useState(false);
  const [form, setForm] = useState<DealAdminForm>(emptyDealAdminForm());

  const adminRows = useMemo(() => buildAdminDealRows(apiRecords), [apiRecords]);

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

  const openEdit = (row: AdminDealRow) => {
    setIsNew(!row.inDatabase);
    setEditingRow(row);
    setForm(
      programToAdminForm(row.program, {
        published: row.published,
        sortOrder: row.sortOrder,
      }),
    );
    setDialogOpen(true);
  };

  const openCreate = () => {
    setIsNew(true);
    setEditingRow(null);
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
      editingRow?.program ||
      staticPrograms.find((p) => p.id === id) ||
      undefined;

    const published = Number(form.published) || 0;
    const program = adminFormToProgram({ ...form, id }, base);
    const payload = programToSavePayload(program, published, Number(form.sortOrder) || 0);

    try {
      await saveReferralDeal(id, payload, isNew);
      toast.success('已保存');
      setDialogOpen(false);
      await load();
    } catch (error) {
      toast.error(getErrorMessage(error, '保存失败'));
    }
  };

  const importNotionRemittance = async () => {
    try {
      const programs = notionRowsToPrograms(NOTION_REMITTANCE_ROWS);
      const items = programs.map((p, index) => programToSavePayload(p, 1, 100 + index));
      await bulkUpsertReferralDeals(items);
      toast.success(`已导入 ${items.length} 个 Notion 换汇项目到数据库`);
      await load();
    } catch (error) {
      toast.error(getErrorMessage(error, 'Notion 换汇导入失败'));
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
      toast.success('已将全部静态项目写入数据库');
      await load();
    } catch (error) {
      toast.error(getErrorMessage(error, '导入失败'));
    }
  };

  const handleHide = async (row: AdminDealRow) => {
    const title = row.program.brandName.zh;
    if (!window.confirm(`确定从前台隐藏「${title}」？`)) return;
    try {
      await hideReferralDeal(row.program.id, title, !row.inDatabase);
      toast.success('已隐藏');
      await load();
    } catch (error) {
      toast.error(getErrorMessage(error, '隐藏失败'));
    }
  };

  const handleDelete = async (row: AdminDealRow) => {
    if (!row.inDatabase) {
      await handleHide(row);
      return;
    }
    if (!window.confirm(`确定从数据库删除「${row.program.brandName.zh}」？静态默认数据将恢复显示。`)) {
      return;
    }
    try {
      await deleteReferralDeal(row.program.id);
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
            与 Notion「薅羊毛页面」字段对齐。隐藏=写入数据库并下架；删除=移除数据库记录。
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" onClick={() => void load()} disabled={loading}>
            <RefreshCw className="mr-2 h-4 w-4" />
            刷新
          </Button>
          <Button variant="outline" size="sm" onClick={() => void importNotionRemittance()}>
            <Upload className="mr-2 h-4 w-4" />
            导入 Notion 换汇
          </Button>
          <Button variant="outline" size="sm" onClick={() => void importStatic()}>
            <Upload className="mr-2 h-4 w-4" />
            全部入库
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
                <TableHead>来源</TableHead>
                <TableHead>状态</TableHead>
                <TableHead className="text-right">操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {adminRows.map((row) => {
                const { program } = row;
                const edition = activeEditionSummary(program);
                return (
                  <TableRow key={program.id} className={row.published === 0 ? 'opacity-50' : undefined}>
                    <TableCell className="font-mono text-xs">{program.id}</TableCell>
                    <TableCell>{program.brandName.zh}</TableCell>
                    <TableCell className="max-w-[180px] truncate">{edition?.reward.zh || '—'}</TableCell>
                    <TableCell>
                      {program.siteRebateLabel?.zh ||
                        (program.siteRebateUsd != null ? `$${program.siteRebateUsd}` : '—')}
                    </TableCell>
                    <TableCell>{row.source === 'database' ? '数据库' : '静态'}</TableCell>
                    <TableCell>{statusLabel(row)}</TableCell>
                    <TableCell className="space-x-1 text-right">
                      <Button variant="ghost" size="sm" onClick={() => openEdit(row)}>
                        <Pencil className="mr-1 h-4 w-4" />
                        编辑
                      </Button>
                      {row.published === 0 ? (
                        <Button variant="ghost" size="sm" onClick={() => openEdit(row)}>
                          恢复上架
                        </Button>
                      ) : (
                        <Button variant="ghost" size="sm" onClick={() => void handleHide(row)}>
                          <EyeOff className="mr-1 h-4 w-4" />
                          隐藏
                        </Button>
                      )}
                      <Button variant="ghost" size="sm" onClick={() => void handleDelete(row)}>
                        <Trash2 className="mr-1 h-4 w-4 text-destructive" />
                        {row.inDatabase ? '删除' : '隐藏'}
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <p className="text-xs text-muted-foreground">
        内置 Notion 换汇项目（{notionRemittancePrograms.length} 个）已写入前台静态数据：lemfi、熊猫速汇、
        taptap、remitly、wise、instarem 等。点击「导入 Notion 换汇」可同步到数据库以便在线编辑。
      </p>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{isNew ? '新建薅羊毛项目' : '编辑薅羊毛项目'}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-2 sm:grid-cols-2">
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="deal-id">项目 ID（URL 路径）</Label>
              <Input
                id="deal-id"
                placeholder="如 lemfi、revolut"
                value={form.id}
                disabled={!isNew}
                onChange={(e) => setField('id', e.target.value)}
              />
            </div>

            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="title">{NOTION_COLUMN_MAP.title}</Label>
              <Input id="title" value={form.title} onChange={(e) => setField('title', e.target.value)} />
            </div>

            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="referral-link">{NOTION_COLUMN_MAP.referralLink}</Label>
              <Textarea
                id="referral-link"
                rows={2}
                value={form.referralLink}
                onChange={(e) => setField('referralLink', e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="referral-code">{NOTION_COLUMN_MAP.referralCode}</Label>
              <Input id="referral-code" value={form.referralCode} onChange={(e) => setField('referralCode', e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="site-rebate">{NOTION_COLUMN_MAP.siteRebate}</Label>
              <Input id="site-rebate" value={form.siteRebate} onChange={(e) => setField('siteRebate', e.target.value)} />
            </div>

            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="user-benefit">{NOTION_COLUMN_MAP.userBenefit}</Label>
              <Input id="user-benefit" value={form.userBenefit} onChange={(e) => setField('userBenefit', e.target.value)} />
            </div>

            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="trigger">{NOTION_COLUMN_MAP.triggerCondition}</Label>
              <Textarea id="trigger" rows={2} value={form.triggerCondition} onChange={(e) => setField('triggerCondition', e.target.value)} />
            </div>

            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="cashback-condition">{NOTION_COLUMN_MAP.cashbackCondition}</Label>
              <Textarea id="cashback-condition" rows={2} value={form.cashbackCondition} onChange={(e) => setField('cashbackCondition', e.target.value)} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="valid-from">活动开始</Label>
              <Input id="valid-from" type="date" value={form.validFrom} onChange={(e) => setField('validFrom', e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="valid-until">活动结束</Label>
              <Input id="valid-until" type="date" value={form.validUntil} onChange={(e) => setField('validUntil', e.target.value)} />
            </div>

            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="notes">{NOTION_COLUMN_MAP.notes}</Label>
              <Textarea id="notes" rows={2} value={form.notes} onChange={(e) => setField('notes', e.target.value)} />
            </div>

            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="rate-note">{NOTION_COLUMN_MAP.exchangeRateNote}</Label>
              <Input id="rate-note" value={form.exchangeRateNote} onChange={(e) => setField('exchangeRateNote', e.target.value)} />
            </div>

            <div className="space-y-2">
              <Label>上架状态</Label>
              <Select value={form.published} onValueChange={(v) => setField('published', v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">上架（前台可见）</SelectItem>
                  <SelectItem value="0">下架（前台隐藏）</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="sort-order">排序</Label>
              <Input id="sort-order" type="number" value={form.sortOrder} onChange={(e) => setField('sortOrder', e.target.value)} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>取消</Button>
            <Button onClick={() => void handleSave()}>保存</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
