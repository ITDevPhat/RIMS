"use client";

import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FormDrawer, FormDrawerField, FormDrawerSection } from "@/components/common/FormDrawer";
import type { ResearchPhase, PhaseStatus } from "@/lib/types";

const STATUS_OPTIONS: PhaseStatus[] = [
  "Chưa bắt đầu",
  "Đang thực hiện",
  "Chờ duyệt",
  "Cần chỉnh sửa",
  "Hoàn thành",
  "Hoàn thành trễ",
  "Có nguy cơ",
  "Trễ hạn",
  "Tạm dừng",
  "Hủy",
];

interface PhaseFormModalProps {
  open: boolean;
  onClose: () => void;
  phase?: ResearchPhase | null;
}

export default function PhaseFormModal({ open, onClose, phase }: PhaseFormModalProps) {
  const isEdit = !!phase;

  const [form, setForm] = useState({
    name: "",
    description: "",
    assignee: "",
    plannedStartDate: "",
    plannedEndDate: "",
    deadline: "",
    actualStartDate: "",
    actualEndDate: "",
    progress: "0",
    status: "Chưa bắt đầu" as PhaseStatus,
    notes: "",
  });

  useEffect(() => {
    if (phase) {
      setForm({
        name: phase.name,
        description: phase.description ?? "",
        assignee: phase.assignee ?? "",
        plannedStartDate: phase.plannedStartDate,
        plannedEndDate: phase.plannedEndDate,
        deadline: phase.deadline,
        actualStartDate: phase.actualStartDate ?? "",
        actualEndDate: phase.actualEndDate ?? "",
        progress: String(phase.progress),
        status: phase.status,
        notes: phase.notes ?? "",
      });
    } else {
      setForm({
        name: "",
        description: "",
        assignee: "",
        plannedStartDate: "",
        plannedEndDate: "",
        deadline: "",
        actualStartDate: "",
        actualEndDate: "",
        progress: "0",
        status: "Chưa bắt đầu",
        notes: "",
      });
    }
  }, [phase, open]);

  const handleChange = (field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <FormDrawer
      open={open}
      onOpenChange={onClose}
      title={isEdit ? "Chỉnh sửa giai đoạn" : "Thêm giai đoạn mới"}
      onSave={onClose}
      saveLabel={isEdit ? "Cập nhật" : "Lưu"}
    >
      <FormDrawerField label="Tên giai đoạn" required colSpan={2}>
        <Input
          value={form.name}
          onChange={(e) => handleChange("name", e.target.value)}
          placeholder="Nhập tên giai đoạn..."
          className="h-9 border-slate-200"
        />
      </FormDrawerField>

      <FormDrawerField label="Mô tả" colSpan={2}>
        <textarea
          value={form.description}
          onChange={(e) => handleChange("description", e.target.value)}
          placeholder="Mô tả giai đoạn..."
          className="h-20 w-full rounded-md border border-slate-200 px-3 py-2 text-sm text-slate-700 placeholder:text-slate-400 focus:border-blue-400 focus:ring-2 focus:ring-blue-100 resize-none"
        />
      </FormDrawerField>

      <FormDrawerSection>
        <FormDrawerField label="Người phụ trách">
          <Input
            value={form.assignee}
            onChange={(e) => handleChange("assignee", e.target.value)}
            placeholder="Tên người phụ trách..."
            className="h-9 border-slate-200"
          />
        </FormDrawerField>

        <FormDrawerField label="Tiến độ (%)">
          <Input
            type="number"
            min={0}
            max={100}
            value={form.progress}
            onChange={(e) => handleChange("progress", e.target.value)}
            className="h-9 border-slate-200"
          />
        </FormDrawerField>
      </FormDrawerSection>

      <FormDrawerSection>
        <FormDrawerField label="Ngày bắt đầu dự kiến">
          <Input
            type="date"
            value={form.plannedStartDate}
            onChange={(e) => handleChange("plannedStartDate", e.target.value)}
            className="h-9 border-slate-200"
          />
        </FormDrawerField>

        <FormDrawerField label="Ngày kết thúc dự kiến">
          <Input
            type="date"
            value={form.plannedEndDate}
            onChange={(e) => handleChange("plannedEndDate", e.target.value)}
            className="h-9 border-slate-200"
          />
        </FormDrawerField>
      </FormDrawerSection>

      <FormDrawerSection>
        <FormDrawerField label="Hạn chót">
          <Input
            type="date"
            value={form.deadline}
            onChange={(e) => handleChange("deadline", e.target.value)}
            className="h-9 border-slate-200"
          />
        </FormDrawerField>

        <FormDrawerField label="Trạng thái" required>
          <Select value={form.status} onValueChange={(v) => v && handleChange("status", v)}>
            <SelectTrigger className="h-9 border-slate-200">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {STATUS_OPTIONS.map((s) => (
                <SelectItem key={s} value={s}>{s}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </FormDrawerField>
      </FormDrawerSection>

      <FormDrawerSection>
        <FormDrawerField label="Ngày bắt đầu thực tế">
          <Input
            type="date"
            value={form.actualStartDate}
            onChange={(e) => handleChange("actualStartDate", e.target.value)}
            className="h-9 border-slate-200"
          />
        </FormDrawerField>

        <FormDrawerField label="Ngày kết thúc thực tế">
          <Input
            type="date"
            value={form.actualEndDate}
            onChange={(e) => handleChange("actualEndDate", e.target.value)}
            className="h-9 border-slate-200"
          />
        </FormDrawerField>
      </FormDrawerSection>

      <FormDrawerField label="Ghi chú" colSpan={2}>
        <textarea
          value={form.notes}
          onChange={(e) => handleChange("notes", e.target.value)}
          placeholder="Nhập ghi chú..."
          className="h-16 w-full rounded-md border border-slate-200 px-3 py-2 text-sm text-slate-700 placeholder:text-slate-400 focus:border-blue-400 focus:ring-2 focus:ring-blue-100 resize-none"
        />
      </FormDrawerField>
    </FormDrawer>
  );
}
