"use client";

import { useState, useMemo, useEffect, useCallback } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent } from "@/components/ui/card";
import {
  DEPARTMENTS,
  SPONSORS,
} from "@/lib/mock-data";
import type { ResearchProject, EthicsStatus, ProjectHealth } from "@/lib/types";
import { Search, Plus, Eye, Pencil, Trash2, Filter, ArrowUpDown } from "lucide-react";
import DeTaiFormModal, { type DeTaiFormData } from "@/components/modals/DeTaiFormModal";
import { researchApi } from "@/lib/api/research-api";
import { mapApiProjectToUi } from "@/lib/mappers/project-mapper";
import { ConfirmationDialog } from "@/components/common/ConfirmationDialog";
import { toast } from "@/lib/toast";

// ─── Sub-components ───────────────────────────────────────────────────────────

function EthicsBadge({ status }: { status: EthicsStatus }) {
  const map: Record<EthicsStatus, { cls: string }> = {
    "Không yêu cầu": { cls: "bg-slate-100 text-slate-500 border-slate-200" },
    "Chờ duyệt":     { cls: "bg-amber-50 text-amber-700 border-amber-200" },
    "Đã duyệt":      { cls: "bg-emerald-50 text-emerald-700 border-emerald-200" },
    "Sắp hết hạn":   { cls: "bg-orange-50 text-orange-700 border-orange-200" },
    "Hết hạn":       { cls: "bg-red-50 text-red-700 border-red-200" },
  };
  return (
    <span className={cn("inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold whitespace-nowrap", map[status].cls)}>
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
    <span className={cn("inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold whitespace-nowrap", map[health])}>
      {health}
    </span>
  );
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    "Đang thực hiện": "bg-blue-50 text-blue-700 border-blue-200",
    "Hoàn thành":     "bg-emerald-50 text-emerald-700 border-emerald-200",
    "Tạm dừng":       "bg-slate-100 text-slate-600 border-slate-200",
    "Chưa bắt đầu":  "bg-slate-50 text-slate-500 border-slate-200",
  };
  return (
    <span className={cn("inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold whitespace-nowrap", map[status] ?? "bg-slate-100 text-slate-600 border-slate-200")}>
      {status}
    </span>
  );
}

// ─── Props ────────────────────────────────────────────────────────────────────
interface DeTaiListProps {
  onViewDetail: (project: ResearchProject) => void;
}

type SortKey =
  | "code"
  | "name"
  | "department"
  | "pi"
  | "sponsor"
  | "protocolNumber"
  | "ethicsStatus"
  | "currentPhase"
  | "progress"
  | "nearestDeadline"
  | "status"
  | "health";

type SortDirection = "asc" | "desc";

const columns: Array<{ label: string; key?: SortKey; className?: string }> = [
  { label: "Mã", key: "code", className: "w-[7%]" },
  { label: "Tên đề tài", key: "name", className: "w-[16%]" },
  { label: "Khoa/phòng", key: "department", className: "w-[8%]" },
  { label: "Chủ nhiệm", key: "pi", className: "w-[8%]" },
  { label: "Tài trợ", key: "sponsor", className: "w-[7%]" },
  { label: "Đề cương", key: "protocolNumber", className: "w-[7%]" },
  { label: "Đạo đức", key: "ethicsStatus", className: "w-[8%]" },
  { label: "Giai đoạn", key: "currentPhase", className: "w-[8%]" },
  { label: "Tiến độ", key: "progress", className: "w-[7%]" },
  { label: "Hạn chót", key: "nearestDeadline", className: "w-[7%]" },
  { label: "Trạng thái", key: "status", className: "w-[7%]" },
  { label: "Sức khỏe", key: "health", className: "w-[7%]" },
  { label: "", className: "w-[8%]" },
];

function mapEthicsToApi(status: string) {
  if (status === "Đã duyệt" || status === "Sắp hết hạn") return "approved";
  if (status === "Chờ duyệt") return "pending";
  if (status === "Hết hạn") return "expired";
  return "not_required";
}

function mapStatusToApi(status: string) {
  if (status === "Hoàn thành") return "completed";
  if (status === "Chưa bắt đầu") return "not_started";
  if (status === "Tạm dừng") return "paused";
  return "in_progress";
}

