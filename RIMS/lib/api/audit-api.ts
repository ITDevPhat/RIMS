import { apiClient, type PagedResult, type QueryParams } from "./api-client";

export interface ApiAuditLog {
  activityLogId: number;
  performedAt: string;
  performedBy?: number | null;
  performedByName?: string | null;
  moduleCode: string;
  actionType: string;
  entityType?: string | null;
  entityId?: number | null;
  actionSummary: string;
  ipAddress?: string | null;
  userAgent?: string | null;
  success: boolean;
}

export interface ApiLoginEvent {
  loginEventId: number;
  userId?: number | null;
  usernameOrEmail?: string | null;
  eventType: string;
  success: boolean;
  failureReason?: string | null;
  ipAddress?: string | null;
  userAgent?: string | null;
  createdAt: string;
}

export const auditApi = {
  getAuditLogs: (filters?: QueryParams) => apiClient.get<PagedResult<ApiAuditLog>>("/audit-logs", filters),
  getLoginEvents: (filters?: QueryParams) => apiClient.get<PagedResult<ApiLoginEvent>>("/login-events", filters),
};
