"use client";

import { useMemo, useState } from "react";
import {
  Bell,
  Check,
  FileText,
  KeyRound,
  Lock,
  Monitor,
  Moon,
  Pencil,
  Plus,
  Save,
  Search,
  Settings as SettingsIcon,
  Shield,
  Sun,
  Users,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useThemeMode, type ThemeMode } from "@/lib/theme-mode";
import { cn } from "@/lib/utils";

type SettingsTab = "general" | "notifications" | "rules" | "users" | "roles" | "permissions" | "audit";

const tabs: Array<{ id: SettingsTab; label: string; icon: React.ElementType }> = [
  { id: "general", label: "Cài đặt chung", icon: SettingsIcon },
  { id: "notifications", label: "Thông báo", icon: Bell },
  { id: "rules", label: "Quy tắc thông báo", icon: FileText },
  { id: "users", label: "Người dùng", icon: Users },
  { id: "roles", label: "Vai trò", icon: Shield },
  { id: "permissions", label: "Quyền hạn", icon: Lock },
  { id: "audit", label: "Nhật ký hệ thống", icon: KeyRound },
];

const themeOptions: Array<{ value: ThemeMode; label: string; description: string; icon: React.ElementType }> = [
  { value: "light", label: "Chế độ sáng", description: "Giao diện sáng, phù hợp môi trường văn phòng.", icon: Sun },
  { value: "dark", label: "Chế độ tối", description: "Giảm độ chói khi làm việc ngoài giờ.", icon: Moon },
  { value: "system", label: "Theo hệ thống", description: "Tự động theo cài đặt của thiết bị.", icon: Monitor },
];

const users = [
  { name: "Quản trị viên Bệnh viện", email: "admin@hospital.vn", username: "admin", department: "Phòng Quản lý Nghiên cứu Khoa học", role: "Quản trị viên", status: "Hoạt động", lastLogin: "16/07/2026 08:15" },
  { name: "BS.CKII Nguyễn Văn An", email: "an.nguyen@hospital.vn", username: "nguyenvanan", department: "Khoa Khám bệnh", role: "Chủ nhiệm đề tài", status: "Hoạt động", lastLogin: "15/07/2026 16:20" },
  { name: "CN Trần Thị Mai", email: "mai.tran@hospital.vn", username: "tranthimai", department: "Phòng Quản lý Nghiên cứu Khoa học", role: "Điều phối nghiên cứu", status: "Hoạt động", lastLogin: "16/07/2026 09:20" },
  { name: "CN Võ Thị Thanh", email: "thanh.vo@hospital.vn", username: "vothithanh", department: "Tổ Thống kê", role: "Thành viên nghiên cứu", status: "Hoạt động", lastLogin: "16/07/2026 10:40" },
];

const roles = [
  { code: "ADMIN", name: "Quản trị viên", description: "Toàn quyền hệ thống", count: 1, status: "Đang dùng" },
  { code: "RESEARCH_OFFICE", name: "Phòng Quản lý Nghiên cứu", description: "Quản lý đề tài, module, milestone", count: 3, status: "Đang dùng" },
  { code: "PI", name: "Chủ nhiệm đề tài", description: "Quản lý đề tài được phân công", count: 5, status: "Đang dùng" },
  { code: "RESEARCH_MEMBER", name: "Thành viên nghiên cứu", description: "Cập nhật milestone và tiến độ", count: 12, status: "Đang dùng" },
  { code: "VIEWER", name: "Người xem", description: "Chỉ xem dữ liệu được phân quyền", count: 8, status: "Đang dùng" },
];

const rulesInitial = [
  { code: "DEADLINE_DUE_7D", name: "Nhắc hạn chót còn 7 ngày", target: "Module", condition: "Sắp đến hạn", days: 7, channel: "Hệ thống", priority: "Cao", enabled: true },
  { code: "MILESTONE_OVERDUE", name: "Nhắc milestone trễ hạn", target: "Milestone", condition: "Trễ hạn", days: 0, channel: "Hệ thống + Email", priority: "Khẩn cấp", enabled: true },
  { code: "ETHICS_EXPIRING_30D", name: "Nhắc phê duyệt đạo đức sắp hết hạn", target: "Nghiên cứu", condition: "Sắp hết hạn", days: 30, channel: "Hệ thống", priority: "Cao", enabled: true },
];

const permissionModules = ["Tổng quan", "Nghiên cứu", "Module", "Milestone", "Hạn chót", "Thông báo", "Cài đặt", "Người dùng", "Vai trò"];
const permissionActions = ["Xem", "Thêm", "Sửa", "Xóa", "Duyệt", "Xuất dữ liệu", "Cấu hình"];

