import * as React from "react";
import {
  Box,
  Button,
  Drawer,
  IconButton,
  Stack,
  Typography,
} from "@mui/material";
import { Close, Language, MenuBook, OpenInNew } from "@mui/icons-material";
import Link from "next/link";

import { MarkdownRenderer } from "@/components/chat/MarkdownRenderer";
import { useI18n } from "../../../src/context/I18nContext";
import type { MessageResource } from "@/types";

type ResourcePreviewDrawerProps = {
  open: boolean;
  resource: MessageResource | null;
  onClose: () => void;
};

function isInternalDocsPath(url?: string): boolean {
  return Boolean(url && url.startsWith("/docs/"));
}

export function ResourcePreviewDrawer({ open, resource, onClose }: ResourcePreviewDrawerProps) {
  const { t, tWithParams } = useI18n();

  const body = resource?.content || resource?.snippet || "";
  const docsPath = isInternalDocsPath(resource?.url) ? resource!.url! : null;
  const externalUrl =
    resource?.url && !isInternalDocsPath(resource.url) ? resource.url : null;
  const isWebSource = Boolean(externalUrl && !resource?.docId);

  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={onClose}
      PaperProps={{
        sx: {
          width: { xs: "100%", sm: 420, md: 480 },
          display: "flex",
          flexDirection: "column",
        },
      }}
    >
      <Box
        sx={{
          display: "flex",
          alignItems: "flex-start",
          gap: 1,
          px: 2,
          py: 1.5,
          borderBottom: 1,
          borderColor: "divider",
        }}
      >
        {isWebSource ? (
          <Language sx={{ mt: 0.25, color: "primary.main", fontSize: 22 }} />
        ) : (
          <MenuBook sx={{ mt: 0.25, color: "primary.main", fontSize: 22 }} />
        )}
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography variant="subtitle1" fontWeight={700} sx={{ wordBreak: "break-word" }}>
            {resource?.title || t("chat.resourceUntitled")}
          </Typography>
          {typeof resource?.score === "number" ? (
            <Typography variant="caption" color="text.secondary">
              {tWithParams("chat.resourceRelevance", { score: Math.round(resource.score * 100) })}
            </Typography>
          ) : null}
        </Box>
        <IconButton aria-label={t("common.close")} onClick={onClose} size="small">
          <Close fontSize="small" />
        </IconButton>
      </Box>

      <Box sx={{ flex: 1, overflow: "auto", px: 2, py: 2 }}>
        {body ? (
          <Box className="resource-preview-markdown">
            <MarkdownRenderer content={body} />
          </Box>
        ) : (
          <Typography variant="body2" color="text.secondary">
            {t("chat.resourceNoContent")}
          </Typography>
        )}
      </Box>

      {(docsPath || externalUrl) && (
        <Stack
          direction="row"
          spacing={1}
          sx={{ px: 2, py: 1.5, borderTop: 1, borderColor: "divider" }}
        >
          {docsPath ? (
            <Button
              component={Link}
              href={docsPath}
              variant="contained"
              size="small"
              startIcon={<MenuBook />}
              onClick={onClose}
            >
              {t("chat.resourceOpenDocs")}
            </Button>
          ) : null}
          {externalUrl ? (
            <Button
              href={externalUrl}
              target="_blank"
              rel="noreferrer"
              variant={docsPath ? "outlined" : "contained"}
              size="small"
              startIcon={<OpenInNew />}
            >
              {t("chat.resourceOpenExternal")}
            </Button>
          ) : null}
        </Stack>
      )}
    </Drawer>
  );
}
