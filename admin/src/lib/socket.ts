import { io, type Socket } from "socket.io-client";
import { API_URL, getToken } from "./api";
import type { Order } from "../types";

const SOCKET_URL = /^https?:\/\//i.test(API_URL) ? API_URL.replace(/\/api\/?$/, "") : window.location.origin;

export type OrderHistoryEntry = NonNullable<Order["statusHistory"]>[number];

export interface OrderRealtimePayload {
  order: Partial<Order> & { orderNumber: string };
  history?: OrderHistoryEntry | null;
  note?: string | null;
}

let socket: Socket | null = null;

export function getSocket() {
  if (!socket) {
    socket = io(SOCKET_URL, {
      autoConnect: false,
      tryAllTransports: true,
      auth: (callback) => callback({ token: getToken() || undefined }),
    });
  }
  return socket;
}

export function connectSocket() {
  const instance = getSocket();
  if (!instance.connected) instance.connect();
  return instance;
}

export function refreshSocketAuth() {
  if (!socket || !socket.connected) return;
  socket.disconnect();
  socket.connect();
}

export function disconnectSocket() {
  socket?.disconnect();
}

export function mergeOrderUpdate(previous: Order | null, payload: OrderRealtimePayload): Order | null {
  if (!previous || !payload?.order || payload.order.orderNumber !== previous.orderNumber) return previous;
  const statusHistory = previous.statusHistory ? [...previous.statusHistory] : [];
  if (payload.history && !statusHistory.some((entry) => entry.id === payload.history!.id)) {
    statusHistory.push(payload.history);
  }
  return {
    ...previous,
    ...payload.order,
    statusHistory: statusHistory.length ? statusHistory : previous.statusHistory,
  };
}
