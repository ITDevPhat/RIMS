import type {
  DeadlineItem,
  ResearchMilestone,
  ResearchPhase,
  ResearchProject,
  ResearchStatus,
  RiskLevel,
  PhaseStatus,
} from "./types";

const DEFAULT_SPONSOR = "Nguồn kinh phí bệnh viện";

function makeProject(input: {
  id: string;
  code: string;
  name: string;
  researchType: string;
  principalInvestigator: string;
  department: string;
  managerName: string;
  startDate: string;
  plannedEndDate: string;
  actualEndDate: string | null;
  status: ResearchStatus;
  progressPercent: number;
  riskLevel: RiskLevel;
  description: string;
  currentPhase: string;
  nearestDeadline: string | null;
  ethicsStatus?: ResearchProject["ethicsStatus"];
  ethicsExpiry?: string | null;
}): ResearchProject {
  return {
    id: input.id,
    code: input.code,
    name: input.name,
    description: input.description,
    department: input.department,
    pi: input.principalInvestigator,
    principalInvestigator: input.principalInvestigator,
    managerName: input.managerName,
    sponsor: DEFAULT_SPONSOR,
    researchType: input.researchType,
    protocolNumber: `DC-${input.code}`,
    protocolVersion: "v1.0",
    ethicsStatus: input.ethicsStatus ?? "Đã duyệt",
    ethicsExpiry: input.ethicsExpiry ?? "2026-12-31",
    startDate: input.startDate,
    plannedEndDate: input.plannedEndDate,
    actualEndDate: input.actualEndDate,
    progress: input.progressPercent,
    progressPercent: input.progressPercent,
    status: input.status,
    health: input.riskLevel === "Đã hoàn thành" ? "Hoàn thành" : input.riskLevel,
    riskLevel: input.riskLevel,
    currentPhase: input.currentPhase,
    nearestDeadline: input.nearestDeadline,
  };
}

function makeModule(input: {
  id: string;
  researchProjectId: string;
  name: string;
  sortOrder: number;
  assignedTo: string;
  plannedStartDate: string;
  plannedEndDate: string;
  deadlineDate: string;
  actualStartDate: string | null;
  actualEndDate: string | null;
  progressPercent: number;
  status: PhaseStatus;
  riskLevel: RiskLevel;
  delayDays: number;
  note: string;
}): ResearchPhase {
  return {
    id: input.id,
    researchId: input.researchProjectId,
    researchProjectId: input.researchProjectId,
    order: input.sortOrder,
    sortOrder: input.sortOrder,
    name: input.name,
    assignee: input.assignedTo,
    assignedTo: input.assignedTo,
    plannedStartDate: input.plannedStartDate,
    plannedEndDate: input.plannedEndDate,
    deadline: input.deadlineDate,
    deadlineDate: input.deadlineDate,
    actualStartDate: input.actualStartDate,
    actualEndDate: input.actualEndDate,
    progress: input.progressPercent,
    progressPercent: input.progressPercent,
    status: input.status,
    riskLevel: input.riskLevel,
    delayDays: input.delayDays,
    notes: input.note,
    note: input.note,
  };
}

function makeMilestone(input: {
  id: string;
  researchProjectId: string;
  researchModuleId: string;
  name: string;
  sortOrder: number;
  assignedTo: string;
  plannedStartDate: string;
  plannedEndDate: string;
  deadlineDate: string;
  actualStartDate: string | null;
  actualEndDate: string | null;
  progressPercent: number;
  status: PhaseStatus;
  riskLevel: RiskLevel;
  delayDays: number;
  hasIssue: boolean;
  issueReason?: string;
  note: string;
}): ResearchMilestone {
  return {
    id: input.id,
    researchId: input.researchProjectId,
    researchProjectId: input.researchProjectId,
    phaseId: input.researchModuleId,
    researchModuleId: input.researchModuleId,
    order: input.sortOrder,
    sortOrder: input.sortOrder,
    name: input.name,
    assignee: input.assignedTo,
    assignedTo: input.assignedTo,
    plannedStartDate: input.plannedStartDate,
    plannedEndDate: input.plannedEndDate,
    deadline: input.deadlineDate,
    deadlineDate: input.deadlineDate,
    actualStartDate: input.actualStartDate,
    actualEndDate: input.actualEndDate,
    progress: input.progressPercent,
    progressPercent: input.progressPercent,
    status: input.status,
    risk: input.riskLevel,
    riskLevel: input.riskLevel,
    delayDays: input.delayDays,
    hasIssue: input.hasIssue,
    issueReason: input.issueReason,
    notes: input.note,
    note: input.note,
  };
}

export const mockResearchProjects: ResearchProject[] = [
  makeProject({
    id: "1",
    code: "NC-2026-001",
    name: "Nghiên cứu tỷ lệ kiểm soát huyết áp ở người bệnh tăng huyết áp điều trị ngoại trú",
    researchType: "Nghiên cứu mô tả cắt ngang",
    principalInvestigator: "BS.CKII Nguyễn Văn An",
    department: "Khoa Khám bệnh",
    managerName: "CN Trần Thị Mai",
    startDate: "2026-01-05",
    plannedEndDate: "2026-12-20",
    actualEndDate: null,
    status: "Đang thực hiện",
    progressPercent: 62,
    riskLevel: "Có nguy cơ",
    description: "Theo dõi tỷ lệ kiểm soát huyết áp, yếu tố liên quan và tuân thủ điều trị ở người bệnh tăng huyết áp.",
    currentPhase: "Thu thập số liệu",
    nearestDeadline: "2026-08-31",
  }),
  makeProject({
    id: "2",
    code: "NC-2026-002",
    name: "Đánh giá hiệu quả tư vấn dinh dưỡng cho người bệnh đái tháo đường type 2",
    researchType: "Nghiên cứu can thiệp",
    principalInvestigator: "ThS.BS Lê Minh Khang",
    department: "Khoa Nội tiết",
    managerName: "CN Phạm Ngọc Hân",
    startDate: "2026-02-01",
    plannedEndDate: "2026-10-30",
    actualEndDate: null,
    status: "Đang thực hiện",
    progressPercent: 48,
    riskLevel: "Đúng tiến độ",
    description: "Đánh giá thay đổi HbA1c, chỉ số BMI và kiến thức dinh dưỡng sau can thiệp tư vấn.",
    currentPhase: "Tư vấn dinh dưỡng",
    nearestDeadline: "2026-08-15",
    ethicsExpiry: "2026-11-30",
  }),
  makeProject({
    id: "3",
    code: "NC-2026-003",
    name: "Khảo sát thời gian chờ khám tại khoa Khám bệnh",
    researchType: "Nghiên cứu cải tiến chất lượng",
    principalInvestigator: "BS.CKI Trần Quốc Bảo",
    department: "Phòng Quản lý chất lượng",
    managerName: "CN Võ Thị Thanh",
    startDate: "2026-03-01",
    plannedEndDate: "2026-08-31",
    actualEndDate: null,
    status: "Đang thực hiện",
    progressPercent: 75,
    riskLevel: "Đúng tiến độ",
    description: "Đo lường thời gian chờ từng khâu và đề xuất giải pháp cải tiến quy trình tiếp nhận khám bệnh.",
    currentPhase: "Đề xuất cải tiến quy trình",
    nearestDeadline: "2026-07-31",
    ethicsStatus: "Không yêu cầu",
    ethicsExpiry: null,
  }),
  makeProject({
    id: "4",
    code: "NC-2026-004",
    name: "Đặc điểm lâm sàng và cận lâm sàng của người bệnh viêm phổi cộng đồng nhập viện",
    researchType: "Nghiên cứu hồi cứu",
    principalInvestigator: "TS.BS Phạm Hoàng Nam",
    department: "Khoa Nội hô hấp",
    managerName: "CN Nguyễn Thị Mỹ Linh",
    startDate: "2026-01-15",
    plannedEndDate: "2026-09-30",
    actualEndDate: null,
    status: "Đang thực hiện",
    progressPercent: 55,
    riskLevel: "Trễ hạn",
    description: "Phân tích hồ sơ bệnh án nhằm mô tả đặc điểm lâm sàng, xét nghiệm, hình ảnh học và kết quả điều trị.",
    currentPhase: "Thu thập xét nghiệm và hình ảnh học",
    nearestDeadline: "2026-07-15",
    ethicsExpiry: "2026-10-31",
  }),
  makeProject({
    id: "5",
    code: "NC-2026-005",
    name: "Đánh giá mức độ hài lòng của người bệnh nội trú",
    researchType: "Khảo sát hài lòng người bệnh",
    principalInvestigator: "BS.CKII Huỳnh Thị Lan",
    department: "Phòng Công tác xã hội",
    managerName: "CN Lê Thị Thu Hà",
    startDate: "2026-04-01",
    plannedEndDate: "2026-11-15",
    actualEndDate: null,
    status: "Chưa bắt đầu",
    progressPercent: 15,
    riskLevel: "Có nguy cơ",
    description: "Khảo sát trải nghiệm người bệnh nội trú về chăm sóc, giao tiếp, vệ sinh, dinh dưỡng và thủ tục hành chính.",
    currentPhase: "Chuẩn bị bộ câu hỏi khảo sát",
    nearestDeadline: "2026-07-20",
    ethicsStatus: "Chờ duyệt",
    ethicsExpiry: null,
  }),
];

