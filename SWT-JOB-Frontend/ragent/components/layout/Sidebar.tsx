import * as React from "react";
import { differenceInCalendarDays, isValid } from "date-fns";
import {
  BookOpen,
  LogOut,
  MessageSquare,
  MoreHorizontal,
  Pencil,
  PlayCircle,
  Plus,
  Search,
  Trash2
} from "lucide-react";
import { useRouter } from "next/router";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle
} from "@/components/ui/alert-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { Loading } from "@/components/common/Loading";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/stores/authStore";
import { useChatStore } from "@/stores/chatStore";
import { useI18n } from "../../../src/context/I18nContext";

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  /** 为 true 时底部用户菜单由 SWT 顶栏承载 */
  hideUserMenu?: boolean;
}

export function Sidebar({ isOpen, onClose, hideUserMenu = false }: SidebarProps) {
  const { t, tWithParams } = useI18n();
  const {
    sessions,
    currentSessionId,
    isLoading,
    sessionsLoaded,
    createSession,
    deleteSession,
    renameSession,
    fetchSessions
  } = useChatStore();
  const router = useRouter();
  const { user, logout, isAuthenticated, openLoginDialog } = useAuthStore();
  const [query, setQuery] = React.useState("");
  const [renamingId, setRenamingId] = React.useState<string | null>(null);
  const [renameValue, setRenameValue] = React.useState("");
  const [deleteTarget, setDeleteTarget] = React.useState<{
    id: string;
    title: string;
  } | null>(null);
  const [avatarFailed, setAvatarFailed] = React.useState(false);
  const renameInputRef = React.useRef<HTMLInputElement | null>(null);

  React.useEffect(() => {
    if (!isAuthenticated) return;
    if (sessions.length === 0) {
      fetchSessions().catch(() => null);
    }
  }, [fetchSessions, sessions.length, isAuthenticated]);

  const filteredSessions = React.useMemo(() => {
    const keyword = query.trim().toLowerCase();
    if (!keyword) return sessions;
    return sessions.filter((session) => {
      const title = (session.title || t("chat.defaultSessionTitle")).toLowerCase();
      return title.includes(keyword) || session.id.toLowerCase().includes(keyword);
    });
  }, [query, sessions, t]);

  const groupedSessions = React.useMemo(() => {
    const now = new Date();
    const groups = new Map<string, typeof filteredSessions>();
    const order: string[] = [];

    const resolveLabel = (value?: string) => {
      const parsed = value ? new Date(value) : now;
      const date = isValid(parsed) ? parsed : now;
      const diff = Math.max(0, differenceInCalendarDays(now, date));
      if (diff === 0) return t("chat.today");
      if (diff <= 7) return t("chat.last7Days");
      if (diff <= 30) return t("chat.last30Days");
      return t("chat.older");
    };

    filteredSessions.forEach((session) => {
      const label = resolveLabel(session.lastTime);
      if (!groups.has(label)) {
        groups.set(label, []);
        order.push(label);
      }
      groups.get(label)?.push(session);
    });

    return order.map((label) => ({
      label,
      items: groups.get(label) || []
    }));
  }, [filteredSessions, t]);

  React.useEffect(() => {
    if (renamingId) {
      renameInputRef.current?.focus();
      renameInputRef.current?.select();
    }
  }, [renamingId]);

  React.useEffect(() => {
    setAvatarFailed(false);
  }, [user?.avatar, user?.userId]);

  const avatarUrl = user?.avatar?.trim();
  const showAvatar = Boolean(avatarUrl) && !avatarFailed;
  const avatarFallback = (user?.username || user?.userId || t("chat.userFallback")).slice(0, 1).toUpperCase();
  const sessionTitleFont =
    "-apple-system, BlinkMacSystemFont, \"Segoe UI\", Roboto, \"PingFang SC\", \"Hiragino Sans GB\", \"Microsoft YaHei\", \"Helvetica Neue\", Arial, sans-serif";

  const startRename = (id: string, title: string) => {
    setRenamingId(id);
    setRenameValue(title || t("chat.defaultSessionTitle"));
  };

  const cancelRename = () => {
    setRenamingId(null);
    setRenameValue("");
  };

  const commitRename = async () => {
    if (!renamingId) return;
    const nextTitle = renameValue.trim();
    if (!nextTitle) {
      cancelRename();
      return;
    }
    const currentTitle = sessions.find((session) => session.id === renamingId)?.title || t("chat.defaultSessionTitle");
    if (nextTitle === currentTitle) {
      cancelRename();
      return;
    }
    await renameSession(renamingId, nextTitle);
    cancelRename();
  };

  return (
    <>
      <div
        className={cn(
          "fixed inset-0 z-30 bg-slate-900/30 backdrop-blur-sm transition-opacity lg:hidden",
          isOpen ? "opacity-100" : "pointer-events-none opacity-0"
        )}
        onClick={onClose}
      />
      <aside
        className={cn(
          "fixed left-0 top-0 z-40 flex h-screen w-[280px] flex-shrink-0 flex-col border-r border-neutral-200 bg-neutral-50 p-3 transition-transform dark:border-neutral-800 dark:bg-neutral-950 lg:static lg:-ml-3 lg:h-full lg:min-h-0 lg:max-h-full lg:translate-x-0",
          isOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="py-3">
          <div className="flex gap-2">
            <div className="relative min-w-0 flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400 dark:text-neutral-500" />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder={t("chat.searchConversations")}
                className="h-10 w-full rounded-lg border border-neutral-200 bg-white pl-9 pr-3 text-sm text-neutral-900 placeholder:text-neutral-400 focus:border-indigo-400 focus:outline-none dark:border-neutral-700 dark:bg-neutral-950 dark:text-neutral-100 dark:placeholder:text-neutral-500"
              />
            </div>
            <button
              type="button"
              className="inline-flex h-10 shrink-0 items-center justify-center gap-1.5 rounded-lg border border-neutral-200 bg-white px-2.5 text-sm font-medium text-neutral-900 transition-colors hover:bg-neutral-100 dark:border-neutral-700 dark:bg-neutral-950 dark:text-neutral-100 dark:hover:bg-white/5"
              onClick={() => {
                void createSession().catch(() => null);
                void router.replace("/chat");
                onClose();
              }}
            >
              <Plus className="h-4 w-4 shrink-0" aria-hidden />
              <span className="whitespace-nowrap">{t("chat.newChat")}</span>
            </button>
          </div>
        </div>
        <div className="relative flex-1 min-h-0">
          <div className="h-full overflow-y-auto sidebar-scroll">
            {sessions.length === 0 && (!sessionsLoaded || isLoading) ? (
              <div
                className="flex h-full items-center justify-center text-neutral-500 dark:text-neutral-400"
                style={{ fontFamily: sessionTitleFont }}
              >
                <Loading label={t("chat.loadingSessions")} />
              </div>
            ) : filteredSessions.length === 0 ? (
              <div
                className="flex h-full flex-col items-center justify-center text-neutral-500 dark:text-neutral-400"
                style={{ fontFamily: sessionTitleFont }}
              >
                <MessageSquare className="h-16 w-16 opacity-80" />
                <p className="mt-2 text-[14px]">{t("chat.noSessions")}</p>
              </div>
            ) : (
              <div>
                {groupedSessions.map((group, index) => (
                  <div key={group.label} className={cn("flex flex-col", index === 0 ? "mt-0" : "mt-4")}>
                    <p className="mb-1.5 pl-3 text-[12px] font-normal leading-[18px] text-neutral-500 dark:text-neutral-500">
                      {group.label}
                    </p>
                    {group.items.map((session) => (
                      <div
                        key={session.id}
                        className={cn(
                          "group my-[1px] flex min-h-[40px] cursor-pointer items-center justify-between gap-2 rounded-lg px-3 py-2 text-[14px] leading-[22px] transition-colors duration-200",
                          currentSessionId === session.id
                            ? "bg-indigo-100 text-indigo-700 dark:bg-indigo-950/80 dark:text-indigo-300"
                            : "text-neutral-800 hover:bg-neutral-100 dark:text-neutral-200 dark:hover:bg-white/5"
                        )}
                        role="button"
                        tabIndex={0}
                        onClick={() => {
                          if (renamingId === session.id) return;
                          if (renamingId) {
                            cancelRename();
                          }
                          void router.push(`/chat/${session.id}`);
                          onClose();
                        }}
                        onKeyDown={(event) => {
                          if (event.key === "Enter") {
                            void router.push(`/chat/${session.id}`);
                            onClose();
                          }
                        }}
                      >
                        {renamingId === session.id ? (
                          <input
                            ref={renameInputRef}
                            value={renameValue}
                            onChange={(event) => setRenameValue(event.target.value)}
                            onClick={(event) => event.stopPropagation()}
                            onKeyDown={(event) => {
                              if (event.key === "Enter") {
                                event.preventDefault();
                                commitRename().catch(() => null);
                              }
                              if (event.key === "Escape") {
                                event.preventDefault();
                                cancelRename();
                              }
                            }}
                            onBlur={() => {
                              commitRename().catch(() => null);
                            }}
                            className="h-6 flex-1 rounded-md border border-neutral-200 bg-white px-2 text-[14px] leading-[22px] text-neutral-900 focus:border-indigo-500 focus:outline-none dark:border-neutral-600 dark:bg-neutral-950 dark:text-neutral-100"
                          />
                        ) : (
                          <span className="min-w-0 flex-1 truncate font-normal">
                            {session.title || t("chat.defaultSessionTitle")}
                          </span>
                        )}
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <button
                              type="button"
                              className={cn(
                                // 正方形操作钮（小圆角），内仍为横向三点
                                "inline-flex size-7 shrink-0 items-center justify-center rounded-md bg-transparent transition-opacity duration-150",
                                "text-[#666666] hover:bg-[rgba(0,0,0,0.06)] dark:text-neutral-400 dark:hover:bg-white/10",
                                currentSessionId === session.id
                                  ? "pointer-events-auto opacity-100 text-[#2563EB] dark:text-indigo-400"
                                  : "pointer-events-none opacity-0 group-hover:pointer-events-auto group-hover:opacity-100"
                              )}
                              onClick={(event) => event.stopPropagation()}
                              aria-label={t("chat.sessionActions")}
                            >
                              <MoreHorizontal
                                className="h-4 w-4 shrink-0 text-current"
                                strokeWidth={2}
                                aria-hidden
                              />
                            </button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent
                            align="start"
                            className="min-w-[120px] rounded-lg border-0 bg-white p-0 py-1 shadow-[0_4px_16px_rgba(0,0,0,0.12)]"
                          >
                            <DropdownMenuItem
                              onClick={(event) => {
                                event.stopPropagation();
                                startRename(session.id, session.title || t("chat.defaultSessionTitle"));
                              }}
                              className="px-4 py-2 text-[14px] text-[#333333] focus:bg-[#F5F5F5] focus:text-[#333333] data-[highlighted]:bg-[#F5F5F5] data-[highlighted]:text-[#333333]"
                            >
                              <Pencil className="mr-2 h-4 w-4" />
                              {t("chat.rename")}
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={(event) => {
                                event.stopPropagation();
                                setDeleteTarget({
                                  id: session.id,
                                  title: session.title || t("chat.defaultSessionTitle")
                                });
                              }}
                              className="px-4 py-2 text-[14px] text-[#FF4D4F] focus:bg-[#F5F5F5] focus:text-[#FF4D4F] data-[highlighted]:bg-[#F5F5F5] data-[highlighted]:text-[#FF4D4F]"
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              {t("chat.delete")}
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
        {hideUserMenu ? null : (
          <div className="mt-auto pt-3">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  type="button"
                  className="flex w-full items-center gap-2 rounded-lg p-2 text-left transition-colors hover:bg-neutral-100 data-[state=open]:bg-neutral-200/80 dark:hover:bg-white/5 dark:data-[state=open]:bg-white/10"
                  aria-label={t("chat.userMenu")}
                >
                  <div className="flex h-8 w-8 items-center justify-center overflow-hidden rounded-full bg-indigo-600 text-white dark:bg-indigo-500">
                    {showAvatar ? (
                      <img
                        src={avatarUrl}
                        alt={user?.username || user?.userId || t("chat.userFallback")}
                        className="h-full w-full object-cover"
                        onError={() => setAvatarFailed(true)}
                      />
                    ) : (
                      <span className="text-sm font-medium">{avatarFallback}</span>
                    )}
                  </div>
                  <span className="flex-1 truncate text-sm font-medium text-neutral-900 dark:text-neutral-100">
                    {(() => {
                      const fallback = user?.username || user?.userId || t("chat.userFallback");
                      return /^\d+$/.test(fallback) ? t("chat.userFallback") : fallback;
                    })()}
                  </span>
                  <MoreHorizontal className="h-4 w-4 text-neutral-500 dark:text-neutral-400" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" side="top" sideOffset={8} className="w-48">
                <DropdownMenuItem asChild>
                  <a
                    href="https://nageoffer.com/ragent"
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center"
                  >
                    <BookOpen className="mr-2 h-4 w-4" />
                    {t("chat.officialDocs")}
                  </a>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <a
                    href="https://space.bilibili.com/352177376"
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center"
                  >
                    <PlayCircle className="mr-2 h-4 w-4" />
                    哔哩哔哩
                  </a>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => logout()} className="text-rose-600 focus:text-rose-600">
                  <LogOut className="mr-2 h-4 w-4" />
                  {t("chat.logout")}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        )}
      </aside>
      <AlertDialog open={Boolean(deleteTarget)} onOpenChange={(open) => {
        if (!open) {
          setDeleteTarget(null);
        }
      }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("chat.deleteDialogTitle")}</AlertDialogTitle>
            <AlertDialogDescription>
              {tWithParams("chat.deleteDialogDescription", {
                title: deleteTarget?.title || t("chat.defaultSessionTitle")
              })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("common.cancel")}</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (!deleteTarget) return;
                const target = deleteTarget;
                const isCurrent = currentSessionId === target.id;
                setDeleteTarget(null);
                deleteSession(target.id)
                  .then(() => {
                    if (isCurrent) {
                      void router.push("/chat");
                    }
                  })
                  .catch(() => null);
              }}
            >
              {t("chat.delete")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
