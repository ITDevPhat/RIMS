import { apiClient, type PagedResult, type QueryParams } from "./api-client";
import type { ApiUserProfile } from "./auth-api";

export interface ApiAdminUser extends ApiUserProfile {
  createdAt: string;
}

export interface ApiAdminRole {
  roleId: number;
  roleCode: string;
  roleName: string;
  description?: string | null;
  isSystem: boolean;
  isActive: boolean;
  userCount: number;
  createdAt: string;
}

export interface ApiPermission {
  permissionId: number;
  moduleCode: string;
  moduleName: string;
  actionCode: string;
  actionName: string;
  permissionCode: string;
  description?: string | null;
  isActive: boolean;
}

export interface ApiSetting {
  settingId: number;
  settingKey: string;
  settingValue?: string | null;
  valueType: string;
  settingGroup: string;
  settingName: string;
  description?: string | null;
  isPublic: boolean;
  isActive: boolean;
}

export interface ApiRolePermissionAction {
  actionCode: string;
  actionName: string;
  permissionCode: string;
  permissionId: number;
  isAllowed: boolean;
}

export interface ApiRolePermissionModule {
  moduleCode: string;
  moduleName: string;
  actions: ApiRolePermissionAction[];
}

export interface ApiRolePermissionMatrix {
  roleId: number;
  roleName: string;
  modules: ApiRolePermissionModule[];
}

export const adminApi = {
  getUsers: (filters?: QueryParams) => apiClient.get<PagedResult<ApiAdminUser>>("/users", filters),
  getUser: (id: string | number) => apiClient.get<ApiAdminUser>(`/users/${id}`),
  createUser: (payload: unknown) => apiClient.post<ApiAdminUser>("/users", payload),
  updateUser: (id: string | number, payload: unknown) => apiClient.put<ApiAdminUser>(`/users/${id}`, payload),
  deleteUser: (id: string | number) => apiClient.delete<null>(`/users/${id}`),
  lockUser: (id: string | number) => apiClient.put<ApiAdminUser>(`/users/${id}/lock`),
  unlockUser: (id: string | number) => apiClient.put<ApiAdminUser>(`/users/${id}/unlock`),
  resetPassword: (id: string | number, payload?: unknown) => apiClient.post<unknown>(`/users/${id}/reset-password`, payload ?? {}),
  getRoles: (filters?: QueryParams) => apiClient.get<PagedResult<ApiAdminRole>>("/roles", filters),
  getRole: (id: string | number) => apiClient.get<ApiAdminRole>(`/roles/${id}`),
  createRole: (payload: unknown) => apiClient.post<ApiAdminRole>("/roles", payload),
  updateRole: (id: string | number, payload: unknown) => apiClient.put<ApiAdminRole>(`/roles/${id}`, payload),
  deleteRole: (id: string | number) => apiClient.delete<null>(`/roles/${id}`),
  getPermissions: (filters?: QueryParams) => apiClient.get<PagedResult<ApiPermission>>("/permissions", filters),
  getRolePermissions: (roleId: string | number) => apiClient.get<unknown>(`/roles/${roleId}/permissions`),
  updateRolePermissions: (roleId: string | number, payload: { permissionIds: number[] }) =>
    apiClient.put<unknown>(`/roles/${roleId}/permissions`, payload),
  getSettings: (filters?: QueryParams) => apiClient.get<PagedResult<ApiSetting>>("/settings", filters),
  createSetting: (payload: unknown) => apiClient.post<ApiSetting>("/settings", payload),
  updateSetting: (key: string, payload: unknown) => apiClient.put<ApiSetting>(`/settings/${key}`, payload),
  getAccountPreferences: () => apiClient.get<unknown>("/account/preferences"),
  updateAccountPreferences: (payload: unknown) => apiClient.put<unknown>("/account/preferences", payload),
};
