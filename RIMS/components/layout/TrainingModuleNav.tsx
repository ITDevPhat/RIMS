"use client";

import { cn } from "@/lib/utils";

interface TrainingModuleNavProps {
  activeTab: "overview" | "calendar" | "eventlist" | "statistics" | "settings";
  onTabChange: (tab: "overview" | "calendar" | "eventlist" | "statistics" | "settings") => void;
}

const TABS = [
  { id: "overview", label: "Tổng quan đào tạo" },
  { id: "calendar", label: "Lịch đào tạo" },
  { id: "eventlist", label: "Danh sách sự kiện" },
  { id: "statistics", label: "Thống kê năm" },
  { id: "settings", label: "Cài đặt đào tạo" },
] as const;

export default function TrainingModuleNav({ activeTab, onTabChange }: TrainingModuleNavProps) {
  return (
    <div className="border-b border-slate-200 bg-white">
      <div className="flex items-center gap-0 px-4">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id as typeof activeTab)}
            className={cn(
              "px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap",
              activeTab === tab.id
                ? "border-blue-500 text-blue-600"
                : "border-transparent text-slate-600 hover:text-slate-800 hover:border-slate-300"
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>
    </div>
  );
}
