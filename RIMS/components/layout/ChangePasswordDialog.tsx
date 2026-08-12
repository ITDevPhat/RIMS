"use client";

import { useState } from "react";
import { authApi } from "@/lib/api/auth-api";
import { toast } from "@/lib/toast";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";

const strongPassword = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z\d]).{8,}$/;
const ruleMessage = "Mật khẩu phải có ít nhất 8 ký tự, gồm chữ hoa, chữ thường, số và ký tự đặc biệt.";

export function ChangePasswordDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const [form, setForm] = useState({ current: "", next: "", confirm: "" });
  const [error, setError] = useState("");
  const [passwordSaving, setPasswordSaving] = useState(false);
  const reset = () => { setForm({ current: "", next: "", confirm: "" }); setError(""); };
  const submit = async () => {
    if (passwordSaving) return;
    if (!strongPassword.test(form.next)) { setError(ruleMessage); toast.warning(ruleMessage); return; }
    if (form.next !== form.confirm) { setError("Xác nhận mật khẩu mới không khớp."); return; }
    setPasswordSaving(true); setError("");
    try { await authApi.changePassword({ currentPassword: form.current, newPassword: form.next, confirmPassword: form.confirm }); reset(); toast.success("Mật khẩu đã được cập nhật."); onOpenChange(false); }
    catch { setError("Không thể cập nhật mật khẩu. Vui lòng kiểm tra mật khẩu hiện tại."); toast.error("Không thể cập nhật mật khẩu. Vui lòng kiểm tra mật khẩu hiện tại."); }
    finally { setPasswordSaving(false); }
  };
  return <Dialog open={open} onOpenChange={(value) => { if (!passwordSaving) { onOpenChange(value); if (!value) reset(); } }}>
    <DialogContent className="w-[calc(100vw-2rem)] dark:border-slate-800 dark:bg-slate-950 sm:max-w-md"><DialogHeader><DialogTitle>Đổi mật khẩu</DialogTitle></DialogHeader>
      <div className="space-y-3">
        <PasswordField label="Mật khẩu hiện tại" value={form.current} onChange={value => setForm(v => ({ ...v, current: value }))} />
        <PasswordField label="Mật khẩu mới" value={form.next} onChange={value => setForm(v => ({ ...v, next: value }))} />
        <PasswordField label="Xác nhận mật khẩu mới" value={form.confirm} onChange={value => setForm(v => ({ ...v, confirm: value }))} />
        <p className="text-xs text-slate-500 dark:text-slate-400">{ruleMessage}</p>{error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}
      </div>
      <DialogFooter><Button variant="outline" disabled={passwordSaving} onClick={() => onOpenChange(false)}>Hủy</Button><Button disabled={passwordSaving || !form.current || !form.next || !form.confirm} onClick={() => void submit()}>{passwordSaving ? "Đang cập nhật..." : "Cập nhật mật khẩu"}</Button></DialogFooter>
    </DialogContent>
  </Dialog>;
}
function PasswordField({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) { return <label className="block space-y-1.5 text-sm font-medium text-slate-700 dark:text-slate-200"><span>{label}</span><Input type="password" autoComplete="new-password" value={value} onChange={e => onChange(e.target.value)} /></label>; }
