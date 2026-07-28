export type LoaiHoatDong = "Hội nghị" | "Hội thảo" | "Lớp đào tạo" | "Tập huấn" | "Sinh hoạt khoa học" | "Khác";
export type LoaiKeHoach = "Dự kiến" | "Phát sinh";
export type TrangThaiHoiNghi = "Dự kiến" | "Đang chuẩn bị" | "Đã thực hiện" | "Không thực hiện được" | "Hoãn" | "Hủy";
export interface HoiNghi { id: string; ma: string; ten: string; moTa: string; nam: number; thang: number; ngayDuKien: string; ngayThucTe: string | null; loai: LoaiHoatDong; loaiKeHoach: LoaiKeHoach; khoaPhong: string; nguoiPhuTrach: string; diaDiem: string; soNguoiDuKien: number; soNguoiThucTe: number | null; trangThai: TrangThaiHoiNghi; lyDoKhongThucHien: string | null; ghiChu: string; nhatKy: { ngay: string; noi_dung: string }[]; }
export interface ThangTomTat { thang: number; duKien: number; phatSinh: number; thucTe: number; chuaThucHien: number; tyLeHoanThanh: number; ghiChu: string; }
