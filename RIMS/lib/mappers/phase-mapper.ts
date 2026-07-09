import type { ResearchPhase } from "@/lib/types";
import type { ApiProjectPhase } from "@/lib/api/research-api";
import type { DashboardPhaseDto } from "@/lib/api/dashboard-api";
import { mapPhaseStatus } from "./status-mapper";

export function mapApiPhaseToUi(phase: ApiProjectPhase): ResearchPhase {
  return {
    id: String(phase.phaseId),
    researchId: String(phase.projectId),
    order: phase.sortOrder,
    name: phase.phaseName,
    description: phase.description ?? undefined,
    assignee: phase.responsibleUserName ?? undefined,
    plannedStartDate: phase.plannedStartDate ?? "",
    plannedEndDate: phase.plannedEndDate ?? "",
    deadline: phase.deadlineDate ?? phase.plannedEndDate ?? "",
    actualStartDate: phase.actualStartDate ?? null,
    actualEndDate: phase.actualEndDate ?? null,
    progress: Math.round(phase.progressPercent ?? 0),
    status: mapPhaseStatus(phase.phaseStatus),
    delayDays: 0,
    notes: phase.notes ?? undefined,
  };
}

export function mapDashboardPhaseToUi(phase: DashboardPhaseDto, projectId: string, order: number): ResearchPhase {
  return {
    id: String(phase.phaseId),
    researchId: projectId,
    order,
    name: phase.phaseName,
    plannedStartDate: phase.plannedStartDate ?? "",
    plannedEndDate: phase.plannedEndDate ?? "",
    deadline: phase.plannedEndDate ?? "",
    actualStartDate: phase.actualStartDate ?? null,
    actualEndDate: phase.actualEndDate ?? null,
    progress: Math.round(phase.progressPercent ?? 0),
    status: mapPhaseStatus(phase.phaseStatus),
    delayDays: 0,
  };
}
