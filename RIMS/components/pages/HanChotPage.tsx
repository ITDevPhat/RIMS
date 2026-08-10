"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { AlertTriangle, ArrowUpDown, Calendar, CheckCircle2, Clock, Eye, Pencil, Plus, Search, Shield, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import type { DatePrecision, DeadlineItem, PhaseStatus } from "@/lib/types";
import { projectDeadlineApi, researchApi } from "@/lib/api/research-api";
import { mapApiDeadlineToUi } from "@/lib/mappers/deadline-mapper";
import { mapApiProjectToUi } from "@/lib/mappers/project-mapper";
import { toast } from "@/lib/toast";
import { formatDateByPrecision } from "@/lib/date-utils";
import { PrecisionDateInput } from "@/components/common/DateInput";
import { toApiPhaseStatus } from "@/lib/mappers/status-mapper";

type Priority = DeadlineItem["priority"];

const PRIORITY_CONFIG: Record<Priority, { label: string; badge: string; icon: React.ReactNode }> = {
  critical: { label: "Quá hạn", badge: "bg-red-100 text-red-700 border-red-200", icon: <XCircle className="h-4 w-4 text-red-600" /> },
  ethics: { label: "Đạo đức / Pháp lý", badge: "bg-purple-100 text-purple-700 border-purple-200", icon: <Shield className="h-4 w-4 text-purple-600" /> },
  high: { label: "Sắp đến hạn", badge: "bg-amber-100 text-amber-700 border-amber-200", icon: <AlertTriangle className="h-4 w-4 text-amber-600" /> },
  medium: { label: "Cần chú ý", badge: "bg-blue-100 text-blue-700 border-blue-200", icon: <Clock className="h-4 w-4 text-blue-600" /> },
  normal: { label: "Bình thường", badge: "bg-slate-100 text-slate-600 border-slate-200", icon: <CheckCircle2 className="h-4 w-4 text-slate-400" /> },
};

const PRIORITY_ORDER: Priority[] = ["critical", "ethics", "high", "medium", "normal"];

type DeadlineSortKey = "researchCode" | "researchName" | "type" | "assignee" | "dueDate" | "daysRemaining" | "status";
type SortDirection = "asc" | "desc";

type DeadlineForm = {
  projectId: string;
  deadlineType: string;
  title: string;
  dueDate: string;
  dueDatePrecision: DatePrecision;
  priority: Priority;
  status: PhaseStatus;
};

const emptyDeadlineForm: DeadlineForm = {
  projectId: "",
  deadlineType: "project_deadline",
  title: "",
  dueDate: "",
  dueDatePrecision: "DAY",
  priority: "normal",
  status: "Chưa bắt đầu",
};

const deadlineColumns: Array<{ label: string; key?: DeadlineSortKey; className: string }> = [
  { label: "Mã đề tài", key: "researchCode", className: "w-[140px]" },
  { label: "Tên đề tài", key: "researchName", className: "w-[280px]" },
  { label: "Loại hạn chót", key: "type", className: "w-[180px]" },
  { label: "Người phụ trách", key: "assignee", className: "w-[180px]" },
  { label: "Ngày hạn", key: "dueDate", className: "w-[170px]" },
  { label: "Còn lại", key: "daysRemaining", className: "w-[150px]" },
  { label: "Trạng thái", key: "status", className: "w-[150px]" },
  { label: "Thao tác", className: "sticky right-0 z-20 w-[130px] bg-slate-50 shadow-[-4px_0_6px_-5px_rgba(15,23,42,0.45)]" },
];

function deadlineTypeLabel(type: string) {
  const normalized = type.toLowerCase();
  const map: Record<string, string> = {
    milestone_deadline: "Hạn chót mốc tiến độ",
    phase_deadline: "Hạn chót giai đoạn",
    ethics_expiry: "Hết hạn đạo đức",
    project_deadline: "Hạn chót đề tài",
  };
  return map[normalized] ?? type;
}

