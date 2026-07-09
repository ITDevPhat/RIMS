export type NotificationType = "deadline" | "approval" | "submission" | "update" | "alert" | "info";
export type NotificationPriority = "cao" | "trung" | "thap";

export interface Notification {
  id: string;
  title: string;
  content: string;
  type: NotificationType;
  priority: NotificationPriority;
  timestamp: Date;
  read: boolean;
  relatedObjectId?: string;
  relatedObjectType?: "project" | "phase" | "milestone" | "conference";
  suggestedActions?: Array<{ label: string; action: string }>;
}

export const mockNotifications: Notification[] = [
  {
    id: "notif-1",
    title: "Hạn chót giai đoạn sắp đến",
    content: "Giai đoạn 'Chuẩn bị hồ sơ' của đề tài 'Phát triển vaccine mRNA' sắp kết thúc trong 3 ngày",
    type: "deadline",
    priority: "cao",
    timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
    read: false,
    relatedObjectId: "dt-001",
    relatedObjectType: "project",
    suggestedActions: [
      { label: "Xem đề tài", action: "view-project" },
      { label: "Gia hạn", action: "extend-deadline" },
    ],
  },
  {
    id: "notif-2",
    title: "Phê duyệt đạo đức đã được cấp",
    content: "Đề tài 'Nghiên cứu liệu pháp miễn dịch' đã được phê duyệt bởi Hội đồng đạo đức",
    type: "approval",
    priority: "cao",
    timestamp: new Date(Date.now() - 5 * 60 * 60 * 1000), // 5 hours ago
    read: false,
    relatedObjectId: "dt-002",
    relatedObjectType: "project",
  },
  {
    id: "notif-3",
    title: "Báo cáo tiến độ được gửi",
    content: "Dr. Nguyễn Văn A đã gửi báo cáo tiến độ cho đề tài 'Nghiên cứu ung thư phổi'",
    type: "submission",
    priority: "trung",
    timestamp: new Date(Date.now() - 12 * 60 * 60 * 1000), // 12 hours ago
    read: true,
    relatedObjectId: "dt-003",
    relatedObjectType: "project",
  },
  {
    id: "notif-4",
    title: "Cập nhật hệ thống",
    content: "Hệ thống sẽ bảo trì vào 22:00 hôm nay. Hãy lưu công việc của bạn.",
    type: "info",
    priority: "trung",
    timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000), // 1 day ago
    read: true,
  },
  {
    id: "notif-5",
    title: "Cảnh báo: Hạn chót quá kỳ hạn",
    content: "Mốc tiến độ 'Phân tích dữ liệu' của đề tài 'COVID-19 vaccine' đã quá hạn 5 ngày",
    type: "alert",
    priority: "cao",
    timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
    read: true,
    relatedObjectId: "dt-004",
    relatedObjectType: "milestone",
  },
  {
    id: "notif-6",
    title: "Mười hội nghị khoa học mới được lên lịch",
    content: "10 hội nghị khoa học mới đã được thêm vào lịch của bạn cho năm 2026",
    type: "update",
    priority: "thap",
    timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
    read: true,
    relatedObjectType: "conference",
  },
  {
    id: "notif-7",
    title: "Yêu cầu thay đổi được phê duyệt",
    content: "Yêu cầu thay đổi chủ nhiệm của đề tài 'Chẩn đoán bệnh tim' đã được phê duyệt",
    type: "approval",
    priority: "trung",
    timestamp: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000), // 4 days ago
    read: true,
    relatedObjectId: "dt-005",
    relatedObjectType: "project",
  },
  {
    id: "notif-8",
    title: "Người dùng mới được thêm vào hệ thống",
    content: "Dr. Trần Thị B đã được thêm vào hệ thống với vai trò 'Phó giáo sư'",
    type: "info",
    priority: "thap",
    timestamp: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), // 5 days ago
    read: true,
  },
  {
    id: "notif-9",
    title: "Yêu cầu tài liệu bổ sung",
    content: "Cần bổ sung tài liệu ethics approval cho đề tài 'Điều trị ung thư tuyến tụy'",
    type: "alert",
    priority: "cao",
    timestamp: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000), // 6 days ago
    read: true,
    relatedObjectId: "dt-006",
    relatedObjectType: "project",
  },
  {
    id: "notif-10",
    title: "Hội nghị đã được hoàn thành",
    content: "Hội nghị 'Tiến bộ mới trong miễn dịch học' đã được hoàn thành với 45 người tham dự",
    type: "update",
    priority: "thap",
    timestamp: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 7 days ago
    read: true,
    relatedObjectType: "conference",
  },
];

export const getUnreadCount = (): number => {
  return mockNotifications.filter((n) => !n.read).length;
};

export const getLatestNotifications = (limit = 5): Notification[] => {
  return mockNotifications.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime()).slice(0, limit);
};
