"use client";

import { useState, useMemo } from "react";
import { ArrowUpDown, Plus, Download, Grid3x3, List, Trash2, Eye, Pencil, LoaderCircle } from "lucide-react";
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
import { toast } from "@/lib/toast";
import {
  LOAI_HOAT_DONG_OPTIONS,
  KHOA_PHONG_OPTIONS,
  TRANG_THAI_OPTIONS,
  type HoiNghi,
} from "@/lib/constants/training";

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

type SortKey = "ma" | "ten" | "ngayDuKien" | "loai" | "khoaPhong" | "trangThai";
type SortDirection = "asc" | "desc";

const columns: Array<{ label: string; key?: SortKey; className: string }> = [
  { label: "Mã", key: "ma", className: "w-[140px]" },
  { label: "Tên sự kiện", key: "ten", className: "w-[320px]" },
  { label: "Ngày dự kiến", key: "ngayDuKien", className: "w-[150px]" },
  { label: "Loại", key: "loai", className: "w-[160px]" },
  { label: "Khoa/phòng", key: "khoaPhong", className: "w-[240px]" },
  { label: "Trạng thái", key: "trangThai", className: "w-[170px]" },
  { label: "Thao tác", className: "sticky right-0 z-20 w-[120px] bg-slate-50 shadow-[-4px_0_6px_-5px_rgba(15,23,42,0.45)]" },
];