export const PHASE_NAMES = [
  "Viết đề cương",
  "Nộp đề cương",
  "Báo cáo đợi duyệt",
  "Chỉnh sửa đề cương",
  "Duyệt đề cương",
  "Thu thập số liệu",
  "Xử lý thống kê / làm sạch số liệu",
  "Báo cáo kết quả nghiên cứu",
];

export const mockPhases: ResearchPhase[] = [
  makeModule({ id: "p1-1", researchProjectId: "1", name: "Viết đề cương", sortOrder: 1, assignedTo: "BS Nguyễn Văn Bình", plannedStartDate: "2026-01-05", plannedEndDate: "2026-02-10", deadlineDate: "2026-02-10", actualStartDate: "2026-01-06", actualEndDate: "2026-02-15", progressPercent: 100, status: "Hoàn thành trễ", riskLevel: "Hoàn thành trễ", delayDays: 5, note: "Bổ sung thêm phần tính cỡ mẫu theo góp ý của PI." }),
  makeModule({ id: "p1-2", researchProjectId: "1", name: "Nộp đề cương", sortOrder: 2, assignedTo: "CN Trần Thị Mai", plannedStartDate: "2026-02-11", plannedEndDate: "2026-02-25", deadlineDate: "2026-02-25", actualStartDate: "2026-02-16", actualEndDate: "2026-02-26", progressPercent: 100, status: "Hoàn thành trễ", riskLevel: "Hoàn thành trễ", delayDays: 1, note: "Hồ sơ nộp trễ do chờ xác nhận chữ ký của chủ nhiệm đề tài." }),
  makeModule({ id: "p1-3", researchProjectId: "1", name: "Báo cáo đợi duyệt", sortOrder: 3, assignedTo: "ThS.BS Lê Minh Khang", plannedStartDate: "2026-02-26", plannedEndDate: "2026-03-31", deadlineDate: "2026-03-31", actualStartDate: "2026-02-27", actualEndDate: "2026-03-28", progressPercent: 100, status: "Hoàn thành", riskLevel: "Đã hoàn thành", delayDays: 0, note: "Hội đồng thống nhất thông qua với yêu cầu chỉnh sửa nhỏ." }),
  makeModule({ id: "p1-4", researchProjectId: "1", name: "Chỉnh sửa đề cương", sortOrder: 4, assignedTo: "BS Nguyễn Văn Bình", plannedStartDate: "2026-04-01", plannedEndDate: "2026-04-20", deadlineDate: "2026-04-20", actualStartDate: "2026-04-02", actualEndDate: "2026-04-25", progressPercent: 100, status: "Hoàn thành trễ", riskLevel: "Hoàn thành trễ", delayDays: 5, note: "Bổ sung phiếu thu thập số liệu và tiêu chí loại trừ." }),
  makeModule({ id: "p1-5", researchProjectId: "1", name: "Duyệt đề cương", sortOrder: 5, assignedTo: "Phòng Quản lý khoa học", plannedStartDate: "2026-04-21", plannedEndDate: "2026-05-15", deadlineDate: "2026-05-15", actualStartDate: "2026-04-26", actualEndDate: "2026-05-14", progressPercent: 100, status: "Hoàn thành", riskLevel: "Đã hoàn thành", delayDays: 0, note: "Đề cương đã được phê duyệt triển khai." }),
  makeModule({ id: "p1-6", researchProjectId: "1", name: "Thu thập số liệu", sortOrder: 6, assignedTo: "CN Phạm Ngọc Hân", plannedStartDate: "2026-05-16", plannedEndDate: "2026-08-31", deadlineDate: "2026-08-31", actualStartDate: "2026-05-20", actualEndDate: null, progressPercent: 58, status: "Đang thực hiện", riskLevel: "Có nguy cơ", delayDays: 0, note: "Số lượng bệnh nhân đạt tiêu chí thấp hơn dự kiến trong tháng 6." }),
  makeModule({ id: "p1-7", researchProjectId: "1", name: "Xử lý thống kê / làm sạch số liệu", sortOrder: 7, assignedTo: "CN Võ Thị Thanh", plannedStartDate: "2026-09-01", plannedEndDate: "2026-10-15", deadlineDate: "2026-10-15", actualStartDate: null, actualEndDate: null, progressPercent: 0, status: "Chưa bắt đầu", riskLevel: "Đúng tiến độ", delayDays: 0, note: "Chờ hoàn tất thu thập số liệu." }),
  makeModule({ id: "p1-8", researchProjectId: "1", name: "Báo cáo kết quả nghiên cứu", sortOrder: 8, assignedTo: "BS.CKII Nguyễn Văn An", plannedStartDate: "2026-10-16", plannedEndDate: "2026-12-20", deadlineDate: "2026-12-20", actualStartDate: null, actualEndDate: null, progressPercent: 0, status: "Chưa bắt đầu", riskLevel: "Đúng tiến độ", delayDays: 0, note: "Sẽ thực hiện sau khi chốt phân tích thống kê." }),

  makeModule({ id: "p2-1", researchProjectId: "2", name: "Hoàn thiện tài liệu can thiệp", sortOrder: 1, assignedTo: "ThS.BS Lê Minh Khang", plannedStartDate: "2026-02-01", plannedEndDate: "2026-03-05", deadlineDate: "2026-03-05", actualStartDate: "2026-02-01", actualEndDate: "2026-03-03", progressPercent: 100, status: "Hoàn thành", riskLevel: "Đã hoàn thành", delayDays: 0, note: "Tài liệu tư vấn đã thống nhất với khoa Dinh dưỡng." }),
  makeModule({ id: "p2-2", researchProjectId: "2", name: "Tập huấn điều dưỡng tư vấn", sortOrder: 2, assignedTo: "CN Phạm Ngọc Hân", plannedStartDate: "2026-03-06", plannedEndDate: "2026-03-31", deadlineDate: "2026-03-31", actualStartDate: "2026-03-07", actualEndDate: "2026-04-02", progressPercent: 100, status: "Hoàn thành trễ", riskLevel: "Hoàn thành trễ", delayDays: 2, note: "Một buổi tập huấn phải dời do lịch trực khoa." }),
  makeModule({ id: "p2-3", researchProjectId: "2", name: "Tuyển chọn người bệnh", sortOrder: 3, assignedTo: "BS Nguyễn Thị Diệu", plannedStartDate: "2026-04-01", plannedEndDate: "2026-05-31", deadlineDate: "2026-05-31", actualStartDate: "2026-04-01", actualEndDate: "2026-05-30", progressPercent: 100, status: "Hoàn thành", riskLevel: "Đã hoàn thành", delayDays: 0, note: "Đủ số lượng người bệnh tham gia can thiệp." }),
  makeModule({ id: "p2-4", researchProjectId: "2", name: "Tư vấn dinh dưỡng", sortOrder: 4, assignedTo: "CN Phạm Ngọc Hân", plannedStartDate: "2026-06-01", plannedEndDate: "2026-08-15", deadlineDate: "2026-08-15", actualStartDate: "2026-06-03", actualEndDate: null, progressPercent: 52, status: "Đang thực hiện", riskLevel: "Đúng tiến độ", delayDays: 0, note: "Các buổi tư vấn theo lịch tái khám hằng tuần." }),
  makeModule({ id: "p2-5", researchProjectId: "2", name: "Đánh giá sau can thiệp", sortOrder: 5, assignedTo: "KTV Xét nghiệm Nguyễn Hữu Phúc", plannedStartDate: "2026-08-16", plannedEndDate: "2026-09-30", deadlineDate: "2026-09-30", actualStartDate: null, actualEndDate: null, progressPercent: 0, status: "Chưa bắt đầu", riskLevel: "Đúng tiến độ", delayDays: 0, note: "Chờ hoàn tất giai đoạn tư vấn." }),
  makeModule({ id: "p2-6", researchProjectId: "2", name: "Phân tích HbA1c và báo cáo", sortOrder: 6, assignedTo: "ThS.BS Lê Minh Khang", plannedStartDate: "2026-10-01", plannedEndDate: "2026-10-30", deadlineDate: "2026-10-30", actualStartDate: null, actualEndDate: null, progressPercent: 0, status: "Chưa bắt đầu", riskLevel: "Đúng tiến độ", delayDays: 0, note: "Dự kiến tổng hợp sau khi có kết quả xét nghiệm sau can thiệp." }),

  makeModule({ id: "p3-1", researchProjectId: "3", name: "Thiết kế biểu mẫu đo thời gian", sortOrder: 1, assignedTo: "CN Võ Thị Thanh", plannedStartDate: "2026-03-01", plannedEndDate: "2026-03-20", deadlineDate: "2026-03-20", actualStartDate: "2026-03-01", actualEndDate: "2026-03-18", progressPercent: 100, status: "Hoàn thành", riskLevel: "Đã hoàn thành", delayDays: 0, note: "Biểu mẫu phân tách rõ thời điểm đăng ký, chờ gọi số và vào phòng khám." }),
  makeModule({ id: "p3-2", researchProjectId: "3", name: "Khảo sát luồng tiếp nhận", sortOrder: 2, assignedTo: "BS.CKI Trần Quốc Bảo", plannedStartDate: "2026-03-21", plannedEndDate: "2026-04-30", deadlineDate: "2026-04-30", actualStartDate: "2026-03-22", actualEndDate: "2026-04-29", progressPercent: 100, status: "Hoàn thành", riskLevel: "Đã hoàn thành", delayDays: 0, note: "Đã khảo sát đủ các khung giờ cao điểm." }),
  makeModule({ id: "p3-3", researchProjectId: "3", name: "Thu thập thời gian chờ", sortOrder: 3, assignedTo: "Tổ Quản lý chất lượng", plannedStartDate: "2026-05-01", plannedEndDate: "2026-06-15", deadlineDate: "2026-06-15", actualStartDate: "2026-05-02", actualEndDate: "2026-06-14", progressPercent: 100, status: "Hoàn thành", riskLevel: "Đã hoàn thành", delayDays: 0, note: "Ghi nhận 1.250 lượt khám ngoại trú." }),
  makeModule({ id: "p3-4", researchProjectId: "3", name: "Phân tích điểm nghẽn", sortOrder: 4, assignedTo: "CN Võ Thị Thanh", plannedStartDate: "2026-06-16", plannedEndDate: "2026-07-15", deadlineDate: "2026-07-15", actualStartDate: "2026-06-16", actualEndDate: null, progressPercent: 70, status: "Đang thực hiện", riskLevel: "Đúng tiến độ", delayDays: 0, note: "Đang phân nhóm theo ngày trong tuần và chuyên khoa." }),
  makeModule({ id: "p3-5", researchProjectId: "3", name: "Đề xuất cải tiến quy trình", sortOrder: 5, assignedTo: "Phòng Quản lý chất lượng", plannedStartDate: "2026-07-16", plannedEndDate: "2026-08-31", deadlineDate: "2026-08-31", actualStartDate: null, actualEndDate: null, progressPercent: 0, status: "Chưa bắt đầu", riskLevel: "Đúng tiến độ", delayDays: 0, note: "Sẽ trình Ban giám đốc sau khi hoàn tất phân tích." }),

  makeModule({ id: "p4-1", researchProjectId: "4", name: "Trích lục danh sách bệnh án", sortOrder: 1, assignedTo: "CN Nguyễn Thị Mỹ Linh", plannedStartDate: "2026-01-15", plannedEndDate: "2026-02-15", deadlineDate: "2026-02-15", actualStartDate: "2026-01-16", actualEndDate: "2026-02-20", progressPercent: 100, status: "Hoàn thành trễ", riskLevel: "Hoàn thành trễ", delayDays: 5, note: "Một số hồ sơ lưu kho cần bổ sung mã ICD." }),
  makeModule({ id: "p4-2", researchProjectId: "4", name: "Xây dựng bộ biến số hồi cứu", sortOrder: 2, assignedTo: "TS.BS Phạm Hoàng Nam", plannedStartDate: "2026-02-16", plannedEndDate: "2026-03-15", deadlineDate: "2026-03-15", actualStartDate: "2026-02-21", actualEndDate: "2026-03-18", progressPercent: 100, status: "Hoàn thành trễ", riskLevel: "Hoàn thành trễ", delayDays: 3, note: "Bổ sung biến về thở oxy và kháng sinh ban đầu." }),
  makeModule({ id: "p4-3", researchProjectId: "4", name: "Thu thập xét nghiệm và hình ảnh học", sortOrder: 3, assignedTo: "BS Trần Hải Đăng", plannedStartDate: "2026-03-16", plannedEndDate: "2026-06-30", deadlineDate: "2026-06-30", actualStartDate: "2026-03-20", actualEndDate: null, progressPercent: 64, status: "Trễ hạn", riskLevel: "Trễ hạn", delayDays: 12, note: "Thiếu thông tin phim X-quang ở một nhóm hồ sơ chuyển viện." }),
  makeModule({ id: "p4-4", researchProjectId: "4", name: "Đối chiếu kết quả điều trị", sortOrder: 4, assignedTo: "ĐD Nguyễn Thảo Vy", plannedStartDate: "2026-07-01", plannedEndDate: "2026-07-31", deadlineDate: "2026-07-31", actualStartDate: null, actualEndDate: null, progressPercent: 0, status: "Chưa bắt đầu", riskLevel: "Có nguy cơ", delayDays: 0, note: "Phụ thuộc tiến độ hoàn tất trích xuất hồ sơ." }),
  makeModule({ id: "p4-5", researchProjectId: "4", name: "Phân tích đặc điểm lâm sàng", sortOrder: 5, assignedTo: "TS.BS Phạm Hoàng Nam", plannedStartDate: "2026-08-01", plannedEndDate: "2026-08-31", deadlineDate: "2026-08-31", actualStartDate: null, actualEndDate: null, progressPercent: 0, status: "Chưa bắt đầu", riskLevel: "Có nguy cơ", delayDays: 0, note: "Cần dữ liệu đầu vào đầy đủ trước khi phân tích." }),
  makeModule({ id: "p4-6", researchProjectId: "4", name: "Viết báo cáo hồi cứu", sortOrder: 6, assignedTo: "TS.BS Phạm Hoàng Nam", plannedStartDate: "2026-09-01", plannedEndDate: "2026-09-30", deadlineDate: "2026-09-30", actualStartDate: null, actualEndDate: null, progressPercent: 0, status: "Chưa bắt đầu", riskLevel: "Có nguy cơ", delayDays: 0, note: "Rủi ro trễ nếu giai đoạn thu thập hồ sơ kéo dài." }),

  makeModule({ id: "p5-1", researchProjectId: "5", name: "Xây dựng bộ câu hỏi khảo sát", sortOrder: 1, assignedTo: "CN Lê Thị Thu Hà", plannedStartDate: "2026-04-01", plannedEndDate: "2026-05-15", deadlineDate: "2026-05-15", actualStartDate: "2026-04-05", actualEndDate: null, progressPercent: 45, status: "Cần chỉnh sửa", riskLevel: "Có nguy cơ", delayDays: 0, note: "Cần điều chỉnh câu hỏi về vệ sinh buồng bệnh theo góp ý của điều dưỡng trưởng." }),
  makeModule({ id: "p5-2", researchProjectId: "5", name: "Xin ý kiến hội đồng đạo đức", sortOrder: 2, assignedTo: "Phòng Công tác xã hội", plannedStartDate: "2026-05-16", plannedEndDate: "2026-06-30", deadlineDate: "2026-06-30", actualStartDate: "2026-05-20", actualEndDate: null, progressPercent: 20, status: "Chờ duyệt", riskLevel: "Có nguy cơ", delayDays: 3, note: "Đang chờ lịch họp hội đồng đạo đức." }),
  makeModule({ id: "p5-3", researchProjectId: "5", name: "Tập huấn khảo sát viên", sortOrder: 3, assignedTo: "CN Lê Thị Thu Hà", plannedStartDate: "2026-07-01", plannedEndDate: "2026-07-20", deadlineDate: "2026-07-20", actualStartDate: null, actualEndDate: null, progressPercent: 0, status: "Chưa bắt đầu", riskLevel: "Có nguy cơ", delayDays: 0, note: "Chưa thể triển khai trước khi đề cương được duyệt." }),
  makeModule({ id: "p5-4", researchProjectId: "5", name: "Khảo sát người bệnh nội trú", sortOrder: 4, assignedTo: "Tổ Công tác xã hội", plannedStartDate: "2026-07-21", plannedEndDate: "2026-10-15", deadlineDate: "2026-10-15", actualStartDate: null, actualEndDate: null, progressPercent: 0, status: "Chưa bắt đầu", riskLevel: "Đúng tiến độ", delayDays: 0, note: "Dự kiến khảo sát tại các khoa nội, ngoại, sản và nhi." }),
  makeModule({ id: "p5-5", researchProjectId: "5", name: "Tổng hợp và báo cáo hài lòng", sortOrder: 5, assignedTo: "BS.CKII Huỳnh Thị Lan", plannedStartDate: "2026-10-16", plannedEndDate: "2026-11-15", deadlineDate: "2026-11-15", actualStartDate: null, actualEndDate: null, progressPercent: 0, status: "Chưa bắt đầu", riskLevel: "Đúng tiến độ", delayDays: 0, note: "Sẽ báo cáo theo nhóm tiêu chí trải nghiệm người bệnh." }),
];

