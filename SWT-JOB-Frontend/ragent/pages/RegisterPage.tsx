import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import {
  FormControl,
  FormControlLabel,
  FormLabel,
  MenuItem,
  Radio,
  RadioGroup,
  TextField,
} from "@mui/material";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuthStore } from "@/stores/authStore";
import { GoogleLoginButton } from "../../src/components/auth/GoogleLoginButton";
import type { ProfileVisibility } from "../../src/lib/member/types";
import { US_STATE_OPTIONS } from "../../src/lib/member/profile";

export function RegisterPage() {
  const router = useRouter();
  const { register, isLoading } = useAuthStore();
  const [form, setForm] = React.useState({
    username: "",
    password: "",
    confirmPassword: "",
    displayName: "",
    programYear: "",
    workState: "",
    jobTitle: "",
    phone: "",
    email: "",
    wechat: "",
    profileVisibility: "consent" as ProfileVisibility,
  });
  const [error, setError] = React.useState<string | null>(null);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    if (!form.username.trim() || !form.password.trim()) {
      setError("请填写用户名和密码。");
      return;
    }
    if (form.password.length < 6) {
      setError("密码至少 6 位。");
      return;
    }
    if (form.password !== form.confirmPassword) {
      setError("两次密码不一致。");
      return;
    }
    try {
      await register({
        username: form.username.trim(),
        password: form.password,
        displayName: form.displayName.trim() || undefined,
        programYear: form.programYear.trim() || undefined,
        workState: form.workState || undefined,
        jobTitle: form.jobTitle.trim() || undefined,
        phone: form.phone.trim() || undefined,
        email: form.email.trim() || undefined,
        wechat: form.wechat.trim() || undefined,
        profileVisibility: form.profileVisibility,
      });
      void router.push("/settings/profile");
    } catch (err) {
      setError((err as Error).message || "注册失败");
    }
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center px-4 py-8">
      <div className="absolute inset-0 bg-gradient-to-br from-slate-50 via-blue-50/50 to-blue-100 dark:from-slate-950 dark:via-slate-900 dark:to-slate-900" />
      <div className="relative z-10 w-full max-w-lg rounded-3xl border border-border/70 bg-background/80 p-8 shadow-soft backdrop-blur">
        <div className="mb-6">
          <p className="font-display text-2xl font-semibold">创建账号</p>
          <p className="mt-1 text-sm text-muted-foreground">
            注册后可分享薅羊毛亲测、维护个人主页。SWT 信息均为选填。
          </p>
        </div>

        <div className="mb-4 flex justify-center">
          <GoogleLoginButton />
        </div>

        <div className="relative my-5 text-center text-xs text-muted-foreground">
          <span className="bg-background/80 px-2 relative z-10">或使用用户名注册</span>
          <div className="absolute inset-x-0 top-1/2 border-t border-border/70" />
        </div>

        <form className="space-y-3" onSubmit={handleSubmit}>
          <Input placeholder="用户名 *" value={form.username} onChange={(e) => setForm((p) => ({ ...p, username: e.target.value }))} autoComplete="username" />
          <Input type="password" placeholder="密码 *（至少 6 位）" value={form.password} onChange={(e) => setForm((p) => ({ ...p, password: e.target.value }))} autoComplete="new-password" />
          <Input type="password" placeholder="确认密码 *" value={form.confirmPassword} onChange={(e) => setForm((p) => ({ ...p, confirmPassword: e.target.value }))} autoComplete="new-password" />
          <Input placeholder="显示名称（选填）" value={form.displayName} onChange={(e) => setForm((p) => ({ ...p, displayName: e.target.value }))} />
          <div className="grid grid-cols-2 gap-2">
            <Input placeholder="SWT 年份" value={form.programYear} onChange={(e) => setForm((p) => ({ ...p, programYear: e.target.value }))} />
            <TextField select size="small" label="工作州" value={form.workState} onChange={(e) => setForm((p) => ({ ...p, workState: e.target.value }))} fullWidth>
              <MenuItem value="">未填写</MenuItem>
              {US_STATE_OPTIONS.map((s) => (
                <MenuItem key={s} value={s}>{s}</MenuItem>
              ))}
            </TextField>
          </div>
          <Input placeholder="岗位/一工（选填）" value={form.jobTitle} onChange={(e) => setForm((p) => ({ ...p, jobTitle: e.target.value }))} />
          <Input placeholder="手机号（选填）" value={form.phone} onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value }))} />
          <Input placeholder="邮箱（选填）" value={form.email} onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))} />
          <Input placeholder="微信（选填）" value={form.wechat} onChange={(e) => setForm((p) => ({ ...p, wechat: e.target.value }))} />

          <FormControl fullWidth>
            <FormLabel sx={{ fontSize: "0.75rem", mb: 0.5 }}>联系方式披露</FormLabel>
            <RadioGroup row value={form.profileVisibility} onChange={(e) => setForm((p) => ({ ...p, profileVisibility: e.target.value as ProfileVisibility }))}>
              <FormControlLabel value="consent" control={<Radio size="small" />} label="经同意才披露" />
              <FormControlLabel value="public" control={<Radio size="small" />} label="主页直接公开" />
            </RadioGroup>
          </FormControl>

          {error ? <p className="text-sm text-destructive">{error}</p> : null}
          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? "注册中…" : "注册"}
          </Button>
        </form>

        <p className="mt-4 text-center text-sm text-muted-foreground">
          已有账号？{" "}
          <Link href="/login" className="font-medium text-primary hover:underline">
            去登录
          </Link>
        </p>
      </div>
    </div>
  );
}
