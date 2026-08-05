"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import { Box, Button, Typography } from "@mui/material";

import DesktopLayout from "../layout/desktop/Layout";
import MobileLayout from "../layout/mobile/Layout";
import useDevice from "../hooks/useDevice";
import { useAuthStore } from "@/stores/authStore";
import { useI18n } from "../context/I18nContext";

/**
 * 旧链接 /login：打开全局登录弹窗并回到目标页，避免「困在登录页」。
 */
export default function LoginRedirectPage() {
  const router = useRouter();
  const isMobile = useDevice();
  const { t } = useI18n();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  useEffect(() => {
    if (!router.isReady || isAuthenticated) return;
    const redirect =
      typeof router.query.redirect === "string" && router.query.redirect.startsWith("/")
        ? router.query.redirect
        : "/chat";
    useAuthStore.getState().openLoginDialog(t("auth.loginReasonDefault"));
    void router.replace(redirect);
  }, [router.isReady, router.query.redirect, isAuthenticated, router, t]);

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
        {t("auth.openingLogin")}
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        {t("auth.openDialogHint")}
      </Typography>
      <Button component={Link} href="/" variant="outlined" size="small">
        {t("auth.backHome")}
      </Button>
    </Box>
  );

  return isMobile ? <MobileLayout>{content}</MobileLayout> : <DesktopLayout>{content}</DesktopLayout>;
}
