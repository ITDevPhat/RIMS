"use client";

import { useState } from "react";
import { Microscope, Eye, EyeOff, Lock, User, AlertCircle } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { cn } from "@/lib/utils";

interface LoginPageProps {
  onLoginSuccess: () => void;
}

export default function LoginPage({ onLoginSuccess }: LoginPageProps) {
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!email.trim() || !password.trim()) {
      setError("Vui lòng nhập đầy đủ email và mật khẩu.");
      return;
    }
    setLoading(true);
    const ok = await login(email.trim(), password, remember);
    setLoading(false);
    if (ok) {
      onLoginSuccess();
    } else {
      setError("Email hoặc mật khẩu không đúng. Vui lòng thử lại.");
    }
  };

  const fillDemo = () => {
    setEmail("admin@hospital.vn");
    setPassword("demo123");
    setError("");
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-slate-100 px-4 py-12">
      {/* Hospital header strip */}
      <div className="mb-8 flex flex-col items-center gap-2 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-700 shadow-lg">
          <Microscope className="h-7 w-7 text-white" />
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-slate-400">
            Bệnh viện — Research Management System
          </p>
          <h1 className="mt-1 text-xl font-bold text-slate-800">
            ResearchTracker RMS
          </h1>
        </div>
      </div>

      {/* Login card */}
      <div className="w-full max-w-sm rounded-2xl border border-slate-200 bg-white shadow-xl">
        <div className="border-b border-slate-100 px-8 py-6">
          <h2 className="text-lg font-bold text-slate-800">Đăng nhập hệ thống</h2>
          <p className="mt-1 text-xs leading-relaxed text-slate-500">
            Hệ thống quản lý và theo dõi tiến độ nghiên cứu khoa học bệnh viện
          </p>
        </div>

        <form onSubmit={handleSubmit} className="px-8 py-6 flex flex-col gap-4">
          {/* Email field */}
          <div className="flex flex-col gap-1.5">
            <label htmlFor="email" className="text-xs font-semibold text-slate-600">
              Email hoặc tên đăng nhập
            </label>
            <div className="relative">
              <User className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                id="email"
                type="text"
                autoComplete="username"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@hospital.vn"
                className={cn(
                  "w-full rounded-lg border py-2 pl-9 pr-3 text-sm text-slate-800 placeholder:text-slate-300 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100",
                  error ? "border-red-300" : "border-slate-200"
                )}
              />
            </div>
          </div>

          {/* Password field */}
          <div className="flex flex-col gap-1.5">
            <label htmlFor="password" className="text-xs font-semibold text-slate-600">
              Mật khẩu
            </label>
            <div className="relative">
              <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className={cn(
                  "w-full rounded-lg border py-2 pl-9 pr-10 text-sm text-slate-800 placeholder:text-slate-300 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100",
                  error ? "border-red-300" : "border-slate-200"
                )}
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                tabIndex={-1}
                aria-label={showPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          {/* Error */}
          {error && (
            <div className="flex items-start gap-2 rounded-lg bg-red-50 px-3 py-2 text-xs text-red-600">
              <AlertCircle className="mt-0.5 h-3.5 w-3.5 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Remember me */}
          <label className="flex cursor-pointer items-center gap-2.5">
            <input
              type="checkbox"
              checked={remember}
              onChange={(e) => setRemember(e.target.checked)}
              className="h-3.5 w-3.5 rounded border-slate-300 accent-blue-600"
            />
            <span className="text-xs text-slate-600">Ghi nhớ đăng nhập</span>
          </label>

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className={cn(
              "mt-1 flex w-full items-center justify-center rounded-lg bg-blue-600 py-2.5 text-sm font-semibold text-white shadow-sm transition",
              loading ? "opacity-70 cursor-not-allowed" : "hover:bg-blue-700 active:scale-[0.98]"
            )}
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                </svg>
                Đang xử lý…
              </span>
            ) : (
              "Đăng nhập"
            )}
          </button>

          <p className="text-center text-xs text-slate-400">
            Liên hệ quản trị viên nếu bạn không có tài khoản.
          </p>
        </form>

        {/* Demo account box */}
        <div className="mx-8 mb-7 rounded-lg border border-blue-100 bg-blue-50 px-4 py-3">
          <div className="mb-1.5 flex items-center justify-between">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-blue-700">
              Tài khoản demo
            </p>
            <button
              type="button"
              onClick={fillDemo}
              className="rounded text-[11px] font-medium text-blue-600 hover:underline"
            >
              Điền vào
            </button>
          </div>
          <p className="text-xs text-blue-800">
            Email: <span className="font-mono font-medium">admin@hospital.vn</span>
          </p>
          <p className="text-xs text-blue-800">
            Mật khẩu: <span className="font-mono font-medium">demo123</span>
          </p>
        </div>
      </div>

      <p className="mt-6 text-xs text-slate-400">
        &copy; {new Date().getFullYear()} Bệnh viện — Hệ thống RMS. Phiên bản 1.0 Beta
      </p>
    </div>
  );
}
