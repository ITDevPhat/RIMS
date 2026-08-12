"use client";

import { useEffect, useState } from "react";
import { authApi } from "@/lib/api/auth-api";
import { useAuth } from "@/lib/auth-context";
import { toast } from "@/lib/toast";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";

interface ProfileDialogProps { open: boolean; onOpenChange: (open: boolean) => void }

export function ProfileDialog({ open, onOpenChange }: ProfileDialogProps) {
  const { updateProfile } = useAuth();
  const [profile, setProfile] = useState<Awaited<ReturnType<typeof authApi.getMe>> | null>(null);
  const [form, setForm] = useState({ fullName: "", phoneNumber: "", avatarUrl: "" });
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open) return;
    let active = true;
    setLoading(true); setError("");
    authApi.getMe().then((result) => {
      if (!active) return;
      setProfile(result);
      setForm({ fullName: result.fullName, phoneNumber: result.phoneNumber ?? "", avatarUrl: result.avatarUrl ?? "" });
    }).catch(() => { if (active) { setError("Không tải được thông tin cá nhân."); toast.error("Không tải được thông tin cá nhân."); } })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [open]);

  const save = async () => {
    if (saving || !form.fullName.trim()) return;
    setSaving(true); setError("");
    try {
      const updated = await authApi.updateMe({ fullName: form.fullName.trim(), phoneNumber: form.phoneNumber || null, avatarUrl: form.avatarUrl || null });
      setProfile(updated); updateProfile(updated);
      toast.success("Thông tin cá nhân đã được cập nhật.");
      onOpenChange(false);
    } catch { setError("Không thể cập nhật thông tin cá nhân."); toast.error("Không thể cập nhật thông tin cá nhân."); }
    finally { setSaving(false); }
  };

  return <Dialog open={open} onOpenChange={onOpenChange}>
    <DialogContent className="max-h-[calc(100vh-2rem)] w-[calc(100vw-2rem)] overflow-y-auto dark:border-slate-800 dark:bg-slate-950 sm:max-w-lg">
      <DialogHeader><DialogTitle>Thông tin cá nhân</DialogTitle></DialogHeader>
      {loading ? <p className="py-8 text-center text-sm text-slate-500 dark:text-slate-400">Đang tải thông tin...</p> : error && !profile ? <p className="py-6 text-center text-sm text-red-600 dark:text-red-400">{error}</p> : profile && <div className="space-y-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Thông tin có thể chỉnh sửa</p>
        <Field label="Họ và tên"><Input value={form.fullName} maxLength={200} onChange={(e) => setForm(v => ({ ...v, fullName: e.target.value }))} /></Field>
        <Field label="Số điện thoại"><Input value={form.phoneNumber} maxLength={30} onChange={(e) => setForm(v => ({ ...v, phoneNumber: e.target.value }))} /></Field>
        <Field label="Đường dẫn ảnh đại diện"><Input value={form.avatarUrl} maxLength={500} onChange={(e) => setForm(v => ({ ...v, avatarUrl: e.target.value }))} /></Field>
        <div className="border-t border-slate-200 pt-4 dark:border-slate-800">
          <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Thông tin hệ thống</p>
          <div className="grid gap-3 sm:grid-cols-2">
            <ReadOnly label="Email" value={profile.email} /><ReadOnly label="Chức vụ" value={profile.title} />
            <ReadOnly label="Khoa/phòng" value={profile.departmentName} /><ReadOnly label="Vai trò" value={profile.roles.map(r => r.roleName).join(", ")} />
          </div>
        </div>
        {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}
      </div>}
      <DialogFooter><Button variant="outline" disabled={saving} onClick={() => onOpenChange(false)}>Hủy</Button><Button disabled={loading || saving || !profile || !form.fullName.trim()} onClick={() => void save()}>{saving ? "Đang lưu..." : "Lưu thay đổi"}</Button></DialogFooter>
    </DialogContent>
  </Dialog>;
}

function Field({ label, children }: { label: string; children: React.ReactNode }) { return <label className="block space-y-1.5 text-sm font-medium text-slate-700 dark:text-slate-200"><span>{label}</span>{children}</label>; }
function ReadOnly({ label, value }: { label: string; value?: string | null }) { return <div className="rounded-lg bg-slate-100 px-3 py-2 dark:bg-slate-900"><p className="text-[11px] text-slate-500 dark:text-slate-400">{label}</p><p className="truncate text-sm text-slate-800 dark:text-slate-100">{value || "Chưa cập nhật"}</p></div>; }
