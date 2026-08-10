import type { ResearchPhase } from "@/lib/types";
import type { ApiProjectPhase } from "@/lib/api/research-api";
import type { DashboardPhaseDto } from "@/lib/api/dashboard-api";
import { mapPhaseStatus } from "./status-mapper";
import { normalizeDatePrecision } from "@/lib/date-utils";

export function mapApiPhaseToUi(phase: ApiProjectPhase): ResearchPhase {
  return {
    id: String(phase.phaseId),
    researchId: String(phase.projectId),
    order: phase.sortOrder,
    name: phase.phaseName,
    description: phase.description ?? undefined,
    responsibleUserId: phase.responsibleUserId ? String(phase.responsibleUserId) : null,
    assignee: phase.responsibleUserName ?? undefined,
    plannedStartDate: phase.plannedStartDate ?? "",
    plannedStartDatePrecision: normalizeDatePrecision(phase.plannedStartDatePrecision),
    plannedEndDate: phase.plannedEndDate ?? "",
    plannedEndDatePrecision: normalizeDatePrecision(phase.plannedEndDatePrecision),
    deadline: phase.deadlineDate ?? phase.plannedEndDate ?? "",
    deadlinePrecision: normalizeDatePrecision(phase.deadlineDatePrecision ?? phase.plannedEndDatePrecision),
    actualStartDate: phase.actualStartDate ?? null,
    actualStartDatePrecision: normalizeDatePrecision(phase.actualStartDatePrecision),
    actualEndDate: phase.actualEndDate ?? null,
    actualEndDatePrecision: normalizeDatePrecision(phase.actualEndDatePrecision),
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
    plannedStartDatePrecision: normalizeDatePrecision(phase.plannedStartDatePrecision),
    plannedEndDate: phase.plannedEndDate ?? "",
    plannedEndDatePrecision: normalizeDatePrecision(phase.plannedEndDatePrecision),
    deadline: phase.plannedEndDate ?? "",
    deadlinePrecision: normalizeDatePrecision(phase.plannedEndDatePrecision),
    actualStartDate: phase.actualStartDate ?? null,
    actualStartDatePrecision: normalizeDatePrecision(phase.actualStartDatePrecision),
    actualEndDate: phase.actualEndDate ?? null,
    actualEndDatePrecision: normalizeDatePrecision(phase.actualEndDatePrecision),
    progress: Math.round(phase.progressPercent ?? 0),
    status: mapPhaseStatus(phase.phaseStatus),
    delayDays: 0,
  };
}
