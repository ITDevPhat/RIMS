"use client";

import { useState, useMemo, useCallback } from "react";
import {
  ChevronLeft, ChevronRight, Plus, Calendar, Clock, MapPin, User,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { HoiNghi } from "@/lib/mock-dao-tao";

interface LichDaoTaoProps {
  selectedYear: number;
  selectedMonth: number;
  onMonthChange: (month: number) => void;
  conferences: HoiNghi[];
  onEventClick: (event: HoiNghi) => void;
  onAddEvent?: () => void;
}

type ViewType = "week" | "month" | "year" | "schedule";

// ─── Utility functions ─────────────────────────────────────────────────────
function getStatusColor(status: string): string {
  const colorMap: Record<string, string> = {
    "Đã thực hiện": "bg-green-100 text-green-700 border-green-200",
    "Đang chuẩn bị": "bg-blue-100 text-blue-700 border-blue-200",
    "Dự kiến": "bg-slate-100 text-slate-600 border-slate-200",
    "Không thực hiện được": "bg-red-100 text-red-700 border-red-200",
    "Hoãn": "bg-orange-100 text-orange-700 border-orange-200",
    "Hủy": "bg-gray-100 text-gray-600 border-gray-200",
  };
  return colorMap[status] || "bg-slate-100 text-slate-600 border-slate-200";
}

function getTypeColor(type: string): string {
  const colorMap: Record<string, string> = {
    "Hội nghị": "bg-blue-50 text-blue-700 border-blue-200",
    "Hội thảo": "bg-purple-50 text-purple-700 border-purple-200",
    "Lớp đào tạo": "bg-green-50 text-green-700 border-green-200",
    "Tập huấn": "bg-cyan-50 text-cyan-700 border-cyan-200",
    "Sinh hoạt khoa học": "bg-amber-50 text-amber-700 border-amber-200",
  };
  return colorMap[type] || "bg-slate-50 text-slate-600 border-slate-200";
}

function getDayOfWeek(date: Date): string {
  const days = ["CN", "T2", "T3", "T4", "T5", "T6", "T7"];
  return days[date.getDay()];
}

function formatDateVN(date: Date): string {
  return date.toLocaleDateString("vi-VN", { weekday: "long", month: "long", day: "numeric", year: "numeric" });
}

function formatMonthVN(year: number, month: number): string {
  return new Date(year, month - 1).toLocaleDateString("vi-VN", { month: "long", year: "numeric" });
}

function getWeekStart(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  return new Date(d.setDate(diff));
}

function formatDateShort(date: Date): string {
  return `${date.getDate().toString().padStart(2, "0")}/${(date.getMonth() + 1).toString().padStart(2, "0")}/${date.getFullYear()}`;
}

// ─── Calendar header ───────────────────────────────────────────────────────
interface CalendarHeaderProps {
  viewType: ViewType;
  selectedYear: number;
  selectedMonth: number;
  selectedDate: Date;
  onViewChange: (view: ViewType) => void;
  onToday: () => void;
  onPrevious: () => void;
  onNext: () => void;
  onAddEvent: () => void;
}

function CalendarHeader({
  viewType, selectedYear, selectedMonth, selectedDate, onViewChange, onToday, onPrevious, onNext, onAddEvent,
}: CalendarHeaderProps) {
  const today = new Date();
  const isToday = selectedDate.toDateString() === today.toDateString();

  // Dynamic title based on view
  let titleText = "";
  if (viewType === "week") {
    const weekStart = getWeekStart(selectedDate);
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 6);
    const weekNum = Math.ceil((selectedDate.getDate() + new Date(selectedYear, selectedMonth - 1, 1).getDay() - 1) / 7);
    
    const startMonth = weekStart.getMonth() + 1;
    const endMonth = weekEnd.getMonth() + 1;
    const startYear = weekStart.getFullYear();
    const endYear = weekEnd.getFullYear();
    
    if (startMonth === endMonth && startYear === endYear) {
      titleText = `Tháng ${startMonth}, ${startYear}`;
    } else {
      titleText = `Tháng ${startMonth} – Tháng ${endMonth}, ${endYear}`;
    }
  } else if (viewType === "month") {
    titleText = formatMonthVN(selectedYear, selectedMonth);
  } else if (viewType === "year") {
    titleText = `${selectedYear}`;
  } else if (viewType === "schedule") {
    titleText = `Lịch biểu tháng ${selectedMonth}, ${selectedYear}`;
  }

  return (
    <div className="sticky top-0 z-10 space-y-4 rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
        {/* Top row: Title and Add button */}
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold text-slate-800">{titleText}</h3>
          <Button
            onClick={onAddEvent}
            className="h-10 min-w-[150px] gap-2 rounded-lg px-4 py-2"
          >
            <Plus className="h-5 w-5" />
            Thêm sự kiện
          </Button>
        </div>

        {/* Second row: Navigation buttons and view selector */}
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <div title="Kỳ trước">
              <Button
                variant="outline"
                onClick={onPrevious}
                className="h-10 w-10 p-0 rounded-lg"
              >
                <ChevronLeft className="h-5 w-5" />
              </Button>
            </div>
            <Button
              variant={isToday ? "default" : "outline"}
              onClick={onToday}
              className="h-10 min-w-[100px] rounded-lg"
            >
              Hôm nay
            </Button>
            <div title="Kỳ sau">
              <Button
                variant="outline"
                onClick={onNext}
                className="h-10 w-10 p-0 rounded-lg"
              >
                <ChevronRight className="h-5 w-5" />
              </Button>
            </div>
          </div>

        {/* View selector */}
        <div className="flex items-center gap-1 rounded-lg bg-slate-100 p-1">
          {(["week", "month", "year", "schedule"] as ViewType[]).map((v) => (
            <Button
              key={v}
              variant={viewType === v ? "default" : "ghost"}
              size="sm"
              onClick={() => onViewChange(v)}
              className="h-7 text-xs"
            >
              {v === "month" && "Tháng"}
              {v === "week" && "Tuần"}
              {v === "year" && "Năm"}
              {v === "schedule" && "Lịch biểu"}
            </Button>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Week View (Google Calendar style) ──────────────────────────────────────
function WeekView({
  selectedDate, conferences, onEventClick,
}: {
  selectedDate: Date; conferences: HoiNghi[]; onEventClick: (e: HoiNghi) => void;
}) {
  const weekStart = getWeekStart(selectedDate);
  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(weekStart);
    d.setDate(d.getDate() + i);
    return d;
  });

  const today = new Date();
  const eventsByDay = useMemo(() => {
    const map: Record<string, HoiNghi[]> = {};
    weekDays.forEach((d) => {
      const dateStr = d.toISOString().split("T")[0];
      map[dateStr] = conferences.filter((e) => e.ngayDuKien === dateStr);
    });
    return map;
  }, [weekDays, conferences]);

  return (
    <div className="rounded-lg border border-slate-200 bg-white shadow-sm overflow-hidden">
      {/* Header with day names and dates */}
      <div className="grid grid-cols-7 gap-0 border-b border-slate-200 bg-slate-50">
        {weekDays.map((d) => {
          const isToday = d.toDateString() === today.toDateString();
          const dayName = getDayOfWeek(d);
          const dateNum = d.getDate();
          
          return (
            <div
              key={d.toISOString()}
              className={cn(
                "flex flex-col items-center justify-center gap-1 border-r border-slate-200 py-3 last:border-r-0",
                isToday ? "bg-blue-50" : "bg-white"
              )}
            >
              <span className={cn(
                "text-xs font-bold uppercase",
                isToday ? "text-blue-600" : "text-slate-600"
              )}>
                {dayName}
              </span>
              <div className={cn(
                "flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold",
                isToday ? "bg-blue-500 text-white" : "text-slate-700"
              )}>
                {dateNum}
              </div>
            </div>
          );
        })}
      </div>

      {/* Events grid */}
      <div className="grid grid-cols-7 gap-0 divide-x divide-slate-200 min-h-96">
        {weekDays.map((d) => {
          const dateStr = d.toISOString().split("T")[0];
          const dayEvents = eventsByDay[dateStr] || [];
          
          return (
            <div
              key={d.toISOString()}
              className="flex flex-col gap-1 border-r border-slate-200 p-2 last:border-r-0"
            >
              {dayEvents.map((e) => (
                <div
                  key={e.id}
                  onClick={() => onEventClick(e)}
                  className={cn(
                    "cursor-pointer rounded-md p-1.5 text-[10px] transition-all hover:shadow-md",
                    "border",
                    e.loaiKeHoach === "Dự kiến" ? "bg-blue-50 border-blue-200 text-blue-700" :
                    e.loaiKeHoach === "Phát sinh" ? "bg-purple-50 border-purple-200 text-purple-700" :
                    "bg-slate-50 border-slate-200 text-slate-600"
                  )}
                >
                  <div className="font-semibold truncate">{e.ten}</div>
                  <div className="text-[9px] text-slate-500 truncate">{e.khoaPhong}</div>
                </div>
              ))}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Month View ────────────────────────────────────────────────────────────
function MonthView({
  selectedYear, selectedMonth, conferences, onEventClick,
}: {
  selectedYear: number; selectedMonth: number; conferences: HoiNghi[]; onEventClick: (e: HoiNghi) => void;
}) {
  const daysInMonth = new Date(selectedYear, selectedMonth, 0).getDate();
  const firstDay = new Date(selectedYear, selectedMonth - 1, 1).getDay();
  const today = new Date();
  const isCurrentMonth = today.getMonth() + 1 === selectedMonth && today.getFullYear() === selectedYear;

  const eventsByDay = useMemo(() => {
    const map: Record<number, HoiNghi[]> = {};
    conferences
      .filter((h) => h.thang === selectedMonth && h.nam === selectedYear)
      .forEach((h) => {
        const day = parseInt(h.ngayDuKien.split("-")[2]);
        if (!map[day]) map[day] = [];
        map[day].push(h);
      });
    return map;
  }, [conferences, selectedMonth, selectedYear]);

  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);
  const blanks = Array.from({ length: (firstDay + 6) % 7 }, () => 0);

  return (
    <div className="rounded-lg border border-slate-200 bg-white shadow-sm overflow-hidden">
      <div className="grid grid-cols-7 gap-0 border-b border-slate-200 bg-slate-50">
        {["Thứ 2", "Thứ 3", "Thứ 4", "Thứ 5", "Thứ 6", "Thứ 7", "CN"].map((d) => (
          <div key={d} className="border-r border-slate-200 py-2 text-center text-[11px] font-bold text-slate-600 uppercase last:border-r-0">
            {d}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-0 divide-x divide-slate-200">
        {blanks.map((_, i) => (
          <div key={`blank-${i}`} className="min-h-24 border-b border-slate-200 bg-slate-50 p-1 last:border-r-0" />
        ))}
        {days.map((day) => {
          const events = eventsByDay[day] || [];
          const isToday = isCurrentMonth && today.getDate() === day;
          
          return (
            <div
              key={day}
              className={cn(
                "min-h-24 border-b border-r border-slate-200 p-1.5 text-[10px] last:border-r-0",
                isToday ? "bg-blue-50" : "bg-white"
              )}
            >
              <p className={cn(
                "font-bold mb-1",
                isToday ? "text-blue-600" : "text-slate-600"
              )}>
                {day}
              </p>
              <div className="space-y-0.5">
                {events.slice(0, 2).map((e) => (
                  <div
                    key={e.id}
                    onClick={() => onEventClick(e)}
                    className={cn(
                      "cursor-pointer truncate rounded px-1.5 py-0.5 text-[8px] font-medium hover:shadow-sm transition-all border",
                      getTypeColor(e.loai)
                    )}
                    title={e.ten}
                  >
                    {e.ten}
                  </div>
                ))}
                {events.length > 2 && (
                  <p className="px-1.5 text-[8px] text-slate-500 font-medium">+{events.length - 2} sự kiện</p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Year View ─────────────────────────────────────────────────────────────
function YearView({
  selectedYear, conferences, onEventClick,
}: {
  selectedYear: number; conferences: HoiNghi[]; onEventClick: (e: HoiNghi) => void;
}) {
  const monthNames = [
    "Tháng 1", "Tháng 2", "Tháng 3", "Tháng 4", "Tháng 5", "Tháng 6",
    "Tháng 7", "Tháng 8", "Tháng 9", "Tháng 10", "Tháng 11", "Tháng 12",
  ];

  const today = new Date();
  const isCurrentYear = today.getFullYear() === selectedYear;

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {monthNames.map((name, monthIdx) => {
        const month = monthIdx + 1;
        const monthConfs = conferences.filter((h) => h.thang === month && h.nam === selectedYear);
        const planned = monthConfs.filter((h) => h.loaiKeHoach === "Dự kiến").length;
        const additional = monthConfs.filter((h) => h.loaiKeHoach === "Phát sinh").length;
        const completed = monthConfs.filter((h) => h.trangThai === "Đã thực hiện").length;
        const total = planned + additional;
        const rate = total === 0 ? 0 : Math.round((completed / total) * 100);

        return (
          <div key={month} className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm hover:shadow-md transition-shadow">
            <h4 className="font-bold text-slate-800">{name}</h4>
            <div className="mt-3 space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-600">Dự kiến:</span>
                <span className="font-semibold text-blue-600">{planned}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">Phát sinh:</span>
                <span className="font-semibold text-purple-600">{additional}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">Thực tế:</span>
                <span className="font-semibold text-green-600">{completed}</span>
              </div>
              <div className="flex justify-between border-t border-slate-200 pt-2">
                <span className="text-slate-600">Hoàn thành:</span>
                <span className={cn("font-bold", rate >= 70 ? "text-green-600" : rate >= 50 ? "text-amber-600" : "text-orange-600")}>
                  {rate}%
                </span>
              </div>
            </div>
            {monthConfs.length > 0 && (
              <div className="mt-3 space-y-1 border-t border-slate-200 pt-3">
                {monthConfs.slice(0, 2).map((e) => (
                  <p
                    key={e.id}
                    onClick={() => onEventClick(e)}
                    className="cursor-pointer truncate text-[11px] text-blue-600 hover:underline"
                    title={e.ten}
                  >
                    {e.ten}
                  </p>
                ))}
                {monthConfs.length > 2 && (
                  <p className="text-[10px] text-slate-500">+{monthConfs.length - 2} sự kiện khác</p>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ─── Schedule View (Agenda style) ──────────────────────────────────────────
function ScheduleView({
  selectedYear, selectedMonth, conferences, onEventClick,
}: {
  selectedYear: number; selectedMonth: number; conferences: HoiNghi[]; onEventClick: (e: HoiNghi) => void;
}) {
  const monthConfs = useMemo(
    () => conferences
      .filter((h) => h.thang === selectedMonth && h.nam === selectedYear)
      .sort((a, b) => a.ngayDuKien.localeCompare(b.ngayDuKien)),
    [conferences, selectedMonth, selectedYear]
  );

  const groupedByDate = useMemo(() => {
    const map: Record<string, HoiNghi[]> = {};
    monthConfs.forEach((h) => {
      if (!map[h.ngayDuKien]) map[h.ngayDuKien] = [];
      map[h.ngayDuKien].push(h);
    });
    return Object.entries(map).sort(([a], [b]) => a.localeCompare(b));
  }, [monthConfs]);

  return (
    <div className="space-y-3">
      {groupedByDate.length === 0 ? (
        <div className="rounded-lg border border-slate-200 bg-slate-50 p-8 text-center text-sm text-slate-500">
          Không có sự kiện trong tháng này
        </div>
      ) : (
        groupedByDate.map(([date, eventsOnDate]) => (
          <div key={date} className="rounded-lg border border-slate-200 bg-white overflow-hidden shadow-sm">
            <div className="bg-gradient-to-r from-slate-50 to-slate-100 px-4 py-3 font-bold text-slate-700 border-b border-slate-200">
              {formatDateVN(new Date(date))}
            </div>
            <div className="divide-y divide-slate-100">
              {eventsOnDate.map((e) => (
                <div
                  key={e.id}
                  onClick={() => onEventClick(e)}
                  className="cursor-pointer p-4 hover:bg-slate-50 transition-colors"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <Clock className="h-4 w-4 text-slate-400 flex-shrink-0" />
                        <p className="text-sm font-semibold text-slate-800">{e.ten}</p>
                      </div>
                      <div className="mt-2 flex flex-wrap items-center gap-2 mb-2">
                        <Badge variant="outline" className={cn("text-[10px]", getTypeColor(e.loai))}>
                          {e.loai}
                        </Badge>
                        <Badge variant="outline" className="text-[10px]">
                          {e.khoaPhong}
                        </Badge>
                        <span className={cn("text-[10px] font-semibold px-2 py-1 rounded border", getStatusColor(e.trangThai))}>
                          {e.trangThai}
                        </span>
                      </div>
                      <div className="mt-2 space-y-1 text-[11px] text-slate-600">
                        <div className="flex items-center gap-2">
                          <User className="h-3.5 w-3.5 text-slate-400 flex-shrink-0" />
                          <span>Người phụ trách: <span className="font-medium text-slate-700">{e.nguoiPhuTrach}</span></span>
                        </div>
                        <div className="flex items-center gap-2">
                          <MapPin className="h-3.5 w-3.5 text-slate-400 flex-shrink-0" />
                          <span>Địa điểm: <span className="font-medium text-slate-700">{e.diaDiem}</span></span>
                        </div>
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-8 text-[10px] flex-shrink-0"
                      onClick={(evt) => {
                        evt.stopPropagation();
                        onEventClick(e);
                      }}
                    >
                      Chi tiết
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))
      )}
    </div>
  );
}

// ─── Main component ────────────────────────────────────────────────────────
export default function LichDaoTao({
  selectedYear,
  selectedMonth,
  onMonthChange,
  conferences,
  onEventClick,
  onAddEvent,
}: LichDaoTaoProps) {
  const [viewType, setViewType] = useState<ViewType>("month");
  const [selectedDate, setSelectedDate] = useState(new Date());

  const handleToday = useCallback(() => {
    const today = new Date();
    setSelectedDate(today);
    onMonthChange(today.getMonth() + 1);
  }, [onMonthChange]);

  const handlePrevious = useCallback(() => {
    const newDate = new Date(selectedDate);
    if (viewType === "week") {
      newDate.setDate(newDate.getDate() - 7);
    } else if (viewType === "month") {
      newDate.setMonth(newDate.getMonth() - 1);
    } else if (viewType === "year") {
      newDate.setFullYear(newDate.getFullYear() - 1);
    } else if (viewType === "schedule") {
      newDate.setMonth(newDate.getMonth() - 1);
    }
    setSelectedDate(newDate);
    onMonthChange(newDate.getMonth() + 1);
  }, [selectedDate, viewType, onMonthChange]);

  const handleNext = useCallback(() => {
    const newDate = new Date(selectedDate);
    if (viewType === "week") {
      newDate.setDate(newDate.getDate() + 7);
    } else if (viewType === "month") {
      newDate.setMonth(newDate.getMonth() + 1);
    } else if (viewType === "year") {
      newDate.setFullYear(newDate.getFullYear() + 1);
    } else if (viewType === "schedule") {
      newDate.setMonth(newDate.getMonth() + 1);
    }
    setSelectedDate(newDate);
    onMonthChange(newDate.getMonth() + 1);
  }, [selectedDate, viewType, onMonthChange]);

  const handleViewChange = useCallback((newView: ViewType) => {
    setViewType(newView);
  }, []);

  return (
    <div className="space-y-4">
      {/* Calendar header */}
      <CalendarHeader
        viewType={viewType}
        selectedYear={selectedDate.getFullYear()}
        selectedMonth={selectedDate.getMonth() + 1}
        selectedDate={selectedDate}
        onViewChange={handleViewChange}
        onToday={handleToday}
        onPrevious={handlePrevious}
        onNext={handleNext}
        onAddEvent={onAddEvent || (() => {})}
      />

      {/* Views */}
      {viewType === "week" && (
        <WeekView
          selectedDate={selectedDate}
          conferences={conferences}
          onEventClick={onEventClick}
        />
      )}

      {viewType === "month" && (
        <MonthView
          selectedYear={selectedDate.getFullYear()}
          selectedMonth={selectedDate.getMonth() + 1}
          conferences={conferences}
          onEventClick={onEventClick}
        />
      )}

      {viewType === "year" && (
        <YearView
          selectedYear={selectedDate.getFullYear()}
          conferences={conferences}
          onEventClick={onEventClick}
        />
      )}

      {viewType === "schedule" && (
        <ScheduleView
          selectedYear={selectedDate.getFullYear()}
          selectedMonth={selectedDate.getMonth() + 1}
          conferences={conferences}
          onEventClick={onEventClick}
        />
      )}
    </div>
  );
}