const auditLogs = [
  { time: "16/07/2026 08:15", user: "Quản trị viên Bệnh viện", module: "Người dùng", action: "Đăng nhập", target: "admin@hospital.vn", content: "Đăng nhập hệ thống thành công", status: "Thành công" },
  { time: "16/07/2026 09:20", user: "CN Trần Thị Mai", module: "Nghiên cứu", action: "Sửa", target: "NC-2026-001", content: "Cập nhật tiến độ nghiên cứu", status: "Thành công" },
  { time: "16/07/2026 10:05", user: "BS Nguyễn Văn Bình", module: "Module", action: "Sửa", target: "Thu thập số liệu", content: "Cập nhật tiến độ module lên 58%", status: "Thành công" },
  { time: "16/07/2026 10:40", user: "CN Võ Thị Thanh", module: "Milestone", action: "Thêm", target: "Kiểm tra thiếu dữ liệu định kỳ", content: "Tạo milestone mới", status: "Thành công" },
];

function Toggle({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label?: string;
}) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className={cn(
        "relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-200",
        checked ? "bg-blue-600" : "bg-slate-300 dark:bg-slate-700"
      )}
      aria-label={label}
      aria-pressed={checked}
    >
      <span
        className={cn(
          "h-5 w-5 rounded-full bg-white shadow transition-transform",
          checked ? "translate-x-5" : "translate-x-0.5"
        )}
      />
    </button>
  );
}

function SettingRow({
  label,
  description,
  children,
}: {
  label: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-lg border border-slate-200 px-4 py-3 dark:border-slate-800">
      <div className="min-w-0">
        <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">{label}</p>
        {description && <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">{description}</p>}
      </div>
      {children}
    </div>
  );
}

function ThemeSelector({ compact = false }: { compact?: boolean }) {
  const { mode, setMode } = useThemeMode();

  return (
    <div className={cn("grid gap-3", compact ? "md:grid-cols-3" : "lg:grid-cols-3")}>
      {themeOptions.map((option) => {
        const Icon = option.icon;
        const selected = mode === option.value;
        return (
          <button
            key={option.value}
            type="button"
            onClick={() => setMode(option.value)}
            className={cn(
              "flex min-w-0 items-start gap-3 rounded-lg border p-3 text-left transition",
              selected
                ? "border-blue-500 bg-blue-50 text-blue-700 shadow-sm dark:bg-blue-950/40"
                : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-200 dark:hover:bg-slate-900"
            )}
          >
            <span className={cn("flex h-9 w-9 shrink-0 items-center justify-center rounded-lg", selected ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-500 dark:bg-slate-800")}>
              <Icon className="h-4 w-4" />
            </span>
            <span className="min-w-0 flex-1">
              <span className="flex items-center gap-2 text-sm font-semibold">
                <span className="truncate">{option.label}</span>
                {selected && <Check className="h-4 w-4 shrink-0" />}
              </span>
              {!compact && <span className="mt-1 block text-xs text-slate-500 dark:text-slate-400">{option.description}</span>}
            </span>
          </button>
        );
      })}
    </div>
  );
}

export default function CaiDat() {
  const [activeTab, setActiveTab] = useState<SettingsTab>("general");

  return (
    <div className="min-h-full overflow-x-hidden bg-slate-50 dark:bg-slate-950">
      <div className="border-b border-slate-200 bg-white px-8 py-5 dark:border-slate-800 dark:bg-slate-950">
        <h1 className="text-lg font-bold text-slate-800 dark:text-slate-100">Cài đặt hệ thống</h1>
        <p className="mt-0.5 text-sm text-slate-500 dark:text-slate-400">Quản lý cài đặt hệ thống, người dùng, vai trò và quyền hạn</p>
      </div>

      <div className="px-8 py-6">
        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as SettingsTab)} className="min-w-0">
          <div className="overflow-x-auto pb-1">
            <TabsList className="h-auto min-w-max justify-start rounded-lg border border-slate-200 bg-white p-1 dark:border-slate-800 dark:bg-slate-900">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <TabsTrigger key={tab.id} value={tab.id} className="h-9 gap-2 px-3 text-xs data-active:bg-blue-600 data-active:text-white">
                    <Icon className="h-3.5 w-3.5" />
                    {tab.label}
                  </TabsTrigger>
                );
              })}
            </TabsList>
          </div>

          <TabsContent value="general" className="mt-5">
            <GeneralSettingsTab />
          </TabsContent>
          <TabsContent value="notifications" className="mt-5">
            <NotificationSettingsTab />
          </TabsContent>
          <TabsContent value="rules" className="mt-5">
            <NotificationRulesTab />
          </TabsContent>
          <TabsContent value="users" className="mt-5">
            <UsersTab />
          </TabsContent>
          <TabsContent value="roles" className="mt-5">
            <RolesTab />
          </TabsContent>
          <TabsContent value="permissions" className="mt-5">
            <PermissionsTab />
          </TabsContent>
          <TabsContent value="audit" className="mt-5">
            <AuditLogTab />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

