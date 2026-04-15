import type { Booking, Maintenance, Project } from '@/data/mockData';

type Identifiable = { id: string };
const STORAGE_EVENT = "insa-storage";

const STORAGE_KEYS = {
  projects: "insa-projects-v2",
  bookings: "insa-bookings-v2",
  maintenance: "insa-maintenance-v2",
} as const;

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

function notifyStorageUpdate() {
  if (!isBrowser()) return;
  window.dispatchEvent(new Event(STORAGE_EVENT));
}

function upsertList<T extends Identifiable>(list: T[], item: T[]): T[];
function upsertList<T extends Identifiable>(list: T[], item: T): T[];
function upsertList<T extends Identifiable>(list: T[], item: T | T[]): T[] {
  const items = Array.isArray(item) ? item : [item];
  const map = new Map<string, T>();
  list.forEach((entry) => map.set(entry.id, entry));
  items.forEach((entry) => map.set(entry.id, entry));
  return Array.from(map.values());
}

function mergeById<T extends Identifiable>(base: T[], stored: T[]): T[] {
  const map = new Map<string, T>();
  base.forEach((item) => map.set(item.id, item));
  stored.forEach((item) => map.set(item.id, item));
  return Array.from(map.values());
}

export function loadProjects(): Project[] {
  return loadList<Project>(STORAGE_KEYS.projects);
}

export function loadBookings(): Booking[] {
  return loadList<Booking>(STORAGE_KEYS.bookings);
}

export function loadMaintenance(): Maintenance[] {
  return loadList<Maintenance>(STORAGE_KEYS.maintenance);
}

export function getProjectsWithStored(base: Project[]): Project[] {
  return mergeById(base, loadProjects());
}

export function getBookingsWithStored(base: Booking[]): Booking[] {
  return mergeById(base, loadBookings());
}

export function getMaintenanceWithStored(base: Maintenance[]): Maintenance[] {
  return mergeById(base, loadMaintenance());
}

export function addProject(item: Project) {
  const list = loadProjects();
  saveList(STORAGE_KEYS.projects, upsertList(list, item));
  notifyStorageUpdate();
}

export function updateProject(item: Project) {
  const list = loadProjects();
  saveList(STORAGE_KEYS.projects, upsertList(list, item));
  notifyStorageUpdate();
}

export function addBooking(item: Booking) {
  const list = loadBookings();
  saveList(STORAGE_KEYS.bookings, upsertList(list, item));
  notifyStorageUpdate();
}

export function updateBooking(item: Booking) {
  const list = loadBookings();
  saveList(STORAGE_KEYS.bookings, upsertList(list, item));
  notifyStorageUpdate();
}

export function addMaintenance(item: Maintenance) {
  const list = loadMaintenance();
  saveList(STORAGE_KEYS.maintenance, upsertList(list, item));
  notifyStorageUpdate();
}

export function updateMaintenance(item: Maintenance) {
  const list = loadMaintenance();
  saveList(STORAGE_KEYS.maintenance, upsertList(list, item));
  notifyStorageUpdate();
}
