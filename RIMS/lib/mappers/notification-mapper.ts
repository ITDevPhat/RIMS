import type { Notification, NotificationPriority, NotificationType } from "@/lib/mock-notifications";
import type { ApiNotification } from "@/lib/api/notification-api";

function mapPriority(priority: string): NotificationPriority {
  if (priority === "high" || priority === "urgent") return "cao";
  if (priority === "medium") return "trung";
  return "thap";
}

function mapType(category: string, notificationType: string): NotificationType {
  if (category === "deadline") return notificationType.includes("overdue") ? "alert" : "deadline";
  if (category === "ethics") return "approval";
  if (category === "training") return "update";
  if (category === "system") return "info";
  return "info";
}

export function mapApiNotificationToUi(item: ApiNotification): Notification {
  return {
    id: String(item.notificationId),
    title: item.title,
    content: item.message,
    type: mapType(item.category, item.notificationType),
    priority: mapPriority(item.priorityLevel),
    timestamp: new Date(item.createdAt),
    read: item.isRead,
    relatedObjectId: item.relatedEntityId ? String(item.relatedEntityId) : undefined,
    relatedObjectType: item.relatedEntityType?.includes("training") ? "conference" : "project",
    suggestedActions: item.actionLabel ? [{ label: item.actionLabel, action: item.actionUrl ?? "" }] : undefined,
  };
}