function formatDateVN(value?: string | null) {
  if (!value) return "—";
  const [datePart] = value.split("T");
  const [year, month, day] = datePart.split("-");
  return year && month && day ? `${day}/${month}/${year}` : value;
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
  const [exporting, setExporting] = useState(false);
  const [sortKey, setSortKey] = useState<SortKey>("ngayDuKien");
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc");

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

  const sorted = useMemo(() => {
    return [...filtered].sort((a, b) => {
      const result = String(a[sortKey] ?? "").localeCompare(String(b[sortKey] ?? ""), "vi-VN", { numeric: true, sensitivity: "base" });
      return sortDirection === "asc" ? result : -result;
    });
  }, [filtered, sortDirection, sortKey]);

  const handleSort = (key: SortKey) => {
    setSortKey((currentKey) => {
      if (currentKey === key) {
        setSortDirection((currentDirection) => currentDirection === "asc" ? "desc" : "asc");
        return currentKey;
      }
      setSortDirection("asc");
      return key;
    });
  };

  const exportFilteredExcel = async () => {
    if (exporting) return;
    setExporting(true);
    try {
      const ExcelJS = await import("exceljs");
      const workbook = new ExcelJS.Workbook();
      workbook.creator = "RIMS";
      workbook.created = new Date();
      const worksheet = workbook.addWorksheet("Sự kiện đào tạo", { views: [{ state: "frozen", ySplit: 1 }] });
      worksheet.columns = [
        { header: "Mã", key: "code", width: 18 },
        { header: "Tên sự kiện", key: "title", width: 42 },
        { header: "Ngày dự kiến", key: "plannedDate", width: 16 },
        { header: "Ngày thực tế", key: "actualDate", width: 16 },
        { header: "Loại", key: "type", width: 22 },
        { header: "Kế hoạch", key: "plan", width: 14 },
        { header: "Khoa/phòng", key: "department", width: 28 },
        { header: "Phụ trách", key: "owner", width: 26 },
        { header: "Địa điểm", key: "location", width: 28 },
        { header: "Trạng thái", key: "status", width: 22 },
      ];
      filtered.forEach((item) => worksheet.addRow({
        code: item.ma, title: item.ten, plannedDate: formatDateVN(item.ngayDuKien),
        actualDate: item.ngayThucTe ? formatDateVN(item.ngayThucTe) : "", type: item.loai, plan: item.loaiKeHoach,
        department: item.khoaPhong, owner: item.nguoiPhuTrach,
        location: item.diaDiem, status: item.trangThai,
      }));
      worksheet.autoFilter = { from: "A1", to: "J1" };
      worksheet.getRow(1).eachCell((cell) => {
        cell.font = { bold: true, color: { argb: "FFFFFFFF" } };
        cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF4F46E5" } };
        cell.alignment = { vertical: "middle", horizontal: "center", wrapText: true };
      });
      worksheet.getRow(1).height = 26;
      worksheet.eachRow((row, rowNumber) => {
        if (rowNumber > 1) row.alignment = { vertical: "top", wrapText: true };
      });
      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `training-events-${new Date().toISOString().slice(0, 10).replaceAll("-", "")}.xlsx`;
      link.click();
      URL.revokeObjectURL(url);
      toast.success({ title: "Đã xuất Excel", description: `${filtered.length} sự kiện đào tạo.` });
    } catch (error) {
      toast.error({ title: "Không xuất được Excel", description: error instanceof Error ? error.message : "Vui lòng thử lại." });
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Top bar */}
      <div className="flex flex-col items-start gap-3 rounded-lg border border-slate-200 bg-white p-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-2">
          <Button onClick={onAddEvent} className="h-10 min-w-[150px] gap-2 rounded-lg px-4 py-2">
            <Plus className="h-5 w-5" />
            Thêm sự kiện
          </Button>
          <Button variant="outline" size="sm" className="gap-2" onClick={() => void exportFilteredExcel()} disabled={exporting}>
            {exporting ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
            {exporting ? "Đang xuất..." : "Xuất Excel (.xlsx)"}
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
        <label className="space-y-1 text-[10px] font-semibold uppercase tracking-wide text-slate-500">
          Tìm kiếm
          <Input
            placeholder="Tên sự kiện..."
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            className="h-9 text-sm normal-case tracking-normal"
          />
        </label>
        {[
          {
            label: "Tháng",
            value: filterMonth,
            setter: setFilterMonth,
            options: [{ value: "all", label: "Tất cả tháng" }, ...Array.from({ length: 12 }, (_, i) => ({ value: String(i + 1), label: `Tháng ${i + 1}` }))],
          },
          {
            label: "Trạng thái",
            value: filterStatus,
            setter: setFilterStatus,
            options: [{ value: "all", label: "Tất cả trạng thái" }, ...TRANG_THAI_OPTIONS.map((item) => ({ value: item, label: item }))],
          },
          {
            label: "Loại hoạt động",
            value: filterType,
            setter: setFilterType,
            options: [{ value: "all", label: "Tất cả loại hoạt động" }, ...LOAI_HOAT_DONG_OPTIONS.map((item) => ({ value: item, label: item }))],
          },
          {
            label: "Khoa/phòng",
            value: filterDept,
            setter: setFilterDept,
            options: [{ value: "all", label: "Tất cả khoa/phòng" }, ...KHOA_PHONG_OPTIONS.map((item) => ({ value: item, label: item }))],
          },
        ].map((filter) => (
          <label key={filter.label} className="space-y-1 text-[10px] font-semibold uppercase tracking-wide text-slate-500">
            {filter.label}
            <Select value={filter.value} onValueChange={(v) => v && filter.setter(v)}>
              <SelectTrigger className="h-9 text-sm normal-case tracking-normal">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {filter.options.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </label>
        ))}
      </div>

      {/* Results info */}
      <div className="text-sm text-slate-600">
        Hiển thị {filtered.length} sự kiện
      </div>

      {/* Table or Card View */}
      {viewMode === "table" ? (
        <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white" tabIndex={0} role="region" aria-label="Bảng sự kiện đào tạo có thể cuộn ngang">
          <table className="w-full min-w-[1300px] table-fixed text-sm">
            <thead className="sticky top-0 z-30">
              <tr className="border-b border-slate-200 bg-slate-50">
                {columns.map((column) => (
                  <th key={column.label} className={cn("px-3 py-3 text-left text-xs font-semibold text-slate-700", column.className)}>
                    {column.key ? (
                      <button
                        type="button"
                        onClick={() => handleSort(column.key!)}
                        className={cn("flex w-full items-start gap-1 rounded px-0.5 py-0.5 text-left hover:bg-slate-100 hover:text-blue-700", sortKey === column.key && "text-blue-700")}
                        title={`Sắp xếp theo ${column.label}`}
                      >
                        <span className="min-w-0 flex-1">{column.label}</span>
                        <ArrowUpDown className={cn("mt-0.5 h-3.5 w-3.5 shrink-0", sortKey === column.key && sortDirection === "desc" && "rotate-180")} />
                      </button>
                    ) : column.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {sorted.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-sm text-slate-400">
                    Không có sự kiện đào tạo phù hợp.
                  </td>
                </tr>
              ) : sorted.map((h) => (
                <tr key={h.id} className="hover:bg-slate-50">
                  <td className="px-3 py-3 align-top text-slate-600 font-mono text-[11px] whitespace-normal break-words">{h.ma}</td>
                  <td className="px-3 py-3 align-top font-medium text-slate-800 whitespace-normal break-words">{h.ten}</td>
                  <td className="px-3 py-3 align-top text-slate-600">{formatDateVN(h.ngayDuKien)}</td>
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
                  <td className="sticky right-0 z-10 bg-white px-3 py-3 align-top whitespace-nowrap shadow-[-4px_0_6px_-5px_rgba(15,23,42,0.45)]">
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
          {sorted.map((h) => (
            <div key={h.id} className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between gap-2 mb-2">
                <h4 className="font-bold text-slate-800 flex-1">{h.ten}</h4>
                <span className="text-[9px] font-mono text-slate-500 flex-shrink-0">{h.ma}</span>
              </div>
              <div className="space-y-2 text-sm text-slate-600">
                <p>Ngày: <span className="font-semibold">{formatDateVN(h.ngayDuKien)}</span></p>
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
