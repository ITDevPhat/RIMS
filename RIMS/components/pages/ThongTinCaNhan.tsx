"use client";

import {
  User,
  Mail,
  Phone,
  Briefcase,
  Building2,
  ShieldCheck,
  CalendarDays,
  CheckCircle2,
  ArrowLeft,
} from "lucide-react";
import { useAuth } from "@/lib/auth-context";

interface ThongTinCaNhanProps {
  onBack: () => void;
}

interface FieldRowProps {
  icon: React.ElementType;
  label: string;
  value: string;
  mono?: boolean;
}

function FieldRow({ icon: Icon, label, value, mono }: FieldRowProps) {
  return (
    <div className="flex items-start gap-4 py-4 border-b border-slate-100 last:border-0">
      <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-slate-100">
        <Icon className="h-4 w-4 text-slate-500" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-[11px] font-medium uppercase tracking-wide text-slate-400">{label}</p>
        <p className={`mt-0.5 text-sm font-medium text-slate-800 ${mono ? "font-mono" : ""}`}>
          {value}
        </p>
      </div>
    </div>
  );
}

export default function ThongTinCaNhan({ onBack }: ThongTinCaNhanProps) {
  const { user } = useAuth();
  if (!user) return null;

  return (
    <div className="flex flex-1 flex-col">
      {/* Page header */}
      <div className="border-b border-slate-200 bg-white px-6 py-4">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 transition"
            aria-label="Quay lại"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
          <div>
            <h1 className="text-base font-bold text-slate-800">Thông tin cá nhân</h1>
            <p className="text-xs text-slate-500">Xem và quản lý thông tin tài khoản của bạn</p>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-auto px-6 py-6">
        <div className="mx-auto max-w-2xl space-y-6">
          {/* Profile hero */}
          <div className="flex items-center gap-5 rounded-2xl border border-slate-200 bg-white px-6 py-5 shadow-sm">
            <div className="flex h-16 w-16 flex-shrink-0 items-center justify-center rounded-full bg-blue-600 text-xl font-bold text-white shadow-md">
              {user.initials}
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-800">{user.hoTen}</h2>
              <p className="text-sm text-slate-500">{user.chucVu}</p>
              <p className="text-xs text-slate-400">{user.khoaPhong}</p>
              <div className="mt-2 flex items-center gap-2">
                <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2.5 py-0.5 text-[11px] font-semibold text-blue-700 border border-blue-200">
                  <ShieldCheck className="h-3 w-3" />
                  {user.vaiTro}
                </span>
                <span className="inline-flex items-center gap-1 rounded-full bg-green-50 px-2.5 py-0.5 text-[11px] font-semibold text-green-700 border border-green-200">
                  <CheckCircle2 className="h-3 w-3" />
                  {user.trangThai}
                </span>
              </div>
            </div>
          </div>

          {/* Detail fields */}
          <div className="rounded-2xl border border-slate-200 bg-white px-6 shadow-sm">
            <p className="pt-4 pb-1 text-[11px] font-semibold uppercase tracking-widest text-slate-400">
              Thông tin cơ bản
            </p>
            <FieldRow icon={User} label="Họ và tên" value={user.hoTen} />
            <FieldRow icon={Mail} label="Email" value={user.email} mono />
            <FieldRow icon={Phone} label="Số điện thoại" value={user.soDienThoai} mono />
            <FieldRow icon={Briefcase} label="Chức vụ" value={user.chucVu} />
            <FieldRow icon={Building2} label="Khoa / Phòng" value={user.khoaPhong} />
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white px-6 shadow-sm">
            <p className="pt-4 pb-1 text-[11px] font-semibold uppercase tracking-widest text-slate-400">
              Tài khoản hệ thống
            </p>
            <FieldRow icon={ShieldCheck} label="Vai trò hệ thống" value={user.vaiTro} />
            <FieldRow icon={CalendarDays} label="Ngày tạo tài khoản" value={user.ngayTao} />
            <FieldRow icon={CheckCircle2} label="Trạng thái tài khoản" value={user.trangThai} />
          </div>
        </div>
      </div>
    </div>
  );
}
