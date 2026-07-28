"use client";

import { useEffect, useState, useCallback } from "react";
import { Bell, Check, ChevronRight } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { Notification } from "@/lib/types/notification";
import { notificationApi } from "@/lib/api/notification-api";
import { mapApiNotificationToUi } from "@/lib/mappers/notification-mapper";
import { cn } from "@/lib/utils";
import { toast } from "@/lib/toast";
import type { PageKey } from "@/components/layout/Sidebar";

interface NotificationDropdownProps {
  onViewAll?: () => void;
  onNavigate?: (page: PageKey) => void;
}

export function NotificationDropdown({ onViewAll, onNavigate }: NotificationDropdownProps = {}) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);
  const unreadCount = notifications.filter((n) => !n.read).length;
  const latestNotifications = notifications.slice(0, 5);

  const loadNotifications = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const result = await notificationApi.getNotifications({ pageSize: 5 });
      setNotifications(result.items.map(mapApiNotificationToUi));
    } catch {
      setError("Không tải được thông báo.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadNotifications();
  }, [loadNotifications]);

  const handleMarkAsRead = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setBusyId(id);
    try {
      await notificationApi.markRead(id);
      setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
    } catch { toast.error("Không thể đánh dấu thông báo đã đọc."); }
    finally { setBusyId(null); }
  };

  const handleMarkAllAsRead = async () => {
    setBusyId("all");
    try {
      await notificationApi.markAllRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
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
    if (!notification.read) {
      try {
        await notificationApi.markRead(notification.id);
        setNotifications((prev) => prev.map((item) => item.id === notification.id ? { ...item, read: true } : item));
      } catch { toast.error("Không thể đánh dấu thông báo đã đọc."); return; }
    }
    const destination = pageFromActionUrl(notification.actionUrl);
    if (destination) onNavigate?.(destination);
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "cao":
        return "bg-red-100 text-red-800";
      case "trung":
        return "bg-orange-100 text-orange-800";
      case "thap":
        return "bg-blue-100 text-blue-800";
      default:
        return "bg-slate-100 text-slate-800";
    }
  };

  const getTypeIcon = (type: string) => {
    const icons: Record<string, string> = {
      deadline: "⏰",
      approval: "✓",
      submission: "📤",
      update: "🔄",
      alert: "⚠️",
      info: "ℹ️",
    };
    return icons[type] || "📢";
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className="relative flex h-10 w-10 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-700 transition"
        title="Thông báo"
        aria-label="Thông báo"
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className={cn(
            "absolute right-0 top-0 flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-bold text-white",
            unreadCount > 9 ? "bg-red-500 text-[8px] px-0.5" : "bg-red-500"
          )}>
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </DropdownMenuTrigger>

      <DropdownMenuContent className="max-h-[min(600px,calc(100vh-5rem))] w-[calc(100vw-2rem)] overflow-x-hidden overflow-y-auto p-0 sm:w-96" align="end" sideOffset={8}>
        {/* Header */}
        <div className="sticky top-0 z-10 bg-white border-b border-slate-200 px-4 py-3 flex items-center justify-between">
          <div>
            <h3 className="font-bold text-slate-800 text-sm">Thông báo</h3>
            {unreadCount > 0 && (
              <p className="text-xs text-slate-500 mt-0.5">{unreadCount} thông báo chưa đọc</p>
            )}
          </div>
          {unreadCount > 0 && (
            <button
              onClick={() => void handleMarkAllAsRead()}
              disabled={busyId === "all"}
              className="text-xs text-blue-600 hover:text-blue-700 font-medium"
            >
              Đánh dấu tất cả
            </button>
          )}
        </div>

        {/* Notifications list */}
        <div className="divide-y divide-slate-200">
          {loading ? (
            <div className="px-4 py-8 text-center">
              <p className="text-sm text-slate-500">Đang tải thông báo...</p>
            </div>
          ) : error ? (
            <div className="px-4 py-6 text-center text-sm text-red-600">{error}<Button variant="outline" size="sm" className="ml-2" onClick={() => void loadNotifications()}>Thử lại</Button></div>
          ) : latestNotifications.length > 0 ? (
            latestNotifications.map((notif) => (
              <div
                key={notif.id}
                role="button"
                tabIndex={0}
                onClick={() => void handleNotificationClick(notif)}
                onKeyDown={(event) => { if (event.key === "Enter" || event.key === " ") void handleNotificationClick(notif); }}
                className={cn(
                  "px-4 py-3 hover:bg-slate-50 transition cursor-pointer",
                  !notif.read && "bg-blue-50"
                )}
              >
                <div className="flex gap-3 items-start">
                  <div className="text-lg flex-shrink-0">
                    {getTypeIcon(notif.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <h4 className="text-sm font-semibold text-slate-800 leading-tight">
                        {notif.title}
                      </h4>
                      {!notif.read && (
                        <button
                          onClick={(e) => handleMarkAsRead(notif.id, e)}
                          disabled={busyId === notif.id}
                          className="flex-shrink-0 text-blue-600 hover:text-blue-700"
                          title="Đánh dấu đã đọc"
                        >
                          <Check className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                    <p className="text-xs text-slate-600 mt-1 line-clamp-2">
                      {notif.content}
                    </p>
                    <div className="flex items-center gap-2 mt-2">
                      <Badge className={cn("text-[10px] px-1.5 py-0.5", getPriorityColor(notif.priority))}>
                        {notif.priority === "cao" ? "Cao" : notif.priority === "trung" ? "Trung" : "Thấp"}
                      </Badge>
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
              <p className="text-sm text-slate-500">Không có thông báo nào</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-white border-t border-slate-200 px-4 py-2">
          <button
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
  return date.toLocaleDateString("vi-VN");
}
