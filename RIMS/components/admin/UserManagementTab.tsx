"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Edit2, Lock, Plus, RotateCcw, Search, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { adminApi, type ApiAdminRole, type ApiAdminUser } from "@/lib/api/admin-api";
import { cn } from "@/lib/utils";
import { toast } from "@/lib/toast";

type UserForm = {
  username: string;
  email: string;
  password: string;
  fullName: string;
  initials: string;
  phoneNumber: string;
  title: string;
  accountStatus: string;
  isSystemAdmin: boolean;
  mustChangePassword: boolean;
  roleIds: number[];
};

const emptyForm: UserForm = {
  username: "",
  email: "",
  password: "Rms@123456",
  fullName: "",
  initials: "",
  phoneNumber: "",
  title: "",
  accountStatus: "active",
  isSystemAdmin: false,
  mustChangePassword: true,
  roleIds: [],
};

function toForm(user?: ApiAdminUser | null): UserForm {
  if (!user) return emptyForm;
  return {
    username: user.username,
    email: user.email,
    password: "",
    fullName: user.fullName,
    initials: user.initials ?? "",
    phoneNumber: user.phoneNumber ?? "",
    title: user.title ?? "",
    accountStatus: user.accountStatus,
    isSystemAdmin: user.isSystemAdmin,
    mustChangePassword: user.mustChangePassword,
    roleIds: user.roles.map((role) => role.roleId),
  };
}

