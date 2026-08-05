import * as React from "react";
import Link from "next/link";
import { ExternalLink, Gift } from "lucide-react";

import { cn } from "@/lib/utils";
import { openExternalUrl } from "../../../src/lib/openExternalUrl";
import { useI18n } from "../../../src/context/I18nContext";

type ReferralMarkdownLinkProps = React.ComponentPropsWithoutRef<"a"> & {
  href?: string;
};

function isDealsPath(href?: string): boolean {
  return Boolean(href && href.startsWith("/deals"));
}

function looksLikeReferralExternal(href?: string): boolean {
  if (!href || href.startsWith("/") || href.startsWith("#")) {
    return false;
  }
  const lower = href.toLowerCase();
  return (
    lower.includes("refer") ||
    lower.includes("invite") ||
    lower.includes("signup") ||
    lower.includes("moomoo.com") ||
    lower.includes("kalshi.com") ||
    lower.includes("revolut.com") ||
    lower.includes("chime.com") ||
    lower.includes("rakuten.com") ||
    lower.includes("sayweee.com") ||
    lower.includes("utest.com") ||
    lower.includes("remitly.com") ||
    lower.includes("wise.com") ||
    lower.includes("lemfi.com") ||
    lower.includes("instarem.com") ||
    lower.includes("wirebarley.com") ||
    lower.includes("westernunion.com")
  );
}

export function ReferralMarkdownLink({ href, children, className, ...props }: ReferralMarkdownLinkProps) {
  const { t } = useI18n();

  if (isDealsPath(href)) {
    return (
      <Link
        href={href!}
        className={cn(
          "my-1 inline-flex items-center gap-1.5 rounded-full border border-amber-300/80 bg-gradient-to-r from-amber-50 to-orange-50 px-3 py-1 text-sm font-semibold text-amber-900 no-underline shadow-sm transition hover:border-amber-400 hover:from-amber-100 hover:to-orange-100 dark:border-amber-800 dark:from-amber-950/50 dark:to-orange-950/40 dark:text-amber-100",
          className,
        )}
        {...props}
      >
        <Gift className="h-3.5 w-3.5 shrink-0 text-amber-600 dark:text-amber-300" aria-hidden="true" />
        <span>{children}</span>
      </Link>
    );
  }

  if (looksLikeReferralExternal(href)) {
    return (
      <a
        href={href}
        onClick={(event) => {
          event.preventDefault();
          if (href) {
            openExternalUrl(href);
          }
        }}
        className={cn(
          "my-1 inline-flex items-center gap-1.5 rounded-full border border-orange-300/90 bg-gradient-to-r from-orange-500 to-amber-500 px-3 py-1 text-sm font-semibold text-white no-underline shadow-sm transition hover:from-orange-600 hover:to-amber-600",
          className,
        )}
        target="_blank"
        rel="noreferrer"
        {...props}
      >
        <ExternalLink className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
        <span>{children || t("chat.referralOpenLink")}</span>
      </a>
    );
  }

  return (
    <a
      className={cn("text-[#0969da] underline-offset-4 hover:underline dark:text-[#58a6ff]", className)}
      target="_blank"
      rel="noreferrer"
      href={href}
      {...props}
    >
      {children}
    </a>
  );
}
