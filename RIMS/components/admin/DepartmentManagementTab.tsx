"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Building2, Pencil, Plus, RefreshCw, Search, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ConfirmationDialog } from "@/components/common/ConfirmationDialog";
import { adminApi, type ApiDepartment } from "@/lib/api/admin-api";
import { toast } from "@/lib/toast";

const TYPE_OPTIONS = [
  { value: "administrative", label: "Phòng chức năng" },
  { value: "clinical", label: "Khoa lâm sàng" },
  { value: "support", label: "Cận lâm sàng/Hỗ trợ" },
];

const emptyForm = {
  departmentCode: "",
  departmentName: "",
  departmentType: "clinical",
  description: "",
  sortOrder: "100",
  isActive: true,
};

function typeLabel(value?: string | null) {
  return TYPE_OPTIONS.find((item) => item.value === value)?.label ?? value ?? "Chưa phân loại";
}

function getErrorMessage(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback;
}

export default function DepartmentManagementTab() {
  const [departments, setDepartments] = useState<ApiDepartment[]>([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [formError, setFormError] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<ApiDepartment | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<ApiDepartment | null>(null);
  const [form, setForm] = useState(emptyForm);

  const loadDepartments = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const result = await adminApi.getDepartments({ pageSize: 300, search: query || undefined });
      setDepartments(result.items);
    } catch (loadError) {
      setError(getErrorMessage(loadError, "Không tải được danh sách đơn vị từ PostgreSQL."));
      setDepartments([]);
    } finally {
      setLoading(false);
    }
  }, [query]);

  useEffect(() => {
    const timer = window.setTimeout(() => void loadDepartments(), 250);
    return () => window.clearTimeout(timer);
  }, [loadDepartments]);

  const stats = useMemo(() => ({
    total: departments.length,
    active: departments.filter((item) => item.isActive).length,
    clinical: departments.filter((item) => item.departmentType === "clinical").length,
  }), [departments]);

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm);
    setFormError("");
    setDialogOpen(true);
  };

  const openEdit = (department: ApiDepartment) => {
    setEditing(department);
    setForm({
      departmentCode: department.departmentCode,
      departmentName: department.departmentName,
      departmentType: department.departmentType ?? "clinical",
      description: department.description ?? "",
      sortOrder: String(department.sortOrder),
      isActive: department.isActive,
    });
    setFormError("");
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.departmentName.trim() || (!editing && !form.departmentCode.trim())) {
      setFormError("Vui lòng nhập mã và tên đơn vị.");
      return;
    }

    setSaving(true);
    setError("");
    setFormError("");
    const payload = {
      departmentName: form.departmentName.trim(),
      parentDepartmentId: null,
      departmentType: form.departmentType,
      description: form.description.trim() || null,
      isActive: form.isActive,
      sortOrder: Number(form.sortOrder || 0),
    };

    try {
      if (editing) {
        await adminApi.updateDepartment(editing.departmentId, payload);
        toast.success({ title: "Đã cập nhật đơn vị", description: form.departmentName.trim() });
      } else {
        await adminApi.createDepartment({ departmentCode: form.departmentCode.trim(), ...payload });
        toast.success({ title: "Đã thêm đơn vị", description: form.departmentName.trim() });
      }
      setEditing(null);
      setForm(emptyForm);
      setDialogOpen(false);
      await loadDepartments();
    } catch (saveError) {
      const message = getErrorMessage(saveError, "Không lưu được đơn vị.");
      setError(message);
      toast.error({ title: "Không lưu được đơn vị", description: message });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setSaving(true);
    setError("");
    try {
      await adminApi.deleteDepartment(deleteTarget.departmentId);
      toast.success({ title: "Đã xóa đơn vị", description: deleteTarget.departmentName });
      setDeleteTarget(null);
      await loadDepartments();
    } catch (deleteError) {
      const message = getErrorMessage(deleteError, "Không xóa được đơn vị.");
      setError(message);
      toast.error({ title: "Không xóa được đơn vị", description: message });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card className="border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <CardTitle>Đơn vị/Khoa/Phòng phụ trách</CardTitle>
          <CardDescription>Quản lý danh mục dùng cho đề tài nghiên cứu, đào tạo và người dùng.</CardDescription>
        </div>
        <Button className="gap-2" onClick={openCreate}>
          <Plus className="h-4 w-4" />
          Thêm đơn vị
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && (
          <div className="flex flex-col gap-3 rounded-lg border border-red-200 bg-red-50 p-3 text-sm font-medium text-red-700 sm:flex-row sm:items-center sm:justify-between">
            <span>{error}</span>
            <Button size="sm" variant="outline" className="gap-2 border-red-200 bg-white text-red-700 hover:bg-red-50" onClick={() => void loadDepartments()}>
              <RefreshCw className="h-3.5 w-3.5" />
              Tải lại
            </Button>
          </div>
        )}
        <div className="grid gap-3 md:grid-cols-[1fr_auto_auto_auto]">
          <div className="relative min-w-0">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <Input className="h-9 pl-9" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Tìm mã hoặc tên đơn vị..." />
          </div>
          <Summary label="Tổng" value={stats.total} />
          <Summary label="Đang dùng" value={stats.active} />
          <Summary label="Lâm sàng" value={stats.clinical} />
        </div>
        {loading && <div className="rounded-lg border border-slate-200 p-4 text-sm text-slate-500">Đang tải danh sách đơn vị...</div>}
        <Table>
          <TableHeader>
            <TableRow className="bg-slate-50">
              {["Mã", "Tên đơn vị", "Loại", "Mô tả", "Thứ tự", "Trạng thái", ""].map((head) => (
                <TableHead key={head} className="px-3 py-2 text-[10px] font-semibold uppercase text-slate-500">{head}</TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {departments.length === 0 && !loading ? (
              <TableRow><TableCell colSpan={7} className="py-10 text-center text-sm text-slate-400">Chưa có đơn vị nào.</TableCell></TableRow>
            ) : departments.map((item) => (
              <TableRow key={item.departmentId}>
                <TableCell className="px-3 py-3 font-mono text-xs font-semibold text-blue-700">{item.departmentCode}</TableCell>
                <TableCell className="px-3 py-3 text-sm font-semibold text-slate-800">{item.departmentName}</TableCell>
                <TableCell className="px-3 py-3 text-xs text-slate-600">{typeLabel(item.departmentType)}</TableCell>
                <TableCell className="px-3 py-3 text-xs text-slate-500">{item.description || "—"}</TableCell>
                <TableCell className="px-3 py-3 text-xs text-slate-600">{item.sortOrder}</TableCell>
                <TableCell className="px-3 py-3">
                  <Badge className={item.isActive ? "border border-emerald-200 bg-emerald-50 text-emerald-700" : "border border-slate-200 bg-slate-100 text-slate-600"}>
                    {item.isActive ? "Đang bật" : "Tạm ẩn"}
                  </Badge>
                </TableCell>
                <TableCell className="px-3 py-3 text-right">
                  <Button size="sm" variant="ghost" className="h-7 w-7 p-0" title="Sửa đơn vị" aria-label="Sửa đơn vị" onClick={() => openEdit(item)}><Pencil className="h-3.5 w-3.5" /></Button>
                  <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-red-500 hover:bg-red-50" title="Xóa đơn vị" aria-label="Xóa đơn vị" onClick={() => setDeleteTarget(item)}><Trash2 className="h-3.5 w-3.5" /></Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>

      <Dialog open={dialogOpen} onOpenChange={(open) => { if (!open && !saving) { setDialogOpen(false); setEditing(null); setForm(emptyForm); setFormError(""); } }}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader><DialogTitle>{editing ? "Cập nhật đơn vị" : "Thêm đơn vị"}</DialogTitle></DialogHeader>
          {formError && (
            <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm font-medium text-amber-700">
              {formError}
            </div>
          )}
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="space-y-1.5 text-xs font-semibold text-slate-600">Mã đơn vị<Input value={form.departmentCode} disabled={!!editing} onChange={(e) => setForm((current) => ({ ...current, departmentCode: e.target.value }))} /></label>
            <label className="space-y-1.5 text-xs font-semibold text-slate-600">Tên đơn vị<Input value={form.departmentName} onChange={(e) => setForm((current) => ({ ...current, departmentName: e.target.value }))} /></label>
            <label className="space-y-1.5 text-xs font-semibold text-slate-600">Loại đơn vị<Select value={form.departmentType} onValueChange={(value) => setForm((current) => ({ ...current, departmentType: value }))}><SelectTrigger>{typeLabel(form.departmentType)}</SelectTrigger><SelectContent>{TYPE_OPTIONS.map((item) => <SelectItem key={item.value} value={item.value}>{item.label}</SelectItem>)}</SelectContent></Select></label>
            <label className="space-y-1.5 text-xs font-semibold text-slate-600">Thứ tự<Input type="number" value={form.sortOrder} onChange={(e) => setForm((current) => ({ ...current, sortOrder: e.target.value }))} /></label>
            <label className="sm:col-span-2 space-y-1.5 text-xs font-semibold text-slate-600">Mô tả<Input value={form.description} onChange={(e) => setForm((current) => ({ ...current, description: e.target.value }))} /></label>
            <label className="flex items-center gap-2 text-sm font-medium text-slate-700"><input type="checkbox" checked={form.isActive} onChange={(e) => setForm((current) => ({ ...current, isActive: e.target.checked }))} /> Đơn vị đang hoạt động</label>
          </div>
          <DialogFooter>
            <Button variant="outline" disabled={saving} onClick={() => { setDialogOpen(false); setEditing(null); setForm(emptyForm); setFormError(""); }}>Hủy</Button>
            <Button disabled={saving} onClick={() => void handleSave()}>{saving ? "Đang lưu..." : "Lưu đơn vị"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmationDialog
        open={!!deleteTarget}
        onOpenChange={(open) => { if (!open && !saving) setDeleteTarget(null); }}
        type="delete"
        itemName={deleteTarget?.departmentName ?? "đơn vị này"}
        onConfirm={() => void handleDelete()}
        isLoading={saving}
      />
    </Card>
  );
}

function Summary({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex min-h-9 items-center gap-2 rounded-lg border border-slate-200 px-3">
      <Building2 className="h-4 w-4 text-blue-600" />
      <span className="text-xs text-slate-500">{label}</span>
      <span className="text-sm font-bold text-slate-800">{value}</span>
    </div>
  );
}
