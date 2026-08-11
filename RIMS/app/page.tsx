"use client";

import { useState } from "react";
import { AuthProvider, useAuth } from "@/lib/auth-context";
import { DateFormatProvider } from "@/lib/date-format";
import { ThemeModeProvider } from "@/lib/theme-mode";
import AdminLayout from "@/components/layout/AdminLayout";
import type { PageKey } from "@/components/layout/Sidebar";
import LoginPage from "@/components/pages/LoginPage";
import TongQuanTienDo from "@/components/pages/TongQuanTienDo";
import DeTaiList from "@/components/pages/DeTaiList";
import ChiTietDeTai from "@/components/pages/ChiTietDeTai";
import QuanLyGiaiDoan from "@/components/pages/QuanLyGiaiDoan";
import QuanLyMocTienDo from "@/components/pages/QuanLyMocTienDo";
import HanChotPage from "@/components/pages/HanChotPage";
import MangDaoTaoPage from "@/components/pages/MangDaoTaoPage";
import ThongTinCaNhan from "@/components/pages/ThongTinCaNhan";
import CaiDat from "@/components/pages/CaiDat";
import TrungTamThongBao from "@/components/pages/TrungTamThongBao";
import NhatKyHeThong from "@/components/pages/NhatKyHeThong";
import BaoCao from "@/components/pages/BaoCao";
import type { ResearchProject } from "@/lib/types";

// Inner app — can read auth context
function AppInner() {
  const { isLoggedIn, isRestoring, logout } = useAuth();
  const [activePage, setActivePage] = useState<PageKey>("tong-quan");
  const [selectedProject, setSelectedProject] = useState<ResearchProject | null>(null);
  const [showProfile, setShowProfile] = useState(false);
  const [projectSearch, setProjectSearch] = useState("");

  // Sync logout
  const handleLogout = async () => {
    await logout();
    setShowProfile(false);
    setSelectedProject(null);
  };

  const handleLoginSuccess = () => {
    setShowProfile(false);
  };

  if (isRestoring) {
    return <div className="flex min-h-screen items-center justify-center bg-slate-100 text-sm text-slate-500">Đang khôi phục phiên đăng nhập...</div>;
  }

  if (!isLoggedIn) {
    return <LoginPage onLoginSuccess={handleLoginSuccess} />;
  }

  const handleSidebarNavigate = (page: PageKey) => {
    setSelectedProject(null);
    setShowProfile(false);
    setActivePage(page);
  };

  const handleViewDetail = (project: ResearchProject) => {
    setSelectedProject(project);
    setShowProfile(false);
    setActivePage("de-tai");
  };

  const renderContent = () => {
    // Profile page takes priority
    if (showProfile) {
      return (
        <ThongTinCaNhan onBack={() => setShowProfile(false)} />
      );
    }

    // Project detail view
    if (activePage === "de-tai" && selectedProject) {
      return (
        <ChiTietDeTai
          project={selectedProject}
          onBack={() => setSelectedProject(null)}
          onNavigate={(page) => {
            setSelectedProject(null);
            setActivePage(page);
          }}
        />
      );
    }

    switch (activePage) {
      case "tong-quan":
        return <TongQuanTienDo onViewDetail={handleViewDetail} />;
      case "de-tai":
        return <DeTaiList onViewDetail={handleViewDetail} initialSearch={projectSearch} />;
      case "giai-doan":
        return <QuanLyGiaiDoan />;
      case "moc-tien-do":
        return <QuanLyMocTienDo />;
      case "han-chot":
        return <HanChotPage />;
      case "mang-dao-tao":
        return <MangDaoTaoPage />;
      case "thong-bao":
        return <TrungTamThongBao />;
      case "nhat-ky":
        return <NhatKyHeThong />;
      case "bao-cao":
        return <BaoCao onOpenProjects={() => handleSidebarNavigate("de-tai")} />;
      case "cai-dat":
        return <CaiDat />;
      default:
        return <TongQuanTienDo onViewDetail={handleViewDetail} />;
    }
  };

  return (
    <DateFormatProvider>
      <AdminLayout
      activePage={activePage}
      onNavigate={handleSidebarNavigate}
      onOpenProfile={() => setShowProfile(true)}
      onOpenNotifications={() => handleSidebarNavigate("thong-bao")}
      onSearchProjects={(query) => { setProjectSearch(query); handleSidebarNavigate("de-tai"); }}
      onLogout={handleLogout}
    >
      {renderContent()}
      </AdminLayout>
    </DateFormatProvider>
  );
}

export default function App() {
  return (
    <ThemeModeProvider>
      <AuthProvider>
        <AppInner />
      </AuthProvider>
    </ThemeModeProvider>
  );
}
