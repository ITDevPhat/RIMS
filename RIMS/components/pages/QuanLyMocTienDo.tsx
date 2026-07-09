"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { AlertTriangle, Plus, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { PhaseStatus, ResearchMilestone, ResearchPhase, ResearchProject, RiskLevel } from "@/lib/types";
import { projectMilestoneApi, projectPhaseApi, researchApi } from "@/lib/api/research-api";
import { mapApiProjectToUi } from "@/lib/mappers/project-mapper";
import { mapApiPhaseToUi } from "@/lib/mappers/phase-mapper";
import { mapApiMilestoneToUi } from "@/lib/mappers/milestone-mapper";
import MocTienDoFormModal from "@/components/modals/MocTienDoFormModal";

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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

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
      setMilestones([]);
    } finally {
      setLoading(false);
    }
  }, [selectedPhase, selectedResearch]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const researchPhases = useMemo(() => phases.filter((phase) => phase.researchId === selectedResearch), [phases, selectedResearch]);
  const visibleMilestones = useMemo(() => milestones.filter((ms) => selectedPhase === "all" || ms.phaseId === selectedPhase), [milestones, selectedPhase]);

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

        <div className="flex flex-wrap items-center gap-4">
          <Select value={selectedResearch} onValueChange={(value) => { if (value) { setSelectedResearch(value); setSelectedPhase("all"); } }}>
            <SelectTrigger className="h-9 w-80 text-sm border-slate-200"><SelectValue /></SelectTrigger>
            <SelectContent>{projects.map((project) => <SelectItem key={project.id} value={project.id}>{project.code} - {project.name}</SelectItem>)}</SelectContent>
          </Select>
          <Select value={selectedPhase} onValueChange={(value) => value && setSelectedPhase(value)}>
            <SelectTrigger className="h-9 w-64 text-sm border-slate-200"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tất cả giai đoạn</SelectItem>
              {researchPhases.map((phase) => <SelectItem key={phase.id} value={phase.id}>{phase.order}. {phase.name}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        <Card className="overflow-hidden border-slate-200 shadow-sm">
          <CardContent className="p-0">
            <Table>
              <TableHeader><TableRow className="bg-slate-50">{["TT", "Tên mốc", "Giai đoạn", "Người phụ trách", "Hạn chót", "Tiến độ", "Rủi ro", "Trạng thái", "Phát sinh", "Thao tác"].map((head) => <TableHead key={head} className="px-3 py-2.5 text-[10px] font-semibold uppercase text-slate-500">{head}</TableHead>)}</TableRow></TableHeader>
              <TableBody>
                {visibleMilestones.length === 0 ? (
                  <TableRow><TableCell colSpan={10} className="py-12 text-center text-sm text-slate-400">Không có mốc tiến độ nào.</TableCell></TableRow>
                ) : visibleMilestones.map((ms) => {
                  const phase = phases.find((item) => item.id === ms.phaseId);
                  return (
                    <TableRow key={ms.id} className="border-b border-slate-100 hover:bg-slate-50">
                      <TableCell className="px-3 py-3 text-sm text-slate-600">{ms.order}</TableCell>
                      <TableCell className="px-3 py-3 text-sm font-medium text-slate-800">{ms.name}</TableCell>
                      <TableCell className="px-3 py-3 text-xs text-slate-500">{phase ? `${phase.order}. ${phase.name}` : "—"}</TableCell>
                      <TableCell className="px-3 py-3 text-xs text-slate-600">{ms.assignee ?? "—"}</TableCell>
                      <TableCell className="px-3 py-3 text-xs font-medium text-red-500">{formatDate(ms.deadline)}</TableCell>
                      <TableCell className="px-3 py-3 text-xs font-semibold text-slate-600">{ms.progress}%</TableCell>
                      <TableCell className="px-3 py-3"><RiskBadge risk={ms.risk} /></TableCell>
                      <TableCell className="px-3 py-3"><StatusBadge status={ms.status} /></TableCell>
                      <TableCell className="px-3 py-3">{ms.hasIssue ? <span className="flex items-center gap-1 text-xs text-amber-600"><AlertTriangle className="h-3 w-3" /> {ms.issueReason ?? "Có phát sinh"}</span> : <span className="text-xs text-slate-400">—</span>}</TableCell>
                      <TableCell className="px-3 py-3">
                        <div className="flex gap-1">
                          <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={() => { setEditingMs(ms); setModalOpen(true); }}><Pencil className="h-3 w-3" /></Button>
                          <Button size="sm" variant="ghost" className="h-7 w-7 p-0 hover:text-red-500" onClick={async () => { await projectMilestoneApi.deleteMilestone(ms.id); await loadData(); }}><Trash2 className="h-3 w-3" /></Button>
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

      <MocTienDoFormModal open={modalOpen} onClose={() => setModalOpen(false)} milestone={editingMs} phases={researchPhases} />
    </div>
  );
}
