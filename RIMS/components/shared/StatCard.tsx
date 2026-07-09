import { cn } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import type { LucideIcon } from "lucide-react";

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: LucideIcon;
  iconBg?: string;
  iconColor?: string;
  trend?: string;
  trendUp?: boolean;
  className?: string;
  children?: React.ReactNode;
}

export default function StatCard({
  title,
  value,
  subtitle,
  icon: Icon,
  iconBg = "bg-blue-100",
  iconColor = "text-blue-600",
  trend,
  trendUp,
  className,
  children,
}: StatCardProps) {
  return (
    <Card className={cn("shadow-sm border-slate-200", className)}>
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              {title}
            </p>
            <p className="mt-1 text-2xl font-bold text-slate-900 leading-tight">
              {value}
            </p>
            {subtitle && (
              <p className="mt-0.5 text-xs text-slate-500">{subtitle}</p>
            )}
            {trend && (
              <p
                className={cn(
                  "mt-1 text-xs font-medium",
                  trendUp ? "text-emerald-600" : "text-red-500"
                )}
              >
                {trend}
              </p>
            )}
            {children}
          </div>
          {Icon && (
            <div
              className={cn(
                "flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg",
                iconBg
              )}
            >
              <Icon className={cn("h-5 w-5", iconColor)} />
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
