"use client";

import { useEffect, useState, useCallback } from "react";
import { Check, X, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { Notification } from "@/lib/mock-notifications";
import { notificationApi } from "@/lib/api/notification-api";
import { mapApiNotificationToUi } from "@/lib/mappers/notification-mapper";
import { cn } from "@/lib/utils";

type FilterStatus = "all" | "unread" | "read";

export default function TrungTamThongBao() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [filterStatus, setFilterStatus] = useState<FilterStatus>("all");
  const [selectedNotification, setSelectedNotification] = useState<Notification | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadNotifications = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const result = await notificationApi.getNotifications({
        pageSize: 100,
        isRead: filterStatus === "all" ? undefined : filterStatus === "read",
      });
      setNotifications(result.items.map(mapApiNotificationToUi));
    } catch {
      setError("Không tải được thông báo từ API.");
      setNotifications([]);
    } finally {
      setLoading(false);
    }
  }, [filterStatus]);

  useEffect(() => {
    void loadNotifications();
  }, [loadNotifications]);

  const filteredNotifications = notifications.filter((n) => {
    if (filterStatus === "unread") return !n.read;
    if (filterStatus === "read") return n.read;
    return true;
  });

  const handleMarkAsRead = async (id: string) => {
    await notificationApi.markRead(id);
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
  };

  const handleDelete = async (id: string) => {
    await notificationApi.deleteNotification(id);
    setNotifications((prev) => prev.filter((n) => n.id !== id));
    setSelectedNotification(null);
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

  const getPriorityLabel = (priority: string) => {
    switch (priority) {
      case "cao":
        return "Cao";
      case "trung":
        return "Trung";
      case "thap":
        return "Thấp";
      default:
        return "Bình thường";
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
    <div className="min-h-screen bg-slate-50">
      {/* Page Header */}
      <div className="border-b border-slate-200 bg-white px-8 py-6">
        <h1 className="text-2xl font-bold text-slate-800">Trung Tâm Thông Báo</h1>
        <p className="mt-2 text-sm text-slate-600">Quản lý và theo dõi các thông báo hệ thống</p>
      </div>

      <div className="flex gap-6 px-8 py-6 max-w-6xl mx-auto">
        {/* Sidebar Filters */}
        <div className="w-48 flex-shrink-0">
          <div className="rounded-lg border border-slate-200 bg-white p-4 space-y-2 sticky top-20">
            <div className="flex items-center gap-2 px-2 py-2 text-sm font-semibold text-slate-700">
              <Filter className="h-4 w-4" />
              Bộ Lọc
            </div>
            {[
              { label: "Tất cả", value: "all" },
              { label: "Chưa đọc", value: "unread" },
              { label: "Đã đọc", value: "read" },
            ].map((filter) => (
              <button
                key={filter.value}
                onClick={() => setFilterStatus(filter.value as FilterStatus)}
                className={cn(
                  "w-full text-left px-3 py-2 rounded-lg transition-colors text-sm",
                  filterStatus === filter.value
                    ? "bg-blue-600 text-white font-medium"
                    : "text-slate-700 hover:bg-slate-100"
                )}
              >
                {filter.label}
              </button>
            ))}
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1">
          {loading ? (
            <div className="rounded-lg border border-slate-200 bg-white p-8 text-center text-sm text-slate-500">
              Đang tải thông báo...
            </div>
          ) : error ? (
            <div className="rounded-lg border border-red-200 bg-red-50 p-6 text-sm font-medium text-red-700">
              {error}
              <Button size="sm" variant="outline" className="ml-3" onClick={() => void loadNotifications()}>Thử lại</Button>
            </div>
          ) : selectedNotification ? (
            // Detail View
            <div className="rounded-lg border border-slate-200 bg-white p-6">
              <div className="flex items-start justify-between mb-6">
                <div className="flex items-start gap-4">
                  <span className="text-4xl">{getTypeIcon(selectedNotification.type)}</span>
                  <div>
                    <h2 className="text-xl font-bold text-slate-800">{selectedNotification.title}</h2>
                    <p className="text-sm text-slate-500 mt-1">
                      {selectedNotification.timestamp.toLocaleDateString("vi-VN")} lúc{" "}
                      {selectedNotification.timestamp.toLocaleTimeString("vi-VN")}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedNotification(null)}
                  className="text-slate-400 hover:text-slate-600"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-6">
                <div>
                  <span className="text-xs font-semibold text-slate-700">Độ Ưu Tiên</span>
                  <Badge className={cn("mt-1 text-xs", getPriorityColor(selectedNotification.priority))}>
                    {getPriorityLabel(selectedNotification.priority)}
                  </Badge>
                </div>
                <div>
                  <span className="text-xs font-semibold text-slate-700">Trạng Thái</span>
                  <Badge className={cn("mt-1 text-xs", selectedNotification.read ? "bg-slate-100 text-slate-800" : "bg-blue-100 text-blue-800")}>
                    {selectedNotification.read ? "Đã đọc" : "Chưa đọc"}
                  </Badge>
                </div>
              </div>

              <div className="mb-6 pb-6 border-b border-slate-200">
                <p className="text-sm text-slate-700 leading-relaxed">{selectedNotification.content}</p>
              </div>

              <div className="flex gap-3">
                {!selectedNotification.read && (
                  <Button
                    variant="outline"
                    onClick={() => void handleMarkAsRead(selectedNotification.id)}
                    className="gap-2"
                  >
                    <Check className="h-4 w-4" />
                    Đánh Dấu Đã Đọc
                  </Button>
                )}
                <Button
                  variant="outline"
                  onClick={() => void handleDelete(selectedNotification.id)}
                  className="gap-2 text-red-600 hover:bg-red-50"
                >
                  <X className="h-4 w-4" />
                  Xóa
                </Button>
              </div>
            </div>
          ) : (
            // List View
            <div className="space-y-3">
              {filteredNotifications.length > 0 ? (
                filteredNotifications.map((notif) => (
                  <div
                    key={notif.id}
                    onClick={() => setSelectedNotification(notif)}
                    className={cn(
                      "p-4 rounded-lg border cursor-pointer transition-colors",
                      notif.read
                        ? "border-slate-200 bg-white hover:bg-slate-50"
                        : "border-blue-200 bg-blue-50 hover:bg-blue-100"
                    )}
                  >
                    <div className="flex gap-4 items-start">
                      <span className="text-2xl flex-shrink-0">{getTypeIcon(notif.type)}</span>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-slate-800">{notif.title}</h3>
                        <p className="text-sm text-slate-600 mt-1 line-clamp-2">{notif.content}</p>
                        <div className="flex items-center gap-2 mt-3">
                          <Badge className={cn("text-xs", getPriorityColor(notif.priority))}>
                            {getPriorityLabel(notif.priority)}
                          </Badge>
                          <span className="text-xs text-slate-400">
                            {notif.timestamp.toLocaleDateString("vi-VN")}
                          </span>
                        </div>
                      </div>
                      {!notif.read && (
                        <div className="flex-shrink-0 h-2 w-2 rounded-full bg-blue-600 mt-1" />
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <div className="rounded-lg border border-slate-200 bg-white p-8 text-center">
                  <p className="text-slate-500 text-sm">Không có thông báo nào</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
