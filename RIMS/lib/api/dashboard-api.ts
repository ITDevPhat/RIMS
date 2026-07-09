import { apiClient } from "./api-client";

export interface DashboardBucketDto {
  key: string;
  label: string;
  count: number;
}

export interface DashboardPhaseDto {
  phaseId: number;
  phaseName: string;
  plannedStartDate?: string | null;
  plannedEndDate?: string | null;
  actualStartDate?: string | null;
  actualEndDate?: string | null;
  progressPercent: number;
  phaseStatus: string;
}

export interface DashboardGanttProjectDto {
  projectId: number;
  projectCode: string;
  projectTitle: string;
  departmentName?: string | null;
  principalInvestigatorName?: string | null;
  sponsorName?: string | null;
  progressPercent: number;
  healthStatus: string;
  phases: DashboardPhaseDto[];
}

export interface DashboardDeadlineDto {
  deadlineId: number;
  deadlineType: string;
  title: string;
  dueDate: string;
  priorityLevel: string;
  deadlineStatus: string;
  projectId?: number | null;
  projectCode?: string | null;
  projectTitle?: string | null;
  responsibleUserName?: string | null;
  daysRemaining: number;
  isOverdue: boolean;
}

export interface DashboardProjectAttentionDto {
  projectId: number;
  projectCode: string;
  projectTitle: string;
  projectStatus: string;
  healthStatus: string;
  riskLevel: string;
  progressPercent: number;
  plannedEndDate?: string | null;
  ethicsExpiryDate?: string | null;
  reasons: string[];
}

export interface ResearchOverviewDto {
  totalProjects: number;
  activeProjects: number;
  dueSoonCount: number;
  overdueCount: number;
  averageProgress: number;
  ethicsExpiringCount: number;
  projectHealthSummary: DashboardBucketDto[];
  upcomingDeadlines: DashboardDeadlineDto[];
  projectsNeedAttention: DashboardProjectAttentionDto[];
  ganttProjects: DashboardGanttProjectDto[];
}

export interface TrainingDashboardMonthlySummaryDto {
  month: number;
  monthName: string;
  plannedCount: number;
  additionalCount: number;
  totalPlan: number;
  actualCount: number;
  notCompletedCount: number;
  completionRate: number;
}

export interface TrainingOverviewDto {
  totalPlannedEvents: number;
  totalAdditionalEvents: number;
  totalActualEvents: number;
  totalNotCompletedEvents: number;
  completionRate: number;
  currentMonthEvents: number;
  monthlySummary: TrainingDashboardMonthlySummaryDto[];
  statusDistribution: DashboardBucketDto[];
}

export interface DashboardDeadlinesDto {
  upcomingIn7Days: DashboardDeadlineDto[];
  upcomingIn30Days: DashboardDeadlineDto[];
  overdue: DashboardDeadlineDto[];
  ethicsExpiring: Array<{
    projectId: number;
    projectCode: string;
    projectTitle: string;
    ethicsExpiryDate: string;
    principalInvestigatorName?: string | null;
    daysRemaining: number;
  }>;
  trainingEventsUpcoming: Array<{
    eventId: number;
    eventCode: string;
    eventTitle: string;
    plannedDate?: string | null;
    startTime?: string | null;
    endTime?: string | null;
    planType: string;
    eventStatus: string;
    departmentName?: string | null;
  }>;
}

export const dashboardApi = {
  getResearchOverview: (year: number) =>
    apiClient.get<ResearchOverviewDto>("/dashboard/research-overview", { year }),
  getTrainingOverview: (year: number) =>
    apiClient.get<TrainingOverviewDto>("/dashboard/training-overview", { year }),
  getDeadlines: (days: number) => apiClient.get<DashboardDeadlinesDto>("/dashboard/deadlines", { days }),
};
