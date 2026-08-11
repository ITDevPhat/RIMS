import { apiClient, type PagedResult, type QueryParams } from "./api-client";
import type { DatePrecision } from "@/lib/types";

export interface ApiResearchProject {
  projectId: number;
  projectCode: string;
  projectTitle: string;
  description?: string | null;
  departmentId?: number | null;
  departmentName?: string | null;
  principalInvestigatorId?: number | null;
  principalInvestigatorName?: string | null;
  sponsorId?: number | null;
  sponsorName?: string | null;
  researchType?: string | null;
  protocolNumber?: string | null;
  protocolVersion?: string | null;
  ethicsStatus: string;
  ethicsExpiryDate?: string | null;
  plannedStartDate?: string | null;
  plannedStartDatePrecision?: DatePrecision | null;
  plannedEndDate?: string | null;
  plannedEndDatePrecision?: DatePrecision | null;
  actualStartDate?: string | null;
  actualStartDatePrecision?: DatePrecision | null;
  actualEndDate?: string | null;
  actualEndDatePrecision?: DatePrecision | null;
  currentPhaseName?: string | null;
  progressPercent: number;
  projectStatus: string;
  riskLevel: string;
  nearestDeadlineDate?: string | null;
  nearestDeadlineDatePrecision?: DatePrecision | null;
  notes?: string | null;
}

export interface ApiProjectPhase {
  phaseId: number;
  projectId: number;
  projectCode: string;
  projectTitle: string;
  phaseName: string;
  description?: string | null;
  responsibleUserId?: number | null;
  responsibleUserName?: string | null;
  plannedStartDate?: string | null;
  plannedStartDatePrecision?: DatePrecision | null;
  plannedEndDate?: string | null;
  plannedEndDatePrecision?: DatePrecision | null;
  deadlineDate?: string | null;
  deadlineDatePrecision?: DatePrecision | null;
  actualStartDate?: string | null;
  actualStartDatePrecision?: DatePrecision | null;
  actualEndDate?: string | null;
  actualEndDatePrecision?: DatePrecision | null;
  progressPercent: number;
  phaseStatus: string;
  notes?: string | null;
  sortOrder: number;
}

export interface ApiProjectMilestone {
  milestoneId: number;
  projectId: number;
  projectCode: string;
  projectTitle: string;
  phaseId?: number | null;
  phaseName?: string | null;
  milestoneName: string;
  description?: string | null;
  dueDate: string;
  dueDatePrecision?: DatePrecision | null;
  responsibleUserId?: number | null;
  responsibleUserName?: string | null;
  milestoneStatus: string;
  priorityLevel: string;
  completedAt?: string | null;
  completedAtPrecision?: DatePrecision | null;
  notes?: string | null;
}

export interface ApiProjectDeadline {
  deadlineId: number;
  projectId?: number | null;
  projectCode?: string | null;
  projectTitle?: string | null;
  phaseId?: number | null;
  phaseName?: string | null;
  milestoneId?: number | null;
  milestoneName?: string | null;
  deadlineType: string;
  title: string;
  description?: string | null;
  dueDate: string;
  dueDatePrecision?: DatePrecision | null;
  responsibleUserName?: string | null;
  priorityLevel: string;
  deadlineStatus: string;
  completedAt?: string | null;
  daysRemaining: number;
  isOverdue: boolean;
  severityLabel: string;
}

export interface ApiSponsor {
  sponsorId: number;
  sponsorCode: string;
  sponsorName: string;
  sponsorType?: string | null;
  isActive: boolean;
}

export interface ProjectPhasePayload {
  projectId?: number;
  phaseName: string;
  description?: string | null;
  responsibleUserId?: number | null;
  plannedStartDate?: string | null;
  plannedStartDatePrecision?: DatePrecision | null;
  plannedEndDate?: string | null;
  plannedEndDatePrecision?: DatePrecision | null;
  deadlineDate?: string | null;
  deadlineDatePrecision?: DatePrecision | null;
  actualStartDate?: string | null;
  actualStartDatePrecision?: DatePrecision | null;
  actualEndDate?: string | null;
  actualEndDatePrecision?: DatePrecision | null;
  progressPercent: number;
  phaseStatus: string;
  notes?: string | null;
  sortOrder: number;
}

