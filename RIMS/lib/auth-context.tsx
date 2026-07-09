"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { authApi, type ApiUserProfile } from "@/lib/api/auth-api";
import {
  clearStoredSession,
  getStoredToken,
  getStoredUser,
  storeToken,
  storeUser,
} from "@/lib/api/api-client";

export interface AppUser {
  id: string;
  hoTen: string;
  email: string;
  soDienThoai: string;
  chucVu: string;
  khoaPhong: string;
  vaiTro: string;
  ngayTao: string;
  trangThai: "Hoạt động" | "Vô hiệu hóa";
  initials: string;
  permissions: string[];
}

function mapProfile(profile: ApiUserProfile): AppUser {
  return {
    id: String(profile.userId),
    hoTen: profile.fullName,
    email: profile.email,
    soDienThoai: profile.phoneNumber ?? "",
    chucVu: profile.title ?? "",
    khoaPhong: profile.departmentName ?? "",
    vaiTro: profile.roles.map((role) => role.roleName).join(", ") || "Người dùng",
    ngayTao: "",
    trangThai: profile.accountStatus === "active" ? "Hoạt động" : "Vô hiệu hóa",
    initials: profile.initials ?? profile.fullName.split(" ").slice(-2).map((part) => part[0]).join("").toUpperCase(),
    permissions: profile.permissions,
  };
}

interface AuthContextValue {
  isLoggedIn: boolean;
  isRestoring: boolean;
  user: AppUser | null;
  login: (email: string, password: string, remember?: boolean) => Promise<boolean>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isRestoring, setIsRestoring] = useState(true);
  const [user, setUser] = useState<AppUser | null>(null);

  useEffect(() => {
    const restore = async () => {
      const token = getStoredToken();
      const cachedUser = getStoredUser<AppUser>();
      if (!token) {
        setIsRestoring(false);
        return;
      }

      if (cachedUser) {
        setUser(cachedUser);
        setIsLoggedIn(true);
      }

      try {
        const profile = await authApi.getMe();
        const mapped = mapProfile(profile);
        storeUser(mapped);
        setUser(mapped);
        setIsLoggedIn(true);
      } catch {
        clearStoredSession();
        setUser(null);
        setIsLoggedIn(false);
      } finally {
        setIsRestoring(false);
      }
    };

    const handleUnauthorized = () => {
      setUser(null);
      setIsLoggedIn(false);
    };

    void restore();
    window.addEventListener("rms:unauthorized", handleUnauthorized);
    return () => window.removeEventListener("rms:unauthorized", handleUnauthorized);
  }, []);

  const login = async (email: string, password: string, remember = true): Promise<boolean> => {
    try {
      const result = await authApi.login(email, password);
      const mapped = mapProfile(result.user);
      storeToken(result.token, remember);
      storeUser(mapped, remember);
      setIsLoggedIn(true);
      setUser(mapped);
      return true;
    } catch {
      clearStoredSession();
      setIsLoggedIn(false);
      setUser(null);
      return false;
    }
  };

  const logout = async () => {
    try {
      if (getStoredToken()) await authApi.logout();
    } catch {
      // Session cleanup should still happen if logout call fails.
    } finally {
      clearStoredSession();
      setIsLoggedIn(false);
      setUser(null);
    }
  };

  return (
    <AuthContext.Provider value={{ isLoggedIn, isRestoring, user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}
