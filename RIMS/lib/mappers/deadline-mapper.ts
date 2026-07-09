import type { DeadlineItem } from "@/lib/types";
import type { ApiProjectDeadline } from "@/lib/api/research-api";
import type { DashboardDeadlineDto } from "@/lib/api/dashboard-api";
import { mapPhaseStatus, mapPriority } from "./status-mapper";

export function mapApiDeadlineToUi(item: ApiProjectDeadline | DashboardDeadlineDto): DeadlineItem {
  const projectId = item.projectId;
  const status = "deadlineStatus" in item ? item.deadlineStatus : "open";
  return {
    id: String(item.deadlineId),
    researchId: projectId ? String(projectId) : "",
    researchCode: item.projectCode ?? "",
    researchName: item.projectTitle ?? "",
    type: item.deadlineType || item.title,
    dueDate: item.dueDate,
    daysRemaining: item.daysRemaining,
    assignee: item.responsibleUserName ?? "Chưa phân công",
    status: item.isOverdue ? "Quá hạn" : mapPhaseStatus(status),
    priority: mapPriority(item.priorityLevel),
  };
}
