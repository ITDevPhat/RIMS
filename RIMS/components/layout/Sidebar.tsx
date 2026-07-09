"use client";

import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  FlaskConical,
  Layers,
  Target,
  CalendarX2,
  GraduationCap,
  Settings,
  Microscope,
} from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export type PageKey =
  | "tong-quan"
  | "de-tai"
  | "giai-doan"
  | "moc-tien-do"
  | "han-chot"
  | "mang-dao-tao"
  | "cai-dat";

interface SidebarItem {
  key: PageKey;
  label: string;
  icon: React.ElementType;
}

const sidebarItems: SidebarItem[] = [
  { key: "tong-quan", label: "Tổng quan tiến độ", icon: LayoutDashboard },
  { key: "de-tai", label: "Đề tài nghiên cứu", icon: FlaskConical },
  { key: "giai-doan", label: "Giai đoạn", icon: Layers },
  { key: "moc-tien-do", label: "Mốc tiến độ", icon: Target },
  { key: "han-chot", label: "Hạn chót", icon: CalendarX2 },
  { key: "mang-dao-tao", label: "Mảng đào tạo", icon: GraduationCap },
  { key: "cai-dat", label: "Cài đặt", icon: Settings },
];

interface SidebarProps {
  activePage: PageKey;
  onNavigate: (page: PageKey) => void;
  collapsed: boolean;
}

export default function Sidebar({
  activePage,
  onNavigate,
  collapsed,
}: SidebarProps) {
  return (
    <TooltipProvider delay={120}>
      <aside
        className={cn(
          "fixed left-0 top-0 z-40 flex h-screen flex-col overflow-hidden border-r border-slate-200 bg-white shadow-sm transition-[width] duration-200 dark:border-slate-800 dark:bg-slate-950",
          collapsed ? "w-[76px]" : "w-[260px]"
        )}
      >
        {/* Brand */}
        <div
          className={cn(
            "flex h-14 flex-shrink-0 items-center overflow-hidden border-b border-slate-200 transition-all duration-200 dark:border-slate-800",
            collapsed ? "justify-center px-2" : "gap-3 px-5"
          )}
        >
          <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-blue-600 shadow-sm">
            <Microscope className="h-5 w-5 text-white" />
          </div>

          {!collapsed && (
            <div className="min-w-0 flex-1">
              <div className="truncate text-sm font-bold leading-tight text-slate-800">
                ResearchTracker
              </div>
              <div className="truncate text-[10px] leading-tight text-slate-500">
                Quản lý nghiên cứu BV
              </div>
            </div>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex flex-1 flex-col gap-1 overflow-x-hidden overflow-y-auto px-2 py-3">
          {!collapsed && (
            <p className="mb-1 px-2 text-[9px] font-semibold uppercase tracking-widest text-slate-400">
              Menu
            </p>
          )}

          {sidebarItems.map((item) => {
            const Icon = item.icon;
            const isActive = activePage === item.key;
            const isTrainingSection = item.key === "mang-dao-tao";

            const menuButton = (
              <button
                type="button"
                onClick={() => onNavigate(item.key)}
                className={cn(
                  "group relative flex h-11 items-center overflow-hidden rounded-xl transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-blue-200",
                  collapsed
                    ? "w-full justify-center px-0"
                    : "w-full gap-3 px-3",
                  isActive
                    ? "bg-blue-600 text-white shadow-sm"
                    : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                )}
                aria-label={item.label}
              >
                {collapsed && isActive && (
                  <span className="absolute left-0 top-1/2 h-7 w-1 -translate-y-1/2 rounded-r-full bg-white/80" />
                )}

                <Icon
                  className={cn(
                    "h-5 w-5 flex-shrink-0 transition-colors",
                    isActive
                      ? "text-white"
                      : "text-slate-400 group-hover:text-slate-700"
                  )}
                />

                {!collapsed && (
                  <>
                    <span className="min-w-0 flex-1 truncate text-left text-sm font-medium">{item.label}</span>

                    {isActive && (
                      <span className="ml-auto h-1.5 w-1.5 rounded-full bg-white/80" />
                    )}
                  </>
                )}
              </button>
            );

            return (
              <div key={item.key} className="min-w-0">
                {isTrainingSection && (
                  <div
                    className={cn(
                      "mb-1 mt-2",
                      collapsed ? "mx-2 border-t border-slate-200 pt-2" : ""
                    )}
                  >
                    {!collapsed && (
                      <p className="mb-1 px-2 text-[9px] font-semibold uppercase tracking-widest text-slate-400">
                        Đào tạo
                      </p>
                    )}
                  </div>
                )}

                {collapsed ? (
                  <Tooltip>
                    <TooltipTrigger render={menuButton} />
                    <TooltipContent
                      side="right"
                      sideOffset={8}
                      className="z-[9999] text-xs"
                    >
                      {item.label}
                    </TooltipContent>
                  </Tooltip>
                ) : (
                  menuButton
                )}
              </div>
            );
          })}
        </nav>

        {!collapsed && (
          <div className="border-t border-slate-200 px-5 py-3">
            <p className="truncate text-[10px] text-slate-400">Phiên bản 1.0 - Beta</p>
          </div>
        )}
      </aside>
    </TooltipProvider>
  );
}
