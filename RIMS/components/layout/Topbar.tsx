"use client";

import { useState } from "react";
import {
  Check,
  ChevronDown,
  KeyRound,
  LogOut,
  Monitor,
  Moon,
  PanelLeftClose,
  PanelLeftOpen,
  Search,
  Settings,
  Sun,
  User,
} from "lucide-react";
import { NotificationDropdown } from "@/components/common/NotificationDropdown";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/lib/auth-context";
import { useThemeMode, type ThemeMode } from "@/lib/theme-mode";
import { toast } from "@/lib/toast";
import { cn } from "@/lib/utils";

interface TopbarProps {
  sidebarCollapsed: boolean;
  onToggleSidebar: () => void;
  onOpenProfile: () => void;
  onLogout: () => void;
}

const themeOptions: Array<{ value: ThemeMode; label: string; icon: React.ElementType }> = [
  { value: "light", label: "Chế độ sáng", icon: Sun },
  { value: "dark", label: "Chế độ tối", icon: Moon },
  { value: "system", label: "Theo hệ thống", icon: Monitor },
];

function ToggleRow({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-lg border border-slate-200 px-3 py-2.5 dark:border-slate-800">
      <span className="text-sm font-medium text-slate-700 dark:text-slate-200">{label}</span>
      <button
        type="button"
        onClick={() => onChange(!checked)}
        className={cn(
          "relative h-6 w-11 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-200",
          checked ? "bg-blue-600" : "bg-slate-300 dark:bg-slate-700"
        )}
        aria-pressed={checked}
      >
        <span
          className={cn(
            "absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform",
            checked ? "translate-x-5" : "translate-x-0.5"
          )}
        />
      </button>
    </div>
  );
}

