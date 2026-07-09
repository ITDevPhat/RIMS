import { cn } from "@/lib/utils";
interface StatusBadgeProps {
  status: string;
  className?: string;
}

export default function StatusBadge({ status, className }: StatusBadgeProps) {
  const config: Record<string, { bg: string; text: string; dot: string }> = {
    "Hoàn thành": {
      bg: "bg-emerald-50 border border-emerald-200",
      text: "text-emerald-700",
      dot: "bg-emerald-500",
    },
    "Hoàn thành trễ": {
      bg: "bg-red-50 border border-red-200",
      text: "text-red-700",
      dot: "bg-red-500",
    },
    "Đang thực hiện": {
      bg: "bg-blue-50 border border-blue-200",
      text: "text-blue-700",
      dot: "bg-blue-500",
    },
    "Chưa bắt đầu": {
      bg: "bg-slate-50 border border-slate-200",
      text: "text-slate-600",
      dot: "bg-slate-400",
    },
    "Trễ hạn": {
      bg: "bg-red-50 border border-red-200",
      text: "text-red-700",
      dot: "bg-red-500",
    },
  };

  const style = config[status] ?? {
    bg: "bg-slate-100 border border-slate-200",
    text: "text-slate-600",
    dot: "bg-slate-400",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium",
        style.bg,
        style.text,
        className
      )}
    >
      <span className={cn("h-1.5 w-1.5 rounded-full flex-shrink-0", style.dot)} />
      {status}
    </span>
  );
}
