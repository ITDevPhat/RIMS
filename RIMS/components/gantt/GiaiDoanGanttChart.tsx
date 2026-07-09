"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import type { ResearchPhase, PhaseStatus } from "@/lib/types";
import { Search } from "lucide-react";

// ─── Date helpers ─────────────────────────────────────────────────────────────
const TODAY = new Date("2026-07-03");
const YEAR_START = new Date("2026-01-01");
const YEAR_END = new Date("2026-12-31T23:59:59");
const TOTAL_MS = YEAR_END.getTime() - YEAR_START.getTime();

function parseDate(s: string): Date {
  const [y, m, d] = s.split("-").map(Number);
  return new Date(y, m - 1, d);
}

function dateToPct(date: Date): number {
  return Math.min(100, Math.max(0, ((date.getTime() - YEAR_START.getTime()) / TOTAL_MS) * 100));
}

function fmtShort(s: string | null): string {
  if (!s) return "";
  const d = parseDate(s);
  return `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function formatDate(s: string | null): string {
  if (!s) return "—";
  return parseDate(s).toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" });
}

// ─── Month layout ─────────────────────────────────────────────────────────────
const MONTH_LABELS = ["Tháng 1","Tháng 2","Tháng 3","Tháng 4","Tháng 5","Tháng 6","Tháng 7","Tháng 8","Tháng 9","Tháng 10","Tháng 11","Tháng 12"];

function monthColumns() {
  return MONTH_LABELS.map((label, i) => {
    const start = new Date(2026, i, 1);
    const end = i < 11 ? new Date(2026, i + 1, 1) : YEAR_END;
    return { label, leftPct: dateToPct(start), widthPct: dateToPct(end) - dateToPct(start) };
  });
}

function monthStartPositions() {
  return MONTH_LABELS.map((label, i) => ({ label, pct: dateToPct(new Date(2026, i, 1)) }));
}

// ─── Bar color ────────────────────────────────────────────────────────────────
function actualBarColor(status: PhaseStatus): string {
  switch (status) {
    case "Hoàn thành":      return "bg-emerald-500";
    case "Hoàn thành trễ":  return "bg-red-500";
    case "Đang thực hiện":  return "bg-blue-500";
    case "Chờ duyệt":       return "bg-violet-500";
    case "Cần chỉnh sửa":   return "bg-orange-500";
    case "Có nguy cơ":      return "bg-amber-400";
    case "Trễ hạn":         return "bg-red-600";
    case "Tạm dừng":        return "bg-slate-400";
    default:                return "bg-slate-200";
  }
}

// ─── GanttBar ─────────────────────────────────────────────────────────────────
interface GanttBarProps {
  leftPct: number;
  widthPct: number;
  colorClass: string;
  tooltip: React.ReactNode;
  inlineLabel?: string;
}

const MIN_LABEL_PCT = 8;

function GanttBar({ leftPct, widthPct, colorClass, tooltip, inlineLabel }: GanttBarProps) {
  const [showTooltip, setShowTooltip] = useState(false);
  const showLabel = !!inlineLabel && widthPct >= MIN_LABEL_PCT;

  return (
    <div
      className="absolute h-5 rounded cursor-pointer transition-opacity hover:opacity-80"
      style={{ left: `${leftPct}%`, width: `${Math.max(widthPct, 0.5)}%`, top: "50%", transform: "translateY(-50%)" }}
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
    >
      <div className={cn("h-full w-full rounded shadow-sm relative overflow-hidden", colorClass)}>
        {showLabel && (
          <span className="absolute inset-0 flex items-center px-1.5 text-[9px] font-semibold text-white/90 whitespace-nowrap overflow-hidden">
            {inlineLabel}
          </span>
        )}
      </div>
      {showTooltip && (
        <div className="absolute z-50 bottom-full mb-2 left-0 w-60 rounded-lg border border-slate-200 bg-white shadow-xl p-3 text-xs pointer-events-none">
          {tooltip}
        </div>
      )}
    </div>
  );
}

// ─── Props ────────────────────────────────────────────────────────────────────
interface GiaiDoanGanttChartProps {
  phases: ResearchPhase[];
}

type ViewMode = "month" | "quarter" | "year";

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function GiaiDoanGanttChart({ phases }: GiaiDoanGanttChartProps) {
  const [viewMode, setViewMode] = useState<ViewMode>("month");
  const [search, setSearch] = useState("");

  const todayPct = dateToPct(TODAY);
  const columns = monthColumns();
  const monthStarts = monthStartPositions();

  const filtered = phases.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-4">
      {/* Controls */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-2">
          {(["month", "quarter", "year"] as ViewMode[]).map((mode) => (
            <Button
              key={mode}
              size="sm"
              variant={viewMode === mode ? "default" : "outline"}
              className={cn("h-8 px-3 text-xs", viewMode === mode ? "bg-blue-600 hover:bg-blue-700 text-white" : "border-slate-200 text-slate-600 hover:bg-slate-50")}
              onClick={() => setViewMode(mode)}
            >
              {mode === "month" ? "Tháng" : mode === "quarter" ? "Quý" : "Năm"}
            </Button>
          ))}
        </div>
        <div className="relative w-56">
          <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
          <Input
            placeholder="Tìm giai đoạn..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-8 pl-8 text-xs border-slate-200"
          />
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-5 flex-wrap text-xs text-slate-500">
        {[
          { label: "Dự kiến (thanh trên)", color: "bg-blue-500" },
          { label: "Hoàn thành", color: "bg-emerald-500" },
          { label: "Đang thực hiện", color: "bg-blue-500" },
          { label: "Có nguy cơ", color: "bg-amber-400" },
          { label: "Trễ hạn", color: "bg-red-600" },
          { label: "Hôm nay", color: "bg-slate-900" },
        ].map((l) => (
          <span key={l.label} className="flex items-center gap-1.5">
            <span className={cn("h-3 w-6 rounded inline-block", l.color)} />
            {l.label}
          </span>
        ))}
      </div>

      {/* Chart */}
      <div className="rounded-xl border border-slate-200 bg-white overflow-x-auto shadow-sm">
        {/* Year header */}
        <div className="flex border-b border-slate-200 bg-slate-100">
          <div className="w-56 flex-shrink-0 border-r border-slate-200 px-4 py-2 flex items-center">
            <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Giai đoạn</span>
          </div>
          <div className="flex-1 relative flex items-center justify-center py-2">
            <span className="text-xs font-bold tracking-widest text-slate-600">2026</span>
            <div className="absolute top-0 h-full w-0.5 bg-slate-900/20" style={{ left: `${todayPct}%` }} />
          </div>
        </div>

        {/* Month header */}
        <div className="flex border-b border-slate-200 bg-slate-50">
          <div className="w-56 flex-shrink-0 border-r border-slate-200 px-4 py-2">
            <span className="text-[10px] text-slate-400 italic">Mốc thời gian</span>
          </div>
          <div className="flex-1 relative h-8 overflow-hidden">
            {columns.map((col) => (
              <div
                key={col.label}
                className="absolute top-0 h-full flex items-center justify-center border-l border-slate-200 first:border-l-0"
                style={{ left: `${col.leftPct}%`, width: `${col.widthPct}%` }}
              >
                <span className="text-[10px] font-medium text-slate-500 whitespace-nowrap truncate px-0.5">{col.label}</span>
              </div>
            ))}
            <div className="absolute top-0 h-full w-0.5 bg-slate-900 z-10" style={{ left: `${todayPct}%` }} />
            <span
              className="absolute top-0.5 text-[9px] font-semibold text-slate-700 whitespace-nowrap z-10 bg-slate-50/90 px-0.5 rounded"
              style={{ left: `${Math.min(todayPct + 0.4, 75)}%` }}
            >
              Hôm nay: 03/07/2026
            </span>
          </div>
        </div>

        {/* Phase rows */}
        {filtered.length === 0 && (
          <div className="py-10 text-center text-sm text-slate-400">Không tìm thấy giai đoạn nào.</div>
        )}

        {filtered.map((phase, idx) => {
          const plannedLeft = dateToPct(parseDate(phase.plannedStartDate));
          const plannedWidth = dateToPct(parseDate(phase.plannedEndDate)) - plannedLeft;
          const plannedLabel = `Dự kiến: ${fmtShort(phase.plannedStartDate)} - ${fmtShort(phase.plannedEndDate)}`;

          let actualLeft = 0, actualWidth = 0, hasActual = false;
          let actualLabel = "";

          if (phase.actualStartDate) {
            hasActual = true;
            const aStart = parseDate(phase.actualStartDate);
            const aEnd = phase.actualEndDate ? parseDate(phase.actualEndDate) : TODAY;
            actualLeft = dateToPct(aStart);
            actualWidth = dateToPct(aEnd) - actualLeft;
            actualLabel = `Thực tế: ${fmtShort(phase.actualStartDate)} - ${phase.actualEndDate ? fmtShort(phase.actualEndDate) : "Hôm nay"}`;
          }

          const deadlinePct = dateToPct(parseDate(phase.deadline));
          const deadlineLabel = `Hạn chót: ${fmtShort(phase.deadline)}`;

          const plannedTooltip = (
            <div className="space-y-1">
              <p className="font-semibold text-slate-800">{phase.name}</p>
              <p className="text-slate-400 text-[10px]">Dự kiến</p>
              <div className="border-t border-slate-100 mt-1 pt-1 space-y-0.5">
                <p><span className="text-slate-400">Bắt đầu:</span> {formatDate(phase.plannedStartDate)}</p>
                <p><span className="text-slate-400">Kết thúc:</span> {formatDate(phase.plannedEndDate)}</p>
                <p><span className="text-slate-400">Hạn chót:</span> {formatDate(phase.deadline)}</p>
                <p><span className="text-slate-400">Tiến độ:</span> {phase.progress}%</p>
                <p><span className="text-slate-400">Trạng thái:</span> {phase.status}</p>
                {phase.delayDays > 0 && <p className="text-red-500 font-medium">Trễ: {phase.delayDays} ngày</p>}
              </div>
            </div>
          );

          const actualTooltip = (
            <div className="space-y-1">
              <p className="font-semibold text-slate-800">{phase.name}</p>
              <p className="text-slate-400 text-[10px]">Thực tế</p>
              <div className="border-t border-slate-100 mt-1 pt-1 space-y-0.5">
                <p><span className="text-slate-400">Bắt đầu:</span> {formatDate(phase.actualStartDate)}</p>
                <p><span className="text-slate-400">Kết thúc:</span> {phase.actualEndDate ? formatDate(phase.actualEndDate) : "Đang tiến hành"}</p>
                <p><span className="text-slate-400">Tiến độ:</span> {phase.progress}%</p>
                <p><span className="text-slate-400">Trạng thái:</span> {phase.status}</p>
                {phase.delayDays > 0 && <p className="text-red-500 font-medium">Trễ: {phase.delayDays} ngày</p>}
              </div>
            </div>
          );

          return (
            <div key={phase.id} className={cn("flex border-b border-slate-100 last:border-0", idx % 2 === 0 ? "bg-white" : "bg-slate-50/40")}>
              {/* Phase info column */}
              <div className="w-56 flex-shrink-0 border-r border-slate-200 px-4 py-3 space-y-1">
                <p className="text-xs font-semibold text-slate-800 leading-snug">
                  {phase.order}. {phase.name}
                </p>
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] font-medium text-slate-500">{phase.progress}%</span>
                  <span className={cn(
                    "inline-flex items-center rounded-full border px-1.5 py-0 text-[9px] font-semibold",
                    phase.status === "Hoàn thành" ? "bg-emerald-50 text-emerald-700 border-emerald-200" :
                    phase.status === "Đang thực hiện" ? "bg-blue-50 text-blue-700 border-blue-200" :
                    phase.status === "Trễ hạn" || phase.status === "Hoàn thành trễ" ? "bg-red-50 text-red-600 border-red-200" :
                    phase.status === "Có nguy cơ" ? "bg-amber-50 text-amber-700 border-amber-200" :
                    "bg-slate-100 text-slate-500 border-slate-200"
                  )}>
                    {phase.status}
                  </span>
                </div>
                {phase.delayDays > 0 && (
                  <p className="text-[10px] text-red-500 font-medium">Trễ {phase.delayDays} ngày</p>
                )}
              </div>

              {/* Timeline column */}
              <div className="flex-1 flex flex-col py-2">
                {/* Planned bar row */}
                <div className="relative h-7 w-full">
                  {monthStarts.map((m) => (
                    <div key={m.label} className="absolute top-0 h-full w-px bg-slate-100" style={{ left: `${m.pct}%` }} />
                  ))}
                  <div className="absolute top-0 h-full w-0.5 bg-slate-900 z-20 opacity-25" style={{ left: `${todayPct}%` }} />
                  <div className="absolute top-0 h-full w-0.5 bg-red-500 z-20" style={{ left: `${deadlinePct}%` }} />
                  <GanttBar leftPct={plannedLeft} widthPct={plannedWidth} colorClass="bg-blue-500" tooltip={plannedTooltip} inlineLabel={plannedLabel} />
                </div>

                {/* Deadline label strip */}
                <div className="relative h-4 w-full">
                  {monthStarts.map((m) => (
                    <div key={m.label} className="absolute top-0 h-full w-px bg-slate-100" style={{ left: `${m.pct}%` }} />
                  ))}
                  <div className="absolute top-0 h-full w-0.5 bg-slate-900 opacity-25" style={{ left: `${todayPct}%` }} />
                  <div className="absolute top-0 h-full w-0.5 bg-red-500 z-20" style={{ left: `${deadlinePct}%` }} />
                  <span
                    className="absolute top-0 text-[8.5px] font-semibold text-red-500 whitespace-nowrap z-30 pl-1 leading-4"
                    style={{ left: `${Math.min(deadlinePct, 88)}%` }}
                  >
                    {deadlineLabel}
                  </span>
                </div>

                {/* Actual bar row */}
                <div className="relative h-7 w-full">
                  {monthStarts.map((m) => (
                    <div key={m.label} className="absolute top-0 h-full w-px bg-slate-100" style={{ left: `${m.pct}%` }} />
                  ))}
                  <div className="absolute top-0 h-full w-0.5 bg-slate-900 z-20 opacity-25" style={{ left: `${todayPct}%` }} />
                  <div className="absolute top-0 h-full w-0.5 bg-red-500 z-20" style={{ left: `${deadlinePct}%` }} />
                  {hasActual ? (
                    <GanttBar leftPct={actualLeft} widthPct={actualWidth} colorClass={actualBarColor(phase.status)} tooltip={actualTooltip} inlineLabel={actualLabel} />
                  ) : (
                    <div className="absolute inset-0 flex items-center px-2">
                      <span className="text-[9px] text-slate-300 italic">Chưa bắt đầu</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}

        {/* Today footer */}
        <div className="relative h-6 border-t border-slate-100 bg-slate-50">
          <div className="absolute top-0 h-full w-0.5 bg-slate-900" style={{ left: `${todayPct}%` }} />
          <span className="absolute top-0.5 text-[10px] font-semibold text-slate-700 whitespace-nowrap bg-slate-50/90 px-0.5 rounded" style={{ left: `${Math.min(todayPct + 0.3, 75)}%` }}>
            Hôm nay: 03/07/2026
          </span>
        </div>
      </div>
    </div>
  );
}
