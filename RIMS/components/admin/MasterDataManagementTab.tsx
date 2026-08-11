"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Database, Pencil, Plus, RefreshCw, Search } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { adminApi, type ApiMasterDataItem } from "@/lib/api/admin-api";
import { sponsorApi, type ApiSponsor } from "@/lib/api/research-api";
import { toast } from "@/lib/toast";
import { cn } from "@/lib/utils";

type CategoryKey = "research_type" | "sponsor" | "project_status" | "ethics_status" | "current_stage" | "risk_level";

const CATEGORIES: Array<{ key: CategoryKey; label: string; description: string }> = [
  { key: "research_type", label: "Loại nghiên cứu", description: "Dropdown Loại nghiên cứu trong form đề tài." },
  { key: "sponsor", label: "Nhà tài trợ / Nguồn kinh phí", description: "Nguồn kinh phí dùng cho form đề tài." },
  { key: "project_status", label: "Trạng thái đề tài", description: "Trạng thái nghiệp vụ của đề tài nghiên cứu." },
  { key: "ethics_status", label: "Trạng thái phê duyệt đạo đức", description: "Trạng thái đạo đức trong hồ sơ đề tài." },
  { key: "current_stage", label: "Giai đoạn hiện tại", description: "Giai đoạn business-level của đề tài." },
  { key: "risk_level", label: "Mức độ rủi ro", description: "Mức rủi ro dùng trong mốc tiến độ." },
];

type FormState = {
  code: string;
  name: string;
  description: string;
  sortOrder: string;
  isActive: boolean;
};

type MasterDataRow = {
  id: number;
  code: string;
  name: string;
  description: string;
  sortOrder: number;
  isActive: boolean;
};

const emptyForm: FormState = {
  code: "",
  name: "",
  description: "",
  sortOrder: "100",
  isActive: true,
};

function getErrorMessage(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback;
}

function toMasterRow(item: ApiMasterDataItem): MasterDataRow {
  return {
    id: item.masterDataItemId,
    code: item.itemCode,
    name: item.itemName,
    description: item.description ?? "",
    sortOrder: item.sortOrder,
    isActive: item.isActive,
  };
}

function toSponsorRow(item: ApiSponsor): MasterDataRow {
  return {
    id: item.sponsorId,
    code: item.sponsorCode,
    name: item.sponsorName,
    description: item.sponsorType ?? "",
    sortOrder: 100,
    isActive: item.isActive,
  };
}

