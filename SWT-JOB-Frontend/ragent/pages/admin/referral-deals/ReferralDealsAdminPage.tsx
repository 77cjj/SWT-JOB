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
  bulkUpsertReferralDeals,
  deleteReferralDeal,
  fetchAdminReferralDeals,
  programToSavePayload,
  saveReferralDeal,
  type ReferralDealRecord,
} from '../../../../src/lib/deals/referral-deal-api';
import { mergeReferralPrograms } from '../../../../src/lib/deals/referral-deal-api';
import { getErrorMessage } from '@/utils/error';

function linesToList(text: string) {
  return text
    .split('\n')
    .map((s) => s.trim())
    .filter(Boolean);
}

function listToLines(list?: string[]) {
  return (list ?? []).join('\n');
}

export function ReferralDealsAdminPage() {
  const [apiRecords, setApiRecords] = useState<ReferralDealRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<ReferralProgram | null>(null);
  const [isNew, setIsNew] = useState(false);

  const [form, setForm] = useState({
    id: '',
    siteRebateUsd: '',
    siteRebateLabelZh: '',
    siteRebateLabelEn: '',
    howToClaimZh: '',
    practicalStepsZh: '',
    published: '1',
    sortOrder: '0',
  });

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

  const openEdit = (program: ReferralProgram) => {
    setIsNew(false);
    setEditing(program);
    setForm({
      id: program.id,
      siteRebateUsd: program.siteRebateUsd != null ? String(program.siteRebateUsd) : '',
      siteRebateLabelZh: program.siteRebateLabel?.zh ?? '',
      siteRebateLabelEn: program.siteRebateLabel?.en ?? '',
      howToClaimZh: listToLines(program.howToClaim?.zh),
      practicalStepsZh: listToLines(program.practicalSteps?.zh),
      published: '1',
      sortOrder: '0',
    });
    setDialogOpen(true);
  };

  const openCreate = () => {
    setIsNew(true);
    setEditing(null);
    setForm({
      id: '',
      siteRebateUsd: '',
      siteRebateLabelZh: '',
      siteRebateLabelEn: '',
      howToClaimZh: '',
      practicalStepsZh: '',
      published: '1',
      sortOrder: '0',
    });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    const id = form.id.trim().toLowerCase();
    if (!id) {
      toast.error('请填写项目 ID（如 chime）');
      return;
    }
    const base =
      editing ||
      staticPrograms.find((p) => p.id === id) ||
      ({
        id,
        category: 'other',
        offerKind: 'refer',
        brandName: { zh: id, en: id },
        editions: [],
      } as ReferralProgram);

    const program: ReferralProgram = {
      ...base,
      id,
      howToClaim: {
        zh: linesToList(form.howToClaimZh),
        en: base.howToClaim?.en ?? linesToList(form.howToClaimZh),
      },
      practicalSteps: {
        zh: linesToList(form.practicalStepsZh),
        en: base.practicalSteps?.en ?? linesToList(form.practicalStepsZh),
      },
      siteRebateUsd: form.siteRebateUsd.trim() ? Number(form.siteRebateUsd) : null,
      siteRebateLabel: {
        zh: form.siteRebateLabelZh.trim(),
        en: form.siteRebateLabelEn.trim() || form.siteRebateLabelZh.trim(),
      },
    };

    const payload = programToSavePayload(
      program,
      Number(form.published) || 1,
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
            配置本站返现金额、领取步骤与实操说明。前台详情页路径：/deals/[项目ID]
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
                <TableHead>本站返现 $</TableHead>
                <TableHead>返现文案</TableHead>
                <TableHead className="text-right">操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {mergedPrograms.map((program) => (
                <TableRow key={program.id}>
                  <TableCell className="font-mono text-xs">{program.id}</TableCell>
                  <TableCell>{program.brandName.zh}</TableCell>
                  <TableCell>{program.siteRebateUsd ?? '—'}</TableCell>
                  <TableCell className="max-w-xs truncate">{program.siteRebateLabel?.zh || '—'}</TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="sm" onClick={() => openEdit(program)}>
                      <Pencil className="mr-1 h-4 w-4" />
                      编辑
                    </Button>
                    {apiRecords.some((r) => r.id === program.id) ? (
                      <Button variant="ghost" size="sm" onClick={() => void handleDelete(program.id)}>
                        <Trash2 className="mr-1 h-4 w-4 text-destructive" />
                        删除
                      </Button>
                    ) : null}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-h-[90vh] max-w-lg overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{isNew ? '新建薅羊毛项目' : '编辑薅羊毛项目'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <Input
              placeholder="项目 ID（如 chime）"
              value={form.id}
              disabled={!isNew}
              onChange={(e) => setForm((f) => ({ ...f, id: e.target.value }))}
            />
            <Input
              placeholder="本站返现 USD 金额（数字，可留空）"
              value={form.siteRebateUsd}
              onChange={(e) => setForm((f) => ({ ...f, siteRebateUsd: e.target.value }))}
            />
            <Input
              placeholder="本站返现展示（中文）"
              value={form.siteRebateLabelZh}
              onChange={(e) => setForm((f) => ({ ...f, siteRebateLabelZh: e.target.value }))}
            />
            <Input
              placeholder="本站返现展示（英文，可选）"
              value={form.siteRebateLabelEn}
              onChange={(e) => setForm((f) => ({ ...f, siteRebateLabelEn: e.target.value }))}
            />
            <Textarea
              placeholder="如何领取（每行一步）"
              rows={6}
              value={form.howToClaimZh}
              onChange={(e) => setForm((f) => ({ ...f, howToClaimZh: e.target.value }))}
            />
            <Textarea
              placeholder="实操说明 / 避坑（每行一条）"
              rows={5}
              value={form.practicalStepsZh}
              onChange={(e) => setForm((f) => ({ ...f, practicalStepsZh: e.target.value }))}
            />
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
