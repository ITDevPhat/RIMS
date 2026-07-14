"use client";

import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { FormDrawer, FormDrawerField, FormDrawerSection } from "@/components/common/FormDrawer";
import type { PhaseStatus, ResearchMilestone, ResearchPhase, RiskLevel } from "@/lib/types";
import type { ProjectMilestonePayload } from "@/lib/api/research-api";
import { toApiPhaseStatus, toApiPriorityLevel } from "@/lib/mappers/status-mapper";

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

const RISK_OPTIONS: RiskLevel[] = [
  "Đúng tiến độ",
  "Có nguy cơ",
  "Trễ hạn",
  "Đã hoàn thành",
  "Hoàn thành trễ",
  "Tạm dừng",
];

interface MocTienDoFormModalProps {
  open: boolean;
  onClose: () => void;
  milestone?: ResearchMilestone | null;
  phases: ResearchPhase[];
  projectId?: string;
  onSubmit?: (payload: ProjectMilestonePayload) => Promise<void>;
}

const toNumberOrNull = (value?: string | null) => {
  if (!value) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

const toOptionalDate = (value: string) => value || null;

function getErrorMessage(error: unknown) {
  if (error instanceof Error) return error.message;
  return "Không lưu được mốc tiến độ. Vui lòng thử lại.";
}

export default function MocTienDoFormModal({
  open,
  onClose,
  milestone,
  phases,
  projectId,
  onSubmit,
}: MocTienDoFormModalProps) {
  const isEdit = !!milestone;
  const [saving, setSaving] = useState(false);
  const [submitError, setSubmitError] = useState("");

  const [form, setForm] = useState({
    phaseId: phases[0]?.id ?? "",
    name: "",
    assignee: "",
    plannedStartDate: "",
    plannedEndDate: "",
    deadline: "",
    actualStartDate: "",
    actualEndDate: "",
    progress: "0",
    status: "Chưa bắt đầu" as PhaseStatus,
    risk: "Đúng tiến độ" as RiskLevel,
    hasIssue: "Không" as "Có" | "Không",
    issueReason: "",
    notes: "",
  });

  useEffect(() => {
    setSubmitError("");
    if (milestone) {
      setForm({
        phaseId: milestone.phaseId,
        name: milestone.name,
        assignee: milestone.assignee ?? "",
        plannedStartDate: milestone.plannedStartDate,
        plannedEndDate: milestone.plannedEndDate,
        deadline: milestone.deadline,
        actualStartDate: milestone.actualStartDate ?? "",
        actualEndDate: milestone.actualEndDate ?? "",
        progress: String(milestone.progress),
        status: milestone.status,
        risk: milestone.risk,
        hasIssue: milestone.hasIssue ? "Có" : "Không",
        issueReason: milestone.issueReason ?? "",
        notes: milestone.notes ?? "",
      });
    } else {
      setForm({
        phaseId: phases[0]?.id ?? "",
        name: "",
        assignee: "",
        plannedStartDate: "",
        plannedEndDate: "",
        deadline: "",
        actualStartDate: "",
        actualEndDate: "",
        progress: "0",
        status: "Chưa bắt đầu",
        risk: "Đúng tiến độ",
        hasIssue: "Không",
        issueReason: "",
        notes: "",
      });
    }
  }, [milestone, open, phases]);

  const handleChange = (field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    setSubmitError("");
    if (!form.phaseId) {
      setSubmitError("Vui lòng chọn giai đoạn.");
      return;
    }
    if (!form.name.trim()) {
      setSubmitError("Vui lòng nhập tên mốc tiến độ.");
      return;
    }

    const dueDate = form.deadline || form.plannedEndDate || form.plannedStartDate;
    if (!dueDate) {
      setSubmitError("Vui lòng nhập hạn chót cho mốc tiến độ.");
      return;
    }

    const selectedPhase = phases.find((phase) => phase.id === form.phaseId);
    const numericProjectId = toNumberOrNull(milestone?.researchId ?? selectedPhase?.researchId ?? projectId);
    if (!isEdit && !numericProjectId) {
      setSubmitError("Không xác định được đề tài để tạo mốc tiến độ.");
      return;
    }

    const payload: ProjectMilestonePayload = {
      ...(numericProjectId ? { projectId: numericProjectId } : {}),
      phaseId: toNumberOrNull(form.phaseId),
      milestoneName: form.name.trim(),
      description: null,
      dueDate,
      responsibleUserId: toNumberOrNull(milestone?.responsibleUserId),
      milestoneStatus: toApiPhaseStatus(form.status),
      priorityLevel: toApiPriorityLevel(form.risk),
      completedAt: toOptionalDate(form.actualEndDate),
      notes: form.hasIssue === "Có"
        ? (form.issueReason.trim() || form.notes.trim() || null)
        : (form.notes.trim() || null),
    };

    try {
      setSaving(true);
      await onSubmit?.(payload);
      onClose();
    } catch (error) {
      setSubmitError(getErrorMessage(error));
    } finally {
      setSaving(false);
    }
  };

  return (
    <FormDrawer
      open={open}
      onOpenChange={onClose}
      title={isEdit ? "Chỉnh sửa mốc tiến độ" : "Thêm mốc tiến độ mới"}
      onSave={handleSave}
      saveLabel={isEdit ? "Cập nhật" : "Lưu"}
      isSaving={saving}
    >
      {submitError && (
        <div className="mb-4 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm font-medium text-red-700">
          {submitError}
        </div>
      )}

      <FormDrawerField label="Giai đoạn" required colSpan={2}>
        <Select
          value={form.phaseId}
          onValueChange={(v) => v && handleChange("phaseId", v)}
        >
          <SelectTrigger className="h-9 border-slate-200">
            <SelectValue placeholder="Chọn giai đoạn..." />
          </SelectTrigger>
          <SelectContent>
            {phases.map((p) => (
              <SelectItem key={p.id} value={p.id}>
                {p.order}. {p.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </FormDrawerField>

      <FormDrawerField label="Tên mốc tiến độ" required colSpan={2}>
        <Input
          value={form.name}
          onChange={(e) => handleChange("name", e.target.value)}
          placeholder="Nhập tên mốc tiến độ..."
          className="h-9 border-slate-200"
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
          <Select
            value={form.status}
            onValueChange={(v) => v && handleChange("status", v)}
          >
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
        <FormDrawerField label="Mức độ rủi ro">
          <Select
            value={form.risk}
            onValueChange={(v) => v && handleChange("risk", v)}
          >
            <SelectTrigger className="h-9 border-slate-200">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {RISK_OPTIONS.map((r) => (
                <SelectItem key={r} value={r}>{r}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </FormDrawerField>

        <FormDrawerField label="Có phát sinh">
          <Select
            value={form.hasIssue}
            onValueChange={(v) => v && handleChange("hasIssue", v)}
          >
            <SelectTrigger className="h-9 border-slate-200">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Không">Không</SelectItem>
              <SelectItem value="Có">Có</SelectItem>
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

      {form.hasIssue === "Có" && (
        <FormDrawerField label="Lý do phát sinh" colSpan={2}>
          <Input
            value={form.issueReason}
            onChange={(e) => handleChange("issueReason", e.target.value)}
            placeholder="Mô tả vấn đề phát sinh..."
            className="h-9 border-slate-200"
          />
        </FormDrawerField>
      )}

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