function GeneralSettingsTab() {
  const [autoStatus, setAutoStatus] = useState(true);
  const [autoDelay, setAutoDelay] = useState(true);
  const [saved, setSaved] = useState(false);

  return (
    <div className="space-y-5">
      <div className="grid gap-5 xl:grid-cols-2">
        <Card className="border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <CardHeader>
            <CardTitle>Thông tin hệ thống</CardTitle>
            <CardDescription>Thông tin vận hành chung của ResearchTracker RMS.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3 sm:grid-cols-2">
            {[
              ["Tên hệ thống", "ResearchTracker RMS"],
              ["Đơn vị triển khai", "Bệnh viện Đa khoa Thành phố"],
              ["Múi giờ", "Asia/Ho_Chi_Minh"],
              ["Ngôn ngữ mặc định", "Tiếng Việt"],
              ["Định dạng ngày", "dd/MM/yyyy"],
              ["Năm làm việc", "2026"],
            ].map(([label, value]) => (
              <div key={label} className="rounded-lg border border-slate-200 p-3 dark:border-slate-800">
                <p className="text-xs text-slate-500 dark:text-slate-400">{label}</p>
                <p className="mt-1 truncate text-sm font-semibold text-slate-800 dark:text-slate-100">{value}</p>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <CardHeader>
            <CardTitle>Thiết lập tiến độ nghiên cứu</CardTitle>
            <CardDescription>Cấu hình cảnh báo và tự động tính trạng thái module.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <SettingRow label="Ngưỡng cảnh báo sắp trễ" description="Số ngày trước hạn chót để cảnh báo.">
              <Input className="h-9 w-24 text-right" value="7 ngày" readOnly />
            </SettingRow>
            <SettingRow label="Ngưỡng tiến độ thấp hơn kế hoạch" description="Chênh lệch tiến độ cho phép.">
              <Input className="h-9 w-24 text-right" value="20%" readOnly />
            </SettingRow>
            <SettingRow label="Tự động tính trạng thái module">
              <Toggle checked={autoStatus} onChange={setAutoStatus} label="Tự động tính trạng thái module" />
            </SettingRow>
            <SettingRow label="Tự động tính số ngày trễ">
              <Toggle checked={autoDelay} onChange={setAutoDelay} label="Tự động tính số ngày trễ" />
            </SettingRow>
          </CardContent>
        </Card>
      </div>

      <Card className="border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <CardHeader>
          <CardTitle>Giao diện</CardTitle>
          <CardDescription>Tùy chỉnh giao diện hiển thị của hệ thống.</CardDescription>
        </CardHeader>
        <CardContent>
          <ThemeSelector />
        </CardContent>
      </Card>

      <div className="flex items-center gap-3">
        <Button className="gap-2" onClick={() => setSaved(true)}>
          <Save className="h-4 w-4" />
          Lưu thay đổi
        </Button>
        {saved && <span className="text-sm font-medium text-emerald-600">Đã cập nhật cài đặt giao diện.</span>}
      </div>
    </div>
  );
}

function NotificationSettingsTab() {
  const [state, setState] = useState({
    inApp: true,
    email: false,
    deadline: true,
    milestone: true,
    ethics: true,
    scanTime: "07:00",
  });
  const [saved, setSaved] = useState(false);

  return (
    <Card className="border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <CardHeader>
        <CardTitle>Thông báo</CardTitle>
        <CardDescription>Cấu hình cách hệ thống nhắc hạn nghiên cứu, milestone và đạo đức.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-3 lg:grid-cols-2">
          <SettingRow label="Bật thông báo trong hệ thống">
            <Toggle checked={state.inApp} onChange={(value) => setState((prev) => ({ ...prev, inApp: value }))} />
          </SettingRow>
          <SettingRow label="Bật thông báo qua email">
            <Toggle checked={state.email} onChange={(value) => setState((prev) => ({ ...prev, email: value }))} />
          </SettingRow>
          <SettingRow label="Nhắc deadline nghiên cứu">
            <Toggle checked={state.deadline} onChange={(value) => setState((prev) => ({ ...prev, deadline: value }))} />
          </SettingRow>
          <SettingRow label="Nhắc milestone sắp đến hạn">
            <Toggle checked={state.milestone} onChange={(value) => setState((prev) => ({ ...prev, milestone: value }))} />
          </SettingRow>
          <SettingRow label="Nhắc phê duyệt đạo đức sắp hết hạn">
            <Toggle checked={state.ethics} onChange={(value) => setState((prev) => ({ ...prev, ethics: value }))} />
          </SettingRow>
          <SettingRow label="Thời gian quét thông báo hằng ngày">
            <Input type="time" className="h-9 w-28" value={state.scanTime} onChange={(e) => setState((prev) => ({ ...prev, scanTime: e.target.value }))} />
          </SettingRow>
        </div>
        <div className="rounded-lg border border-slate-200 p-4 dark:border-slate-800">
          <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">Các mốc nhắc deadline</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {["7 ngày", "3 ngày", "1 ngày", "Đúng ngày"].map((item) => (
              <Badge key={item} className="border-blue-200 bg-blue-50 text-blue-700">{item}</Badge>
            ))}
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Button onClick={() => setSaved(true)}>Lưu cấu hình thông báo</Button>
          {saved && <span className="text-sm font-medium text-emerald-600">Đã lưu cấu hình thông báo.</span>}
        </div>
      </CardContent>
    </Card>
  );
}

