import { TOAST_EVENT, type ToastMessage, type ToastType } from "@/components/common/ToastProvider";

type ToastInput = string | Omit<ToastMessage, "id" | "type">;

function show(type: ToastType, input: ToastInput) {
  if (typeof window === "undefined") return;
  const message = typeof input === "string" ? { title: input } : input;
  window.dispatchEvent(new CustomEvent(TOAST_EVENT, { detail: { ...message, type } }));
}

export const toast = {
  success: (input: ToastInput) => show("success", input),
  error: (input: ToastInput) => show("error", input),
  info: (input: ToastInput) => show("info", input),
  warning: (input: ToastInput) => show("warning", input),
};
