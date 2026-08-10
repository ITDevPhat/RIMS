"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { CalendarDays, ChevronLeft, ChevronRight, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "@/lib/toast";
import { cn } from "@/lib/utils";
import type { DatePrecision } from "@/lib/date-utils";

const WEEKDAYS = ["T2", "T3", "T4", "T5", "T6", "T7", "CN"];
const MONTHS = [
  "Tháng 1",
  "Tháng 2",
  "Tháng 3",
  "Tháng 4",
  "Tháng 5",
  "Tháng 6",
  "Tháng 7",
  "Tháng 8",
  "Tháng 9",
  "Tháng 10",
  "Tháng 11",
  "Tháng 12",
];

type DateInputProps = {
  value?: string | null;
  onChange: (value: string) => void;
  className?: string;
  disabled?: boolean;
  "aria-label"?: string;
};

type PrecisionDateInputProps = {
  label: string;
  value?: string | null;
  precision?: DatePrecision | null;
  required?: boolean;
  disabled?: boolean;
  className?: string;
  error?: string;
  onValueChange: (value: string) => void;
  onPrecisionChange: (precision: DatePrecision) => void;
};

function pad(value: number) {
  return String(value).padStart(2, "0");
}

function parseIsoDate(value?: string | null) {
  if (!value) return null;
  const [datePart] = value.split("T");
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(datePart);
  if (!match) return null;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const date = new Date(year, month - 1, day);
  if (date.getFullYear() !== year || date.getMonth() !== month - 1 || date.getDate() !== day) return null;
  return date;
}

function parseVietnameseDate(value: string) {
  const match = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/.exec(value.trim());
  if (!match) return null;
  const day = Number(match[1]);
  const month = Number(match[2]);
  const year = Number(match[3]);
  const date = new Date(year, month - 1, day);
  if (date.getFullYear() !== year || date.getMonth() !== month - 1 || date.getDate() !== day) return null;
  return date;
}

function toIsoDate(date: Date) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

function formatVietnameseDate(value?: string | null) {
  const date = parseIsoDate(value);
  return date ? `${pad(date.getDate())}/${pad(date.getMonth() + 1)}/${date.getFullYear()}` : "";
}

function parseVietnameseMonth(value: string) {
  const match = /^(\d{1,2})\/(\d{4})$/.exec(value.trim());
  if (!match) return null;
  const month = Number(match[1]);
  const year = Number(match[2]);
  if (month < 1 || month > 12 || year < 1) return null;
  return new Date(year, month - 1, 1);
}

function formatVietnameseMonth(value?: string | null) {
  const date = parseIsoDate(value);
  return date ? `${pad(date.getMonth() + 1)}/${date.getFullYear()}` : "";
}

function sameDate(left: Date, right: Date) {
  return left.getFullYear() === right.getFullYear()
    && left.getMonth() === right.getMonth()
    && left.getDate() === right.getDate();
}

function getCalendarDays(month: Date) {
  const year = month.getFullYear();
  const monthIndex = month.getMonth();
  const first = new Date(year, monthIndex, 1);
  const mondayBasedOffset = (first.getDay() + 6) % 7;
  const start = new Date(year, monthIndex, 1 - mondayBasedOffset);
  return Array.from({ length: 42 }, (_, index) => new Date(start.getFullYear(), start.getMonth(), start.getDate() + index));
}

