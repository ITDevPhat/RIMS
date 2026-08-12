"use client";

import { useEffect, useMemo, useState } from "react";
import { AlertCircle, CalendarDays, ClipboardList, FileText, Hospital, Plus, Save, X } from "lucide-react";
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
import { SPONSORS } from "@/lib/constants/research";
import { PrecisionDateInput } from "@/components/common/DateInput";
import type { ApiDepartment } from "@/lib/api/admin-api";
import { projectMemberApi, projectPhaseApi, type ApiProjectPhase } from "@/lib/api/research-api";
import { PersonPicker, type PersonSelection } from "@/components/common/PersonPicker";
import type { DatePrecision, ResearchProject } from "@/lib/types";

export interface DeTaiFormData {
  code: string;
  name: string;
  description: string;
  departmentId: string;
  department: string;
  pi: string;
  piEmail: string;
  registrationDate: string; registrationDatePrecision: DatePrecision;
  proposalReviewDate: string; proposalReviewDatePrecision: DatePrecision;
  acceptanceDate: string; acceptanceDatePrecision: DatePrecision;
  sponsor: string;
  type: string;
  protocolNumber: string;
  protocolVersion: string;
  ethicsStatus: string;
  startDate: string;
  startDatePrecision: DatePrecision;
  endDate: string;
  endDatePrecision: DatePrecision;
  actualProgressDate: string;
  actualProgressDatePrecision: DatePrecision;
  status: string;
  progress: string;
  currentPhase: string;
  notes: string;
  collaborators: Array<{ memberName: string; email: string; departmentNameText: string }>;
}

interface DeTaiFormModalProps {
  open: boolean;
  mode?: "create" | "edit";
  project?: ResearchProject | null;
  departments?: ApiDepartment[];
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
  departmentId: "",
  department: "",
  pi: "",
  piEmail: "",
  registrationDate: "", registrationDatePrecision: "DAY",
  proposalReviewDate: "", proposalReviewDatePrecision: "DAY",
  acceptanceDate: "", acceptanceDatePrecision: "DAY",
  sponsor: "",
  type: "Khác",
  protocolNumber: "",
  protocolVersion: "1.0",
  ethicsStatus: "Không yêu cầu",
  startDate: "",
  startDatePrecision: "DAY",
  endDate: "",
  endDatePrecision: "DAY",
  actualProgressDate: "",
  actualProgressDatePrecision: "DAY",
  status: "Chưa bắt đầu",
  progress: "0",
  currentPhase: "",
  notes: "",
  collaborators: [],
};

function fromProject(project?: ResearchProject | null): DeTaiFormData {
  if (!project) return emptyForm;
  return {
    code: project.code,
    name: project.name,
    description: project.description ?? "",
    departmentId: project.departmentId ? String(project.departmentId) : "",
    department: project.department === "Chưa phân khoa" ? "" : project.department,
    pi: project.pi === "Chưa phân công" ? "" : project.pi,
    piEmail: project.principalInvestigatorEmail ?? "",
    registrationDate: project.registrationDate ?? "", registrationDatePrecision: project.registrationDatePrecision ?? "DAY",
    proposalReviewDate: project.proposalReviewDate ?? "", proposalReviewDatePrecision: project.proposalReviewDatePrecision ?? "DAY",
    acceptanceDate: project.acceptanceDate ?? "", acceptanceDatePrecision: project.acceptanceDatePrecision ?? "DAY",
    sponsor: project.sponsor === "Chưa có" ? "" : project.sponsor,
    type: project.researchType || "Khác",
    protocolNumber: project.protocolNumber ?? "",
    protocolVersion: project.protocolVersion || "1.0",
    ethicsStatus: project.ethicsStatus,
    startDate: project.startDate ?? "",
    startDatePrecision: project.startDatePrecision ?? "DAY",
    endDate: project.plannedEndDate ?? "",
    endDatePrecision: project.plannedEndDatePrecision ?? "DAY",
    actualProgressDate: project.actualEndDate ?? "",
    actualProgressDatePrecision: project.actualEndDatePrecision ?? "DAY",
    status: project.status,
    progress: String(project.progress ?? 0),
    currentPhase: project.currentPhase ?? "Chưa bắt đầu",
    notes: "",
    collaborators: [],
  };
}

