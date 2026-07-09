import type { ResearchMilestone } from "@/lib/types";
import type { ApiProjectMilestone } from "@/lib/api/research-api";
import { mapPhaseStatus, mapRiskLevel } from "./status-mapper";

export function mapApiMilestoneToUi(item: ApiProjectMilestone, order = 1): ResearchMilestone {
  return {
    id: String(item.milestoneId),
    phaseId: item.phaseId ? String(item.phaseId) : "",
    researchId: String(item.projectId),
    order,
    name: item.milestoneName,
    assignee: item.responsibleUserName ?? undefined,
    plannedStartDate: item.dueDate,
    plannedEndDate: item.dueDate,
    deadline: item.dueDate,
    actualStartDate: null,
    actualEndDate: item.completedAt ?? null,
    progress: item.milestoneStatus === "completed" ? 100 : 0,
    status: mapPhaseStatus(item.milestoneStatus),
    risk: mapRiskLevel(item.priorityLevel),
    hasIssue: item.priorityLevel === "high" || item.priorityLevel === "urgent",
    issueReason: item.notes ?? undefined,
    notes: item.notes ?? undefined,
  };
}
