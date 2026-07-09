// Mock data for Mảng đào tạo — hospital conference/training management

export type LoaiHoatDong =
  | "Hội nghị"
  | "Hội thảo"
  | "Lớp đào tạo"
  | "Tập huấn"
  | "Sinh hoạt khoa học"
  | "Khác";

export type LoaiKeHoach = "Dự kiến" | "Phát sinh";

export type TrangThaiHoiNghi =
  | "Dự kiến"
  | "Đang chuẩn bị"
  | "Đã thực hiện"
  | "Không thực hiện được"
  | "Hoãn"
  | "Hủy";

export interface HoiNghi {
  id: string;
  ma: string;
  ten: string;
  moTa: string;
  nam: number;
  thang: number;
  ngayDuKien: string;
  ngayThucTe: string | null;
  loai: LoaiHoatDong;
  loaiKeHoach: LoaiKeHoach;
  khoaPhong: string;
  nguoiPhuTrach: string;
  diaDiem: string;
  soNguoiDuKien: number;
  soNguoiThucTe: number | null;
  trangThai: TrangThaiHoiNghi;
  lyDoKhongThucHien: string | null;
  ghiChu: string;
  nhatKy: { ngay: string; noi_dung: string }[];
}

// Monthly summary derived from conference list
export interface ThangTomTat {
  thang: number;
  duKien: number;
  phatSinh: number;
  thucTe: number;
  chuaThucHien: number;
  tyLeHoanThanh: number; // %
  ghiChu: string;
}

const KHOA_PHONG = [
  "Phòng Đào tạo",
  "Phòng Quản lý NCKH",
  "Khoa Nội tiết",
  "Khoa Tim mạch",
  "Khoa Hồi sức tích cực",
  "Khoa Chẩn đoán hình ảnh",
  "Khoa Dược",
  "Khoa Kiểm soát nhiễm khuẩn",
  "Khoa Ngoại tổng hợp",
  "Khoa Sản",
];

const NGUOI_PHU_TRACH = [
  "ThS. Nguyễn Minh Anh",
  "TS. Trần Quốc Bảo",
  "BS.CKII. Lê Thanh Hương",
  "CN. Phạm Hoài Nam",
  "ThS. Võ Thu Hà",
  "TS. Đinh Văn Khoa",
  "BS.CKI. Trương Thị Mai",
];