export default function UserManagementTab() {
  const [users, setUsers] = useState<ApiAdminUser[]>([]);
  const [roles, setRoles] = useState<ApiAdminRole[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionError, setActionError] = useState("");
  const [pendingUserId, setPendingUserId] = useState<number | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<ApiAdminUser | null>(null);
  const [form, setForm] = useState<UserForm>(emptyForm);
  const [formError, setFormError] = useState("");
  const [saving, setSaving] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [userResult, roleResult] = await Promise.all([
        adminApi.getUsers({ pageSize: 100, search: searchQuery || undefined }),
        adminApi.getRoles({ pageSize: 100 }),
      ]);
      setUsers(userResult.items);
      setRoles(roleResult.items);
    } catch {
      setError("Không tải được dữ liệu người dùng.");
      toast.error("Không tải được dữ liệu người dùng.");
      setUsers([]);
      setRoles([]);
    } finally {
      setLoading(false);
    }
  }, [searchQuery]);

  useEffect(() => {
    const timer = window.setTimeout(() => void loadData(), 250);
    return () => window.clearTimeout(timer);
  }, [loadData]);

  const filteredUsers = useMemo(() => {
    const q = searchQuery.toLowerCase();
    return users.filter((user) => !q || user.fullName.toLowerCase().includes(q) || user.email.toLowerCase().includes(q) || user.username.toLowerCase().includes(q));
  }, [searchQuery, users]);

  const openCreate = () => {
    setEditingUser(null);
    setForm(emptyForm);
    setFormError("");
    setModalOpen(true);
  };

  const openEdit = (user: ApiAdminUser) => {
    setEditingUser(user);
    setForm(toForm(user));
    setFormError("");
    setModalOpen(true);
  };

  const updateForm = <K extends keyof UserForm>(key: K, value: UserForm[K]) => {
    setForm((current) => ({ ...current, [key]: value }));
    setFormError("");
  };

  const toggleRole = (roleId: number, checked: boolean) => {
    setForm((current) => ({
      ...current,
      roleIds: checked ? Array.from(new Set([...current.roleIds, roleId])) : current.roleIds.filter((id) => id !== roleId),
    }));
  };

  const validate = () => {
    if (!form.username.trim() && !editingUser) return "Vui lòng nhập tên đăng nhập.";
    if (!form.email.trim()) return "Vui lòng nhập email.";
    if (!form.fullName.trim()) return "Vui lòng nhập họ tên.";
    if (!editingUser && form.password.length < 8) return "Mật khẩu cần tối thiểu 8 ký tự.";
    return "";
  };

  const handleSave = async () => {
    const validation = validate();
    if (validation) {
      setFormError(validation);
      toast.warning(validation);
      return;
    }
    setSaving(true);
    setFormError("");
    try {
      if (editingUser) {
        await adminApi.updateUser(editingUser.userId, {
          email: form.email.trim(),
          fullName: form.fullName.trim(),
          initials: form.initials.trim() || null,
          phoneNumber: form.phoneNumber.trim() || null,
          avatarUrl: null,
          title: form.title.trim() || null,
          departmentId: null,
          accountStatus: form.accountStatus,
          isSystemAdmin: form.isSystemAdmin,
          mustChangePassword: form.mustChangePassword,
          roleIds: form.roleIds,
        });
        toast.success({ title: "Đã cập nhật người dùng", description: form.fullName });
      } else {
        await adminApi.createUser({
          username: form.username.trim(),
          email: form.email.trim(),
          password: form.password,
          fullName: form.fullName.trim(),
          initials: form.initials.trim() || null,
          phoneNumber: form.phoneNumber.trim() || null,
          avatarUrl: null,
          title: form.title.trim() || null,
          departmentId: null,
          isSystemAdmin: form.isSystemAdmin,
          mustChangePassword: form.mustChangePassword,
          roleIds: form.roleIds,
        });
        toast.success({ title: "Đã thêm người dùng", description: form.fullName });
      }
      setModalOpen(false);
      await loadData();
    } catch (saveError) {
      const message = saveError instanceof Error ? saveError.message : "Không lưu được người dùng.";
      setFormError(message);
      toast.error({ title: "Không lưu được người dùng", description: message });
    } finally {
      setSaving(false);
    }
  };

  const runUserAction = async (user: ApiAdminUser, title: string, action: () => Promise<unknown>) => {
    setActionError("");
    setPendingUserId(user.userId);
    try {
      await action();
      toast.success({ title, description: user.fullName });
      await loadData();
    } catch (actionFailure) {
      const message = actionFailure instanceof Error ? actionFailure.message : "Không cập nhật được người dùng.";
      setActionError(message);
      toast.error({ title: "Thao tác thất bại", description: message });
    } finally {
      setPendingUserId(null);
    }
  };

  return (
    <div className="space-y-5 rounded-lg border border-slate-200 bg-white p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-slate-800">Quản lý người dùng</h2>
          <p className="mt-1 text-sm text-slate-600">Tổng cộng: {users.length} người dùng</p>
        </div>
        <Button className="gap-2" onClick={openCreate}>
          <Plus className="h-4 w-4" />
          Thêm người dùng
        </Button>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
        <Input placeholder="Tìm theo tên, email hoặc tên đăng nhập..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="h-9 pl-9" />
      </div>

      {loading && <div className="rounded-lg border border-slate-200 p-4 text-sm text-slate-500">Đang tải người dùng...</div>}
      {error && <div className="flex items-center justify-between rounded-lg border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-700">{error}<Button size="sm" variant="outline" onClick={() => void loadData()}>Thử lại</Button></div>}
      {actionError && <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-700">{actionError}</div>}

      <div className="overflow-hidden rounded-lg border border-slate-200">
        <Table className="w-full table-fixed">
          <TableHeader className="bg-slate-50">
            <TableRow>
              {["Người dùng", "Email", "Chức vụ", "Vai trò", "Trạng thái", "Đăng nhập cuối", "Hành động"].map((head) => <TableHead key={head} className="px-3 py-3 text-xs font-semibold text-slate-700">{head}</TableHead>)}
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredUsers.length === 0 ? (
              <TableRow><TableCell colSpan={7} className="py-10 text-center text-sm text-slate-400">Không có người dùng phù hợp.</TableCell></TableRow>
            ) : filteredUsers.map((user) => (
              <TableRow key={user.userId} className="border-b border-slate-100 hover:bg-slate-50">
                <TableCell className="px-3 py-3 align-top">
                  <p className="text-sm font-semibold text-slate-800 break-words">{user.fullName}</p>
                  <p className="text-[11px] text-slate-500 break-words">@{user.username}</p>
                </TableCell>
                <TableCell className="px-3 py-3 align-top text-sm text-slate-600 break-words">{user.email}</TableCell>
                <TableCell className="px-3 py-3 align-top text-sm text-slate-600 break-words">{user.title || "—"}</TableCell>
                <TableCell className="px-3 py-3 align-top">
                  <div className="flex flex-wrap gap-1">{user.roles.length ? user.roles.map((role) => <Badge key={role.roleId} className="bg-blue-100 text-blue-800 text-xs">{role.roleName}</Badge>) : <span className="text-xs text-slate-400">Chưa phân quyền</span>}</div>
                </TableCell>
                <TableCell className="px-3 py-3 align-top"><StatusBadge status={user.accountStatus} /></TableCell>
                <TableCell className="px-3 py-3 align-top text-sm text-slate-600">{formatDate(user.lastLoginAt)}</TableCell>
                <TableCell className="px-3 py-3 align-top whitespace-nowrap">
                  <div className="flex flex-nowrap justify-end gap-1">
                    <Button size="sm" variant="ghost" className="h-7 w-7 p-0" title="Sửa" onClick={() => openEdit(user)}><Edit2 className="h-3.5 w-3.5" /></Button>
                    {user.accountStatus === "locked" ? (
                      <Button size="sm" variant="ghost" className="h-7 w-7 p-0" title="Mở khóa" disabled={pendingUserId === user.userId} onClick={() => void runUserAction(user, "Đã mở khóa người dùng", () => adminApi.unlockUser(user.userId))}><RotateCcw className="h-3.5 w-3.5" /></Button>
                    ) : (
                      <Button size="sm" variant="ghost" className="h-7 w-7 p-0" title="Khóa" disabled={pendingUserId === user.userId} onClick={() => void runUserAction(user, "Đã khóa người dùng", () => adminApi.lockUser(user.userId))}><Lock className="h-3.5 w-3.5" /></Button>
                    )}
                    <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-red-600 hover:bg-red-50" title="Xóa" disabled={pendingUserId === user.userId} onClick={() => void runUserAction(user, "Đã xóa người dùng", () => adminApi.deleteUser(user.userId))}><Trash2 className="h-3.5 w-3.5" /></Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="sm:max-w-3xl">
          <DialogHeader><DialogTitle>{editingUser ? "Cập nhật người dùng" : "Thêm người dùng"}</DialogTitle></DialogHeader>
          {formError && <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm font-medium text-red-700">{formError}</div>}
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Tên đăng nhập" required><Input value={form.username} disabled={!!editingUser} onChange={(e) => updateForm("username", e.target.value)} /></Field>
            <Field label="Email" required><Input value={form.email} onChange={(e) => updateForm("email", e.target.value)} /></Field>
            {!editingUser && <Field label="Mật khẩu tạm" required><Input value={form.password} onChange={(e) => updateForm("password", e.target.value)} /></Field>}
            <Field label="Họ tên" required><Input value={form.fullName} onChange={(e) => updateForm("fullName", e.target.value)} /></Field>
            <Field label="Tên viết tắt"><Input value={form.initials} onChange={(e) => updateForm("initials", e.target.value)} /></Field>
            <Field label="Số điện thoại"><Input value={form.phoneNumber} onChange={(e) => updateForm("phoneNumber", e.target.value)} /></Field>
            <Field label="Chức vụ"><Input value={form.title} onChange={(e) => updateForm("title", e.target.value)} /></Field>
            <Field label="Trạng thái">
              <Select value={form.accountStatus} onValueChange={(value) => value && updateForm("accountStatus", value)}>
                <SelectTrigger className="h-9">{statusLabel(form.accountStatus)}</SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Hoạt động</SelectItem>
                  <SelectItem value="inactive">Vô hiệu</SelectItem>
                  <SelectItem value="locked">Bị khóa</SelectItem>
                </SelectContent>
              </Select>
            </Field>
            <div className="sm:col-span-2 rounded-lg border border-slate-200 p-3">
              <p className="mb-2 text-xs font-semibold uppercase text-slate-500">Vai trò</p>
              <div className="grid gap-2 sm:grid-cols-2">
                {roles.map((role) => (
                  <label key={role.roleId} className="flex items-center gap-2 rounded-md border border-slate-200 px-3 py-2 text-sm">
                    <input type="checkbox" checked={form.roleIds.includes(role.roleId)} onChange={(e) => toggleRole(role.roleId, e.target.checked)} />
                    <span className="font-medium text-slate-700">{role.roleName}</span>
                    <span className="text-xs text-slate-400">({role.roleCode})</span>
                  </label>
                ))}
              </div>
            </div>
            <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={form.isSystemAdmin} onChange={(e) => updateForm("isSystemAdmin", e.target.checked)} /> Quản trị hệ thống</label>
            <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={form.mustChangePassword} onChange={(e) => updateForm("mustChangePassword", e.target.checked)} /> Yêu cầu đổi mật khẩu</label>
          </div>
          <DialogFooter>
            <Button variant="outline" disabled={saving} onClick={() => setModalOpen(false)}>Hủy</Button>
            <Button disabled={saving} onClick={() => void handleSave()}>{saving ? "Đang lưu..." : "Lưu người dùng"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return <label className="space-y-1.5 text-xs font-semibold text-slate-600">{label}{required && <span className="ml-1 text-red-500">*</span>}{children}</label>;
}

function formatDate(value?: string | null) {
  if (!value) return "—";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleDateString("vi-VN");
}

function statusLabel(status: string) {
  if (status === "locked") return "Bị khóa";
  if (status === "inactive" || status === "disabled") return "Vô hiệu";
  return "Hoạt động";
}

function StatusBadge({ status }: { status: string }) {
  return <Badge className={cn("text-xs", status === "active" ? "bg-green-100 text-green-800" : status === "locked" ? "bg-red-100 text-red-800" : "bg-slate-100 text-slate-800")}>{statusLabel(status)}</Badge>;
}
