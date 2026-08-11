import type { ResearchProject } from "@/lib/types";
import type { ApiResearchProject } from "@/lib/api/research-api";
import type { DashboardGanttProjectDto } from "@/lib/api/dashboard-api";
import { mapEthicsStatus, mapHealthStatus, mapProjectStatus } from "./status-mapper";
import { normalizeDatePrecision } from "@/lib/date-utils";

export function mapApiProjectToUi(project: ApiResearchProject): ResearchProject {
  return {
    id: String(project.projectId),
    code: project.projectCode,
    name: project.projectTitle,
    description: project.description ?? "",
    departmentId: project.departmentId ?? null,
    department: project.departmentName ?? "Chưa phân khoa",
    principalInvestigatorId: project.principalInvestigatorId ?? null,
    pi: project.principalInvestigatorName ?? "Chưa phân công",
    sponsorId: project.sponsorId ?? null,
    sponsor: project.sponsorName ?? "Chưa có",
    researchType: project.researchType ?? "Khác",
    protocolNumber: project.protocolNumber ?? "",
    protocolVersion: project.protocolVersion ?? "",
    ethicsStatus: mapEthicsStatus(project.ethicsStatus, project.ethicsExpiryDate),
    ethicsExpiry: project.ethicsExpiryDate ?? null,
    startDate: project.plannedStartDate ?? "",
    startDatePrecision: normalizeDatePrecision(project.plannedStartDatePrecision),
    plannedEndDate: project.plannedEndDate ?? "",
    plannedEndDatePrecision: normalizeDatePrecision(project.plannedEndDatePrecision),
    actualStartDate: project.actualStartDate ?? null,
    actualStartDatePrecision: normalizeDatePrecision(project.actualStartDatePrecision),
    actualEndDate: project.actualEndDate ?? null,
    actualEndDatePrecision: normalizeDatePrecision(project.actualEndDatePrecision),
    progress: Math.round(project.progressPercent ?? 0),
    status: mapProjectStatus(project.projectStatus),
    health: mapHealthStatus(project.riskLevel),
    currentPhase: project.currentPhaseName ?? "Chưa bắt đầu",
    nearestDeadline: project.nearestDeadlineDate ?? null,
    nearestDeadlinePrecision: normalizeDatePrecision(project.nearestDeadlineDatePrecision),
    notes: project.notes ?? null,
  };
}

export function mapGanttProjectToUi(project: DashboardGanttProjectDto): ResearchProject {
  return {
    id: String(project.projectId),
    code: project.projectCode,
    name: project.projectTitle,
    description: "",
    departmentId: null,
    department: project.departmentName ?? "Chưa phân khoa",
    principalInvestigatorId: null,
    pi: project.principalInvestigatorName ?? "Chưa phân công",
    sponsorId: null,
    sponsor: project.sponsorName ?? "Chưa có",
    researchType: "",
    protocolNumber: "",
    protocolVersion: "",
    ethicsStatus: "Không yêu cầu",
    ethicsExpiry: null,
    startDate: project.phases[0]?.plannedStartDate ?? "",
    startDatePrecision: normalizeDatePrecision(project.phases[0]?.plannedStartDatePrecision),
    plannedEndDate: project.phases.at(-1)?.plannedEndDate ?? "",
    plannedEndDatePrecision: normalizeDatePrecision(project.phases.at(-1)?.plannedEndDatePrecision),
    actualStartDate: project.phases[0]?.actualStartDate ?? null,
    actualStartDatePrecision: normalizeDatePrecision(project.phases[0]?.actualStartDatePrecision),
    actualEndDate: project.phases.at(-1)?.actualEndDate ?? null,
    actualEndDatePrecision: normalizeDatePrecision(project.phases.at(-1)?.actualEndDatePrecision),
    progress: Math.round(project.progressPercent ?? 0),
    status: "Đang thực hiện",
    health: mapHealthStatus(project.healthStatus),
    currentPhase: project.phases.find((p) => p.phaseStatus === "in_progress")?.phaseName ?? project.phases[0]?.phaseName ?? "Chưa bắt đầu",
    nearestDeadline: project.phases.find((p) => p.plannedEndDate)?.plannedEndDate ?? null,
    nearestDeadlinePrecision: normalizeDatePrecision(project.phases.find((p) => p.plannedEndDate)?.plannedEndDatePrecision),
    notes: null,
  };
}
