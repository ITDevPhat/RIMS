"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { RefreshCw } from "lucide-react";
import { auditApi, type ApiAuditLog, type ApiLoginEvent } from "@/lib/api/audit-api";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

type LogTab = "activity" | "login";

export default function NhatKyHeThong() {
  const [tab, setTab] = useState<LogTab>("activity");
  const [activities, setActivities] = useState<ApiAuditLog[]>([]);
  const [logins, setLogins] = useState<ApiLoginEvent[]>([]);
  const [search, setSearch] = useState("");
  const [type, setType] = useState("all");
  const [result, setResult] = useState("all");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true); setError("");
    const params = { pageSize: 200, fromDate: fromDate || undefined, toDate: toDate ? `${toDate}T23:59:59` : undefined };
    try {
      if (tab === "activity") {
        const data = await auditApi.getAuditLogs({ ...params, actionType: type === "all" ? undefined : type });
        setActivities(data.items);
      } else {
        const data = await auditApi.getLoginEvents({ ...params, eventType: type === "all" ? undefined : type, success: result === "all" ? undefined : result === "success", usernameOrEmail: search || undefined });
        setLogins(data.items);
      }
    } catch { setError("Không tải được nhật ký hệ thống."); }
    finally { setLoading(false); }
  }, [fromDate, result, search, tab, toDate, type]);

  useEffect(() => { void load(); }, [load]);
  useEffect(() => { setType("all"); }, [tab]);

  const activityTypes = useMemo(() => [...new Set(activities.map((item) => item.actionType))], [activities]);
  const loginTypes = useMemo(() => [...new Set(logins.map((item) => item.eventType))], [logins]);
  const visibleActivities = activities.filter((item) => {
    const match = `${item.performedByName ?? ""} ${item.moduleCode} ${item.actionSummary}`.toLowerCase().includes(search.toLowerCase());
    return match && (result === "all" || item.success === (result === "success"));
  });

  return (
    <div className="space-y-5 px-4 py-6 sm:px-6 lg:px-8">
      <div><h1 className="text-2xl font-bold text-slate-800">Nhật ký hệ thống</h1><p className="mt-1 text-sm text-slate-500">Theo dõi hoạt động và lịch sử đăng nhập thực tế từ hệ thống.</p></div>
      <Tabs value={tab} onValueChange={(value) => setTab(value as LogTab)}><TabsList><TabsTrigger value="activity">Hoạt động</TabsTrigger><TabsTrigger value="login">Đăng nhập</TabsTrigger></TabsList></Tabs>
      <Card>
        <CardHeader><CardTitle className="text-base">Bộ lọc</CardTitle></CardHeader>
        <CardContent className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-6">
          <Input className="lg:col-span-2" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Tìm người dùng, nội dung..." />
          <Select value={type} onValueChange={(value) => value && setType(value)}><SelectTrigger><SelectValue placeholder="Loại sự kiện" /></SelectTrigger><SelectContent><SelectItem value="all">Tất cả loại</SelectItem>{(tab === "activity" ? activityTypes : loginTypes).map((value) => <SelectItem key={value} value={value}>{value}</SelectItem>)}</SelectContent></Select>
          <Select value={result} onValueChange={(value) => value && setResult(value)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">Mọi kết quả</SelectItem><SelectItem value="success">Thành công</SelectItem><SelectItem value="failure">Thất bại</SelectItem></SelectContent></Select>
          <Input type="date" value={fromDate} onChange={(event) => setFromDate(event.target.value)} aria-label="Từ ngày" />
          <Input type="date" value={toDate} onChange={(event) => setToDate(event.target.value)} aria-label="Đến ngày" />
          <Button variant="outline" className="gap-2 lg:col-start-6" onClick={() => void load()} disabled={loading}><RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />Tải lại</Button>
        </CardContent>
      </Card>
      <Card><CardContent className="p-0">
        {loading ? <div className="p-10 text-center text-sm text-slate-500">Đang tải nhật ký...</div> : error ? <div className="p-8 text-center text-sm text-red-600">{error}<Button size="sm" variant="outline" className="ml-3" onClick={() => void load()}>Thử lại</Button></div> : (
          <div className="overflow-x-auto"><table className="min-w-[1000px] w-full text-sm"><thead className="bg-slate-50 text-left"><tr>{tab === "activity" ? <><th className="p-3">Thời gian</th><th className="p-3">Người thực hiện</th><th className="p-3">Module</th><th className="p-3">Hành động</th><th className="p-3">Nội dung</th></> : <><th className="p-3">Thời gian</th><th className="p-3">Tài khoản</th><th className="p-3">Sự kiện</th><th className="p-3">Địa chỉ IP</th><th className="p-3">Lý do thất bại</th></>}<th className="p-3">Kết quả</th></tr></thead>
          <tbody className="divide-y">{tab === "activity" ? visibleActivities.map((item) => <tr key={item.activityLogId}><td className="p-3 whitespace-nowrap">{new Date(item.performedAt).toLocaleString("vi-VN")}</td><td className="p-3">{item.performedByName ?? "Hệ thống"}</td><td className="p-3">{item.moduleCode}</td><td className="p-3">{item.actionType}</td><td className="p-3">{item.actionSummary}</td><ResultBadge success={item.success} /></tr>) : logins.map((item) => <tr key={item.loginEventId}><td className="p-3 whitespace-nowrap">{new Date(item.createdAt).toLocaleString("vi-VN")}</td><td className="p-3">{item.usernameOrEmail ?? "—"}</td><td className="p-3">{item.eventType}</td><td className="p-3">{item.ipAddress ?? "—"}</td><td className="p-3">{item.failureReason ?? "—"}</td><ResultBadge success={item.success} /></tr>)}</tbody></table>
          {(tab === "activity" ? visibleActivities.length : logins.length) === 0 && <div className="p-10 text-center text-sm text-slate-500">Không có dữ liệu phù hợp.</div>}</div>
        )}
      </CardContent></Card>
    </div>
  );
}

function ResultBadge({ success }: { success: boolean }) { return <td className="p-3"><Badge className={success ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-700"}>{success ? "Thành công" : "Thất bại"}</Badge></td>; }