function calculateProgress(startDate: string, endDate: string, actualProgressDate: string) {
  if (!startDate || !endDate || !actualProgressDate) return null;
  const start = new Date(`${startDate}T00:00:00`);
  const end = new Date(`${endDate}T00:00:00`);
  const actual = new Date(`${actualProgressDate}T00:00:00`);
  if ([start, end, actual].some((date) => Number.isNaN(date.getTime()))) return null;
  const total = end.getTime() - start.getTime();
  if (total <= 0) return actual >= end ? 100 : 0;
  const elapsed = actual.getTime() - start.getTime();
  return Math.min(100, Math.max(0, Math.round((elapsed / total) * 100)));
}

export default function DeTaiFormModal({ open, mode = "create", project, departments = [], onOpenChange, onSave }: DeTaiFormModalProps) {
  const [formData, setFormData] = useState<DeTaiFormData>(emptyForm);
  const [phaseOptions, setPhaseOptions] = useState<ApiProjectPhase[]>([]);
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

  useEffect(() => {
    if (!open || !project?.id) {
      setPhaseOptions([]);
      return;
    }
    let cancelled = false;
    const loadPhases = async () => {
      try {
        const result = await projectPhaseApi.getPhases({ projectId: project.id, pageSize: 200 });
        if (!cancelled) setPhaseOptions(result.items);
      } catch {
        if (!cancelled) setPhaseOptions([]);
      }
    };
    void loadPhases();
    return () => {
      cancelled = true;
    };
  }, [open, project?.id]);

  useEffect(() => {
    if (!open || !project?.id) return;
    let cancelled = false;
    projectMemberApi.getMembers({ projectId: project.id, pageSize: 100 }).then(result => {
      if (cancelled) return;
      setFormData(current => ({ ...current, collaborators: result.items.map(member => ({
        source: member.userId == null ? "manual" : "internal", userId: member.userId ?? null,
        fullName: member.memberName, email: member.email, departmentId: member.departmentId,
        departmentName: member.departmentName, projectMemberId: member.projectMemberId, rowVersion: member.rowVersion,
      })) }));
    }).catch(() => { if (!cancelled) setSubmitError("Không tải được danh sách cộng sự."); });
    return () => { cancelled = true; };
  }, [open, project?.id]);

  const title = mode === "edit" ? "Cập nhật đề tài nghiên cứu" : "Thêm đề tài nghiên cứu";
  const saveLabel = mode === "edit" ? "Lưu thay đổi" : "Tạo đề tài";

  const completionHint = useMemo(() => {
    const progress = Number(formData.progress || 0);
    if (progress >= 100) return "Đề tài hoàn tất 100%, trạng thái nên là Hoàn thành.";
    if (progress > 0 && formData.status === "Chưa bắt đầu") return "Đã có tiến độ, nên chuyển trạng thái sang Đang thực hiện.";
    return "";
  }, [formData.progress, formData.status]);

const departmentOptions = useMemo(() => {
  const active = departments.filter((item) => item.isActive);

  if (active.length > 0) return active;

  return [];
}, [departments]);

const selectedDepartment = useMemo(
  () =>
    departmentOptions.find(
      (item) =>
        String(item.departmentId) === String(formData.departmentId)
    ),
  [departmentOptions, formData.departmentId]
);

const hasCurrentPhaseOption = phaseOptions.some(
  (phase) => phase.phaseName === formData.currentPhase
);

  useEffect(() => {
    const progress = calculateProgress(formData.startDate, formData.endDate, formData.actualProgressDate);
    if (progress === null) return;
    setFormData((prev) => prev.progress === String(progress) ? prev : ({ ...prev, progress: String(progress) }));
  }, [formData.actualProgressDate, formData.endDate, formData.startDate]);

  const handleChange = (field: keyof DeTaiFormData, value: string) => {
    setFormData((prev) => {
      if (field === "departmentId") {
        const selected = departmentOptions.find((item) => String(item.departmentId) === value);
        return { ...prev, departmentId: value, department: selected?.departmentName ?? "" };
      }
      return { ...prev, [field]: value };
    });
    setErrors((prev) => {
      const next = { ...prev };
      delete next[field];
      return next;
    });
  };

  const handlePrecisionChange = (field: keyof DeTaiFormData, precision: DatePrecision) => {
    setFormData((prev) => ({ ...prev, [field]: precision }));
  };

  const validate = () => {
    const next: Record<string, string> = {};
    const progress = Number(formData.progress);

    if (!formData.code.trim()) next.code = "Vui lòng nhập mã đề tài.";
    if (!/^[A-Za-z0-9._-]+$/.test(formData.code.trim())) next.code = "Mã đề tài chỉ dùng chữ, số, dấu gạch ngang, gạch dưới hoặc dấu chấm.";
    if (!formData.name.trim()) next.name = "Vui lòng nhập tên đề tài.";
    if (formData.name.trim().length < 10) next.name = "Tên đề tài cần tối thiểu 10 ký tự.";
    if (!formData.departmentId && !formData.department) next.department = "Vui lòng chọn khoa/phòng chủ trì.";
    if (!formData.principalInvestigator) next.principalInvestigator = "Vui lòng chọn hoặc thêm chủ nhiệm đề tài.";
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
        <div role="dialog" aria-modal="true" aria-labelledby="research-project-dialog-title" className="flex max-h-[calc(100dvh-2rem)] w-full max-w-7xl flex-col overflow-hidden rounded-lg bg-white shadow-2xl ring-1 ring-slate-200">
          <div className="border-b border-slate-200 bg-white px-6 py-4">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 id="research-project-dialog-title" className="text-lg font-bold text-slate-900">{title}</h2>
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
                    <Input value={formData.code} onChange={(e) => handleChange("code", e.target.value)} placeholder="VD: NC-2026-001" />
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
                <SectionTitle icon={<Hospital className="h-4 w-4" />} title="Đơn vị & nhân sự" />
                <div className="grid gap-4">
                  <Field
                        label="Khoa/phòng chủ trì"
                        required
                        error={errors.department}
                      >
                        <Select
                          value={formData.departmentId || undefined}
                          onValueChange={(value) =>
                            handleChange("departmentId", value ?? "")
                          }
                        >
                          <SelectTrigger>
                            <span className="min-w-0 flex-1 truncate text-left">
                              {selectedDepartment?.departmentName || "Chọn khoa/phòng"}
                            </span>
                          </SelectTrigger>

                          <SelectContent>
                            {departmentOptions.map((item) => (
                              <SelectItem
                                key={item.departmentId}
                                value={String(item.departmentId)}
                              >
                                {item.departmentName}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </Field>
                  <Field label="Chủ nhiệm đề tài" required error={errors.principalInvestigator}>
                    <PersonPicker mode="single" departments={departments} value={formData.principalInvestigator ? [formData.principalInvestigator] : []} onChange={people => setFormData(current => ({ ...current, principalInvestigator: people[0] ?? null }))} />
                  </Field>
                  <Field label="Email chủ nhiệm"><Input type="email" value={formData.piEmail} onChange={(e) => handleChange("piEmail", e.target.value)} placeholder="email@example.com" /></Field>
                  <Field label="Nhà tài trợ/nguồn kinh phí">
                    <Select value={formData.sponsor} onValueChange={(value) => handleChange("sponsor", value ?? "")}>
                      <SelectTrigger><SelectValue placeholder="Chọn nguồn kinh phí" /></SelectTrigger>
                      <SelectContent>{SPONSORS.filter((item) => item !== "Tất cả").map((item) => <SelectItem key={item} value={item}>{item}</SelectItem>)}</SelectContent>
                    </Select>
                  </Field>
                </div>
              </section>
<section className="rounded-lg border border-slate-200 bg-white p-4">
                <SectionTitle icon={<CalendarDays className="h-4 w-4" />} title="Tiến độ" />
                <div className="grid gap-4 sm:grid-cols-2">
                  <PrecisionDateInput label="Ngày đăng ký" value={formData.registrationDate} precision={formData.registrationDatePrecision} onValueChange={(value) => handleChange("registrationDate", value)} onPrecisionChange={(precision) => handlePrecisionChange("registrationDatePrecision", precision)} />
                  <PrecisionDateInput label="Ngày xét đề cương" value={formData.proposalReviewDate} precision={formData.proposalReviewDatePrecision} onValueChange={(value) => handleChange("proposalReviewDate", value)} onPrecisionChange={(precision) => handlePrecisionChange("proposalReviewDatePrecision", precision)} />
                  <PrecisionDateInput label="Ngày nghiệm thu đề tài" value={formData.acceptanceDate} precision={formData.acceptanceDatePrecision} onValueChange={(value) => handleChange("acceptanceDate", value)} onPrecisionChange={(precision) => handlePrecisionChange("acceptanceDatePrecision", precision)} />
                  <PrecisionDateInput
                    label="Ngày bắt đầu"
                    required
                    value={formData.startDate}
                    precision={formData.startDatePrecision}
                    onValueChange={(value) => handleChange("startDate", value)}
                    onPrecisionChange={(precision) => handlePrecisionChange("startDatePrecision", precision)}
                    error={errors.startDate}
                  />
                  <PrecisionDateInput
                    label="Deadline/kết thúc dự kiến"
                    required
                    value={formData.endDate}
                    precision={formData.endDatePrecision}
                    onValueChange={(value) => handleChange("endDate", value)}
                    onPrecisionChange={(precision) => handlePrecisionChange("endDatePrecision", precision)}
                    error={errors.endDate}
                  />
                  <PrecisionDateInput
                    label="Ngày thực tế thực hiện"
                    value={formData.actualProgressDate}
                    precision={formData.actualProgressDatePrecision}
                    onValueChange={(value) => handleChange("actualProgressDate", value)}
                    onPrecisionChange={(precision) => handlePrecisionChange("actualProgressDatePrecision", precision)}
                  />
                  <Field label="Trạng thái đề tài" error={errors.status}>
                    <Select value={formData.status} onValueChange={(value) => handleChange("status", value ?? "")}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>{STATUS_OPTIONS.map((item) => <SelectItem key={item} value={item}>{item}</SelectItem>)}</SelectContent>
                    </Select>
                  </Field>
                  <Field label="Tiến độ (%)" error={errors.progress}>
                    <Input type="number" min={0} max={100} value={formData.progress} readOnly className="bg-slate-50 font-semibold text-slate-700" />
                  </Field>
                  <Field label="Giai đoạn hiện tại" wide>
                    <Select value={formData.currentPhase} onValueChange={(value) => handleChange("currentPhase", value ?? "")}>
                      <SelectTrigger><SelectValue placeholder="Chọn giai đoạn" /></SelectTrigger>
                      <SelectContent>
                        {phaseOptions.length === 0 ? (
                          <SelectItem value="Chưa bắt đầu">Chưa có giai đoạn phù hợp</SelectItem>
                        ) : (
                          <>
                            {formData.currentPhase && !hasCurrentPhaseOption && (
                              <SelectItem value={formData.currentPhase}>{formData.currentPhase}</SelectItem>
                            )}
                            {phaseOptions.map((phase) => (
                              <SelectItem key={phase.phaseId} value={phase.phaseName}>{phase.phaseName}</SelectItem>
                            ))}
                          </>
                        )}
                      </SelectContent>
                    </Select>
                  </Field>
                  <Field label="Ghi chú" wide>
                    <textarea className="min-h-20 w-full rounded-lg border border-input bg-transparent px-3 py-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50" value={formData.notes} onChange={(e) => handleChange("notes", e.target.value)} placeholder="Các vấn đề, rủi ro hoặc ghi chú theo dõi" />
                  </Field>
                </div>
                {completionHint && <p className="mt-3 rounded-md bg-amber-50 px-3 py-2 text-xs font-medium text-amber-700">{completionHint}</p>}
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

              <section className="rounded-lg border border-slate-200 bg-white p-4 lg:col-span-2">
                <SectionTitle icon={<Hospital className="h-4 w-4" />} title="Cộng sự ngoài hệ thống" />
                <div className="space-y-3">{formData.collaborators.map((member, index) => <div key={index} className="grid gap-2 rounded-lg border border-slate-200 p-3 sm:grid-cols-[1fr_1fr_1fr_auto]">
                  <Input aria-label="Họ tên cộng sự" placeholder="Họ tên cộng sự" value={member.memberName} onChange={e => setFormData(prev => ({ ...prev, collaborators: prev.collaborators.map((item, i) => i === index ? { ...item, memberName: e.target.value } : item) }))} />
                  <Input aria-label="Email cộng sự" placeholder="Email (không bắt buộc)" value={member.email} onChange={e => setFormData(prev => ({ ...prev, collaborators: prev.collaborators.map((item, i) => i === index ? { ...item, email: e.target.value } : item) }))} />
                  <Input aria-label="Đơn vị cộng sự" placeholder="Khoa/phòng hoặc đơn vị" value={member.departmentNameText} onChange={e => setFormData(prev => ({ ...prev, collaborators: prev.collaborators.map((item, i) => i === index ? { ...item, departmentNameText: e.target.value } : item) }))} />
                  <Button type="button" variant="outline" aria-label="Xóa cộng sự" onClick={() => setFormData(prev => ({ ...prev, collaborators: prev.collaborators.filter((_, i) => i !== index) }))}><X className="h-4 w-4" /></Button>
                </div>)}</div>
                <Button type="button" variant="outline" className="mt-3 gap-2" onClick={() => setFormData(prev => ({ ...prev, collaborators: [...prev.collaborators, { memberName: "", email: "", departmentNameText: "" }] }))}><Plus className="h-4 w-4" />Thêm cộng sự</Button>
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