export const mockMilestones: ResearchMilestone[] = [
  makeMilestone({ id: "ms1-1", researchProjectId: "1", researchModuleId: "p1-1", name: "Xác định câu hỏi nghiên cứu", sortOrder: 1, assignedTo: "BS Nguyễn Văn Bình", plannedStartDate: "2026-01-05", plannedEndDate: "2026-01-10", deadlineDate: "2026-01-10", actualStartDate: "2026-01-06", actualEndDate: "2026-01-10", progressPercent: 100, status: "Hoàn thành", riskLevel: "Đã hoàn thành", delayDays: 0, hasIssue: false, note: "Đã thống nhất câu hỏi nghiên cứu với chủ nhiệm đề tài." }),
  makeMilestone({ id: "ms1-2", researchProjectId: "1", researchModuleId: "p1-1", name: "Tổng quan tài liệu", sortOrder: 2, assignedTo: "BS Nguyễn Văn Bình", plannedStartDate: "2026-01-11", plannedEndDate: "2026-01-20", deadlineDate: "2026-01-20", actualStartDate: "2026-01-11", actualEndDate: "2026-01-22", progressPercent: 100, status: "Hoàn thành trễ", riskLevel: "Hoàn thành trễ", delayDays: 2, hasIssue: false, note: "Bổ sung tài liệu hướng dẫn điều trị tăng huyết áp mới." }),
  makeMilestone({ id: "ms1-3", researchProjectId: "1", researchModuleId: "p1-1", name: "Xây dựng mục tiêu và biến số nghiên cứu", sortOrder: 3, assignedTo: "BS Nguyễn Văn Bình", plannedStartDate: "2026-01-21", plannedEndDate: "2026-01-28", deadlineDate: "2026-01-28", actualStartDate: "2026-01-23", actualEndDate: "2026-01-30", progressPercent: 100, status: "Hoàn thành trễ", riskLevel: "Hoàn thành trễ", delayDays: 2, hasIssue: false, note: "Đã tách biến tuân thủ thuốc và tái khám." }),
  makeMilestone({ id: "ms1-4", researchProjectId: "1", researchModuleId: "p1-1", name: "Tính cỡ mẫu và phương pháp chọn mẫu", sortOrder: 4, assignedTo: "BS Nguyễn Văn Bình", plannedStartDate: "2026-01-29", plannedEndDate: "2026-02-05", deadlineDate: "2026-02-05", actualStartDate: "2026-01-31", actualEndDate: "2026-02-10", progressPercent: 100, status: "Hoàn thành trễ", riskLevel: "Hoàn thành trễ", delayDays: 5, hasIssue: true, issueReason: "Cần bổ sung chữ ký xác nhận của khoa", note: "Cỡ mẫu được hiệu chỉnh theo tỷ lệ bỏ cuộc dự kiến." }),
  makeMilestone({ id: "ms1-5", researchProjectId: "1", researchModuleId: "p1-1", name: "Hoàn thiện bản đề cương lần cuối", sortOrder: 5, assignedTo: "BS Nguyễn Văn Bình", plannedStartDate: "2026-02-06", plannedEndDate: "2026-02-10", deadlineDate: "2026-02-10", actualStartDate: "2026-02-11", actualEndDate: "2026-02-15", progressPercent: 100, status: "Hoàn thành trễ", riskLevel: "Hoàn thành trễ", delayDays: 5, hasIssue: false, note: "Đã gửi bản đề cương hoàn chỉnh cho thư ký nghiên cứu." }),

  makeMilestone({ id: "ms2-1", researchProjectId: "1", researchModuleId: "p1-2", name: "Rà soát danh mục hồ sơ nộp", sortOrder: 1, assignedTo: "CN Trần Thị Mai", plannedStartDate: "2026-02-11", plannedEndDate: "2026-02-15", deadlineDate: "2026-02-15", actualStartDate: "2026-02-16", actualEndDate: "2026-02-18", progressPercent: 100, status: "Hoàn thành trễ", riskLevel: "Hoàn thành trễ", delayDays: 3, hasIssue: false, note: "Đã kiểm tra đủ đề cương, phiếu thông tin và biểu mẫu thu thập." }),
  makeMilestone({ id: "ms2-2", researchProjectId: "1", researchModuleId: "p1-2", name: "Bổ sung chữ ký chủ nhiệm đề tài", sortOrder: 2, assignedTo: "CN Trần Thị Mai", plannedStartDate: "2026-02-16", plannedEndDate: "2026-02-20", deadlineDate: "2026-02-20", actualStartDate: "2026-02-19", actualEndDate: "2026-02-24", progressPercent: 100, status: "Hoàn thành trễ", riskLevel: "Hoàn thành trễ", delayDays: 4, hasIssue: true, issueReason: "Cần bổ sung chữ ký xác nhận của khoa", note: "Chờ lịch công tác của chủ nhiệm đề tài." }),
  makeMilestone({ id: "ms2-3", researchProjectId: "1", researchModuleId: "p1-2", name: "Nộp hồ sơ lên Phòng Quản lý khoa học", sortOrder: 3, assignedTo: "CN Trần Thị Mai", plannedStartDate: "2026-02-21", plannedEndDate: "2026-02-25", deadlineDate: "2026-02-25", actualStartDate: "2026-02-24", actualEndDate: "2026-02-26", progressPercent: 100, status: "Hoàn thành trễ", riskLevel: "Hoàn thành trễ", delayDays: 1, hasIssue: false, note: "Hồ sơ đã được tiếp nhận." }),

  makeMilestone({ id: "ms3-1", researchProjectId: "1", researchModuleId: "p1-3", name: "Chuẩn bị slide báo cáo đề cương", sortOrder: 1, assignedTo: "ThS.BS Lê Minh Khang", plannedStartDate: "2026-02-26", plannedEndDate: "2026-03-08", deadlineDate: "2026-03-08", actualStartDate: "2026-02-27", actualEndDate: "2026-03-07", progressPercent: 100, status: "Hoàn thành", riskLevel: "Đã hoàn thành", delayDays: 0, hasIssue: false, note: "Slide tập trung vào phương pháp chọn mẫu và biến số chính." }),
  makeMilestone({ id: "ms3-2", researchProjectId: "1", researchModuleId: "p1-3", name: "Báo cáo trước hội đồng khoa học", sortOrder: 2, assignedTo: "BS.CKII Nguyễn Văn An", plannedStartDate: "2026-03-09", plannedEndDate: "2026-03-18", deadlineDate: "2026-03-18", actualStartDate: "2026-03-10", actualEndDate: "2026-03-18", progressPercent: 100, status: "Hoàn thành", riskLevel: "Đã hoàn thành", delayDays: 0, hasIssue: false, note: "Hội đồng yêu cầu chỉnh sửa nhỏ ở tiêu chí loại trừ." }),
  makeMilestone({ id: "ms3-3", researchProjectId: "1", researchModuleId: "p1-3", name: "Nhận biên bản góp ý của hội đồng", sortOrder: 3, assignedTo: "CN Trần Thị Mai", plannedStartDate: "2026-03-19", plannedEndDate: "2026-03-31", deadlineDate: "2026-03-31", actualStartDate: "2026-03-19", actualEndDate: "2026-03-28", progressPercent: 100, status: "Hoàn thành", riskLevel: "Đã hoàn thành", delayDays: 0, hasIssue: false, note: "Biên bản đã chuyển cho nhóm viết đề cương." }),

  makeMilestone({ id: "ms4-1", researchProjectId: "1", researchModuleId: "p1-4", name: "Bổ sung tiêu chí loại trừ", sortOrder: 1, assignedTo: "BS Nguyễn Văn Bình", plannedStartDate: "2026-04-01", plannedEndDate: "2026-04-07", deadlineDate: "2026-04-07", actualStartDate: "2026-04-02", actualEndDate: "2026-04-08", progressPercent: 100, status: "Hoàn thành trễ", riskLevel: "Hoàn thành trễ", delayDays: 1, hasIssue: false, note: "Đã bổ sung nhóm người bệnh có biến chứng cấp." }),
  makeMilestone({ id: "ms4-2", researchProjectId: "1", researchModuleId: "p1-4", name: "Cập nhật phiếu thu thập số liệu", sortOrder: 2, assignedTo: "BS Nguyễn Văn Bình", plannedStartDate: "2026-04-08", plannedEndDate: "2026-04-14", deadlineDate: "2026-04-14", actualStartDate: "2026-04-09", actualEndDate: "2026-04-20", progressPercent: 100, status: "Hoàn thành trễ", riskLevel: "Hoàn thành trễ", delayDays: 6, hasIssue: true, issueReason: "Dữ liệu nhập chưa thống nhất giữa các điều dưỡng", note: "Chuẩn hóa cách ghi nhận huyết áp lần 1 và lần 2." }),
  makeMilestone({ id: "ms4-3", researchProjectId: "1", researchModuleId: "p1-4", name: "Gửi bản chỉnh sửa cho thư ký hội đồng", sortOrder: 3, assignedTo: "CN Trần Thị Mai", plannedStartDate: "2026-04-15", plannedEndDate: "2026-04-20", deadlineDate: "2026-04-20", actualStartDate: "2026-04-21", actualEndDate: "2026-04-25", progressPercent: 100, status: "Hoàn thành trễ", riskLevel: "Hoàn thành trễ", delayDays: 5, hasIssue: false, note: "Bản chỉnh sửa được gửi kèm bảng giải trình góp ý." }),

  makeMilestone({ id: "ms5-1", researchProjectId: "1", researchModuleId: "p1-5", name: "Kiểm tra hồ sơ sau chỉnh sửa", sortOrder: 1, assignedTo: "Phòng Quản lý khoa học", plannedStartDate: "2026-04-21", plannedEndDate: "2026-04-30", deadlineDate: "2026-04-30", actualStartDate: "2026-04-26", actualEndDate: "2026-05-02", progressPercent: 100, status: "Hoàn thành trễ", riskLevel: "Hoàn thành trễ", delayDays: 2, hasIssue: false, note: "Hồ sơ đủ điều kiện trình ký phê duyệt." }),
  makeMilestone({ id: "ms5-2", researchProjectId: "1", researchModuleId: "p1-5", name: "Trình ký quyết định phê duyệt", sortOrder: 2, assignedTo: "Phòng Quản lý khoa học", plannedStartDate: "2026-05-01", plannedEndDate: "2026-05-10", deadlineDate: "2026-05-10", actualStartDate: "2026-05-03", actualEndDate: "2026-05-10", progressPercent: 100, status: "Hoàn thành", riskLevel: "Đã hoàn thành", delayDays: 0, hasIssue: false, note: "Quyết định phê duyệt đã được ký." }),
  makeMilestone({ id: "ms5-3", researchProjectId: "1", researchModuleId: "p1-5", name: "Thông báo triển khai nghiên cứu", sortOrder: 3, assignedTo: "CN Trần Thị Mai", plannedStartDate: "2026-05-11", plannedEndDate: "2026-05-15", deadlineDate: "2026-05-15", actualStartDate: "2026-05-11", actualEndDate: "2026-05-14", progressPercent: 100, status: "Hoàn thành", riskLevel: "Đã hoàn thành", delayDays: 0, hasIssue: false, note: "Đã thông báo đến Khoa Khám bệnh và điều dưỡng phụ trách." }),

  makeMilestone({ id: "ms6-1", researchProjectId: "1", researchModuleId: "p1-6", name: "Chuẩn bị danh sách người bệnh đủ tiêu chuẩn", sortOrder: 1, assignedTo: "CN Phạm Ngọc Hân", plannedStartDate: "2026-05-16", plannedEndDate: "2026-05-31", deadlineDate: "2026-05-31", actualStartDate: "2026-05-20", actualEndDate: "2026-06-02", progressPercent: 100, status: "Hoàn thành trễ", riskLevel: "Hoàn thành trễ", delayDays: 2, hasIssue: true, issueReason: "Người bệnh tái khám không đúng hẹn", note: "Danh sách ban đầu thấp hơn dự kiến do nhiều lịch tái khám dời sang tháng 6." }),
  makeMilestone({ id: "ms6-2", researchProjectId: "1", researchModuleId: "p1-6", name: "Kiểm tra hồ sơ bệnh án ngoại trú", sortOrder: 2, assignedTo: "ĐD Nguyễn Thị Hồng", plannedStartDate: "2026-06-01", plannedEndDate: "2026-06-30", deadlineDate: "2026-06-30", actualStartDate: "2026-06-03", actualEndDate: null, progressPercent: 70, status: "Đang thực hiện", riskLevel: "Có nguy cơ", delayDays: 0, hasIssue: true, issueReason: "Thiếu thông tin trong hồ sơ bệnh án", note: "Một số hồ sơ thiếu chỉ số huyết áp lần tái khám gần nhất." }),
  makeMilestone({ id: "ms6-3", researchProjectId: "1", researchModuleId: "p1-6", name: "Ghi nhận chỉ số huyết áp và thuốc đang sử dụng", sortOrder: 3, assignedTo: "CN Phạm Ngọc Hân", plannedStartDate: "2026-07-01", plannedEndDate: "2026-07-31", deadlineDate: "2026-07-31", actualStartDate: "2026-07-01", actualEndDate: null, progressPercent: 45, status: "Đang thực hiện", riskLevel: "Có nguy cơ", delayDays: 0, hasIssue: true, issueReason: "Người bệnh tái khám không đúng hẹn", note: "Cần gọi nhắc một số người bệnh theo lịch hẹn." }),
  makeMilestone({ id: "ms6-4", researchProjectId: "1", researchModuleId: "p1-6", name: "Nhập dữ liệu vào biểu mẫu nghiên cứu", sortOrder: 4, assignedTo: "ĐD Lê Minh Tâm", plannedStartDate: "2026-07-15", plannedEndDate: "2026-08-20", deadlineDate: "2026-08-20", actualStartDate: "2026-07-16", actualEndDate: null, progressPercent: 30, status: "Đang thực hiện", riskLevel: "Có nguy cơ", delayDays: 0, hasIssue: true, issueReason: "Dữ liệu nhập chưa thống nhất giữa các điều dưỡng", note: "Đang chuẩn hóa mã thuốc và đơn vị liều dùng." }),
  makeMilestone({ id: "ms6-5", researchProjectId: "1", researchModuleId: "p1-6", name: "Kiểm tra thiếu dữ liệu định kỳ", sortOrder: 5, assignedTo: "CN Võ Thị Thanh", plannedStartDate: "2026-08-01", plannedEndDate: "2026-08-31", deadlineDate: "2026-08-31", actualStartDate: null, actualEndDate: null, progressPercent: 0, status: "Chưa bắt đầu", riskLevel: "Đúng tiến độ", delayDays: 0, hasIssue: false, note: "Sẽ rà soát theo từng tuần trong tháng 8." }),

  makeMilestone({ id: "ms7-1", researchProjectId: "1", researchModuleId: "p1-7", name: "Khóa bộ dữ liệu sơ bộ", sortOrder: 1, assignedTo: "CN Võ Thị Thanh", plannedStartDate: "2026-09-01", plannedEndDate: "2026-09-10", deadlineDate: "2026-09-10", actualStartDate: null, actualEndDate: null, progressPercent: 0, status: "Chưa bắt đầu", riskLevel: "Đúng tiến độ", delayDays: 0, hasIssue: false, note: "Chờ hoàn tất thu thập dữ liệu." }),
  makeMilestone({ id: "ms7-2", researchProjectId: "1", researchModuleId: "p1-7", name: "Làm sạch biến huyết áp và thuốc", sortOrder: 2, assignedTo: "CN Võ Thị Thanh", plannedStartDate: "2026-09-11", plannedEndDate: "2026-09-25", deadlineDate: "2026-09-25", actualStartDate: null, actualEndDate: null, progressPercent: 0, status: "Chưa bắt đầu", riskLevel: "Đúng tiến độ", delayDays: 0, hasIssue: false, note: "Kiểm tra giá trị ngoại lai và dữ liệu thiếu." }),
  makeMilestone({ id: "ms7-3", researchProjectId: "1", researchModuleId: "p1-7", name: "Phân tích tỷ lệ kiểm soát huyết áp", sortOrder: 3, assignedTo: "CN Võ Thị Thanh", plannedStartDate: "2026-09-26", plannedEndDate: "2026-10-15", deadlineDate: "2026-10-15", actualStartDate: null, actualEndDate: null, progressPercent: 0, status: "Chưa bắt đầu", riskLevel: "Đúng tiến độ", delayDays: 0, hasIssue: false, note: "Phân tích theo nhóm tuổi, giới và tuân thủ điều trị." }),

  makeMilestone({ id: "ms8-1", researchProjectId: "1", researchModuleId: "p1-8", name: "Viết kết quả chính", sortOrder: 1, assignedTo: "BS.CKII Nguyễn Văn An", plannedStartDate: "2026-10-16", plannedEndDate: "2026-11-05", deadlineDate: "2026-11-05", actualStartDate: null, actualEndDate: null, progressPercent: 0, status: "Chưa bắt đầu", riskLevel: "Đúng tiến độ", delayDays: 0, hasIssue: false, note: "Dựa trên bảng phân tích thống kê cuối cùng." }),
  makeMilestone({ id: "ms8-2", researchProjectId: "1", researchModuleId: "p1-8", name: "Hoàn thiện bàn luận và khuyến nghị", sortOrder: 2, assignedTo: "BS.CKII Nguyễn Văn An", plannedStartDate: "2026-11-06", plannedEndDate: "2026-11-25", deadlineDate: "2026-11-25", actualStartDate: null, actualEndDate: null, progressPercent: 0, status: "Chưa bắt đầu", riskLevel: "Đúng tiến độ", delayDays: 0, hasIssue: false, note: "So sánh với các nghiên cứu trong nước về kiểm soát huyết áp." }),
  makeMilestone({ id: "ms8-3", researchProjectId: "1", researchModuleId: "p1-8", name: "Nộp báo cáo kết quả nghiên cứu", sortOrder: 3, assignedTo: "CN Trần Thị Mai", plannedStartDate: "2026-11-26", plannedEndDate: "2026-12-20", deadlineDate: "2026-12-20", actualStartDate: null, actualEndDate: null, progressPercent: 0, status: "Chưa bắt đầu", riskLevel: "Đúng tiến độ", delayDays: 0, hasIssue: false, note: "Nộp báo cáo cho Phòng Quản lý khoa học." }),

  makeMilestone({ id: "ms2p-1", researchProjectId: "2", researchModuleId: "p2-4", name: "Tư vấn nhóm người bệnh tháng 6", sortOrder: 1, assignedTo: "CN Phạm Ngọc Hân", plannedStartDate: "2026-06-01", plannedEndDate: "2026-06-30", deadlineDate: "2026-06-30", actualStartDate: "2026-06-03", actualEndDate: "2026-06-30", progressPercent: 100, status: "Hoàn thành", riskLevel: "Đã hoàn thành", delayDays: 0, hasIssue: false, note: "Đã tư vấn 42 người bệnh." }),
  makeMilestone({ id: "ms2p-2", researchProjectId: "2", researchModuleId: "p2-4", name: "Theo dõi nhật ký ăn uống", sortOrder: 2, assignedTo: "ĐD Trương Mỹ Duyên", plannedStartDate: "2026-07-01", plannedEndDate: "2026-07-31", deadlineDate: "2026-07-31", actualStartDate: "2026-07-01", actualEndDate: null, progressPercent: 55, status: "Đang thực hiện", riskLevel: "Đúng tiến độ", delayDays: 0, hasIssue: false, note: "Người bệnh gửi nhật ký qua lần tái khám." }),
  makeMilestone({ id: "ms3p-1", researchProjectId: "3", researchModuleId: "p3-4", name: "Phân tích thời gian chờ tại quầy tiếp nhận", sortOrder: 1, assignedTo: "CN Võ Thị Thanh", plannedStartDate: "2026-06-16", plannedEndDate: "2026-06-30", deadlineDate: "2026-06-30", actualStartDate: "2026-06-16", actualEndDate: "2026-06-29", progressPercent: 100, status: "Hoàn thành", riskLevel: "Đã hoàn thành", delayDays: 0, hasIssue: false, note: "Thời gian chờ tăng rõ vào khung 7-9 giờ." }),
  makeMilestone({ id: "ms3p-2", researchProjectId: "3", researchModuleId: "p3-4", name: "Phân tích thời gian chờ trước phòng khám", sortOrder: 2, assignedTo: "BS.CKI Trần Quốc Bảo", plannedStartDate: "2026-07-01", plannedEndDate: "2026-07-15", deadlineDate: "2026-07-15", actualStartDate: "2026-07-01", actualEndDate: null, progressPercent: 45, status: "Đang thực hiện", riskLevel: "Đúng tiến độ", delayDays: 0, hasIssue: false, note: "Đang đối chiếu theo từng chuyên khoa." }),
  makeMilestone({ id: "ms4p-1", researchProjectId: "4", researchModuleId: "p4-3", name: "Đối chiếu kết quả X-quang ngực", sortOrder: 1, assignedTo: "BS Trần Hải Đăng", plannedStartDate: "2026-04-01", plannedEndDate: "2026-05-31", deadlineDate: "2026-05-31", actualStartDate: "2026-04-02", actualEndDate: null, progressPercent: 80, status: "Trễ hạn", riskLevel: "Trễ hạn", delayDays: 12, hasIssue: true, issueReason: "Thiếu thông tin trong hồ sơ bệnh án", note: "Một số hồ sơ không có bản mô tả phim lưu trong hệ thống." }),
  makeMilestone({ id: "ms4p-2", researchProjectId: "4", researchModuleId: "p4-3", name: "Nhập kết quả xét nghiệm ban đầu", sortOrder: 2, assignedTo: "CN Nguyễn Thị Mỹ Linh", plannedStartDate: "2026-06-01", plannedEndDate: "2026-06-30", deadlineDate: "2026-06-30", actualStartDate: "2026-06-02", actualEndDate: null, progressPercent: 55, status: "Trễ hạn", riskLevel: "Trễ hạn", delayDays: 12, hasIssue: true, issueReason: "Dữ liệu nhập chưa thống nhất giữa các điều dưỡng", note: "Cần thống nhất cách ghi CRP và procalcitonin." }),
  makeMilestone({ id: "ms5p-1", researchProjectId: "5", researchModuleId: "p5-1", name: "Dự thảo bộ câu hỏi khảo sát", sortOrder: 1, assignedTo: "CN Lê Thị Thu Hà", plannedStartDate: "2026-04-01", plannedEndDate: "2026-04-30", deadlineDate: "2026-04-30", actualStartDate: "2026-04-05", actualEndDate: "2026-04-29", progressPercent: 100, status: "Hoàn thành", riskLevel: "Đã hoàn thành", delayDays: 0, hasIssue: false, note: "Bộ câu hỏi gồm 5 nhóm trải nghiệm chính." }),
  makeMilestone({ id: "ms5p-2", researchProjectId: "5", researchModuleId: "p5-2", name: "Nộp hồ sơ xin ý kiến hội đồng đạo đức", sortOrder: 1, assignedTo: "Phòng Công tác xã hội", plannedStartDate: "2026-05-20", plannedEndDate: "2026-06-15", deadlineDate: "2026-06-15", actualStartDate: "2026-05-20", actualEndDate: null, progressPercent: 30, status: "Chờ duyệt", riskLevel: "Có nguy cơ", delayDays: 3, hasIssue: true, issueReason: "Chờ xác nhận của hội đồng đạo đức", note: "Đang chờ phản hồi lịch họp." }),
];

