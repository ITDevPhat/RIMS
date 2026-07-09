"use client";

import PageHeader from "@/components/shared/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { BarChart3, Clock } from "lucide-react";

export default function BaoCao() {
  return (
    <div>
      <PageHeader
        title="Báo cáo"
        subtitle="Xem báo cáo tiến độ và phân tích nghiên cứu."
      />

      <div className="px-8 py-16 flex flex-col items-center justify-center">
        <Card className="border-slate-200 shadow-sm max-w-md w-full">
          <CardContent className="p-10 flex flex-col items-center text-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100">
              <BarChart3 className="h-8 w-8 text-slate-400" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-700">
                Chức năng đang phát triển
              </h2>
              <p className="mt-1.5 text-sm text-slate-500 leading-relaxed">
                Chức năng báo cáo sẽ được phát triển sau.
              </p>
            </div>
            <div className="flex items-center gap-2 text-xs text-slate-400 bg-slate-50 rounded-lg px-4 py-2.5 border border-slate-100">
              <Clock className="h-3.5 w-3.5" />
              <span>Sắp ra mắt trong phiên bản tiếp theo</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