// ─── 2026 data ─────────────────────────────────────────────────────────────
export const mockHoiNghi2026: HoiNghi[] = [
  {
    id: "1", ma: "HN-2026-001", ten: "Hội nghị kiểm soát nhiễm khuẩn bệnh viện",
    moTa: "Cập nhật quy trình kiểm soát nhiễm khuẩn theo tiêu chuẩn mới của Bộ Y tế.",
    nam: 2026, thang: 1, ngayDuKien: "2026-01-15", ngayThucTe: "2026-01-15",
    loai: "Hội nghị", loaiKeHoach: "Dự kiến", khoaPhong: KHOA_PHONG[7],
    nguoiPhuTrach: NGUOI_PHU_TRACH[0], diaDiem: "Hội trường A – Tầng 3",
    soNguoiDuKien: 120, soNguoiThucTe: 115,
    trangThai: "Đã thực hiện", lyDoKhongThucHien: null, ghiChu: "Mời chuyên gia từ BV Bạch Mai.",
    nhatKy: [
      { ngay: "2026-01-10", noi_dung: "Gửi thư mời các khoa." },
      { ngay: "2026-01-15", noi_dung: "Tổ chức thành công, 115 người tham dự." },
    ],
  },
  {
    id: "2", ma: "HN-2026-002", ten: "Tập huấn an toàn người bệnh",
    moTa: "Nâng cao nhận thức về an toàn người bệnh và báo cáo sự cố.",
    nam: 2026, thang: 1, ngayDuKien: "2026-01-22", ngayThucTe: "2026-01-22",
    loai: "Tập huấn", loaiKeHoach: "Dự kiến", khoaPhong: KHOA_PHONG[0],
    nguoiPhuTrach: NGUOI_PHU_TRACH[2], diaDiem: "Phòng họp lớn – Tầng 2",
    soNguoiDuKien: 60, soNguoiThucTe: 58,
    trangThai: "Đã thực hiện", lyDoKhongThucHien: null, ghiChu: "",
    nhatKy: [{ ngay: "2026-01-22", noi_dung: "Hoàn thành đúng kế hoạch." }],
  },
  {
    id: "3", ma: "HN-2026-003", ten: "Hội thảo cập nhật điều trị Đái tháo đường type 2",
    moTa: "Cập nhật phác đồ điều trị theo hướng dẫn ADA 2025.",
    nam: 2026, thang: 2, ngayDuKien: "2026-02-18", ngayThucTe: "2026-02-18",
    loai: "Hội thảo", loaiKeHoach: "Dự kiến", khoaPhong: KHOA_PHONG[2],
    nguoiPhuTrach: NGUOI_PHU_TRACH[1], diaDiem: "Hội trường B – Tầng 4",
    soNguoiDuKien: 80, soNguoiThucTe: 82,
    trangThai: "Đã thực hiện", lyDoKhongThucHien: null, ghiChu: "Có tài liệu phát cho học viên.",
    nhatKy: [{ ngay: "2026-02-18", noi_dung: "82 bác sĩ tham dự, vượt dự kiến." }],
  },
  {
    id: "4", ma: "HN-2026-004", ten: "Lớp đào tạo quy trình báo cáo sự cố y khoa",
    moTa: "Hướng dẫn điền form báo cáo sự cố trực tuyến theo hệ thống mới.",
    nam: 2026, thang: 2, ngayDuKien: "2026-02-25", ngayThucTe: null,
    loai: "Lớp đào tạo", loaiKeHoach: "Dự kiến", khoaPhong: KHOA_PHONG[0],
    nguoiPhuTrach: NGUOI_PHU_TRACH[3], diaDiem: "Phòng máy tính – Tầng 1",
    soNguoiDuKien: 40, soNguoiThucTe: null,
    trangThai: "Không thực hiện được", lyDoKhongThucHien: "Giảng viên bị bệnh, chưa sắp xếp được lịch thay thế.", ghiChu: "Dự kiến dời sang tháng 3.",
    nhatKy: [{ ngay: "2026-02-20", noi_dung: "Thông báo hủy lớp do giảng viên bệnh." }],
  },
  {
    id: "5", ma: "HN-2026-005", ten: "Sinh hoạt khoa học chuyên đề chẩn đoán hình ảnh",
    moTa: "Chia sẻ ca lâm sàng khó và ứng dụng AI trong chẩn đoán.",
    nam: 2026, thang: 3, ngayDuKien: "2026-03-05", ngayThucTe: "2026-03-05",
    loai: "Sinh hoạt khoa học", loaiKeHoach: "Dự kiến", khoaPhong: KHOA_PHONG[5],
    nguoiPhuTrach: NGUOI_PHU_TRACH[4], diaDiem: "Khoa CĐHA – Phòng họp",
    soNguoiDuKien: 30, soNguoiThucTe: 28,
    trangThai: "Đã thực hiện", lyDoKhongThucHien: null, ghiChu: "",
    nhatKy: [{ ngay: "2026-03-05", noi_dung: "Tổ chức thành công." }],
  },
  {
    id: "6", ma: "HN-2026-006", ten: "Hội nghị quản lý sử dụng kháng sinh hợp lý",
    moTa: "Triển khai chương trình stewardship kháng sinh toàn bệnh viện.",
    nam: 2026, thang: 3, ngayDuKien: "2026-03-19", ngayThucTe: "2026-03-20",
    loai: "Hội nghị", loaiKeHoach: "Dự kiến", khoaPhong: KHOA_PHONG[6],
    nguoiPhuTrach: NGUOI_PHU_TRACH[5], diaDiem: "Hội trường A – Tầng 3",
    soNguoiDuKien: 100, soNguoiThucTe: 97,
    trangThai: "Đã thực hiện", lyDoKhongThucHien: null, ghiChu: "Dời 1 ngày do thời tiết.",
    nhatKy: [
      { ngay: "2026-03-18", noi_dung: "Dời ngày tổ chức sang 20/03." },
      { ngay: "2026-03-20", noi_dung: "Tổ chức hoàn thành." },
    ],
  },
  {
    id: "7", ma: "HN-2026-007", ten: "Tập huấn nghiên cứu khoa học cho điều dưỡng",
    moTa: "Hướng dẫn thiết kế nghiên cứu, thu thập và phân tích số liệu cơ bản.",
    nam: 2026, thang: 3, ngayDuKien: "2026-03-26", ngayThucTe: "2026-03-26",
    loai: "Tập huấn", loaiKeHoach: "Phát sinh", khoaPhong: KHOA_PHONG[1],
    nguoiPhuTrach: NGUOI_PHU_TRACH[0], diaDiem: "Hội trường B – Tầng 4",
    soNguoiDuKien: 50, soNguoiThucTe: 52,
    trangThai: "Đã thực hiện", lyDoKhongThucHien: null, ghiChu: "Phát sinh từ đề xuất của Điều dưỡng trưởng.",
    nhatKy: [{ ngay: "2026-03-26", noi_dung: "Hoàn thành, 52 điều dưỡng tham dự." }],
  },
  {
    id: "8", ma: "HN-2026-008", ten: "Hội thảo ứng dụng AI trong y tế",
    moTa: "Khám phá ứng dụng trí tuệ nhân tạo trong chẩn đoán và điều trị.",
    nam: 2026, thang: 4, ngayDuKien: "2026-04-10", ngayThucTe: "2026-04-10",
    loai: "Hội thảo", loaiKeHoach: "Dự kiến", khoaPhong: KHOA_PHONG[0],
    nguoiPhuTrach: NGUOI_PHU_TRACH[1], diaDiem: "Hội trường A – Tầng 3",
    soNguoiDuKien: 90, soNguoiThucTe: 95,
    trangThai: "Đã thực hiện", lyDoKhongThucHien: null, ghiChu: "Mời diễn giả từ Đại học Y Hà Nội.",
    nhatKy: [{ ngay: "2026-04-10", noi_dung: "Thành công, được đánh giá cao." }],
  },
  {
    id: "9", ma: "HN-2026-009", ten: "Lớp đào tạo hồi sức tim phổi cơ bản (BLS)",
    moTa: "Cập nhật kỹ năng hồi sức tim phổi cho nhân viên y tế toàn viện.",
    nam: 2026, thang: 4, ngayDuKien: "2026-04-22", ngayThucTe: "2026-04-22",
    loai: "Lớp đào tạo", loaiKeHoach: "Dự kiến", khoaPhong: KHOA_PHONG[4],
    nguoiPhuTrach: NGUOI_PHU_TRACH[2], diaDiem: "Phòng thực hành – Tầng 1",
    soNguoiDuKien: 45, soNguoiThucTe: 44,
    trangThai: "Đã thực hiện", lyDoKhongThucHien: null, ghiChu: "",
    nhatKy: [{ ngay: "2026-04-22", noi_dung: "Hoàn thành." }],
  },
  {
    id: "10", ma: "HN-2026-010", ten: "Hội thảo dinh dưỡng lâm sàng và nuôi dưỡng hỗ trợ",
    moTa: "Cập nhật hướng dẫn dinh dưỡng lâm sàng ESPEN 2024.",
    nam: 2026, thang: 5, ngayDuKien: "2026-05-08", ngayThucTe: "2026-05-08",
    loai: "Hội thảo", loaiKeHoach: "Dự kiến", khoaPhong: KHOA_PHONG[6],
    nguoiPhuTrach: NGUOI_PHU_TRACH[6], diaDiem: "Hội trường B – Tầng 4",
    soNguoiDuKien: 70, soNguoiThucTe: 68,
    trangThai: "Đã thực hiện", lyDoKhongThucHien: null, ghiChu: "",
    nhatKy: [{ ngay: "2026-05-08", noi_dung: "Tổ chức thành công." }],
  },
  {
    id: "11", ma: "HN-2026-011", ten: "Tập huấn sử dụng hệ thống HIS nâng cấp",
    moTa: "Hướng dẫn sử dụng tính năng mới trong phần mềm quản lý bệnh viện.",
    nam: 2026, thang: 5, ngayDuKien: "2026-05-20", ngayThucTe: "2026-05-20",
    loai: "Tập huấn", loaiKeHoach: "Phát sinh", khoaPhong: KHOA_PHONG[0],
    nguoiPhuTrach: NGUOI_PHU_TRACH[3], diaDiem: "Phòng máy tính – Tầng 1",
    soNguoiDuKien: 55, soNguoiThucTe: 55,
    trangThai: "Đã thực hiện", lyDoKhongThucHien: null, ghiChu: "Phát sinh do cập nhật HIS.",
    nhatKy: [{ ngay: "2026-05-20", noi_dung: "Hoàn thành đúng tiến độ." }],
  },
  {
    id: "12", ma: "HN-2026-012", ten: "Hội nghị tổng kết 6 tháng đầu năm",
    moTa: "Đánh giá kết quả hoạt động khám chữa bệnh và nghiên cứu khoa học.",
    nam: 2026, thang: 6, ngayDuKien: "2026-06-25", ngayThucTe: "2026-06-25",
    loai: "Hội nghị", loaiKeHoach: "Dự kiến", khoaPhong: KHOA_PHONG[0],
    nguoiPhuTrach: NGUOI_PHU_TRACH[1], diaDiem: "Hội trường A – Tầng 3",
    soNguoiDuKien: 150, soNguoiThucTe: 143,
    trangThai: "Đã thực hiện", lyDoKhongThucHien: null, ghiChu: "Ban lãnh đạo chủ trì.",
    nhatKy: [{ ngay: "2026-06-25", noi_dung: "143 đại biểu tham dự." }],
  },
  {
    id: "13", ma: "HN-2026-013", ten: "Sinh hoạt khoa học tim mạch can thiệp",
    moTa: "Trình bày ca lâm sàng can thiệp mạch vành phức tạp.",
    nam: 2026, thang: 6, ngayDuKien: "2026-06-12", ngayThucTe: "2026-06-12",
    loai: "Sinh hoạt khoa học", loaiKeHoach: "Dự kiến", khoaPhong: KHOA_PHONG[3],
    nguoiPhuTrach: NGUOI_PHU_TRACH[5], diaDiem: "Khoa Tim mạch – Phòng họp",
    soNguoiDuKien: 25, soNguoiThucTe: 22,
    trangThai: "Đã thực hiện", lyDoKhongThucHien: null, ghiChu: "",
    nhatKy: [{ ngay: "2026-06-12", noi_dung: "Thực hiện thành công." }],
  },
  // Month 7
  {
    id: "14", ma: "HN-2026-014", ten: "Lớp đào tạo chăm sóc vết thương hiện đại",
    moTa: "Cập nhật kỹ thuật chăm sóc vết thương mãn tính và cấp tính.",
    nam: 2026, thang: 7, ngayDuKien: "2026-07-10", ngayThucTe: null,
    loai: "Lớp đào tạo", loaiKeHoach: "Dự kiến", khoaPhong: KHOA_PHONG[8],
    nguoiPhuTrach: NGUOI_PHU_TRACH[6], diaDiem: "Hội trường B – Tầng 4",
    soNguoiDuKien: 60, soNguoiThucTe: null,
    trangThai: "Đang chuẩn bị", lyDoKhongThucHien: null, ghiChu: "Đang xác nhận giảng viên.",
    nhatKy: [{ ngay: "2026-07-01", noi_dung: "Bắt đầu chuẩn bị tài liệu." }],
  },
  {
    id: "15", ma: "HN-2026-015", ten: "Hội thảo cập nhật hướng dẫn điều trị sốt xuất huyết",
    moTa: "Phổ biến phác đồ điều trị sốt xuất huyết Dengue mùa cao điểm.",
    nam: 2026, thang: 7, ngayDuKien: "2026-07-24", ngayThucTe: null,
    loai: "Hội thảo", loaiKeHoach: "Phát sinh", khoaPhong: KHOA_PHONG[2],
    nguoiPhuTrach: NGUOI_PHU_TRACH[4], diaDiem: "Hội trường A – Tầng 3",
    soNguoiDuKien: 80, soNguoiThucTe: null,
    trangThai: "Dự kiến", lyDoKhongThucHien: null, ghiChu: "Phát sinh theo mùa dịch.",
    nhatKy: [{ ngay: "2026-07-03", noi_dung: "Phê duyệt đề xuất tổ chức." }],
  },
  // Month 8
  {
    id: "16", ma: "HN-2026-016", ten: "Hội nghị khoa học thường niên bệnh viện",
    moTa: "Hội nghị khoa học lớn nhất trong năm, trình bày kết quả nghiên cứu.",
    nam: 2026, thang: 8, ngayDuKien: "2026-08-14", ngayThucTe: null,
    loai: "Hội nghị", loaiKeHoach: "Dự kiến", khoaPhong: KHOA_PHONG[1],
    nguoiPhuTrach: NGUOI_PHU_TRACH[1], diaDiem: "Trung tâm Hội nghị – Tầng 5",
    soNguoiDuKien: 200, soNguoiThucTe: null,
    trangThai: "Đang chuẩn bị", lyDoKhongThucHien: null, ghiChu: "Sự kiện lớn, mời 200 đại biểu.",
    nhatKy: [{ ngay: "2026-06-01", noi_dung: "Thành lập ban tổ chức." }],
  },
  {
    id: "17", ma: "HN-2026-017", ten: "Tập huấn kỹ năng giao tiếp với người bệnh",
    moTa: "Nâng cao kỹ năng giao tiếp và xử lý phàn nàn của người bệnh.",
    nam: 2026, thang: 8, ngayDuKien: "2026-08-27", ngayThucTe: null,
    loai: "Tập huấn", loaiKeHoach: "Dự kiến", khoaPhong: KHOA_PHONG[0],
    nguoiPhuTrach: NGUOI_PHU_TRACH[0], diaDiem: "Hội trường B – Tầng 4",
    soNguoiDuKien: 80, soNguoiThucTe: null,
    trangThai: "Dự kiến", lyDoKhongThucHien: null, ghiChu: "",
    nhatKy: [],
  },
  // Month 9 – peak month
  {
    id: "18", ma: "HN-2026-018", ten: "Hội nghị điều dưỡng toàn viện",
    moTa: "Tổng kết công tác điều dưỡng và triển khai kế hoạch cuối năm.",
    nam: 2026, thang: 9, ngayDuKien: "2026-09-04", ngayThucTe: null,
    loai: "Hội nghị", loaiKeHoach: "Dự kiến", khoaPhong: KHOA_PHONG[9],
    nguoiPhuTrach: NGUOI_PHU_TRACH[6], diaDiem: "Hội trường A – Tầng 3",
    soNguoiDuKien: 130, soNguoiThucTe: null,
    trangThai: "Dự kiến", lyDoKhongThucHien: null, ghiChu: "",
    nhatKy: [],
  },
  {
    id: "19", ma: "HN-2026-019", ten: "Hội thảo phòng ngừa loét tỳ đè",
    moTa: "Cập nhật thang đánh giá nguy cơ loét và biện pháp phòng ngừa.",
    nam: 2026, thang: 9, ngayDuKien: "2026-09-11", ngayThucTe: null,
    loai: "Hội thảo", loaiKeHoach: "Dự kiến", khoaPhong: KHOA_PHONG[4],
    nguoiPhuTrach: NGUOI_PHU_TRACH[2], diaDiem: "Hội trường B – Tầng 4",
    soNguoiDuKien: 60, soNguoiThucTe: null,
    trangThai: "Dự kiến", lyDoKhongThucHien: null, ghiChu: "",
    nhatKy: [],
  },
  {
    id: "20", ma: "HN-2026-020", ten: "Lớp đào tạo siêu âm cơ bản tại giường",
    moTa: "Đào tạo kỹ năng siêu âm point-of-care cho bác sĩ nội trú.",
    nam: 2026, thang: 9, ngayDuKien: "2026-09-18", ngayThucTe: null,
    loai: "Lớp đào tạo", loaiKeHoach: "Phát sinh", khoaPhong: KHOA_PHONG[5],
    nguoiPhuTrach: NGUOI_PHU_TRACH[5], diaDiem: "Phòng thực hành – Tầng 1",
    soNguoiDuKien: 24, soNguoiThucTe: null,
    trangThai: "Dự kiến", lyDoKhongThucHien: null, ghiChu: "Phát sinh từ nhu cầu của khoa.",
    nhatKy: [],
  },
  {
    id: "21", ma: "HN-2026-021", ten: "Sinh hoạt khoa học ung thư đại trực tràng",
    moTa: "Trình bày kết quả điều trị ung thư đại trực tràng giai đoạn muộn.",
    nam: 2026, thang: 9, ngayDuKien: "2026-09-25", ngayThucTe: null,
    loai: "Sinh hoạt khoa học", loaiKeHoach: "Dự kiến", khoaPhong: KHOA_PHONG[8],
    nguoiPhuTrach: NGUOI_PHU_TRACH[4], diaDiem: "Phòng họp Khoa Ngoại",
    soNguoiDuKien: 30, soNguoiThucTe: null,
    trangThai: "Dự kiến", lyDoKhongThucHien: null, ghiChu: "",
    nhatKy: [],
  },
  // Month 10
  {
    id: "22", ma: "HN-2026-022", ten: "Hội thảo quản lý đau sau phẫu thuật",
    moTa: "Phổ biến phác đồ giảm đau đa phương thức sau mổ.",
    nam: 2026, thang: 10, ngayDuKien: "2026-10-09", ngayThucTe: null,
    loai: "Hội thảo", loaiKeHoach: "Dự kiến", khoaPhong: KHOA_PHONG[8],
    nguoiPhuTrach: NGUOI_PHU_TRACH[3], diaDiem: "Hội trường A – Tầng 3",
    soNguoiDuKien: 70, soNguoiThucTe: null,
    trangThai: "Dự kiến", lyDoKhongThucHien: null, ghiChu: "",
    nhatKy: [],
  },
  {
    id: "23", ma: "HN-2026-023", ten: "Tập huấn phòng cháy chữa cháy năm 2026",
    moTa: "Diễn tập và cập nhật quy trình PCCC theo quy định mới.",
    nam: 2026, thang: 10, ngayDuKien: "2026-10-21", ngayThucTe: null,
    loai: "Tập huấn", loaiKeHoach: "Dự kiến", khoaPhong: KHOA_PHONG[0],
    nguoiPhuTrach: NGUOI_PHU_TRACH[0], diaDiem: "Sân bệnh viện",
    soNguoiDuKien: 200, soNguoiThucTe: null,
    trangThai: "Dự kiến", lyDoKhongThucHien: null, ghiChu: "Bắt buộc toàn bộ nhân viên.",
    nhatKy: [],
  },
  // Month 11
  {
    id: "24", ma: "HN-2026-024", ten: "Hội nghị sản khoa và sơ sinh",
    moTa: "Cập nhật xử trí sản khoa cấp cứu và chăm sóc sơ sinh non tháng.",
    nam: 2026, thang: 11, ngayDuKien: "2026-11-06", ngayThucTe: null,
    loai: "Hội nghị", loaiKeHoach: "Dự kiến", khoaPhong: KHOA_PHONG[9],
    nguoiPhuTrach: NGUOI_PHU_TRACH[6], diaDiem: "Hội trường B – Tầng 4",
    soNguoiDuKien: 90, soNguoiThucTe: null,
    trangThai: "Dự kiến", lyDoKhongThucHien: null, ghiChu: "",
    nhatKy: [],
  },
  {
    id: "25", ma: "HN-2026-025", ten: "Lớp đào tạo chống thất thoát thu nhập bệnh viện",
    moTa: "Hướng dẫn quy trình mã hóa bệnh ICD-10 chính xác để tránh thất thoát.",
    nam: 2026, thang: 11, ngayDuKien: "2026-11-20", ngayThucTe: null,
    loai: "Lớp đào tạo", loaiKeHoach: "Phát sinh", khoaPhong: KHOA_PHONG[0],
    nguoiPhuTrach: NGUOI_PHU_TRACH[1], diaDiem: "Phòng họp lớn – Tầng 2",
    soNguoiDuKien: 50, soNguoiThucTe: null,
    trangThai: "Dự kiến", lyDoKhongThucHien: null, ghiChu: "Theo yêu cầu của BHXH.",
    nhatKy: [],
  },
  // Month 12
  {
    id: "26", ma: "HN-2026-026", ten: "Hội nghị tổng kết cuối năm bệnh viện",
    moTa: "Tổng kết hoạt động toàn viện năm 2026, khen thưởng và định hướng 2027.",
    nam: 2026, thang: 12, ngayDuKien: "2026-12-18", ngayThucTe: null,
    loai: "Hội nghị", loaiKeHoach: "Dự kiến", khoaPhong: KHOA_PHONG[0],
    nguoiPhuTrach: NGUOI_PHU_TRACH[1], diaDiem: "Trung tâm Hội nghị – Tầng 5",
    soNguoiDuKien: 250, soNguoiThucTe: null,
    trangThai: "Dự kiến", lyDoKhongThucHien: null, ghiChu: "Sự kiện kết thúc năm.",
    nhatKy: [],
  },
  {
    id: "27", ma: "HN-2026-027", ten: "Tập huấn kế hoạch ứng phó dịch bệnh 2027",
    moTa: "Chuẩn bị kế hoạch ứng phó dịch bệnh cho năm 2027.",
    nam: 2026, thang: 12, ngayDuKien: "2026-12-08", ngayThucTe: null,
    loai: "Tập huấn", loaiKeHoach: "Dự kiến", khoaPhong: KHOA_PHONG[7],
    nguoiPhuTrach: NGUOI_PHU_TRACH[0], diaDiem: "Hội trường A – Tầng 3",
    soNguoiDuKien: 100, soNguoiThucTe: null,
    trangThai: "Dự kiến", lyDoKhongThucHien: null, ghiChu: "",
    nhatKy: [],
  },
];

