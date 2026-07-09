"use client";

import { useState, useMemo, useEffect, useCallback } from "react";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DEPARTMENTS,
  SPONSORS,
} from "@/lib/mock-data";
import type { ResearchProject, ResearchPhase, DeadlineItem, PhaseStatus, EthicsStatus } from "@/lib/types";
import { dashboardApi, type DashboardDeadlinesDto, type ResearchOverviewDto } from "@/lib/api/dashboard-api";
import { mapGanttProjectToUi } from "@/lib/mappers/project-mapper";
import { mapDashboardPhaseToUi } from "@/lib/mappers/phase-mapper";
import { mapApiDeadlineToUi } from "@/lib/mappers/deadline-mapper";
import {
  FlaskConical,
  Activity,
  AlertTriangle,
  Clock,
  TrendingUp,
  Shield,
  Search,
  CalendarX2,
  Eye,
  ChevronRight,
} from "lucide-react";

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

function fmtShort(s: string): string {
  const d = parseDate(s);
  return `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}`;
}

// ─── Phase color ──────────────────────────────────────────────────────────────
function phaseBarColor(status: PhaseStatus): string {
  switch (status) {
    case "Hoàn thành":      return "bg-emerald-500";
    case "Hoàn thành trễ":  return "bg-red-400";
    case "Đang thực hiện":  return "bg-blue-500";
    case "Chờ duyệt":       return "bg-violet-500";
    case "Cần chỉnh sửa":   return "bg-orange-500";
    case "Có nguy cơ":      return "bg-amber-500";
    case "Trễ hạn":         return "bg-red-600";
    case "Tạm dừng":        return "bg-slate-400";
    default:                return "bg-slate-200";
  }
}

// ─── Health / Ethics badges ───────────────────────────────────────────────────
function HealthDot({ health }: { health: string }) {
  const map: Record<string, string> = {
    "Đúng tiến độ": "bg-emerald-500",
    "Có nguy cơ":   "bg-amber-500",
    "Trễ hạn":      "bg-red-500",
    "Tạm dừng":     "bg-slate-400",
    "Đã hoàn thành": "bg-emerald-700",
    "Hoàn thành trễ": "bg-red-500",
    "Hoàn thành":   "bg-emerald-700",
  };
  return (
    <span className={cn("inline-block h-2 w-2 rounded-full flex-shrink-0", map[health] ?? "bg-slate-300")} />
  );
}

function EthicsBadge({ status }: { status: EthicsStatus }) {
  const map: Record<EthicsStatus, { cls: string; label: string }> = {
    "Không yêu cầu": { cls: "bg-slate-100 text-slate-500 border-slate-200",  label: "Không YC" },
    "Chờ duyệt":     { cls: "bg-amber-50 text-amber-700 border-amber-200",   label: "Chờ duyệt" },
    "Đã duyệt":      { cls: "bg-emerald-50 text-emerald-700 border-emerald-200", label: "Đã duyệt" },
    "Sắp hết hạn":   { cls: "bg-orange-50 text-orange-700 border-orange-200", label: "Sắp hết hạn" },
    "Hết hạn":       { cls: "bg-red-50 text-red-700 border-red-200",          label: "Hết hạn" },
  };
  const { cls, label } = map[status];
  return (
    <span className={cn("inline-flex items-center rounded-full border px-1.5 py-0.5 text-[9px] font-semibold", cls)}>
      {label}
    </span>
  );
}

// ─── Month columns ────────────────────────────────────────────────────────────
const MONTH_SHORT = ["T1","T2","T3","T4","T5","T6","T7","T8","T9","T10","T11","T12"];

function monthColumns() {
  return MONTH_SHORT.map((label, i) => {
    const start = new Date(2026, i, 1);
    const end = i < 11 ? new Date(2026, i + 1, 1) : YEAR_END;
    const leftPct = dateToPct(start);
    const widthPct = dateToPct(end) - leftPct;
    return { label, leftPct, widthPct };
  });
}

