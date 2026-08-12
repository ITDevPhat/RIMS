"use client";

import { useEffect, useState, useCallback } from "react";
import { Bell, CalendarClock, CheckCircle2, ChevronRight, Clock, Info, Layers, RefreshCw, Target, TriangleAlert, Upload } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import type { Notification } from "@/lib/types/notification";
import { notificationApi } from "@/lib/api/notification-api";
import { mapApiNotificationToUi } from "@/lib/mappers/notification-mapper";
import { cn } from "@/lib/utils";
import { toast } from "@/lib/toast";
import { formatDateVN } from "@/lib/date-utils";
import type { PageKey } from "@/components/layout/Sidebar";
import { useAuth } from "@/lib/auth-context";

interface NotificationDropdownProps {
  onViewAll?: () => void;
  onNavigate?: (page: PageKey) => void;
}

export function NotificationDropdown({ onViewAll, onNavigate }: NotificationDropdownProps = {}) {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const [hasLoadedList, setHasLoadedList] = useState(false);

  const loadNotifications = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const result = await notificationApi.getNotifications({ pageSize: 5 });
      setNotifications(result.items.map(mapApiNotificationToUi));
      setHasLoadedList(true);
    } catch {
      setError("Không tải được thông báo.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { notificationApi.getUnreadCount().then(result => setUnreadCount(result.count)).catch(() => setUnreadCount(0)); }, []);

  const handleOpenChange = (value: boolean) => {
    setOpen(value);
    if (value && !hasLoadedList && !loading) void loadNotifications();
  };

  const handleMarkAsRead = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setBusyId(id);
    try {
      await notificationApi.markRead(id);
      setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
      setUnreadCount(count => Math.max(0, count - 1));
    } catch { toast.error("Không thể đánh dấu thông báo đã đọc."); }
    finally { setBusyId(null); }
  };

  const handleMarkAllAsRead = async () => {
    setBusyId("all");
    try {
      await notificationApi.markAllRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      setUnreadCount(0);
    } catch { toast.error("Không thể đánh dấu tất cả đã đọc."); }
    finally { setBusyId(null); }
  };

  const pageFromActionUrl = (url?: string): PageKey | null => {
    if (!url) return null;
    if (/notification|thong-bao/i.test(url)) return "thong-bao";
    if (/training|dao-tao/i.test(url)) return "mang-dao-tao";
    if (/deadline|han-chot/i.test(url)) return "han-chot";
    if (/milestone|moc-tien-do/i.test(url)) return "moc-tien-do";
    if (/phase|giai-doan/i.test(url)) return "giai-doan";
    if (/project|research|de-tai/i.test(url)) return "de-tai";
    return null;
  };

  const handleNotificationClick = async (notification: Notification) => {
    if (!notification.read && user?.autoMarkReadOnOpen) {
      try {
        await notificationApi.markRead(notification.id);
        setNotifications((prev) => prev.map((item) => item.id === notification.id ? { ...item, read: true } : item));
        setUnreadCount(count => Math.max(0, count - 1));
      } catch { toast.error("Không thể đánh dấu thông báo đã đọc."); return; }
    }
    const entityDestinations: Partial<Record<NonNullable<Notification["relatedObjectType"]>, PageKey>> = { project: "de-tai", phase: "giai-doan", milestone: "moc-tien-do", deadline: "han-chot", conference: "mang-dao-tao", system: "thong-bao" };
    const destination = notification.relatedObjectType ? entityDestinations[notification.relatedObjectType] : pageFromActionUrl(notification.actionUrl);
    if (destination) {
      onNavigate?.(destination);
      window.dispatchEvent(new CustomEvent("rms:open-related-entity", { detail: { type: notification.relatedObjectType, id: notification.relatedObjectId, actionUrl: notification.actionUrl } }));
      setOpen(false);
    }
  };

  const getTypeIcon = (notification: Notification) => {
    const Icon = notification.relatedObjectType === "deadline" ? CalendarClock : notification.relatedObjectType === "milestone" ? Target : notification.relatedObjectType === "phase" ? Layers : notification.type === "alert" ? TriangleAlert : notification.type === "submission" ? Upload : notification.type === "approval" ? CheckCircle2 : notification.type === "update" ? RefreshCw : notification.type === "deadline" ? Clock : Info;
    return <Icon className="h-4 w-4" />;
  };

  return (
    <DropdownMenu open={open} onOpenChange={handleOpenChange}>
      <DropdownMenuTrigger
        className="relative flex h-10 w-10 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-700 transition"
        title="Thông báo"
        aria-label={`Thông báo${unreadCount ? `, ${unreadCount} thông báo chưa đọc` : ""}`}
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className={cn(
            "absolute right-0 top-0 flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-bold text-white",
            "min-w-5 bg-red-500 px-1"
          )}>
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </DropdownMenuTrigger>

      <DropdownMenuContent className="max-h-[min(600px,calc(100vh-5rem))] w-[calc(100vw-2rem)] overflow-x-hidden overflow-y-auto p-0 sm:w-96" align="end" sideOffset={8}>
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-200 bg-white px-4 py-3 dark:border-slate-800 dark:bg-slate-950">
          <div>
            <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100">Thông báo</h3>
            {unreadCount > 0 && (
              <p className="text-xs text-slate-500 mt-0.5">{unreadCount} thông báo chưa đọc</p>
            )}
          </div>
          {unreadCount > 0 && (
            <button type="button"
              onClick={() => void handleMarkAllAsRead()}
              disabled={busyId === "all"}
              className="text-xs text-blue-600 hover:text-blue-700 font-medium"
            >
              Đánh dấu tất cả đã đọc
            </button>
          )}
        </div>

        {/* Notifications list */}
        <div className="divide-y divide-slate-200 dark:divide-slate-800">
          {loading ? (
            <div className="px-4 py-8 text-center">
              <p className="text-sm text-slate-500">Đang tải thông báo...</p>
            </div>
          ) : error ? (
            <div className="px-4 py-6 text-center text-sm text-red-600">{error}<Button variant="outline" size="sm" className="ml-2" onClick={() => void loadNotifications()}>Thử lại</Button></div>
          ) : notifications.length > 0 ? (
            notifications.map((notif) => (
              <div
                key={notif.id}
                role="button"
                tabIndex={0}
                onClick={() => void handleNotificationClick(notif)}
                onKeyDown={(event) => { if (event.key === "Enter" || event.key === " ") void handleNotificationClick(notif); }}
                className={cn(
                  "cursor-pointer px-4 py-3 transition hover:bg-slate-50 dark:hover:bg-slate-900",
                  !notif.read && "bg-blue-50 dark:bg-blue-950/30"
                )}
              >
                <div className="flex gap-3 items-start">
                  <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                    {getTypeIcon(notif)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <h4 className="text-sm font-semibold text-slate-800 leading-tight dark:text-slate-100">
                        {notif.title}
                      </h4>
                      {!notif.read && (
                        <button type="button"
                          onClick={(e) => handleMarkAsRead(notif.id, e)}
                          disabled={busyId === notif.id}
                          className="mt-1 h-2.5 w-2.5 flex-shrink-0 rounded-full bg-blue-600"
                          title="Đánh dấu đã đọc"
                        >
                        </button>
                      )}
                    </div>
                    <p className="mt-1 line-clamp-2 text-xs text-slate-600 dark:text-slate-300">
                      {notif.content}
                    </p>
                    <div className="flex items-center gap-2 mt-2">
                      {notif.priority === "cao" && <span className="rounded bg-red-100 px-1.5 py-0.5 text-[10px] font-semibold text-red-700 dark:bg-red-950 dark:text-red-300">Cao</span>}
                      <span className="text-[10px] text-slate-400">
                        {formatTime(notif.timestamp)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="px-4 py-8 text-center">
              <p className="text-sm text-slate-500 dark:text-slate-400">Không có thông báo mới.</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 border-t border-slate-200 bg-white px-4 py-2 dark:border-slate-800 dark:bg-slate-950">
          <button type="button"
            onClick={onViewAll}
            className="w-full flex items-center justify-center gap-2 h-8 text-xs font-medium text-blue-600 hover:bg-slate-50 rounded transition"
          >
            Xem tất cả thông báo
            <ChevronRight className="h-3 w-3" />
          </button>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function formatTime(date: Date): string {
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 60) return `${minutes}p trước`;
  if (hours < 24) return `${hours}g trước`;
  if (days < 7) return `${days}n trước`;
  return formatDateVN(date);
}
