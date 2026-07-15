"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { AlertTriangle, Eye, Plus, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import type { PhaseStatus, ResearchMilestone, ResearchPhase, ResearchProject, RiskLevel } from "@/lib/types";
import { projectMilestoneApi, projectPhaseApi, researchApi } from "@/lib/api/research-api";
import type { ProjectMilestonePayload } from "@/lib/api/research-api";
import { mapApiProjectToUi } from "@/lib/mappers/project-mapper";
import { mapApiPhaseToUi } from "@/lib/mappers/phase-mapper";
import { mapApiMilestoneToUi } from "@/lib/mappers/milestone-mapper";
import MocTienDoFormModal from "@/components/modals/MocTienDoFormModal";
import { ConfirmationDialog } from "@/components/common/ConfirmationDialog";
import { toast } from "@/lib/toast";

function StatusBadge({ status }: { status: PhaseStatus }) {
  const map: Record<string, string> = {
    "Hoàn thành": "bg-emerald-50 text-emerald-700 border-emerald-200",
    "Hoàn thành trễ": "bg-red-50 text-red-600 border-red-200",
    "Đang thực hiện": "bg-blue-50 text-blue-700 border-blue-200",
    "Chờ duyệt": "bg-violet-50 text-violet-700 border-violet-200",
    "Cần chỉnh sửa": "bg-orange-50 text-orange-700 border-orange-200",
    "Chưa bắt đầu": "bg-slate-100 text-slate-500 border-slate-200",
    "Trễ hạn": "bg-red-50 text-red-700 border-red-200",
    "Có nguy cơ": "bg-amber-50 text-amber-700 border-amber-200",
    "Tạm dừng": "bg-slate-100 text-slate-600 border-slate-200",
    "Hủy": "bg-slate-100 text-slate-600 border-slate-200",
  };
  return <span className={cn("inline-flex rounded-full border px-2 py-0.5 text-[10px] font-semibold", map[status])}>{status}</span>;
}

function RiskBadge({ risk }: { risk: RiskLevel }) {
  const map: Record<string, string> = {
    "Đúng tiến độ": "bg-emerald-50 text-emerald-700 border-emerald-200",
    "Có nguy cơ": "bg-amber-50 text-amber-700 border-amber-200",
    "Trễ hạn": "bg-red-50 text-red-700 border-red-200",
    "Đã hoàn thành": "bg-emerald-50 text-emerald-700 border-emerald-200",
    "Hoàn thành trễ": "bg-red-50 text-red-600 border-red-200",
    "Tạm dừng": "bg-slate-100 text-slate-600 border-slate-200",
  };
  return <span className={cn("inline-flex rounded-full border px-2 py-0.5 text-[10px] font-semibold", map[risk])}>{risk}</span>;
}

const formatDate = (value: string | null) => value ? value.split("-").reverse().join("/") : "—";

