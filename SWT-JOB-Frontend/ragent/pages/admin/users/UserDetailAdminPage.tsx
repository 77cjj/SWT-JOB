import { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { ArrowLeft, Save } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { getUserById, updateUser, type UserItem, type UserUpdatePayload } from '@/services/userService';
import { getErrorMessage } from '@/utils/error';

export function UserDetailAdminPage() {
  const router = useRouter();
  const slug = router.query.slug;
  const userId = useMemo(() => {
    const parts = Array.isArray(slug) ? slug : slug ? [slug] : [];
    return parts[0] === 'users' && parts[1] ? parts[1] : '';
  }, [slug]);
  const [user, setUser] = useState<UserItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    displayName: '',
    accountStatus: 'active',
    officialVerified: false,
    restrictionNote: '',
    role: 'user',
  });

  useEffect(() => {
    if (!userId) return;
    const load = async () => {
      try {
        setLoading(true);
        const data = await getUserById(userId);
        setUser(data);
        setForm({
          displayName: data.displayName ?? '',
          accountStatus: data.accountStatus ?? 'active',
          officialVerified: Boolean(data.officialVerified),
          restrictionNote: data.restrictionNote ?? '',
          role: data.role ?? 'user',
        });
      } catch (error) {
        toast.error(getErrorMessage(error, '加载用户失败'));
      } finally {
        setLoading(false);
      }
    };
    void load();
  }, [userId]);

  const save = async () => {
    if (!user) return;
    try {
      setSaving(true);
      const payload: UserUpdatePayload = {
        role: form.role,
        displayName: form.displayName.trim() || undefined,
        accountStatus: form.accountStatus,
        officialVerified: form.officialVerified,
        restrictionNote: form.restrictionNote.trim() || undefined,
      };
      await updateUser(user.id, payload);
      toast.success('已保存');
    } catch (error) {
      toast.error(getErrorMessage(error, '保存失败'));
    } finally {
      setSaving(false);
    }
  };

  if (!userId) {
    return <div className="p-6 text-muted-foreground">无效用户 ID</div>;
  }

  return (
    <div className="admin-page">
      <div className="admin-page-header">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/admin/users">
              <ArrowLeft className="w-4 h-4 mr-1" />
              返回列表
            </Link>
          </Button>
          <div>
            <h1 className="admin-page-title">用户详情</h1>
            <p className="admin-page-subtitle">{user?.username ?? userId}</p>
          </div>
        </div>
        <Button className="admin-primary-gradient" disabled={saving || !user} onClick={() => void save()}>
          <Save className="w-4 h-4 mr-2" />
          保存
        </Button>
      </div>

      <Card>
        <CardContent className="pt-6 space-y-4 max-w-xl">
          {loading ? (
            <div className="text-muted-foreground">加载中...</div>
          ) : !user ? (
            <div className="text-muted-foreground">用户不存在</div>
          ) : (
            <>
              <div className="space-y-2">
                <label className="text-sm font-medium">展示名</label>
                <Input
                  value={form.displayName}
                  onChange={(e) => setForm((f) => ({ ...f, displayName: e.target.value }))}
                  placeholder="可选，用于社区展示"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">角色</label>
                <Select value={form.role} onValueChange={(v) => setForm((f) => ({ ...f, role: v }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="user">成员</SelectItem>
                    <SelectItem value="admin">管理员</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">账号状态</label>
                <Select
                  value={form.accountStatus}
                  onValueChange={(v) => setForm((f) => ({ ...f, accountStatus: v }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">正常</SelectItem>
                    <SelectItem value="restricted">限制（不可发言/贡献）</SelectItem>
                    <SelectItem value="banned">封禁</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center gap-2">
                <input
                  id="officialVerified"
                  type="checkbox"
                  checked={form.officialVerified}
                  onChange={(e) => setForm((f) => ({ ...f, officialVerified: e.target.checked }))}
                />
                <label htmlFor="officialVerified" className="text-sm">
                  官方认证（校友/验证身份）
                </label>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">限制说明（站内可见给管理员）</label>
                <Textarea
                  value={form.restrictionNote}
                  onChange={(e) => setForm((f) => ({ ...f, restrictionNote: e.target.value }))}
                  placeholder="例如：重复 spam 留言，限制至 2026-08-01"
                />
              </div>
              <p className="text-xs text-muted-foreground">
                用户 ID：<span className="font-mono">{user.id}</span> · 注册{' '}
                {user.createTime ? new Date(user.createTime).toLocaleString('zh-CN') : '—'}
              </p>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