// ─── 2025 data (historical – fully completed) ──────────────────────────────
export const mockHoiNghi2025: HoiNghi[] = [
  { id: "101", ma: "HN-2025-001", ten: "Tập huấn kiểm soát nhiễm khuẩn 2025", moTa: "", nam: 2025, thang: 1, ngayDuKien: "2025-01-16", ngayThucTe: "2025-01-16", loai: "Tập huấn", loaiKeHoach: "Dự kiến", khoaPhong: KHOA_PHONG[7], nguoiPhuTrach: NGUOI_PHU_TRACH[0], diaDiem: "Hội trường A", soNguoiDuKien: 80, soNguoiThucTe: 78, trangThai: "Đã thực hiện", lyDoKhongThucHien: null, ghiChu: "", nhatKy: [] },
  { id: "102", ma: "HN-2025-002", ten: "Hội thảo an toàn phẫu thuật", moTa: "", nam: 2025, thang: 2, ngayDuKien: "2025-02-20", ngayThucTe: "2025-02-20", loai: "Hội thảo", loaiKeHoach: "Dự kiến", khoaPhong: KHOA_PHONG[8], nguoiPhuTrach: NGUOI_PHU_TRACH[2], diaDiem: "Hội trường B", soNguoiDuKien: 90, soNguoiThucTe: 88, trangThai: "Đã thực hiện", lyDoKhongThucHien: null, ghiChu: "", nhatKy: [] },
  { id: "103", ma: "HN-2025-003", ten: "Sinh hoạt khoa học tim mạch Q1", moTa: "", nam: 2025, thang: 3, ngayDuKien: "2025-03-14", ngayThucTe: "2025-03-14", loai: "Sinh hoạt khoa học", loaiKeHoach: "Dự kiến", khoaPhong: KHOA_PHONG[3], nguoiPhuTrach: NGUOI_PHU_TRACH[5], diaDiem: "Phòng họp Tim mạch", soNguoiDuKien: 25, soNguoiThucTe: 24, trangThai: "Đã thực hiện", lyDoKhongThucHien: null, ghiChu: "", nhatKy: [] },
  { id: "104", ma: "HN-2025-004", ten: "Hội thảo dinh dưỡng 2025", moTa: "", nam: 2025, thang: 4, ngayDuKien: "2025-04-10", ngayThucTe: "2025-04-10", loai: "Hội thảo", loaiKeHoach: "Dự kiến", khoaPhong: KHOA_PHONG[6], nguoiPhuTrach: NGUOI_PHU_TRACH[6], diaDiem: "Hội trường B", soNguoiDuKien: 65, soNguoiThucTe: 63, trangThai: "Đã thực hiện", lyDoKhongThucHien: null, ghiChu: "", nhatKy: [] },
  { id: "105", ma: "HN-2025-005", ten: "Lớp BLS nâng cao 2025", moTa: "", nam: 2025, thang: 5, ngayDuKien: "2025-05-22", ngayThucTe: "2025-05-22", loai: "Lớp đào tạo", loaiKeHoach: "Dự kiến", khoaPhong: KHOA_PHONG[4], nguoiPhuTrach: NGUOI_PHU_TRACH[2], diaDiem: "Phòng thực hành", soNguoiDuKien: 40, soNguoiThucTe: 40, trangThai: "Đã thực hiện", lyDoKhongThucHien: null, ghiChu: "", nhatKy: [] },
  { id: "106", ma: "HN-2025-006", ten: "Hội nghị tổng kết 6 tháng 2025", moTa: "", nam: 2025, thang: 6, ngayDuKien: "2025-06-26", ngayThucTe: "2025-06-26", loai: "Hội nghị", loaiKeHoach: "Dự kiến", khoaPhong: KHOA_PHONG[0], nguoiPhuTrach: NGUOI_PHU_TRACH[1], diaDiem: "Hội trường A", soNguoiDuKien: 150, soNguoiThucTe: 148, trangThai: "Đã thực hiện", lyDoKhongThucHien: null, ghiChu: "", nhatKy: [] },
  { id: "107", ma: "HN-2025-007", ten: "Tập huấn PCCC 2025", moTa: "", nam: 2025, thang: 7, ngayDuKien: "2025-07-15", ngayThucTe: "2025-07-15", loai: "Tập huấn", loaiKeHoach: "Dự kiến", khoaPhong: KHOA_PHONG[0], nguoiPhuTrach: NGUOI_PHU_TRACH[0], diaDiem: "Sân bệnh viện", soNguoiDuKien: 200, soNguoiThucTe: 195, trangThai: "Đã thực hiện", lyDoKhongThucHien: null, ghiChu: "", nhatKy: [] },
  { id: "108", ma: "HN-2025-008", ten: "Hội nghị khoa học thường niên 2025", moTa: "", nam: 2025, thang: 8, ngayDuKien: "2025-08-21", ngayThucTe: "2025-08-21", loai: "Hội nghị", loaiKeHoach: "Dự kiến", khoaPhong: KHOA_PHONG[1], nguoiPhuTrach: NGUOI_PHU_TRACH[1], diaDiem: "Trung tâm Hội nghị", soNguoiDuKien: 200, soNguoiThucTe: 192, trangThai: "Đã thực hiện", lyDoKhongThucHien: null, ghiChu: "", nhatKy: [] },
  { id: "109", ma: "HN-2025-009", ten: "Hội thảo ung thư 2025", moTa: "", nam: 2025, thang: 9, ngayDuKien: "2025-09-11", ngayThucTe: "2025-09-11", loai: "Hội thảo", loaiKeHoach: "Dự kiến", khoaPhong: KHOA_PHONG[8], nguoiPhuTrach: NGUOI_PHU_TRACH[4], diaDiem: "Hội trường A", soNguoiDuKien: 80, soNguoiThucTe: 77, trangThai: "Đã thực hiện", lyDoKhongThucHien: null, ghiChu: "", nhatKy: [] },
  { id: "110", ma: "HN-2025-010", ten: "Tập huấn ICD-10 2025", moTa: "", nam: 2025, thang: 10, ngayDuKien: "2025-10-09", ngayThucTe: "2025-10-09", loai: "Tập huấn", loaiKeHoach: "Dự kiến", khoaPhong: KHOA_PHONG[0], nguoiPhuTrach: NGUOI_PHU_TRACH[3], diaDiem: "Phòng họp lớn", soNguoiDuKien: 50, soNguoiThucTe: 48, trangThai: "Đã thực hiện", lyDoKhongThucHien: null, ghiChu: "", nhatKy: [] },
  { id: "111", ma: "HN-2025-011", ten: "Hội nghị sản khoa 2025", moTa: "", nam: 2025, thang: 11, ngayDuKien: "2025-11-13", ngayThucTe: "2025-11-13", loai: "Hội nghị", loaiKeHoach: "Dự kiến", khoaPhong: KHOA_PHONG[9], nguoiPhuTrach: NGUOI_PHU_TRACH[6], diaDiem: "Hội trường B", soNguoiDuKien: 90, soNguoiThucTe: 86, trangThai: "Đã thực hiện", lyDoKhongThucHien: null, ghiChu: "", nhatKy: [] },
  { id: "112", ma: "HN-2025-012", ten: "Hội nghị tổng kết 2025", moTa: "", nam: 2025, thang: 12, ngayDuKien: "2025-12-19", ngayThucTe: "2025-12-19", loai: "Hội nghị", loaiKeHoach: "Dự kiến", khoaPhong: KHOA_PHONG[0], nguoiPhuTrach: NGUOI_PHU_TRACH[1], diaDiem: "Trung tâm Hội nghị", soNguoiDuKien: 250, soNguoiThucTe: 240, trangThai: "Đã thực hiện", lyDoKhongThucHien: null, ghiChu: "", nhatKy: [] },
];

