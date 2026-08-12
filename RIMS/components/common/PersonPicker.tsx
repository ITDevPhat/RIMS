"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Loader2, Plus, Search, UserRound, X } from "lucide-react";
import { personLookupApi, type ApiPersonLookup } from "@/lib/api/research-api";
import type { ApiDepartment } from "@/lib/api/admin-api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";

export type PersonSelection = {
  source: "internal" | "manual";
  userId: number | null;
  fullName: string;
  email?: string | null;
  title?: string | null;
  departmentId?: number | null;
  departmentName?: string | null;
  avatarUrl?: string | null;
  initials?: string | null;
  projectMemberId?: number;
  rowVersion?: number;
};

interface PersonPickerProps {
  mode: "single" | "multiple";
  value: PersonSelection[];
  onChange: (value: PersonSelection[]) => void;
  departments: ApiDepartment[];
  placeholder?: string;
  disabled?: boolean;
}

const searchCache = new Map<string, ApiPersonLookup[]>();

export function PersonPicker({ mode, value, onChange, departments, placeholder = "Tìm theo tên hoặc email...", disabled }: PersonPickerProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<ApiPersonLookup[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);
  const [adding, setAdding] = useState(false);
  const [manual, setManual] = useState({ fullName: "", email: "", title: "", departmentId: "" });
  const inputRef = useRef<HTMLInputElement>(null);
  const requestRef = useRef(0);
  const selectedIds = useMemo(() => new Set(value.flatMap(person => person.userId == null ? [] : [person.userId])), [value]);
  const available = results.filter(person => !selectedIds.has(person.userId));

  useEffect(() => {
    const normalized = query.trim().toLocaleLowerCase("vi-VN");
    if (!open || adding || normalized.length < 2) { setResults([]); setLoading(false); return; }
    const cached = searchCache.get(normalized);
    if (cached) { setResults(cached); setError(""); return; }
    const requestId = ++requestRef.current;
    const timer = window.setTimeout(async () => {
      setLoading(true); setError("");
      try {
        const response = await personLookupApi.search(query.trim());
        if (requestId !== requestRef.current) return;
        const items = response.items;
        searchCache.set(normalized, items); setResults(items); setActiveIndex(0);
      } catch { if (requestId === requestRef.current) setError("Không tìm được người dùng. Vui lòng thử lại."); }
      finally { if (requestId === requestRef.current) setLoading(false); }
    }, 300);
    return () => window.clearTimeout(timer);
  }, [adding, open, query]);

  const selectInternal = (person: ApiPersonLookup) => {
    const selection: PersonSelection = { source: "internal", ...person };
    onChange(mode === "single" ? [selection] : [...value, selection]);
    setQuery(""); setOpen(false); inputRef.current?.focus();
  };
  const addManual = () => {
    if (!manual.fullName.trim()) return;
    const department = departments.find(item => String(item.departmentId) === manual.departmentId);
    const selection: PersonSelection = { source: "manual", userId: null, fullName: manual.fullName.trim(), email: manual.email.trim() || null, title: manual.title.trim() || null, departmentId: department?.departmentId ?? null, departmentName: department?.departmentName ?? null };
    onChange(mode === "single" ? [selection] : [...value, selection]);
    setManual({ fullName: "", email: "", title: "", departmentId: "" }); setAdding(false); setQuery(""); setOpen(false);
    window.setTimeout(() => inputRef.current?.focus(), 0);
  };
  const remove = (index: number) => onChange(value.filter((_, current) => current !== index));
  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Escape") { setOpen(false); setAdding(false); return; }
    if (!open) return;
    const optionCount = available.length + 1;
    if (event.key === "ArrowDown") { event.preventDefault(); setActiveIndex(index => (index + 1) % optionCount); }
    if (event.key === "ArrowUp") { event.preventDefault(); setActiveIndex(index => (index - 1 + optionCount) % optionCount); }
    if (event.key === "Enter") { event.preventDefault(); if (activeIndex < available.length) selectInternal(available[activeIndex]); else setAdding(true); }
  };

  return <div className="relative min-w-0 space-y-2">
    {value.map((person, index) => <PersonRow key={person.userId != null ? `user-${person.userId}` : `manual-${index}-${person.fullName}`} person={person} onRemove={() => remove(index)} />)}
    {(mode === "multiple" || value.length === 0) && <div className="relative">
      <Search className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-slate-400" />
      <Input ref={inputRef} role="combobox" aria-expanded={open} aria-controls="person-picker-options" aria-autocomplete="list" disabled={disabled} value={query} onFocus={() => setOpen(true)} onChange={event => { setQuery(event.target.value); setOpen(true); }} onKeyDown={handleKeyDown} placeholder={placeholder} className="pl-9" />
    </div>}
    {open && !adding && <div id="person-picker-options" role="listbox" className="absolute z-[120] max-h-80 w-full overflow-y-auto rounded-lg border border-slate-200 bg-white p-1 shadow-xl dark:border-slate-700 dark:bg-slate-900">
      {query.trim().length < 2 ? <p className="px-3 py-4 text-sm text-slate-500 dark:text-slate-400">Nhập ít nhất 2 ký tự để tìm kiếm.</p> : loading ? <p className="flex items-center gap-2 px-3 py-4 text-sm text-slate-500"><Loader2 className="h-4 w-4 animate-spin" />Đang tìm kiếm...</p> : error ? <p className="px-3 py-4 text-sm text-red-600 dark:text-red-400">{error}</p> : <>
        {available.map((person, index) => <button key={person.userId} role="option" aria-selected={activeIndex === index} type="button" onMouseDown={event => event.preventDefault()} onClick={() => selectInternal(person)} className={cn("flex w-full items-center gap-3 rounded-md px-3 py-2 text-left", activeIndex === index ? "bg-blue-50 dark:bg-blue-950/50" : "hover:bg-slate-50 dark:hover:bg-slate-800")}><Avatar person={person} /><PersonText person={person} /></button>)}
        {!available.length && <p className="px-3 py-3 text-sm text-slate-500 dark:text-slate-400">Không tìm thấy người phù hợp.</p>}
        <button role="option" aria-selected={activeIndex === available.length} type="button" onMouseDown={event => event.preventDefault()} onClick={() => setAdding(true)} className={cn("flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm font-medium text-blue-700 dark:text-blue-300", activeIndex === available.length && "bg-blue-50 dark:bg-blue-950/50")}><Plus className="h-4 w-4" />Thêm người mới</button>
      </>}
    </div>}
    {adding && <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 dark:border-slate-700 dark:bg-slate-900"><p className="mb-3 text-sm font-semibold text-slate-800 dark:text-slate-100">Thêm người mới</p><div className="grid gap-3 sm:grid-cols-2"><Input autoFocus value={manual.fullName} onChange={event => setManual(current => ({ ...current, fullName: event.target.value }))} placeholder="Họ và tên *" /><Input type="email" value={manual.email} onChange={event => setManual(current => ({ ...current, email: event.target.value }))} placeholder="Email" /><Select value={manual.departmentId || undefined} onValueChange={departmentId => setManual(current => ({ ...current, departmentId: departmentId ?? "" }))}><SelectTrigger><SelectValue placeholder="Khoa/phòng" /></SelectTrigger><SelectContent>{departments.filter(item => item.isActive).map(item => <SelectItem key={item.departmentId} value={String(item.departmentId)}>{item.departmentName}</SelectItem>)}</SelectContent></Select><Input value={manual.title} onChange={event => setManual(current => ({ ...current, title: event.target.value }))} placeholder="Chức danh" /></div><div className="mt-3 flex justify-end gap-2"><Button type="button" variant="outline" onClick={() => { setAdding(false); inputRef.current?.focus(); }}>Hủy</Button><Button type="button" disabled={!manual.fullName.trim()} onClick={addManual}>Thêm</Button></div></div>}
  </div>;
}

