"use client";

import { useEffect, useMemo, useState } from "react";
import { AlertCircle, CalendarDays, ClipboardList, FileText, Hospital, Save } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { DEPARTMENTS, SPONSORS } from "@/lib/mock-data";
import type { ResearchProject } from "@/lib/types";

export interface DeTaiFormData {
  code: string;
  name: string;
  description: string;
  department: string;
  pi: string;
  sponsor: string;
  type: string;
  protocolNumber: string;
  protocolVersion: string;
  ethicsStatus: string;
  startDate: string;
  endDate: string;
  status: string;
  progress: string;
  currentPhase: string;
  notes: string;
}

interface DeTaiFormModalProps {
  open: boolean;
  mode?: "create" | "edit";
  project?: ResearchProject | null;
  onOpenChange: (open: boolean) => void;
  onSave?: (data: DeTaiFormData) => Promise<void> | void;
}

const ETHICS_OPTIONS = ["Không yêu cầu", "Chờ duyệt", "Đã duyệt", "Sắp hết hạn", "Hết hạn"];
const STATUS_OPTIONS = ["Chưa bắt đầu", "Đang thực hiện", "Hoàn thành", "Tạm dừng"];
const RESEARCH_TYPES = ["Nghiên cứu quan sát", "Can thiệp", "Cắt ngang", "Hồi cứu", "Cải tiến chất lượng", "Khác"];

const emptyForm: DeTaiFormData = {
  code: "",
  name: "",
  description: "",
  department: "",
  pi: "",
  sponsor: "",
  type: "Khác",
  protocolNumber: "",
  protocolVersion: "1.0",
  ethicsStatus: "Không yêu cầu",
  startDate: "",
  endDate: "",
  status: "Chưa bắt đầu",
  progress: "0",
  currentPhase: "Chưa bắt đầu",
  notes: "",
};

function fromProject(project?: ResearchProject | null): DeTaiFormData {
  if (!project) return emptyForm;
  return {
    code: project.code,
    name: project.name,
    description: project.description ?? "",
    department: project.department === "Chưa phân khoa" ? "" : project.department,
    pi: project.pi === "Chưa phân công" ? "" : project.pi,
    sponsor: project.sponsor === "Chưa có" ? "" : project.sponsor,
    type: project.researchType || "Khác",
    protocolNumber: project.protocolNumber ?? "",
    protocolVersion: project.protocolVersion || "1.0",
    ethicsStatus: project.ethicsStatus,
    startDate: project.startDate ?? "",
    endDate: project.plannedEndDate ?? "",
    status: project.status,
    progress: String(project.progress ?? 0),
    currentPhase: project.currentPhase ?? "Chưa bắt đầu",
    notes: "",
  };
}

