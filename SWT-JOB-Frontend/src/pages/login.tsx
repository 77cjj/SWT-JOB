"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import { Box, Button, Typography } from "@mui/material";

import DesktopLayout from "../layout/desktop/Layout";
import MobileLayout from "../layout/mobile/Layout";
import useDevice from "../hooks/useDevice";
import { useAuthStore } from "@/stores/authStore";

/**
 * 旧链接 /login 不再使用全屏表单：打开全局登录弹窗并回到目标页，避免「困在登录页」。
 */
export default function LoginRedirectPage() {
  const router = useRouter();
  const isMobile = useDevice();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  useEffect(() => {
    if (!router.isReady || isAuthenticated) return;
    const redirect =
      typeof router.query.redirect === "string" && router.query.redirect.startsWith("/")
        ? router.query.redirect
        : "/chat";
    useAuthStore.getState().openLoginDialog("登录后可使用完整功能");
    void router.replace(redirect);
  }, [router.isReady, router.query.redirect, isAuthenticated, router]);

  useEffect(() => {
    if (isAuthenticated) {
      const redirect =
        typeof router.query.redirect === "string" && router.query.redirect.startsWith("/")
          ? router.query.redirect
          : "/chat";
      void router.replace(redirect);
    }
  }, [isAuthenticated, router]);

  const content = (
    <Box sx={{ py: 8, textAlign: "center" }}>
      <Typography variant="body1" color="text.secondary" gutterBottom>
        正在打开登录窗口…
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        若未看到弹窗，请点击右上角「请登录」，或关闭弹窗继续浏览站点。
      </Typography>
      <Button component={Link} href="/" variant="outlined" size="small">
        返回首页
      </Button>
    </Box>
  );

  return isMobile ? <MobileLayout>{content}</MobileLayout> : <DesktopLayout>{content}</DesktopLayout>;
}