function NotificationRulesTab() {
  const [rules, setRules] = useState(rulesInitial);

  return (
    <Card className="border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <CardHeader>
        <CardTitle>Quy tắc thông báo</CardTitle>
        <CardDescription>Danh sách quy tắc tự động tạo cảnh báo trong hệ thống.</CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow className="bg-slate-50 dark:bg-slate-950">
              {["Mã quy tắc", "Tên quy tắc", "Đối tượng", "Điều kiện", "Số ngày nhắc", "Kênh", "Mức ưu tiên", "Trạng thái", "Thao tác"].map((head) => (
                <TableHead key={head} className="px-3 py-2 text-[10px] font-semibold uppercase text-slate-500">{head}</TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {rules.map((rule, index) => (
              <TableRow key={rule.code}>
                <TableCell className="px-3 py-3 font-mono text-xs text-slate-700 dark:text-slate-200">{rule.code}</TableCell>
                <TableCell className="px-3 py-3 text-xs font-semibold text-slate-800 dark:text-slate-100">{rule.name}</TableCell>
                <TableCell className="px-3 py-3 text-xs">{rule.target}</TableCell>
                <TableCell className="px-3 py-3 text-xs">{rule.condition}</TableCell>
                <TableCell className="px-3 py-3 text-xs">{rule.days}</TableCell>
                <TableCell className="px-3 py-3 text-xs">{rule.channel}</TableCell>
                <TableCell className="px-3 py-3"><Badge className={rule.priority === "Khẩn cấp" ? "bg-red-50 text-red-700 border border-red-200" : "bg-orange-50 text-orange-700 border border-orange-200"}>{rule.priority}</Badge></TableCell>
                <TableCell className="px-3 py-3"><Badge className={rule.enabled ? "bg-emerald-50 text-emerald-700 border border-emerald-200" : "bg-slate-100 text-slate-600 border border-slate-200"}>{rule.enabled ? "Đang bật" : "Đang tắt"}</Badge></TableCell>
                <TableCell className="px-3 py-3">
                  <div className="flex gap-1">
                    <Button size="sm" variant="ghost" className="h-7">Sửa</Button>
                    <Button size="sm" variant="outline" className="h-7" onClick={() => setRules((prev) => prev.map((item, i) => i === index ? { ...item, enabled: !item.enabled } : item))}>
                      {rule.enabled ? "Tắt" : "Bật"}
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

function UsersTab() {
  const [query, setQuery] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const filtered = useMemo(() => {
    const normalized = query.toLowerCase();
    return users.filter((user) => [user.name, user.email, user.username, user.department, user.role].some((value) => value.toLowerCase().includes(normalized)));
  }, [query]);

  return (
    <>
      <Card className="border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <CardHeader>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <CardTitle>Người dùng</CardTitle>
              <CardDescription>Quản lý tài khoản tham gia hệ thống nghiên cứu.</CardDescription>
            </div>
            <Button className="gap-2" onClick={() => setModalOpen(true)}><Plus className="h-4 w-4" /> Thêm người dùng</Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Tìm kiếm người dùng..." className="h-9 pl-9" />
          </div>
          <Table>
            <TableHeader>
              <TableRow className="bg-slate-50 dark:bg-slate-950">
                {["Họ và tên", "Email", "Tên đăng nhập", "Khoa/Phòng", "Vai trò", "Trạng thái", "Lần đăng nhập cuối", "Thao tác"].map((head) => (
                  <TableHead key={head} className="px-3 py-2 text-[10px] font-semibold uppercase text-slate-500">{head}</TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((user) => (
                <TableRow key={user.username}>
                  <TableCell className="px-3 py-3 text-xs font-semibold text-slate-800 dark:text-slate-100">{user.name}</TableCell>
                  <TableCell className="px-3 py-3 text-xs">{user.email}</TableCell>
                  <TableCell className="px-3 py-3 text-xs">{user.username}</TableCell>
                  <TableCell className="px-3 py-3 text-xs">{user.department}</TableCell>
                  <TableCell className="px-3 py-3 text-xs">{user.role}</TableCell>
                  <TableCell className="px-3 py-3"><Badge className="bg-emerald-50 text-emerald-700 border border-emerald-200">{user.status}</Badge></TableCell>
                  <TableCell className="px-3 py-3 text-xs">{user.lastLogin}</TableCell>
                  <TableCell className="px-3 py-3">
                    <div className="flex gap-1">
                      <Button size="sm" variant="ghost" className="h-7">Xem</Button>
                      <Button size="sm" variant="ghost" className="h-7">Sửa</Button>
                      <Button size="sm" variant="outline" className="h-7">Khóa</Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>Thêm người dùng</DialogTitle>
          </DialogHeader>
          <div className="grid gap-3 sm:grid-cols-2">
            {["Họ và tên", "Email", "Tên đăng nhập", "Khoa/Phòng"].map((label) => (
              <label key={label} className="space-y-1 text-xs font-medium text-slate-600">
                <span>{label}</span>
                <Input className="h-9" />
              </label>
            ))}
            <label className="space-y-1 text-xs font-medium text-slate-600">
              <span>Vai trò</span>
              <Select defaultValue="Thành viên nghiên cứu">
                <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {roles.map((role) => <SelectItem key={role.code} value={role.name}>{role.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </label>
            <label className="space-y-1 text-xs font-medium text-slate-600">
              <span>Trạng thái</span>
              <Select defaultValue="Hoạt động">
                <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Hoạt động">Hoạt động</SelectItem>
                  <SelectItem value="Tạm khóa">Tạm khóa</SelectItem>
                </SelectContent>
              </Select>
            </label>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setModalOpen(false)}>Hủy</Button>
            <Button onClick={() => setModalOpen(false)}>Lưu</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

function RolesTab() {
  return (
    <Card className="border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <CardHeader>
        <CardTitle>Vai trò</CardTitle>
        <CardDescription>Nhóm quyền theo trách nhiệm vận hành nghiên cứu trong bệnh viện.</CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow className="bg-slate-50 dark:bg-slate-950">
              {["Mã vai trò", "Tên vai trò", "Mô tả", "Số người dùng", "Trạng thái", "Thao tác"].map((head) => (
                <TableHead key={head} className="px-3 py-2 text-[10px] font-semibold uppercase text-slate-500">{head}</TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {roles.map((role) => (
              <TableRow key={role.code}>
                <TableCell className="px-3 py-3 font-mono text-xs">{role.code}</TableCell>
                <TableCell className="px-3 py-3 text-xs font-semibold text-slate-800 dark:text-slate-100">{role.name}</TableCell>
                <TableCell className="px-3 py-3 text-xs">{role.description}</TableCell>
                <TableCell className="px-3 py-3 text-xs">{role.count}</TableCell>
                <TableCell className="px-3 py-3"><Badge className="bg-emerald-50 text-emerald-700 border border-emerald-200">{role.status}</Badge></TableCell>
                <TableCell className="px-3 py-3">
                  <div className="flex gap-1">
                    <Button size="sm" variant="ghost" className="h-7">Xem quyền</Button>
                    <Button size="sm" variant="ghost" className="h-7"><Pencil className="h-3.5 w-3.5" /> Sửa</Button>
                    <Button size="sm" variant="outline" className="h-7">Xóa</Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

function PermissionsTab() {
  const [role, setRole] = useState("Phòng Quản lý Nghiên cứu");
  const [saved, setSaved] = useState(false);

  return (
    <Card className="border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <CardHeader>
        <CardTitle>Quyền hạn</CardTitle>
        <CardDescription>Ma trận phân quyền theo phân hệ và thao tác.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap items-center gap-3">
          <label className="text-sm font-semibold text-slate-700 dark:text-slate-200">Chọn vai trò</label>
          <Select value={role} onValueChange={(value) => value && setRole(value)}>
            <SelectTrigger className="h-9 w-72"><SelectValue /></SelectTrigger>
            <SelectContent>
              {roles.map((item) => <SelectItem key={item.code} value={item.name}>{item.name}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <Table>
          <TableHeader>
            <TableRow className="bg-slate-50 dark:bg-slate-950">
              <TableHead className="px-3 py-2 text-[10px] font-semibold uppercase text-slate-500">Phân hệ</TableHead>
              {permissionActions.map((action) => (
                <TableHead key={action} className="px-3 py-2 text-center text-[10px] font-semibold uppercase text-slate-500">{action}</TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {permissionModules.map((module, rowIndex) => (
              <TableRow key={module}>
                <TableCell className="px-3 py-3 text-xs font-semibold text-slate-800 dark:text-slate-100">{module}</TableCell>
                {permissionActions.map((action, actionIndex) => (
                  <TableCell key={action} className="px-3 py-3 text-center">
                    <input
                      type="checkbox"
                      defaultChecked={rowIndex < 6 || actionIndex === 0}
                      className="h-4 w-4 rounded border-slate-300 text-blue-600"
                      aria-label={`${module} ${action}`}
                    />
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
        <div className="flex items-center gap-3">
          <Button onClick={() => setSaved(true)}>Lưu phân quyền</Button>
          {saved && <span className="text-sm font-medium text-emerald-600">Đã lưu phân quyền cho vai trò {role}.</span>}
        </div>
      </CardContent>
    </Card>
  );
}

function AuditLogTab() {
  const [query, setQuery] = useState("");
  const [action, setAction] = useState("Tất cả");
  const filtered = auditLogs.filter((log) => {
    const matchesAction = action === "Tất cả" || log.action === action;
    const matchesQuery = [log.time, log.user, log.module, log.target, log.content].some((value) => value.toLowerCase().includes(query.toLowerCase()));
    return matchesAction && matchesQuery;
  });

  return (
    <Card className="border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <CardHeader>
        <CardTitle>Nhật ký hệ thống</CardTitle>
        <CardDescription>Theo dõi hoạt động quản trị và cập nhật dữ liệu quan trọng.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap gap-3">
          <div className="relative min-w-64 flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Tìm kiếm nhật ký..." className="h-9 pl-9" />
          </div>
          <Select value={action} onValueChange={(value) => value && setAction(value)}>
            <SelectTrigger className="h-9 w-44"><SelectValue /></SelectTrigger>
            <SelectContent>
              {["Tất cả", "Đăng nhập", "Thêm", "Sửa", "Xóa", "Xuất dữ liệu"].map((item) => <SelectItem key={item} value={item}>{item}</SelectItem>)}
            </SelectContent>
          </Select>
          <Input className="h-9 w-40" placeholder="Chọn ngày" />
        </div>
        <Table>
          <TableHeader>
            <TableRow className="bg-slate-50 dark:bg-slate-950">
              {["Thời gian", "Người dùng", "Phân hệ", "Hành động", "Đối tượng", "Nội dung", "Trạng thái"].map((head) => (
                <TableHead key={head} className="px-3 py-2 text-[10px] font-semibold uppercase text-slate-500">{head}</TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((log) => (
              <TableRow key={`${log.time}-${log.target}`}>
                <TableCell className="px-3 py-3 text-xs">{log.time}</TableCell>
                <TableCell className="px-3 py-3 text-xs font-semibold text-slate-800 dark:text-slate-100">{log.user}</TableCell>
                <TableCell className="px-3 py-3 text-xs">{log.module}</TableCell>
                <TableCell className="px-3 py-3 text-xs">{log.action}</TableCell>
                <TableCell className="px-3 py-3 text-xs">{log.target}</TableCell>
                <TableCell className="px-3 py-3 text-xs">{log.content}</TableCell>
                <TableCell className="px-3 py-3"><Badge className="bg-emerald-50 text-emerald-700 border border-emerald-200">{log.status}</Badge></TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
