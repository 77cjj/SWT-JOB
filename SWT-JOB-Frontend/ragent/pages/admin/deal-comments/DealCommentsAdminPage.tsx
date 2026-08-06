import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/router';
import { Eye, EyeOff, RefreshCw, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  deleteAdminDealComment,
  fetchAdminDealComments,
  updateAdminDealComment,
  type DealCommentRecord,
} from '../../../../src/lib/deals/dealCommentApi';
import { getErrorMessage } from '@/utils/error';

export function DealCommentsAdminPage() {
  const router = useRouter();
  const [dealId, setDealId] = useState('');
  const [rows, setRows] = useState<DealCommentRecord[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async (filterDealId?: string) => {
    try {
      setLoading(true);
      const data = await fetchAdminDealComments(filterDealId?.trim() || undefined);
      setRows(data);
    } catch (error) {
      toast.error(getErrorMessage(error, '加载评论失败'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!router.isReady) return;
    const q = typeof router.query.dealId === 'string' ? router.query.dealId : '';
    setDealId(q);
    void load(q);
  }, [router.isReady, router.query.dealId]);

  const visibleCount = useMemo(
    () => rows.filter((r) => r.status === 'visible').length,
    [rows],
  );

  const toggleHidden = async (row: DealCommentRecord) => {
    const next = row.status === 'visible' ? 'hidden' : 'visible';
    try {
      await updateAdminDealComment(row.id, { status: next });
      toast.success(next === 'hidden' ? '已隐藏' : '已恢复显示');
      await load(dealId);
    } catch (error) {
      toast.error(getErrorMessage(error, '更新失败'));
    }
  };

  const remove = async (row: DealCommentRecord) => {
    if (!window.confirm('确认删除这条评论？')) return;
    try {
      await deleteAdminDealComment(row.id);
      toast.success('已删除');
      await load(dealId);
    } catch (error) {
      toast.error(getErrorMessage(error, '删除失败'));
    }
  };

  return (
    <div className="admin-page">
      <div className="admin-page-header">
        <div>
          <h1 className="admin-page-title">薅羊毛评论管理</h1>
          <p className="admin-page-subtitle">
            按项目 ID 筛选、隐藏或删除用户评论。当前可见 {visibleCount} / 共 {rows.length} 条。
          </p>
        </div>
        <Button variant="outline" onClick={() => void load(dealId)}>
          <RefreshCw className="w-4 h-4 mr-2" />
          刷新
        </Button>
      </div>

      <Card className="mb-4">
        <CardContent className="pt-6 flex flex-col gap-3 sm:flex-row sm:items-end">
          <div className="flex-1 space-y-2">
            <Label htmlFor="deal-filter">项目 ID（可选）</Label>
            <Input
              id="deal-filter"
              placeholder="如 revolut、lemfi；留空=全部"
              value={dealId}
              onChange={(e) => setDealId(e.target.value)}
            />
          </div>
          <Button onClick={() => void load(dealId)}>筛选</Button>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6">
          {loading ? (
            <div className="text-center py-8 text-muted-foreground">加载中...</div>
          ) : rows.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">暂无评论</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>项目</TableHead>
                  <TableHead>用户</TableHead>
                  <TableHead>内容</TableHead>
                  <TableHead>状态</TableHead>
                  <TableHead>时间</TableHead>
                  <TableHead className="text-right">操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((row) => (
                  <TableRow key={row.id}>
                    <TableCell className="font-mono text-xs">{row.dealId}</TableCell>
                    <TableCell className="font-mono text-xs">{row.userId}</TableCell>
                    <TableCell className="max-w-md">
                      <div className="line-clamp-3 text-sm whitespace-pre-wrap">{row.body}</div>
                      {row.parentId ? (
                        <div className="text-xs text-muted-foreground mt-1">回复 {row.parentId}</div>
                      ) : null}
                    </TableCell>
                    <TableCell>{row.status === 'visible' ? '可见' : '已隐藏'}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {(row.createTime || '').replace('T', ' ').slice(0, 19)}
                    </TableCell>
                    <TableCell className="text-right space-x-1">
                      <Button variant="ghost" size="sm" onClick={() => void toggleHidden(row)}>
                        {row.status === 'visible' ? (
                          <>
                            <EyeOff className="w-4 h-4 mr-1" />
                            隐藏
                          </>
                        ) : (
                          <>
                            <Eye className="w-4 h-4 mr-1" />
                            显示
                          </>
                        )}
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => void remove(row)}>
                        <Trash2 className="w-4 h-4 mr-1 text-destructive" />
                        删除
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
