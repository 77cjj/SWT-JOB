import * as React from "react";
import Link from "next/link";
import { ExternalLink, Gift, Sparkles } from "lucide-react";

import { cn } from "@/lib/utils";
import type { MessageResource } from "@/types";
import { useI18n } from "../../../src/context/I18nContext";
import { openExternalUrl } from "../../../src/lib/openExternalUrl";

type ReferralResourceCardProps = {
  resource: MessageResource;
  onPreview?: () => void;
  className?: string;
};

export function ReferralResourceCard({ resource, onPreview, className }: ReferralResourceCardProps) {
  const { t } = useI18n();
  const dealHref =
    resource.url?.startsWith("/deals") ? resource.url : resource.dealId ? `/deals/${resource.dealId}` : null;
  const hasReferralLink = Boolean(resource.referralUrl?.trim());

  const handleOpenReferral = (event: React.MouseEvent) => {
    event.stopPropagation();
    if (resource.referralUrl) {
      openExternalUrl(resource.referralUrl);
    }
  };

  return (
    <div
      className={cn(
        "group relative overflow-hidden rounded-2xl border border-amber-200/90 bg-gradient-to-br from-amber-50 via-orange-50 to-rose-50 p-3 shadow-sm transition-all hover:border-amber-300 hover:shadow-md dark:border-amber-900/60 dark:from-amber-950/40 dark:via-orange-950/20 dark:to-rose-950/30",
        onPreview && "cursor-pointer",
        className,
      )}
      onClick={onPreview}
      role={onPreview ? "button" : undefined}
      tabIndex={onPreview ? 0 : undefined}
      onKeyDown={
        onPreview
          ? (event) => {
              if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                onPreview();
              }
            }
          : undefined
      }
    >
      <div className="pointer-events-none absolute -right-6 -top-6 h-20 w-20 rounded-full bg-amber-300/20 blur-2xl dark:bg-amber-500/10" />
      <div className="relative flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 text-white shadow-sm">
          <Gift className="h-5 w-5" aria-hidden="true" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="mb-1 flex flex-wrap items-center gap-1.5">
            <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/15 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-amber-800 dark:text-amber-200">
              <Sparkles className="h-3 w-3" aria-hidden="true" />
              {t("chat.referralBadge")}
            </span>
            {resource.rewardLabel ? (
              <span className="rounded-full bg-white/80 px-2 py-0.5 text-xs font-semibold text-orange-700 dark:bg-black/20 dark:text-orange-200">
                {resource.rewardLabel}
              </span>
            ) : null}
          </div>
          <p className="text-sm font-bold text-neutral-900 dark:text-neutral-50">
            {resource.title || t("chat.resourceUntitled")}
          </p>
          {resource.siteRebateLabel ? (
            <p className="mt-1 text-xs font-medium text-emerald-700 dark:text-emerald-300">
              {t("chat.referralSiteRebate")}: {resource.siteRebateLabel}
            </p>
          ) : null}
          {resource.snippet ? (
            <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-neutral-600 dark:text-neutral-300">
              {resource.snippet}
            </p>
          ) : null}
          <div className="mt-3 flex flex-wrap gap-2">
            {dealHref ? (
              <Link
                href={dealHref}
                onClick={(event) => event.stopPropagation()}
                className="inline-flex items-center gap-1 rounded-lg bg-neutral-900 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-neutral-800 dark:bg-white dark:text-neutral-900 dark:hover:bg-neutral-100"
              >
                {t("chat.referralViewGuide")}
              </Link>
            ) : null}
            {hasReferralLink ? (
              <button
                type="button"
                onClick={handleOpenReferral}
                className="inline-flex items-center gap-1 rounded-lg bg-gradient-to-r from-amber-500 to-orange-500 px-3 py-1.5 text-xs font-semibold text-white shadow-sm transition hover:from-amber-600 hover:to-orange-600"
              >
                <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
                {t("chat.referralOpenLink")}
              </button>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}

export function isReferralResource(item: MessageResource): boolean {
  if (item.type === "referral") {
    return true;
  }
  if (item.dealId) {
    return true;
  }
  return Boolean(item.url?.startsWith("/deals"));
}
