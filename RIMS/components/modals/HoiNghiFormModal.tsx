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
import {
  LOAI_HOAT_DONG_OPTIONS,
  LOAI_KE_HOACH_OPTIONS,
  TRANG_THAI_OPTIONS,
  KHOA_PHONG_OPTIONS,
  NGUOI_PHU_TRACH_OPTIONS,
  type HoiNghi,
  type LoaiHoatDong,
  type LoaiKeHoach,
  type TrangThaiHoiNghi,
} from "@/lib/mock-dao-tao";

interface HoiNghiFormModalProps {
  open: boolean;
  onClose: () => void;
  onSave: (data: Partial<HoiNghi>) => void;
  initialData?: HoiNghi | null;
  selectedYear: number;
}

type FormState = {
  ma: string;
  ten: string;
  moTa: string;
  nam: number;
  thang: number;
  ngayDuKien: string;
  ngayThucTe: string;
  loai: LoaiHoatDong;
  loaiKeHoach: LoaiKeHoach;
  khoaPhong: string;
  nguoiPhuTrach: string;
  diaDiem: string;
  soNguoiDuKien: number;
  soNguoiThucTe: number;
  trangThai: TrangThaiHoiNghi;
  lyDoKhongThucHien: string;
  ghiChu: string;
};

const defaultForm = (year: number): FormState => ({
  ma: "",
  ten: "",
  moTa: "",
  nam: year,
  thang: 1,
  ngayDuKien: "",
  ngayThucTe: "",
  loai: "Hội nghị",
  loaiKeHoach: "Dự kiến",
  khoaPhong: KHOA_PHONG_OPTIONS[0],
  nguoiPhuTrach: NGUOI_PHU_TRACH_OPTIONS[0],
  diaDiem: "",
  soNguoiDuKien: 50,
  soNguoiThucTe: 0,
  trangThai: "Dự kiến",
  lyDoKhongThucHien: "",
  ghiChu: "",
});

