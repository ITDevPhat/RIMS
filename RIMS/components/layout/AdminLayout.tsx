"use client";

import { useEffect, useState } from "react";
import Sidebar, { type PageKey } from "./Sidebar";
import Topbar from "./Topbar";
import { cn } from "@/lib/utils";

interface AdminLayoutProps {
  activePage: PageKey;
  onNavigate: (page: PageKey) => void;
  onOpenProfile: () => void;
  onLogout: () => void;
  children: React.ReactNode;
}

export default function AdminLayout({
  activePage,
  onNavigate,
  onOpenProfile,
  onLogout,
  children,
}: AdminLayoutProps) {
  const [isNarrow, setIsNarrow] = useState(false);
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    const syncLayout = () => {
      const narrow = window.innerWidth < 768;
      setIsNarrow(narrow);
      if (narrow) {
        setCollapsed(true);
      }
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
      />

      <div
        className={cn(
          "flex min-h-screen flex-col transition-all duration-200",
          isNarrow ? "ml-[76px]" : collapsed ? "ml-[76px]" : "ml-[260px]"
        )}
      >
        <Topbar
          sidebarCollapsed={collapsed}
          onToggleSidebar={() => setCollapsed((v) => !v)}
          onOpenProfile={onOpenProfile}
          onLogout={onLogout}
        />

        <main className="flex-1 overflow-x-hidden overflow-y-auto">{children}</main>
      </div>
    </div>
  );
}