function mapHealthToApi(health?: ProjectHealth) {
  if (health === "Trễ hạn" || health === "Hoàn thành trễ") return "high";
  if (health === "Có nguy cơ") return "medium";
  return "low";
}

function buildProjectPayload(data: DeTaiFormData, existing?: ResearchProject | null) {
  return {
    projectTitle: data.name.trim(),
    description: data.description.trim() || null,
    departmentId: existing?.departmentId ?? null,
    principalInvestigatorId: existing?.principalInvestigatorId ?? null,
    sponsorId: existing?.sponsorId ?? null,
    sponsorName: data.sponsor.trim() || null,
    researchType: data.type || null,
    protocolNumber: data.protocolNumber.trim() || null,
    protocolVersion: data.protocolVersion.trim() || null,
    ethicsStatus: mapEthicsToApi(data.ethicsStatus),
    ethicsApprovalDate: null,
    ethicsExpiryDate: null,
    plannedStartDate: data.startDate || null,
    plannedEndDate: data.endDate || null,
    actualStartDate: null,
    actualEndDate: null,
    currentPhaseName: data.currentPhase.trim() || "Chưa bắt đầu",
    progressPercent: Number(data.progress || 0),
    projectStatus: mapStatusToApi(data.status),
    riskLevel: mapHealthToApi(existing?.health),
    notes: data.notes.trim() || null,
  };
}

