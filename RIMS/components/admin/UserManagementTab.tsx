"use client";

import { useEffect, useState, useCallback } from "react";
import { Plus, Search, Edit2, Trash2, Lock, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { User, UserStatus } from "@/lib/mock-admin-data";
import { cn } from "@/lib/utils";
import { adminApi } from "@/lib/api/admin-api";
import { mapApiUserToUi } from "@/lib/mappers/user-mapper";

export default function UserManagementTab() {
  const [users, setUsers] = useState<User[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionError, setActionError] = useState("");
  const [pendingUserId, setPendingUserId] = useState<string | null>(null);

  const loadUsers = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const result = await adminApi.getUsers({ pageSize: 100, search: searchQuery || undefined });
      setUsers(result.items.map(mapApiUserToUi));
    } catch {
      setError("Không tải được danh sách người dùng.");
      setUsers([]);
    } finally {
      setLoading(false);
    }
  }, [searchQuery]);

  const runUserAction = async (userId: string, action: () => Promise<unknown>) => {
    setActionError("");
    setPendingUserId(userId);
    try {
      await action();
      await loadUsers();
    } catch (actionFailure) {
      setActionError(actionFailure instanceof Error ? actionFailure.message : "Không cập nhật được người dùng.");
    } finally {
      setPendingUserId(null);
    }
  };

  useEffect(() => {
    const timer = window.setTimeout(() => void loadUsers(), 250);
    return () => window.clearTimeout(timer);
  }, [loadUsers]);

  const filteredUsers = users.filter((user) =>
    user.hoTen.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getStatusColor = (status: UserStatus) => {
    switch (status) {
      case "active":
        return "bg-green-100 text-green-800";
      case "inactive":
        return "bg-slate-100 text-slate-800";
      case "locked":
        return "bg-red-100 text-red-800";
    }
  };

  const getStatusLabel = (status: UserStatus) => {
    switch (status) {
      case "active":
        return "Hoạt Động";
      case "inactive":
        return "Vô Hiệu";
      case "locked":
        return "Bị Khóa";
    }
  };

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-slate-800">Quản Lý Người Dùng</h2>
          <p className="text-sm text-slate-600 mt-1">Tổng cộng: {users.length} người dùng</p>
        </div>
        <Button className="gap-2" disabled title="Chưa hỗ trợ thêm người dùng trong MVP">
          <Plus className="h-4 w-4" />
          Thêm Người Dùng
        </Button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
        <Input
          placeholder="Tìm kiếm theo tên hoặc email..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-9 h-9"
        />
      </div>

      {loading && <div className="rounded-lg border border-slate-200 p-4 text-sm text-slate-500">Đang tải người dùng...</div>}
      {error && (
        <div className="flex items-center justify-between rounded-lg border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-700">
          {error}
          <Button size="sm" variant="outline" onClick={() => void loadUsers()}>Thử lại</Button>
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
              <TableHead className="text-xs font-semibold text-slate-700 py-3">Tên</TableHead>
              <TableHead className="text-xs font-semibold text-slate-700 py-3">Email</TableHead>
              <TableHead className="text-xs font-semibold text-slate-700 py-3">Chức Vụ</TableHead>
              <TableHead className="text-xs font-semibold text-slate-700 py-3">Vai Trò</TableHead>
              <TableHead className="text-xs font-semibold text-slate-700 py-3">Trạng Thái</TableHead>
              <TableHead className="text-xs font-semibold text-slate-700 py-3">Lần Đăng Nhập Cuối</TableHead>
              <TableHead className="text-xs font-semibold text-slate-700 py-3 text-right">Hành Động</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredUsers.map((user) => (
              <TableRow key={user.id} className="border-b border-slate-200 hover:bg-slate-50">
                <TableCell className="py-3 text-sm text-slate-800 font-medium">{user.hoTen}</TableCell>
                <TableCell className="py-3 text-sm text-slate-600">{user.email}</TableCell>
                <TableCell className="py-3 text-sm text-slate-600">{user.chucVu}</TableCell>
                <TableCell className="py-3">
                  <Badge className="bg-blue-100 text-blue-800 text-xs">{user.vaiTro}</Badge>
                </TableCell>
                <TableCell className="py-3">
                  <Badge className={cn("text-xs", getStatusColor(user.status))}>
                    {getStatusLabel(user.status)}
                  </Badge>
                </TableCell>
                <TableCell className="py-3 text-sm text-slate-600">
                  {user.lanDangNhapCuoi.toLocaleDateString("vi-VN")}
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
                    {user.status === "active" && (
                      <button
                        title="Khóa"
                        disabled={pendingUserId === user.id}
                        onClick={() => void runUserAction(user.id, () => adminApi.lockUser(user.id))}
                        className="p-1.5 text-slate-600 hover:bg-slate-100 rounded transition"
                      >
                        <Lock className="h-4 w-4" />
                      </button>
                    )}
                    <button
                      title="Xóa"
                      disabled={pendingUserId === user.id}
                      onClick={() => void runUserAction(user.id, () => adminApi.deleteUser(user.id))}
                      className="p-1.5 text-slate-600 hover:bg-red-50 hover:text-red-600 rounded transition"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                    {user.status === "locked" && (
                      <button
                        title="Mở khóa"
                        disabled={pendingUserId === user.id}
                        onClick={() => void runUserAction(user.id, () => adminApi.unlockUser(user.id))}
                        className="p-1.5 text-slate-600 hover:bg-slate-100 rounded transition"
                      >
                        <RotateCcw className="h-4 w-4" />
                      </button>
                    )}
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
