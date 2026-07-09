import type { ApiAdminRole, ApiPermission } from "@/lib/api/admin-api";
import type { Permission, Role } from "@/lib/mock-admin-data";

export function mapApiRoleToUi(role: ApiAdminRole): Role {
  return {
    id: String(role.roleId),
    tenVaiTro: role.roleName,
    maVaiTro: role.roleCode,
    moTa: role.description ?? "",
    status: role.isActive ? "active" : "inactive",
    ngayTao: new Date(role.createdAt),
    soNguoiDung: role.userCount,
  };
}

export function mapApiPermissionToUi(permission: ApiPermission): Permission {
  return {
    id: String(permission.permissionId),
    tenQuyen: permission.actionName,
    maQuyen: permission.permissionCode,
    moTa: permission.description ?? "",
    danh_muc: permission.moduleName,
  };
}
