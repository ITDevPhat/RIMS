"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { AlertTriangle, Calendar, CheckCircle2, Clock, Eye, Search, Shield, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import type { DeadlineItem } from "@/lib/types";
import { projectDeadlineApi, researchApi } from "@/lib/api/research-api";
import { mapApiDeadlineToUi } from "@/lib/mappers/deadline-mapper";
import { mapApiProjectToUi } from "@/lib/mappers/project-mapper";
import { toast } from "@/lib/toast";

type Priority = DeadlineItem["priority"];

const PRIORITY_CONFIG: Record<Priority, { label: string; badge: string; icon: React.ReactNode }> = {
  critical: { label: "Quá hạn", badge: "bg-red-100 text-red-700 border-red-200", icon: <XCircle className="h-4 w-4 text-red-600" /> },
  ethics: { label: "Đạo đức / Pháp lý", badge: "bg-purple-100 text-purple-700 border-purple-200", icon: <Shield className="h-4 w-4 text-purple-600" /> },
  high: { label: "Sắp đến hạn", badge: "bg-amber-100 text-amber-700 border-amber-200", icon: <AlertTriangle className="h-4 w-4 text-amber-600" /> },
  medium: { label: "Cần chú ý", badge: "bg-blue-100 text-blue-700 border-blue-200", icon: <Clock className="h-4 w-4 text-blue-600" /> },
  normal: { label: "Bình thường", badge: "bg-slate-100 text-slate-600 border-slate-200", icon: <CheckCircle2 className="h-4 w-4 text-slate-400" /> },
};

const PRIORITY_ORDER: Priority[] = ["critical", "ethics", "high", "medium", "normal"];
const formatDate = (value: string) => value ? value.split("-").reverse().join("/") : "—";

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
  const [completingId, setCompletingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

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
      const matchSearch = !q || item.researchCode.toLowerCase().includes(q) || item.researchName.toLowerCase().includes(q) || item.type.toLowerCase().includes(q) || item.assignee.toLowerCase().includes(q);
      const matchResearch = filterResearch === "all" || item.researchId === filterResearch;
      const matchType = filterType === "all" || item.priority === filterType;
      return matchSearch && matchResearch && matchType;
    });
  }, [filterResearch, filterType, items, search]);

  const counts = PRIORITY_ORDER.reduce<Record<Priority, number>>((acc, priority) => {
    acc[priority] = items.filter((item) => item.priority === priority).length;
    return acc;
  }, {} as Record<Priority, number>);
  const selectedProject = projects.find((project) => project.id === filterResearch);

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

  return (
    <div>
      <div className="border-b border-slate-200 bg-white px-8 py-5">
        <h1 className="text-lg font-bold text-slate-800">Hạn chót & Cảnh báo</h1>
        <p className="mt-0.5 text-sm text-slate-500">Theo dõi hạn chót của đề tài, giai đoạn và mốc tiến độ từ backend RMS.</p>
      </div>

      <div className="space-y-6 px-8 py-6">
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
            <Table className="w-full table-fixed">
              <TableHeader>
                <TableRow className="bg-slate-50">{["Mã đề tài", "Tên đề tài", "Loại hạn chót", "Người phụ trách", "Ngày hạn", "Còn lại", "Trạng thái", "Thao tác"].map((head) => <TableHead key={head} className="px-2 py-2.5 text-[10px] font-semibold uppercase text-slate-500 whitespace-normal">{head}</TableHead>)}</TableRow>
              </TableHeader>
              <TableBody>
                {filtered.length === 0 ? (
                  <TableRow><TableCell colSpan={8} className="py-12 text-center text-sm text-slate-400">Không tìm thấy hạn chót nào.</TableCell></TableRow>
                ) : filtered.map((item) => (
                  <TableRow key={item.id} className="border-b border-slate-100 hover:bg-slate-50">
                    <TableCell className="px-2 py-3 align-top text-xs font-mono font-semibold text-slate-700 whitespace-normal break-words">{item.researchCode || "—"}</TableCell>
                    <TableCell className="px-2 py-3 align-top text-sm text-slate-800 whitespace-normal break-words">{item.researchName || "—"}</TableCell>
                    <TableCell className="px-2 py-3 align-top"><span className={cn("inline-flex rounded-full border px-2 py-0.5 text-[10px] font-semibold whitespace-normal", PRIORITY_CONFIG[item.priority].badge)}>{item.type}</span></TableCell>
                    <TableCell className="px-2 py-3 align-top text-xs text-slate-600 whitespace-normal break-words">{item.assignee}</TableCell>
                    <TableCell className="px-2 py-3 align-top text-xs text-slate-700"><Calendar className="mr-1 inline h-3 w-3 text-slate-400" />{formatDate(item.dueDate)}</TableCell>
                    <TableCell className="px-2 py-3 align-top"><DaysChip days={item.daysRemaining} /></TableCell>
                    <TableCell className="px-2 py-3 align-top text-xs font-semibold text-slate-600 whitespace-normal break-words">{item.status}</TableCell>
                    <TableCell className="px-2 py-3 align-top whitespace-nowrap">
                      <div className="flex flex-nowrap justify-end gap-1">
                        <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-blue-600 hover:bg-blue-50" title="Xem chi tiết" onClick={() => setSelectedDeadline(item)}>
                          <Eye className="h-3 w-3" />
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
              <InfoLine label="Loại hạn chót" value={selectedDeadline.type} />
              <InfoLine label="Người phụ trách" value={selectedDeadline.assignee || "—"} />
              <InfoLine label="Ngày hạn" value={formatDate(selectedDeadline.dueDate)} />
              <InfoLine label="Còn lại" value={selectedDeadline.daysRemaining < 0 ? `Quá hạn ${Math.abs(selectedDeadline.daysRemaining)} ngày` : `${selectedDeadline.daysRemaining} ngày`} />
              <InfoLine label="Trạng thái" value={selectedDeadline.status} />
              <InfoLine label="Mức cảnh báo" value={PRIORITY_CONFIG[selectedDeadline.priority].label} />
            </div>
          )}
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
