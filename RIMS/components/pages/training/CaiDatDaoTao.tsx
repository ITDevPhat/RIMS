"use client";

import { Badge } from "@/components/ui/badge";
import {
  LOAI_HOAT_DONG_OPTIONS,
  KHOA_PHONG_OPTIONS,
  TRANG_THAI_OPTIONS,
  LOAI_KE_HOACH_OPTIONS,
} from "@/lib/mock-dao-tao";

export default function CaiDatDaoTao() {
  return (
    <div className="space-y-6">
      {/* Activity Types */}
      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <h3 className="mb-4 text-sm font-bold text-slate-700">Loại hoạt động</h3>
        <div className="flex flex-wrap gap-2">
          {LOAI_HOAT_DONG_OPTIONS.map((loai) => (
            <Badge key={loai} variant="outline" className="px-3 py-1.5 text-sm">
              {loai}
            </Badge>
          ))}
        </div>
      </div>

      {/* Departments */}
      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <h3 className="mb-4 text-sm font-bold text-slate-700">Khoa/phòng phụ trách</h3>
        <div className="grid gap-2 md:grid-cols-2">
          {KHOA_PHONG_OPTIONS.map((khoa) => (
            <div key={khoa} className="flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
              <div className="h-2 w-2 rounded-full bg-blue-500" />
              <span className="text-sm text-slate-700">{khoa}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Event Statuses */}
      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <h3 className="mb-4 text-sm font-bold text-slate-700">Trạng thái sự kiện</h3>
        <div className="space-y-2">
          {TRANG_THAI_OPTIONS.map((status) => {
            const statusColorMap: Record<string, string> = {
              "Đã thực hiện": "bg-green-100 text-green-700 border-green-200",
              "Đang chuẩn bị": "bg-blue-100 text-blue-700 border-blue-200",
              "Dự kiến": "bg-slate-100 text-slate-600 border-slate-200",
              "Không thực hiện được": "bg-red-100 text-red-700 border-red-200",
              "Hoãn": "bg-orange-100 text-orange-700 border-orange-200",
              "Hủy": "bg-red-100 text-red-600 border-red-200",
            };
            return (
              <div key={status} className="flex items-center gap-3">
                <span
                  className={`inline-flex items-center rounded-full border px-3 py-1 text-[11px] font-semibold ${statusColorMap[status] || "bg-slate-100 text-slate-600"}`}
                >
                  {status}
                </span>
                <span className="text-sm text-slate-500">{status}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Plan Types */}
      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <h3 className="mb-4 text-sm font-bold text-slate-700">Loại kế hoạch</h3>
        <div className="flex flex-wrap gap-2">
          {LOAI_KE_HOACH_OPTIONS.map((loai) => {
            const colors = loai === "Phát sinh" ? "bg-purple-100 text-purple-700 border-purple-200" : "bg-blue-100 text-blue-700 border-blue-200";
            return (
              <span key={loai} className={`inline-flex items-center rounded-full border px-3 py-1 text-[11px] font-semibold ${colors}`}>
                {loai}
              </span>
            );
          })}
        </div>
      </div>

      {/* Calendar Template Info */}
      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <h3 className="mb-4 text-sm font-bold text-slate-700">Mẫu lịch năm</h3>
        <div className="space-y-3 text-sm">
          <p className="text-slate-600">
            Lịch năm được tổ chức theo 12 tháng (Tháng 1 đến Tháng 12). Mỗi tháng có thể chứa các sự kiện dự kiến và sự kiện phát sinh.
          </p>
          <div className="rounded-lg bg-blue-50 border border-blue-200 p-3">
            <p className="font-semibold text-blue-900 mb-2">Cấu trúc dữ liệu:</p>
            <ul className="list-disc list-inside text-blue-800 space-y-1 text-[11px]">
              <li>Mỗi sự kiện thuộc một tháng nhất định</li>
              <li>Mỗi sự kiện có loại hoạt động và loại kế hoạch</li>
              <li>Trạng thái sự kiện theo dõi tiến độ thực hiện</li>
              <li>Dữ liệu lịch sử được lưu trữ cho năm trước đó</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
