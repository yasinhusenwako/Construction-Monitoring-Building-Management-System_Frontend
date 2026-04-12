import type { Notification, UserRole } from "../data/mockData";
import { mockNotifications, mockUsers } from "../data/mockData";

const NOTIF_STORAGE_KEY = "insa-notifications";
const NOTIF_EVENT = "insa-notifications";

type Identifiable = { id: string };

function isBrowser() {
  return typeof window !== "undefined";
}

function loadList<T>(key: string): T[] {
  if (!isBrowser()) return [];
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as T[]) : [];
  } catch {
    return [];
  }
}

function saveList<T>(key: string, list: T[]) {
  if (!isBrowser()) return;
  window.localStorage.setItem(key, JSON.stringify(list));
}

function upsertList<T extends Identifiable>(list: T[], items: T | T[]): T[] {
  const nextItems = Array.isArray(items) ? items : [items];
  const map = new Map<string, T>();
  list.forEach((entry) => map.set(entry.id, entry));
  nextItems.forEach((entry) => map.set(entry.id, entry));
  return Array.from(map.values());
}

function notifyUpdate() {
  if (!isBrowser()) return;
  window.dispatchEvent(new Event(NOTIF_EVENT));
}

export function loadNotifications(): Notification[] {
  return loadList<Notification>(NOTIF_STORAGE_KEY);
}

export function getNotificationsWithStored(
  base: Notification[] = mockNotifications,
): Notification[] {
  const stored = loadNotifications();
  return upsertList(base, stored);
}

export function addNotification(notification: Notification) {
  const list = loadNotifications();
  const next = [notification, ...list.filter((n) => n.id !== notification.id)];
  saveList(NOTIF_STORAGE_KEY, next);
  notifyUpdate();
}

export function addNotifications(notifications: Notification[]) {
  if (notifications.length === 0) return;
  const list = loadNotifications();
  const next = upsertList(list, notifications);
  saveList(NOTIF_STORAGE_KEY, next);
  notifyUpdate();
}

export function markNotificationRead(id: string) {
  const list = loadNotifications();
  const next = list.map((n) => (n.id === id ? { ...n, read: true } : n));
  saveList(NOTIF_STORAGE_KEY, next);
  notifyUpdate();
}

export function markAllReadForUser(userId?: string) {
  if (!userId) return;
  const list = loadNotifications();
  const next = list.map((n) =>
    n.userId === userId ? { ...n, read: true } : n,
  );
  saveList(NOTIF_STORAGE_KEY, next);
  notifyUpdate();
}

export function getUserIdsByRole(role: UserRole): string[] {
  return mockUsers.filter((u) => u.role === role).map((u) => u.id);
}

export function createNotification(params: {
  title: string;
  message: string;
  userId: string;
  link: string;
  type?: Notification["type"];
}): Notification {
  const stamp = new Date().toISOString();
  const rand = Math.random().toString(36).slice(2, 6).toUpperCase();
  return {
    id: `NOTIF-${Date.now()}-${rand}`,
    title: params.title,
    message: params.message,
    type: params.type ?? "info",
    read: false,
    userId: params.userId,
    link: params.link,
    createdAt: stamp,
  };
}

export function getNotificationEventName() {
  return NOTIF_EVENT;
}