export default function MasterDataManagementTab() {
  const [category, setCategory] = useState<CategoryKey>("research_type");
  const [masterItems, setMasterItems] = useState<ApiMasterDataItem[]>([]);
  const [sponsors, setSponsors] = useState<ApiSponsor[]>([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [formError, setFormError] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);

  const selectedCategory = CATEGORIES.find((item) => item.key === category) ?? CATEGORIES[0];
  const isSponsor = category === "sponsor";

  const loadData = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      if (isSponsor) {
        const result = await sponsorApi.getSponsors({ pageSize: 300, search: query || undefined });
        setSponsors(result.items);
      } else {
        const result = await adminApi.getMasterDataItems({ categoryCode: category, pageSize: 300, search: query || undefined });
        setMasterItems(result.items);
      }
    } catch (loadError) {
      setError(getErrorMessage(loadError, "Không tải được danh mục hệ thống."));
      setMasterItems([]);
      setSponsors([]);
    } finally {
      setLoading(false);
    }
  }, [category, isSponsor, query]);

  useEffect(() => {
    const timer = window.setTimeout(() => void loadData(), 250);
    return () => window.clearTimeout(timer);
  }, [loadData]);

  const rows = useMemo(() => (
    isSponsor
      ? sponsors.map(toSponsorRow).sort((a, b) => a.name.localeCompare(b.name, "vi-VN"))
      : masterItems.map(toMasterRow).sort((a, b) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name, "vi-VN"))
  ), [isSponsor, masterItems, sponsors]);

  const openCreate = () => {
    setEditingId(null);
    setForm(emptyForm);
    setFormError("");
    setDialogOpen(true);
  };

  const openEdit = (row: MasterDataRow) => {
    setEditingId(row.id);
    setForm({
      code: row.code,
      name: row.name,
      description: row.description,
      sortOrder: String(row.sortOrder),
      isActive: row.isActive,
    });
    setFormError("");
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.name.trim() || (!editingId && !form.code.trim())) {
      setFormError("Vui lòng nhập mã và tên danh mục.");
      return;
    }

    setSaving(true);
    setFormError("");
    try {
      if (isSponsor) {
        const payload = {
          sponsorName: form.name.trim(),
          sponsorType: form.description.trim() || null,
          contactPerson: null,
          contactEmail: null,
          contactPhone: null,
          address: null,
          isActive: form.isActive,
        };
        if (editingId) {
          await sponsorApi.updateSponsor(editingId, payload);
        } else {
          await sponsorApi.createSponsor({ sponsorCode: form.code.trim(), ...payload });
        }
      } else if (editingId) {
        await adminApi.updateMasterDataItem(editingId, {
          itemName: form.name.trim(),
          description: form.description.trim() || null,
          sortOrder: Number(form.sortOrder || 0),
          isActive: form.isActive,
        });
      } else {
        await adminApi.createMasterDataItem({
          categoryCode: category,
          itemCode: form.code.trim(),
          itemName: form.name.trim(),
          description: form.description.trim() || null,
          sortOrder: Number(form.sortOrder || 0),
          isActive: form.isActive,
        });
      }

      toast.success({ title: editingId ? "Đã cập nhật danh mục" : "Đã thêm danh mục", description: form.name.trim() });
      setDialogOpen(false);
      setEditingId(null);
      setForm(emptyForm);
      await loadData();
    } catch (saveError) {
      const message = getErrorMessage(saveError, "Không lưu được danh mục.");
      setFormError(message);
      toast.error({ title: "Không lưu được danh mục", description: message });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card className="border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <CardHeader className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <CardTitle>Danh mục hệ thống</CardTitle>
          <CardDescription>Quản lý các danh mục làm nguồn dữ liệu cho dropdown nghiệp vụ.</CardDescription>
        </div>
        <Button className="gap-2" onClick={openCreate}>
          <Plus className="h-4 w-4" />
          Thêm mới
        </Button>
      </CardHeader>
      <CardContent className="grid gap-4 lg:grid-cols-[260px_1fr]">
        <div className="space-y-2">
          {CATEGORIES.map((item) => (
            <button
              key={item.key}
              type="button"
              onClick={() => setCategory(item.key)}
              className={cn(
                "flex w-full items-start gap-3 rounded-lg border px-3 py-3 text-left transition",
                category === item.key ? "border-blue-300 bg-blue-50 text-blue-700" : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
              )}
            >
              <Database className="mt-0.5 h-4 w-4 shrink-0" />
              <span>
                <span className="block text-sm font-semibold">{item.label}</span>
                <span className="mt-0.5 block text-xs text-slate-500">{item.description}</span>
              </span>
            </button>
          ))}
        </div>

        <div className="min-w-0 space-y-4">
          {error && (
            <div className="flex flex-col gap-3 rounded-lg border border-red-200 bg-red-50 p-3 text-sm font-medium text-red-700 sm:flex-row sm:items-center sm:justify-between">
              <span>{error}</span>
              <Button size="sm" variant="outline" className="gap-2 border-red-200 bg-white text-red-700 hover:bg-red-50" onClick={() => void loadData()}>
                <RefreshCw className="h-3.5 w-3.5" />
                Tải lại
              </Button>
            </div>
          )}

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h3 className="text-base font-bold text-slate-800">{selectedCategory.label}</h3>
              <p className="text-sm text-slate-500">{selectedCategory.description}</p>
            </div>
            <div className="relative w-full sm:w-80">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input className="h-9 pl-9" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Tìm kiếm..." />
            </div>
          </div>

          {loading && <div className="rounded-lg border border-slate-200 p-4 text-sm text-slate-500">Đang tải danh mục...</div>}

          <Table>
            <TableHeader>
              <TableRow className="bg-slate-50">
                {["Mã", "Tên", "Mô tả", "Thứ tự", "Trạng thái", ""].map((head) => (
                  <TableHead key={head} className="px-3 py-2 text-[10px] font-semibold uppercase text-slate-500">{head}</TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.length === 0 && !loading ? (
                <TableRow><TableCell colSpan={6} className="py-10 text-center text-sm text-slate-400">Không có dữ liệu.</TableCell></TableRow>
              ) : rows.map((row) => (
                <TableRow key={row.id}>
                  <TableCell className="px-3 py-3 font-mono text-xs font-semibold text-blue-700">{row.code}</TableCell>
                  <TableCell className="px-3 py-3 text-sm font-semibold text-slate-800">{row.name}</TableCell>
                  <TableCell className="px-3 py-3 text-xs text-slate-500">{row.description || "—"}</TableCell>
                  <TableCell className="px-3 py-3 text-xs text-slate-600">{isSponsor ? "—" : row.sortOrder}</TableCell>
                  <TableCell className="px-3 py-3">
                    <Badge className={row.isActive ? "border border-emerald-200 bg-emerald-50 text-emerald-700" : "border border-slate-200 bg-slate-100 text-slate-600"}>
                      {row.isActive ? "Đang sử dụng" : "Ngừng sử dụng"}
                    </Badge>
                  </TableCell>
                  <TableCell className="px-3 py-3 text-right">
                    <Button size="sm" variant="ghost" className="h-7 w-7 p-0" title="Sửa" aria-label="Sửa" onClick={() => openEdit(row)}>
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>

      <Dialog open={dialogOpen} onOpenChange={(open) => { if (!open && !saving) setDialogOpen(false); }}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader><DialogTitle>{editingId ? "Sửa danh mục" : "Thêm danh mục"}</DialogTitle></DialogHeader>
          {formError && <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm font-medium text-amber-700">{formError}</div>}
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="space-y-1.5 text-xs font-semibold text-slate-600">Mã<Input value={form.code} disabled={!!editingId} onChange={(event) => setForm((current) => ({ ...current, code: event.target.value }))} /></label>
            <label className="space-y-1.5 text-xs font-semibold text-slate-600">Tên<Input value={form.name} onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))} /></label>
            {!isSponsor && <label className="space-y-1.5 text-xs font-semibold text-slate-600">Thứ tự<Input type="number" min={0} value={form.sortOrder} onChange={(event) => setForm((current) => ({ ...current, sortOrder: event.target.value }))} /></label>}
            <label className={cn("space-y-1.5 text-xs font-semibold text-slate-600", isSponsor ? "sm:col-span-2" : "")}>Mô tả<Input value={form.description} onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))} /></label>
            <label className="flex items-center gap-2 text-sm font-medium text-slate-700"><input type="checkbox" checked={form.isActive} onChange={(event) => setForm((current) => ({ ...current, isActive: event.target.checked }))} /> Đang sử dụng</label>
          </div>
          <DialogFooter>
            <Button variant="outline" disabled={saving} onClick={() => setDialogOpen(false)}>Hủy</Button>
            <Button disabled={saving} onClick={() => void handleSave()}>{saving ? "Đang lưu..." : "Lưu"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