// ─── Phase bar ────────────────────────────────────────────────────────────────
interface PhaseBarProps {
  left: number;
  width: number;
  color: string;
  tooltip: string;
}

function PhaseBar({ left, width, color, tooltip }: PhaseBarProps) {
  const [show, setShow] = useState(false);
  return (
    <div
      className="absolute h-full cursor-default"
      style={{ left: `${left}%`, width: `${Math.max(width, 0.8)}%` }}
      onMouseEnter={() => setShow(true)}
      onMouseLeave={() => setShow(false)}
    >
      <div className={cn("h-full w-full rounded-sm opacity-90", color)} />
      {show && (
        <div className="absolute z-50 bottom-full mb-1.5 left-0 w-52 rounded-lg border border-slate-200 bg-white shadow-xl p-2.5 text-[10px] text-slate-700 pointer-events-none whitespace-pre-line leading-relaxed">
          {tooltip}
        </div>
      )}
    </div>
  );
}

// ─── Props ────────────────────────────────────────────────────────────────────
interface TongQuanTienDoProps {
  onViewDetail: (project: ResearchProject) => void;
}

// ─── Main component ───────────────────────────────────────────────────────────
export default function TongQuanTienDo({ onViewDetail }: TongQuanTienDoProps) {
  const [overview, setOverview] = useState<ResearchOverviewDto | null>(null);
  const [deadlineOverview, setDeadlineOverview] = useState<DashboardDeadlinesDto | null>(null);
  const [projects, setProjects] = useState<ResearchProject[]>([]);
  const [phases, setPhases] = useState<ResearchPhase[]>([]);
  const [deadlines, setDeadlines] = useState<DeadlineItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filterDept, setFilterDept] = useState("Tất cả");
  const [filterSponsor, setFilterSponsor] = useState("Tất cả");
  const [filterEthics, setFilterEthics] = useState("Tất cả");
  const [filterStatus, setFilterStatus] = useState("Tất cả");
  const [searchQuery, setSearchQuery] = useState("");

  const todayPct = dateToPct(TODAY);
  const columns = monthColumns();

  const loadDashboard = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [research, deadlineData] = await Promise.all([
        dashboardApi.getResearchOverview(2026),
        dashboardApi.getDeadlines(30),
      ]);
      setOverview(research);
      setDeadlineOverview(deadlineData);
      setProjects(research.ganttProjects.map(mapGanttProjectToUi));
      setPhases(
        research.ganttProjects.flatMap((project) =>
          project.phases.map((phase, index) => mapDashboardPhaseToUi(phase, String(project.projectId), index + 1))
        )
      );
      setDeadlines([
        ...deadlineData.upcomingIn30Days.map(mapApiDeadlineToUi),
        ...deadlineData.overdue.map(mapApiDeadlineToUi),
      ]);
    } catch {
      setError("Không tải được dữ liệu tổng quan từ API.");
      setProjects([]);
      setPhases([]);
      setDeadlines([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadDashboard();
  }, [loadDashboard]);

  // KPIs
  const total = overview?.totalProjects ?? 0;
  const ongoing = overview?.activeProjects ?? 0;
  const soonDue = overview?.dueSoonCount ?? 0;
  const overdue = overview?.overdueCount ?? 0;
  const avgProgress = Math.round(overview?.averageProgress ?? 0);
  const ethicsExpiring = overview?.ethicsExpiringCount ?? 0;

  // Filtered projects
  const filteredProjects = useMemo(() => {
    return projects.filter((p) => {
      if (filterDept !== "Tất cả" && p.department !== filterDept) return false;
      if (filterSponsor !== "Tất cả" && p.sponsor !== filterSponsor) return false;
      if (filterEthics !== "Tất cả" && p.ethicsStatus !== filterEthics) return false;
      if (filterStatus !== "Tất cả" && p.status !== filterStatus) return false;
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        if (!p.name.toLowerCase().includes(q) && !p.code.toLowerCase().includes(q) && !p.pi.toLowerCase().includes(q)) return false;
      }
      return true;
    });
  }, [projects, filterDept, filterSponsor, filterEthics, filterStatus, searchQuery]);

  // Side panels
  const soonDeadlines = deadlines.filter((d) => d.daysRemaining >= 0 && d.daysRemaining <= 30).slice(0, 5);
  const overdueItems = deadlines.filter((d) => d.daysRemaining < 0).slice(0, 4);
  const ethicsItems = deadlineOverview?.ethicsExpiring.slice(0, 4) ?? [];

  const priorityColor = (priority: string) => ({
    critical: "text-red-600 bg-red-50 border-red-200",
    high:     "text-orange-600 bg-orange-50 border-orange-200",
    medium:   "text-amber-600 bg-amber-50 border-amber-200",
    normal:   "text-blue-600 bg-blue-50 border-blue-200",
    ethics:   "text-purple-600 bg-purple-50 border-purple-200",
  }[priority] ?? "text-slate-600 bg-slate-50 border-slate-200");

  return (
    <div className="flex flex-col min-h-full">
      {/* ── Page header ─────────────────────────────────────────────────────── */}
      <div className="border-b border-slate-200 bg-white px-8 py-5">
        <h1 className="text-lg font-bold text-slate-800">Tổng quan tiến độ nghiên cứu</h1>
        <p className="mt-0.5 text-sm text-slate-500">
          Theo dõi tiến độ, giai đoạn và hạn chót của các đề tài nghiên cứu khoa học trong bệnh viện.
        </p>
      </div>

      <div className="flex-1 px-8 py-6 space-y-6">
        {loading && (
          <Card className="border-slate-200 shadow-sm">
            <CardContent className="p-4 text-sm text-slate-500">Đang tải dữ liệu tổng quan...</CardContent>
          </Card>
        )}

        {error && (
          <Card className="border-red-200 bg-red-50 shadow-sm">
            <CardContent className="flex items-center justify-between gap-3 p-4">
              <p className="text-sm font-medium text-red-700">{error}</p>
              <Button size="sm" variant="outline" onClick={() => void loadDashboard()}>Thử lại</Button>
            </CardContent>
          </Card>
        )}

        {/* ── KPI cards ───────────────────────────────────────────────────────── */}
        <div className="grid grid-cols-6 gap-4">
          {[
            { label: "Tổng đề tài", value: total, icon: FlaskConical, iconBg: "bg-blue-50", iconColor: "text-blue-600", valueColor: "text-slate-800" },
            { label: "Đang thực hiện", value: ongoing, icon: Activity, iconBg: "bg-emerald-50", iconColor: "text-emerald-600", valueColor: "text-emerald-700" },
            { label: "Sắp đến hạn", value: soonDue, icon: Clock, iconBg: "bg-amber-50", iconColor: "text-amber-600", valueColor: "text-amber-700" },
            { label: "Quá hạn", value: overdue, icon: AlertTriangle, iconBg: "bg-red-50", iconColor: "text-red-500", valueColor: "text-red-600" },
            { label: "Tiến độ TB", value: `${avgProgress}%`, icon: TrendingUp, iconBg: "bg-indigo-50", iconColor: "text-indigo-600", valueColor: "text-indigo-700" },
            { label: "Đạo đức sắp hết hạn", value: ethicsExpiring, icon: Shield, iconBg: "bg-purple-50", iconColor: "text-purple-600", valueColor: "text-purple-700" },
          ].map((kpi) => {
            const Icon = kpi.icon;
            return (
              <Card key={kpi.label} className="border-slate-200 shadow-sm">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-xs font-medium text-slate-500 leading-tight">{kpi.label}</p>
                    <div className={cn("flex h-7 w-7 items-center justify-center rounded-lg", kpi.iconBg)}>
                      <Icon className={cn("h-3.5 w-3.5", kpi.iconColor)} />
                    </div>
                  </div>
                  <p className={cn("text-2xl font-bold", kpi.valueColor)}>{kpi.value}</p>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* ── Filter bar ─────────────────────────────────────────────────────── */}
        <Card className="border-slate-200 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center gap-3 flex-wrap">
              <div className="relative flex-1 min-w-40">
                <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
                <Input
                  placeholder="Tìm đề tài, mã, chủ nhiệm..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="h-8 pl-8 text-xs border-slate-200"
                />
              </div>
              {[
                { label: "Khoa/phòng", value: filterDept, setter: setFilterDept, options: DEPARTMENTS },
                { label: "Nhà tài trợ", value: filterSponsor, setter: setFilterSponsor, options: SPONSORS },
                {
                  label: "Đạo đức",
                  value: filterEthics,
                  setter: setFilterEthics,
                  options: ["Tất cả", "Không yêu cầu", "Chờ duyệt", "Đã duyệt", "Sắp hết hạn", "Hết hạn"],
                },
                {
                  label: "Trạng thái",
                  value: filterStatus,
                  setter: setFilterStatus,
                  options: ["Tất cả", "Đang thực hiện", "Hoàn thành", "Tạm dừng", "Chưa bắt đầu"],
                },
              ].map((f) => (
                <Select key={f.label} value={f.value} onValueChange={(v) => v && f.setter(v)}>
                  <SelectTrigger className="h-8 w-40 text-xs border-slate-200">
                    <SelectValue placeholder={f.label} />
                  </SelectTrigger>
                  <SelectContent>
                    {f.options.map((o) => (
                      <SelectItem key={o} value={o} className="text-xs">{o}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ))}
              {(filterDept !== "Tất cả" || filterSponsor !== "Tất cả" || filterEthics !== "Tất cả" || filterStatus !== "Tất cả" || searchQuery) && (
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-8 px-2 text-xs text-slate-500 hover:text-slate-700"
                  onClick={() => { setFilterDept("Tất cả"); setFilterSponsor("Tất cả"); setFilterEthics("Tất cả"); setFilterStatus("Tất cả"); setSearchQuery(""); }}
                >
                  Xóa bộ lọc
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* ── Main content: Gantt + Side panels ──────────────────────────────── */}
        <div className="flex gap-5 items-start">

          {/* ── Multi-project Gantt ──────────────────────────────────────────── */}
          <div className="flex-1 min-w-0">
            <Card className="border-slate-200 shadow-sm overflow-hidden">
              <CardHeader className="px-5 py-3.5 border-b border-slate-100 bg-slate-50">
                <CardTitle className="text-sm font-semibold text-slate-700">
                  Gantt tiến độ đề tài — 2026
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  {/* ── Header: month row ───────────────────────────────────── */}
                  <div className="flex border-b border-slate-200 bg-slate-50 min-w-[800px]">
                    {/* Left info column */}
                    <div className="w-64 flex-shrink-0 border-r border-slate-200 px-4 py-2">
                      <span className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                        Đề tài
                      </span>
                    </div>
                    {/* Month cells */}
                    <div className="flex-1 relative h-7 overflow-hidden">
                      {columns.map((col) => (
                        <div
                          key={col.label}
                          className="absolute top-0 h-full flex items-center justify-center border-l border-slate-200 first:border-l-0"
                          style={{ left: `${col.leftPct}%`, width: `${col.widthPct}%` }}
                        >
                          <span className="text-[9px] font-medium text-slate-400 truncate px-0.5">{col.label}</span>
                        </div>
                      ))}
                      {/* Today line */}
                      <div className="absolute top-0 h-full w-0.5 bg-slate-800 z-10 opacity-40" style={{ left: `${todayPct}%` }} />
                    </div>
                  </div>

                  {/* ── Project rows ──────────────────────────────────────────── */}
                  {filteredProjects.length === 0 ? (
                    <div className="py-12 text-center text-sm text-slate-400">Không tìm thấy đề tài nào.</div>
                  ) : (
                    filteredProjects.map((project, idx) => {
                      const projectPhases = phases.filter((ph) => ph.researchId === project.id);
                      return (
                        <div
                          key={project.id}
                          className={cn(
                            "flex border-b border-slate-100 last:border-0 min-w-[800px]",
                            idx % 2 === 0 ? "bg-white" : "bg-slate-50/30"
                          )}
                        >
                          {/* Left: project info */}
                          <div className="w-64 flex-shrink-0 border-r border-slate-200 px-4 py-3 space-y-1.5">
                            <div className="flex items-start gap-2">
                              <HealthDot health={project.health} />
                              <div className="min-w-0 flex-1">
                                <p className="text-[11px] font-bold text-slate-700 leading-tight truncate">
                                  {project.code}
                                </p>
                                <p className="text-[10px] text-slate-500 leading-snug line-clamp-2 mt-0.5">
                                  {project.name}
                                </p>
                              </div>
                            </div>
                            <div className="space-y-0.5">
                              <p className="text-[9px] text-slate-400">
                                <span className="font-medium text-slate-600">{project.department}</span>
                              </p>
                              <p className="text-[9px] text-slate-400">Chủ nhiệm: <span className="text-slate-600">{project.pi}</span></p>
                              <p className="text-[9px] text-slate-400">Tài trợ: <span className="text-slate-600">{project.sponsor}</span></p>
                            </div>
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <EthicsBadge status={project.ethicsStatus} />
                              <span className="text-[9px] font-semibold text-blue-600">{project.progress}%</span>
                            </div>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-5 gap-1 px-1 text-[9px] text-blue-600 hover:bg-blue-50 hover:text-blue-700 font-medium"
                              onClick={() => onViewDetail(project)}
                            >
                              <Eye className="h-2.5 w-2.5" /> Chi tiết
                            </Button>
                          </div>

                          {/* Right: phase bars */}
                          <div className="flex-1 relative py-3 px-1 min-w-0">
                            {/* Today line */}
                            <div className="absolute top-0 h-full w-0.5 bg-slate-800 opacity-20 z-10" style={{ left: `${todayPct}%` }} />
                            {/* Month grid */}
                            {columns.map((col) => (
                              <div key={col.label} className="absolute top-0 h-full w-px bg-slate-100" style={{ left: `${col.leftPct}%` }} />
                            ))}
                            {/* Phase bars stacked */}
                            <div className="relative h-full space-y-0.5">
                              {projectPhases.map((phase) => {
                                const pStart = parseDate(phase.plannedStartDate);
                                const pEnd = parseDate(phase.plannedEndDate);
                                const left = dateToPct(pStart);
                                const width = dateToPct(pEnd) - left;
                                const tooltip = `${phase.order}. ${phase.name}\nTT: ${phase.status} | ${phase.progress}%\n${fmtShort(phase.plannedStartDate)} – ${fmtShort(phase.plannedEndDate)}`;
                                return (
                                  <div key={phase.id} className="relative h-4">
                                    <PhaseBar
                                      left={left}
                                      width={width}
                                      color={phaseBarColor(phase.status)}
                                      tooltip={tooltip}
                                    />
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>

                {/* Legend */}
                <div className="flex items-center gap-4 flex-wrap border-t border-slate-100 px-5 py-2.5 bg-slate-50">
                  {[
                    { label: "Hoàn thành", color: "bg-emerald-500" },
                    { label: "Đang thực hiện", color: "bg-blue-500" },
                    { label: "Có nguy cơ", color: "bg-amber-500" },
                    { label: "Trễ hạn", color: "bg-red-600" },
                    { label: "Chưa bắt đầu", color: "bg-slate-200" },
                    { label: "Hoàn thành trễ", color: "bg-red-400" },
                  ].map((l) => (
                    <span key={l.label} className="flex items-center gap-1 text-[9px] text-slate-500">
                      <span className={cn("h-2 w-5 rounded-sm inline-block", l.color)} />
                      {l.label}
                    </span>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* ── Right side panels ────────────────────────────────────────────── */}
          <div className="w-72 flex-shrink-0 space-y-4">

            {/* Upcoming deadlines */}
            <Card className="border-slate-200 shadow-sm">
              <CardHeader className="px-4 py-3 border-b border-slate-100">
                <CardTitle className="flex items-center gap-2 text-xs font-semibold text-slate-700">
                  <Clock className="h-3.5 w-3.5 text-amber-500" />
                  Hạn chót sắp tới (30 ngày)
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0 divide-y divide-slate-100">
                {soonDeadlines.length === 0 ? (
                  <p className="px-4 py-3 text-xs text-slate-400">Không có hạn chót sắp tới.</p>
                ) : (
                  soonDeadlines.map((d) => (
                    <div key={d.id} className="px-4 py-2.5">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0 flex-1">
                          <p className="text-[10px] font-semibold text-slate-700 truncate">{d.researchCode}</p>
                          <p className="text-[9px] text-slate-500 truncate">{d.type}</p>
                        </div>
                        <span className={cn("flex-shrink-0 rounded border px-1.5 py-0.5 text-[9px] font-bold", priorityColor(d.priority))}>
                          {d.daysRemaining}N
                        </span>
                      </div>
                      <p className="mt-0.5 text-[9px] text-slate-400">{d.assignee}</p>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>

            {/* Overdue */}
            <Card className="border-red-100 shadow-sm">
              <CardHeader className="px-4 py-3 border-b border-red-100 bg-red-50/50">
                <CardTitle className="flex items-center gap-2 text-xs font-semibold text-red-700">
                  <AlertTriangle className="h-3.5 w-3.5" />
                  Mục quá hạn
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0 divide-y divide-red-50">
                {overdueItems.length === 0 ? (
                  <p className="px-4 py-3 text-xs text-slate-400">Không có mục quá hạn.</p>
                ) : (
                  overdueItems.map((d) => (
                    <div key={d.id} className="px-4 py-2.5">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0 flex-1">
                          <p className="text-[10px] font-semibold text-red-700 truncate">{d.researchCode}</p>
                          <p className="text-[9px] text-slate-500 truncate">{d.type}</p>
                        </div>
                        <span className="flex-shrink-0 rounded border border-red-200 bg-red-50 px-1.5 py-0.5 text-[9px] font-bold text-red-600">
                          +{Math.abs(d.daysRemaining)}N
                        </span>
                      </div>
                      <p className="mt-0.5 text-[9px] text-slate-400">{d.assignee}</p>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>

            {/* Ethics expiring */}
            <Card className="border-purple-100 shadow-sm">
              <CardHeader className="px-4 py-3 border-b border-purple-100 bg-purple-50/50">
                <CardTitle className="flex items-center gap-2 text-xs font-semibold text-purple-700">
                  <Shield className="h-3.5 w-3.5" />
                  Đạo đức sắp hết hạn
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0 divide-y divide-purple-50">
                {ethicsItems.length === 0 ? (
                  <p className="px-4 py-3 text-xs text-slate-400">Không có hồ sơ đạo đức sắp hết hạn.</p>
                ) : (
                  ethicsItems.map((p) => (
                    <div key={p.projectId} className="px-4 py-2.5">
                      <p className="text-[10px] font-semibold text-purple-700 truncate">{p.projectCode}</p>
                      <p className="text-[9px] text-slate-500 truncate">{p.principalInvestigatorName ?? "Chưa phân công"}</p>
                      <div className="mt-0.5 flex items-center gap-1.5">
                        <EthicsBadge status="Sắp hết hạn" />
                        <span className="text-[9px] text-slate-400">HH: {fmtShort(p.ethicsExpiryDate)}</span>
                      </div>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>

          </div>
        </div>
      </div>
    </div>
  );
}