export const mockDeadlines: DeadlineItem[] = [
  { id: "d1", researchId: "4", researchCode: "NC-2026-004", researchName: "Đặc điểm lâm sàng và cận lâm sàng của người bệnh viêm phổi cộng đồng nhập viện", type: "Hoàn tất thu thập xét nghiệm và hình ảnh học", dueDate: "2026-06-30", daysRemaining: -3, assignee: "BS Trần Hải Đăng", status: "Quá hạn", priority: "critical" },
  { id: "d2", researchId: "1", researchCode: "NC-2026-001", researchName: "Nghiên cứu tỷ lệ kiểm soát huyết áp ở người bệnh tăng huyết áp điều trị ngoại trú", type: "Kiểm tra thiếu dữ liệu định kỳ", dueDate: "2026-08-31", daysRemaining: 59, assignee: "CN Võ Thị Thanh", status: "Chưa bắt đầu", priority: "normal" },
  { id: "d3", researchId: "2", researchCode: "NC-2026-002", researchName: "Đánh giá hiệu quả tư vấn dinh dưỡng cho người bệnh đái tháo đường type 2", type: "Hoàn tất tư vấn dinh dưỡng", dueDate: "2026-08-15", daysRemaining: 43, assignee: "CN Phạm Ngọc Hân", status: "Đang thực hiện", priority: "normal" },
  { id: "d4", researchId: "3", researchCode: "NC-2026-003", researchName: "Khảo sát thời gian chờ khám tại khoa Khám bệnh", type: "Phân tích điểm nghẽn", dueDate: "2026-07-15", daysRemaining: 12, assignee: "CN Võ Thị Thanh", status: "Đang thực hiện", priority: "medium" },
  { id: "d5", researchId: "5", researchCode: "NC-2026-005", researchName: "Đánh giá mức độ hài lòng của người bệnh nội trú", type: "Xin ý kiến hội đồng đạo đức", dueDate: "2026-06-30", daysRemaining: -3, assignee: "Phòng Công tác xã hội", status: "Quá hạn", priority: "high" },
  { id: "d6", researchId: "5", researchCode: "NC-2026-005", researchName: "Đánh giá mức độ hài lòng của người bệnh nội trú", type: "Tập huấn khảo sát viên", dueDate: "2026-07-20", daysRemaining: 17, assignee: "CN Lê Thị Thu Hà", status: "Chưa bắt đầu", priority: "medium" },
  { id: "d7", researchId: "1", researchCode: "NC-2026-001", researchName: "Nghiên cứu tỷ lệ kiểm soát huyết áp ở người bệnh tăng huyết áp điều trị ngoại trú", type: "Báo cáo tiến độ thu thập số liệu", dueDate: "2026-07-31", daysRemaining: 28, assignee: "CN Phạm Ngọc Hân", status: "Đang thực hiện", priority: "high" },
];