export function DateInput({ value, onChange, className, disabled, "aria-label": ariaLabel }: DateInputProps) {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const selectedDate = useMemo(() => parseIsoDate(value), [value]);
  const [open, setOpen] = useState(false);
  const [displayValue, setDisplayValue] = useState(formatVietnameseDate(value));
  const [visibleMonth, setVisibleMonth] = useState(() => selectedDate ?? new Date());

  useEffect(() => {
    setDisplayValue(formatVietnameseDate(value));
    if (selectedDate) setVisibleMonth(selectedDate);
  }, [selectedDate, value]);

  useEffect(() => {
    if (!open) return;
    const handlePointerDown = (event: PointerEvent) => {
      if (!wrapperRef.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener("pointerdown", handlePointerDown);
    return () => document.removeEventListener("pointerdown", handlePointerDown);
  }, [open]);

  const days = useMemo(() => getCalendarDays(visibleMonth), [visibleMonth]);
  const today = useMemo(() => new Date(), []);

  const commitDisplayValue = () => {
    if (!displayValue.trim()) {
      onChange("");
      return;
    }
    const parsed = parseVietnameseDate(displayValue);
    if (parsed) {
      onChange(toIsoDate(parsed));
      setVisibleMonth(parsed);
    } else {
      setDisplayValue(formatVietnameseDate(value));
    }
  };

  const chooseDate = (date: Date) => {
    onChange(toIsoDate(date));
    setDisplayValue(`${pad(date.getDate())}/${pad(date.getMonth() + 1)}/${date.getFullYear()}`);
    setVisibleMonth(date);
    setOpen(false);
  };

  return (
    <div ref={wrapperRef} className="relative">
      <div className="relative">
        <Input
          value={displayValue}
          onChange={(event) => setDisplayValue(event.target.value)}
          onBlur={commitDisplayValue}
          onFocus={() => !disabled && setOpen(true)}
          placeholder="dd/mm/yyyy"
          inputMode="numeric"
          disabled={disabled}
          aria-label={ariaLabel}
          className={cn("pr-16", className)}
        />
        {value && !disabled && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="absolute right-8 top-1/2 h-7 w-7 -translate-y-1/2 p-0 text-slate-400 hover:text-slate-700"
            onMouseDown={(event) => event.preventDefault()}
            onClick={() => onChange("")}
            aria-label="Xóa ngày"
          >
            <X className="h-3.5 w-3.5" />
          </Button>
        )}
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="absolute right-1 top-1/2 h-7 w-7 -translate-y-1/2 p-0 text-slate-500 hover:text-slate-800"
          disabled={disabled}
          onMouseDown={(event) => event.preventDefault()}
          onClick={() => setOpen((current) => !current)}
          aria-label="Mở lịch chọn ngày"
        >
          <CalendarDays className="h-4 w-4" />
        </Button>
      </div>

      {open && (
        <div className="absolute z-50 mt-2 w-72 rounded-lg border border-slate-200 bg-white p-3 shadow-xl">
          <div className="mb-3 flex items-center justify-between gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-8 w-8 p-0"
              onMouseDown={(event) => event.preventDefault()}
              onClick={() => setVisibleMonth((date) => new Date(date.getFullYear(), date.getMonth() - 1, 1))}
              aria-label="Tháng trước"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <div className="text-sm font-bold text-slate-800">
              {MONTHS[visibleMonth.getMonth()]} năm {visibleMonth.getFullYear()}
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-8 w-8 p-0"
              onMouseDown={(event) => event.preventDefault()}
              onClick={() => setVisibleMonth((date) => new Date(date.getFullYear(), date.getMonth() + 1, 1))}
              aria-label="Tháng sau"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
          <div className="grid grid-cols-7 gap-1 text-center text-[11px] font-semibold text-slate-500">
            {WEEKDAYS.map((day) => <div key={day} className="py-1">{day}</div>)}
          </div>
          <div className="mt-1 grid grid-cols-7 gap-1">
            {days.map((day) => {
              const isCurrentMonth = day.getMonth() === visibleMonth.getMonth();
              const isSelected = selectedDate ? sameDate(day, selectedDate) : false;
              const isToday = sameDate(day, today);
              return (
                <button
                  key={toIsoDate(day)}
                  type="button"
                  onMouseDown={(event) => event.preventDefault()}
                  onClick={() => chooseDate(day)}
                  className={cn(
                    "h-8 rounded-md text-sm font-medium transition",
                    isSelected
                      ? "bg-blue-600 text-white hover:bg-blue-700"
                      : "hover:bg-slate-100",
                    !isSelected && isToday && "border border-blue-300 text-blue-700",
                    !isSelected && !isCurrentMonth && "text-slate-300"
                  )}
                  aria-label={`Chọn ngày ${pad(day.getDate())}/${pad(day.getMonth() + 1)}/${day.getFullYear()}`}
                >
                  {day.getDate()}
                </button>
              );
            })}
          </div>
          <div className="mt-3 flex items-center justify-between gap-2 border-t border-slate-100 pt-3">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onMouseDown={(event) => event.preventDefault()}
              onClick={() => chooseDate(new Date())}
            >
              Hôm nay
            </Button>
            <span className="text-xs font-medium text-slate-500">dd/mm/yyyy</span>
          </div>
        </div>
      )}
    </div>
  );
}

export function MonthInput({ value, onChange, className, disabled, "aria-label": ariaLabel }: DateInputProps) {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const selectedDate = useMemo(() => parseIsoDate(value), [value]);
  const [open, setOpen] = useState(false);
  const [displayValue, setDisplayValue] = useState(formatVietnameseMonth(value));
  const [visibleYear, setVisibleYear] = useState(() => selectedDate?.getFullYear() ?? new Date().getFullYear());

  useEffect(() => {
    setDisplayValue(formatVietnameseMonth(value));
    if (selectedDate) setVisibleYear(selectedDate.getFullYear());
  }, [selectedDate, value]);

  useEffect(() => {
    if (!open) return;
    const handlePointerDown = (event: PointerEvent) => {
      if (!wrapperRef.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener("pointerdown", handlePointerDown);
    return () => document.removeEventListener("pointerdown", handlePointerDown);
  }, [open]);

  const commitDisplayValue = () => {
    if (!displayValue.trim()) {
      onChange("");
      return;
    }
    const parsed = parseVietnameseMonth(displayValue);
    if (parsed) {
      onChange(toIsoDate(parsed));
      setVisibleYear(parsed.getFullYear());
    } else {
      setDisplayValue(formatVietnameseMonth(value));
    }
  };

  const chooseMonth = (monthIndex: number) => {
    const date = new Date(visibleYear, monthIndex, 1);
    onChange(toIsoDate(date));
    setDisplayValue(`${pad(monthIndex + 1)}/${visibleYear}`);
    setOpen(false);
  };

  return (
    <div ref={wrapperRef} className="relative">
      <div className="relative">
        <Input
          value={displayValue}
          onChange={(event) => setDisplayValue(event.target.value)}
          onBlur={commitDisplayValue}
          onFocus={() => !disabled && setOpen(true)}
          placeholder="mm/yyyy"
          inputMode="numeric"
          disabled={disabled}
          aria-label={ariaLabel}
          className={cn("pr-16", className)}
        />
        {value && !disabled && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="absolute right-8 top-1/2 h-7 w-7 -translate-y-1/2 p-0 text-slate-400 hover:text-slate-700"
            onMouseDown={(event) => event.preventDefault()}
            onClick={() => onChange("")}
            aria-label="Xóa tháng"
          >
            <X className="h-3.5 w-3.5" />
          </Button>
        )}
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="absolute right-1 top-1/2 h-7 w-7 -translate-y-1/2 p-0 text-slate-500 hover:text-slate-800"
          disabled={disabled}
          onMouseDown={(event) => event.preventDefault()}
          onClick={() => setOpen((current) => !current)}
          aria-label="Mở lịch chọn tháng"
        >
          <CalendarDays className="h-4 w-4" />
        </Button>
      </div>

      {open && (
        <div className="absolute z-50 mt-2 w-72 rounded-lg border border-slate-200 bg-white p-3 shadow-xl">
          <div className="mb-3 flex items-center justify-between gap-2">
            <Button type="button" variant="outline" size="sm" className="h-8 w-8 p-0" onMouseDown={(event) => event.preventDefault()} onClick={() => setVisibleYear((year) => year - 1)} aria-label="Năm trước">
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <div className="text-sm font-bold text-slate-800">Năm {visibleYear}</div>
            <Button type="button" variant="outline" size="sm" className="h-8 w-8 p-0" onMouseDown={(event) => event.preventDefault()} onClick={() => setVisibleYear((year) => year + 1)} aria-label="Năm sau">
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
          <div className="grid grid-cols-3 gap-2">
            {MONTHS.map((month, index) => {
              const selected = selectedDate?.getFullYear() === visibleYear && selectedDate.getMonth() === index;
              return (
                <button
                  key={month}
                  type="button"
                  onMouseDown={(event) => event.preventDefault()}
                  onClick={() => chooseMonth(index)}
                  className={cn(
                    "h-9 rounded-md text-sm font-semibold transition",
                    selected ? "bg-blue-600 text-white hover:bg-blue-700" : "bg-slate-50 text-slate-700 hover:bg-slate-100"
                  )}
                >
                  {month.replace("Tháng ", "T")}
                </button>
              );
            })}
          </div>
          <div className="mt-3 border-t border-slate-100 pt-3 text-right text-xs font-medium text-slate-500">MM/yyyy</div>
        </div>
      )}
    </div>
  );
}

export function PrecisionDateInput({
  label,
  value,
  precision = "DAY",
  required,
  disabled,
  className,
  error,
  onValueChange,
  onPrecisionChange,
}: PrecisionDateInputProps) {
  const normalizedPrecision: DatePrecision = precision === "MONTH" ? "MONTH" : "DAY";
  const includeDay = normalizedPrecision === "DAY";

  const handlePrecisionToggle = (checked: boolean) => {
    const nextPrecision: DatePrecision = checked ? "DAY" : "MONTH";
    if (nextPrecision === normalizedPrecision) return;
    onPrecisionChange(nextPrecision);
    if (nextPrecision === "MONTH") {
      const parsed = parseIsoDate(value);
      if (parsed) onValueChange(toIsoDate(new Date(parsed.getFullYear(), parsed.getMonth(), 1)));
    } else {
      onValueChange("");
    }
    toast.info(`Đã chuyển ${label} thành định dạng ${nextPrecision === "DAY" ? "dd/MM/yyyy" : "MM/yyyy"}`);
  };

  return (
    <div className={cn("min-w-0", className)}>
      <div className="mb-1.5 flex flex-wrap items-center justify-between gap-x-3 gap-y-1">
        <span className="text-xs font-semibold text-slate-700">
          {label}{required && <span className="ml-1 text-red-500">*</span>}
        </span>
        <label className="flex min-w-max items-center gap-2 text-xs font-medium text-slate-600">
          <input
            type="checkbox"
            checked={includeDay}
            disabled={disabled}
            onChange={(event) => handlePrecisionToggle(event.target.checked)}
            className="h-4 w-4 rounded border-slate-300 text-blue-600"
          />
          Bao gồm ngày
        </label>
      </div>
      {includeDay ? (
        <DateInput value={value} onChange={onValueChange} disabled={disabled} aria-label={label} />
      ) : (
        <MonthInput value={value} onChange={onValueChange} disabled={disabled} aria-label={label} />
      )}
      {error && <span className="mt-1 block text-xs font-medium text-red-600">{error}</span>}
    </div>
  );
}
