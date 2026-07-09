"use client";

import { useMemo } from "react";
import {
  TrendingUp, Calendar, Users, CheckCircle2, XCircle, BarChart3,
} from "lucide-react";
import {
  mockHoiNghiByYear,
  computeMonthlySummary,
  type HoiNghi,
} from "@/lib/mock-dao-tao";

interface TongQuanDaoTaoProps {
  selectedYear: number;
  conferences: HoiNghi[];
}

function KpiCard({
  label, value, sub, icon, color,
}: {
  label: string; value: string | number; sub?: string;
  icon: React.ReactNode; color: string;
}) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3.5 shadow-sm">
      <div className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg ${color}`}>
        {icon}
      </div>
      <div className="min-w-0">
        <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">{label}</p>
        <p className="mt-0.5 text-xl font-bold leading-tight text-slate-800">{value}</p>
        {sub && <p className="text-[10px] text-slate-500">{sub}</p>}
      </div>
    </div>
  );
}

export default function TongQuanDaoTao({ selectedYear, conferences }: TongQuanDaoTaoProps) {
  const stats = useMemo(() => {
    const planned = conferences.filter((h) => h.loaiKeHoach === "Dự kiến").length;
    const additional = conferences.filter((h) => h.loaiKeHoach === "Phát sinh").length;
    const completed = conferences.filter((h) => h.trangThai === "Đã thực hiện").length;
    const notCompleted = Math.max(0, planned + additional - completed);
    const completionRate = planned + additional === 0 ? 0 : Math.round((completed / (planned + additional)) * 100);
    
    // Current month
    const now = new Date();
    const currentMonth = now.getMonth() + 1;
    const currentMonthEvents = conferences.filter((h) => h.thang === currentMonth).length;

    return {
      totalPlanned: planned,
      totalAdditional: additional,
      totalActual: planned + additional,
      completed,
      notCompleted,
      completionRate,
      currentMonthEvents,
    };
  }, [conferences]);

  return (
    <div className="space-y-6">
      {/* Score Cards */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        <KpiCard
          label="Tổng sự kiện dự kiến"
          value={stats.totalPlanned}
          icon={<Calendar className="h-5 w-5 text-blue-500" />}
          color="bg-blue-50"
        />
        <KpiCard
          label="Tổng sự kiện phát sinh"
          value={stats.totalAdditional}
          icon={<TrendingUp className="h-5 w-5 text-purple-500" />}
          color="bg-purple-50"
        />
        <KpiCard
          label="Tổng sự kiện thực tế"
          value={stats.totalActual}
          icon={<Users className="h-5 w-5 text-amber-500" />}
          color="bg-amber-50"
        />
        <KpiCard
          label="Sự kiện chưa thực hiện"
          value={stats.notCompleted}
          icon={<XCircle className="h-5 w-5 text-red-500" />}
          color="bg-red-50"
        />
        <KpiCard
          label="Tỷ lệ hoàn thành"
          value={`${stats.completionRate}%`}
          icon={<CheckCircle2 className="h-5 w-5 text-green-500" />}
          color="bg-green-50"
        />
        <KpiCard
          label="Sự kiện trong tháng này"
          value={stats.currentMonthEvents}
          icon={<BarChart3 className="h-5 w-5 text-indigo-500" />}
          color="bg-indigo-50"
        />
      </div>

      {/* Summary Info */}
      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <h3 className="mb-4 text-sm font-bold text-slate-700">Tóm tắt năm {selectedYear}</h3>
        <div className="space-y-3">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <span className="text-sm text-slate-600">Tổng số sự kiện kế hoạch</span>
            <span className="font-bold text-slate-800">{stats.totalActual} sự kiện</span>
          </div>
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <span className="text-sm text-slate-600">Đã thực hiện</span>
            <span className="font-bold text-green-600">{stats.completed} sự kiện</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-slate-600">Chưa thực hiện</span>
            <span className="font-bold text-orange-600">{stats.notCompleted} sự kiện</span>
          </div>
        </div>
      </div>
    </div>
  );
}
