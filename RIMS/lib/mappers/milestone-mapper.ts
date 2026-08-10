import type { ResearchMilestone } from "@/lib/types";
import type { ApiProjectMilestone } from "@/lib/api/research-api";
import { mapPhaseStatus, mapRiskLevel } from "./status-mapper";
import { normalizeDatePrecision } from "@/lib/date-utils";

export function mapApiMilestoneToUi(item: ApiProjectMilestone, order = 1): ResearchMilestone {
  return {
    id: String(item.milestoneId),
    phaseId: item.phaseId ? String(item.phaseId) : "",
    researchId: String(item.projectId),
    order,
    name: item.milestoneName,
    responsibleUserId: item.responsibleUserId ? String(item.responsibleUserId) : null,
    assignee: item.responsibleUserName ?? undefined,
    plannedStartDate: item.dueDate,
    plannedStartDatePrecision: normalizeDatePrecision(item.dueDatePrecision),
    plannedEndDate: item.dueDate,
    plannedEndDatePrecision: normalizeDatePrecision(item.dueDatePrecision),
    deadline: item.dueDate,
    deadlinePrecision: normalizeDatePrecision(item.dueDatePrecision),
    actualStartDate: null,
    actualStartDatePrecision: "DAY",
    actualEndDate: item.completedAt ?? null,
    actualEndDatePrecision: normalizeDatePrecision(item.completedAtPrecision),
    progress: item.milestoneStatus === "completed" ? 100 : 0,
    status: mapPhaseStatus(item.milestoneStatus),
    risk: mapRiskLevel(item.priorityLevel),
    hasIssue: item.priorityLevel === "high" || item.priorityLevel === "urgent",
    issueReason: item.notes ?? undefined,
    notes: item.notes ?? undefined,
  };
}