export default function Topbar({
  sidebarCollapsed,
  onToggleSidebar,
  onOpenProfile: _onOpenProfile,
  onLogout,
}: TopbarProps) {
  const { user } = useAuth();
  const { mode, setMode } = useThemeMode();
  const [searchValue, setSearchValue] = useState("");
  const [profileOpen, setProfileOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const [passwordOpen, setPasswordOpen] = useState(false);
  const [profileSaved, setProfileSaved] = useState(false);
  const [accountSaved, setAccountSaved] = useState(false);
  const [passwordSaved, setPasswordSaved] = useState(false);
  const [passwordError, setPasswordError] = useState("");
  const [profileForm, setProfileForm] = useState({
    fullName: "Quản trị viên Bệnh viện",
    email: "admin@hospital.vn",
    username: "admin",
    title: "Quản trị hệ thống",
    department: "Phòng Quản lý Nghiên cứu Khoa học",
    phone: "0909 123 456",
  });
  const [accountPrefs, setAccountPrefs] = useState({
    language: "Tiếng Việt",
    inApp: true,
    email: false,
    researchReminder: true,
    trainingReminder: true,
    autoRead: false,
  });
  const [passwordForm, setPasswordForm] = useState({
    current: "",
    next: "",
    confirm: "",
  });

  if (!user) return null;

  const updatePassword = () => {
    setPasswordSaved(false);
    if (passwordForm.next.length < 6) {
      setPasswordError("Mật khẩu mới phải có ít nhất 6 ký tự.");
      toast.warning("Mật khẩu mới phải có ít nhất 6 ký tự.");
      return;
    }
    if (passwordForm.next !== passwordForm.confirm) {
      setPasswordError("Xác nhận mật khẩu mới không khớp.");
      toast.error("Xác nhận mật khẩu mới không khớp.");
      return;
    }
    setPasswordError("");
    setPasswordSaved(true);
    setPasswordForm({ current: "", next: "", confirm: "" });
    toast.success("Đã cập nhật mật khẩu.");
  };

  const saveProfile = () => {
    setProfileSaved(true);
    toast.success("Đã lưu thông tin cá nhân.");
  };

  const saveAccount = () => {
    setAccountSaved(true);
    toast.success("Đã lưu cài đặt tài khoản.");
  };

  const handleLogout = () => {
    toast.info("Đang đăng xuất...");
    onLogout();
  };

  return (
    <>
      <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-slate-200 bg-white px-4 shadow-sm dark:border-slate-800 dark:bg-slate-950">
        <div className="flex min-w-0 items-center gap-3">
          <button
            type="button"
            onClick={onToggleSidebar}
            title={sidebarCollapsed ? "Mở rộng thanh bên" : "Thu gọn thanh bên"}
            className={cn(
              "flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 shadow-sm transition dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300",
              "hover:bg-slate-50 hover:text-slate-800 hover:border-slate-300 dark:hover:bg-slate-800",
              "focus:outline-none focus:ring-2 focus:ring-blue-200"
            )}
            aria-label={sidebarCollapsed ? "Mở rộng thanh bên" : "Thu gọn thanh bên"}
          >
            {sidebarCollapsed ? (
              <PanelLeftOpen className="h-5 w-5" />
            ) : (
              <PanelLeftClose className="h-5 w-5" />
            )}
          </button>

          <div className="relative hidden items-center sm:flex">
            <Search className="pointer-events-none absolute left-3 h-3.5 w-3.5 text-slate-400" />
            <input
              type="text"
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
              placeholder="Tìm kiếm đề tài, module..."
              className="h-8 w-56 rounded-lg border border-slate-200 bg-slate-50 pl-8 pr-3 text-xs text-slate-700 outline-none transition placeholder:text-slate-400 focus:w-72 focus:border-blue-400 focus:bg-white focus:ring-2 focus:ring-blue-100 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200"
            />
          </div>
        </div>

        <div className="flex items-center gap-2">
          <NotificationDropdown />

          <DropdownMenu>
            <DropdownMenuTrigger className="flex items-center gap-2 rounded-lg px-2 py-1 outline-none transition hover:bg-slate-100 dark:hover:bg-slate-900">
              <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-blue-600 text-[11px] font-bold text-white shadow-sm">
                {user.initials}
              </div>
              <div className="hidden flex-col items-start leading-none md:flex">
                <span className="text-xs font-semibold leading-tight text-slate-800 dark:text-slate-100">{user.hoTen}</span>
                <span className="max-w-[180px] truncate text-[10px] leading-tight text-slate-500 dark:text-slate-400">{user.chucVu}</span>
              </div>
              <ChevronDown className="hidden h-3.5 w-3.5 flex-shrink-0 text-slate-400 md:block" />
            </DropdownMenuTrigger>

            <DropdownMenuContent className="w-72" align="end" sideOffset={6}>
              <div className="px-3 py-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-blue-600 text-sm font-bold text-white shadow">
                    {user.initials}
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-bold text-slate-800">{user.hoTen}</p>
                    <p className="truncate text-[11px] leading-snug text-slate-500">{user.chucVu}</p>
                    <p className="truncate text-[11px] leading-snug text-slate-400">{user.khoaPhong}</p>
                  </div>
                </div>
                <div className="mt-2.5">
                  <span className="inline-flex items-center rounded-full border border-green-200 bg-green-50 px-2 py-0.5 text-[10px] font-medium text-green-700">
                    {user.vaiTro}
                  </span>
                </div>
              </div>

              <DropdownMenuSeparator />

              <DropdownMenuGroup>
                <DropdownMenuItem onClick={() => setProfileOpen(true)} className="cursor-pointer gap-2.5 text-sm">
                  <User className="h-4 w-4 text-slate-400" />
                  Thông tin cá nhân
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setAccountOpen(true)} className="cursor-pointer gap-2.5 text-sm">
                  <Settings className="h-4 w-4 text-slate-400" />
                  Cài đặt tài khoản
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setPasswordOpen(true)} className="cursor-pointer gap-2.5 text-sm">
                  <KeyRound className="h-4 w-4 text-slate-400" />
                  Đổi mật khẩu
                </DropdownMenuItem>
              </DropdownMenuGroup>

              <DropdownMenuSeparator />

              <DropdownMenuItem onClick={handleLogout} className="cursor-pointer gap-2.5 text-sm text-red-600 focus:text-red-600 focus:bg-red-50">
                <LogOut className="h-4 w-4" />
                Đăng xuất
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      <Dialog open={profileOpen} onOpenChange={setProfileOpen}>
        <DialogContent className="sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>Thông tin cá nhân</DialogTitle>
          </DialogHeader>
          <div className="grid gap-3 sm:grid-cols-2">
            {[
              { key: "fullName", label: "Họ và tên" },
              { key: "email", label: "Email", readOnly: true },
              { key: "username", label: "Tên đăng nhập", readOnly: true },
              { key: "title", label: "Chức vụ" },
              { key: "department", label: "Khoa/Phòng" },
              { key: "phone", label: "Số điện thoại" },
            ].map((field) => (
              <label key={field.key} className="space-y-1 text-xs font-medium text-slate-600">
                <span>{field.label}</span>
                <Input
                  value={profileForm[field.key as keyof typeof profileForm]}
                  readOnly={field.readOnly}
                  onChange={(e) => setProfileForm((prev) => ({ ...prev, [field.key]: e.target.value }))}
                  className={cn("h-9", field.readOnly && "bg-slate-50 text-slate-500")}
                />
              </label>
            ))}
          </div>
          {profileSaved && <p className="text-sm font-medium text-emerald-600">Đã lưu thông tin cá nhân.</p>}
          <DialogFooter>
            <Button variant="outline" onClick={() => setProfileOpen(false)}>Đóng</Button>
            <Button onClick={saveProfile}>Lưu thay đổi</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={accountOpen} onOpenChange={setAccountOpen}>
        <DialogContent className="sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>Cài đặt tài khoản</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <label className="space-y-1 text-xs font-medium text-slate-600">
              <span>Ngôn ngữ</span>
              <Select value={accountPrefs.language} onValueChange={(value) => value && setAccountPrefs((prev) => ({ ...prev, language: value }))}>
                <SelectTrigger className="h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Tiếng Việt">Tiếng Việt</SelectItem>
                </SelectContent>
              </Select>
            </label>
            <label className="space-y-1 text-xs font-medium text-slate-600">
              <span>Giao diện</span>
              <div className="grid gap-2 sm:grid-cols-3">
                {themeOptions.map((option) => {
                  const Icon = option.icon;
                  const selected = mode === option.value;
                  return (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => setMode(option.value)}
                      className={cn(
                        "flex items-center gap-2 rounded-lg border px-3 py-2 text-left text-sm font-semibold transition",
                        selected ? "border-blue-500 bg-blue-50 text-blue-700" : "border-slate-200 text-slate-600 hover:bg-slate-50"
                      )}
                    >
                      <Icon className="h-4 w-4" />
                      <span className="min-w-0 truncate">{option.label}</span>
                      {selected && <Check className="ml-auto h-4 w-4" />}
                    </button>
                  );
                })}
              </div>
            </label>
            <ToggleRow label="Nhận thông báo trong hệ thống" checked={accountPrefs.inApp} onChange={(value) => setAccountPrefs((prev) => ({ ...prev, inApp: value }))} />
            <ToggleRow label="Nhận thông báo qua email" checked={accountPrefs.email} onChange={(value) => setAccountPrefs((prev) => ({ ...prev, email: value }))} />
            <ToggleRow label="Nhắc hạn nghiên cứu" checked={accountPrefs.researchReminder} onChange={(value) => setAccountPrefs((prev) => ({ ...prev, researchReminder: value }))} />
            <ToggleRow label="Nhắc sự kiện đào tạo" checked={accountPrefs.trainingReminder} onChange={(value) => setAccountPrefs((prev) => ({ ...prev, trainingReminder: value }))} />
            <ToggleRow label="Tự động đánh dấu đã đọc khi mở thông báo" checked={accountPrefs.autoRead} onChange={(value) => setAccountPrefs((prev) => ({ ...prev, autoRead: value }))} />
          </div>
          {accountSaved && <p className="text-sm font-medium text-emerald-600">Đã lưu cài đặt tài khoản.</p>}
          <DialogFooter>
            <Button variant="outline" onClick={() => setAccountOpen(false)}>Đóng</Button>
            <Button onClick={saveAccount}>Lưu cài đặt</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={passwordOpen} onOpenChange={setPasswordOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Đổi mật khẩu</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <label className="space-y-1 text-xs font-medium text-slate-600">
              <span>Mật khẩu hiện tại</span>
              <Input type="password" value={passwordForm.current} onChange={(e) => setPasswordForm((prev) => ({ ...prev, current: e.target.value }))} />
            </label>
            <label className="space-y-1 text-xs font-medium text-slate-600">
              <span>Mật khẩu mới</span>
              <Input type="password" value={passwordForm.next} onChange={(e) => setPasswordForm((prev) => ({ ...prev, next: e.target.value }))} />
            </label>
            <label className="space-y-1 text-xs font-medium text-slate-600">
              <span>Xác nhận mật khẩu mới</span>
              <Input type="password" value={passwordForm.confirm} onChange={(e) => setPasswordForm((prev) => ({ ...prev, confirm: e.target.value }))} />
            </label>
          </div>
          {passwordError && <p className="text-sm font-medium text-red-600">{passwordError}</p>}
          {passwordSaved && <p className="text-sm font-medium text-emerald-600">Đã cập nhật mật khẩu.</p>}
          <DialogFooter>
            <Button variant="outline" onClick={() => setPasswordOpen(false)}>Hủy</Button>
            <Button onClick={updatePassword}>Cập nhật mật khẩu</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
