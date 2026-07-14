// TypeScript types for Hospital Research Timeline Tracker

export type PhaseStatus =
  | "Hoàn thành"
  | "Hoàn thành trễ"
  | "Đang thực hiện"
  | "Chờ duyệt"
  | "Cần chỉnh sửa"
  | "Chưa bắt đầu"
  | "Trễ hạn"
  | "Có nguy cơ"
  | "Tạm dừng"
  | "Hủy";

export type RiskLevel =
  | "Đúng tiến độ"
  | "Có nguy cơ"
  | "Trễ hạn"
  | "Đã hoàn thành"
  | "Hoàn thành trễ"
  | "Tạm dừng";

export type ResearchStatus =
  | "Đang thực hiện"
  | "Chờ duyệt"
  | "Cần chỉnh sửa"
  | "Hoàn thành"
  | "Hoàn thành trễ"
  | "Trễ hạn"
  | "Tạm dừng"
  | "Chưa bắt đầu"
  | "Hủy";

export type EthicsStatus =
  | "Không yêu cầu"
  | "Chờ duyệt"
  | "Đã duyệt"
  | "Sắp hết hạn"
  | "Hết hạn";

export type ProjectHealth =
  | "Đúng tiến độ"
  | "Có nguy cơ"
  | "Trễ hạn"
  | "Đã hoàn thành"
  | "Hoàn thành trễ"
  | "Tạm dừng"
  | "Hoàn thành";

export interface ResearchProject {
  id: string;
  code: string;
  name: string;
  description: string;
  department: string;      // Khoa/phòng
  pi: string;              // Chủ nhiệm đề tài
  principalInvestigator?: string;
  managerName?: string;
  sponsor: string;         // Nhà tài trợ
  researchType: string;    // Loại nghiên cứu
  protocolNumber: string;
  protocolVersion: string;
  ethicsStatus: EthicsStatus;
  ethicsExpiry: string | null;  // ISO date
  startDate: string;
  plannedEndDate: string;
  actualEndDate?: string | null;
  progress: number;
  progressPercent?: number;
  status: ResearchStatus;
  health: ProjectHealth;
  riskLevel?: RiskLevel;
  currentPhase: string;
  nearestDeadline: string | null;
}

export interface ResearchPhase {
  id: string;
  researchId: string;
  researchProjectId?: string;
  order: number;
  sortOrder?: number;
  name: string;
  description?: string;
  responsibleUserId?: string | null;
  assignee?: string;
  assignedTo?: string;
  plannedStartDate: string;
  plannedEndDate: string;
  deadline: string;
  deadlineDate?: string;
  actualStartDate: string | null;
  actualEndDate: string | null;
  progress: number;
  progressPercent?: number;
  status: PhaseStatus;
  riskLevel?: RiskLevel;
  delayDays: number;
  notes?: string;
  note?: string;
}

export interface ResearchMilestone {
  id: string;
  phaseId: string;
  researchId: string;
  researchProjectId?: string;
  researchModuleId?: string;
  order: number;
  sortOrder?: number;
  name: string;
  responsibleUserId?: string | null;
  assignee?: string;
  assignedTo?: string;
  plannedStartDate: string;
  plannedEndDate: string;
  deadline: string;
  deadlineDate?: string;
  actualStartDate: string | null;
  actualEndDate: string | null;
  progress: number;
  progressPercent?: number;
  status: PhaseStatus;
  risk: RiskLevel;
  riskLevel?: RiskLevel;
  delayDays?: number;
  hasIssue: boolean;
  issueReason?: string;
  notes?: string;
  note?: string;
}

export interface DeadlineItem {
  id: string;
  researchId: string;
  researchCode: string;
  researchName: string;
  type: string;             // Loại hạn chót
  dueDate: string;          // ISO date
  daysRemaining: number;    // negative = overdue
  assignee: string;
  status: PhaseStatus | "Quá hạn";
  priority: "critical" | "high" | "medium" | "normal" | "ethics";
}
