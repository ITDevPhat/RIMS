"use client";

import { useEffect, useState } from "react";
import type { ReactNode } from "react";
import { AlertCircle, CheckCircle2, Info, TriangleAlert, X } from "lucide-react";
import { cn } from "@/lib/utils";

export type ToastType = "success" | "error" | "info" | "warning";

export interface ToastMessage {
  id: string;
  type: ToastType;
  title: string;
  description?: string;
  duration?: number;
}

export const TOAST_EVENT = "rims:toast";

const styleMap: Record<ToastType, { icon: ReactNode; className: string; iconClassName: string }> = {
  success: {
    icon: <CheckCircle2 className="h-4 w-4" />,
    className: "border-emerald-200 bg-emerald-50 text-emerald-900",
    iconClassName: "text-emerald-600",
  },
  error: {
    icon: <AlertCircle className="h-4 w-4" />,
    className: "border-red-200 bg-red-50 text-red-900",
    iconClassName: "text-red-600",
  },
  info: {
    icon: <Info className="h-4 w-4" />,
    className: "border-blue-200 bg-blue-50 text-blue-900",
    iconClassName: "text-blue-600",
  },
  warning: {
    icon: <TriangleAlert className="h-4 w-4" />,
    className: "border-amber-200 bg-amber-50 text-amber-900",
    iconClassName: "text-amber-600",
  },
};

export default function ToastProvider() {
  const [messages, setMessages] = useState<ToastMessage[]>([]);

  useEffect(() => {
    const handleToast = (event: Event) => {
      const message = (event as CustomEvent<Omit<ToastMessage, "id">>).detail;
      const id = crypto.randomUUID();
      const duration = message.duration ?? 3500;

      setMessages((current) => [{ ...message, id, duration }, ...current].slice(0, 5));
      window.setTimeout(() => {
        setMessages((current) => current.filter((item) => item.id !== id));
      }, duration);
    };

    window.addEventListener(TOAST_EVENT, handleToast);
    return () => window.removeEventListener(TOAST_EVENT, handleToast);
  }, []);

  if (messages.length === 0) return null;

  return (
    <div className="pointer-events-none fixed right-4 top-4 z-[100] flex w-[min(380px,calc(100vw-2rem))] flex-col gap-2">
      {messages.map((message) => {
        const style = styleMap[message.type];
        return (
          <div
            key={message.id}
            className={cn(
              "pointer-events-auto flex items-start gap-3 rounded-lg border px-3 py-3 shadow-lg backdrop-blur-sm animate-in slide-in-from-right-4 fade-in duration-200",
              style.className
            )}
          >
            <span className={cn("mt-0.5 shrink-0", style.iconClassName)}>{style.icon}</span>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold leading-5">{message.title}</p>
              {message.description && <p className="mt-0.5 text-xs leading-5 opacity-80">{message.description}</p>}
            </div>
            <button
              type="button"
              className="shrink-0 rounded-md p-1 opacity-60 hover:bg-black/5 hover:opacity-100"
              aria-label="Đóng thông báo"
              onClick={() => setMessages((current) => current.filter((item) => item.id !== message.id))}
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        );
      })}
    </div>
  );
}