function getSortValue(project: ResearchProject, key: SortKey) {
  if (key === "progress") return project.progress;
  if (key === "nearestDeadline") return project.nearestDeadline ? new Date(project.nearestDeadline).getTime() : 0;
  return String(project[key] ?? "").toLocaleLowerCase("vi-VN");
}

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function DeTaiList({ onViewDetail }: DeTaiListProps) {
  const [projects, setProjects] = useState<ResearchProject[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [filterDept, setFilterDept] = useState("Tất cả");
  const [filterSponsor, setFilterSponsor] = useState("Tất cả");
  const [filterStatus, setFilterStatus] = useState("Tất cả");
  const [filterEthics, setFilterEthics] = useState("Tất cả");
  const [showOverdueOnly, setShowOverdueOnly] = useState(false);
  const [formModalOpen, setFormModalOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<ResearchProject | null>(null);
  const [projectToDelete, setProjectToDelete] = useState<ResearchProject | null>(null);
  const [deletingProjectId, setDeletingProjectId] = useState<string | null>(null);
  const [actionError, setActionError] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("code");
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc");

  const loadProjects = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const result = await researchApi.getProjects({ pageSize: 100, search: searchQuery || undefined });
      setProjects(result.items.map(mapApiProjectToUi));
    } catch {
      setError("Không tải được danh sách đề tài từ API.");
      toast.error("Không tải được danh sách đề tài.");
      setProjects([]);
    } finally {
      setLoading(false);
    }
  }, [searchQuery]);

  useEffect(() => {
    const timer = window.setTimeout(() => void loadProjects(), 250);
    return () => window.clearTimeout(timer);
  }, [loadProjects]);

  const handleDeleteProject = async () => {
    if (!projectToDelete) return;
    setActionError("");
    setDeletingProjectId(projectToDelete.id);
    try {
      await researchApi.deleteProject(projectToDelete.id);
      toast.success({ title: "Đã xóa đề tài", description: projectToDelete.code });
      setProjectToDelete(null);
      await loadProjects();
    } catch (deleteError) {
      const message = deleteError instanceof Error ? deleteError.message : "Không xóa được đề tài.";
      setActionError(message);
      toast.error({ title: "Không xóa được đề tài", description: message });
    } finally {
      setDeletingProjectId(null);
    }
  };

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

  const handleCreateProject = async (data: DeTaiFormData) => {
    setActionError("");
    try {
      await researchApi.createProject({
        projectCode: data.code.trim(),
        ...buildProjectPayload(data),
      });
      toast.success({ title: "Đã thêm đề tài", description: data.code.trim() });
      await loadProjects();
    } catch (createError) {
      const message = createError instanceof Error ? createError.message : "Không thêm được đề tài.";
      setActionError(message);
      toast.error({ title: "Không thêm được đề tài", description: message });
      throw new Error(message);
    }
  };

  const handleUpdateProject = async (data: DeTaiFormData) => {
    if (!editingProject) return;
    setActionError("");
    try {
      await researchApi.updateProject(editingProject.id, buildProjectPayload(data, editingProject));
      toast.success({ title: "Đã cập nhật đề tài", description: editingProject.code });
      setEditingProject(null);
      await loadProjects();
    } catch (updateError) {
      const message = updateError instanceof Error ? updateError.message : "Không cập nhật được đề tài.";
      setActionError(message);
      toast.error({ title: "Không cập nhật được đề tài", description: message });
      throw new Error(message);
    }
  };

  const filtered = useMemo(() => {
    return projects.filter((p) => {
      if (filterDept !== "Tất cả" && p.department !== filterDept) return false;
      if (filterSponsor !== "Tất cả" && p.sponsor !== filterSponsor) return false;
      if (filterStatus !== "Tất cả" && p.status !== filterStatus) return false;
      if (filterEthics !== "Tất cả" && p.ethicsStatus !== filterEthics) return false;
      if (showOverdueOnly && p.health !== "Trễ hạn") return false;
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        if (!p.name.toLowerCase().includes(q) && !p.code.toLowerCase().includes(q) && !p.pi.toLowerCase().includes(q)) return false;
      }
      return true;
    });
  }, [projects, searchQuery, filterDept, filterSponsor, filterStatus, filterEthics, showOverdueOnly]);

  const sortedProjects = useMemo(() => {
    return [...filtered].sort((a, b) => {
      const left = getSortValue(a, sortKey);
      const right = getSortValue(b, sortKey);
      const result = typeof left === "number" && typeof right === "number"
        ? left - right
        : String(left).localeCompare(String(right), "vi-VN", { numeric: true, sensitivity: "base" });
      return sortDirection === "asc" ? result : -result;
    });
  }, [filtered, sortDirection, sortKey]);

  const hasFilters = filterDept !== "Tất cả" || filterSponsor !== "Tất cả" || filterStatus !== "Tất cả" || filterEthics !== "Tất cả" || showOverdueOnly || !!searchQuery;

  return (
    <div>
      {/* ── Page header ─────────────────────────────────────────────────────── */}
      <div className="border-b border-slate-200 bg-white px-8 py-5 flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold text-slate-800">Đề tài nghiên cứu</h1>
          <p className="mt-0.5 text-sm text-slate-500">Quản lý danh sách các đề tài nghiên cứu — thay thế Excel theo dõi.</p>
        </div>
        <Button onClick={() => setFormModalOpen(true)} className="h-10 min-w-[140px] gap-2 rounded-lg px-4 py-2">
          <Plus className="h-5 w-5" />
          Thêm đề tài
        </Button>
      </div>

      <div className="px-8 py-6 space-y-4">
        {loading && (
          <Card className="border-slate-200 shadow-sm">
            <CardContent className="p-4 text-sm text-slate-500">Đang tải danh sách đề tài...</CardContent>
          </Card>
        )}

        {error && (
          <Card className="border-red-200 bg-red-50 shadow-sm">
            <CardContent className="flex items-center justify-between gap-3 p-4">
              <p className="text-sm font-medium text-red-700">{error}</p>
              <Button size="sm" variant="outline" onClick={() => void loadProjects()}>Thử lại</Button>
            </CardContent>
          </Card>
        )}
        {actionError && (
          <Card className="border-red-200 bg-red-50 shadow-sm">
            <CardContent className="p-4 text-sm font-medium text-red-700">{actionError}</CardContent>
          </Card>
        )}

        {/* Filter bar */}
        <Card className="border-slate-200 shadow-sm">
          <CardContent className="p-3.5">
            <div className="flex items-center gap-2 flex-wrap">
              <div className="relative flex-1 min-w-44">
                <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
                <Input
                  placeholder="Mã, tên, chủ nhiệm..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="h-8 pl-9 text-xs border-slate-200"
                />
              </div>

              {[
                { label: "Khoa/phòng", value: filterDept, setter: setFilterDept, options: DEPARTMENTS },
                { label: "Nhà tài trợ", value: filterSponsor, setter: setFilterSponsor, options: SPONSORS },
                { label: "Trạng thái", value: filterStatus, setter: setFilterStatus, options: ["Tất cả", "Đang thực hiện", "Hoàn thành", "Tạm dừng", "Chưa bắt đầu"] },
                { label: "Đạo đức", value: filterEthics, setter: setFilterEthics, options: ["Tất cả", "Không yêu cầu", "Chờ duyệt", "Đã duyệt", "Sắp hết hạn", "Hết hạn"] },
              ].map((f) => (
                <Select key={f.label} value={f.value} onValueChange={(v) => v && f.setter(v)}>
                  <SelectTrigger className="h-8 w-36 text-xs border-slate-200">
                    <SelectValue placeholder={f.label} />
                  </SelectTrigger>
                  <SelectContent>
                    {f.options.map((o) => (
                      <SelectItem key={o} value={o} className="text-xs">{o}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ))}

              {/* Overdue toggle */}
              <button
                onClick={() => setShowOverdueOnly((v) => !v)}
                className={cn(
                  "flex items-center gap-1.5 rounded-md border px-3 h-8 text-xs font-medium transition-colors",
                  showOverdueOnly
                    ? "bg-red-50 border-red-300 text-red-700"
                    : "border-slate-200 text-slate-600 hover:bg-slate-50"
                )}
              >
                <Filter className="h-3 w-3" />
                Chỉ quá hạn
              </button>

              {hasFilters && (
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-8 px-2 text-xs text-slate-500"
                  onClick={() => { setSearchQuery(""); setFilterDept("Tất cả"); setFilterSponsor("Tất cả"); setFilterStatus("Tất cả"); setFilterEthics("Tất cả"); setShowOverdueOnly(false); }}
                >
                  Xóa bộ lọc
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Table */}
        <Card className="border-slate-200 shadow-sm overflow-hidden">
          <CardContent className="p-0">
              <Table className="w-full table-fixed">
                <TableHeader>
                  <TableRow className="bg-slate-50 hover:bg-slate-50 border-b border-slate-200">
                    {columns.map((column) => (
                      <TableHead
                        key={column.label}
                        className={cn("py-2.5 px-2 align-top text-[10px] font-semibold uppercase tracking-wide text-slate-500 whitespace-normal", column.className)}
                      >
                        {column.key ? (
                          <button
                            type="button"
                            onClick={() => handleSort(column.key!)}
                            className={cn(
                              "flex w-full items-start gap-1 rounded px-0.5 py-0.5 text-left leading-tight hover:bg-slate-100 hover:text-slate-700",
                              sortKey === column.key && "text-blue-700"
                            )}
                            title={`Sắp xếp theo ${column.label}`}
                          >
                            <span className="min-w-0 flex-1 break-words">{column.label}</span>
                            <ArrowUpDown className={cn("mt-0.5 h-3 w-3 shrink-0", sortKey === column.key && sortDirection === "desc" && "rotate-180")} />
                          </button>
                        ) : (
                          column.label
                        )}
                      </TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sortedProjects.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={13} className="py-12 text-center text-sm text-slate-400">
                        Không tìm thấy đề tài nào.
                      </TableCell>
                    </TableRow>
                  ) : (
                    sortedProjects.map((p) => (
                      <TableRow
                        key={p.id}
                        className="border-b border-slate-100 hover:bg-slate-50/70 transition-colors"
                      >
                        <TableCell className="px-2 py-2.5 align-top whitespace-normal">
                          <span className="inline-flex items-center rounded-md bg-blue-50 px-2 py-0.5 text-[10px] font-bold text-blue-700 border border-blue-100 whitespace-nowrap">
                            {p.code}
                          </span>
                        </TableCell>
                        <TableCell className="px-2 py-2.5 align-top whitespace-normal">
                          <p className="text-xs font-semibold leading-snug text-slate-800 break-words">{p.name}</p>
                          {p.description && <p className="mt-1 text-[10px] leading-snug text-slate-500 break-words">{p.description}</p>}
                        </TableCell>
                        <TableCell className="px-2 py-2.5 align-top whitespace-normal">
                          <span className="text-xs leading-snug text-slate-600 break-words">{p.department}</span>
                        </TableCell>
                        <TableCell className="px-2 py-2.5 align-top whitespace-normal">
                          <span className="text-xs font-medium leading-snug text-slate-700 break-words">{p.pi}</span>
                        </TableCell>
                        <TableCell className="px-2 py-2.5 align-top whitespace-normal">
                          <span className="text-xs leading-snug text-slate-500 break-words">{p.sponsor}</span>
                        </TableCell>
                        <TableCell className="px-2 py-2.5 align-top whitespace-normal">
                          <div className="space-y-0.5">
                            <p className="text-[10px] font-mono leading-snug text-slate-700 break-words">{p.protocolNumber || "Chưa có"}</p>
                            <p className="text-[9px] text-slate-400">{p.protocolVersion}</p>
                          </div>
                        </TableCell>
                        <TableCell className="px-2 py-2.5 align-top">
                          <EthicsBadge status={p.ethicsStatus} />
                        </TableCell>
                        <TableCell className="px-2 py-2.5 align-top whitespace-normal">
                          <span className="text-[10px] leading-snug text-slate-600 break-words">{p.currentPhase}</span>
                        </TableCell>
                        <TableCell className="px-2 py-2.5 align-top">
                          <div className="space-y-1">
                            <div className="h-1.5 w-full rounded-full bg-slate-200 overflow-hidden">
                              <div
                                className={cn(
                                  "h-full rounded-full transition-all",
                                  p.progress >= 70 ? "bg-emerald-500" : p.progress >= 40 ? "bg-blue-500" : "bg-amber-500"
                                )}
                                style={{ width: `${p.progress}%` }}
                              />
                            </div>
                            <span className="block text-[10px] font-semibold text-slate-600">{p.progress}%</span>
                          </div>
                        </TableCell>
                        <TableCell className="px-2 py-2.5 align-top">
                          {p.nearestDeadline ? (
                            <span className="text-[10px] font-medium leading-tight text-red-500">
                              {p.nearestDeadline.split("-").reverse().join("/")}
                            </span>
                          ) : (
                            <span className="text-slate-300 text-xs">—</span>
                          )}
                        </TableCell>
                        <TableCell className="px-2 py-2.5 align-top">
                          <StatusBadge status={p.status} />
                        </TableCell>
                        <TableCell className="px-2 py-2.5 align-top">
                          <HealthBadge health={p.health} />
                        </TableCell>
                        <TableCell className="px-2 py-2.5 align-top whitespace-nowrap">
                          <div className="flex flex-nowrap items-center justify-end gap-0.5">
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-6 w-6 p-0 text-blue-600 hover:bg-blue-50"
                              title="Xem chi tiết"
                              onClick={() => onViewDetail(p)}
                            >
                              <Eye className="h-3 w-3" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-6 w-6 p-0 text-slate-500 hover:bg-slate-100"
                              title="Sửa đề tài"
                              onClick={() => setEditingProject(p)}
                            >
                              <Pencil className="h-3 w-3" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-6 w-6 p-0 text-slate-400 hover:bg-red-50 hover:text-red-500"
                              disabled={deletingProjectId === p.id}
                              onClick={() => setProjectToDelete(p)}
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
          </CardContent>
        </Card>

        <p className="text-xs text-slate-400">
          Hiển thị {sortedProjects.length} / {projects.length} đề tài. Bấm tiêu đề cột để sắp xếp.
        </p>
      </div>

      <DeTaiFormModal
        open={formModalOpen}
        mode="create"
        onOpenChange={setFormModalOpen}
        onSave={handleCreateProject}
      />
      <DeTaiFormModal
        open={!!editingProject}
        mode="edit"
        project={editingProject}
        onOpenChange={(open) => {
          if (!open) setEditingProject(null);
        }}
        onSave={handleUpdateProject}
      />
      <ConfirmationDialog
        open={!!projectToDelete}
        onOpenChange={(open) => {
          if (!open && !deletingProjectId) setProjectToDelete(null);
        }}
        type="delete"
        itemName={projectToDelete?.name ?? "đề tài này"}
        onConfirm={() => void handleDeleteProject()}
        isLoading={!!deletingProjectId}
      />
    </div>
  );
}