export default function DeTaiFormModal({ open, mode = "create", project, onOpenChange, onSave }: DeTaiFormModalProps) {
  const [formData, setFormData] = useState<DeTaiFormData>(emptyForm);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitError, setSubmitError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      setFormData(fromProject(project));
      setErrors({});
      setSubmitError("");
    }
  }, [open, project]);

  const title = mode === "edit" ? "Cập nhật đề tài nghiên cứu" : "Thêm đề tài nghiên cứu";
  const saveLabel = mode === "edit" ? "Lưu thay đổi" : "Tạo đề tài";

  const completionHint = useMemo(() => {
    const progress = Number(formData.progress || 0);
    if (progress >= 100) return "Đề tài hoàn tất 100%, trạng thái nên là Hoàn thành.";
    if (progress > 0 && formData.status === "Chưa bắt đầu") return "Đã có tiến độ, nên chuyển trạng thái sang Đang thực hiện.";
    return "";
  }, [formData.progress, formData.status]);

  const handleChange = (field: keyof DeTaiFormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => {
      const next = { ...prev };
      delete next[field];
      return next;
    });
  };

  const validate = () => {
    const next: Record<string, string> = {};
    const progress = Number(formData.progress);

    if (!formData.code.trim()) next.code = "Vui lòng nhập mã đề tài.";
    if (!/^[A-Za-z0-9._-]+$/.test(formData.code.trim())) next.code = "Mã đề tài chỉ dùng chữ, số, dấu gạch ngang, gạch dưới hoặc dấu chấm.";
    if (!formData.name.trim()) next.name = "Vui lòng nhập tên đề tài.";
    if (formData.name.trim().length < 10) next.name = "Tên đề tài cần tối thiểu 10 ký tự.";
    if (!formData.department) next.department = "Vui lòng chọn khoa/phòng chủ trì.";
    if (!formData.pi.trim()) next.pi = "Vui lòng nhập chủ nhiệm đề tài.";
    if (!formData.startDate) next.startDate = "Vui lòng chọn ngày bắt đầu.";
    if (!formData.endDate) next.endDate = "Vui lòng chọn ngày kết thúc dự kiến.";
    if (formData.startDate && formData.endDate && formData.startDate > formData.endDate) {
      next.endDate = "Ngày kết thúc dự kiến phải sau hoặc bằng ngày bắt đầu.";
    }
    if (!Number.isFinite(progress) || progress < 0 || progress > 100) {
      next.progress = "Tiến độ phải nằm trong khoảng 0 đến 100.";
    }
    if (progress === 100 && formData.status !== "Hoàn thành") {
      next.status = "Tiến độ 100% cần trạng thái Hoàn thành.";
    }

    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSave = async () => {
    setSubmitError("");
    if (!validate()) return;
    setSaving(true);
    try {
      await onSave?.({
        ...formData,
        code: formData.code.trim(),
        name: formData.name.trim(),
        pi: formData.pi.trim(),
        protocolNumber: formData.protocolNumber.trim(),
        protocolVersion: formData.protocolVersion.trim(),
      });
      onOpenChange(false);
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : "Không lưu được đề tài. Vui lòng thử lại.");
    } finally {
      setSaving(false);
    }
  };

  if (!open) return null;

  return (
    <>
      <div className="fixed inset-0 z-40 bg-slate-950/45" onClick={() => !saving && onOpenChange(false)} />
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="flex h-[92vh] w-full max-w-5xl flex-col overflow-hidden rounded-lg bg-white shadow-2xl ring-1 ring-slate-200">
          <div className="border-b border-slate-200 bg-white px-6 py-4">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-lg font-bold text-slate-900">{title}</h2>
                <p className="mt-1 text-sm text-slate-500">Nhập đầy đủ thông tin chính để theo dõi tiến độ, phê duyệt và báo cáo đề tài.</p>
              </div>
              <Button variant="outline" className="h-9" disabled={saving} onClick={() => onOpenChange(false)}>Đóng</Button>
            </div>
            {submitError && (
              <div className="mt-3 flex items-start gap-2 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm font-medium text-red-700">
                <AlertCircle className="mt-0.5 h-4 w-4" />
                {submitError}
              </div>
            )}
          </div>

          <div className="flex-1 overflow-y-auto bg-slate-50/60 px-6 py-5">
            <div className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
              <section className="rounded-lg border border-slate-200 bg-white p-4">
                <SectionTitle icon={<ClipboardList className="h-4 w-4" />} title="Thông tin đề tài" />
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="Mã đề tài" required error={errors.code}>
                    <Input value={formData.code} onChange={(e) => handleChange("code", e.target.value)} disabled={mode === "edit"} placeholder="VD: NC-2026-001" />
                  </Field>
                  <Field label="Loại nghiên cứu" required>
                    <Select value={formData.type} onValueChange={(value) => handleChange("type", value ?? "")}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>{RESEARCH_TYPES.map((item) => <SelectItem key={item} value={item}>{item}</SelectItem>)}</SelectContent>
                    </Select>
                  </Field>
                  <Field label="Tên đề tài" required error={errors.name} wide>
                    <textarea className="min-h-24 w-full rounded-lg border border-input bg-transparent px-3 py-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50" value={formData.name} onChange={(e) => handleChange("name", e.target.value)} placeholder="Nhập tên đầy đủ của đề tài nghiên cứu" />
                  </Field>
                  <Field label="Mô tả" wide>
                    <textarea className="min-h-24 w-full rounded-lg border border-input bg-transparent px-3 py-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50" value={formData.description} onChange={(e) => handleChange("description", e.target.value)} placeholder="Tóm tắt mục tiêu, đối tượng, phạm vi nghiên cứu" />
                  </Field>
                </div>
              </section>

              <section className="rounded-lg border border-slate-200 bg-white p-4">
                <SectionTitle icon={<Hospital className="h-4 w-4" />} title="Đơn vị phụ trách" />
                <div className="grid gap-4">
                  <Field label="Khoa/phòng chủ trì" required error={errors.department}>
                    <Select value={formData.department} onValueChange={(value) => handleChange("department", value ?? "")}>
                      <SelectTrigger><SelectValue placeholder="Chọn khoa/phòng" /></SelectTrigger>
                      <SelectContent>{DEPARTMENTS.filter((item) => item !== "Tất cả").map((item) => <SelectItem key={item} value={item}>{item}</SelectItem>)}</SelectContent>
                    </Select>
                  </Field>
                  <Field label="Chủ nhiệm đề tài" required error={errors.pi}>
                    <Input value={formData.pi} onChange={(e) => handleChange("pi", e.target.value)} placeholder="VD: TS. Nguyễn Minh Anh" />
                  </Field>
                  <Field label="Nhà tài trợ/nguồn kinh phí">
                    <Select value={formData.sponsor} onValueChange={(value) => handleChange("sponsor", value ?? "")}>
                      <SelectTrigger><SelectValue placeholder="Chọn nguồn kinh phí" /></SelectTrigger>
                      <SelectContent>{SPONSORS.filter((item) => item !== "Tất cả").map((item) => <SelectItem key={item} value={item}>{item}</SelectItem>)}</SelectContent>
                    </Select>
                  </Field>
                </div>
              </section>

              <section className="rounded-lg border border-slate-200 bg-white p-4">
                <SectionTitle icon={<FileText className="h-4 w-4" />} title="Đề cương và đạo đức" />
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="Mã đề cương">
                    <Input value={formData.protocolNumber} onChange={(e) => handleChange("protocolNumber", e.target.value)} placeholder="VD: BV-THA-2026-01" />
                  </Field>
                  <Field label="Phiên bản đề cương">
                    <Input value={formData.protocolVersion} onChange={(e) => handleChange("protocolVersion", e.target.value)} placeholder="VD: 1.0" />
                  </Field>
                  <Field label="Trạng thái phê duyệt đạo đức" wide>
                    <Select value={formData.ethicsStatus} onValueChange={(value) => handleChange("ethicsStatus", value ?? "")}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>{ETHICS_OPTIONS.map((item) => <SelectItem key={item} value={item}>{item}</SelectItem>)}</SelectContent>
                    </Select>
                  </Field>
                </div>
              </section>

              <section className="rounded-lg border border-slate-200 bg-white p-4">
                <SectionTitle icon={<CalendarDays className="h-4 w-4" />} title="Tiến độ" />
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="Ngày bắt đầu" required error={errors.startDate}>
                    <Input type="date" value={formData.startDate} onChange={(e) => handleChange("startDate", e.target.value)} />
                  </Field>
                  <Field label="Ngày kết thúc dự kiến" required error={errors.endDate}>
                    <Input type="date" value={formData.endDate} onChange={(e) => handleChange("endDate", e.target.value)} />
                  </Field>
                  <Field label="Trạng thái đề tài" error={errors.status}>
                    <Select value={formData.status} onValueChange={(value) => handleChange("status", value ?? "")}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>{STATUS_OPTIONS.map((item) => <SelectItem key={item} value={item}>{item}</SelectItem>)}</SelectContent>
                    </Select>
                  </Field>
                  <Field label="Tiến độ (%)" error={errors.progress}>
                    <Input type="number" min={0} max={100} value={formData.progress} onChange={(e) => handleChange("progress", e.target.value)} />
                  </Field>
                  <Field label="Giai đoạn hiện tại" wide>
                    <Input value={formData.currentPhase} onChange={(e) => handleChange("currentPhase", e.target.value)} placeholder="VD: Thu thập số liệu" />
                  </Field>
                  <Field label="Ghi chú" wide>
                    <textarea className="min-h-20 w-full rounded-lg border border-input bg-transparent px-3 py-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50" value={formData.notes} onChange={(e) => handleChange("notes", e.target.value)} placeholder="Các vấn đề, rủi ro hoặc ghi chú theo dõi" />
                  </Field>
                </div>
                {completionHint && <p className="mt-3 rounded-md bg-amber-50 px-3 py-2 text-xs font-medium text-amber-700">{completionHint}</p>}
              </section>
            </div>
          </div>

          <div className="flex items-center justify-between gap-3 border-t border-slate-200 bg-white px-6 py-4">
            <p className="text-xs text-slate-500">Các trường có dấu * là bắt buộc. Dữ liệu sẽ được kiểm tra trước khi lưu.</p>
            <div className="flex gap-2">
              <Button variant="outline" disabled={saving} onClick={() => onOpenChange(false)}>Hủy</Button>
              <Button className="gap-2" disabled={saving} onClick={() => void handleSave()}>
                <Save className="h-4 w-4" />
                {saving ? "Đang lưu..." : saveLabel}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

function SectionTitle({ icon, title }: { icon: React.ReactNode; title: string }) {
  return (
    <div className="mb-4 flex items-center gap-2 border-b border-slate-100 pb-3 text-sm font-bold text-slate-800">
      <span className="flex h-7 w-7 items-center justify-center rounded-md bg-blue-50 text-blue-700">{icon}</span>
      {title}
    </div>
  );
}

function Field({ label, required, error, wide, children }: { label: string; required?: boolean; error?: string; wide?: boolean; children: React.ReactNode }) {
  return (
    <label className={cn("block", wide && "sm:col-span-2")}>
      <span className="mb-1.5 block text-xs font-semibold text-slate-700">
        {label}{required && <span className="ml-1 text-red-500">*</span>}
      </span>
      {children}
      {error && <span className="mt-1 block text-xs font-medium text-red-600">{error}</span>}
    </label>
  );
}
