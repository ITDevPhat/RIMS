import { apiClient, type PagedResult, type QueryParams } from "./api-client";

export interface ApiNotification {
  notificationId: number;
  title: string;
  message: string;
  notificationType: string;
  category: string;
  priorityLevel: string;
  relatedEntityType?: string | null;
  relatedEntityId?: number | null;
  relatedEntityCode?: string | null;
  relatedEntityName?: string | null;
  createdAt: string;
  isRead: boolean;
  readAt?: string | null;
  actionUrl?: string | null;
  actionLabel?: string | null;
}

export interface ApiNotificationRule {
  ruleId: number;
  ruleName: string;
  targetType: string;
  conditionType: string;
  remindBeforeDays: number;
  channels: string[];
  priorityLevel: string;
  isActive: boolean;
  description?: string | null;
}

export interface ApiNotificationSettings {
  enableSystemNotification: boolean;
  enableEmailNotification: boolean;
  enableInAppNotification: boolean;
  deadlineReminderDays: number[];
  trainingEventReminderDays: number[];
  ethicsReminderDays: number[];
  projectEndingReminderDays: number[];
  progressReportReminderDays: number[];
  overdueRepeatEnabled: boolean;
  overdueRepeatDays: number;
  autoMarkResolvedWhenCompleted: boolean;
  scannerRunHour: number;
}

export const notificationApi = {
  getNotifications: (filters?: QueryParams) => apiClient.get<PagedResult<ApiNotification>>("/notifications", filters),
  getUnreadCount: () => apiClient.get<{ count: number }>("/notifications/unread-count"),
  getNotification: (id: string | number) => apiClient.get<ApiNotification>(`/notifications/${id}`),
  markRead: (id: string | number) => apiClient.put<null>(`/notifications/${id}/read`),
  markUnread: (id: string | number) => apiClient.put<null>(`/notifications/${id}/unread`),
  markAllRead: () => apiClient.put<null>("/notifications/read-all"),
  deleteNotification: (id: string | number) => apiClient.delete<null>(`/notifications/${id}`),
  getNotificationRules: (filters?: QueryParams) => apiClient.get<PagedResult<ApiNotificationRule>>("/notification-rules", filters),
  createNotificationRule: (payload: unknown) => apiClient.post<ApiNotificationRule>("/notification-rules", payload),
  updateNotificationRule: (id: string | number, payload: unknown) => apiClient.put<ApiNotificationRule>(`/notification-rules/${id}`, payload),
  deleteNotificationRule: (id: string | number) => apiClient.delete<null>(`/notification-rules/${id}`),
  enableRule: (id: string | number) => apiClient.put<ApiNotificationRule>(`/notification-rules/${id}/enable`),
  disableRule: (id: string | number) => apiClient.put<ApiNotificationRule>(`/notification-rules/${id}/disable`),
  getNotificationSettings: () => apiClient.get<ApiNotificationSettings>("/notification-settings"),
  updateNotificationSettings: (payload: ApiNotificationSettings) => apiClient.put<ApiNotificationSettings>("/notification-settings", payload),
  runNotificationScan: () => apiClient.post<unknown>("/jobs/notification-scan"),
};