function Avatar({ person }: { person: Pick<PersonSelection, "avatarUrl" | "initials" | "fullName"> }) { return person.avatarUrl ? <img src={person.avatarUrl} alt="" className="h-9 w-9 flex-shrink-0 rounded-full object-cover" /> : <span className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-slate-200 text-xs font-semibold text-slate-700 dark:bg-slate-700 dark:text-slate-100">{person.initials || person.fullName.split(" ").slice(-2).map(part => part[0]).join("").toUpperCase() || <UserRound className="h-4 w-4" />}</span>; }
function PersonText({ person }: { person: Pick<PersonSelection, "fullName" | "email" | "title" | "departmentName"> }) { return <span className="min-w-0 flex-1"><span className="block truncate text-sm font-semibold text-slate-800 dark:text-slate-100">{person.fullName}</span><span className="block truncate text-xs text-slate-500 dark:text-slate-400">{[person.title, person.departmentName].filter(Boolean).join(" · ") || "Chưa cập nhật đơn vị"}</span>{person.email && <span className="block truncate text-xs text-slate-500 dark:text-slate-400">{person.email}</span>}</span>; }
function PersonRow({ person, onRemove }: { person: PersonSelection; onRemove: () => void }) { return <div className="flex min-w-0 items-center gap-3 rounded-lg bg-slate-100 px-3 py-2 dark:bg-slate-800"><Avatar person={person} /><PersonText person={person} /><button type="button" onClick={onRemove} aria-label={`Xóa ${person.fullName}`} className="rounded-md p-1 text-slate-400 hover:bg-white hover:text-slate-700 dark:hover:bg-slate-700 dark:hover:text-white"><X className="h-4 w-4" /></button></div>; }
