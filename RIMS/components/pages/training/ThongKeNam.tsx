"use client";

import { useMemo, useState } from "react";
import {
  ArrowUpDown, TrendingUp, Calendar, Users, CheckCircle2, XCircle, BarChart3,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { computeMonthlySummary, type HoiNghi } from "@/lib/constants/training";

interface ThongKeNamProps {
  selectedYear: number;
  conferences: HoiNghi[];
}

function KpiCard({
  label, value, sub, icon, color,
}: {
  label: string; value: string | number; sub?: string;
  icon: React.ReactNode; color: string;
}) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3.5 shadow-sm">
      <div className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg ${color}`}>
        {icon}
      </div>
      <div className="min-w-0">
        <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">{label}</p>
        <p className="mt-0.5 text-xl font-bold leading-tight text-slate-800">{value}</p>
        {sub && <p className="text-[10px] text-slate-500">{sub}</p>}
      </div>
    </div>
  );
}

function rateBg(rate: number): string {
  if (rate >= 90) return "bg-green-500";
  if (rate >= 70) return "bg-orange-400";
  return "bg-red-500";
}

type SummaryItem = ReturnType<typeof computeMonthlySummary>[number];
type SortKey = "thang" | "duKien" | "phatSinh" | "tongKeHoach" | "thucTe" | "chuaThucHien" | "tyLeHoanThanh" | "ghiChu";
type SortDirection = "asc" | "desc";

const columns: Array<{ label: string; key?: SortKey; className: string; align?: string }> = [
  { label: "Tháng", key: "thang", className: "w-[130px]" },
  { label: "Dự kiến", key: "duKien", className: "w-[110px]", align: "text-center" },
  { label: "Phát sinh", key: "phatSinh", className: "w-[120px]", align: "text-center" },
  { label: "Tổng KH", key: "tongKeHoach", className: "w-[120px]", align: "text-center" },
  { label: "Thực tế", key: "thucTe", className: "w-[110px]", align: "text-center" },
  { label: "Chưa TH", key: "chuaThucHien", className: "w-[110px]", align: "text-center" },
  { label: "Hoàn thành", key: "tyLeHoanThanh", className: "w-[160px]", align: "text-center" },
  { label: "Ghi chú", key: "ghiChu", className: "w-[280px]" },
];

function getSortValue(item: SummaryItem, key: SortKey) {
  if (key === "tongKeHoach") return item.duKien + item.phatSinh;
  return item[key] ?? "";
}

export default function ThongKeNam({ selectedYear, conferences }: ThongKeNamProps) {
  const summaries = useMemo(() => computeMonthlySummary(conferences), [conferences]);
  const [sortKey, setSortKey] = useState<SortKey>("thang");
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc");
  const sortedSummaries = useMemo(() => {
    return [...summaries].sort((a, b) => {
      const left = getSortValue(a, sortKey);
      const right = getSortValue(b, sortKey);
      const result = typeof left === "number" && typeof right === "number"
        ? left - right
        : String(left).localeCompare(String(right), "vi-VN", { numeric: true, sensitivity: "base" });
      return sortDirection === "asc" ? result : -result;
    });
  }, [sortDirection, sortKey, summaries]);
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

  const stats = useMemo(() => {
    const planned = conferences.filter((h) => h.loaiKeHoach === "Dự kiến").length;
    const additional = conferences.filter((h) => h.loaiKeHoach === "Phát sinh").length;
    const completed = conferences.filter((h) => h.trangThai === "Đã thực hiện").length;
    const notCompleted = Math.max(0, planned + additional - completed);
    const completionRate = planned + additional === 0 ? 0 : Math.round((completed / (planned + additional)) * 100);
    const monthsWithEvents = summaries.filter((s) => s.duKien + s.phatSinh > 0).length;

    return {
      totalPlanned: planned,
      totalAdditional: additional,
      totalActual: planned + additional,
      completed,
      notCompleted,
      completionRate,
      monthsWithEvents,
    };
  }, [conferences, summaries]);

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        <KpiCard
          label="Tổng sự kiện dự kiến"
          value={stats.totalPlanned}
          icon={<Calendar className="h-5 w-5 text-blue-500" />}
          color="bg-blue-50"
        />
        <KpiCard
          label="Tổng sự kiện phát sinh"
          value={stats.totalAdditional}
          icon={<TrendingUp className="h-5 w-5 text-purple-500" />}
          color="bg-purple-50"
        />
        <KpiCard
          label="Tổng sự kiện thực tế"
          value={stats.totalActual}
          icon={<Users className="h-5 w-5 text-amber-500" />}
          color="bg-amber-50"
        />
        <KpiCard
          label="Sự kiện chưa thực hiện"
          value={stats.notCompleted}
          icon={<XCircle className="h-5 w-5 text-red-500" />}
          color="bg-red-50"
        />
        <KpiCard
          label="Tỷ lệ hoàn thành"
          value={`${stats.completionRate}%`}
          icon={<CheckCircle2 className="h-5 w-5 text-green-500" />}
          color="bg-green-50"
        />
        <KpiCard
          label="Tháng có sự kiện"
          value={stats.monthsWithEvents}
          sub="tháng"
          icon={<BarChart3 className="h-5 w-5 text-indigo-500" />}
          color="bg-indigo-50"
        />
      </div>

      {/* Monthly Summary Table */}
      <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-200">
          <h3 className="text-sm font-bold text-slate-700">Bảng tóm tắt tháng năm {selectedYear}</h3>
        </div>
        <div className="overflow-x-auto" tabIndex={0} role="region" aria-label="Bảng dữ liệu có thể cuộn ngang">
          <table className="w-full min-w-[1140px] table-fixed text-sm">
            <thead className="sticky top-0 z-30">
              <tr className="border-b border-slate-200 bg-slate-50">
                {columns.map((column) => (
                  <th key={column.label} className={cn("px-4 py-3 text-xs font-semibold text-slate-700", column.align ?? "text-left", column.className)}>
                    {column.key ? (
                      <button
                        type="button"
                        onClick={() => handleSort(column.key!)}
                        className={cn("flex w-full items-center gap-1 rounded px-0.5 py-0.5 hover:bg-slate-100 hover:text-blue-700", column.align === "text-center" ? "justify-center" : "justify-start", sortKey === column.key && "text-blue-700")}
                        title={`Sắp xếp theo ${column.label}`}
                      >
                        <span>{column.label}</span>
                        <ArrowUpDown className={cn("h-3.5 w-3.5 shrink-0", sortKey === column.key && sortDirection === "desc" && "rotate-180")} />
                      </button>
                    ) : column.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {sortedSummaries.map((s) => (
                <tr key={s.thang} className="hover:bg-slate-50">
                  <td className="px-4 py-3 font-medium text-slate-800">Tháng {s.thang}</td>
                  <td className="px-4 py-3 text-center text-slate-600 font-semibold">{s.duKien}</td>
                  <td className="px-4 py-3 text-center text-slate-600 font-semibold">{s.phatSinh}</td>
                  <td className="px-4 py-3 text-center text-slate-600 font-bold">{s.duKien + s.phatSinh}</td>
                  <td className="px-4 py-3 text-center text-green-600 font-semibold">{s.thucTe}</td>
                  <td className="px-4 py-3 text-center text-orange-600 font-semibold">{s.chuaThucHien}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-center gap-2">
                      <div className="w-12 h-5 rounded-full bg-slate-100 overflow-hidden">
                        <div
                          className={`h-full ${rateBg(s.tyLeHoanThanh)}`}
                          style={{ width: `${s.tyLeHoanThanh}%` }}
                        />
                      </div>
                      <span className="text-[10px] font-bold text-slate-700 w-8 text-right">
                        {s.tyLeHoanThanh}%
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-slate-600 text-sm">{s.ghiChu || "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Charts */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Bar Chart */}
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <h3 className="mb-4 text-sm font-bold text-slate-700">Biểu đồ hội nghị theo tháng</h3>
          <div className="flex items-end gap-0.5 h-40 w-full">
            {summaries.map((s) => {
              const total = s.duKien + s.phatSinh;
              const maxVal = Math.max(...summaries.map((s) => Math.max(s.duKien + s.phatSinh, s.thucTe)), 1);
              const planH = total === 0 ? 0 : Math.round((total / maxVal) * 100);
              const actH = s.thucTe === 0 ? 0 : Math.round((s.thucTe / maxVal) * 100);
              const addH = s.phatSinh === 0 ? 0 : Math.round((s.phatSinh / maxVal) * 100);
              return (
                <div key={s.thang} className="flex flex-1 flex-col items-center gap-0.5 group">
                  <div className="relative w-full flex items-end justify-center gap-[2px] h-28">
                    <div title={`Dự kiến: ${s.duKien}`}
                      className="w-[30%] rounded-t bg-blue-200 transition-all group-hover:opacity-80"
                      style={{ height: `${planH}%` }}
                    />
                    <div title={`Phát sinh: ${s.phatSinh}`}
                      className="w-[30%] rounded-t bg-purple-300 transition-all group-hover:opacity-80"
                      style={{ height: `${addH}%` }}
                    />
                    <div title={`Thực tế: ${s.thucTe}`}
                      className="w-[30%] rounded-t bg-blue-500 transition-all group-hover:opacity-80"
                      style={{ height: `${actH}%` }}
                    />
                  </div>
                  <span className="text-[9px] font-medium text-slate-400">T{s.thang}</span>
                </div>
              );
            })}
          </div>
          <div className="mt-3 flex flex-wrap items-center gap-4">
            {[
              { color: "bg-blue-200", label: "Dự kiến" },
              { color: "bg-purple-300", label: "Phát sinh" },
              { color: "bg-blue-500", label: "Thực tế" },
            ].map((l) => (
              <div key={l.label} className="flex items-center gap-1.5">
                <div className={`h-2.5 w-4 rounded-sm ${l.color}`} />
                <span className="text-[10px] text-slate-500">{l.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Completion Rate Trend */}
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <h3 className="mb-4 text-sm font-bold text-slate-700">Tỷ lệ hoàn thành theo tháng</h3>
          <div className="flex items-end gap-0.5 h-40 w-full">
            {summaries.map((s) => {
              const total = s.duKien + s.phatSinh;
              const rate = total === 0 ? 0 : s.tyLeHoanThanh;
              return (
                <div key={s.thang} className="flex flex-1 flex-col items-center gap-0.5 group">
                  <div className="relative w-full flex items-end justify-center h-28">
                    <div
                      title={`${rate}%`}
                      className={`w-2/3 rounded-t transition-all group-hover:opacity-80 ${
                        rate >= 90 ? "bg-green-500" : rate >= 70 ? "bg-orange-400" : "bg-red-500"
                      }`}
                      style={{ height: `${rate}%` }}
                    />
                  </div>
                  <span className="text-[9px] font-medium text-slate-400">T{s.thang}</span>
                </div>
              );
            })}
          </div>
          <div className="mt-3 flex flex-wrap items-center gap-4">
            {[
              { color: "bg-green-500", label: "Tốt (≥90%)" },
              { color: "bg-orange-400", label: "Trung bình (70-89%)" },
              { color: "bg-red-500", label: "Kém (<70%)" },
            ].map((l) => (
              <div key={l.label} className="flex items-center gap-1.5">
                <div className={`h-2.5 w-4 rounded-sm ${l.color}`} />
                <span className="text-[10px] text-slate-500">{l.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
