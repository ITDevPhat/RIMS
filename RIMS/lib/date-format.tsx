"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { adminApi } from "@/lib/api/admin-api";

export type DateFormat = "dd/MM/yyyy" | "MM/yyyy";

const DEFAULT_DATE_FORMAT: DateFormat = "MM/yyyy";
const STORAGE_KEY = "rms.dateFormat";
const SETTING_KEY = "system.date_format";
const CHANGE_EVENT = "rms:date-format-changed";

interface DateFormatContextValue {
  dateFormat: DateFormat;
  inputType: "date" | "month";
  formatDate: (value?: string | null) => string;
  toInputValue: (value?: string | null) => string;
  fromInputValue: (value: string) => string;
  refreshDateFormat: () => Promise<void>;
}

const DateFormatContext = createContext<DateFormatContextValue | null>(null);

function normalizeDateFormat(value?: string | null): DateFormat {
  return value === "dd/MM/yyyy" ? "dd/MM/yyyy" : DEFAULT_DATE_FORMAT;
}

function readStoredDateFormat() {
  if (typeof window === "undefined") return DEFAULT_DATE_FORMAT;
  return normalizeDateFormat(window.localStorage.getItem(STORAGE_KEY));
}

function parseIsoDate(value?: string | null) {
  if (!value) return null;
  const [datePart] = value.split("T");
  const parts = datePart.split("-");
  if (parts.length < 3) return null;
  const year = Number(parts[0]);
  const month = Number(parts[1]);
  const day = Number(parts[2]);
  if (!year || !month || !day) return null;
  return { year, month, day };
}

function pad(value: number) {
  return String(value).padStart(2, "0");
}

export function DateFormatProvider({ children }: { children: React.ReactNode }) {
  const [dateFormat, setDateFormat] = useState<DateFormat>(DEFAULT_DATE_FORMAT);

  const applyDateFormat = useCallback((value?: string | null) => {
    const normalized = normalizeDateFormat(value);
    setDateFormat(normalized);
    if (typeof window !== "undefined") {
      window.localStorage.setItem(STORAGE_KEY, normalized);
    }
  }, []);

  const refreshDateFormat = useCallback(async () => {
    try {
      const setting = await adminApi.getSetting(SETTING_KEY);
      applyDateFormat(setting.settingValue);
    } catch {
      applyDateFormat(readStoredDateFormat());
    }
  }, [applyDateFormat]);

  useEffect(() => {
    applyDateFormat(readStoredDateFormat());
    void refreshDateFormat();

    const handleChange = (event: Event) => {
      const detail = (event as CustomEvent<{ value?: string }>).detail;
      applyDateFormat(detail?.value ?? readStoredDateFormat());
    };

    window.addEventListener(CHANGE_EVENT, handleChange);
    return () => window.removeEventListener(CHANGE_EVENT, handleChange);
  }, [applyDateFormat, refreshDateFormat]);

  const value = useMemo<DateFormatContextValue>(() => ({
    dateFormat,
    inputType: dateFormat === "MM/yyyy" ? "month" : "date",
    formatDate: (input) => {
      const date = parseIsoDate(input);
      if (!date) return input || "—";
      return dateFormat === "MM/yyyy"
        ? `Tháng ${date.month} Năm ${date.year}`
        : `${pad(date.day)}/${pad(date.month)}/${date.year}`;
    },
    toInputValue: (input) => {
      const date = parseIsoDate(input);
      if (!date) return "";
      return dateFormat === "MM/yyyy"
        ? `${date.year}-${pad(date.month)}`
        : `${date.year}-${pad(date.month)}-${pad(date.day)}`;
    },
    fromInputValue: (input) => {
      if (!input) return "";
      return dateFormat === "MM/yyyy" && /^\d{4}-\d{2}$/.test(input)
        ? `${input}-01`
        : input;
    },
    refreshDateFormat,
  }), [dateFormat, refreshDateFormat]);

  return <DateFormatContext.Provider value={value}>{children}</DateFormatContext.Provider>;
}

export function useDateFormat() {
  const context = useContext(DateFormatContext);
  if (!context) {
    throw new Error("useDateFormat must be used inside DateFormatProvider.");
  }
  return context;
}

export function notifyDateFormatChanged(value: DateFormat) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, value);
  window.dispatchEvent(new CustomEvent(CHANGE_EVENT, { detail: { value } }));
}
