import React from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

// FormDrawer Header Component
export function FormDrawerHeader({
  title,
  onClose,
}: {
  title: string;
  onClose: () => void;
}) {
  return (
    <div className="sticky top-0 z-20 flex items-start justify-between border-b border-slate-200 bg-white px-6 py-5 shadow-sm">
      <div>
        <h2 className="text-lg font-bold text-slate-900">{title}</h2>
        <p className="mt-1 text-sm text-slate-500">Kiểm tra thông tin bắt buộc, mốc thời gian và trạng thái trước khi lưu.</p>
      </div>
      <button
        onClick={onClose}
        className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
        aria-label="Đóng"
      >
        <X className="h-5 w-5" />
      </button>
    </div>
  );
}

// FormDrawer Content Component
export function FormDrawerContent({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex-1 overflow-y-auto bg-slate-50/70 px-6 py-5">
      {children}
    </div>
  );
}

// FormDrawer Section Component
export function FormDrawerSection({
  title,
  children,
}: {
  title?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mb-4 rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
      {title && (
        <h3 className="mb-4 border-b border-slate-100 pb-3 text-sm font-bold text-slate-800">
          {title}
        </h3>
      )}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {children}
      </div>
    </section>
  );
}

// FormDrawer Field Component
export function FormDrawerField({
  label,
  required = false,
  children,
  colSpan = 1,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
  colSpan?: 1 | 2;
}) {
  return (
    <div className={colSpan === 2 ? "sm:col-span-2" : ""}>
      <label className="mb-1.5 flex items-center text-xs font-semibold uppercase tracking-wide text-slate-500">
        {label}
        {required && <span className="ml-1 text-red-500">*</span>}
      </label>
      {children}
    </div>
  );
}

// FormDrawer Footer Component
export function FormDrawerFooter({
  onCancel,
  onSave,
  saveLabel = "Lưu",
  isSaving = false,
}: {
  onCancel: () => void;
  onSave: () => void | Promise<void>;
  saveLabel?: string;
  isSaving?: boolean;
}) {
  return (
    <div className="sticky bottom-0 z-20 flex justify-end gap-3 border-t border-slate-200 bg-white px-6 py-4 shadow-sm">
      <Button
        variant="outline"
        onClick={onCancel}
        className="h-10 min-w-[100px] rounded-lg"
        disabled={isSaving}
      >
        Hủy
      </Button>
      <Button
        onClick={onSave}
        className="h-10 min-w-[140px] rounded-lg"
        disabled={isSaving}
      >
        {isSaving ? "Đang lưu..." : saveLabel}
      </Button>
    </div>
  );
}

// Main FormDrawer Container Component
export function FormDrawer({
  open,
  onOpenChange,
  title,
  children,
  onCancel,
  onSave,
  saveLabel = "Lưu",
  isSaving = false,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  children: React.ReactNode;
  onCancel?: () => void;
  onSave: () => void | Promise<void>;
  saveLabel?: string;
  isSaving?: boolean;
}) {
  if (!open) return null;

  const handleCancel = onCancel || (() => onOpenChange(false));
  const handleClose = () => onOpenChange(false);

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 z-40 bg-black/50"
        onClick={handleClose}
      />
      
      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="flex h-[92vh] w-full max-w-4xl flex-col overflow-hidden rounded-lg bg-white shadow-2xl ring-1 ring-slate-200">
          <FormDrawerHeader title={title} onClose={handleClose} />
          <FormDrawerContent>{children}</FormDrawerContent>
          <FormDrawerFooter
            onCancel={handleCancel}
            onSave={onSave}
            saveLabel={saveLabel}
            isSaving={isSaving}
          />
        </div>
      </div>
    </>
  );
}
