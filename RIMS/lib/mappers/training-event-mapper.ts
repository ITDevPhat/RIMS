import type { HoiNghi, LoaiHoatDong, LoaiKeHoach, TrangThaiHoiNghi } from "@/lib/constants/training";
import type { ApiTrainingEvent } from "@/lib/api/training-api";

function mapEventType(type?: string | null): LoaiHoatDong {
  switch (type) {
    case "conference":
      return "Hội nghị";
    case "workshop":
      return "Hội thảo";
    case "class":
      return "Lớp đào tạo";
    case "training":
      return "Tập huấn";
    case "scientific_meeting":
      return "Sinh hoạt khoa học";
    default:
      return "Khác";
  }
}

function mapPlanType(type?: string | null): LoaiKeHoach {
  return type === "additional" ? "Phát sinh" : "Dự kiến";
}

function mapEventStatus(status?: string | null): TrangThaiHoiNghi {
  switch (status) {
    case "preparing":
      return "Đang chuẩn bị";
    case "completed":
      return "Đã thực hiện";
    case "not_completed":
      return "Không thực hiện được";
    case "postponed":
      return "Hoãn";
    case "cancelled":
      return "Hủy";
    default:
      return "Dự kiến";
  }
}

function splitResponsibleName(notes?: string | null) {
  if (!notes) return { responsibleName: "", notes: "" };
  const lines = notes.split(/\r?\n/);
  const firstLine = lines[0]?.trim() ?? "";
  const match = /^Người phụ trách:\s*(.+)$/i.exec(firstLine);
  if (!match) return { responsibleName: "", notes };
  return {
    responsibleName: match[1].trim(),
    notes: lines.slice(1).join("\n").trim(),
  };
}

export function mapApiTrainingEventToUi(event: ApiTrainingEvent): HoiNghi {
  const noteParts = splitResponsibleName(event.notes);
  return {
    id: String(event.eventId),
    ma: event.eventCode,
    ten: event.eventTitle,
    moTa: event.description ?? "",
    nam: event.eventYear,
    thang: event.eventMonth,
    ngayDuKien: event.plannedDate ?? "",
    ngayThucTe: event.actualDate ?? null,
    loai: mapEventType(event.eventType),
    loaiKeHoach: mapPlanType(event.planType),
    khoaPhong: event.departmentName ?? "Chưa phân khoa",
    nguoiPhuTrach: event.responsibleUserName ?? noteParts.responsibleName,
    diaDiem: event.location ?? "",
    soNguoiDuKien: event.expectedParticipants ?? 0,
    soNguoiThucTe: event.actualParticipants ?? null,
    trangThai: mapEventStatus(event.eventStatus),
    lyDoKhongThucHien: event.cancelReason ?? null,
    ghiChu: noteParts.notes,
    nhatKy: [],
  };
}
