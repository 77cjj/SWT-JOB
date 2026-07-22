'use client';

import * as React from 'react';
import Link from 'next/link';
import {
  Button,
  ButtonBase,
  ListItemIcon,
  ListItemText,
  Menu,
  MenuItem,
  Tooltip,
  Typography,
} from '@mui/material';
import {
  AdminPanelSettings as AdminPanelSettingsIcon,
  Logout as LogoutIcon,
  Person as PersonIcon,
} from '@mui/icons-material';
import { useRouter } from 'next/router';
import { useAuthStore } from '@/stores/authStore';
import { useI18n } from '../../context/I18nContext';

/**
 * 全局顶栏右侧：头像下拉 — 管理后台入口、个人主页、退出登录。
 * 修改密码与钱包在个人主页内完成。
 */
export function RagentChatUserMenu() {
  const router = useRouter();
  const { t } = useI18n();
  const user = useAuthStore((s) => s.user);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const openLoginDialog = useAuthStore((s) => s.openLoginDialog);
  const logout = useAuthStore((s) => s.logout);
  const [anchor, setAnchor] = React.useState<null | HTMLElement>(null);
  const open = Boolean(anchor);
  const [imgFailed, setImgFailed] = React.useState(false);

  const isAdmin = user?.role === 'admin';

  const displayName = (() => {
    const fallback = user?.username || user?.userId || '用户';
    return /^\d+$/.test(fallback) ? '用户' : fallback;
  })();

  const initial = displayName.slice(0, 1).toUpperCase();
  const avatarUrl = user?.avatar?.trim();
  const showImg = Boolean(avatarUrl) && !imgFailed;

  const handleLogout = async () => {
    setAnchor(null);
    await logout();
    void router.push('/chat');
  };

  if (!isAuthenticated) {
    return (
      <Button
        variant="outlined"
        size="small"
        onClick={() => openLoginDialog('登录后可保存对话与使用完整 AI 功能')}
      >
        请登录
      </Button>
    );
  }

  return (
    <>
      <Tooltip title={displayName}>
        <ButtonBase
          onClick={(e) => setAnchor(e.currentTarget)}
          aria-label="用户菜单"
          aria-haspopup="true"
          aria-expanded={open}
          sx={{
            border: '1px solid',
            borderColor: 'divider',
            borderRadius: 999,
            px: 1,
            py: 0.5,
            gap: 1,
            alignItems: 'center',
            maxWidth: '100%',
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
              textAlign: 'left',
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
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
        slotProps={{
          paper: {
            sx: { minWidth: 200 },
          },
        }}
      >
        {isAdmin ? (
          <MenuItem
            component={Link}
            href="/admin/dashboard"
            onClick={() => setAnchor(null)}
          >
            <ListItemIcon sx={{ minWidth: 36 }}>
              <AdminPanelSettingsIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText primary={t('nav.admin')} />
          </MenuItem>
        ) : null}
        <MenuItem
          component={Link}
          href={`/u/${user?.userId || ''}`}
          onClick={() => setAnchor(null)}
        >
          <ListItemIcon sx={{ minWidth: 36 }}>
            <PersonIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText primary="个人主页" />
        </MenuItem>
        <MenuItem onClick={handleLogout} sx={{ color: 'error.main' }}>
          <ListItemIcon>
            <LogoutIcon fontSize="small" color="error" />
          </ListItemIcon>
          <ListItemText primary={t('common.logout')} />
        </MenuItem>
      </Menu>
    </>
  );
}
