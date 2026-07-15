"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
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
import UserManagementTab from "@/components/admin/UserManagementTab";
import RoleManagementTab from "@/components/admin/RoleManagementTab";
import { adminApi, type ApiAdminRole, type ApiPermission, type ApiRolePermissionMatrix, type ApiSetting } from "@/lib/api/admin-api";
import { auditApi, type ApiAuditLog } from "@/lib/api/audit-api";
import { notificationApi, type ApiNotificationRule, type ApiNotificationSettings } from "@/lib/api/notification-api";

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

const GENERAL_SETTING_DEFS = [
  { key: "system.name", label: "Tên hệ thống", valueType: "string", group: "general", name: "Tên hệ thống", defaultValue: "ResearchTracker RMS" },
  { key: "system.organization", label: "Đơn vị triển khai", valueType: "string", group: "general", name: "Đơn vị triển khai", defaultValue: "Bệnh viện Đa khoa Thành phố" },
  { key: "system.timezone", label: "Múi giờ", valueType: "string", group: "general", name: "Múi giờ", defaultValue: "Asia/Ho_Chi_Minh" },
  { key: "system.language", label: "Ngôn ngữ mặc định", valueType: "string", group: "general", name: "Ngôn ngữ mặc định", defaultValue: "Tiếng Việt" },
  { key: "system.date_format", label: "Định dạng ngày", valueType: "string", group: "general", name: "Định dạng ngày", defaultValue: "dd/MM/yyyy" },
  { key: "system.working_year", label: "Năm làm việc", valueType: "number", group: "general", name: "Năm làm việc", defaultValue: "2026" },
  { key: "research.warning_days", label: "Ngưỡng cảnh báo sắp trễ", valueType: "number", group: "research", name: "Ngưỡng cảnh báo sắp trễ", defaultValue: "7" },
  { key: "research.low_progress_threshold", label: "Ngưỡng tiến độ thấp hơn kế hoạch", valueType: "number", group: "research", name: "Ngưỡng tiến độ thấp hơn kế hoạch", defaultValue: "20" },
  { key: "research.auto_status", label: "Tự động tính trạng thái module", valueType: "boolean", group: "research", name: "Tự động tính trạng thái module", defaultValue: "true" },
  { key: "research.auto_delay", label: "Tự động tính số ngày trễ", valueType: "boolean", group: "research", name: "Tự động tính số ngày trễ", defaultValue: "true" },
] as const;

type GeneralSettingKey = typeof GENERAL_SETTING_DEFS[number]["key"];

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

function getErrorMessage(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback;
}

function formatDateTime(value?: string | null) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString("vi-VN");
}

function settingPayload(def: typeof GENERAL_SETTING_DEFS[number], value: string) {
  return {
    settingValue: value,
    valueType: def.valueType,
    settingGroup: def.group,
    settingName: def.name,
    description: null,
    isPublic: true,
    isActive: true,
  };
}