// Map of all conferences by year
export const mockHoiNghiByYear: Record<number, HoiNghi[]> = {
  2025: mockHoiNghi2025,
  2026: mockHoiNghi2026,
  // 2024/2027 use 2025 data as placeholder with adjusted years
  2024: mockHoiNghi2025.map((h) => ({ ...h, nam: 2024, ma: h.ma.replace("2025", "2024"), id: "2024-" + h.id })),
  2027: [],
};

// ─── Utility: compute monthly summary from conference list ──────────────────
export function computeMonthlySummary(hoiNghiList: HoiNghi[]): ThangTomTat[] {
  return Array.from({ length: 12 }, (_, i) => {
    const thang = i + 1;
    const items = hoiNghiList.filter((h) => h.thang === thang);
    const duKien  = items.filter((h) => h.loaiKeHoach === "Dự kiến").length;
    const phatSinh = items.filter((h) => h.loaiKeHoach === "Phát sinh").length;
    const thucTe  = items.filter((h) => h.trangThai === "Đã thực hiện").length;
    const total   = duKien + phatSinh;
    const chuaThucHien = Math.max(0, total - thucTe);
    const tyLeHoanThanh = total === 0 ? 0 : Math.round((thucTe / total) * 100);
    return { thang, duKien, phatSinh, thucTe, chuaThucHien, tyLeHoanThanh, ghiChu: "" };
  });
}

export const LOAI_HOAT_DONG_OPTIONS: LoaiHoatDong[] = [
  "Hội nghị", "Hội thảo", "Lớp đào tạo", "Tập huấn", "Sinh hoạt khoa học", "Khác",
];

export const LOAI_KE_HOACH_OPTIONS: LoaiKeHoach[] = ["Dự kiến", "Phát sinh"];

export const TRANG_THAI_OPTIONS: TrangThaiHoiNghi[] = [
  "Dự kiến", "Đang chuẩn bị", "Đã thực hiện", "Không thực hiện được", "Hoãn", "Hủy",
];

export const KHOA_PHONG_OPTIONS = KHOA_PHONG;
export const NGUOI_PHU_TRACH_OPTIONS = NGUOI_PHU_TRACH;
