import AsyncStorage from "@react-native-async-storage/async-storage";
import { Platform } from "react-native";

const defaultHost = Platform.OS === "android" ? "10.0.2.2" : "localhost";
export const API_URL = process.env.EXPO_PUBLIC_API_URL || `http://${defaultHost}:4100/api`;
const TOKEN_KEY = "organic_token";

let token: string | null = null;
let unauthorizedHandler: (() => void) | null = null;

export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

export async function loadStoredToken() {
  token = await AsyncStorage.getItem(TOKEN_KEY);
  return token;
}

export async function setAuthToken(value: string | null) {
  token = value;
  if (value) await AsyncStorage.setItem(TOKEN_KEY, value);
  else await AsyncStorage.removeItem(TOKEN_KEY);
}

export function setUnauthorizedHandler(handler: (() => void) | null) {
  unauthorizedHandler = handler;
}

type Options = Omit<RequestInit, "body"> & { body?: unknown; auth?: boolean };

export async function api<T>(path: string, options: Options = {}): Promise<T> {
  const { body, auth = false, headers, ...rest } = options;
  const response = await fetch(`${API_URL}${path}`, {
    ...rest,
    headers: {
      ...(body === undefined ? {} : { "Content-Type": "application/json" }),
      ...(auth && token ? { Authorization: `Bearer ${token}` } : {}),
      ...(headers || {}),
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  });

  if (response.status === 204) return undefined as T;

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    if (response.status === 401 && auth) {
      await setAuthToken(null);
      unauthorizedHandler?.();
    }
    throw new ApiError(data.error || "Something went wrong", response.status);
  }
  return data as T;
}

export function errorMessage(error: unknown) {
  if (error instanceof ApiError) return error.message;
  if (error instanceof Error) return error.message;
  return "Something went wrong";
}
