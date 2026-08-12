export type NotificationType = "deadline" | "approval" | "submission" | "update" | "alert" | "info";
export type NotificationPriority = "cao" | "trung" | "thap";

export interface Notification {
  id: string;
  title: string;
  content: string;
  type: NotificationType;
  priority: NotificationPriority;
  timestamp: Date;
  read: boolean;
  actionUrl?: string;
  relatedObjectId?: string;
  relatedObjectType?: "project" | "phase" | "milestone" | "deadline" | "conference" | "system";
  suggestedActions?: Array<{ label: string; action: string }>;
}
