"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { mockPhases, mockMilestones, mockDeadlines } from "@/lib/mock-data";
import type { ResearchProject, PhaseStatus, EthicsStatus, ProjectHealth } from "@/lib/types";
import GiaiDoanGanttChart from "@/components/gantt/GiaiDoanGanttChart";
import PhaseFormModal from "@/components/modals/PhaseFormModal";
import {
  ArrowLeft,
  Activity,
  Calendar,
  User,
  Building2,
  FlaskConical,
  Shield,
  FileText,
  AlertTriangle,
  Pencil,
  Plus,
  Clock,
  TrendingUp,
  BookOpen,
  CheckCircle2,
  Circle,
  XCircle,
} from "lucide-react";

// ─── Import types ─────────────────────────────────────────────────────────────
// PageKey is now from Sidebar
import type { PageKey as SidebarPageKey } from "@/components/layout/Sidebar";

// ─── Status helpers ───────────────────────────────────────────────────────────
function EthicsBadge({ status }: { status: EthicsStatus }) {
  const map: Record<EthicsStatus, { cls: string }> = {
    "Không yêu cầu": { cls: "bg-slate-100 text-slate-500 border-slate-200" },
    "Chờ duyệt":     { cls: "bg-amber-50 text-amber-700 border-amber-200" },
    "Đã duyệt":      { cls: "bg-emerald-50 text-emerald-700 border-emerald-200" },
    "Sắp hết hạn":   { cls: "bg-orange-50 text-orange-700 border-orange-200" },
    "Hết hạn":       { cls: "bg-red-50 text-red-700 border-red-200" },
  };
  return (
    <span className={cn("inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold", map[status].cls)}>
      {status}
    </span>
  );
}

function HealthBadge({ health }: { health: ProjectHealth }) {
  const map: Record<string, string> = {
    "Đúng tiến độ": "bg-emerald-50 text-emerald-700 border-emerald-200",
    "Có nguy cơ":   "bg-amber-50 text-amber-700 border-amber-200",
    "Trễ hạn":      "bg-red-50 text-red-700 border-red-200",
    "Đã hoàn thành": "bg-blue-50 text-blue-700 border-blue-200",
    "Hoàn thành trễ": "bg-red-50 text-red-600 border-red-200",
    "Tạm dừng":     "bg-slate-100 text-slate-600 border-slate-200",
    "Hoàn thành":   "bg-blue-50 text-blue-700 border-blue-200",
  };
  return (
    <span className={cn("inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold", map[health])}>
      {health}
    </span>
  );
}

function PhaseBadge({ status }: { status: PhaseStatus }) {
  const map: Record<string, string> = {
    "Hoàn thành":      "bg-emerald-50 text-emerald-700 border-emerald-200",
    "Hoàn thành trễ":  "bg-red-50 text-red-600 border-red-200",
    "Đang thực hiện":  "bg-blue-50 text-blue-700 border-blue-200",
    "Chờ duyệt":       "bg-violet-50 text-violet-700 border-violet-200",
    "Cần chỉnh sửa":   "bg-orange-50 text-orange-700 border-orange-200",
    "Chưa bắt đầu":   "bg-slate-100 text-slate-500 border-slate-200",
    "Trễ hạn":         "bg-red-50 text-red-700 border-red-200",
    "Có nguy cơ":      "bg-amber-50 text-amber-700 border-amber-200",
    "Tạm dừng":        "bg-slate-100 text-slate-600 border-slate-200",
    "Hủy":             "bg-slate-100 text-slate-600 border-slate-200",
  };
  return (
    <span className={cn("inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold whitespace-nowrap", map[status])}>
      {status}
    </span>
  );
}

function InfoRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-3 py-2.5 border-b border-slate-100 last:border-0">
      <span className="w-44 flex-shrink-0 text-xs text-slate-500">{label}</span>
      <div className="flex-1 text-xs font-medium text-slate-800">{children}</div>
    </div>
  );
}

