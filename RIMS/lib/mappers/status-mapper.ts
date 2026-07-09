import type { EthicsStatus, PhaseStatus, ProjectHealth, ResearchStatus, RiskLevel } from "@/lib/types";

export function mapProjectStatus(status?: string | null): ResearchStatus {
  switch (status) {
    case "completed":
      return "Hoàn thành";
    case "completed_late":
    case "delayed":
      return "Hoàn thành trễ";
    case "overdue":
      return "Trễ hạn";
    case "pending":
      return "Chờ duyệt";
    case "revision_required":
      return "Cần chỉnh sửa";
    case "paused":
    case "on_hold":
      return "Tạm dừng";
    case "not_started":
      return "Chưa bắt đầu";
    case "cancelled":
      return "Hủy";
    default:
      return "Đang thực hiện";
  }
}

export function mapPhaseStatus(status?: string | null): PhaseStatus {
  switch (status) {
    case "completed":
      return "Hoàn thành";
    case "delayed":
    case "completed_late":
      return "Hoàn thành trễ";
    case "pending":
      return "Chờ duyệt";
    case "revision_required":
      return "Cần chỉnh sửa";
    case "not_started":
      return "Chưa bắt đầu";
    case "overdue":
      return "Trễ hạn";
    case "at_risk":
      return "Có nguy cơ";
    case "paused":
    case "on_hold":
      return "Tạm dừng";
    case "cancelled":
      return "Hủy";
    default:
      return "Đang thực hiện";
  }
}

export function mapHealthStatus(status?: string | null): ProjectHealth {
  switch (status) {
    case "at_risk":
    case "medium":
      return "Có nguy cơ";
    case "delayed":
    case "overdue":
      return "Trễ hạn";
    case "paused":
      return "Tạm dừng";
    case "completed":
      return "Hoàn thành";
    case "completed_late":
      return "Hoàn thành trễ";
    default:
      return "Đúng tiến độ";
  }
}

export function mapRiskLevel(status?: string | null): RiskLevel {
  switch (status) {
    case "high":
    case "at_risk":
      return "Có nguy cơ";
    case "critical":
    case "overdue":
      return "Trễ hạn";
    case "paused":
      return "Tạm dừng";
    case "completed":
      return "Đã hoàn thành";
    case "completed_late":
      return "Hoàn thành trễ";
    default:
      return "Đúng tiến độ";
  }
}

export function mapEthicsStatus(status?: string | null, expiryDate?: string | null): EthicsStatus {
  if (expiryDate) {
    const diffDays = Math.ceil((new Date(expiryDate).getTime() - Date.now()) / 86400000);
    if (diffDays < 0) return "Hết hạn";
    if (diffDays <= 30) return "Sắp hết hạn";
  }

  switch (status) {
    case "not_required":
      return "Không yêu cầu";
    case "pending":
      return "Chờ duyệt";
    case "approved":
      return "Đã duyệt";
    case "expired":
      return "Hết hạn";
    default:
      return "Không yêu cầu";
  }
}

export function mapPriority(priority?: string | null): "critical" | "high" | "medium" | "normal" | "ethics" {
  switch (priority) {
    case "urgent":
    case "critical":
      return "critical";
    case "high":
      return "high";
    case "medium":
      return "medium";
    default:
      return "normal";
  }
}
