"use client";

import { X, Calendar, MapPin, User, Building2, Users, FileText, Clock } from "lucide-react";
import type { HoiNghi } from "@/lib/mock-dao-tao";

interface HoiNghiDetailDrawerProps {
  hoiNghi: HoiNghi | null;
  onClose: () => void;
}

function trangThaiColor(ts: string) {
  switch (ts) {
    case "Đã thực hiện":        return "bg-green-100 text-green-700 border-green-200";
    case "Đang chuẩn bị":       return "bg-blue-100 text-blue-700 border-blue-200";
    case "Dự kiến":             return "bg-slate-100 text-slate-600 border-slate-200";
    case "Không thực hiện được":return "bg-red-100 text-red-700 border-red-200";
    case "Hoãn":                return "bg-orange-100 text-orange-700 border-orange-200";
    case "Hủy":                 return "bg-red-100 text-red-700 border-red-200";
    default:                    return "bg-slate-100 text-slate-600 border-slate-200";
  }
}

function Row({ icon, label, value }: { icon: React.ReactNode; label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-start gap-3 py-2.5 border-b border-slate-100 last:border-0">
      <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-md bg-slate-100 text-slate-500">
        {icon}
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">{label}</p>
        <div className="mt-0.5 text-sm text-slate-700">{value || <span className="text-slate-400 italic">—</span>}</div>
      </div>
    </div>
  );
}

export default function HoiNghiDetailDrawer({ hoiNghi, onClose }: HoiNghiDetailDrawerProps) {
  if (!hoiNghi) return null;

  const needsLyDo = hoiNghi.trangThai === "Không thực hiện được" || hoiNghi.trangThai === "Hủy";

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-black/30 transition-opacity"
        onClick={onClose}
      />
      {/* Drawer */}
      <div className="fixed right-0 top-0 z-50 flex h-full w-[420px] max-w-full flex-col bg-white shadow-2xl">
        {/* Header */}
        <div className="flex items-start justify-between gap-3 border-b border-slate-200 px-5 py-4">
          <div className="min-w-0">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">{hoiNghi.ma}</p>
            <h2 className="mt-0.5 text-sm font-bold leading-snug text-slate-800">{hoiNghi.ten}</h2>
            <div className="mt-2 flex flex-wrap items-center gap-1.5">
              <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold ${trangThaiColor(hoiNghi.trangThai)}`}>
                {hoiNghi.trangThai}
              </span>
              <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold ${hoiNghi.loaiKeHoach === "Phát sinh" ? "bg-purple-100 text-purple-700 border-purple-200" : "bg-slate-100 text-slate-600 border-slate-200"}`}>
                {hoiNghi.loaiKeHoach}
              </span>
              <span className="inline-flex items-center rounded-full border border-sky-200 bg-sky-50 px-2 py-0.5 text-[10px] font-semibold text-sky-700">
                {hoiNghi.loai}
              </span>
            </div>
          </div>
          <button onClick={onClose} className="mt-0.5 flex-shrink-0 rounded-md p-1.5 text-slate-400 hover:bg-slate-100" aria-label="Đóng">
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-0">
          {hoiNghi.moTa && (
            <p className="mb-4 rounded-lg bg-blue-50 border border-blue-100 px-3 py-2.5 text-sm text-slate-700 leading-relaxed">
              {hoiNghi.moTa}
            </p>
          )}

          <p className="mb-1 text-[10px] font-semibold uppercase tracking-widest text-slate-400">Thông tin chung</p>
          <div className="rounded-lg border border-slate-200 bg-slate-50/50 px-3 divide-y divide-slate-100 mb-4">
            <Row icon={<Calendar className="h-3.5 w-3.5" />} label="Tháng / Năm" value={`Tháng ${hoiNghi.thang} / ${hoiNghi.nam}`} />
            <Row icon={<Calendar className="h-3.5 w-3.5" />} label="Ngày dự kiến" value={hoiNghi.ngayDuKien} />
            <Row icon={<Calendar className="h-3.5 w-3.5" />} label="Ngày thực tế" value={hoiNghi.ngayThucTe} />
            <Row icon={<MapPin className="h-3.5 w-3.5" />} label="Địa điểm" value={hoiNghi.diaDiem} />
          </div>

          <p className="mb-1 text-[10px] font-semibold uppercase tracking-widest text-slate-400">Nhân sự & Đơn vị</p>
          <div className="rounded-lg border border-slate-200 bg-slate-50/50 px-3 divide-y divide-slate-100 mb-4">
            <Row icon={<Building2 className="h-3.5 w-3.5" />} label="Khoa/phòng phụ trách" value={hoiNghi.khoaPhong} />
            <Row icon={<User className="h-3.5 w-3.5" />} label="Người phụ trách" value={hoiNghi.nguoiPhuTrach} />
          </div>

          <p className="mb-1 text-[10px] font-semibold uppercase tracking-widest text-slate-400">Số người tham dự</p>
          <div className="rounded-lg border border-slate-200 bg-slate-50/50 px-3 divide-y divide-slate-100 mb-4">
            <Row icon={<Users className="h-3.5 w-3.5" />} label="Dự kiến" value={`${hoiNghi.soNguoiDuKien} người`} />
            <Row icon={<Users className="h-3.5 w-3.5" />} label="Thực tế" value={hoiNghi.soNguoiThucTe !== null ? `${hoiNghi.soNguoiThucTe} người` : null} />
          </div>

          {needsLyDo && hoiNghi.lyDoKhongThucHien && (
            <>
              <p className="mb-1 text-[10px] font-semibold uppercase tracking-widest text-red-500">Lý do không thực hiện</p>
              <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3">
                <p className="text-sm text-red-700 leading-relaxed">{hoiNghi.lyDoKhongThucHien}</p>
              </div>
            </>
          )}

          {hoiNghi.ghiChu && (
            <>
              <p className="mb-1 text-[10px] font-semibold uppercase tracking-widest text-slate-400">Ghi chú</p>
              <div className="mb-4 rounded-lg border border-slate-200 bg-white px-4 py-3">
                <p className="text-sm text-slate-600 leading-relaxed">{hoiNghi.ghiChu}</p>
              </div>
            </>
          )}

          {hoiNghi.nhatKy.length > 0 && (
            <>
              <p className="mb-2 text-[10px] font-semibold uppercase tracking-widest text-slate-400">Nhật ký cập nhật</p>
              <div className="space-y-2 mb-4">
                {hoiNghi.nhatKy.map((entry, i) => (
                  <div key={i} className="flex gap-3 rounded-lg border border-slate-200 bg-white px-3 py-2.5">
                    <div className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-blue-100">
                      <Clock className="h-3 w-3 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-[10px] font-semibold text-slate-500">{entry.ngay}</p>
                      <p className="mt-0.5 text-sm text-slate-700">{entry.noi_dung}</p>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-slate-200 px-5 py-3">
          <button onClick={onClose}
            className="w-full rounded-lg border border-slate-200 bg-slate-50 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 transition">
            Đóng
          </button>
        </div>
      </div>
    </>
  );
}
