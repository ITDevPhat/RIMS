import type { Notification, NotificationPriority, NotificationType } from "@/lib/types/notification";
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
  const entityType = (item.relatedEntityType ?? "").toLowerCase();
  const relatedObjectType: Notification["relatedObjectType"] = entityType.includes("training") || entityType.includes("conference")
    ? "conference" : entityType.includes("milestone") ? "milestone" : entityType.includes("deadline")
      ? "deadline" : entityType.includes("phase") ? "phase" : entityType.includes("project") || entityType.includes("research")
        ? "project" : "system";
  return {
    id: String(item.notificationId),
    title: item.title,
    content: item.message,
    type: mapType(item.category, item.notificationType),
    priority: mapPriority(item.priorityLevel),
    timestamp: new Date(item.createdAt),
    read: item.isRead,
    actionUrl: item.actionUrl ?? undefined,
    relatedObjectId: item.relatedEntityId ? String(item.relatedEntityId) : undefined,
    relatedObjectType,
    suggestedActions: item.actionLabel ? [{ label: item.actionLabel, action: item.actionUrl ?? "" }] : undefined,
  };
}
