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
import { Search, Plus, Eye, Pencil, Trash2, Filter } from "lucide-react";
import DeTaiFormModal from "@/components/modals/DeTaiFormModal";
import { researchApi } from "@/lib/api/research-api";
import { mapApiProjectToUi } from "@/lib/mappers/project-mapper";

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

  const loadProjects = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const result = await researchApi.getProjects({ pageSize: 100, search: searchQuery || undefined });
      setProjects(result.items.map(mapApiProjectToUi));
    } catch {
      setError("Không tải được danh sách đề tài từ API.");
      setProjects([]);
    } finally {
      setLoading(false);
    }
  }, [searchQuery]);

  useEffect(() => {
    const timer = window.setTimeout(() => void loadProjects(), 250);
    return () => window.clearTimeout(timer);
  }, [loadProjects]);

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
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-slate-50 hover:bg-slate-50 border-b border-slate-200">
                    {[
                      "Mã đề tài",
                      "Tên đề tài",
                      "Khoa/phòng",
                      "Chủ nhiệm",
                      "Nhà tài trợ",
                      "Mã đề cương",
                      "Đạo đức",
                      "Giai đoạn hiện tại",
                      "Tiến độ",
                      "Hạn chót",
                      "Trạng thái",
                      "Sức khỏe DA",
                      "Thao tác",
                    ].map((h) => (
                      <TableHead
                        key={h}
                        className="text-[10px] font-semibold uppercase tracking-wide text-slate-500 py-2.5 px-3 whitespace-nowrap"
                      >
                        {h}
                      </TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={13} className="py-12 text-center text-sm text-slate-400">
                        Không tìm thấy đề tài nào.
                      </TableCell>
                    </TableRow>
                  ) : (
                    filtered.map((p) => (
                      <TableRow
                        key={p.id}
                        className="border-b border-slate-100 hover:bg-slate-50/70 transition-colors"
                      >
                        <TableCell className="px-3 py-2.5">
                          <span className="inline-flex items-center rounded-md bg-blue-50 px-2 py-0.5 text-[10px] font-bold text-blue-700 border border-blue-100 whitespace-nowrap">
                            {p.code}
                          </span>
                        </TableCell>
                        <TableCell className="px-3 py-2.5 max-w-48">
                          <p className="text-xs font-semibold text-slate-800 leading-snug line-clamp-2">{p.name}</p>
                        </TableCell>
                        <TableCell className="px-3 py-2.5">
                          <span className="text-xs text-slate-600 whitespace-nowrap">{p.department}</span>
                        </TableCell>
                        <TableCell className="px-3 py-2.5">
                          <span className="text-xs text-slate-700 whitespace-nowrap font-medium">{p.pi}</span>
                        </TableCell>
                        <TableCell className="px-3 py-2.5 max-w-36">
                          <span className="text-xs text-slate-500 line-clamp-1">{p.sponsor}</span>
                        </TableCell>
                        <TableCell className="px-3 py-2.5">
                          <div className="space-y-0.5">
                            <p className="text-[10px] font-mono text-slate-700">{p.protocolNumber}</p>
                            <p className="text-[9px] text-slate-400">{p.protocolVersion}</p>
                          </div>
                        </TableCell>
                        <TableCell className="px-3 py-2.5">
                          <EthicsBadge status={p.ethicsStatus} />
                        </TableCell>
                        <TableCell className="px-3 py-2.5">
                          <span className="text-[10px] text-slate-600 whitespace-nowrap">{p.currentPhase}</span>
                        </TableCell>
                        <TableCell className="px-3 py-2.5">
                          <div className="flex items-center gap-1.5">
                            <div className="h-1.5 w-20 rounded-full bg-slate-200 overflow-hidden">
                              <div
                                className={cn(
                                  "h-full rounded-full transition-all",
                                  p.progress >= 70 ? "bg-emerald-500" : p.progress >= 40 ? "bg-blue-500" : "bg-amber-500"
                                )}
                                style={{ width: `${p.progress}%` }}
                              />
                            </div>
                            <span className="text-[10px] font-semibold text-slate-600 w-7">{p.progress}%</span>
                          </div>
                        </TableCell>
                        <TableCell className="px-3 py-2.5">
                          {p.nearestDeadline ? (
                            <span className="text-[10px] font-medium text-red-500 whitespace-nowrap">
                              {p.nearestDeadline.split("-").reverse().join("/")}
                            </span>
                          ) : (
                            <span className="text-slate-300 text-xs">—</span>
                          )}
                        </TableCell>
                        <TableCell className="px-3 py-2.5">
                          <StatusBadge status={p.status} />
                        </TableCell>
                        <TableCell className="px-3 py-2.5">
                          <HealthBadge health={p.health} />
                        </TableCell>
                        <TableCell className="px-3 py-2.5">
                          <div className="flex items-center gap-0.5">
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-7 gap-1 px-2 text-blue-600 hover:bg-blue-50 text-[10px] font-medium"
                              onClick={() => onViewDetail(p)}
                            >
                              <Eye className="h-3 w-3" />
                              Xem
                            </Button>
                            <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-slate-400 hover:bg-slate-100">
                              <Pencil className="h-3 w-3" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-7 w-7 p-0 text-slate-400 hover:bg-red-50 hover:text-red-500"
                              onClick={async () => {
                                await researchApi.deleteProject(p.id);
                                await loadProjects();
                              }}
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
            </div>
          </CardContent>
        </Card>

        <p className="text-xs text-slate-400">
          Hiển thị {filtered.length} / {projects.length} đề tài
        </p>
      </div>

      {/* Add Topic Modal */}
      <DeTaiFormModal
        open={formModalOpen}
        onOpenChange={setFormModalOpen}
        onSave={async (data) => {
          const payload = {
            projectCode: data.code,
            projectTitle: data.name,
            description: data.description,
            sponsorName: data.sponsor === "Tất cả" ? null : data.sponsor,
            researchType: data.type,
            protocolNumber: data.protocolNumber,
            protocolVersion: data.protocolVersion,
            ethicsStatus: data.ethicsStatus === "Đã duyệt" ? "approved" : data.ethicsStatus === "Chờ duyệt" ? "pending" : "not_required",
            ethicsApprovalDate: null,
            ethicsExpiryDate: null,
            plannedStartDate: data.startDate || null,
            plannedEndDate: data.endDate || null,
            actualStartDate: null,
            actualEndDate: null,
            currentPhaseName: "Chưa bắt đầu",
            progressPercent: 0,
            projectStatus: data.status === "Hoàn thành" ? "completed" : data.status === "Chưa bắt đầu" ? "not_started" : "in_progress",
            riskLevel: "low",
            notes: data.notes,
          };
          await researchApi.createProject(payload);
          await loadProjects();
        }}
      />
    </div>
  );
}
