"use client";

import { BarChart3, FileSpreadsheet, FolderSearch } from "lucide-react";
import PageHeader from "@/components/shared/PageHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function BaoCao({ onOpenProjects }: { onOpenProjects: () => void }) {
  return <div>
    <PageHeader title="Báo cáo" subtitle="Xuất báo cáo tiến độ dự án từ dữ liệu hiện có." />
    <div className="grid grid-cols-1 gap-5 px-4 py-6 sm:px-6 lg:grid-cols-2 lg:px-8">
      <Card><CardHeader><CardTitle className="flex items-center gap-2"><FileSpreadsheet className="h-5 w-5 text-emerald-600" />Gantt tiến độ dự án</CardTitle></CardHeader><CardContent className="space-y-4 text-sm text-slate-600"><p>Hệ thống hiện hỗ trợ báo cáo Excel Gantt theo từng đề tài, gồm thông tin dự án, WBS, ngày bắt đầu/kết thúc, tiến độ và thanh thời gian.</p><ol className="list-decimal space-y-1 pl-5"><li>Mở danh sách đề tài.</li><li>Chọn một đề tài để xem chi tiết.</li><li>Nhấn <strong>Xuất Excel</strong> ở đầu trang.</li></ol><Button onClick={onOpenProjects} className="gap-2"><FolderSearch className="h-4 w-4" />Chọn đề tài để xuất</Button></CardContent></Card>
      <Card><CardHeader><CardTitle className="flex items-center gap-2"><BarChart3 className="h-5 w-5 text-blue-600" />Phạm vi báo cáo</CardTitle></CardHeader><CardContent className="text-sm leading-6 text-slate-600">Backend hiện chỉ cung cấp báo cáo Gantt Excel theo dự án qua <code className="rounded bg-slate-100 px-1.5 py-0.5 text-xs">GET /api/reports/projects/{'{projectId}'}/gantt.xlsx</code>. Chưa có endpoint báo cáo tổng hợp chung, vì vậy trang này không hiển thị số liệu giả hoặc nút tải không hoạt động.</CardContent></Card>
    </div>
  </div>;
}
