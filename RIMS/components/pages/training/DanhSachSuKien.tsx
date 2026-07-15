"use client";

import { useState, useMemo } from "react";
import { Plus, Download, Grid3x3, List, Trash2, Eye, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  LOAI_HOAT_DONG_OPTIONS,
  KHOA_PHONG_OPTIONS,
  TRANG_THAI_OPTIONS,
  LOAI_KE_HOACH_OPTIONS,
  type HoiNghi,
} from "@/lib/mock-dao-tao";

interface DanhSachSuKienProps {
  conferences: HoiNghi[];
  onAddEvent: () => void;
  onEditEvent: (event: HoiNghi) => void;
  onDeleteEvent: (id: string) => void;
  onViewEvent: (event: HoiNghi) => void;
}

function statusColor(status: string): string {
  switch (status) {
    case "Đã thực hiện": return "bg-green-100 text-green-700";
    case "Đang chuẩn bị": return "bg-blue-100 text-blue-700";
    case "Dự kiến": return "bg-slate-100 text-slate-600";
    case "Không thực hiện được": return "bg-red-100 text-red-700";
    case "Hoãn": return "bg-orange-100 text-orange-700";
    case "Hủy": return "bg-red-100 text-red-600";
    default: return "bg-slate-100 text-slate-600";
  }
}

