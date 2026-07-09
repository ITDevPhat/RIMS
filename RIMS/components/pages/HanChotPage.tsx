"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { AlertTriangle, Calendar, CheckCircle2, Clock, Search, Shield, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { DeadlineItem } from "@/lib/types";
import { projectDeadlineApi, researchApi } from "@/lib/api/research-api";
import { mapApiDeadlineToUi } from "@/lib/mappers/deadline-mapper";
import { mapApiProjectToUi } from "@/lib/mappers/project-mapper";

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

  return (
    <div>
      <div className="border-b border-slate-200 bg-white px-8 py-5">
        <h1 className="text-lg font-bold text-slate-800">Hạn chót & Cảnh báo</h1>
        <p className="mt-0.5 text-sm text-slate-500">Theo dõi hạn chót của đề tài, giai đoạn và mốc tiến độ từ backend RMS.</p>
      </div>

      <div className="space-y-6 px-8 py-6">
        {loading && <Card><CardContent className="p-4 text-sm text-slate-500">Đang tải hạn chót...</CardContent></Card>}
        {error && <Card className="border-red-200 bg-red-50"><CardContent className="flex items-center justify-between p-4 text-sm font-medium text-red-700">{error}<Button size="sm" variant="outline" onClick={() => void loadData()}>Thử lại</Button></CardContent></Card>}

        <div className="grid grid-cols-5 gap-3">
          {PRIORITY_ORDER.map((priority) => (
            <Card key={priority} onClick={() => setFilterType(filterType === priority ? "all" : priority)} className={cn("cursor-pointer border transition hover:shadow-md", filterType === priority ? "border-blue-300 bg-blue-50" : "border-slate-200 bg-white")}>
              <CardContent className="flex items-center gap-3 p-4">
                {PRIORITY_CONFIG[priority].icon}
                <div>
                  <div className="text-2xl font-bold text-slate-800">{counts[priority]}</div>
                  <div className="text-[11px] text-slate-500">{PRIORITY_CONFIG[priority].label}</div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="relative max-w-sm flex-1 min-w-[220px]">
            <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
            <Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Tìm kiếm hạn chót..." className="h-9 border-slate-200 pl-9 text-sm" />
          </div>
          <Select value={filterResearch} onValueChange={(value) => value && setFilterResearch(value)}>
            <SelectTrigger className="h-9 w-56 text-sm border-slate-200"><SelectValue placeholder="Đề tài" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tất cả đề tài</SelectItem>
              {projects.map((project) => <SelectItem key={project.id} value={project.id}>{project.code}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={filterType} onValueChange={(value) => value && setFilterType(value)}>
            <SelectTrigger className="h-9 w-52 text-sm border-slate-200"><SelectValue placeholder="Mức ưu tiên" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tất cả mức ưu tiên</SelectItem>
              {PRIORITY_ORDER.map((priority) => <SelectItem key={priority} value={priority}>{PRIORITY_CONFIG[priority].label}</SelectItem>)}
            </SelectContent>
          </Select>
          <span className="ml-auto text-xs text-slate-400">Hiển thị {filtered.length}/{items.length} hạn chót</span>
        </div>

        <Card className="overflow-hidden border-slate-200 shadow-sm">
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow className="bg-slate-50">{["Mã đề tài", "Tên đề tài", "Loại hạn chót", "Người phụ trách", "Ngày hạn", "Còn lại", "Trạng thái", "Thao tác"].map((head) => <TableHead key={head} className="px-4 py-2.5 text-[10px] font-semibold uppercase text-slate-500">{head}</TableHead>)}</TableRow>
              </TableHeader>
              <TableBody>
                {filtered.length === 0 ? (
                  <TableRow><TableCell colSpan={8} className="py-12 text-center text-sm text-slate-400">Không tìm thấy hạn chót nào.</TableCell></TableRow>
                ) : filtered.map((item) => (
                  <TableRow key={item.id} className="border-b border-slate-100 hover:bg-slate-50">
                    <TableCell className="px-4 py-3 text-xs font-mono font-semibold text-slate-700">{item.researchCode || "—"}</TableCell>
                    <TableCell className="px-4 py-3 text-sm text-slate-800">{item.researchName || "—"}</TableCell>
                    <TableCell className="px-4 py-3"><span className={cn("inline-flex rounded-full border px-2 py-0.5 text-[10px] font-semibold", PRIORITY_CONFIG[item.priority].badge)}>{item.type}</span></TableCell>
                    <TableCell className="px-4 py-3 text-xs text-slate-600">{item.assignee}</TableCell>
                    <TableCell className="px-4 py-3 text-xs text-slate-700"><Calendar className="mr-1 inline h-3 w-3 text-slate-400" />{formatDate(item.dueDate)}</TableCell>
                    <TableCell className="px-4 py-3"><DaysChip days={item.daysRemaining} /></TableCell>
                    <TableCell className="px-4 py-3 text-xs font-semibold text-slate-600">{item.status}</TableCell>
                    <TableCell className="px-4 py-3">
                      <Button size="sm" variant="outline" disabled={item.status === "Hoàn thành"} onClick={async () => { await projectDeadlineApi.markCompleted(item.id); await loadData(); }}>Hoàn thành</Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
