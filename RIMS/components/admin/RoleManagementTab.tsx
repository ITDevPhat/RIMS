"use client";

import { useEffect, useState, useCallback } from "react";
import { Plus, Edit2, Trash2, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { Role } from "@/lib/mock-admin-data";
import { cn } from "@/lib/utils";
import { adminApi } from "@/lib/api/admin-api";
import { mapApiRoleToUi } from "@/lib/mappers/role-mapper";

export default function RoleManagementTab() {
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionError, setActionError] = useState("");
  const [pendingRoleId, setPendingRoleId] = useState<string | null>(null);

  const loadRoles = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const result = await adminApi.getRoles({ pageSize: 100 });
      setRoles(result.items.map(mapApiRoleToUi));
    } catch {
      setError("Không tải được danh sách vai trò.");
      setRoles([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadRoles();
  }, [loadRoles]);

  const deleteRole = async (roleId: string) => {
    setActionError("");
    setPendingRoleId(roleId);
    try {
      await adminApi.deleteRole(roleId);
      await loadRoles();
    } catch (actionFailure) {
      setActionError(actionFailure instanceof Error ? actionFailure.message : "Không xóa được vai trò.");
    } finally {
      setPendingRoleId(null);
    }
  };

  const getStatusColor = (status: string) => {
    return status === "active"
      ? "bg-green-100 text-green-800"
      : "bg-slate-100 text-slate-800";
  };

  const getStatusLabel = (status: string) => {
    return status === "active" ? "Hoạt Động" : "Vô Hiệu";
  };

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-slate-800">Quản Lý Vai Trò</h2>
          <p className="text-sm text-slate-600 mt-1">Tổng cộng: {roles.length} vai trò</p>
        </div>
        <Button className="gap-2" disabled title="Chưa hỗ trợ thêm vai trò trong MVP">
          <Plus className="h-4 w-4" />
          Thêm Vai Trò
        </Button>
      </div>

      {loading && <div className="rounded-lg border border-slate-200 p-4 text-sm text-slate-500">Đang tải vai trò...</div>}
      {error && (
        <div className="flex items-center justify-between rounded-lg border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-700">
          {error}
          <Button size="sm" variant="outline" onClick={() => void loadRoles()}>Thử lại</Button>
        </div>
      )}
      {actionError && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-700">
          {actionError}
        </div>
      )}

      {/* Table */}
      <div className="border border-slate-200 rounded-lg overflow-hidden">
        <Table>
          <TableHeader className="bg-slate-50">
            <TableRow className="border-b border-slate-200">
              <TableHead className="text-xs font-semibold text-slate-700 py-3">Tên Vai Trò</TableHead>
              <TableHead className="text-xs font-semibold text-slate-700 py-3">Mã</TableHead>
              <TableHead className="text-xs font-semibold text-slate-700 py-3">Mô Tả</TableHead>
              <TableHead className="text-xs font-semibold text-slate-700 py-3">
                <div className="flex items-center gap-1">
                  <Users className="h-4 w-4" />
                  Người Dùng
                </div>
              </TableHead>
              <TableHead className="text-xs font-semibold text-slate-700 py-3">Trạng Thái</TableHead>
              <TableHead className="text-xs font-semibold text-slate-700 py-3">Ngày Tạo</TableHead>
              <TableHead className="text-xs font-semibold text-slate-700 py-3 text-right">Hành Động</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {roles.map((role) => (
              <TableRow key={role.id} className="border-b border-slate-200 hover:bg-slate-50">
                <TableCell className="py-3 text-sm text-slate-800 font-medium">{role.tenVaiTro}</TableCell>
                <TableCell className="py-3 text-sm text-slate-600">
                  <code className="bg-slate-100 px-2 py-1 rounded text-xs">{role.maVaiTro}</code>
                </TableCell>
                <TableCell className="py-3 text-sm text-slate-600">{role.moTa}</TableCell>
                <TableCell className="py-3">
                  <Badge className="bg-blue-100 text-blue-800 text-xs">
                    {role.soNguoiDung} người
                  </Badge>
                </TableCell>
                <TableCell className="py-3">
                  <Badge className={cn("text-xs", getStatusColor(role.status))}>
                    {getStatusLabel(role.status)}
                  </Badge>
                </TableCell>
                <TableCell className="py-3 text-sm text-slate-600">
                  {role.ngayTao.toLocaleDateString("vi-VN")}
                </TableCell>
                <TableCell className="py-3 text-right">
                  <div className="flex items-center justify-end gap-2">
                    <button
                      title="Sửa"
                      disabled
                      className="p-1.5 text-slate-600 hover:bg-slate-100 rounded transition"
                    >
                      <Edit2 className="h-4 w-4" />
                    </button>
                    <button
                      title="Xóa"
                      disabled={pendingRoleId === role.id}
                      onClick={() => void deleteRole(role.id)}
                      className="p-1.5 text-slate-600 hover:bg-red-50 hover:text-red-600 rounded transition"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
