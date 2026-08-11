"use client";

import dynamic from "next/dynamic";
import { useState } from "react";
import { AuthProvider, useAuth } from "@/lib/auth-context";
import { DateFormatProvider } from "@/lib/date-format";
import { ThemeModeProvider } from "@/lib/theme-mode";
import type { PageKey } from "@/components/layout/Sidebar";
import LoginPage from "@/components/pages/LoginPage";
import type { ResearchProject } from "@/lib/types";

function PageLoading() {
  return <div className="rounded-lg border border-slate-200 bg-white p-4 text-sm text-slate-500">Đang tải...</div>;
}

const AdminLayout = dynamic(() => import("@/components/layout/AdminLayout"));
const TongQuanTienDo = dynamic(() => import("@/components/pages/TongQuanTienDo"), { loading: PageLoading });
const DeTaiList = dynamic(() => import("@/components/pages/DeTaiList"), { loading: PageLoading });
const ChiTietDeTai = dynamic(() => import("@/components/pages/ChiTietDeTai"), { loading: PageLoading });
const QuanLyGiaiDoan = dynamic(() => import("@/components/pages/QuanLyGiaiDoan"), { loading: PageLoading });
const QuanLyMocTienDo = dynamic(() => import("@/components/pages/QuanLyMocTienDo"), { loading: PageLoading });
const HanChotPage = dynamic(() => import("@/components/pages/HanChotPage"), { loading: PageLoading });
const MangDaoTaoPage = dynamic(() => import("@/components/pages/MangDaoTaoPage"), { loading: PageLoading });
const ThongTinCaNhan = dynamic(() => import("@/components/pages/ThongTinCaNhan"), { loading: PageLoading });
const CaiDat = dynamic(() => import("@/components/pages/CaiDat"), { loading: PageLoading });
const TrungTamThongBao = dynamic(() => import("@/components/pages/TrungTamThongBao"), { loading: PageLoading });
const NhatKyHeThong = dynamic(() => import("@/components/pages/NhatKyHeThong"), { loading: PageLoading });
const BaoCao = dynamic(() => import("@/components/pages/BaoCao"), { loading: PageLoading });

function AppInner() {
  const { isLoggedIn, isRestoring, logout } = useAuth();
  const [activePage, setActivePage] = useState<PageKey>("tong-quan");
  const [selectedProject, setSelectedProject] = useState<ResearchProject | null>(null);
  const [showProfile, setShowProfile] = useState(false);
  const [projectSearch, setProjectSearch] = useState("");

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
    if (showProfile) {
      return (
        <ThongTinCaNhan onBack={() => setShowProfile(false)} />
      );
    }

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
  );
}

export default function App() {
  return (
    <ThemeModeProvider>
      <DateFormatProvider>
        <AuthProvider>
          <AppInner />
        </AuthProvider>
      </DateFormatProvider>
    </ThemeModeProvider>
  );
}
