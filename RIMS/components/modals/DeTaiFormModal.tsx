"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DEPARTMENTS, SPONSORS } from "@/lib/mock-data";
import {
  FormDrawer,
  FormDrawerField,
  FormDrawerSection,
} from "@/components/common/FormDrawer";

interface DeTaiFormModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave?: (data: any) => void;
}

const ETHICS_OPTIONS = ["Không yêu cầu", "Chờ duyệt", "Đã duyệt", "Sắp hết hạn", "Hết hạn"];
const STATUS_OPTIONS = ["Đang thực hiện", "Hoàn thành", "Tạm dừng", "Chưa bắt đầu"];

export default function DeTaiFormModal({ open, onOpenChange, onSave }: DeTaiFormModalProps) {
  const [formData, setFormData] = useState({
    code: "",
    name: "",
    description: "",
    department: "",
    pi: "",
    sponsor: "",
    type: "Khác",
    protocolNumber: "",
    protocolVersion: "",
    ethicsStatus: "Không yêu cầu",
    startDate: "",
    endDate: "",
    status: "Đang thực hiện",
    notes: "",
  });

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSave = () => {
    onSave?.(formData);
    setFormData({
      code: "",
      name: "",
      description: "",
      department: "",
      pi: "",
      sponsor: "",
      type: "Khác",
      protocolNumber: "",
      protocolVersion: "",
      ethicsStatus: "Không yêu cầu",
      startDate: "",
      endDate: "",
      status: "Đang thực hiện",
      notes: "",
    });
    onOpenChange(false);
  };

  return (
    <FormDrawer
      open={open}
      onOpenChange={onOpenChange}
      title="Thêm đề tài nghiên cứu"
      onSave={handleSave}
      saveLabel="Lưu đề tài"
    >
      <FormDrawerSection>
        <FormDrawerField label="Mã đề tài" required>
          <Input
            placeholder="VD: DT-2024-001"
            value={formData.code}
            onChange={(e) => handleChange("code", e.target.value)}
            className="h-9 border-slate-200"
          />
        </FormDrawerField>

        <FormDrawerField label="Loại nghiên cứu" required>
          <Select value={formData.type} onValueChange={(v) => v && handleChange("type", v)}>
            <SelectTrigger className="h-9 border-slate-200">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Cơ bản">Cơ bản</SelectItem>
              <SelectItem value="Ứng dụng">Ứng dụng</SelectItem>
              <SelectItem value="Phát triển">Phát triển</SelectItem>
              <SelectItem value="Khác">Khác</SelectItem>
            </SelectContent>
          </Select>
        </FormDrawerField>
      </FormDrawerSection>

      <FormDrawerField label="Tên đề tài" required colSpan={2}>
        <Input
          placeholder="Nhập tên đề tài..."
          value={formData.name}
          onChange={(e) => handleChange("name", e.target.value)}
          className="h-9 border-slate-200"
        />
      </FormDrawerField>

      <FormDrawerField label="Mô tả" colSpan={2}>
        <textarea
          placeholder="Mô tả chi tiết về đề tài..."
          value={formData.description}
          onChange={(e) => handleChange("description", e.target.value)}
          className="h-20 w-full rounded-md border border-slate-200 px-3 py-2 text-sm text-slate-700 placeholder:text-slate-400 focus:border-blue-400 focus:ring-2 focus:ring-blue-100 resize-none"
        />
      </FormDrawerField>

      <FormDrawerSection>
        <FormDrawerField label="Khoa/phòng chủ trì" required>
          <Select value={formData.department} onValueChange={(v) => v && handleChange("department", v)}>
            <SelectTrigger className="h-9 border-slate-200">
              <SelectValue placeholder="Chọn khoa/phòng" />
            </SelectTrigger>
            <SelectContent>
              {DEPARTMENTS.map((d) => (
                <SelectItem key={d} value={d}>{d}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </FormDrawerField>

        <FormDrawerField label="Chủ nhiệm đề tài" required>
          <Input
            placeholder="Nhập tên chủ nhiệm..."
            value={formData.pi}
            onChange={(e) => handleChange("pi", e.target.value)}
            className="h-9 border-slate-200"
          />
        </FormDrawerField>
      </FormDrawerSection>

      <FormDrawerSection>
        <FormDrawerField label="Nhà tài trợ">
          <Select value={formData.sponsor} onValueChange={(v) => v && handleChange("sponsor", v)}>
            <SelectTrigger className="h-9 border-slate-200">
              <SelectValue placeholder="Chọn nhà tài trợ" />
            </SelectTrigger>
            <SelectContent>
              {SPONSORS.map((s) => (
                <SelectItem key={s} value={s}>{s}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </FormDrawerField>

        <FormDrawerField label="Mã đề cương">
          <Input
            placeholder="VD: PR-2024-001"
            value={formData.protocolNumber}
            onChange={(e) => handleChange("protocolNumber", e.target.value)}
            className="h-9 border-slate-200"
          />
        </FormDrawerField>
      </FormDrawerSection>

      <FormDrawerSection>
        <FormDrawerField label="Phiên bản đề cương">
          <Input
            placeholder="VD: v1.0"
            value={formData.protocolVersion}
            onChange={(e) => handleChange("protocolVersion", e.target.value)}
            className="h-9 border-slate-200"
          />
        </FormDrawerField>

        <FormDrawerField label="Trạng thái phê duyệt đạo đức">
          <Select value={formData.ethicsStatus} onValueChange={(v) => v && handleChange("ethicsStatus", v)}>
            <SelectTrigger className="h-9 border-slate-200">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {ETHICS_OPTIONS.map((e) => (
                <SelectItem key={e} value={e}>{e}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </FormDrawerField>
      </FormDrawerSection>

      <FormDrawerSection>
        <FormDrawerField label="Ngày bắt đầu">
          <Input
            type="date"
            value={formData.startDate}
            onChange={(e) => handleChange("startDate", e.target.value)}
            className="h-9 border-slate-200"
          />
        </FormDrawerField>

        <FormDrawerField label="Ngày kết thúc dự kiến">
          <Input
            type="date"
            value={formData.endDate}
            onChange={(e) => handleChange("endDate", e.target.value)}
            className="h-9 border-slate-200"
          />
        </FormDrawerField>
      </FormDrawerSection>

      <FormDrawerField label="Trạng thái đề tài" colSpan={2}>
        <Select value={formData.status} onValueChange={(v) => v && handleChange("status", v)}>
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

      <FormDrawerField label="Ghi chú" colSpan={2}>
        <textarea
          placeholder="Ghi chú thêm..."
          value={formData.notes}
          onChange={(e) => handleChange("notes", e.target.value)}
          className="h-16 w-full rounded-md border border-slate-200 px-3 py-2 text-sm text-slate-700 placeholder:text-slate-400 focus:border-blue-400 focus:ring-2 focus:ring-blue-100 resize-none"
        />
      </FormDrawerField>
    </FormDrawer>
  );
}