export default function QuanLyMocTienDo() {
  const [projects, setProjects] = useState<ResearchProject[]>([]);
  const [phases, setPhases] = useState<ResearchPhase[]>([]);
  const [milestones, setMilestones] = useState<ResearchMilestone[]>([]);
  const [selectedResearch, setSelectedResearch] = useState("all");
  const [selectedPhase, setSelectedPhase] = useState("all");
  const [modalOpen, setModalOpen] = useState(false);
  const [editingMs, setEditingMs] = useState<ResearchMilestone | null>(null);
  const [viewingMs, setViewingMs] = useState<ResearchMilestone | null>(null);
  const [milestoneToDelete, setMilestoneToDelete] = useState<ResearchMilestone | null>(null);
  const [deletingMilestoneId, setDeletingMilestoneId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionError, setActionError] = useState("");

  const loadData = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [projectResult, phaseResult, milestoneResult] = await Promise.all([
        researchApi.getProjects({ pageSize: 100 }),
        projectPhaseApi.getPhases({ pageSize: 100, projectId: selectedResearch === "all" ? undefined : selectedResearch }),
        projectMilestoneApi.getMilestones({ pageSize: 100, projectId: selectedResearch === "all" ? undefined : selectedResearch, phaseId: selectedPhase === "all" ? undefined : selectedPhase }),
      ]);
      const mappedProjects = projectResult.items.map(mapApiProjectToUi);
      setProjects(mappedProjects);
      setPhases(phaseResult.items.map(mapApiPhaseToUi));
      setMilestones(milestoneResult.items.map((item, index) => mapApiMilestoneToUi(item, index + 1)));
      if (selectedResearch === "all" && mappedProjects[0]) setSelectedResearch(mappedProjects[0].id);
    } catch {
      setError("Không tải được dữ liệu mốc tiến độ.");
      toast.error("Không tải được dữ liệu mốc tiến độ.");
      setMilestones([]);
    } finally {
      setLoading(false);
    }
  }, [selectedPhase, selectedResearch]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const handleSubmitMilestone = async (payload: ProjectMilestonePayload) => {
    try {
      if (editingMs) {
        const updatePayload = { ...payload };
        delete updatePayload.projectId;
        await projectMilestoneApi.updateMilestone(editingMs.id, updatePayload);
        toast.success({ title: "Đã cập nhật mốc tiến độ", description: editingMs.name });
      } else {
        await projectMilestoneApi.createMilestone(payload);
        toast.success({ title: "Đã thêm mốc tiến độ", description: payload.milestoneName });
      }
      setEditingMs(null);
      await loadData();
    } catch (submitError) {
      const message = submitError instanceof Error ? submitError.message : "Không lưu được mốc tiến độ.";
      toast.error({ title: "Không lưu được mốc tiến độ", description: message });
      throw submitError;
    }
  };

  const handleDeleteMilestone = async () => {
    if (!milestoneToDelete) return;
    setActionError("");
    setDeletingMilestoneId(milestoneToDelete.id);
    try {
      await projectMilestoneApi.deleteMilestone(milestoneToDelete.id);
      toast.success({ title: "Đã xóa mốc tiến độ", description: milestoneToDelete.name });
      setMilestoneToDelete(null);
      await loadData();
    } catch (deleteError) {
      const message = deleteError instanceof Error ? deleteError.message : "Không xóa được mốc tiến độ.";
      setActionError(message);
      toast.error({ title: "Không xóa được mốc tiến độ", description: message });
    } finally {
      setDeletingMilestoneId(null);
    }
  };

  const researchPhases = useMemo(() => phases.filter((phase) => phase.researchId === selectedResearch), [phases, selectedResearch]);
  const visibleMilestones = useMemo(() => milestones.filter((ms) => selectedPhase === "all" || ms.phaseId === selectedPhase), [milestones, selectedPhase]);
  const selectedProject = projects.find((project) => project.id === selectedResearch);
  const selectedPhaseInfo = researchPhases.find((phase) => phase.id === selectedPhase);

  return (
    <div>
      <div className="flex items-center justify-between border-b border-slate-200 bg-white px-8 py-5">
        <div>
          <h1 className="text-lg font-bold text-slate-800">Mốc tiến độ</h1>
          <p className="mt-0.5 text-sm text-slate-500">Quản lý các mốc tiến độ trong từng giai đoạn nghiên cứu.</p>
        </div>
        <Button onClick={() => { setEditingMs(null); setModalOpen(true); }} className="gap-2 bg-blue-600 text-white hover:bg-blue-700"><Plus className="h-4 w-4" /> Thêm mốc tiến độ</Button>
      </div>

      <div className="space-y-5 px-8 py-6">
        {loading && <Card><CardContent className="p-4 text-sm text-slate-500">Đang tải mốc tiến độ...</CardContent></Card>}
        {error && <Card className="border-red-200 bg-red-50"><CardContent className="flex items-center justify-between p-4 text-sm font-medium text-red-700">{error}<Button size="sm" variant="outline" onClick={() => void loadData()}>Thử lại</Button></CardContent></Card>}
        {actionError && <Card className="border-red-200 bg-red-50"><CardContent className="p-4 text-sm font-medium text-red-700">{actionError}</CardContent></Card>}

        <Card className="border-slate-200 shadow-sm">
          <CardContent className="grid gap-4 p-4 xl:grid-cols-[320px_280px_1fr]">
            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">Đề tài</label>
              <Select value={selectedResearch} onValueChange={(value) => { if (value) { setSelectedResearch(value); setSelectedPhase("all"); } }}>
                <SelectTrigger className="h-10 w-full text-left text-sm border-slate-200">
                  <span className="truncate">{selectedProject ? `${selectedProject.code} - ${selectedProject.name}` : "Chọn đề tài"}</span>
                </SelectTrigger>
                <SelectContent className="max-w-xl">{projects.map((project) => <SelectItem key={project.id} value={project.id}>{project.code} - {project.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">Giai đoạn</label>
              <Select value={selectedPhase} onValueChange={(value) => value && setSelectedPhase(value)}>
                <SelectTrigger className="h-10 w-full text-left text-sm border-slate-200">
                  <span className="truncate">{selectedPhaseInfo ? `${selectedPhaseInfo.order}. ${selectedPhaseInfo.name}` : "Tất cả giai đoạn"}</span>
                </SelectTrigger>
                <SelectContent className="max-w-lg">
                  <SelectItem value="all">Tất cả giai đoạn</SelectItem>
                  {researchPhases.map((phase) => <SelectItem key={phase.id} value={phase.id}>{phase.order}. {phase.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="rounded-lg border border-blue-100 bg-blue-50 px-4 py-3">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-blue-600">Bộ lọc đang xem</p>
              <p className="mt-1 text-sm font-bold text-slate-800">{selectedProject ? `${selectedProject.code} - ${selectedProject.name}` : "Chưa chọn đề tài"}</p>
              <p className="mt-1 text-xs text-slate-600">
                {selectedPhaseInfo ? `Giai đoạn ${selectedPhaseInfo.order}: ${selectedPhaseInfo.name}` : "Tất cả giai đoạn"} · {visibleMilestones.length} mốc tiến độ
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="overflow-hidden border-slate-200 shadow-sm">
          <div className="border-b border-slate-200 bg-white px-4 py-3">
            <h2 className="text-sm font-bold text-slate-800">Danh sách mốc tiến độ</h2>
            <p className="text-xs text-slate-500">Theo dõi deadline, rủi ro, phát sinh và trạng thái của từng mốc.</p>
          </div>
          <CardContent className="p-0">
            <Table className="w-full table-fixed">
              <TableHeader><TableRow className="bg-slate-50">{["TT", "Tên mốc", "Giai đoạn", "Người phụ trách", "Hạn chót", "Tiến độ", "Rủi ro", "Trạng thái", "Phát sinh", "Thao tác"].map((head) => <TableHead key={head} className="px-2 py-2.5 text-[10px] font-semibold uppercase text-slate-500 whitespace-normal">{head}</TableHead>)}</TableRow></TableHeader>
              <TableBody>
                {visibleMilestones.length === 0 ? (
                  <TableRow><TableCell colSpan={10} className="py-12 text-center text-sm text-slate-400">Không có mốc tiến độ nào.</TableCell></TableRow>
                ) : visibleMilestones.map((ms) => {
                  const phase = phases.find((item) => item.id === ms.phaseId);
                  return (
                    <TableRow key={ms.id} className="border-b border-slate-100 hover:bg-slate-50">
                      <TableCell className="px-2 py-3 align-top text-sm text-slate-600">{ms.order}</TableCell>
                      <TableCell className="px-2 py-3 align-top text-sm font-medium text-slate-800 whitespace-normal break-words">{ms.name}</TableCell>
                      <TableCell className="px-2 py-3 align-top text-xs text-slate-500 whitespace-normal break-words">{phase ? `${phase.order}. ${phase.name}` : "—"}</TableCell>
                      <TableCell className="px-2 py-3 align-top text-xs text-slate-600 whitespace-normal break-words">{ms.assignee ?? "—"}</TableCell>
                      <TableCell className="px-2 py-3 align-top text-xs font-medium text-red-500">{formatDate(ms.deadline)}</TableCell>
                      <TableCell className="px-2 py-3 align-top text-xs font-semibold text-slate-600">{ms.progress}%</TableCell>
                      <TableCell className="px-2 py-3 align-top"><RiskBadge risk={ms.risk} /></TableCell>
                      <TableCell className="px-2 py-3 align-top"><StatusBadge status={ms.status} /></TableCell>
                      <TableCell className="px-2 py-3 align-top">{ms.hasIssue ? <span className="flex items-start gap-1 text-xs text-amber-600 whitespace-normal break-words"><AlertTriangle className="mt-0.5 h-3 w-3 shrink-0" /> {ms.issueReason ?? "Có phát sinh"}</span> : <span className="text-xs text-slate-400">—</span>}</TableCell>
                      <TableCell className="px-2 py-3 align-top whitespace-nowrap">
                        <div className="flex flex-nowrap justify-end gap-1">
                          <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-blue-600 hover:bg-blue-50" title="Xem chi tiết" onClick={() => setViewingMs(ms)}><Eye className="h-3 w-3" /></Button>
                          <Button size="sm" variant="ghost" className="h-7 w-7 p-0" title="Sửa mốc tiến độ" onClick={() => { setEditingMs(ms); setModalOpen(true); }}><Pencil className="h-3 w-3" /></Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-7 w-7 p-0 hover:text-red-500"
                            disabled={deletingMilestoneId === ms.id}
                            title="Xóa mốc tiến độ"
                            onClick={() => setMilestoneToDelete(ms)}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
        <p className="text-xs text-slate-400">Hiển thị {visibleMilestones.length} mốc tiến độ</p>
      </div>

      <MocTienDoFormModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        milestone={editingMs}
        phases={researchPhases}
        projectId={selectedResearch === "all" ? projects[0]?.id : selectedResearch}
        onSubmit={handleSubmitMilestone}
      />
      <Dialog open={!!viewingMs} onOpenChange={(open) => !open && setViewingMs(null)}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Chi tiết mốc tiến độ</DialogTitle>
          </DialogHeader>
          {viewingMs && (
            <div className="space-y-4">
              <div className="rounded-lg border border-blue-100 bg-blue-50 px-4 py-3">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-blue-600">Mốc tiến độ #{viewingMs.order}</p>
                <h3 className="mt-1 text-base font-bold leading-snug text-slate-900">{viewingMs.name}</h3>
                <p className="mt-1 text-xs text-slate-600">{phases.find((item) => item.id === viewingMs.phaseId)?.name ?? "Chưa xác định giai đoạn"}</p>
              </div>
              <div className="grid gap-3 text-sm sm:grid-cols-2">
                <InfoLine label="Người phụ trách" value={viewingMs.assignee ?? "—"} />
                <InfoLine label="Hạn chót" value={formatDate(viewingMs.deadline)} />
                <InfoLine label="Tiến độ" value={`${viewingMs.progress}%`} />
                <InfoLine label="Rủi ro" value={viewingMs.risk} />
                <InfoLine label="Trạng thái" value={viewingMs.status} />
                <InfoLine label="Phát sinh" value={viewingMs.hasIssue ? viewingMs.issueReason || "Có phát sinh" : "Không"} wide />
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
      <ConfirmationDialog
        open={!!milestoneToDelete}
        onOpenChange={(open) => {
          if (!open && !deletingMilestoneId) setMilestoneToDelete(null);
        }}
        type="delete"
        itemName={milestoneToDelete?.name ?? "mốc tiến độ này"}
        onConfirm={() => void handleDeleteMilestone()}
        isLoading={!!deletingMilestoneId}
      />
    </div>
  );
}

function InfoLine({ label, value, wide }: { label: string; value: string; wide?: boolean }) {
  return (
    <div className={cn("rounded-lg border border-slate-200 bg-slate-50 px-3 py-2", wide && "sm:col-span-2")}>
      <p className="text-[11px] font-semibold uppercase text-slate-400">{label}</p>
      <p className="mt-1 whitespace-normal break-words text-sm font-medium text-slate-800">{value}</p>
    </div>
  );
}
