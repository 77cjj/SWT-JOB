"use client";

import * as React from "react";
import Link from "next/link";
import {
  Button,
  ButtonBase,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  ListItemIcon,
  ListItemText,
  Menu,
  MenuItem,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import {
  AdminPanelSettings as AdminPanelSettingsIcon,
  Logout as LogoutIcon,
  VpnKey as VpnKeyIcon,
} from "@mui/icons-material";
import { useRouter } from "next/router";
import { toast } from "sonner";
import { useAuthStore } from "@/stores/authStore";
import { changePassword } from "@/services/userService";
import { getVisibleAdminNavItems } from "@/lib/adminNavLinks";
import { useI18n } from "../../context/I18nContext";

/**
 * 全局顶栏右侧：胶囊式头像+用户名；下拉菜单含管理后台子菜单（按角色）、修改密码与退出登录
 */
export function RagentChatUserMenu() {
  const router = useRouter();
  const { t } = useI18n();
  const user = useAuthStore((s) => s.user);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const logout = useAuthStore((s) => s.logout);
  const [anchor, setAnchor] = React.useState<null | HTMLElement>(null);
  const open = Boolean(anchor);
  const [imgFailed, setImgFailed] = React.useState(false);
  const [passwordOpen, setPasswordOpen] = React.useState(false);
  const [passwordSubmitting, setPasswordSubmitting] = React.useState(false);
  const [passwordForm, setPasswordForm] = React.useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const adminNavItems = React.useMemo(() => getVisibleAdminNavItems(user), [user]);

  const displayName = (() => {
    const fallback = user?.username || user?.userId || "用户";
    return /^\d+$/.test(fallback) ? "用户" : fallback;
  })();

  const initial = displayName.slice(0, 1).toUpperCase();
  const avatarUrl = user?.avatar?.trim();
  const showImg = Boolean(avatarUrl) && !imgFailed;

  const handleLogout = async () => {
    setAnchor(null);
    await logout();
    void router.push("/login");
  };

  const handleOpenPassword = () => {
    setAnchor(null);
    setPasswordOpen(true);
  };

  const handlePasswordSubmit = async () => {
    if (!passwordForm.currentPassword || !passwordForm.newPassword) {
      toast.error("请输入当前密码和新密码");
      return;
    }
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast.error("两次输入的新密码不一致");
      return;
    }
    try {
      setPasswordSubmitting(true);
      await changePassword({
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword,
      });
      toast.success("密码已更新");
      setPasswordOpen(false);
      setPasswordForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
    } catch (error) {
      toast.error((error as Error).message || "修改密码失败");
    } finally {
      setPasswordSubmitting(false);
    }
  };

  return (
    <>
      <Tooltip title={displayName}>
        <ButtonBase
          onClick={(e) => setAnchor(e.currentTarget)}
          aria-label="用户菜单"
          aria-haspopup="true"
          aria-expanded={open}
          sx={{
            border: "1px solid",
            borderColor: "divider",
            borderRadius: 999,
            px: 1,
            py: 0.5,
            gap: 1,
            alignItems: "center",
            maxWidth: "100%",
          }}
        >
          {showImg ? (
            <img
              src={avatarUrl}
              alt=""
              className="h-7 w-7 shrink-0 rounded-full object-cover"
              onError={() => setImgFailed(true)}
            />
          ) : (
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-indigo-600 text-xs font-semibold text-white">
              {initial}
            </span>
          )}
          <Typography
            variant="body2"
            component="span"
            noWrap
            sx={{
              maxWidth: { xs: 96, sm: 140 },
              textAlign: "left",
              fontWeight: 500,
            }}
          >
            {displayName}
          </Typography>
        </ButtonBase>
      </Tooltip>
      <Menu
        anchorEl={anchor}
        open={open}
        onClose={() => setAnchor(null)}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
        transformOrigin={{ vertical: "top", horizontal: "right" }}
        slotProps={{
          paper: {
            sx: { maxHeight: 420, minWidth: 220 },
          },
        }}
      >
        {adminNavItems.length > 0 ? (
          <>
            <Typography
              variant="caption"
              sx={{ px: 2, pt: 1.25, pb: 0.5, display: "block", color: "text.secondary" }}
            >
              {t("nav.admin")}
            </Typography>
            {adminNavItems.map((item, index) => (
              <MenuItem
                key={item.path}
                component={Link}
                href={item.path}
                onClick={() => setAnchor(null)}
              >
                <ListItemIcon sx={{ minWidth: 36 }}>
                  {index === 0 ? <AdminPanelSettingsIcon fontSize="small" /> : null}
                </ListItemIcon>
                <ListItemText primaryTypographyProps={{ variant: "body2" }} primary={item.label} />
              </MenuItem>
            ))}
            <Divider />
          </>
        ) : null}
        {isAuthenticated ? (
          <MenuItem onClick={handleOpenPassword}>
            <ListItemIcon sx={{ minWidth: 36 }}>
              <VpnKeyIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText primary="修改密码" />
          </MenuItem>
        ) : null}
        <MenuItem onClick={handleLogout} sx={{ color: "error.main" }}>
          <ListItemIcon>
            <LogoutIcon fontSize="small" color="error" />
          </ListItemIcon>
          <ListItemText primary={t("common.logout")} />
        </MenuItem>
      </Menu>

      <Dialog
        open={passwordOpen}
        onClose={() => {
          if (!passwordSubmitting) {
            setPasswordOpen(false);
            setPasswordForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
          }
        }}
        fullWidth
        maxWidth="xs"
      >
        <DialogTitle>修改密码</DialogTitle>
        <DialogContent className="flex flex-col gap-3 pt-1">
          <TextField
            label="当前密码"
            type="password"
            name="current-password"
            autoComplete="current-password"
            value={passwordForm.currentPassword}
            onChange={(e) => setPasswordForm((p) => ({ ...p, currentPassword: e.target.value }))}
            size="small"
            margin="dense"
          />
          <TextField
            label="新密码"
            type="password"
            name="new-password"
            autoComplete="new-password"
            value={passwordForm.newPassword}
            onChange={(e) => setPasswordForm((p) => ({ ...p, newPassword: e.target.value }))}
            size="small"
            margin="dense"
          />
          <TextField
            label="确认新密码"
            type="password"
            name="confirm-new-password"
            autoComplete="new-password"
            value={passwordForm.confirmPassword}
            onChange={(e) => setPasswordForm((p) => ({ ...p, confirmPassword: e.target.value }))}
            size="small"
            margin="dense"
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button
            onClick={() => {
              setPasswordOpen(false);
              setPasswordForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
            }}
            disabled={passwordSubmitting}
          >
            取消
          </Button>
          <Button variant="contained" onClick={() => void handlePasswordSubmit()} disabled={passwordSubmitting}>
            {passwordSubmitting ? "保存中…" : "保存"}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
