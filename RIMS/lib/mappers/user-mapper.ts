import type { ApiAdminUser } from "@/lib/api/admin-api";
import type { User, UserStatus } from "@/lib/mock-admin-data";

function mapStatus(status: string): UserStatus {
  if (status === "locked") return "locked";
  if (status === "inactive" || status === "disabled") return "inactive";
  return "active";
}

export function mapApiUserToUi(user: ApiAdminUser): User {
  return {
    id: String(user.userId),
    hoTen: user.fullName,
    email: user.email,
    phone: user.phoneNumber ?? "",
    chucVu: user.title ?? "",
    khoaPhong: user.departmentName ?? "",
    vaiTro: user.roles.map((role) => role.roleName).join(", ") || "Chưa phân quyền",
    status: mapStatus(user.accountStatus),
    taoNgay: new Date(user.createdAt),
    lanDangNhapCuoi: user.lastLoginAt ? new Date(user.lastLoginAt) : new Date(0),
  };
}
