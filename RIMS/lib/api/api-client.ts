export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  errors: string[];
}

export interface PagedResult<T> {
  items: T[];
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
}

export type QueryParams = Record<string, string | number | boolean | null | undefined>;

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:5000/api";
const TOKEN_KEY = "rms.accessToken";
const USER_KEY = "rms.user";

export class ApiError extends Error {
  status: number;
  errors: string[];

  constructor(message: string, status: number, errors: string[] = []) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.errors = errors;
  }
}

export function getStoredToken(): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(TOKEN_KEY) ?? window.sessionStorage.getItem(TOKEN_KEY);
}

export function storeToken(token: string, remember = true) {
  if (typeof window === "undefined") return;
  const primary = remember ? window.localStorage : window.sessionStorage;
  const secondary = remember ? window.sessionStorage : window.localStorage;
  primary.setItem(TOKEN_KEY, token);
  secondary.removeItem(TOKEN_KEY);
}

export function clearStoredSession() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(TOKEN_KEY);
  window.sessionStorage.removeItem(TOKEN_KEY);
  window.localStorage.removeItem(USER_KEY);
  window.sessionStorage.removeItem(USER_KEY);
}

export function storeUser<T>(user: T, remember = true) {
  if (typeof window === "undefined") return;
  const primary = remember ? window.localStorage : window.sessionStorage;
  const secondary = remember ? window.sessionStorage : window.localStorage;
  primary.setItem(USER_KEY, JSON.stringify(user));
  secondary.removeItem(USER_KEY);
}

export function getStoredUser<T>(): T | null {
  if (typeof window === "undefined") return null;
  const raw = window.localStorage.getItem(USER_KEY) ?? window.sessionStorage.getItem(USER_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

function buildUrl(path: string, params?: QueryParams) {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  const url = new URL(`${API_BASE_URL}${normalizedPath}`);
  Object.entries(params ?? {}).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      url.searchParams.set(key, String(value));
    }
  });
  return url.toString();
}

async function request<T>(method: string, path: string, body?: unknown, params?: QueryParams): Promise<T> {
  const headers = new Headers({ Accept: "application/json" });
  if (body !== undefined) headers.set("Content-Type", "application/json");
  const token = getStoredToken();
  if (token) headers.set("Authorization", `Bearer ${token}`);

  const response = await fetch(buildUrl(path, params), {
    method,
    headers,
    body: body === undefined ? undefined : JSON.stringify(body),
  });

  let payload: ApiResponse<T> | null = null;
  const text = await response.text();
  if (text) {
    try {
      payload = JSON.parse(text) as ApiResponse<T>;
    } catch {
      throw new ApiError("Phản hồi API không hợp lệ.", response.status);
    }
  }

  if (response.status === 401) {
    clearStoredSession();
    if (typeof window !== "undefined") window.dispatchEvent(new Event("rms:unauthorized"));
  }

  if (!response.ok || !payload?.success) {
    throw new ApiError(payload?.message || "Có lỗi khi gọi API.", response.status, payload?.errors ?? []);
  }

  return payload.data;
}

export const apiClient = {
  get: <T>(path: string, params?: QueryParams) => request<T>("GET", path, undefined, params),
  post: <T>(path: string, body?: unknown, params?: QueryParams) => request<T>("POST", path, body, params),
  put: <T>(path: string, body?: unknown, params?: QueryParams) => request<T>("PUT", path, body, params),
  delete: <T>(path: string, params?: QueryParams) => request<T>("DELETE", path, undefined, params),
};