async function saveSetting(def: typeof GENERAL_SETTING_DEFS[number], value: string, existing?: ApiSetting) {
  const payload = settingPayload(def, value);
  if (existing) {
    return adminApi.updateSetting(def.key, payload);
  }
  return adminApi.createSetting({ settingKey: def.key, ...payload });
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
  const [settings, setSettings] = useState<Record<GeneralSettingKey, string>>(() =>
    Object.fromEntries(GENERAL_SETTING_DEFS.map((def) => [def.key, def.defaultValue])) as Record<GeneralSettingKey, string>
  );
  const [existingSettings, setExistingSettings] = useState<Record<GeneralSettingKey, ApiSetting | undefined>>({} as Record<GeneralSettingKey, ApiSetting | undefined>);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState("");

  const loadSettings = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const result = await adminApi.getSettings({ pageSize: 200 });
      const nextSettings = Object.fromEntries(GENERAL_SETTING_DEFS.map((def) => [def.key, def.defaultValue])) as Record<GeneralSettingKey, string>;
      const nextExisting = {} as Record<GeneralSettingKey, ApiSetting | undefined>;
      for (const item of result.items) {
        const def = GENERAL_SETTING_DEFS.find((entry) => entry.key === item.settingKey);
        if (def) {
          nextSettings[def.key] = item.settingValue ?? def.defaultValue;
          nextExisting[def.key] = item;
        }
      }
      setSettings(nextSettings);
      setExistingSettings(nextExisting);
    } catch (loadError) {
      setError(getErrorMessage(loadError, "Không tải được cài đặt hệ thống."));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadSettings();
  }, [loadSettings]);

  const updateSettingValue = (key: GeneralSettingKey, value: string) => {
    setSaved("");
    setSettings((prev) => ({ ...prev, [key]: value }));
  };

  const handleSave = async () => {
    setSaving(true);
    setError("");
    setSaved("");
    try {
      const savedSettings = await Promise.all(GENERAL_SETTING_DEFS.map((def) => saveSetting(def, settings[def.key], existingSettings[def.key])));
      const nextExisting = {} as Record<GeneralSettingKey, ApiSetting | undefined>;
      for (const item of savedSettings) {
        const def = GENERAL_SETTING_DEFS.find((entry) => entry.key === item.settingKey);
        if (def) nextExisting[def.key] = item;
      }
      setExistingSettings((prev) => ({ ...prev, ...nextExisting }));
      setSaved("Đã lưu cài đặt hệ thống.");
      await loadSettings();
    } catch (saveError) {
      setError(getErrorMessage(saveError, "Không lưu được cài đặt hệ thống."));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-5">
      {loading && <Card><CardContent className="p-4 text-sm text-slate-500">Đang tải cài đặt hệ thống...</CardContent></Card>}
      {error && <Card className="border-red-200 bg-red-50"><CardContent className="p-4 text-sm font-medium text-red-700">{error}</CardContent></Card>}
      <div className="grid gap-5 xl:grid-cols-2">
        <Card className="border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <CardHeader>
            <CardTitle>Thông tin hệ thống</CardTitle>
            <CardDescription>Thông tin vận hành chung của ResearchTracker RMS.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3 sm:grid-cols-2">
            {GENERAL_SETTING_DEFS.slice(0, 6).map((def) => (
              <div key={def.key} className="rounded-lg border border-slate-200 p-3 dark:border-slate-800">
                <p className="text-xs text-slate-500 dark:text-slate-400">{def.label}</p>
                <Input
                  className="mt-1 h-9 text-sm font-semibold"
                  type={def.valueType === "number" ? "number" : "text"}
                  value={settings[def.key]}
                  onChange={(event) => updateSettingValue(def.key, event.target.value)}
                  disabled={loading || saving}
                />
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
              <Input className="h-9 w-24 text-right" type="number" value={settings["research.warning_days"]} onChange={(event) => updateSettingValue("research.warning_days", event.target.value)} disabled={loading || saving} />
            </SettingRow>
            <SettingRow label="Ngưỡng tiến độ thấp hơn kế hoạch" description="Chênh lệch tiến độ cho phép.">
              <Input className="h-9 w-24 text-right" type="number" value={settings["research.low_progress_threshold"]} onChange={(event) => updateSettingValue("research.low_progress_threshold", event.target.value)} disabled={loading || saving} />
            </SettingRow>
            <SettingRow label="Tự động tính trạng thái module">
              <Toggle checked={settings["research.auto_status"] === "true"} onChange={(value) => updateSettingValue("research.auto_status", String(value))} label="Tự động tính trạng thái module" />
            </SettingRow>
            <SettingRow label="Tự động tính số ngày trễ">
              <Toggle checked={settings["research.auto_delay"] === "true"} onChange={(value) => updateSettingValue("research.auto_delay", String(value))} label="Tự động tính số ngày trễ" />
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
        <Button className="gap-2" onClick={() => void handleSave()} disabled={saving || loading}>
          <Save className="h-4 w-4" />
          {saving ? "Đang lưu..." : "Lưu thay đổi"}
        </Button>
        {saved && <span className="text-sm font-medium text-emerald-600">{saved}</span>}
      </div>
    </div>
  );
}

function NotificationSettingsTab() {
  const [state, setState] = useState<ApiNotificationSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState("");

  const loadSettings = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      setState(await notificationApi.getNotificationSettings());
    } catch (loadError) {
      setError(getErrorMessage(loadError, "Không tải được cấu hình thông báo."));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadSettings();
  }, [loadSettings]);

  const updateState = (updater: (current: ApiNotificationSettings) => ApiNotificationSettings) => {
    setSaved("");
    setState((current) => current ? updater(current) : current);
  };

  const handleSave = async () => {
    if (!state) return;
    setSaving(true);
    setError("");
    setSaved("");
    try {
      const updated = await notificationApi.updateNotificationSettings(state);
      setState(updated);
      setSaved("Đã lưu cấu hình thông báo.");
    } catch (saveError) {
      setError(getErrorMessage(saveError, "Không lưu được cấu hình thông báo."));
    } finally {
      setSaving(false);
    }
  };

  const scanTime = `${String(state?.scannerRunHour ?? 7).padStart(2, "0")}:00`;

  return (
    <Card className="border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <CardHeader>
        <CardTitle>Thông báo</CardTitle>
        <CardDescription>Cấu hình cách hệ thống nhắc hạn nghiên cứu, milestone và đạo đức.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {loading && <div className="rounded-lg border border-slate-200 p-4 text-sm text-slate-500">Đang tải cấu hình thông báo...</div>}
        {error && <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-700">{error}</div>}
        <div className="grid gap-3 lg:grid-cols-2">
          <SettingRow label="Bật thông báo trong hệ thống">
            <Toggle checked={state?.enableInAppNotification ?? false} onChange={(value) => updateState((prev) => ({ ...prev, enableInAppNotification: value, enableSystemNotification: value || prev.enableEmailNotification }))} />
          </SettingRow>
          <SettingRow label="Bật thông báo qua email">
            <Toggle checked={state?.enableEmailNotification ?? false} onChange={(value) => updateState((prev) => ({ ...prev, enableEmailNotification: value, enableSystemNotification: value || prev.enableInAppNotification }))} />
          </SettingRow>
          <SettingRow label="Nhắc deadline nghiên cứu">
            <Toggle checked={(state?.deadlineReminderDays.length ?? 0) > 0} onChange={(value) => updateState((prev) => ({ ...prev, deadlineReminderDays: value ? [7, 3, 1, 0] : [] }))} />
          </SettingRow>
          <SettingRow label="Nhắc milestone sắp đến hạn">
            <Toggle checked={(state?.progressReportReminderDays.length ?? 0) > 0} onChange={(value) => updateState((prev) => ({ ...prev, progressReportReminderDays: value ? [7, 3, 1] : [] }))} />
          </SettingRow>
          <SettingRow label="Nhắc phê duyệt đạo đức sắp hết hạn">
            <Toggle checked={(state?.ethicsReminderDays.length ?? 0) > 0} onChange={(value) => updateState((prev) => ({ ...prev, ethicsReminderDays: value ? [90, 30, 7] : [] }))} />
          </SettingRow>
          <SettingRow label="Thời gian quét thông báo hằng ngày">
            <Input
              type="time"
              className="h-9 w-28"
              value={scanTime}
              disabled={!state || loading || saving}
              onChange={(event) => updateState((prev) => ({ ...prev, scannerRunHour: Number(event.target.value.slice(0, 2)) || 0 }))}
            />
          </SettingRow>
        </div>
        <div className="rounded-lg border border-slate-200 p-4 dark:border-slate-800">
          <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">Các mốc nhắc deadline</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {(state?.deadlineReminderDays ?? []).map((item) => (
              <Badge key={item} className="border-blue-200 bg-blue-50 text-blue-700">{item === 0 ? "Đúng ngày" : `${item} ngày`}</Badge>
            ))}
            {state?.deadlineReminderDays.length === 0 && <span className="text-sm text-slate-400">Đang tắt nhắc deadline.</span>}
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Button onClick={() => void handleSave()} disabled={!state || loading || saving}>{saving ? "Đang lưu..." : "Lưu cấu hình thông báo"}</Button>
          {saved && <span className="text-sm font-medium text-emerald-600">{saved}</span>}
        </div>
      </CardContent>
    </Card>
  );
}

