import { apiClient, type PagedResult, type QueryParams } from "./api-client";

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
  plannedEndDate?: string | null;
  currentPhaseName?: string | null;
  progressPercent: number;
  projectStatus: string;
  riskLevel: string;
  nearestDeadlineDate?: string | null;
  notes?: string | null;
}

export interface ApiProjectPhase {
  phaseId: number;
  projectId: number;
  projectCode: string;
  projectTitle: string;
  phaseName: string;
  description?: string | null;
  responsibleUserName?: string | null;
  plannedStartDate?: string | null;
  plannedEndDate?: string | null;
  deadlineDate?: string | null;
  actualStartDate?: string | null;
  actualEndDate?: string | null;
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
  responsibleUserName?: string | null;
  milestoneStatus: string;
  priorityLevel: string;
  completedAt?: string | null;
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
  responsibleUserName?: string | null;
  priorityLevel: string;
  deadlineStatus: string;
  completedAt?: string | null;
  daysRemaining: number;
  isOverdue: boolean;
  severityLabel: string;
}

export const researchApi = {
  getProjects: (filters?: QueryParams) => apiClient.get<PagedResult<ApiResearchProject>>("/research-projects", filters),
  getProject: (id: string | number) => apiClient.get<ApiResearchProject>(`/research-projects/${id}`),
  getProjectOverview: (id: string | number) => apiClient.get<unknown>(`/research-projects/${id}/overview`),
  createProject: (payload: unknown) => apiClient.post<ApiResearchProject>("/research-projects", payload),
  updateProject: (id: string | number, payload: unknown) => apiClient.put<ApiResearchProject>(`/research-projects/${id}`, payload),
  deleteProject: (id: string | number) => apiClient.delete<null>(`/research-projects/${id}`),
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
