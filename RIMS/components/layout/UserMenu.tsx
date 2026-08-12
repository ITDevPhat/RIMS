"use client";

import { useState } from "react";
import { ChevronDown, KeyRound, LogOut, User } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { toast } from "@/lib/toast";
import { DropdownMenu, DropdownMenuContent, DropdownMenuGroup, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { ProfileDialog } from "./ProfileDialog";
import { ChangePasswordDialog } from "./ChangePasswordDialog";

export function UserMenu({ onLogout }: { onLogout: () => void | Promise<void> }) {
  const { user } = useAuth();
  const [profileOpen, setProfileOpen] = useState(false);
  const [passwordOpen, setPasswordOpen] = useState(false);
  const [logoutSaving, setLogoutSaving] = useState(false);
  if (!user) return null;
  const logout = async () => { if (logoutSaving) return; setLogoutSaving(true); toast.info("Đang đăng xuất..."); try { await onLogout(); } finally { setLogoutSaving(false); } };
  return <>
    <DropdownMenu><DropdownMenuTrigger className="flex min-w-0 items-center gap-2 rounded-lg px-2 py-1 outline-none transition hover:bg-slate-100 dark:hover:bg-slate-900">
      {user.avatarUrl ? <img src={user.avatarUrl} alt="Ảnh đại diện" className="h-8 w-8 flex-shrink-0 rounded-full object-cover" /> : <span className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-blue-600 text-[11px] font-bold text-white">{user.initials}</span>}
      <span className="hidden min-w-0 max-w-48 flex-col items-start md:flex"><span className="w-full truncate text-xs font-semibold text-slate-800 dark:text-slate-100">{user.hoTen}</span><span className="w-full truncate text-[10px] text-slate-500 dark:text-slate-400">{user.chucVu || "Chưa cập nhật chức vụ"}</span></span>
      <ChevronDown className="hidden h-3.5 w-3.5 flex-shrink-0 text-slate-400 md:block" />
    </DropdownMenuTrigger><DropdownMenuContent className="w-[calc(100vw-2rem)] dark:border-slate-800 dark:bg-slate-950 sm:w-72" align="end" sideOffset={6}>
      <div className="px-3 py-3"><p className="truncate text-sm font-bold text-slate-800 dark:text-slate-100">{user.hoTen}</p><p className="truncate text-xs text-slate-500 dark:text-slate-400">{user.chucVu || "Chưa cập nhật chức vụ"}</p><p className="truncate text-xs text-slate-500 dark:text-slate-400">{user.khoaPhong || "Chưa cập nhật khoa/phòng"}</p><span className="mt-2 inline-flex max-w-full rounded-full border border-blue-200 bg-blue-50 px-2 py-0.5 text-[10px] font-medium text-blue-700 dark:border-blue-800 dark:bg-blue-950 dark:text-blue-300">{user.vaiTro}</span></div>
      <DropdownMenuSeparator /><DropdownMenuGroup>
        <DropdownMenuItem onClick={() => setProfileOpen(true)} className="cursor-pointer gap-2.5"><User className="h-4 w-4 text-slate-400" />Thông tin cá nhân</DropdownMenuItem>
        <DropdownMenuItem onClick={() => setPasswordOpen(true)} className="cursor-pointer gap-2.5"><KeyRound className="h-4 w-4 text-slate-400" />Đổi mật khẩu</DropdownMenuItem>
      </DropdownMenuGroup><DropdownMenuSeparator />
      <DropdownMenuItem disabled={logoutSaving} onClick={() => void logout()} className="cursor-pointer gap-2.5 text-red-600 focus:bg-red-50 focus:text-red-600 dark:focus:bg-red-950"><LogOut className="h-4 w-4" />{logoutSaving ? "Đang đăng xuất..." : "Đăng xuất"}</DropdownMenuItem>
    </DropdownMenuContent></DropdownMenu>
    <ProfileDialog open={profileOpen} onOpenChange={setProfileOpen} /><ChangePasswordDialog open={passwordOpen} onOpenChange={setPasswordOpen} />
  </>;
}