// ─── Props ────────────────────────────────────────────────────────────────────
interface ChiTietDeTaiProps {
  project: ResearchProject;
  onBack: () => void;
  onNavigate: (page: SidebarPageKey) => void;
}

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function ChiTietDeTai({ project, onBack, onNavigate }: ChiTietDeTaiProps) {
  const [activeTab, setActiveTab] = useState("tong-quan");
  const [phaseModalOpen, setPhaseModalOpen] = useState(false);

  const phases = mockPhases.filter((p) => p.researchId === project.id);
  const milestones = mockMilestones.filter((m) => m.researchId === project.id);
  const deadlines = mockDeadlines.filter((d) => d.researchId === project.id);

  const phaseDone = phases.filter((p) => p.status === "Hoàn thành" || p.status === "Hoàn thành trễ").length;
  const phaseInProgress = phases.filter((p) => p.status === "Đang thực hiện").length;
  const phaseLate = phases.filter((p) => p.status === "Trễ hạn" || p.status === "Hoàn thành trễ").length;

  const formatDate = (s: string | null) => {
    if (!s) return "—";
    return s.split("-").reverse().join("/");
  };

  const priorityColor = (priority: string) => ({
    critical: "bg-red-50 text-red-700 border-red-200",
    high:     "bg-orange-50 text-orange-700 border-orange-200",
    medium:   "bg-amber-50 text-amber-700 border-amber-200",
    normal:   "bg-blue-50 text-blue-700 border-blue-200",
    ethics:   "bg-purple-50 text-purple-700 border-purple-200",
  }[priority] ?? "bg-slate-50 text-slate-600 border-slate-200");

  // Mock activity log
  const activityLog = [
    { date: "03/07/2026", user: "PGS.TS Nguyễn Thị Mai", action: "Cập nhật tiến độ giai đoạn Thu thập số liệu lên 45%", type: "update" },
    { date: "01/07/2026", user: "Hệ thống",               action: "Giai đoạn Triển khai nghiên cứu đạt 80% tiến độ", type: "milestone" },
    { date: "15/06/2026", user: "PGS.TS Nguyễn Thị Mai", action: "Hoàn thành giai đoạn Phê duyệt đạo đức (trễ 10 ngày)", type: "complete" },
    { date: "01/06/2026", user: "Hệ thống",               action: "Bắt đầu giai đoạn Triển khai nghiên cứu", type: "start" },
    { date: "05/05/2026", user: "PGS.TS Nguyễn Thị Mai", action: "Nộp hồ sơ phê duyệt đạo đức lên IRB", type: "update" },
  ];

  const activityIcon = (type: string) => ({
    update:    <TrendingUp className="h-3.5 w-3.5 text-blue-500" />,
    milestone: <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />,
    complete:  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />,
    start:     <Circle className="h-3.5 w-3.5 text-slate-400" />,
  }[type] ?? <Circle className="h-3.5 w-3.5 text-slate-400" />);

  return (
    <div>
      {/* ── Back + Header ───────────────────────────────────────────────────── */}
      <div className="border-b border-slate-200 bg-white px-8 py-4">
        <button
          onClick={onBack}
          className="mb-3 flex items-center gap-1.5 text-xs text-blue-600 hover:text-blue-800 font-medium"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> Quay lại danh sách đề tài
        </button>
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="inline-flex items-center rounded-md bg-blue-50 px-2.5 py-1 text-xs font-bold text-blue-700 border border-blue-100">
                {project.code}
              </span>
              <HealthBadge health={project.health} />
            </div>
            <h1 className="text-base font-bold text-slate-800 leading-snug max-w-2xl">
              {project.name}
            </h1>
            <p className="mt-1 text-xs text-slate-500">{project.department} &mdash; {project.pi}</p>
          </div>
          <Button
            variant="outline"
            className="flex-shrink-0 gap-1.5 border-slate-200 text-slate-600 text-xs h-8"
          >
            <Pencil className="h-3.5 w-3.5" /> Chỉnh sửa
          </Button>
        </div>
      </div>

      {/* ── KPI summary bar ──────────────────────────────────────────────────── */}
      <div className="bg-white border-b border-slate-100 px-8 py-3">
        <div className="flex items-center gap-8 flex-wrap">
          {[
            { label: "Tiến độ tổng", value: `${project.progress}%`, color: "text-blue-600" },
            { label: "Giai đoạn hiện tại", value: project.currentPhase, color: "text-slate-800" },
            { label: "Bắt đầu", value: formatDate(project.startDate), color: "text-slate-700" },
            { label: "Dự kiến kết thúc", value: formatDate(project.plannedEndDate), color: "text-slate-700" },
            { label: "Đạo đức", value: project.ethicsStatus, color: "text-slate-700", badge: <EthicsBadge status={project.ethicsStatus} /> },
          ].map((item) => (
            <div key={item.label} className="flex flex-col gap-0.5">
              <span className="text-[9px] font-semibold uppercase tracking-wide text-slate-400">{item.label}</span>
              {item.badge ? item.badge : <span className={cn("text-sm font-bold", item.color)}>{item.value}</span>}
            </div>
          ))}
          <div className="flex flex-col gap-1 flex-1 min-w-32 max-w-48">
            <span className="text-[9px] font-semibold uppercase tracking-wide text-slate-400">Thanh tiến độ</span>
            <Progress value={project.progress} className="h-2 bg-slate-100" />
          </div>
        </div>
      </div>

      {/* ── Tabs ────────────────────────────────────────────────────────────── */}
      <div className="px-8 py-5">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="h-9 border border-slate-200 bg-slate-50 p-0.5 rounded-lg">
            {[
              { value: "tong-quan", label: "Tổng quan" },
              { value: "giai-doan", label: "Giai đoạn" },
              { value: "gantt", label: "Gantt" },
              { value: "han-chot", label: "Hạn chót" },
              { value: "tai-lieu", label: "Tài liệu" },
              { value: "nhat-ky", label: "Nhật ký" },
            ].map((tab) => (
              <TabsTrigger
                key={tab.value}
                value={tab.value}
                className="h-8 px-4 text-xs font-medium data-[state=active]:bg-white data-[state=active]:text-blue-700 data-[state=active]:shadow-sm text-slate-600"
              >
                {tab.label}
              </TabsTrigger>
            ))}
          </TabsList>

          {/* ── Tổng quan tab ───────────────────────────────────────────────── */}
          <TabsContent value="tong-quan" className="mt-5">
            <div className="grid grid-cols-2 gap-5">
              {/* Left: project info */}
              <Card className="border-slate-200 shadow-sm">
                <CardHeader className="px-5 py-4 border-b border-slate-100">
                  <CardTitle className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                    <FlaskConical className="h-4 w-4 text-blue-500" />
                    Thông tin đề tài
                  </CardTitle>
                </CardHeader>
                <CardContent className="px-5 py-2">
                  <InfoRow label="Mã đề tài">{project.code}</InfoRow>
                  <InfoRow label="Tên đề tài">
                    <span className="leading-snug">{project.name}</span>
                  </InfoRow>
                  <InfoRow label="Mô tả">
                    <span className="leading-relaxed text-slate-600">{project.description}</span>
                  </InfoRow>
                  <InfoRow label="Khoa/phòng chủ trì">{project.department}</InfoRow>
                  <InfoRow label="Chủ nhiệm đề tài">{project.pi}</InfoRow>
                  <InfoRow label="Nhà tài trợ">{project.sponsor}</InfoRow>
                  <InfoRow label="Loại nghiên cứu">{project.researchType}</InfoRow>
                  <InfoRow label="Mã đề cương">
                    <span className="font-mono">{project.protocolNumber}</span>
                  </InfoRow>
                  <InfoRow label="Phiên bản đề cương">{project.protocolVersion}</InfoRow>
                </CardContent>
              </Card>

              {/* Right: timeline + ethics */}
              <div className="space-y-5">
                <Card className="border-slate-200 shadow-sm">
                  <CardHeader className="px-5 py-4 border-b border-slate-100">
                    <CardTitle className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                      <Shield className="h-4 w-4 text-purple-500" />
                      Phê duyệt đạo đức
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="px-5 py-2">
                    <InfoRow label="Trạng thái đạo đức">
                      <EthicsBadge status={project.ethicsStatus} />
                    </InfoRow>
                    <InfoRow label="Ngày hết hạn đạo đức">
                      {project.ethicsExpiry ? (
                        <span className={cn("font-semibold", project.ethicsStatus === "Sắp hết hạn" || project.ethicsStatus === "Hết hạn" ? "text-red-600" : "text-slate-800")}>
                          {formatDate(project.ethicsExpiry)}
                        </span>
                      ) : "—"}
                    </InfoRow>
                  </CardContent>
                </Card>

                <Card className="border-slate-200 shadow-sm">
                  <CardHeader className="px-5 py-4 border-b border-slate-100">
                    <CardTitle className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                      <Calendar className="h-4 w-4 text-blue-500" />
                      Thời gian & tiến độ
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="px-5 py-2">
                    <InfoRow label="Ngày bắt đầu">{formatDate(project.startDate)}</InfoRow>
                    <InfoRow label="Ngày kết thúc dự kiến">{formatDate(project.plannedEndDate)}</InfoRow>
                    <InfoRow label="Tiến độ tổng">
                      <div className="flex items-center gap-3">
                        <Progress value={project.progress} className="flex-1 h-2" />
                        <span className="font-bold text-blue-600 w-8 text-sm">{project.progress}%</span>
                      </div>
                    </InfoRow>
                    <InfoRow label="Giai đoạn hiện tại">{project.currentPhase}</InfoRow>
                    <InfoRow label="Hạn chót gần nhất">
                      <span className="text-red-500 font-semibold">{formatDate(project.nearestDeadline)}</span>
                    </InfoRow>
                    <InfoRow label="Tình trạng dự án">
                      <HealthBadge health={project.health} />
                    </InfoRow>
                  </CardContent>
                </Card>

                {/* Phase summary mini-cards */}
                <div className="grid grid-cols-4 gap-3">
                  {[
                    { label: "Tổng", value: phases.length, color: "text-slate-700" },
                    { label: "Hoàn thành", value: phaseDone, color: "text-emerald-600" },
                    { label: "Đang làm", value: phaseInProgress, color: "text-blue-600" },
                    { label: "Trễ hạn", value: phaseLate, color: "text-red-500" },
                  ].map((item) => (
                    <div key={item.label} className="flex flex-col items-center rounded-lg bg-slate-50 border border-slate-100 p-3">
                      <span className={cn("text-xl font-bold", item.color)}>{item.value}</span>
                      <span className="mt-0.5 text-[9px] text-slate-500 text-center leading-tight">{item.label}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </TabsContent>

          {/* ── Giai đoạn tab ───────────────────────────────────────────────── */}
          <TabsContent value="giai-doan" className="mt-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-slate-700">
                Danh sách giai đoạn ({phases.length})
              </h3>
              <Button
                size="sm"
                className="gap-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs h-8"
                onClick={() => setPhaseModalOpen(true)}
              >
                <Plus className="h-3.5 w-3.5" /> Thêm giai đoạn
              </Button>
            </div>
            <div className="space-y-2">
              {phases.map((phase) => (
                <Card key={phase.id} className="border-slate-200 shadow-sm hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-start gap-4">
                      {/* Order badge */}
                      <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-blue-50 border border-blue-100">
                        <span className="text-xs font-bold text-blue-700">{phase.order}</span>
                      </div>
                      {/* Phase info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-1.5">
                          <span className="text-sm font-semibold text-slate-800">{phase.name}</span>
                          <PhaseBadge status={phase.status} />
                          {phase.delayDays > 0 && (
                            <span className="text-[10px] font-medium text-red-500">Trễ {phase.delayDays} ngày</span>
                          )}
                        </div>
                        <div className="grid grid-cols-4 gap-3 text-[10px] text-slate-500 mb-2">
                          <span>Dự kiến: <span className="text-slate-700">{formatDate(phase.plannedStartDate)} – {formatDate(phase.plannedEndDate)}</span></span>
                          <span>Thực tế: <span className="text-slate-700">{formatDate(phase.actualStartDate)} – {formatDate(phase.actualEndDate)}</span></span>
                          <span>Hạn chót: <span className="text-red-500 font-medium">{formatDate(phase.deadline)}</span></span>
                          <span>Phụ trách: <span className="text-slate-700">{phase.assignee ?? "—"}</span></span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Progress
                            value={phase.progress}
                            className={cn(
                              "flex-1 h-1.5",
                              phase.status === "Hoàn thành" ? "[&>div]:bg-emerald-500" :
                              phase.status === "Trễ hạn" || phase.status === "Hoàn thành trễ" ? "[&>div]:bg-red-500" :
                              phase.status === "Có nguy cơ" ? "[&>div]:bg-amber-500" : "[&>div]:bg-blue-500"
                            )}
                          />
                          <span className="text-xs font-semibold text-slate-700 w-8">{phase.progress}%</span>
                        </div>
                      </div>
                      {/* Actions */}
                      <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-slate-400 hover:bg-slate-100 flex-shrink-0">
                        <Pencil className="h-3 w-3" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* ── Gantt tab ───────────────────────────────────────────────────── */}
          <TabsContent value="gantt" className="mt-5">
            <GiaiDoanGanttChart phases={phases} />
          </TabsContent>

          {/* ── Hạn chót tab ────────────────────────────────────────────────── */}
          <TabsContent value="han-chot" className="mt-5">
            <h3 className="mb-4 text-sm font-semibold text-slate-700">Hạn chót của đề tài</h3>
            {deadlines.length === 0 ? (
              <p className="text-sm text-slate-400">Không có hạn chót nào.</p>
            ) : (
              <div className="space-y-2">
                {deadlines.map((d) => (
                  <Card key={d.id} className={cn("border shadow-sm", d.daysRemaining < 0 ? "border-red-200" : "border-slate-200")}>
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-2">
                            <span className={cn("inline-flex rounded border px-2 py-0.5 text-[10px] font-bold", priorityColor(d.priority))}>
                              {d.priority === "critical" ? "Quá hạn" : d.priority === "ethics" ? "Đạo đức" : d.priority === "high" ? "Cao" : d.priority === "medium" ? "Trung bình" : "Thường"}
                            </span>
                            <span className="text-xs font-semibold text-slate-700">{d.type}</span>
                          </div>
                          <p className="text-[10px] text-slate-500">Phụ trách: {d.assignee}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-xs font-semibold text-slate-700">{formatDate(d.dueDate)}</p>
                          <p className={cn("text-[10px] font-bold", d.daysRemaining < 0 ? "text-red-600" : d.daysRemaining <= 7 ? "text-orange-600" : "text-slate-500")}>
                            {d.daysRemaining < 0 ? `Trễ ${Math.abs(d.daysRemaining)} ngày` : `Còn ${d.daysRemaining} ngày`}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* ── Tài liệu tab ────────────────────────────────────────────────── */}
          <TabsContent value="tai-lieu" className="mt-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-slate-700">Tài liệu đính kèm</h3>
              <Button size="sm" variant="outline" className="gap-1.5 border-slate-200 text-xs h-8">
                <Plus className="h-3.5 w-3.5" /> Tải lên tài liệu
              </Button>
            </div>
            <div className="space-y-2">
              {[
                { name: "Đề cương nghiên cứu v2.1.pdf", size: "2.4 MB", date: "05/03/2026", type: "PDF" },
                { name: "Phiếu phê duyệt IRB.pdf", size: "1.1 MB", date: "28/04/2026", type: "PDF" },
                { name: "Đề cương DC-NC-2026-001 v1.0.docx", size: "890 KB", date: "01/02/2026", type: "DOCX" },
                { name: "Bảng thu thập số liệu.xlsx", size: "345 KB", date: "01/07/2026", type: "XLSX" },
              ].map((doc) => (
                <Card key={doc.name} className="border-slate-200 shadow-sm">
                  <CardContent className="p-3.5">
                    <div className="flex items-center gap-3">
                      <div className={cn(
                        "flex h-8 w-8 flex-shrink-0 items-center justify-center rounded text-[9px] font-bold text-white",
                        doc.type === "PDF" ? "bg-red-500" : doc.type === "DOCX" ? "bg-blue-500" : "bg-emerald-500"
                      )}>
                        {doc.type}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-slate-800 truncate">{doc.name}</p>
                        <p className="text-[10px] text-slate-400">{doc.size} &mdash; {doc.date}</p>
                      </div>
                      <Button size="sm" variant="ghost" className="h-7 text-xs text-blue-600 hover:bg-blue-50 px-2 flex-shrink-0">
                        Tải về
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* ── Nhật ký tab ─────────────────────────────────────────────────── */}
          <TabsContent value="nhat-ky" className="mt-5">
            <h3 className="mb-4 text-sm font-semibold text-slate-700">Nhật ký hoạt động</h3>
            <div className="relative pl-5">
              <div className="absolute left-1.5 top-0 h-full w-0.5 bg-slate-200" />
              <div className="space-y-4">
                {activityLog.map((log, i) => (
                  <div key={i} className="relative flex items-start gap-3">
                    <div className="absolute -left-3.5 top-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-white border border-slate-200">
                      {activityIcon(log.type)}
                    </div>
                    <div className="flex-1 rounded-lg border border-slate-100 bg-white px-4 py-3 shadow-sm">
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-xs text-slate-700 leading-snug">{log.action}</p>
                        <span className="text-[10px] text-slate-400 whitespace-nowrap flex-shrink-0">{log.date}</span>
                      </div>
                      <p className="mt-1 text-[10px] font-medium text-slate-400">{log.user}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      <PhaseFormModal
        open={phaseModalOpen}
        onClose={() => setPhaseModalOpen(false)}
        phase={null}
      />
    </div>
  );
}
