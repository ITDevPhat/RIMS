"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Eye, Plus, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import type { PhaseStatus, ResearchPhase, ResearchProject } from "@/lib/types";
import { projectPhaseApi, researchApi } from "@/lib/api/research-api";
import type { ProjectPhasePayload } from "@/lib/api/research-api";
import { mapApiProjectToUi } from "@/lib/mappers/project-mapper";
import { mapApiPhaseToUi } from "@/lib/mappers/phase-mapper";
import PhaseFormModal from "@/components/modals/PhaseFormModal";
import { ConfirmationDialog } from "@/components/common/ConfirmationDialog";
import { toast } from "@/lib/toast";

function PhaseBadge({ status }: { status: PhaseStatus }) {
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

const formatDate = (value: string | null) => value ? value.split("-").reverse().join("/") : "—";

export default function QuanLyGiaiDoan() {
  const [projects, setProjects] = useState<ResearchProject[]>([]);
  const [phases, setPhases] = useState<ResearchPhase[]>([]);
  const [selectedResearch, setSelectedResearch] = useState("all");
  const [modalOpen, setModalOpen] = useState(false);
  const [editingPhase, setEditingPhase] = useState<ResearchPhase | null>(null);
  const [viewingPhase, setViewingPhase] = useState<ResearchPhase | null>(null);
  const [phaseToDelete, setPhaseToDelete] = useState<ResearchPhase | null>(null);
  const [deletingPhaseId, setDeletingPhaseId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionError, setActionError] = useState("");

  const loadData = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [projectResult, phaseResult] = await Promise.all([
        researchApi.getProjects({ pageSize: 100 }),
        projectPhaseApi.getPhases({ pageSize: 100, projectId: selectedResearch === "all" ? undefined : selectedResearch }),
      ]);
      const mappedProjects = projectResult.items.map(mapApiProjectToUi);
      setProjects(mappedProjects);
      setPhases(phaseResult.items.map(mapApiPhaseToUi));
      if (selectedResearch === "all" && mappedProjects[0]) setSelectedResearch(mappedProjects[0].id);
    } catch {
      setError("Không tải được dữ liệu giai đoạn.");
      toast.error("Không tải được dữ liệu giai đoạn.");
      setProjects([]);
      setPhases([]);
    } finally {
      setLoading(false);
    }
  }, [selectedResearch]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const handleSubmitPhase = async (payload: ProjectPhasePayload) => {
    try {
      if (editingPhase) {
        const updatePayload = { ...payload };
        delete updatePayload.projectId;
        await projectPhaseApi.updatePhase(editingPhase.id, updatePayload);
        toast.success({ title: "Đã cập nhật giai đoạn", description: editingPhase.name });
      } else {
        await projectPhaseApi.createPhase(payload);
        toast.success({ title: "Đã thêm giai đoạn", description: payload.phaseName });
      }
      setEditingPhase(null);
      await loadData();
    } catch (submitError) {
      const message = submitError instanceof Error ? submitError.message : "Không lưu được giai đoạn.";
      toast.error({ title: "Không lưu được giai đoạn", description: message });
      throw submitError;
    }
  };

  const handleDeletePhase = async () => {
    if (!phaseToDelete) return;
    setActionError("");
    setDeletingPhaseId(phaseToDelete.id);
    try {
      await projectPhaseApi.deletePhase(phaseToDelete.id);
      toast.success({ title: "Đã xóa giai đoạn", description: phaseToDelete.name });
      setPhaseToDelete(null);
      await loadData();
    } catch (deleteError) {
      const message = deleteError instanceof Error ? deleteError.message : "Không xóa được giai đoạn.";
      setActionError(message);
      toast.error({ title: "Không xóa được giai đoạn", description: message });
    } finally {
      setDeletingPhaseId(null);
    }
  };

  const visiblePhases = useMemo(
    () => selectedResearch === "all" ? phases : phases.filter((phase) => phase.researchId === selectedResearch),
    [phases, selectedResearch]
  );
  const selectedProject = projects.find((project) => project.id === selectedResearch);

  return (
    <div>
      <div className="flex items-center justify-between border-b border-slate-200 bg-white px-8 py-5">
        <div>
          <h1 className="text-lg font-bold text-slate-800">Giai đoạn</h1>
          <p className="mt-0.5 text-sm text-slate-500">Quản lý các giai đoạn của đề tài nghiên cứu.</p>
        </div>
        <Button onClick={() => { setEditingPhase(null); setModalOpen(true); }} className="gap-2 bg-blue-600 text-white hover:bg-blue-700">
          <Plus className="h-4 w-4" /> Thêm giai đoạn
        </Button>
      </div>

      <div className="space-y-5 px-8 py-6">
        {loading && <Card><CardContent className="p-4 text-sm text-slate-500">Đang tải giai đoạn...</CardContent></Card>}
        {error && (
          <Card className="border-red-200 bg-red-50">
            <CardContent className="flex items-center justify-between p-4 text-sm font-medium text-red-700">
              {error}
              <Button size="sm" variant="outline" onClick={() => void loadData()}>Thử lại</Button>
            </CardContent>
          </Card>
        )}
        {actionError && (
          <Card className="border-red-200 bg-red-50">
            <CardContent className="p-4 text-sm font-medium text-red-700">{actionError}</CardContent>
          </Card>
        )}

        <Card className="border-slate-200 shadow-sm">
          <CardContent className="grid gap-4 p-4 lg:grid-cols-[360px_1fr]">
            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">Chọn đề tài</label>
              <Select value={selectedResearch} onValueChange={(value) => value && setSelectedResearch(value)}>
                <SelectTrigger className="h-10 w-full text-left text-sm border-slate-200">
                  <span className="truncate">{selectedProject ? `${selectedProject.code} - ${selectedProject.name}` : "Chọn đề tài nghiên cứu"}</span>
                </SelectTrigger>
                <SelectContent className="max-w-xl">
                  {projects.map((project) => (
                    <SelectItem key={project.id} value={project.id}>
                      {project.code} - {project.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="rounded-lg border border-blue-100 bg-blue-50 px-4 py-3">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-blue-600">Đề tài đang xem</p>
              <p className="mt-1 text-sm font-bold text-slate-800">{selectedProject ? `${selectedProject.code} - ${selectedProject.name}` : "Chưa chọn đề tài"}</p>
              <p className="mt-1 text-xs text-slate-600">Hiển thị {visiblePhases.length} giai đoạn thuộc đề tài này.</p>
            </div>
          </CardContent>
        </Card>

        <Card className="overflow-hidden border-slate-200 shadow-sm">
          <div className="border-b border-slate-200 bg-white px-4 py-3">
            <h2 className="text-sm font-bold text-slate-800">Danh sách giai đoạn</h2>
            <p className="text-xs text-slate-500">Theo dõi người phụ trách, mốc thời gian, tiến độ và trạng thái xử lý.</p>
          </div>
          <CardContent className="p-0">
            <Table className="w-full table-fixed">
              <TableHeader>
                <TableRow className="bg-slate-50">
                  {["TT", "Tên giai đoạn", "Người phụ trách", "Bắt đầu DK", "Kết thúc DK", "Hạn chót", "Tiến độ", "Trạng thái", "Thao tác"].map((head) => (
                    <TableHead key={head} className="px-2 py-2.5 text-[10px] font-semibold uppercase text-slate-500 whitespace-normal">{head}</TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {visiblePhases.length === 0 ? (
                  <TableRow><TableCell colSpan={9} className="py-12 text-center text-sm text-slate-400">Không có giai đoạn nào.</TableCell></TableRow>
                ) : visiblePhases.map((phase) => (
                  <TableRow key={phase.id} className="border-b border-slate-100 hover:bg-slate-50">
                    <TableCell className="px-2 py-3 align-top text-sm text-slate-600">{phase.order}</TableCell>
                    <TableCell className="px-2 py-3 align-top text-sm font-medium text-slate-800 whitespace-normal break-words">{phase.name}</TableCell>
                    <TableCell className="px-2 py-3 align-top text-xs text-slate-600 whitespace-normal break-words">{phase.assignee ?? "—"}</TableCell>
                    <TableCell className="px-2 py-3 align-top text-xs text-slate-500">{formatDate(phase.plannedStartDate)}</TableCell>
                    <TableCell className="px-2 py-3 align-top text-xs text-slate-500">{formatDate(phase.plannedEndDate)}</TableCell>
                    <TableCell className="px-2 py-3 align-top text-xs font-medium text-red-500">{formatDate(phase.deadline)}</TableCell>
                    <TableCell className="px-2 py-3 align-top text-xs font-semibold text-slate-600">{phase.progress}%</TableCell>
                    <TableCell className="px-2 py-3 align-top"><PhaseBadge status={phase.status} /></TableCell>
                    <TableCell className="px-2 py-3 align-top whitespace-nowrap">
                      <div className="flex flex-nowrap justify-end gap-1">
                        <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-blue-600 hover:bg-blue-50" title="Xem chi tiết" onClick={() => setViewingPhase(phase)}><Eye className="h-3 w-3" /></Button>
                        <Button size="sm" variant="ghost" className="h-7 w-7 p-0" title="Sửa giai đoạn" onClick={() => { setEditingPhase(phase); setModalOpen(true); }}><Pencil className="h-3 w-3" /></Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-7 w-7 p-0 hover:text-red-500"
                          disabled={deletingPhaseId === phase.id}
                          title="Xóa giai đoạn"
                          onClick={() => setPhaseToDelete(phase)}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <p className="text-xs text-slate-400">Hiển thị {visiblePhases.length} giai đoạn</p>
      </div>

      <PhaseFormModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        phase={editingPhase}
        projectId={selectedResearch === "all" ? projects[0]?.id : selectedResearch}
        nextOrder={visiblePhases.length + 1}
        onSubmit={handleSubmitPhase}
      />
      <Dialog open={!!viewingPhase} onOpenChange={(open) => !open && setViewingPhase(null)}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Chi tiết giai đoạn</DialogTitle>
          </DialogHeader>
          {viewingPhase && (
            <div className="space-y-4">
              <div className="rounded-lg border border-blue-100 bg-blue-50 px-4 py-3">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-blue-600">Giai đoạn #{viewingPhase.order}</p>
                <h3 className="mt-1 text-base font-bold leading-snug text-slate-900">{viewingPhase.name}</h3>
                <div className="mt-3 h-2 overflow-hidden rounded-full bg-white">
                  <div className="h-full rounded-full bg-blue-600" style={{ width: `${viewingPhase.progress}%` }} />
                </div>
                <p className="mt-1 text-xs font-semibold text-blue-700">{viewingPhase.progress}% hoàn thành</p>
              </div>
              <div className="grid gap-3 text-sm sm:grid-cols-2">
                <InfoLine label="Người phụ trách" value={viewingPhase.assignee ?? "—"} />
                <InfoLine label="Trạng thái" value={viewingPhase.status} />
                <InfoLine label="Bắt đầu dự kiến" value={formatDate(viewingPhase.plannedStartDate)} />
                <InfoLine label="Kết thúc dự kiến" value={formatDate(viewingPhase.plannedEndDate)} />
                <InfoLine label="Hạn chót" value={formatDate(viewingPhase.deadline)} />
                <InfoLine label="Ghi chú" value={viewingPhase.notes || "—"} wide />
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
      <ConfirmationDialog
        open={!!phaseToDelete}
        onOpenChange={(open) => {
          if (!open && !deletingPhaseId) setPhaseToDelete(null);
        }}
        type="delete"
        itemName={phaseToDelete?.name ?? "giai đoạn này"}
        onConfirm={() => void handleDeletePhase()}
        isLoading={!!deletingPhaseId}
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
