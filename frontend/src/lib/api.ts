export const API_URL = (import.meta.env.VITE_API_URL as string) || "http://localhost:4100/api";

export class ApiError extends Error {
  status: number;
  details?: unknown;
  constructor(message: string, status: number, details?: unknown) {
    super(message);
    this.status = status;
    this.details = details;
  }
}

export type RequestOptions = Omit<RequestInit, "body"> & { body?: unknown; auth?: boolean };

export function getToken() {
  return localStorage.getItem("organic_token");
}

export function setToken(token: string | null) {
  if (token) localStorage.setItem("organic_token", token);
  else localStorage.removeItem("organic_token");
}

export async function api<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { body, auth = true, headers, ...rest } = options;
  const token = getToken();
  const response = await fetch(`${API_URL}${path}`, {
    ...rest,
    headers: {
      ...(body !== undefined ? { "Content-Type": "application/json" } : {}),
      ...(auth && token ? { Authorization: `Bearer ${token}` } : {}),
      ...(headers || {}),
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  });

  if (response.status === 204) return undefined as T;
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    if (response.status === 401 && auth) {
      setToken(null);
      window.dispatchEvent(new Event("organic:unauthorized"));
    }
    throw new ApiError(data.error || "Request failed", response.status, data.details);
  }
  return data as T;
}

export function errorMessage(error: unknown) {
  if (error instanceof ApiError) return error.message;
  if (error instanceof Error) return error.message;
  return "Something went wrong";
}
