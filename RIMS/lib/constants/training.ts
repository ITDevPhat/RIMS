import { DEPARTMENTS } from "@/lib/constants/research";
import type { HoiNghi, LoaiHoatDong, LoaiKeHoach, ThangTomTat, TrangThaiHoiNghi } from "@/lib/types/training";
export type { HoiNghi, LoaiHoatDong, LoaiKeHoach, ThangTomTat, TrangThaiHoiNghi } from "@/lib/types/training";
export const LOAI_HOAT_DONG_OPTIONS: LoaiHoatDong[] = ["Hội nghị", "Hội thảo", "Lớp đào tạo", "Tập huấn", "Sinh hoạt khoa học", "Khác"];
export const LOAI_KE_HOACH_OPTIONS: LoaiKeHoach[] = ["Dự kiến", "Phát sinh"];
export const TRANG_THAI_OPTIONS: TrangThaiHoiNghi[] = ["Dự kiến", "Đang chuẩn bị", "Đã thực hiện", "Không thực hiện được", "Hoãn", "Hủy"];
export const KHOA_PHONG_OPTIONS = DEPARTMENTS.filter((item) => item !== "Tất cả");
export function computeMonthlySummary(items: HoiNghi[]): ThangTomTat[] { return Array.from({ length: 12 }, (_, index) => { const thang = index + 1; const month = items.filter((item) => item.thang === thang); const duKien = month.filter((item) => item.loaiKeHoach === "Dự kiến").length; const phatSinh = month.filter((item) => item.loaiKeHoach === "Phát sinh").length; const thucTe = month.filter((item) => item.trangThai === "Đã thực hiện").length; const total = duKien + phatSinh; return { thang, duKien, phatSinh, thucTe, chuaThucHien: Math.max(0, total - thucTe), tyLeHoanThanh: total ? Math.round(thucTe / total * 100) : 0, ghiChu: "" }; }); }
