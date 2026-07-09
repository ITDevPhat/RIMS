import type { ResearchProject } from "@/lib/types";
import type { ApiResearchProject } from "@/lib/api/research-api";
import type { DashboardGanttProjectDto } from "@/lib/api/dashboard-api";
import { mapEthicsStatus, mapHealthStatus, mapProjectStatus } from "./status-mapper";

export function mapApiProjectToUi(project: ApiResearchProject): ResearchProject {
  return {
    id: String(project.projectId),
    code: project.projectCode,
    name: project.projectTitle,
    description: project.description ?? "",
    department: project.departmentName ?? "Chưa phân khoa",
    pi: project.principalInvestigatorName ?? "Chưa phân công",
    sponsor: project.sponsorName ?? "Chưa có",
    researchType: project.researchType ?? "Khác",
    protocolNumber: project.protocolNumber ?? "",
    protocolVersion: project.protocolVersion ?? "",
    ethicsStatus: mapEthicsStatus(project.ethicsStatus, project.ethicsExpiryDate),
    ethicsExpiry: project.ethicsExpiryDate ?? null,
    startDate: project.plannedStartDate ?? "",
    plannedEndDate: project.plannedEndDate ?? "",
    progress: Math.round(project.progressPercent ?? 0),
    status: mapProjectStatus(project.projectStatus),
    health: mapHealthStatus(project.riskLevel),
    currentPhase: project.currentPhaseName ?? "Chưa bắt đầu",
    nearestDeadline: project.nearestDeadlineDate ?? null,
  };
}

export function mapGanttProjectToUi(project: DashboardGanttProjectDto): ResearchProject {
  return {
    id: String(project.projectId),
    code: project.projectCode,
    name: project.projectTitle,
    description: "",
    department: project.departmentName ?? "Chưa phân khoa",
    pi: project.principalInvestigatorName ?? "Chưa phân công",
    sponsor: project.sponsorName ?? "Chưa có",
    researchType: "",
    protocolNumber: "",
    protocolVersion: "",
    ethicsStatus: "Không yêu cầu",
    ethicsExpiry: null,
    startDate: project.phases[0]?.plannedStartDate ?? "",
    plannedEndDate: project.phases.at(-1)?.plannedEndDate ?? "",
    progress: Math.round(project.progressPercent ?? 0),
    status: "Đang thực hiện",
    health: mapHealthStatus(project.healthStatus),
    currentPhase: project.phases.find((p) => p.phaseStatus === "in_progress")?.phaseName ?? project.phases[0]?.phaseName ?? "Chưa bắt đầu",
    nearestDeadline: project.phases.find((p) => p.plannedEndDate)?.plannedEndDate ?? null,
  };
}
