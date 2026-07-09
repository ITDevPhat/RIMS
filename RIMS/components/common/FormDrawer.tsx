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
    <div className="sticky top-0 z-20 flex items-center justify-between border-b border-slate-200 bg-white px-6 py-4 shadow-sm">
      <h2 className="text-lg font-bold text-slate-800">{title}</h2>
      <button
        onClick={onClose}
        className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition"
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
    <div className="flex-1 overflow-y-auto px-6 py-5">
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
    <div className="mb-6">
      {title && (
        <h3 className="mb-4 text-sm font-semibold text-slate-700">
          {title}
        </h3>
      )}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {children}
      </div>
    </div>
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
      <label className="mb-2 flex items-center text-sm font-medium text-slate-700">
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
  onSave: () => void;
  saveLabel?: string;
  isSaving?: boolean;
}) {
  return (
    <div className="sticky bottom-0 z-20 border-t border-slate-200 bg-slate-50 px-6 py-4 flex justify-end gap-3 shadow-sm">
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
        className="h-10 min-w-[120px] rounded-lg"
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
  onSave: () => void;
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
        <div className="flex h-[90vh] w-full max-w-2xl flex-col rounded-lg bg-white shadow-lg">
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
