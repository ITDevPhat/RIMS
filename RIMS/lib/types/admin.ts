export type UserStatus = "active" | "inactive" | "locked";
export type RoleStatus = "active" | "inactive";
export interface User { id: string; hoTen: string; email: string; phone: string; chucVu: string; khoaPhong: string; vaiTro: string; status: UserStatus; taoNgay: Date; lanDangNhapCuoi: Date; }
export interface Role { id: string; tenVaiTro: string; maVaiTro: string; moTa: string; status: RoleStatus; ngayTao: Date; soNguoiDung: number; }
export interface Permission { id: string; tenQuyen: string; maQuyen: string; moTa: string; danh_muc: string; }
