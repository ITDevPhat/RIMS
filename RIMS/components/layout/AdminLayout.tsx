"use client";

import { useEffect, useState } from "react";
import Sidebar, { type PageKey } from "./Sidebar";
import Topbar from "./Topbar";
import { cn } from "@/lib/utils";

interface AdminLayoutProps {
  activePage: PageKey;
  onNavigate: (page: PageKey) => void;
  onOpenNotifications: () => void;
  onSearchProjects: (query: string) => void;
  onLogout: () => void;
  children: React.ReactNode;
}

export default function AdminLayout({
  activePage,
  onNavigate,
  onOpenNotifications,
  onSearchProjects,
  onLogout,
  children,
}: AdminLayoutProps) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const initialWidth = window.innerWidth;
    if (initialWidth >= 768 && initialWidth < 1366) setCollapsed(true);

    const syncLayout = () => {
      const narrow = window.innerWidth < 1024;
      if (narrow) setMobileOpen(false);
      if (window.innerWidth >= 768 && window.innerWidth < 1366) setCollapsed(true);
    };

    syncLayout();
    window.addEventListener("resize", syncLayout);
    return () => window.removeEventListener("resize", syncLayout);
  }, []);

  return (
    <div className="min-h-screen bg-slate-50">
      <Sidebar
        activePage={activePage}
        onNavigate={onNavigate}
        collapsed={collapsed}
        mobileOpen={mobileOpen}
        onCloseMobile={() => setMobileOpen(false)}
      />
      {mobileOpen && <button type="button" aria-label="Đóng menu" className="fixed inset-0 z-40 bg-slate-950/40 lg:hidden" onClick={() => setMobileOpen(false)} />}

      <div
        className={cn(
          "flex min-h-screen flex-col transition-all duration-200",
          "ml-0",
          collapsed ? "lg:ml-[76px]" : "lg:ml-[260px]"
        )}
      >
        <Topbar
          sidebarCollapsed={collapsed}
          onToggleSidebar={() => window.innerWidth < 1024 ? setMobileOpen((v) => !v) : setCollapsed((v) => !v)}
          onOpenNotifications={onOpenNotifications}
          onNavigate={onNavigate}
          onSearchProjects={onSearchProjects}
          onLogout={onLogout}
        />

        <main className="min-w-0 flex-1 overflow-x-clip overflow-y-auto [container-type:inline-size]">{children}</main>
      </div>
    </div>
  );
}
