export type UserStatus = "active" | "inactive" | "locked";
export type RoleStatus = "active" | "inactive";

export interface User {
  id: string;
  hoTen: string;
  email: string;
  phone: string;
  chucVu: string;
  khoaPhong: string;
  vaiTro: string;
  status: UserStatus;
  taoNgay: Date;
  lanDangNhapCuoi: Date;
}

export interface Role {
  id: string;
  tenVaiTro: string;
  maVaiTro: string;
  moTa: string;
  status: RoleStatus;
  ngayTao: Date;
  soNguoiDung: number;
}

export interface Permission {
  id: string;
  tenQuyen: string;
  maQuyen: string;
  moTa: string;
  danh_muc: string;
}

export interface NotificationRule {
  id: string;
  tenQuyTac: string;
  loaiDoiTuong: string;
  dieuKien: string;
  nhanTruoc: string;
  kenhThongBao: string;
  mucDo: "cao" | "trung" | "thap";
  status: boolean;
  moTa: string;
}

export const mockUsers: User[] = [
  {
    id: "user-001",
    hoTen: "Nguyễn Văn A",
    email: "admin@hospital.vn",
    phone: "0912345678",
    chucVu: "Giám đốc Trung tâm Nghiên cứu",
    khoaPhong: "Trung tâm Nghiên cứu",
    vaiTro: "Quản trị viên",
    status: "active",
    taoNgay: new Date("2024-01-15"),
    lanDangNhapCuoi: new Date(Date.now() - 1 * 60 * 60 * 1000),
  },
  {
    id: "user-002",
    hoTen: "Trần Thị B",
    email: "researcher@hospital.vn",
    phone: "0912345679",
    chucVu: "Phó Giáo sư",
    khoaPhong: "Khoa Ngoài Tổng Hợp",
    vaiTro: "Cán bộ Nghiên cứu",
    status: "active",
    taoNgay: new Date("2024-02-20"),
    lanDangNhapCuoi: new Date(Date.now() - 3 * 60 * 60 * 1000),
  },
  {
    id: "user-003",
    hoTen: "Phạm Văn C",
    email: "supervisor@hospital.vn",
    phone: "0912345680",
    chucVu: "Trưởng Khoa",
    khoaPhong: "Khoa Tim Mạch",
    vaiTro: "Người Giám Sát",
    status: "active",
    taoNgay: new Date("2023-12-10"),
    lanDangNhapCuoi: new Date(Date.now() - 2 * 60 * 60 * 1000),
  },
  {
    id: "user-004",
    hoTen: "Lê Thị D",
    email: "staff@hospital.vn",
    phone: "0912345681",
    chucVu: "Nhân Viên Hành Chính",
    khoaPhong: "Hành Chính",
    vaiTro: "Nhân Viên",
    status: "active",
    taoNgay: new Date("2024-03-05"),
    lanDangNhapCuoi: new Date(Date.now() - 4 * 60 * 60 * 1000),
  },
  {
    id: "user-005",
    hoTen: "Hoàng Văn E",
    email: "inactive@hospital.vn",
    phone: "0912345682",
    chucVu: "Nhà Nghiên Cứu",
    khoaPhong: "Khoa Nhi",
    vaiTro: "Cán bộ Nghiên cứu",
    status: "inactive",
    taoNgay: new Date("2023-06-15"),
    lanDangNhapCuoi: new Date("2024-08-10"),
  },
];

export const mockRoles: Role[] = [
  {
    id: "role-001",
    tenVaiTro: "Quản trị viên",
    maVaiTro: "admin",
    moTa: "Toàn quyền quản lý hệ thống",
    status: "active",
    ngayTao: new Date("2024-01-01"),
    soNguoiDung: 1,
  },
  {
    id: "role-002",
    tenVaiTro: "Cán bộ Nghiên cứu",
    maVaiTro: "researcher",
    moTa: "Quản lý đề tài nghiên cứu",
    status: "active",
    ngayTao: new Date("2024-01-01"),
    soNguoiDung: 3,
  },
  {
    id: "role-003",
    tenVaiTro: "Người Giám Sát",
    maVaiTro: "supervisor",
    moTa: "Giám sát tiến độ nghiên cứu",
    status: "active",
    ngayTao: new Date("2024-01-01"),
    soNguoiDung: 2,
  },
  {
    id: "role-004",
    tenVaiTro: "Nhân Viên",
    maVaiTro: "staff",
    moTa: "Hỗ trợ hành chính",
    status: "active",
    ngayTao: new Date("2024-02-01"),
    soNguoiDung: 5,
  },
];

export const mockPermissions: Permission[] = [
  { id: "perm-001", tenQuyen: "Xem Đề tài", maQuyen: "view_projects", moTa: "Xem danh sách đề tài", danh_muc: "Đề tài" },
  { id: "perm-002", tenQuyen: "Tạo Đề tài", maQuyen: "create_projects", moTa: "Tạo đề tài mới", danh_muc: "Đề tài" },
  { id: "perm-003", tenQuyen: "Sửa Đề tài", maQuyen: "edit_projects", moTa: "Chỉnh sửa đề tài", danh_muc: "Đề tài" },
  { id: "perm-004", tenQuyen: "Xóa Đề tài", maQuyen: "delete_projects", moTa: "Xóa đề tài", danh_muc: "Đề tài" },
  { id: "perm-005", tenQuyen: "Xem Người dùng", maQuyen: "view_users", moTa: "Xem danh sách người dùng", danh_muc: "Hệ thống" },
  { id: "perm-006", tenQuyen: "Quản lý Người dùng", maQuyen: "manage_users", moTa: "Tạo, sửa, xóa người dùng", danh_muc: "Hệ thống" },
  { id: "perm-007", tenQuyen: "Xem Báo cáo", maQuyen: "view_reports", moTa: "Xem báo cáo hệ thống", danh_muc: "Báo cáo" },
  { id: "perm-008", tenQuyen: "Xuất Báo cáo", maQuyen: "export_reports", moTa: "Xuất báo cáo", danh_muc: "Báo cáo" },
];

export const mockNotificationRules: NotificationRule[] = [
  {
    id: "rule-001",
    tenQuyTac: "Nhắc nhở hạn chót 7 ngày",
    loaiDoiTuong: "Đề tài",
    dieuKien: "Khi còn 7 ngày đến hạn giai đoạn",
    nhanTruoc: "7 ngày",
    kenhThongBao: "Email & App",
    mucDo: "trung",
    status: true,
    moTa: "Gửi thông báo khi còn 7 ngày đến hạn giai đoạn",
  },
  {
    id: "rule-002",
    tenQuyTac: "Nhắc nhở hạn chót 3 ngày",
    loaiDoiTuong: "Đề tài",
    dieuKien: "Khi còn 3 ngày đến hạn giai đoạn",
    nhanTruoc: "3 ngày",
    kenhThongBao: "Email & App & SMS",
    mucDo: "cao",
    status: true,
    moTa: "Gửi thông báo cấp bách khi còn 3 ngày",
  },
  {
    id: "rule-003",
    tenQuyTac: "Cảnh báo quá hạn",
    loaiDoiTuong: "Mốc tiến độ",
    dieuKien: "Khi quá hạn 1 ngày",
    nhanTruoc: "Ngay lập tức",
    kenhThongBao: "Email & App & SMS",
    mucDo: "cao",
    status: true,
    moTa: "Cảnh báo ngay khi quá hạn",
  },
];
