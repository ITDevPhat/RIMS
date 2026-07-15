"use client";

import { useState, useEffect, useCallback } from "react";
import { GraduationCap, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { HoiNghi } from "@/lib/mock-dao-tao";
import { trainingApi } from "@/lib/api/training-api";
import { mapApiTrainingEventToUi } from "@/lib/mappers/training-event-mapper";
import TrainingModuleNav from "@/components/layout/TrainingModuleNav";
import HoiNghiFormModal from "@/components/modals/HoiNghiFormModal";
import HoiNghiDetailDrawer from "@/components/modals/HoiNghiDetailDrawer";
import TongQuanDaoTao from "@/components/pages/training/TongQuanDaoTao";
import LichDaoTao from "@/components/pages/training/LichDaoTao";
import DanhSachSuKien from "@/components/pages/training/DanhSachSuKien";
import ThongKeNam from "@/components/pages/training/ThongKeNam";
import CaiDatDaoTao from "@/components/pages/training/CaiDatDaoTao";
import { toast } from "@/lib/toast";

export default function MangDaoTaoPage() {
  const [selectedYear, setSelectedYear] = useState(2026);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [activeTab, setActiveTab] = useState<"overview" | "calendar" | "eventlist" | "statistics" | "settings">("overview");
  const [formOpen, setFormOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<HoiNghi | null>(null);
  const [detailTarget, setDetailTarget] = useState<HoiNghi | null>(null);
  const [allConferences, setAllConferences] = useState<HoiNghi[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadEvents = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const result = await trainingApi.getTrainingEvents({ year: selectedYear, pageSize: 100 });
      setAllConferences(result.items.map(mapApiTrainingEventToUi));
    } catch {
      setError("Không tải được dữ liệu đào tạo từ API.");
      toast.error("Không tải được dữ liệu đào tạo.");
      setAllConferences([]);
    } finally {
      setLoading(false);
    }
  }, [selectedYear]);

  useEffect(() => {
    void loadEvents();
  }, [loadEvents]);

  const toPayload = (data: Partial<HoiNghi>) => ({
    eventCode: data.ma,
    eventTitle: data.ten,
    description: data.moTa,
    eventYear: data.nam ?? selectedYear,
    eventMonth: data.thang ?? selectedMonth,
    plannedDate: data.ngayDuKien || null,
    startTime: null,
    endTime: null,
    actualDate: data.ngayThucTe || null,
    categoryId: null,
    eventType: data.loai === "Hội nghị" ? "conference" : data.loai === "Hội thảo" ? "workshop" : data.loai === "Lớp đào tạo" ? "class" : data.loai === "Tập huấn" ? "training" : "other",
    planType: data.loaiKeHoach === "Phát sinh" ? "additional" : "planned",
    departmentId: null,
    responsibleUserId: null,
    location: data.diaDiem,
    deliveryMode: "offline",
    expectedParticipants: data.soNguoiDuKien ?? 0,
    actualParticipants: data.soNguoiThucTe ?? null,
    eventStatus: data.trangThai === "Đã thực hiện" ? "completed" : data.trangThai === "Đang chuẩn bị" ? "preparing" : data.trangThai === "Không thực hiện được" ? "not_completed" : data.trangThai === "Hoãn" ? "postponed" : data.trangThai === "Hủy" ? "cancelled" : "planned",
    cancelReason: data.lyDoKhongThucHien,
    notes: data.ghiChu,
  });

  const handleSave = async (data: Partial<HoiNghi>) => {
    try {
      if (editTarget) {
        await trainingApi.updateTrainingEvent(editTarget.id, toPayload({ ...editTarget, ...data }));
        toast.success({ title: "Đã cập nhật sự kiện đào tạo", description: editTarget.ma });
      } else {
        await trainingApi.createTrainingEvent(toPayload(data));
        toast.success({ title: "Đã thêm sự kiện đào tạo", description: data.ma || data.ten });
      }
      setEditTarget(null);
      await loadEvents();
    } catch (saveError) {
      const message = saveError instanceof Error ? saveError.message : "Không lưu được sự kiện đào tạo.";
      toast.error({ title: "Không lưu được sự kiện đào tạo", description: message });
      throw saveError;
    }
  };

  const handleDelete = async (id: string) => {
    const target = allConferences.find((item) => item.id === id);
    try {
      await trainingApi.deleteTrainingEvent(id);
      toast.success({ title: "Đã xóa sự kiện đào tạo", description: target?.ma ?? id });
      await loadEvents();
    } catch (deleteError) {
      const message = deleteError instanceof Error ? deleteError.message : "Không xóa được sự kiện đào tạo.";
      toast.error({ title: "Không xóa được sự kiện đào tạo", description: message });
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Detail drawer */}
      <HoiNghiDetailDrawer
        hoiNghi={detailTarget}
        onClose={() => setDetailTarget(null)}
      />

      {/* Form modal */}
      <HoiNghiFormModal
        open={formOpen}
        onClose={() => {
          setFormOpen(false);
          setEditTarget(null);
        }}
        onSave={handleSave}
        initialData={editTarget}
        selectedYear={selectedYear}
      />

      {/* Page header */}
      <div className="border-b border-slate-200 bg-white px-8 py-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-600 shadow-sm">
              <GraduationCap className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-slate-800">Mảng đào tạo</h1>
              <p className="text-xs text-slate-500">
                Theo dõi hội nghị, hội thảo và hoạt động đào tạo theo kế hoạch năm.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            {/* Year selector */}
            <Select value={String(selectedYear)} onValueChange={(v) => v && setSelectedYear(Number(v))}>
              <SelectTrigger className="h-8 w-28 text-sm border-slate-200 bg-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {[2024, 2025, 2026, 2027].map((y) => (
                  <SelectItem key={y} value={String(y)}>
                    Năm {y}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              size="sm"
              className="h-8 bg-indigo-600 hover:bg-indigo-700 text-white"
              onClick={() => {
                setEditTarget(null);
                setFormOpen(true);
              }}
            >
              <Plus className="mr-1.5 h-3.5 w-3.5" />
              Thêm sự kiện
            </Button>
          </div>
        </div>
      </div>

      {/* Training Module Navigation */}
      <TrainingModuleNav activeTab={activeTab} onTabChange={setActiveTab} />

      {/* Content Area */}
      <div className="px-8 py-6">
        {loading && (
          <div className="mb-4 rounded-lg border border-slate-200 bg-white p-4 text-sm text-slate-500">
            Đang tải dữ liệu đào tạo...
          </div>
        )}
        {error && (
          <div className="mb-4 flex items-center justify-between rounded-lg border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-700">
            {error}
            <Button size="sm" variant="outline" onClick={() => void loadEvents()}>Thử lại</Button>
          </div>
        )}
        {activeTab === "overview" && (
          <TongQuanDaoTao selectedYear={selectedYear} conferences={allConferences} />
        )}

        {activeTab === "calendar" && (
          <LichDaoTao
            selectedYear={selectedYear}
            selectedMonth={selectedMonth}
            onMonthChange={setSelectedMonth}
            conferences={allConferences}
            onEventClick={setDetailTarget}
            onAddEvent={() => {
              setEditTarget(null);
              setFormOpen(true);
            }}
          />
        )}

        {activeTab === "eventlist" && (
          <DanhSachSuKien
            conferences={allConferences}
            onAddEvent={() => {
              setEditTarget(null);
              setFormOpen(true);
            }}
            onEditEvent={(event) => {
              setEditTarget(event);
              setFormOpen(true);
            }}
            onDeleteEvent={handleDelete}
            onViewEvent={setDetailTarget}
          />
        )}

        {activeTab === "statistics" && (
          <ThongKeNam selectedYear={selectedYear} conferences={allConferences} />
        )}

        {activeTab === "settings" && <CaiDatDaoTao />}
      </div>
    </div>
  );
}
