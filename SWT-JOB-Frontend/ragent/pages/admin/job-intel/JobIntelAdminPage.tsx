import { useEffect, useState } from 'react';
import { RefreshCw } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
  fetchAdminContributions,
  fetchAdminDocuments,
  reviewContribution,
  reviewDocument,
  type JobIntelContributionRecord,
  type JobIntelDocumentRecord,
} from '../../../../src/lib/jobs/jobIntelApi';
import { getErrorMessage } from '@/utils/error';

export function JobIntelAdminPage() {
  const [tab, setTab] = useState<'contributions' | 'documents'>('contributions');
  const [contributions, setContributions] = useState<JobIntelContributionRecord[]>([]);
  const [documents, setDocuments] = useState<JobIntelDocumentRecord[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    try {
      setLoading(true);
      const [c, d] = await Promise.all([fetchAdminContributions(), fetchAdminDocuments()]);
      setContributions(c);
      setDocuments(d);
    } catch (error) {
      toast.error(getErrorMessage(error, '加载岗位情报失败'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const approveContribution = async (row: JobIntelContributionRecord) => {
    try {
      await reviewContribution(row.id, { status: 'approved', published: true });
      toast.success('已批准');
      await load();
    } catch (error) {
      toast.error(getErrorMessage(error, '操作失败'));
    }
  };

  const rejectContribution = async (row: JobIntelContributionRecord) => {
    try {
      await reviewContribution(row.id, { status: 'rejected', published: false });
      toast.success('已拒绝');
      await load();
    } catch (error) {
      toast.error(getErrorMessage(error, '操作失败'));
    }
  };

  const publishDocument = async (row: JobIntelDocumentRecord) => {
    try {
      await reviewDocument(row.id, { status: 'published' });
      toast.success('已发布');
      await load();
    } catch (error) {
      toast.error(getErrorMessage(error, '操作失败'));
    }
  };

  return (
    <div className="admin-page">
      <div className="admin-page-header">
        <div>
          <h1 className="admin-page-title">岗位情报审核</h1>
          <p className="admin-page-subtitle">用户贡献与上传的细则/雇主信息，审核后在前台展示</p>
        </div>
        <Button variant="outline" onClick={() => void load()}>
          <RefreshCw className="w-4 h-4 mr-2" />
          刷新
        </Button>
      </div>

      <div className="flex gap-2 mb-4">
        <Button variant={tab === 'contributions' ? 'default' : 'outline'} onClick={() => setTab('contributions')}>
          贡献 ({contributions.length})
        </Button>
        <Button variant={tab === 'documents' ? 'default' : 'outline'} onClick={() => setTab('documents')}>
          上传条目 ({documents.length})
        </Button>
      </div>

      <Card>
        <CardContent className="pt-6">
          {loading ? (
            <div className="text-center py-8 text-muted-foreground">加载中...</div>
          ) : tab === 'contributions' ? (
            contributions.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">暂无贡献</div>
            ) : (
              <Table className="min-w-[900px]">
                <TableHeader>
                  <TableRow>
                    <TableHead>州/岗位</TableHead>
                    <TableHead>内容</TableHead>
                    <TableHead>状态</TableHead>
                    <TableHead>提交者</TableHead>
                    <TableHead>操作</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {contributions.map((row) => (
                    <TableRow key={row.id}>
                      <TableCell className="align-top">
                        {row.stateCode} · {row.jobTitle}
                        {row.hourlyWage != null ? ` · $${row.hourlyWage}/h` : ''}
                      </TableCell>
                      <TableCell className="align-top max-w-md whitespace-pre-wrap text-sm">{row.notes}</TableCell>
                      <TableCell className="align-top">{row.status}</TableCell>
                      <TableCell className="align-top text-xs text-muted-foreground">{row.submitterId}</TableCell>
                      <TableCell className="align-top space-x-2">
                        <Button size="sm" onClick={() => void approveContribution(row)}>
                          批准
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => void rejectContribution(row)}>
                          拒绝
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )
          ) : documents.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">暂无上传</div>
          ) : (
            <Table className="min-w-[900px]">
              <TableHeader>
                <TableRow>
                  <TableHead>岗位 ID</TableHead>
                  <TableHead>类型</TableHead>
                  <TableHead>正文</TableHead>
                  <TableHead>状态</TableHead>
                  <TableHead>操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {documents.map((row) => (
                  <TableRow key={row.id}>
                    <TableCell className="align-top font-mono text-xs">{row.jobId}</TableCell>
                    <TableCell className="align-top">{row.kind}</TableCell>
                    <TableCell className="align-top max-w-lg">
                      <Textarea readOnly value={row.body} className="min-h-[80px] text-xs" />
                    </TableCell>
                    <TableCell className="align-top">{row.status}</TableCell>
                    <TableCell className="align-top">
                      <Button size="sm" onClick={() => void publishDocument(row)}>
                        发布
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
