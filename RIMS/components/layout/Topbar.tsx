"use client";

import { useState } from "react";
import { PanelLeftClose, PanelLeftOpen, Search } from "lucide-react";
import { NotificationDropdown } from "@/components/common/NotificationDropdown";
import { cn } from "@/lib/utils";
import { UserMenu } from "./UserMenu";
import type { PageKey } from "./Sidebar";

interface TopbarProps {
  sidebarCollapsed: boolean;
  onToggleSidebar: () => void;
  onOpenNotifications: () => void;
  onNavigate: (page: PageKey) => void;
  onSearchProjects: (query: string) => void;
  onLogout: () => void | Promise<void>;
}

export default function Topbar({ sidebarCollapsed, onToggleSidebar, onOpenNotifications, onNavigate, onSearchProjects, onLogout }: TopbarProps) {
  const [searchValue, setSearchValue] = useState("");
  return <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-slate-200 bg-white px-4 shadow-sm dark:border-slate-800 dark:bg-slate-950">
    <div className="flex min-w-0 items-center gap-3">
      <button type="button" onClick={onToggleSidebar} title={sidebarCollapsed ? "Mở rộng thanh bên" : "Thu gọn thanh bên"} aria-label={sidebarCollapsed ? "Mở rộng thanh bên" : "Thu gọn thanh bên"} className={cn("flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 shadow-sm transition dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300", "hover:border-slate-300 hover:bg-slate-50 hover:text-slate-800 dark:hover:bg-slate-800", "focus:outline-none focus:ring-2 focus:ring-blue-200")}>
        {sidebarCollapsed ? <PanelLeftOpen className="h-5 w-5" /> : <PanelLeftClose className="h-5 w-5" />}
      </button>
      <div className="relative hidden items-center sm:flex"><Search className="pointer-events-none absolute left-3 h-3.5 w-3.5 text-slate-400" /><input type="text" value={searchValue} onChange={e => setSearchValue(e.target.value)} onKeyDown={e => { if (e.key === "Enter" && searchValue.trim()) onSearchProjects(searchValue.trim()); }} placeholder="Tìm kiếm đề tài..." className="h-8 w-56 rounded-lg border border-slate-200 bg-slate-50 pl-8 pr-3 text-xs text-slate-700 outline-none transition placeholder:text-slate-400 focus:w-72 focus:border-blue-400 focus:bg-white focus:ring-2 focus:ring-blue-100 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200" /></div>
    </div>
    <div className="flex flex-shrink-0 items-center gap-2"><NotificationDropdown onViewAll={onOpenNotifications} onNavigate={onNavigate} /><UserMenu onLogout={onLogout} /></div>
  </header>;
}
