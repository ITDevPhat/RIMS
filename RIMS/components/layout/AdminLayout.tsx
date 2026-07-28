"use client";

import { useEffect, useState } from "react";
import Sidebar, { type PageKey } from "./Sidebar";
import Topbar from "./Topbar";
import { cn } from "@/lib/utils";

interface AdminLayoutProps {
  activePage: PageKey;
  onNavigate: (page: PageKey) => void;
  onOpenProfile: () => void;
  onOpenNotifications: () => void;
  onSearchProjects: (query: string) => void;
  onLogout: () => void;
  children: React.ReactNode;
}

export default function AdminLayout({
  activePage,
  onNavigate,
  onOpenProfile,
  onOpenNotifications,
  onSearchProjects,
  onLogout,
  children,
}: AdminLayoutProps) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const syncLayout = () => {
      const narrow = window.innerWidth < 768;
      if (narrow) setMobileOpen(false);
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
      {mobileOpen && <button type="button" aria-label="Đóng menu" className="fixed inset-0 z-40 bg-slate-950/40 md:hidden" onClick={() => setMobileOpen(false)} />}

      <div
        className={cn(
          "flex min-h-screen flex-col transition-all duration-200",
          "ml-0",
          collapsed ? "md:ml-[76px]" : "md:ml-[260px]"
        )}
      >
        <Topbar
          sidebarCollapsed={collapsed}
          onToggleSidebar={() => window.innerWidth < 768 ? setMobileOpen((v) => !v) : setCollapsed((v) => !v)}
          onOpenProfile={onOpenProfile}
          onOpenNotifications={onOpenNotifications}
          onNavigate={onNavigate}
          onSearchProjects={onSearchProjects}
          onLogout={onLogout}
        />

        <main className="flex-1 overflow-x-hidden overflow-y-auto">{children}</main>
      </div>
    </div>
  );
}
