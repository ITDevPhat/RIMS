"use client";

import { useMemo, useState } from "react";
import { CalendarRange, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import type { PhaseStatus, ResearchPhase } from "@/lib/types";
import { cn } from "@/lib/utils";

type ViewMode = "month" | "quarter" | "half" | "year";

interface TimelineRange {
  start: Date;
  end: Date;
}

interface TimelineColumn {
  label: string;
  leftPct: number;
  widthPct: number;
}

const TODAY = new Date();

function parseDate(value: string | null | undefined): Date | null {
  if (!value) return null;
  const [year, month, day] = value.split("-").map(Number);
  if (!year || !month || !day) return null;
  return new Date(year, month - 1, day);
}

function formatDate(value: string | null | undefined) {
  const date = parseDate(value);
  return date ? date.toLocaleDateString("vi-VN") : "—";
}

function fmtShort(value: string | null | undefined) {
  const date = parseDate(value);
  if (!date) return "—";
  return `${String(date.getDate()).padStart(2, "0")}/${String(date.getMonth() + 1).padStart(2, "0")}`;
}

function dateToPct(date: Date, range: TimelineRange) {
  const total = range.end.getTime() - range.start.getTime();
  if (total <= 0) return 0;
  return Math.min(100, Math.max(0, ((date.getTime() - range.start.getTime()) / total) * 100));
}

function normalizeStart(date: Date, mode: ViewMode) {
  if (mode === "year") return new Date(date.getFullYear(), 0, 1);
  if (mode === "half") return new Date(date.getFullYear(), date.getMonth() < 6 ? 0 : 6, 1);
  if (mode === "quarter") return new Date(date.getFullYear(), Math.floor(date.getMonth() / 3) * 3, 1);
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function addUnit(date: Date, mode: ViewMode) {
  const next = new Date(date);
  if (mode === "year") next.setFullYear(next.getFullYear() + 1);
  else if (mode === "half") next.setMonth(next.getMonth() + 6);
  else if (mode === "quarter") next.setMonth(next.getMonth() + 3);
  else next.setMonth(next.getMonth() + 1);
  return next;
}

function columnLabel(date: Date, mode: ViewMode) {
  if (mode === "year") return String(date.getFullYear());
  if (mode === "half") return `${date.getMonth() < 6 ? "H1" : "H2"}/${date.getFullYear()}`;
  if (mode === "quarter") return `Q${Math.floor(date.getMonth() / 3) + 1}/${date.getFullYear()}`;
  return `T${date.getMonth() + 1}/${date.getFullYear()}`;
}

function getTimelineRange(phases: ResearchPhase[], mode: ViewMode): TimelineRange {
  const dates = phases.flatMap((phase) => [
    parseDate(phase.plannedStartDate),
    parseDate(phase.plannedEndDate),
    parseDate(phase.deadline),
    parseDate(phase.actualStartDate),
    parseDate(phase.actualEndDate),
  ]).filter((date): date is Date => !!date);

  if (dates.length === 0) {
    return { start: new Date(TODAY.getFullYear(), 0, 1), end: new Date(TODAY.getFullYear(), 11, 31, 23, 59, 59) };
  }

  const min = new Date(Math.min(...dates.map((date) => date.getTime())));
  const max = new Date(Math.max(...dates.map((date) => date.getTime())));
  const start = normalizeStart(min, mode);
  const end = addUnit(normalizeStart(max, mode), mode);
  end.setMilliseconds(end.getMilliseconds() - 1);
  return { start, end };
}

function buildColumns(range: TimelineRange, mode: ViewMode): TimelineColumn[] {
  const columns: TimelineColumn[] = [];
  let cursor = normalizeStart(range.start, mode);
  while (cursor < range.end) {
    const start = new Date(cursor);
    const end = addUnit(start, mode);
    columns.push({
      label: columnLabel(start, mode),
      leftPct: dateToPct(start, range),
      widthPct: dateToPct(end, range) - dateToPct(start, range),
    });
    cursor = end;
  }
  return columns;
}

function barPosition(startValue: string | null | undefined, endValue: string | null | undefined, range: TimelineRange) {
  const start = parseDate(startValue) ?? parseDate(endValue);
  const end = parseDate(endValue) ?? start;
  if (!start || !end) return null;
  const safeStart = start < range.start ? range.start : start;
  const safeEnd = end > range.end ? range.end : end;
  return {
    left: dateToPct(safeStart, range),
    width: Math.max(dateToPct(safeEnd, range) - dateToPct(safeStart, range), 0.6),
  };
}

function barColor(status: PhaseStatus) {
  switch (status) {
    case "Hoàn thành":
      return "bg-emerald-500";
    case "Hoàn thành trễ":
      return "bg-red-500";
    case "Đang thực hiện":
      return "bg-blue-500";
    case "Chờ duyệt":
      return "bg-violet-500";
    case "Cần chỉnh sửa":
      return "bg-orange-500";
    case "Có nguy cơ":
      return "bg-amber-500";
    case "Trễ hạn":
      return "bg-red-600";
    case "Tạm dừng":
      return "bg-slate-400";
    default:
      return "bg-slate-300";
  }
}

function statusBadge(status: PhaseStatus) {
  return status === "Hoàn thành" ? "border-emerald-200 bg-emerald-50 text-emerald-700"
    : status === "Đang thực hiện" ? "border-blue-200 bg-blue-50 text-blue-700"
      : status === "Trễ hạn" || status === "Hoàn thành trễ" ? "border-red-200 bg-red-50 text-red-700"
        : status === "Có nguy cơ" ? "border-amber-200 bg-amber-50 text-amber-700"
          : "border-slate-200 bg-slate-100 text-slate-600";
}

function GanttBar({ position, className, label, title }: { position: { left: number; width: number }; className: string; label?: string; title: string }) {
  return (
    <div
      className="absolute top-1/2 h-4 -translate-y-1/2 rounded"
      style={{ left: `${position.left}%`, width: `${position.width}%` }}
      title={title}
    >
      <div className={cn("h-full rounded shadow-sm", className)}>
        {position.width > 12 && label && <span className="block truncate px-2 text-[9px] font-semibold leading-4 text-white">{label}</span>}
      </div>
    </div>
  );
}

export default function GiaiDoanGanttChart({ phases }: { phases: ResearchPhase[] }) {
  const [viewMode, setViewMode] = useState<ViewMode>("quarter");
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return phases.filter((phase) => !q || phase.name.toLowerCase().includes(q) || (phase.assignee ?? "").toLowerCase().includes(q));
  }, [phases, search]);

  const range = useMemo(() => getTimelineRange(filtered.length ? filtered : phases, viewMode), [filtered, phases, viewMode]);
  const columns = useMemo(() => buildColumns(range, viewMode), [range, viewMode]);
  const showToday = TODAY >= range.start && TODAY <= range.end;
  const todayPct = dateToPct(TODAY, range);

  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h3 className="text-sm font-bold text-slate-800">Gantt giai đoạn nghiên cứu</h3>
            <p className="mt-1 text-xs text-slate-500">
              {range.start.toLocaleDateString("vi-VN")} - {range.end.toLocaleDateString("vi-VN")} · {filtered.length} giai đoạn
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex rounded-lg border border-slate-200 bg-slate-50 p-1">
              {[
                { value: "month" as ViewMode, label: "Tháng" },
                { value: "quarter" as ViewMode, label: "Quý" },
                { value: "half" as ViewMode, label: "Nửa năm" },
                { value: "year" as ViewMode, label: "Năm" },
              ].map((item) => (
                <button
                  key={item.value}
                  type="button"
                  onClick={() => setViewMode(item.value)}
                  className={cn(
                    "rounded-md px-3 py-1.5 text-xs font-semibold transition",
                    viewMode === item.value ? "bg-blue-600 text-white shadow-sm" : "text-slate-600 hover:bg-white"
                  )}
                >
                  {item.label}
                </button>
              ))}
            </div>
            <div className="relative w-64">
              <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
              <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Tìm giai đoạn, người phụ trách..." className="h-9 pl-9 text-sm" />
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-4 rounded-lg border border-slate-200 bg-white px-4 py-3 text-xs text-slate-500 shadow-sm">
        {[
          { label: "Kế hoạch", color: "bg-slate-300" },
          { label: "Thực tế/tiến độ", color: "bg-blue-500" },
          { label: "Hoàn thành", color: "bg-emerald-500" },
          { label: "Có nguy cơ", color: "bg-amber-500" },
          { label: "Trễ hạn", color: "bg-red-600" },
        ].map((item) => (
          <span key={item.label} className="flex items-center gap-1.5">
            <span className={cn("h-2.5 w-6 rounded", item.color)} />
            {item.label}
          </span>
        ))}
        <span className="ml-auto flex items-center gap-1.5">
          <CalendarRange className="h-3.5 w-3.5" />
          Timeline tự tính theo dữ liệu giai đoạn
        </span>
      </div>

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="flex border-b border-slate-200 bg-slate-50">
          <div className="w-72 shrink-0 border-r border-slate-200 px-4 py-3">
            <span className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">Giai đoạn</span>
          </div>
          <div className="relative h-10 min-w-[760px] flex-1">
            {columns.map((column) => (
              <div
                key={column.label}
                className="absolute top-0 flex h-full items-center justify-center border-l border-slate-200"
                style={{ left: `${column.leftPct}%`, width: `${column.widthPct}%` }}
              >
                <span className="truncate px-1 text-[10px] font-semibold text-slate-500">{column.label}</span>
              </div>
            ))}
            {showToday && <div className="absolute top-0 z-20 h-full w-0.5 bg-slate-900/50" style={{ left: `${todayPct}%` }} />}
          </div>
        </div>

        {filtered.length === 0 ? (
          <div className="py-12 text-center text-sm text-slate-400">Không tìm thấy giai đoạn nào.</div>
        ) : filtered.map((phase, index) => {
          const planned = barPosition(phase.plannedStartDate, phase.plannedEndDate, range);
          const actual = barPosition(phase.actualStartDate, phase.actualEndDate ?? (phase.actualStartDate ? new Date().toISOString().slice(0, 10) : null), range);
          const deadline = parseDate(phase.deadline);
          const deadlinePct = deadline ? dateToPct(deadline, range) : null;

          return (
            <div key={phase.id} className={cn("flex border-b border-slate-100 last:border-b-0", index % 2 === 0 ? "bg-white" : "bg-slate-50/40")}>
              <div className="w-72 shrink-0 border-r border-slate-200 px-4 py-3">
                <div className="flex items-start gap-2">
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-blue-50 text-xs font-bold text-blue-700 ring-1 ring-blue-100">{phase.order}</span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold leading-snug text-slate-800">{phase.name}</p>
                    <div className="mt-1 flex flex-wrap items-center gap-1.5">
                      <span className={cn("rounded-full border px-2 py-0.5 text-[10px] font-semibold", statusBadge(phase.status))}>{phase.status}</span>
                      <span className="text-[10px] font-semibold text-slate-500">{phase.progress}%</span>
                    </div>
                    <p className="mt-1 text-[10px] text-slate-400">{phase.assignee ?? "Chưa phân công"}</p>
                  </div>
                </div>
              </div>
              <div className="relative min-h-20 min-w-[760px] flex-1 px-1 py-2">
                {columns.map((column) => (
                  <div key={column.label} className="absolute top-0 h-full w-px bg-slate-100" style={{ left: `${column.leftPct}%` }} />
                ))}
                {showToday && <div className="absolute top-0 z-20 h-full w-0.5 bg-slate-900/20" style={{ left: `${todayPct}%` }} />}
                {deadlinePct !== null && (
                  <>
                    <div className="absolute top-0 z-20 h-full w-0.5 bg-red-500" style={{ left: `${deadlinePct}%` }} />
                    <span className="absolute top-1 z-30 rounded bg-red-50 px-1 text-[9px] font-semibold text-red-600" style={{ left: `${Math.min(deadlinePct + 0.2, 88)}%` }}>
                      Hạn {fmtShort(phase.deadline)}
                    </span>
                  </>
                )}
                <div className="relative h-7">
                  {planned && <GanttBar position={planned} className="bg-slate-300" label={`${fmtShort(phase.plannedStartDate)} - ${fmtShort(phase.plannedEndDate)}`} title={`Kế hoạch: ${formatDate(phase.plannedStartDate)} - ${formatDate(phase.plannedEndDate)}`} />}
                </div>
                <div className="relative h-7">
                  {actual ? (
                    <GanttBar position={actual} className={barColor(phase.status)} label={`${phase.progress}%`} title={`Thực tế: ${formatDate(phase.actualStartDate)} - ${formatDate(phase.actualEndDate)}`} />
                  ) : (
                    <span className="absolute left-2 top-1/2 -translate-y-1/2 text-[10px] italic text-slate-300">Chưa có ngày thực tế</span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
