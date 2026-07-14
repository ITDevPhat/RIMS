"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { PhaseStatus, ResearchPhase, ResearchProject } from "@/lib/types";
import { projectPhaseApi, researchApi } from "@/lib/api/research-api";
import type { ProjectPhasePayload } from "@/lib/api/research-api";
import { mapApiProjectToUi } from "@/lib/mappers/project-mapper";
import { mapApiPhaseToUi } from "@/lib/mappers/phase-mapper";
import PhaseFormModal from "@/components/modals/PhaseFormModal";
import { ConfirmationDialog } from "@/components/common/ConfirmationDialog";

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
    if (editingPhase) {
      const updatePayload = { ...payload };
      delete updatePayload.projectId;
      await projectPhaseApi.updatePhase(editingPhase.id, updatePayload);
    } else {
      await projectPhaseApi.createPhase(payload);
    }
    setEditingPhase(null);
    await loadData();
  };

  const handleDeletePhase = async () => {
    if (!phaseToDelete) return;
    setActionError("");
    setDeletingPhaseId(phaseToDelete.id);
    try {
      await projectPhaseApi.deletePhase(phaseToDelete.id);
      setPhaseToDelete(null);
      await loadData();
    } catch (deleteError) {
      setActionError(deleteError instanceof Error ? deleteError.message : "Không xóa được giai đoạn.");
    } finally {
      setDeletingPhaseId(null);
    }
  };

  const visiblePhases = useMemo(
    () => selectedResearch === "all" ? phases : phases.filter((phase) => phase.researchId === selectedResearch),
    [phases, selectedResearch]
  );

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

        <div className="flex items-center gap-3">
          <label className="text-sm font-medium text-slate-600">Chọn đề tài:</label>
          <Select value={selectedResearch} onValueChange={(value) => value && setSelectedResearch(value)}>
            <SelectTrigger className="h-9 w-96 text-sm border-slate-200"><SelectValue /></SelectTrigger>
            <SelectContent>
              {projects.map((project) => (
                <SelectItem key={project.id} value={project.id}>{project.code} - {project.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <Card className="overflow-hidden border-slate-200 shadow-sm">
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow className="bg-slate-50">
                  {["TT", "Tên giai đoạn", "Người phụ trách", "Bắt đầu DK", "Kết thúc DK", "Hạn chót", "Tiến độ", "Trạng thái", "Thao tác"].map((head) => (
                    <TableHead key={head} className="px-3 py-2.5 text-[10px] font-semibold uppercase text-slate-500">{head}</TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {visiblePhases.length === 0 ? (
                  <TableRow><TableCell colSpan={9} className="py-12 text-center text-sm text-slate-400">Không có giai đoạn nào.</TableCell></TableRow>
                ) : visiblePhases.map((phase) => (
                  <TableRow key={phase.id} className="border-b border-slate-100 hover:bg-slate-50">
                    <TableCell className="px-3 py-3 text-sm text-slate-600">{phase.order}</TableCell>
                    <TableCell className="px-3 py-3 text-sm font-medium text-slate-800">{phase.name}</TableCell>
                    <TableCell className="px-3 py-3 text-xs text-slate-600">{phase.assignee ?? "—"}</TableCell>
                    <TableCell className="px-3 py-3 text-xs text-slate-500">{formatDate(phase.plannedStartDate)}</TableCell>
                    <TableCell className="px-3 py-3 text-xs text-slate-500">{formatDate(phase.plannedEndDate)}</TableCell>
                    <TableCell className="px-3 py-3 text-xs font-medium text-red-500">{formatDate(phase.deadline)}</TableCell>
                    <TableCell className="px-3 py-3 text-xs font-semibold text-slate-600">{phase.progress}%</TableCell>
                    <TableCell className="px-3 py-3"><PhaseBadge status={phase.status} /></TableCell>
                    <TableCell className="px-3 py-3">
                      <div className="flex gap-1">
                        <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={() => { setEditingPhase(phase); setModalOpen(true); }}><Pencil className="h-3 w-3" /></Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-7 w-7 p-0 hover:text-red-500"
                          disabled={deletingPhaseId === phase.id}
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
