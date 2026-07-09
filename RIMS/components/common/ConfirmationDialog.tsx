"use client";

import { AlertCircle, Trash2, Lock } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export type ConfirmationType = "delete" | "lock" | "reset-password" | "custom";

interface ConfirmationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  type: ConfirmationType;
  title?: string;
  description?: string;
  itemName?: string;
  onConfirm: () => void;
  isLoading?: boolean;
}

export function ConfirmationDialog({
  open,
  onOpenChange,
  type,
  title,
  description,
  itemName = "mục này",
  onConfirm,
  isLoading = false,
}: ConfirmationDialogProps) {
  const defaultTitles: Record<ConfirmationType, string> = {
    delete: "Xóa mục",
    lock: "Khóa tài khoản",
    "reset-password": "Đặt lại mật khẩu",
    custom: "Xác nhận hành động",
  };

  const defaultDescriptions: Record<ConfirmationType, string> = {
    delete: `Bạn có chắc chắn muốn xóa ${itemName}? Hành động này không thể hoàn tác.`,
    lock: `Bạn có chắc chắn muốn khóa ${itemName}? Người dùng sẽ không thể đăng nhập.`,
    "reset-password": `Bạn có chắc chắn muốn đặt lại mật khẩu cho ${itemName}? Mật khẩu tạm sẽ được gửi qua email.`,
    custom: `Bạn có chắc chắn muốn thực hiện hành động này?`,
  };

  const getIcon = () => {
    switch (type) {
      case "delete":
        return <Trash2 className="h-5 w-5 text-red-600" />;
      case "lock":
        return <Lock className="h-5 w-5 text-orange-600" />;
      default:
        return <AlertCircle className="h-5 w-5 text-blue-600" />;
    }
  };

  const getActionColor = () => {
    switch (type) {
      case "delete":
        return "bg-red-600 hover:bg-red-700";
      case "lock":
        return "bg-orange-600 hover:bg-orange-700";
      default:
        return "bg-blue-600 hover:bg-blue-700";
    }
  };

  const getActionLabel = () => {
    switch (type) {
      case "delete":
        return "Xóa";
      case "lock":
        return "Khóa";
      case "reset-password":
        return "Đặt lại";
      default:
        return "Xác nhận";
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="max-w-md">
        <AlertDialogHeader className="flex flex-row items-start gap-4">
          <div className="flex-shrink-0">{getIcon()}</div>
          <div className="flex-1">
            <AlertDialogTitle className="text-lg">{title || defaultTitles[type]}</AlertDialogTitle>
            <AlertDialogDescription className="text-sm text-slate-600 mt-2">
              {description || defaultDescriptions[type]}
            </AlertDialogDescription>
          </div>
        </AlertDialogHeader>

        <div className="flex gap-3 justify-end pt-4">
          <AlertDialogCancel disabled={isLoading}>
            Hủy
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            disabled={isLoading}
            className={getActionColor()}
          >
            {isLoading ? "Đang xử lý..." : getActionLabel()}
          </AlertDialogAction>
        </div>
      </AlertDialogContent>
    </AlertDialog>
  );
}