export default function DanhSachSuKien({
  conferences,
  onAddEvent,
  onEditEvent,
  onDeleteEvent,
  onViewEvent,
}: DanhSachSuKienProps) {
  const [viewMode, setViewMode] = useState<"table" | "card">("table");
  const [searchText, setSearchText] = useState("");
  const [filterMonth, setFilterMonth] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [filterType, setFilterType] = useState<string>("all");
  const [filterDept, setFilterDept] = useState<string>("all");

  const filtered = useMemo(() => {
    return conferences.filter((h) => {
      if (searchText && !h.ten.toLowerCase().includes(searchText.toLowerCase())) return false;
      if (filterMonth !== "all" && h.thang !== parseInt(filterMonth)) return false;
      if (filterStatus !== "all" && h.trangThai !== filterStatus) return false;
      if (filterType !== "all" && h.loai !== filterType) return false;
      if (filterDept !== "all" && h.khoaPhong !== filterDept) return false;
      return true;
    });
  }, [conferences, searchText, filterMonth, filterStatus, filterType, filterDept]);

  return (
    <div className="space-y-4">
      {/* Top bar */}
      <div className="flex items-center justify-between gap-3 rounded-lg border border-slate-200 bg-white p-4">
        <div className="flex items-center gap-2">
          <Button onClick={onAddEvent} className="h-10 min-w-[150px] gap-2 rounded-lg px-4 py-2">
            <Plus className="h-5 w-5" />
            Thêm sự kiện
          </Button>
          <Button variant="outline" size="sm" className="gap-2">
            <Download className="h-4 w-4" />
            Xuất Excel
          </Button>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant={viewMode === "table" ? "default" : "outline"}
            size="sm"
            onClick={() => setViewMode("table")}
          >
            <List className="h-4 w-4" />
          </Button>
          <Button
            variant={viewMode === "card" ? "default" : "outline"}
            size="sm"
            onClick={() => setViewMode("card")}
          >
            <Grid3x3 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="grid gap-3 rounded-lg border border-slate-200 bg-white p-4 md:grid-cols-2 lg:grid-cols-5">
        <Input
          placeholder="Tìm kiếm sự kiện..."
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          className="text-sm h-9"
        />
        <Select value={filterMonth} onValueChange={(v) => v && setFilterMonth(v)}>
          <SelectTrigger className="h-9 text-sm">
            <SelectValue placeholder="Chọn tháng" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tất cả tháng</SelectItem>
            {Array.from({ length: 12 }, (_, i) => (
              <SelectItem key={i + 1} value={String(i + 1)}>
                Tháng {i + 1}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={filterStatus} onValueChange={(v) => v && setFilterStatus(v)}>
          <SelectTrigger className="h-9 text-sm">
            <SelectValue placeholder="Chọn trạng thái" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tất cả trạng thái</SelectItem>
            {TRANG_THAI_OPTIONS.map((s) => (
              <SelectItem key={s} value={s}>
                {s}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={filterType} onValueChange={(v) => v && setFilterType(v)}>
          <SelectTrigger className="h-9 text-sm">
            <SelectValue placeholder="Chọn loại" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tất cả loại</SelectItem>
            {LOAI_HOAT_DONG_OPTIONS.map((t) => (
              <SelectItem key={t} value={t}>
                {t}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={filterDept} onValueChange={(v) => v && setFilterDept(v)}>
          <SelectTrigger className="h-9 text-sm">
            <SelectValue placeholder="Chọn khoa/phòng" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tất cả khoa/phòng</SelectItem>
            {KHOA_PHONG_OPTIONS.map((d) => (
              <SelectItem key={d} value={d}>
                {d}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Results info */}
      <div className="text-sm text-slate-600">
        Hiển thị {filtered.length} sự kiện
      </div>

      {/* Table or Card View */}
      {viewMode === "table" ? (
        <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
          <table className="w-full table-fixed text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50">
                <th className="w-[10%] px-3 py-3 text-left font-semibold text-slate-700">Mã</th>
                <th className="w-[26%] px-3 py-3 text-left font-semibold text-slate-700">Tên sự kiện</th>
                <th className="w-[12%] px-3 py-3 text-left font-semibold text-slate-700">Ngày dự kiến</th>
                <th className="w-[12%] px-3 py-3 text-left font-semibold text-slate-700">Loại</th>
                <th className="w-[18%] px-3 py-3 text-left font-semibold text-slate-700">Khoa/phòng</th>
                <th className="w-[12%] px-3 py-3 text-left font-semibold text-slate-700">Trạng thái</th>
                <th className="w-[10%] px-3 py-3 text-right font-semibold text-slate-700">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-sm text-slate-400">
                    Không có sự kiện đào tạo phù hợp.
                  </td>
                </tr>
              ) : filtered.map((h) => (
                <tr key={h.id} className="hover:bg-slate-50">
                  <td className="px-3 py-3 align-top text-slate-600 font-mono text-[11px] whitespace-normal break-words">{h.ma}</td>
                  <td className="px-3 py-3 align-top font-medium text-slate-800 whitespace-normal break-words">{h.ten}</td>
                  <td className="px-3 py-3 align-top text-slate-600">{h.ngayDuKien}</td>
                  <td className="px-3 py-3 align-top">
                    <Badge variant="outline" className="text-[10px]">
                      {h.loai}
                    </Badge>
                  </td>
                  <td className="px-3 py-3 align-top text-slate-600 text-[11px] whitespace-normal break-words">{h.khoaPhong}</td>
                  <td className="px-3 py-3 align-top">
                    <span className={cn("text-[10px] font-semibold px-2 py-1 rounded inline-block", statusColor(h.trangThai))}>
                      {h.trangThai}
                    </span>
                  </td>
                  <td className="px-3 py-3 align-top whitespace-nowrap">
                    <div className="flex flex-nowrap items-center justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onViewEvent(h)}
                        className="h-7 w-7 p-0 text-blue-600 hover:bg-blue-50"
                        title="Xem chi tiết"
                      >
                        <Eye className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onEditEvent(h)}
                        className="h-7 w-7 p-0"
                        title="Sửa sự kiện"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onDeleteEvent(h.id)}
                        className="h-7 w-7 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                        title="Xóa sự kiện"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filtered.map((h) => (
            <div key={h.id} className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between gap-2 mb-2">
                <h4 className="font-bold text-slate-800 flex-1">{h.ten}</h4>
                <span className="text-[9px] font-mono text-slate-500 flex-shrink-0">{h.ma}</span>
              </div>
              <div className="space-y-2 text-sm text-slate-600">
                <p>Ngày: <span className="font-semibold">{h.ngayDuKien}</span></p>
                <p>Khoa: <span className="font-semibold">{h.khoaPhong}</span></p>
              </div>
              <div className="mt-3 flex flex-wrap gap-1.5">
                <Badge variant="outline" className="text-[9px]">
                  {h.loai}
                </Badge>
                <span className={cn("text-[9px] font-semibold px-1.5 py-0.5 rounded", statusColor(h.trangThai))}>
                  {h.trangThai}
                </span>
              </div>
              <div className="mt-4 flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onViewEvent(h)}
                  className="flex-1 text-xs h-8"
                >
                  Chi tiết
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onEditEvent(h)}
                  className="text-xs h-8 px-2"
                >
                  <Pencil className="h-3 w-3" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onDeleteEvent(h.id)}
                  className="text-xs h-8 px-2 text-red-600 hover:text-red-700 hover:bg-red-50"
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