export interface ProjectMilestonePayload {
  projectId?: number;
  phaseId?: number | null;
  milestoneName: string;
  description?: string | null;
  dueDate: string;
  dueDatePrecision?: DatePrecision | null;
  responsibleUserId?: number | null;
  milestoneStatus: string;
  priorityLevel: string;
  completedAt?: string | null;
  completedAtPrecision?: DatePrecision | null;
  notes?: string | null;
}

export const researchApi = {
  getProjects: (filters?: QueryParams) => apiClient.get<PagedResult<ApiResearchProject>>("/research-projects", filters),
  getProject: (id: string | number) => apiClient.get<ApiResearchProject>(`/research-projects/${id}`),
  getProjectOverview: (id: string | number) => apiClient.get<unknown>(`/research-projects/${id}/overview`),
  downloadGanttExcel: (id: string | number, filters?: QueryParams) => apiClient.download(`/reports/projects/${id}/gantt.xlsx`, filters),
  createProject: (payload: unknown) => apiClient.post<ApiResearchProject>("/research-projects", payload),
  updateProject: (id: string | number, payload: unknown) => apiClient.put<ApiResearchProject>(`/research-projects/${id}`, payload),
  deleteProject: (id: string | number) => apiClient.delete<null>(`/research-projects/${id}`),
};

export const sponsorApi = {
  getSponsors: (filters?: QueryParams) => apiClient.get<PagedResult<ApiSponsor>>("/sponsors", filters),
  createSponsor: (payload: unknown) => apiClient.post<ApiSponsor>("/sponsors", payload),
  updateSponsor: (id: string | number, payload: unknown) => apiClient.put<ApiSponsor>(`/sponsors/${id}`, payload),
  deleteSponsor: (id: string | number) => apiClient.delete<null>(`/sponsors/${id}`),
};

export const projectPhaseApi = {
  getPhases: (filters?: QueryParams) => apiClient.get<PagedResult<ApiProjectPhase>>("/project-phases", filters),
  getPhase: (id: string | number) => apiClient.get<ApiProjectPhase>(`/project-phases/${id}`),
  createPhase: (payload: unknown) => apiClient.post<ApiProjectPhase>("/project-phases", payload),
  updatePhase: (id: string | number, payload: unknown) => apiClient.put<ApiProjectPhase>(`/project-phases/${id}`, payload),
  deletePhase: (id: string | number) => apiClient.delete<null>(`/project-phases/${id}`),
};

export const projectMilestoneApi = {
  getMilestones: (filters?: QueryParams) => apiClient.get<PagedResult<ApiProjectMilestone>>("/project-milestones", filters),
  getMilestone: (id: string | number) => apiClient.get<ApiProjectMilestone>(`/project-milestones/${id}`),
  createMilestone: (payload: unknown) => apiClient.post<ApiProjectMilestone>("/project-milestones", payload),
  updateMilestone: (id: string | number, payload: unknown) => apiClient.put<ApiProjectMilestone>(`/project-milestones/${id}`, payload),
  deleteMilestone: (id: string | number) => apiClient.delete<null>(`/project-milestones/${id}`),
};

export const projectDeadlineApi = {
  getDeadlines: (filters?: QueryParams) => apiClient.get<PagedResult<ApiProjectDeadline>>("/project-deadlines", filters),
  getDeadline: (id: string | number) => apiClient.get<ApiProjectDeadline>(`/project-deadlines/${id}`),
  createDeadline: (payload: unknown) => apiClient.post<ApiProjectDeadline>("/project-deadlines", payload),
  updateDeadline: (id: string | number, payload: unknown) => apiClient.put<ApiProjectDeadline>(`/project-deadlines/${id}`, payload),
  deleteDeadline: (id: string | number) => apiClient.delete<null>(`/project-deadlines/${id}`),
  markCompleted: (id: string | number) => apiClient.put<ApiProjectDeadline>(`/project-deadlines/${id}/mark-completed`),
};
