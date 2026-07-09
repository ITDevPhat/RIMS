import { cn } from "@/lib/utils";
import type { RiskLevel } from "@/lib/types";
import { AlertTriangle, CheckCircle2, XCircle } from "lucide-react";

interface RiskBadgeProps {
  risk: RiskLevel | string;
  className?: string;
}

export default function RiskBadge({ risk, className }: RiskBadgeProps) {
  const config: Record<
    string,
    { bg: string; text: string; icon: React.ElementType }
  > = {
    "Đúng tiến độ": {
      bg: "bg-emerald-50 border border-emerald-200",
      text: "text-emerald-700",
      icon: CheckCircle2,
    },
    "Có nguy cơ": {
      bg: "bg-amber-50 border border-amber-200",
      text: "text-amber-700",
      icon: AlertTriangle,
    },
    "Trễ hạn": {
      bg: "bg-red-50 border border-red-200",
      text: "text-red-700",
      icon: XCircle,
    },
    "Đã hoàn thành": {
      bg: "bg-emerald-50 border border-emerald-200",
      text: "text-emerald-700",
      icon: CheckCircle2,
    },
    "Hoàn thành trễ": {
      bg: "bg-red-50 border border-red-200",
      text: "text-red-700",
      icon: AlertTriangle,
    },
  };

  const style = config[risk] ?? {
    bg: "bg-slate-100 border border-slate-200",
    text: "text-slate-600",
    icon: AlertTriangle,
  };

  const Icon = style.icon;

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium",
        style.bg,
        style.text,
        className
      )}
    >
      <Icon className="h-3 w-3 flex-shrink-0" />
      {risk}
    </span>
  );
}