export default function HoiNghiFormModal({
  open,
  onClose,
  onSave,
  initialData,
  selectedYear,
}: HoiNghiFormModalProps) {
  const [form, setForm] = useState<FormState>(defaultForm(selectedYear));

  useEffect(() => {
    if (initialData) {
      setForm({
        ma: initialData.ma,
        ten: initialData.ten,
        moTa: initialData.moTa,
        nam: initialData.nam,
        thang: initialData.thang,
        ngayDuKien: initialData.ngayDuKien,
        ngayThucTe: initialData.ngayThucTe ?? "",
        loai: initialData.loai,
        loaiKeHoach: initialData.loaiKeHoach,
        khoaPhong: initialData.khoaPhong,
        nguoiPhuTrach: initialData.nguoiPhuTrach,
        diaDiem: initialData.diaDiem,
        soNguoiDuKien: initialData.soNguoiDuKien,
        soNguoiThucTe: initialData.soNguoiThucTe ?? 0,
        trangThai: initialData.trangThai,
        lyDoKhongThucHien: initialData.lyDoKhongThucHien ?? "",
        ghiChu: initialData.ghiChu,
      });
    } else {
      setForm(defaultForm(selectedYear));
    }
  }, [initialData, selectedYear, open]);

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const needsLyDo =
    form.trangThai === "Không thực hiện được" || form.trangThai === "Hủy";
  const needsThucTe = form.trangThai === "Đã thực hiện";

  const handleSave = () => {
    if (!form.ten.trim() || !form.ngayDuKien) return;
    onSave({
      ...form,
      ngayThucTe: needsThucTe && form.ngayThucTe ? form.ngayThucTe : null,
      soNguoiThucTe: needsThucTe ? form.soNguoiThucTe : null,
      lyDoKhongThucHien: needsLyDo && form.lyDoKhongThucHien ? form.lyDoKhongThucHien : null,
    });
    onClose();
  };

  return (
    <FormDrawer
      open={open}
      onOpenChange={(o) => !o && onClose()}
      title={initialData ? "Chỉnh sửa hội nghị" : "Thêm hội nghị mới"}
      onSave={handleSave}
      saveLabel={initialData ? "Lưu thay đổi" : "Thêm hội nghị"}
    >
      <FormDrawerSection>
        <FormDrawerField label="Mã hội nghị" required>
          <Input
            value={form.ma}
            onChange={(e) => set("ma", e.target.value)}
            placeholder="HN-2026-001"
            className="h-9 border-slate-200"
          />
        </FormDrawerField>

        <FormDrawerField label="Năm">
          <Select value={String(form.nam)} onValueChange={(v) => v && set("nam", Number(v))}>
            <SelectTrigger className="h-9 border-slate-200">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {[2024, 2025, 2026, 2027].map((y) => (
                <SelectItem key={y} value={String(y)}>{y}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </FormDrawerField>
      </FormDrawerSection>

      <FormDrawerField label="Tên hội nghị" required colSpan={2}>
        <Input
          value={form.ten}
          onChange={(e) => set("ten", e.target.value)}
          placeholder="Nhập tên hội nghị..."
          className="h-9 border-slate-200"
        />
      </FormDrawerField>

      <FormDrawerField label="Mô tả" colSpan={2}>
        <textarea
          value={form.moTa}
          onChange={(e) => set("moTa", e.target.value)}
          placeholder="Mô tả ngắn gọn..."
          className="h-20 w-full rounded-md border border-slate-200 px-3 py-2 text-sm text-slate-700 placeholder:text-slate-400 focus:border-blue-400 focus:ring-2 focus:ring-blue-100 resize-none"
        />
      </FormDrawerField>

      <FormDrawerSection>
        <FormDrawerField label="Loại hoạt động" required>
          <Select value={form.loai} onValueChange={(v) => v && set("loai", v as LoaiHoatDong)}>
            <SelectTrigger className="h-9 border-slate-200">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {LOAI_HOAT_DONG_OPTIONS.map((o) => (
                <SelectItem key={o} value={o}>{o}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </FormDrawerField>

        <FormDrawerField label="Loại kế hoạch">
          <Select value={form.loaiKeHoach} onValueChange={(v) => v && set("loaiKeHoach", v as LoaiKeHoach)}>
            <SelectTrigger className="h-9 border-slate-200">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {LOAI_KE_HOACH_OPTIONS.map((o) => (
                <SelectItem key={o} value={o}>{o}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </FormDrawerField>
      </FormDrawerSection>

      <FormDrawerSection>
        <FormDrawerField label="Ngày dự kiến" required>
          <Input
            type="date"
            value={form.ngayDuKien}
            onChange={(e) => set("ngayDuKien", e.target.value)}
            className="h-9 border-slate-200"
          />
        </FormDrawerField>

        {needsThucTe && (
          <FormDrawerField label="Ngày thực tế">
            <Input
              type="date"
              value={form.ngayThucTe}
              onChange={(e) => set("ngayThucTe", e.target.value)}
              className="h-9 border-slate-200"
            />
          </FormDrawerField>
        )}
      </FormDrawerSection>

      <FormDrawerSection>
        <FormDrawerField label="Tháng">
          <Select value={String(form.thang)} onValueChange={(v) => v && set("thang", Number(v))}>
            <SelectTrigger className="h-9 border-slate-200">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                <SelectItem key={m} value={String(m)}>Tháng {m}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </FormDrawerField>

        <FormDrawerField label="Khoa/phòng phụ trách" required>
          <Select value={form.khoaPhong} onValueChange={(v) => v && set("khoaPhong", v)}>
            <SelectTrigger className="h-9 border-slate-200">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {KHOA_PHONG_OPTIONS.map((o) => (
                <SelectItem key={o} value={o}>{o}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </FormDrawerField>
      </FormDrawerSection>

      <FormDrawerSection>
        <FormDrawerField label="Người phụ trách" required>
          <Select value={form.nguoiPhuTrach} onValueChange={(v) => v && set("nguoiPhuTrach", v)}>
            <SelectTrigger className="h-9 border-slate-200">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {NGUOI_PHU_TRACH_OPTIONS.map((o) => (
                <SelectItem key={o} value={o}>{o}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </FormDrawerField>

        <FormDrawerField label="Địa điểm">
          <Input
            value={form.diaDiem}
            onChange={(e) => set("diaDiem", e.target.value)}
            placeholder="Hội trường A – Tầng 3"
            className="h-9 border-slate-200"
          />
        </FormDrawerField>
      </FormDrawerSection>

      <FormDrawerSection>
        <FormDrawerField label="Trạng thái" required>
          <Select value={form.trangThai} onValueChange={(v) => v && set("trangThai", v as TrangThaiHoiNghi)}>
            <SelectTrigger className="h-9 border-slate-200">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {TRANG_THAI_OPTIONS.map((o) => (
                <SelectItem key={o} value={o}>{o}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </FormDrawerField>

        <FormDrawerField label="Số người dự kiến">
          <Input
            type="number"
            min={1}
            value={form.soNguoiDuKien}
            onChange={(e) => set("soNguoiDuKien", Number(e.target.value))}
            className="h-9 border-slate-200"
          />
        </FormDrawerField>
      </FormDrawerSection>

      {needsThucTe && (
        <FormDrawerSection>
          <FormDrawerField label="Số người thực tế">
            <Input
              type="number"
              min={0}
              value={form.soNguoiThucTe}
              onChange={(e) => set("soNguoiThucTe", Number(e.target.value))}
              className="h-9 border-slate-200"
            />
          </FormDrawerField>
        </FormDrawerSection>
      )}

      {needsLyDo && (
        <FormDrawerField label="Lý do không thực hiện được" required colSpan={2}>
          <textarea
            value={form.lyDoKhongThucHien}
            onChange={(e) => set("lyDoKhongThucHien", e.target.value)}
            placeholder="Nhập lý do..."
            className="h-16 w-full rounded-md border border-red-300 bg-red-50 px-3 py-2 text-sm placeholder:text-slate-400 focus:border-red-400 focus:ring-2 focus:ring-red-100 resize-none"
          />
        </FormDrawerField>
      )}

      <FormDrawerField label="Ghi chú" colSpan={2}>
        <textarea
          value={form.ghiChu}
          onChange={(e) => set("ghiChu", e.target.value)}
          placeholder="Ghi chú thêm..."
          className="h-16 w-full rounded-md border border-slate-200 px-3 py-2 text-sm text-slate-700 placeholder:text-slate-400 focus:border-blue-400 focus:ring-2 focus:ring-blue-100 resize-none"
        />
      </FormDrawerField>
    </FormDrawer>
  );
}