function NotificationRulesTab() {
  const [rules, setRules] = useState<ApiNotificationRule[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingRuleId, setSavingRuleId] = useState<number | null>(null);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState("");

  const loadRules = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const result = await notificationApi.getNotificationRules({ pageSize: 100 });
      setRules(result.items);
    } catch (loadError) {
      setError(getErrorMessage(loadError, "Không tải được quy tắc thông báo."));
      setRules([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadRules();
  }, [loadRules]);

  const toggleRule = async (rule: ApiNotificationRule) => {
    setSavingRuleId(rule.ruleId);
    setError("");
    setSaved("");
    try {
      const updated = rule.isActive
        ? await notificationApi.disableRule(rule.ruleId)
        : await notificationApi.enableRule(rule.ruleId);
      setRules((prev) => prev.map((item) => item.ruleId === updated.ruleId ? updated : item));
      setSaved(`Đã ${updated.isActive ? "bật" : "tắt"} quy tắc ${updated.ruleName}.`);
    } catch (saveError) {
      setError(getErrorMessage(saveError, "Không cập nhật được quy tắc thông báo."));
    } finally {
      setSavingRuleId(null);
    }
  };

  return (
    <Card className="border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <CardHeader>
        <CardTitle>Quy tắc thông báo</CardTitle>
        <CardDescription>Danh sách quy tắc tự động tạo cảnh báo trong hệ thống.</CardDescription>
      </CardHeader>
      <CardContent>
        {loading && <div className="mb-4 rounded-lg border border-slate-200 p-4 text-sm text-slate-500">Đang tải quy tắc thông báo...</div>}
        {error && <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-700">{error}</div>}
        {saved && <div className="mb-4 rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-sm font-medium text-emerald-700">{saved}</div>}
        <Table>
          <TableHeader>
            <TableRow className="bg-slate-50 dark:bg-slate-950">
              {["Mã quy tắc", "Tên quy tắc", "Đối tượng", "Điều kiện", "Số ngày nhắc", "Kênh", "Mức ưu tiên", "Trạng thái", "Thao tác"].map((head) => (
                <TableHead key={head} className="px-3 py-2 text-[10px] font-semibold uppercase text-slate-500">{head}</TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {rules.length === 0 && !loading ? (
              <TableRow><TableCell colSpan={9} className="py-10 text-center text-sm text-slate-400">Không có quy tắc thông báo nào.</TableCell></TableRow>
            ) : rules.map((rule) => (
              <TableRow key={rule.ruleId}>
                <TableCell className="px-3 py-3 font-mono text-xs text-slate-700 dark:text-slate-200">RULE-{rule.ruleId}</TableCell>
                <TableCell className="px-3 py-3 text-xs font-semibold text-slate-800 dark:text-slate-100">{rule.ruleName}</TableCell>
                <TableCell className="px-3 py-3 text-xs">{rule.targetType}</TableCell>
                <TableCell className="px-3 py-3 text-xs">{rule.conditionType}</TableCell>
                <TableCell className="px-3 py-3 text-xs">{rule.remindBeforeDays}</TableCell>
                <TableCell className="px-3 py-3 text-xs">{rule.channels.join(" + ") || "Hệ thống"}</TableCell>
                <TableCell className="px-3 py-3"><Badge className={rule.priorityLevel === "urgent" ? "bg-red-50 text-red-700 border border-red-200" : "bg-orange-50 text-orange-700 border border-orange-200"}>{rule.priorityLevel}</Badge></TableCell>
                <TableCell className="px-3 py-3"><Badge className={rule.isActive ? "bg-emerald-50 text-emerald-700 border border-emerald-200" : "bg-slate-100 text-slate-600 border border-slate-200"}>{rule.isActive ? "Đang bật" : "Đang tắt"}</Badge></TableCell>
                <TableCell className="px-3 py-3">
                  <div className="flex gap-1">
                    <Button size="sm" variant="ghost" className="h-7" disabled title="Chưa hỗ trợ chỉnh sửa quy tắc trong MVP">Sửa</Button>
                    <Button size="sm" variant="outline" className="h-7" disabled={savingRuleId === rule.ruleId} onClick={() => void toggleRule(rule)}>
                      {savingRuleId === rule.ruleId ? "Đang lưu..." : rule.isActive ? "Tắt" : "Bật"}
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
  return <UserManagementTab />;
}

function RolesTab() {
  return <RoleManagementTab />;
}

function PermissionsTab() {
  const [roles, setRoles] = useState<ApiAdminRole[]>([]);
  const [permissions, setPermissions] = useState<ApiPermission[]>([]);
  const [selectedRoleId, setSelectedRoleId] = useState("");
  const [matrix, setMatrix] = useState<ApiRolePermissionMatrix | null>(null);
  const [selectedPermissionIds, setSelectedPermissionIds] = useState<Set<number>>(new Set());
  const [editingPermission, setEditingPermission] = useState<ApiPermission | null>(null);
  const [permissionForm, setPermissionForm] = useState({ moduleName: "", actionName: "", description: "", isActive: true });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savingPermission, setSavingPermission] = useState(false);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState("");

  const loadRoles = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [roleResult, permissionResult] = await Promise.all([
        adminApi.getRoles({ pageSize: 100 }),
        adminApi.getPermissions({ pageSize: 500 }),
      ]);
      setRoles(roleResult.items);
      setPermissions(permissionResult.items);
      setSelectedRoleId((current) => current || String(roleResult.items[0]?.roleId ?? ""));
    } catch (loadError) {
      setError(getErrorMessage(loadError, "Không tải được danh sách vai trò."));
      setRoles([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadRoles();
  }, [loadRoles]);

  useEffect(() => {
    if (!selectedRoleId) {
      setMatrix(null);
      setSelectedPermissionIds(new Set());
      return;
    }
    const loadMatrix = async () => {
      setLoading(true);
      setError("");
      setSaved("");
      try {
        const result = await adminApi.getRolePermissions(selectedRoleId) as ApiRolePermissionMatrix;
        setMatrix(result);
        setSelectedPermissionIds(new Set(result.modules.flatMap((module) => module.actions.filter((action) => action.isAllowed).map((action) => action.permissionId))));
      } catch (loadError) {
        setError(getErrorMessage(loadError, "Không tải được ma trận phân quyền."));
        setMatrix(null);
        setSelectedPermissionIds(new Set());
      } finally {
        setLoading(false);
      }
    };
    void loadMatrix();
  }, [selectedRoleId]);

  const togglePermission = (permissionId: number, checked: boolean) => {
    setSaved("");
    setSelectedPermissionIds((current) => {
      const next = new Set(current);
      if (checked) next.add(permissionId);
      else next.delete(permissionId);
      return next;
    });
  };

  const handleSave = async () => {
    if (!selectedRoleId) return;
    setSaving(true);
    setError("");
    setSaved("");
    try {
      const result = await adminApi.updateRolePermissions(selectedRoleId, { permissionIds: Array.from(selectedPermissionIds) }) as ApiRolePermissionMatrix;
      setMatrix(result);
      setSelectedPermissionIds(new Set(result.modules.flatMap((module) => module.actions.filter((action) => action.isAllowed).map((action) => action.permissionId))));
      setSaved(`Đã lưu phân quyền cho vai trò ${result.roleName}.`);
    } catch (saveError) {
      setError(getErrorMessage(saveError, "Không lưu được phân quyền."));
    } finally {
      setSaving(false);
    }
  };

  const openPermissionEdit = (permission: ApiPermission) => {
    setEditingPermission(permission);
    setPermissionForm({
      moduleName: permission.moduleName,
      actionName: permission.actionName,
      description: permission.description ?? "",
      isActive: permission.isActive,
    });
  };

  const handleSavePermission = async () => {
    if (!editingPermission) return;
    setSavingPermission(true);
    setError("");
    setSaved("");
    try {
      const updated = await adminApi.updatePermission(editingPermission.permissionId, {
        moduleName: permissionForm.moduleName.trim(),
        actionName: permissionForm.actionName.trim(),
        description: permissionForm.description.trim() || null,
        isActive: permissionForm.isActive,
      });
      setPermissions((current) => current.map((item) => item.permissionId === updated.permissionId ? updated : item));
      setEditingPermission(null);
      setSaved(`Đã cập nhật quyền ${updated.permissionCode}.`);
    } catch (saveError) {
      setError(getErrorMessage(saveError, "Không cập nhật được quyền hạn."));
    } finally {
      setSavingPermission(false);
    }
  };

  return (
    <Card className="border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <CardHeader>
        <CardTitle>Quyền hạn</CardTitle>
        <CardDescription>Ma trận phân quyền theo phân hệ và thao tác.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {loading && <div className="rounded-lg border border-slate-200 p-4 text-sm text-slate-500">Đang tải phân quyền...</div>}
        {error && <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-700">{error}</div>}
        <div className="flex flex-wrap items-center gap-3 rounded-lg border border-slate-200 bg-slate-50 p-3">
          <label className="text-sm font-semibold text-slate-700 dark:text-slate-200">Chọn vai trò</label>
          <Select value={selectedRoleId} onValueChange={(value) => value && setSelectedRoleId(value)}>
            <SelectTrigger className="h-9 w-80 text-left">
              <span className="truncate">{roles.find((item) => String(item.roleId) === selectedRoleId)?.roleName ?? "Chọn vai trò"}</span>
            </SelectTrigger>
            <SelectContent>
              {roles.map((item) => <SelectItem key={item.roleId} value={String(item.roleId)}>{item.roleName}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <Table>
          <TableHeader>
            <TableRow className="bg-slate-50 dark:bg-slate-950">
              <TableHead className="px-3 py-2 text-[10px] font-semibold uppercase text-slate-500">Phân hệ</TableHead>
              {(matrix?.modules[0]?.actions ?? []).map((action) => (
                <TableHead key={action.permissionId} className="px-3 py-2 text-center text-[10px] font-semibold uppercase text-slate-500">{action.actionName}</TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {!matrix || matrix.modules.length === 0 ? (
              <TableRow><TableCell colSpan={8} className="py-10 text-center text-sm text-slate-400">Không có dữ liệu phân quyền.</TableCell></TableRow>
            ) : matrix.modules.map((module) => (
              <TableRow key={module.moduleCode}>
                <TableCell className="px-3 py-3 text-xs font-semibold text-slate-800 dark:text-slate-100">{module.moduleName}</TableCell>
                {module.actions.map((action) => (
                  <TableCell key={action.permissionId} className="px-3 py-3 text-center">
                    <input
                      type="checkbox"
                      checked={selectedPermissionIds.has(action.permissionId)}
                      onChange={(event) => togglePermission(action.permissionId, event.target.checked)}
                      disabled={saving || loading}
                      className="h-4 w-4 rounded border-slate-300 text-blue-600"
                      aria-label={`${module.moduleName} ${action.actionName}`}
                    />
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
        <div className="flex items-center gap-3">
          <Button onClick={() => void handleSave()} disabled={!matrix || saving || loading}>{saving ? "Đang lưu..." : "Lưu phân quyền"}</Button>
          {saved && <span className="text-sm font-medium text-emerald-600">{saved}</span>}
        </div>
        <div className="rounded-lg border border-slate-200">
          <div className="border-b border-slate-200 px-4 py-3">
            <h3 className="text-sm font-bold text-slate-800">Danh sách quyền hạn</h3>
            <p className="text-xs text-slate-500">Chỉnh sửa tên hiển thị, mô tả và trạng thái quyền hiện có.</p>
          </div>
          <Table className="w-full table-fixed">
            <TableHeader>
              <TableRow className="bg-slate-50">
                {["Mã quyền", "Phân hệ", "Hành động", "Mô tả", "Trạng thái", "Thao tác"].map((head) => <TableHead key={head} className="px-3 py-2 text-[10px] font-semibold uppercase text-slate-500">{head}</TableHead>)}
              </TableRow>
            </TableHeader>
            <TableBody>
              {permissions.map((permission) => (
                <TableRow key={permission.permissionId}>
                  <TableCell className="px-3 py-3 font-mono text-xs break-words">{permission.permissionCode}</TableCell>
                  <TableCell className="px-3 py-3 text-sm font-medium text-slate-800 break-words">{permission.moduleName}</TableCell>
                  <TableCell className="px-3 py-3 text-sm text-slate-700 break-words">{permission.actionName}</TableCell>
                  <TableCell className="px-3 py-3 text-xs text-slate-500 break-words">{permission.description || "—"}</TableCell>
                  <TableCell className="px-3 py-3"><Badge className={permission.isActive ? "bg-emerald-50 text-emerald-700 border border-emerald-200" : "bg-slate-100 text-slate-600 border border-slate-200"}>{permission.isActive ? "Đang bật" : "Đang tắt"}</Badge></TableCell>
                  <TableCell className="px-3 py-3 text-right"><Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={() => openPermissionEdit(permission)}><Pencil className="h-3.5 w-3.5" /></Button></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
      <Dialog open={!!editingPermission} onOpenChange={(open) => !open && setEditingPermission(null)}>
        <DialogContent className="sm:max-w-xl">
          <DialogHeader><DialogTitle>Cập nhật quyền hạn</DialogTitle></DialogHeader>
          {editingPermission && (
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2 rounded-lg border border-slate-200 bg-slate-50 p-3">
                <p className="text-xs font-semibold uppercase text-slate-500">Mã quyền</p>
                <p className="mt-1 font-mono text-sm font-bold text-slate-800">{editingPermission.permissionCode}</p>
              </div>
              <label className="space-y-1.5 text-xs font-semibold text-slate-600">Tên phân hệ<Input value={permissionForm.moduleName} onChange={(e) => setPermissionForm((current) => ({ ...current, moduleName: e.target.value }))} /></label>
              <label className="space-y-1.5 text-xs font-semibold text-slate-600">Tên hành động<Input value={permissionForm.actionName} onChange={(e) => setPermissionForm((current) => ({ ...current, actionName: e.target.value }))} /></label>
              <label className="sm:col-span-2 space-y-1.5 text-xs font-semibold text-slate-600">Mô tả<Input value={permissionForm.description} onChange={(e) => setPermissionForm((current) => ({ ...current, description: e.target.value }))} /></label>
              <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={permissionForm.isActive} onChange={(e) => setPermissionForm((current) => ({ ...current, isActive: e.target.checked }))} /> Quyền đang bật</label>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" disabled={savingPermission} onClick={() => setEditingPermission(null)}>Hủy</Button>
            <Button disabled={savingPermission} onClick={() => void handleSavePermission()}>{savingPermission ? "Đang lưu..." : "Lưu quyền"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}

function AuditLogTab() {
  const [query, setQuery] = useState("");
  const [action, setAction] = useState("Tất cả");
  const [date, setDate] = useState("");
  const [logs, setLogs] = useState<ApiAuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const actionMap: Record<string, string | undefined> = {
    "Tất cả": undefined,
    "Đăng nhập": "login",
    "Thêm": "create",
    "Sửa": "update",
    "Xóa": "delete",
    "Xuất dữ liệu": "export",
  };

  const loadLogs = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const fromDate = date ? `${date}T00:00:00` : undefined;
      const toDate = date ? `${date}T23:59:59` : undefined;
      const result = await auditApi.getAuditLogs({
        pageSize: 100,
        search: query || undefined,
        actionType: actionMap[action],
        fromDate,
        toDate,
      });
      setLogs(result.items);
    } catch (loadError) {
      setError(getErrorMessage(loadError, "Không tải được nhật ký hệ thống."));
      setLogs([]);
    } finally {
      setLoading(false);
    }
  }, [action, date, query]);

  useEffect(() => {
    const timer = window.setTimeout(() => void loadLogs(), 250);
    return () => window.clearTimeout(timer);
  }, [loadLogs]);

  return (
    <Card className="border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <CardHeader>
        <CardTitle>Nhật ký hệ thống</CardTitle>
        <CardDescription>Theo dõi hoạt động quản trị và cập nhật dữ liệu quan trọng.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {loading && <div className="rounded-lg border border-slate-200 p-4 text-sm text-slate-500">Đang tải nhật ký hệ thống...</div>}
        {error && <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-700">{error}</div>}
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
          <Input type="date" className="h-9 w-40" value={date} onChange={(event) => setDate(event.target.value)} />
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
            {logs.length === 0 && !loading ? (
              <TableRow><TableCell colSpan={7} className="py-10 text-center text-sm text-slate-400">Không có nhật ký phù hợp.</TableCell></TableRow>
            ) : logs.map((log) => (
              <TableRow key={log.activityLogId}>
                <TableCell className="px-3 py-3 text-xs">{formatDateTime(log.performedAt)}</TableCell>
                <TableCell className="px-3 py-3 text-xs font-semibold text-slate-800 dark:text-slate-100">{log.performedByName ?? "Hệ thống"}</TableCell>
                <TableCell className="px-3 py-3 text-xs">{log.moduleCode}</TableCell>
                <TableCell className="px-3 py-3 text-xs">{log.actionType}</TableCell>
                <TableCell className="px-3 py-3 text-xs">{log.entityType ?? "—"}{log.entityId ? ` #${log.entityId}` : ""}</TableCell>
                <TableCell className="px-3 py-3 text-xs">{log.actionSummary}</TableCell>
                <TableCell className="px-3 py-3"><Badge className={log.success ? "bg-emerald-50 text-emerald-700 border border-emerald-200" : "bg-red-50 text-red-700 border border-red-200"}>{log.success ? "Thành công" : "Thất bại"}</Badge></TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
