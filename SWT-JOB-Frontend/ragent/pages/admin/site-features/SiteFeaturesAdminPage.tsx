import { useEffect, useState } from 'react';
import { RefreshCw } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import {
  fetchAdminSiteFeatures,
  updateAdminSiteFeatures,
  type SiteFeatureFlagRecord,
  type SiteFeatureKey,
} from '../../../../src/lib/site/siteFeaturesApi';
import { getErrorMessage } from '@/utils/error';

const ORDER: SiteFeatureKey[] = ['chat', 'deals', 'compare', 'jobs', 'docs'];

const FALLBACK_LABEL: Record<SiteFeatureKey, string> = {
  chat: 'AI问答',
  deals: '薅羊毛',
  compare: '选岗计算器',
  jobs: '岗位情报',
  docs: 'SWT文档',
};

export function SiteFeaturesAdminPage() {
  const [rows, setRows] = useState<SiteFeatureFlagRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingKey, setSavingKey] = useState<string | null>(null);

  const load = async () => {
    try {
      setLoading(true);
      const data = await fetchAdminSiteFeatures();
      const sorted = [...data].sort(
        (a, b) => ORDER.indexOf(a.key) - ORDER.indexOf(b.key) || (a.sortOrder ?? 0) - (b.sortOrder ?? 0),
      );
      setRows(sorted);
    } catch (error) {
      toast.error(getErrorMessage(error, '加载功能开关失败'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const toggle = async (key: SiteFeatureKey, enabled: boolean) => {
    try {
      setSavingKey(key);
      setRows((prev) => prev.map((r) => (r.key === key ? { ...r, enabled } : r)));
      const next = await updateAdminSiteFeatures({ [key]: enabled });
      const sorted = [...next].sort(
        (a, b) => ORDER.indexOf(a.key) - ORDER.indexOf(b.key) || (a.sortOrder ?? 0) - (b.sortOrder ?? 0),
      );
      setRows(sorted);
      toast.success(enabled ? `已开放：${FALLBACK_LABEL[key]}` : `已关闭：${FALLBACK_LABEL[key]}`);
    } catch (error) {
      toast.error(getErrorMessage(error, '更新失败'));
      await load();
    } finally {
      setSavingKey(null);
    }
  };

  return (
    <div className="admin-page">
      <div className="admin-page-header">
        <div>
          <h1 className="admin-page-title">功能开放开关</h1>
          <p className="admin-page-subtitle">
            控制前台五大菜单是否开放。关闭后用户仍可进入页面，但会看到毛玻璃维护提示，且不播放新手教程。
          </p>
        </div>
        <Button variant="outline" onClick={() => void load()}>
          <RefreshCw className="w-4 h-4 mr-2" />
          刷新
        </Button>
      </div>

      <Card>
        <CardContent className="pt-6 space-y-4">
          {loading ? (
            <div className="text-center py-8 text-muted-foreground">加载中...</div>
          ) : rows.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">暂无配置，请重启后端以自动建表</div>
          ) : (
            rows.map((row) => (
              <div
                key={row.key}
                className="flex items-center justify-between gap-4 rounded-lg border px-4 py-3"
              >
                <div>
                  <Label className="text-base font-semibold">
                    {row.labelZh || FALLBACK_LABEL[row.key] || row.key}
                  </Label>
                  <p className="text-sm text-muted-foreground mt-0.5">
                    键名 <code>{row.key}</code>
                    {row.enabled ? ' · 当前开放' : ' · 当前维护遮罩'}
                  </p>
                </div>
                <label className="flex items-center gap-2 text-sm cursor-pointer select-none">
                  <Checkbox
                    checked={row.enabled}
                    disabled={savingKey === row.key}
                    onCheckedChange={(checked) => void toggle(row.key, checked === true)}
                  />
                  开放
                </label>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}
