import { apiClient } from "./api-client";

export interface ApiRole {
  roleId: number;
  roleCode: string;
  roleName: string;
}

export interface ApiUserProfile {
  userId: number;
  username: string;
  email: string;
  fullName: string;
  initials?: string | null;
  phoneNumber?: string | null;
  avatarUrl?: string | null;
  title?: string | null;
  departmentId?: number | null;
  departmentName?: string | null;
  accountStatus: string;
  isSystemAdmin: boolean;
  mustChangePassword: boolean;
  lastLoginAt?: string | null;
  roles: ApiRole[];
  permissions: string[];
  preferences?: unknown;
}

export interface LoginResponse {
  token: string;
  expiresAt: string;
  user: ApiUserProfile;
}

export interface ChangePasswordPayload {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

export const authApi = {
  login: (usernameOrEmail: string, password: string) =>
    apiClient.post<LoginResponse>("/auth/login", { usernameOrEmail, password }),
  logout: () => apiClient.post<null>("/auth/logout"),
  getMe: () => apiClient.get<ApiUserProfile>("/auth/me"),
  changePassword: (payload: ChangePasswordPayload) =>
    apiClient.post<null>("/auth/change-password", payload),
};
