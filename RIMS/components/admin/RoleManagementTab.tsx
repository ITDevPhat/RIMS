"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Edit2, Plus, Search, Trash2, Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { adminApi, type ApiAdminRole, type ApiPermission } from "@/lib/api/admin-api";
import { cn } from "@/lib/utils";
import { toast } from "@/lib/toast";

type RoleForm = {
  roleCode: string;
  roleName: string;
  description: string;
  isActive: boolean;
  permissionIds: number[];
};

const emptyForm: RoleForm = {
  roleCode: "",
  roleName: "",
  description: "",
  isActive: true,
  permissionIds: [],
};

export default function RoleManagementTab() {
  const [roles, setRoles] = useState<ApiAdminRole[]>([]);
  const [permissions, setPermissions] = useState<ApiPermission[]>([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionError, setActionError] = useState("");
  const [pendingRoleId, setPendingRoleId] = useState<number | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingRole, setEditingRole] = useState<ApiAdminRole | null>(null);
  const [form, setForm] = useState<RoleForm>(emptyForm);
  const [formError, setFormError] = useState("");
  const [saving, setSaving] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [roleResult, permissionResult] = await Promise.all([
        adminApi.getRoles({ pageSize: 100, search: query || undefined }),
        adminApi.getPermissions({ pageSize: 500 }),
      ]);
      setRoles(roleResult.items);
      setPermissions(permissionResult.items);
    } catch {
      setError("Không tải được dữ liệu vai trò.");
      toast.error("Không tải được dữ liệu vai trò.");
      setRoles([]);
      setPermissions([]);
    } finally {
      setLoading(false);
    }
  }, [query]);

  useEffect(() => {
    const timer = window.setTimeout(() => void loadData(), 250);
    return () => window.clearTimeout(timer);
  }, [loadData]);

  const filteredRoles = useMemo(() => {
    const q = query.toLowerCase();
    return roles.filter((role) => !q || role.roleCode.toLowerCase().includes(q) || role.roleName.toLowerCase().includes(q));
  }, [query, roles]);

  const groupedPermissions = useMemo(() => {
    return permissions.reduce<Record<string, ApiPermission[]>>((acc, permission) => {
      const key = permission.moduleName || permission.moduleCode;
      acc[key] = [...(acc[key] ?? []), permission];
      return acc;
    }, {});
  }, [permissions]);

  const openCreate = () => {
    setEditingRole(null);
    setForm(emptyForm);
    setFormError("");
    setModalOpen(true);
  };

  const openEdit = async (role: ApiAdminRole) => {
    setEditingRole(role);
    setForm({ roleCode: role.roleCode, roleName: role.roleName, description: role.description ?? "", isActive: role.isActive, permissionIds: [] });
    setFormError("");
    setModalOpen(true);
    try {
      const matrix = await adminApi.getRolePermissions(role.roleId) as { modules: Array<{ actions: Array<{ permissionId: number; isAllowed: boolean }> }> };
      setForm((current) => ({ ...current, permissionIds: matrix.modules.flatMap((module) => module.actions.filter((action) => action.isAllowed).map((action) => action.permissionId)) }));
    } catch {
      toast.warning("Không tải được quyền hiện tại của vai trò.");
    }
  };

  const updateForm = <K extends keyof RoleForm>(key: K, value: RoleForm[K]) => {
    setForm((current) => ({ ...current, [key]: value }));
    setFormError("");
  };

  const togglePermission = (permissionId: number, checked: boolean) => {
    setForm((current) => ({
      ...current,
      permissionIds: checked ? Array.from(new Set([...current.permissionIds, permissionId])) : current.permissionIds.filter((id) => id !== permissionId),
    }));
  };

  const validate = () => {
    if (!editingRole && !form.roleCode.trim()) return "Vui lòng nhập mã vai trò.";
    if (!form.roleName.trim()) return "Vui lòng nhập tên vai trò.";
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
      if (editingRole) {
        await adminApi.updateRole(editingRole.roleId, {
          roleName: form.roleName.trim(),
          description: form.description.trim() || null,
          isActive: form.isActive,
          permissionIds: form.permissionIds,
        });
        toast.success({ title: "Đã cập nhật vai trò", description: form.roleName });
      } else {
        await adminApi.createRole({
          roleCode: form.roleCode.trim(),
          roleName: form.roleName.trim(),
          description: form.description.trim() || null,
          isActive: form.isActive,
          permissionIds: form.permissionIds,
        });
        toast.success({ title: "Đã thêm vai trò", description: form.roleName });
      }
      setModalOpen(false);
      await loadData();
    } catch (saveError) {
      const message = saveError instanceof Error ? saveError.message : "Không lưu được vai trò.";
      setFormError(message);
      toast.error({ title: "Không lưu được vai trò", description: message });
    } finally {
      setSaving(false);
    }
  };

  const deleteRole = async (role: ApiAdminRole) => {
    setActionError("");
    setPendingRoleId(role.roleId);
    try {
      await adminApi.deleteRole(role.roleId);
      toast.success({ title: "Đã xóa vai trò", description: role.roleName });
      await loadData();
    } catch (actionFailure) {
      const message = actionFailure instanceof Error ? actionFailure.message : "Không xóa được vai trò.";
      setActionError(message);
      toast.error({ title: "Không xóa được vai trò", description: message });
    } finally {
      setPendingRoleId(null);
    }
  };

  return (
    <div className="space-y-5 rounded-lg border border-slate-200 bg-white p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-slate-800">Quản lý vai trò</h2>
          <p className="mt-1 text-sm text-slate-600">Tổng cộng: {roles.length} vai trò</p>
        </div>
        <Button className="gap-2" onClick={openCreate}><Plus className="h-4 w-4" />Thêm vai trò</Button>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
        <Input placeholder="Tìm theo mã hoặc tên vai trò..." value={query} onChange={(event) => setQuery(event.target.value)} className="h-9 pl-9" />
      </div>

      {loading && <div className="rounded-lg border border-slate-200 p-4 text-sm text-slate-500">Đang tải vai trò...</div>}
      {error && <div className="flex items-center justify-between rounded-lg border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-700">{error}<Button size="sm" variant="outline" onClick={() => void loadData()}>Thử lại</Button></div>}
      {actionError && <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-700">{actionError}</div>}

      <div className="overflow-hidden rounded-lg border border-slate-200">
        <Table className="w-full table-fixed">
          <TableHeader className="bg-slate-50">
            <TableRow>
              {["Tên vai trò", "Mã", "Mô tả", "Người dùng", "Trạng thái", "Ngày tạo", "Hành động"].map((head) => <TableHead key={head} className="px-3 py-3 text-xs font-semibold text-slate-700">{head}</TableHead>)}
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredRoles.length === 0 ? (
              <TableRow><TableCell colSpan={7} className="py-10 text-center text-sm text-slate-400">Không có vai trò phù hợp.</TableCell></TableRow>
            ) : filteredRoles.map((role) => (
              <TableRow key={role.roleId} className="border-b border-slate-100 hover:bg-slate-50">
                <TableCell className="px-3 py-3 align-top text-sm font-semibold text-slate-800 break-words">{role.roleName}</TableCell>
                <TableCell className="px-3 py-3 align-top"><code className="rounded bg-slate-100 px-2 py-1 text-xs">{role.roleCode}</code></TableCell>
                <TableCell className="px-3 py-3 align-top text-sm text-slate-600 break-words">{role.description || "—"}</TableCell>
                <TableCell className="px-3 py-3 align-top"><Badge className="bg-blue-100 text-blue-800 text-xs"><Users className="mr-1 h-3 w-3" />{role.userCount} người</Badge></TableCell>
                <TableCell className="px-3 py-3 align-top"><Badge className={cn("text-xs", role.isActive ? "bg-green-100 text-green-800" : "bg-slate-100 text-slate-800")}>{role.isActive ? "Hoạt động" : "Vô hiệu"}</Badge></TableCell>
                <TableCell className="px-3 py-3 align-top text-sm text-slate-600">{formatDate(role.createdAt)}</TableCell>
                <TableCell className="px-3 py-3 align-top whitespace-nowrap">
                  <div className="flex flex-nowrap justify-end gap-1">
                    <Button size="sm" variant="ghost" className="h-7 w-7 p-0" title="Sửa" onClick={() => void openEdit(role)}><Edit2 className="h-3.5 w-3.5" /></Button>
                    <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-red-600 hover:bg-red-50" title="Xóa" disabled={pendingRoleId === role.roleId || role.isSystem} onClick={() => void deleteRole(role)}><Trash2 className="h-3.5 w-3.5" /></Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="sm:max-w-4xl">
          <DialogHeader><DialogTitle>{editingRole ? "Cập nhật vai trò" : "Thêm vai trò"}</DialogTitle></DialogHeader>
          {formError && <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm font-medium text-red-700">{formError}</div>}
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Mã vai trò" required><Input value={form.roleCode} disabled={!!editingRole} onChange={(e) => updateForm("roleCode", e.target.value)} placeholder="VD: RESEARCH_MANAGER" /></Field>
            <Field label="Tên vai trò" required><Input value={form.roleName} onChange={(e) => updateForm("roleName", e.target.value)} placeholder="VD: Quản lý nghiên cứu" /></Field>
            <Field label="Mô tả"><Input value={form.description} onChange={(e) => updateForm("description", e.target.value)} placeholder="Mô tả phạm vi vai trò" /></Field>
            <label className="flex items-center gap-2 pt-6 text-sm"><input type="checkbox" checked={form.isActive} onChange={(e) => updateForm("isActive", e.target.checked)} /> Vai trò đang hoạt động</label>
          </div>
          <div className="mt-4 max-h-[42vh] overflow-y-auto rounded-lg border border-slate-200 p-3">
            <p className="mb-3 text-xs font-semibold uppercase text-slate-500">Quyền hạn</p>
            <div className="space-y-4">
              {Object.entries(groupedPermissions).map(([moduleName, items]) => (
                <div key={moduleName} className="rounded-lg border border-slate-200 p-3">
                  <p className="mb-2 text-sm font-bold text-slate-800">{moduleName}</p>
                  <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                    {items.map((permission) => (
                      <label key={permission.permissionId} className="flex items-start gap-2 rounded-md border border-slate-100 px-2 py-2 text-xs">
                        <input type="checkbox" checked={form.permissionIds.includes(permission.permissionId)} onChange={(e) => togglePermission(permission.permissionId, e.target.checked)} />
                        <span><span className="font-semibold text-slate-700">{permission.actionName}</span><span className="block text-slate-400">{permission.permissionCode}</span></span>
                      </label>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" disabled={saving} onClick={() => setModalOpen(false)}>Hủy</Button>
            <Button disabled={saving} onClick={() => void handleSave()}>{saving ? "Đang lưu..." : "Lưu vai trò"}</Button>
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