const doneStatuses = ["Hoàn thành", "Hoàn thành trễ"] as const;
const activeStatuses = ["Đang thực hiện", "Chờ duyệt", "Cần chỉnh sửa"] as const;
const lateStatuses = ["Trễ hạn", "Hoàn thành trễ"] as const;

export const mockResearchSummary = {
  totalProjects: mockResearchProjects.length,
  projectsInProgress: mockResearchProjects.filter((project) => project.status === "Đang thực hiện").length,
  projectsOverdueOrAtRisk: mockResearchProjects.filter((project) => project.riskLevel === "Có nguy cơ" || project.riskLevel === "Trễ hạn").length,
  totalModules: mockPhases.length,
  completedModules: mockPhases.filter((module) => doneStatuses.includes(module.status as (typeof doneStatuses)[number])).length,
  inProgressModules: mockPhases.filter((module) => activeStatuses.includes(module.status as (typeof activeStatuses)[number])).length,
  lateModules: mockPhases.filter((module) => lateStatuses.includes(module.status as (typeof lateStatuses)[number])).length,
  totalMilestones: mockMilestones.length,
  completedMilestones: mockMilestones.filter((milestone) => doneStatuses.includes(milestone.status as (typeof doneStatuses)[number])).length,
  atRiskMilestones: mockMilestones.filter((milestone) => milestone.riskLevel === "Có nguy cơ").length,
  overdueMilestones: mockMilestones.filter((milestone) => milestone.riskLevel === "Trễ hạn" || milestone.status === "Trễ hạn").length,
};

export const DEPARTMENTS = [
  "Tất cả",
  "Khoa Khám bệnh",
  "Khoa Nội tiết",
  "Phòng Quản lý chất lượng",
  "Khoa Nội hô hấp",
  "Phòng Công tác xã hội",
  "Phòng Quản lý khoa học",
  "Khoa Dinh dưỡng",
  "Khoa Xét nghiệm",
];

export const SPONSORS = [
  "Tất cả",
  DEFAULT_SPONSOR,
  "Nguồn kinh phí khoa/phòng",
  "Chương trình cải tiến chất lượng bệnh viện",
];

export const mockModules = mockPhases;
export const mockResearchModules = mockPhases;