function toApiDeadlinePriority(priority: Priority) {
  if (priority === "critical") return "urgent";
  if (priority === "ethics") return "high";
  return priority;
}

function DaysChip({ days }: { days: number }) {
  if (days < 0) return <span className="rounded-full bg-red-100 px-2 py-0.5 text-[11px] font-semibold text-red-700">Quá hạn {Math.abs(days)} ngày</span>;
  if (days === 0) return <span className="rounded-full bg-red-100 px-2 py-0.5 text-[11px] font-semibold text-red-700">Hôm nay</span>;
  return <span className={cn("inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold", days <= 7 ? "bg-red-50 text-red-600" : days <= 30 ? "bg-amber-50 text-amber-700" : "bg-slate-100 text-slate-500")}><Clock className="h-3 w-3" />{days} ngày</span>;
}

export default function HanChotPage() {
  const [items, setItems] = useState<DeadlineItem[]>([]);
  const [projects, setProjects] = useState<Array<{ id: string; code: string; name: string }>>([]);
  const [search, setSearch] = useState("");
  const [filterResearch, setFilterResearch] = useState("all");
  const [filterType, setFilterType] = useState("all");
  const [selectedDeadline, setSelectedDeadline] = useState<DeadlineItem | null>(null);
  const [editingDeadline, setEditingDeadline] = useState<DeadlineItem | null>(null);
  const [deadlineForm, setDeadlineForm] = useState<DeadlineForm>(emptyDeadlineForm);
  const [deadlineFormOpen, setDeadlineFormOpen] = useState(false);
  const [deadlineFormError, setDeadlineFormError] = useState("");
  const [savingDeadline, setSavingDeadline] = useState(false);
  const [completingId, setCompletingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [sortKey, setSortKey] = useState<DeadlineSortKey>("daysRemaining");
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc");
  const formatDeadlineDate = (value?: string | null, precision?: string | null) => formatDateByPrecision(value, precision);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [deadlineResult, projectResult] = await Promise.all([
        projectDeadlineApi.getDeadlines({ pageSize: 100 }),
        researchApi.getProjects({ pageSize: 100 }),
      ]);
      setItems(deadlineResult.items.map(mapApiDeadlineToUi));
      setProjects(projectResult.items.map(mapApiProjectToUi).map((project) => ({ id: project.id, code: project.code, name: project.name })));
    } catch {
      setError("Không tải được danh sách hạn chót.");
      toast.error("Không tải được danh sách hạn chót.");
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const filtered = useMemo(() => {
    return items.filter((item) => {
      const q = search.toLowerCase();
      const matchSearch = !q || item.researchCode.toLowerCase().includes(q) || item.researchName.toLowerCase().includes(q) || item.type.toLowerCase().includes(q) || deadlineTypeLabel(item.type).toLowerCase().includes(q) || item.assignee.toLowerCase().includes(q);
      const matchResearch = filterResearch === "all" || item.researchId === filterResearch;
      const matchType = filterType === "all" || item.priority === filterType;
      return matchSearch && matchResearch && matchType;
    });
  }, [filterResearch, filterType, items, search]);
  const sortedItems = useMemo(() => {
    return [...filtered].sort((a, b) => {
      const left = sortKey === "type" ? deadlineTypeLabel(a.type) : a[sortKey];
      const right = sortKey === "type" ? deadlineTypeLabel(b.type) : b[sortKey];
      const result = typeof left === "number" && typeof right === "number"
        ? left - right
        : String(left ?? "").localeCompare(String(right ?? ""), "vi-VN", { numeric: true, sensitivity: "base" });
      return sortDirection === "asc" ? result : -result;
    });
  }, [filtered, sortDirection, sortKey]);

  const counts = PRIORITY_ORDER.reduce<Record<Priority, number>>((acc, priority) => {
    acc[priority] = items.filter((item) => item.priority === priority).length;
    return acc;
  }, {} as Record<Priority, number>);
  const selectedProject = projects.find((project) => project.id === filterResearch);
  const formProject = projects.find((project) => project.id === deadlineForm.projectId);
  const handleSort = (key: DeadlineSortKey) => {
    setSortKey((currentKey) => {
      if (currentKey === key) {
        setSortDirection((currentDirection) => currentDirection === "asc" ? "desc" : "asc");
        return currentKey;
      }
      setSortDirection("asc");
      return key;
    });
  };

  const handleMarkCompleted = async (item: DeadlineItem) => {
    setCompletingId(item.id);
    try {
      await projectDeadlineApi.markCompleted(item.id);
      toast.success({ title: "Đã đánh dấu hoàn thành", description: item.type });
      await loadData();
    } catch (markError) {
      const message = markError instanceof Error ? markError.message : "Không cập nhật được hạn chót.";
      toast.error({ title: "Không cập nhật được hạn chót", description: message });
    } finally {
      setCompletingId(null);
    }
  };

  const openCreateDeadline = () => {
    setEditingDeadline(null);
    setDeadlineForm({ ...emptyDeadlineForm, projectId: filterResearch === "all" ? "" : filterResearch });
    setDeadlineFormError("");
    setDeadlineFormOpen(true);
  };

  const openEditDeadline = (item: DeadlineItem) => {
    setEditingDeadline(item);
    setDeadlineForm({
      projectId: item.researchId,
      deadlineType: item.type,
      title: item.type,
      dueDate: item.dueDate,
      dueDatePrecision: item.dueDatePrecision,
      priority: item.priority,
      status: item.status === "Quá hạn" ? "Đang thực hiện" : item.status as PhaseStatus,
    });
    setDeadlineFormError("");
    setDeadlineFormOpen(true);
  };

  const handleDeadlineFormChange = (field: keyof DeadlineForm, value: string | DatePrecision | Priority) => {
    setDeadlineForm((prev) => ({ ...prev, [field]: value }));
    setDeadlineFormError("");
  };

  const handleSaveDeadline = async () => {
    if (!deadlineForm.projectId) {
      setDeadlineFormError("Vui lòng chọn đề tài.");
      return;
    }
    if (!deadlineForm.deadlineType.trim()) {
      setDeadlineFormError("Vui lòng nhập loại hạn chót.");
      return;
    }
    if (!deadlineForm.title.trim()) {
      setDeadlineFormError("Vui lòng nhập tiêu đề hạn chót.");
      return;
    }
    if (!deadlineForm.dueDate) {
      setDeadlineFormError("Vui lòng chọn ngày hạn.");
      return;
    }

    const payload = {
      projectId: Number(deadlineForm.projectId),
      phaseId: null,
      milestoneId: null,
      deadlineType: deadlineForm.deadlineType.trim(),
      title: deadlineForm.title.trim(),
      description: null,
      dueDate: deadlineForm.dueDate,
      dueDatePrecision: deadlineForm.dueDatePrecision,
      responsibleUserId: null,
      priorityLevel: toApiDeadlinePriority(deadlineForm.priority),
      deadlineStatus: toApiPhaseStatus(deadlineForm.status),
      ...(editingDeadline ? { completedAt: null } : {}),
    };

    try {
      setSavingDeadline(true);
      if (editingDeadline) {
        await projectDeadlineApi.updateDeadline(editingDeadline.id, payload);
        toast.success("Đã cập nhật hạn chót.");
      } else {
        await projectDeadlineApi.createDeadline(payload);
        toast.success("Đã tạo hạn chót.");
      }
      setDeadlineFormOpen(false);
      await loadData();
    } catch (saveError) {
      const message = saveError instanceof Error ? saveError.message : "Không lưu được hạn chót.";
      setDeadlineFormError(message);
      toast.error({ title: "Không lưu được hạn chót", description: message });
    } finally {
      setSavingDeadline(false);
    }
  };

  return (
    <div>
      <div className="border-b border-slate-200 bg-white px-4 sm:px-6 lg:px-8 py-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-lg font-bold text-slate-800">Hạn chót & Cảnh báo</h1>
            <p className="mt-0.5 text-sm text-slate-500">Theo dõi hạn chót của đề tài, giai đoạn và mốc tiến độ từ backend RMS.</p>
          </div>
          <Button className="gap-2" onClick={openCreateDeadline}>
            <Plus className="h-4 w-4" />
            Thêm hạn chót
          </Button>
        </div>
      </div>

      <div className="space-y-6 px-4 sm:px-6 lg:px-8 py-6">
        {loading && <Card><CardContent className="p-4 text-sm text-slate-500">Đang tải hạn chót...</CardContent></Card>}
        {error && <Card className="border-red-200 bg-red-50"><CardContent className="flex items-center justify-between p-4 text-sm font-medium text-red-700">{error}<Button size="sm" variant="outline" onClick={() => void loadData()}>Thử lại</Button></CardContent></Card>}

        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
          {PRIORITY_ORDER.map((priority) => (
            <Card key={priority} onClick={() => setFilterType(filterType === priority ? "all" : priority)} className={cn("cursor-pointer border transition hover:-translate-y-0.5 hover:shadow-md", filterType === priority ? "border-blue-300 bg-blue-50 ring-2 ring-blue-100" : "border-slate-200 bg-white")}>
              <CardContent className="flex items-center gap-3 p-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-slate-50 ring-1 ring-slate-100">{PRIORITY_CONFIG[priority].icon}</div>
                <div>
                  <div className="text-2xl font-bold text-slate-800">{counts[priority]}</div>
                  <div className="text-[11px] text-slate-500">{PRIORITY_CONFIG[priority].label}</div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <Card className="border-slate-200 shadow-sm">
          <CardContent className="grid gap-4 p-4 lg:grid-cols-[1fr_260px_240px_auto]">
            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">Tìm kiếm</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
                <Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Tên đề tài, mã đề tài, người phụ trách..." className="h-10 border-slate-200 pl-9 text-sm" />
              </div>
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">Đề tài</label>
              <Select value={filterResearch} onValueChange={(value) => value && setFilterResearch(value)}>
                <SelectTrigger className="h-10 w-full text-left text-sm border-slate-200">
                  <span className="truncate">{selectedProject ? `${selectedProject.code} - ${selectedProject.name}` : "Tất cả đề tài"}</span>
                </SelectTrigger>
                <SelectContent className="max-w-xl">
                  <SelectItem value="all">Tất cả đề tài</SelectItem>
                  {projects.map((project) => <SelectItem key={project.id} value={project.id}>{project.code} - {project.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">Mức cảnh báo</label>
              <Select value={filterType} onValueChange={(value) => value && setFilterType(value)}>
                <SelectTrigger className="h-10 w-full text-left text-sm border-slate-200">
                  <span className="truncate">{filterType === "all" ? "Tất cả mức ưu tiên" : PRIORITY_CONFIG[filterType as Priority].label}</span>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tất cả mức ưu tiên</SelectItem>
                  {PRIORITY_ORDER.map((priority) => <SelectItem key={priority} value={priority}>{PRIORITY_CONFIG[priority].label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-end">
              <div className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-center">
                <p className="text-xl font-bold text-slate-800">{filtered.length}</p>
                <p className="text-[11px] text-slate-500">/{items.length} hạn chót</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="overflow-hidden border-slate-200 shadow-sm">
          <div className="border-b border-slate-200 bg-white px-4 py-3">
            <h2 className="text-sm font-bold text-slate-800">Danh sách hạn chót</h2>
            <p className="text-xs text-slate-500">Ưu tiên các hạn chót quá hạn, sắp đến hạn và hồ sơ đạo đức/pháp lý.</p>
          </div>
          <CardContent className="p-0">
            <Table className="w-full min-w-[1380px] table-fixed" containerClassName="max-h-[68vh]">
              <TableHeader className="sticky top-0 z-30">
                <TableRow className="bg-slate-50">
                  {deadlineColumns.map((column) => (
                    <TableHead key={column.label} className={cn("px-2 py-2.5 text-[10px] font-semibold uppercase text-slate-500 whitespace-normal", column.className)}>
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
                      ) : column.label}
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedItems.length === 0 ? (
                  <TableRow><TableCell colSpan={8} className="py-12 text-center text-sm text-slate-400">Không tìm thấy hạn chót nào.</TableCell></TableRow>
                ) : sortedItems.map((item) => (
                  <TableRow key={item.id} className="border-b border-slate-100 hover:bg-slate-50">
                    <TableCell className="px-2 py-3 align-top text-xs font-mono font-semibold text-slate-700 whitespace-normal break-words">{item.researchCode || "—"}</TableCell>
                    <TableCell className="px-2 py-3 align-top text-sm text-slate-800 whitespace-normal break-words">{item.researchName || "—"}</TableCell>
                    <TableCell className="px-2 py-3 align-top"><span className={cn("inline-flex rounded-full border px-2 py-0.5 text-[10px] font-semibold whitespace-normal", PRIORITY_CONFIG[item.priority].badge)}>{deadlineTypeLabel(item.type)}</span></TableCell>
                    <TableCell className="px-2 py-3 align-top text-xs text-slate-600 whitespace-normal break-words">{item.assignee}</TableCell>
                    <TableCell className="px-2 py-3 align-top text-xs text-slate-700"><Calendar className="mr-1 inline h-3 w-3 text-slate-400" />{formatDeadlineDate(item.dueDate, item.dueDatePrecision)}</TableCell>
                    <TableCell className="px-2 py-3 align-top"><DaysChip days={item.daysRemaining} /></TableCell>
                    <TableCell className="px-2 py-3 align-top text-xs font-semibold text-slate-600 whitespace-normal break-words">{item.status}</TableCell>
                    <TableCell className="sticky right-0 z-10 bg-white px-2 py-3 align-top whitespace-nowrap shadow-[-4px_0_6px_-5px_rgba(15,23,42,0.45)]">
                      <div className="flex flex-nowrap justify-end gap-1">
                        <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-blue-600 hover:bg-blue-50" title="Xem chi tiết" aria-label="Xem chi tiết" onClick={() => setSelectedDeadline(item)}>
                          <Eye className="h-3 w-3" />
                        </Button>
                        <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-slate-600 hover:bg-slate-100" title="Sửa hạn chót" aria-label="Sửa hạn chót" onClick={() => openEditDeadline(item)}>
                          <Pencil className="h-3 w-3" />
                        </Button>
                        <Button size="sm" variant="outline" className="h-7 px-2 text-[10px]" disabled={item.status === "Hoàn thành" || completingId === item.id} onClick={() => void handleMarkCompleted(item)}>
                          Xong
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
      <Dialog open={!!selectedDeadline} onOpenChange={(open) => !open && setSelectedDeadline(null)}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Chi tiết hạn chót</DialogTitle>
          </DialogHeader>
          {selectedDeadline && (
            <div className="grid gap-3 text-sm sm:grid-cols-2">
              <InfoLine label="Đề tài" value={`${selectedDeadline.researchCode} - ${selectedDeadline.researchName}`} wide />
              <InfoLine label="Loại hạn chót" value={deadlineTypeLabel(selectedDeadline.type)} />
              <InfoLine label="Người phụ trách" value={selectedDeadline.assignee || "—"} />
              <InfoLine label="Ngày hạn" value={formatDeadlineDate(selectedDeadline.dueDate, selectedDeadline.dueDatePrecision)} />
              <InfoLine label="Còn lại" value={selectedDeadline.daysRemaining < 0 ? `Quá hạn ${Math.abs(selectedDeadline.daysRemaining)} ngày` : `${selectedDeadline.daysRemaining} ngày`} />
              <InfoLine label="Trạng thái" value={selectedDeadline.status} />
              <InfoLine label="Mức cảnh báo" value={PRIORITY_CONFIG[selectedDeadline.priority].label} />
            </div>
          )}
        </DialogContent>
      </Dialog>
      <Dialog open={deadlineFormOpen} onOpenChange={(open) => !savingDeadline && setDeadlineFormOpen(open)}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editingDeadline ? "Sửa hạn chót" : "Thêm hạn chót"}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 text-sm sm:grid-cols-2">
            {deadlineFormError && <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 font-medium text-red-700 sm:col-span-2">{deadlineFormError}</div>}
            <div className="sm:col-span-2">
              <label className="mb-1.5 block text-xs font-semibold text-slate-700">Đề tài <span className="text-red-500">*</span></label>
              <Select value={deadlineForm.projectId} onValueChange={(value) => handleDeadlineFormChange("projectId", value ?? "")}>
                <SelectTrigger className="h-10 border-slate-200">
                  <SelectValue placeholder="Chọn đề tài" />
                </SelectTrigger>
                <SelectContent className="max-w-xl">
                  {projects.map((project) => <SelectItem key={project.id} value={project.id}>{project.code} - {project.name}</SelectItem>)}
                </SelectContent>
              </Select>
              {formProject && <p className="mt-1 text-xs text-slate-500">{formProject.code} - {formProject.name}</p>}
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-slate-700">Loại hạn chót <span className="text-red-500">*</span></label>
              <Input value={deadlineForm.deadlineType} onChange={(event) => handleDeadlineFormChange("deadlineType", event.target.value)} placeholder="VD: project_deadline" className="h-10 border-slate-200" />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-slate-700">Tiêu đề <span className="text-red-500">*</span></label>
              <Input value={deadlineForm.title} onChange={(event) => handleDeadlineFormChange("title", event.target.value)} placeholder="VD: Nộp báo cáo nghiệm thu" className="h-10 border-slate-200" />
            </div>
            <PrecisionDateInput
              label="Ngày hạn"
              required
              value={deadlineForm.dueDate}
              precision={deadlineForm.dueDatePrecision}
              onValueChange={(value) => handleDeadlineFormChange("dueDate", value)}
              onPrecisionChange={(precision) => handleDeadlineFormChange("dueDatePrecision", precision)}
            />
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-slate-700">Mức cảnh báo</label>
              <Select value={deadlineForm.priority} onValueChange={(value) => handleDeadlineFormChange("priority", value as Priority)}>
                <SelectTrigger className="h-10 border-slate-200"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {PRIORITY_ORDER.map((priority) => <SelectItem key={priority} value={priority}>{PRIORITY_CONFIG[priority].label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-slate-700">Trạng thái</label>
              <Select value={deadlineForm.status} onValueChange={(value) => handleDeadlineFormChange("status", value as PhaseStatus)}>
                <SelectTrigger className="h-10 border-slate-200"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Chưa bắt đầu">Chưa bắt đầu</SelectItem>
                  <SelectItem value="Đang thực hiện">Đang thực hiện</SelectItem>
                  <SelectItem value="Hoàn thành">Hoàn thành</SelectItem>
                  <SelectItem value="Tạm dừng">Tạm dừng</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex justify-end gap-2 sm:col-span-2">
              <Button variant="outline" disabled={savingDeadline} onClick={() => setDeadlineFormOpen(false)}>Hủy</Button>
              <Button disabled={savingDeadline} onClick={() => void handleSaveDeadline()}>{savingDeadline ? "Đang lưu..." : "Lưu hạn chót"}</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
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
