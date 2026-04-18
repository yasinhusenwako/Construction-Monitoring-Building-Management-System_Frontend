"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from '@/context/AuthContext';
import { useLanguage } from '@/context/LanguageContext';
import {
  fetchLiveBookings,
  fetchLiveUsers,
  adminAssignRequest,
  adminDecision,
  supervisorReviewRequest,
  supervisorAssignProfessional,
  professionalUpdateTaskStatus,
} from "@/lib/live-api";
import { Booking, User as UserType, SpaceType, Space } from "@/types/models";
import {
  canTransition,
  canViewItem,
  getUserFacingStatus,
  WORKFLOW_STATUSES,
  WorkflowRole,
  WorkflowStatus,
} from '@/lib/workflow';

const initialSpaces = [
  { id: "SP-001", name: "Executive Conference Hall", capacity: 50, type: "Conference Hall", floor: "Floor 1", building: "Main Block", available: true },
  { id: "SP-002", name: "Tech Lab A", capacity: 20, type: "Lab", floor: "Floor 2", building: "IT Wing", available: false },
  { id: "SP-003", name: "Seminar Room 1", capacity: 100, type: "Conference Hall", floor: "Ground Floor", building: "Education Center", available: true },
];
import {
  Plus,
  Calendar,
  List,
  Copy,
  CheckCircle,
  Users,
  Clock,
  MapPin,
  ThumbsUp,
  ThumbsDown,
  Search,
  Pencil,
  Trash2,
  X,
  AlertTriangle,
  Building2,
  LayoutGrid,
} from "lucide-react";
import { StatusBadge } from "@/components/common/StatusBadge";

// Types are now imported from @/types/models

const SPACE_TYPES: SpaceType[] = [
  "Conference Hall",
  "Training Room",
  "Lab",
  "Office",
];

const TYPE_META: Record<
  SpaceType,
  { icon: string; color: string; bg: string }
> = {
  "Conference Hall": { icon: "🏛️", color: "#1A3580", bg: "#EEF2FF" },
  "Training Room": { icon: "📚", color: "#0E7490", bg: "#ECFEFF" },
  Lab: { icon: "🔬", color: "#7C3AED", bg: "#F5F3FF" },
  Office: { icon: "🏢", color: "#16A34A", bg: "#F0FDF4" },
};

// ─── Space Modal ──────────────────────────────────────────────────────────────
function SpaceModal({
  space,
  onSave,
  onClose,
}: {
  space: Space | null; // null = add mode
  onSave: (s: Space) => void;
  onClose: () => void;
}) {
  const { t } = useLanguage();
  const isEdit = !!space;
  const [form, setForm] = useState<Omit<Space, "id">>({
    name: space?.name ?? "",
    capacity: space?.capacity ?? 20,
    floor: space?.floor ?? "",
    building: space?.building ?? "",
    type: space?.type ?? "Conference Hall",
    available: space?.available ?? true,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const set = (k: keyof typeof form, v: string | number | boolean) => {
    setForm((f) => ({ ...f, [k]: v }));
    setErrors((e) => ({ ...e, [k]: "" }));
  };

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!form.name.trim()) errs.name = t("bookings.validation.nameReq");
    if (!form.floor.trim()) errs.floor = t("bookings.validation.floorReq");
    if (!form.capacity || form.capacity < 1)
      errs.capacity = t("bookings.validation.capacityReq");

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSave = () => {
    if (!validate()) return;
    onSave({
      id: space?.id ?? `SP-${String(Date.now()).slice(-4)}`,
      ...form,
    });
  };

  const inputCls = (field: string) =>
    `w-full px-3 py-2.5 rounded-lg border text-sm outline-none transition-all ${
      errors[field]
        ? "border-red-400 bg-red-50"
        : "border-border bg-white focus:border-[#1A3580] focus:ring-2 focus:ring-[#1A3580]/10"
    }`;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{
        background: "rgba(14,34,113,0.35)",
        backdropFilter: "blur(4px)",
      }}
    >
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
        {/* Header */}
        <div
          className="flex items-center justify-between px-6 py-4 border-b border-border bg-gradient-to-br from-[#0E2271] to-[#1A3580]"
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-white/15 flex items-center justify-center">
              <Building2 size={16} className="text-white" />
            </div>
            <div>
              <h2 className="text-white text-sm font-bold">
                {isEdit ? t("bookings.editSpace") : t("bookings.addNewSpace")}
              </h2>
              <p className="text-white/60 text-xs">
                {t("bookings.spaceAllocation")}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors"
          >
            <X size={14} />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-5 space-y-4">
          {/* Name */}
          <div>
            <label className="block text-xs font-semibold text-[#0E2271] mb-1.5 uppercase tracking-wide">
              {t("bookings.spaceName_label")}
            </label>
            <input
              value={form.name}
              onChange={(e) => set("name", e.target.value)}
              placeholder="e.g. Executive Conference Hall B"
              className={inputCls("name")}
            />
            {errors.name && (
              <p className="text-red-500 text-xs mt-1">{errors.name}</p>
            )}
          </div>

          {/* Type */}
          <div>
            <label className="block text-xs font-semibold text-[#0E2271] mb-1.5 uppercase tracking-wide">
              {t("bookings.spaceType_label")}
            </label>
            <div className="grid grid-cols-2 gap-2">
              {SPACE_TYPES.map((spaceType) => {
                const meta = TYPE_META[spaceType];
                const selected = form.type === spaceType;
                return (
                  <button
                    key={spaceType}
                    type="button"
                    onClick={() => set("type", spaceType)}
                    className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border-2 text-xs font-medium transition-all text-left ${
                      selected
                        ? "border-[#1A3580] text-[#1A3580]"
                        : "border-border text-muted-foreground hover:border-gray-300"
                    }`}
                    style={selected ? { background: meta.bg } : {}}
                  >
                    <span className="text-base">{meta.icon}</span>{" "}
                    {t(
                      `bookings.spaceType.${spaceType.charAt(0).toLowerCase() + spaceType.slice(1).replace(/\s+/g, "")}`,
                    )}
                    {selected && (
                      <CheckCircle
                        size={12}
                        className="ml-auto text-[#1A3580]"
                      />
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Capacity + Floor */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-[#0E2271] mb-1.5 uppercase tracking-wide">
                {t("bookings.capacity_label")}
              </label>
              <div className="relative">
                <Users
                  size={13}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                />
                <input
                  type="number"
                  min={1}
                  value={form.capacity}
                  onChange={(e) =>
                    set("capacity", parseInt(e.target.value) || 0)
                  }
                  className={`${inputCls("capacity")} pl-8`}
                  placeholder="e.g. 50"
                />
              </div>
              {errors.capacity && (
                <p className="text-red-500 text-xs mt-1">{errors.capacity}</p>
              )}
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#0E2271] mb-1.5 uppercase tracking-wide">
                {t("bookings.floorLocation")}
              </label>
              <div className="relative">
                <MapPin
                  size={13}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                />
                <input
                  value={form.floor}
                  onChange={(e) => set("floor", e.target.value)}
                  placeholder="e.g. Floor 3"
                  className={`${inputCls("floor")} pl-8`}
                />
              </div>
              {errors.floor && (
                <p className="text-red-500 text-xs mt-1">{errors.floor}</p>
              )}
            </div>
          </div>

          {/* Building */}
          <div>
            <label className="block text-xs font-semibold text-[#0E2271] mb-1.5 uppercase tracking-wide">
              {t("common.building") || "Building"}
            </label>
            <input
              value={form.building}
              onChange={(e) => set("building", e.target.value)}
              placeholder="e.g. Block A"
              className={inputCls("building")}
            />
          </div>

          {/* Availability toggle */}
          <div>
            <label className="block text-xs font-semibold text-[#0E2271] mb-1.5 uppercase tracking-wide">
              {t("bookings.availabilityStatus")}
            </label>
            <div className="flex gap-2">
              {[true, false].map((val) => (
                <button
                  key={String(val)}
                  type="button"
                  onClick={() => set("available", val)}
                  className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl border-2 text-xs font-semibold transition-all ${
                    form.available === val
                      ? val
                        ? "border-green-500 bg-green-50 text-green-700"
                        : "border-red-400 bg-red-50 text-red-700"
                      : "border-border text-muted-foreground hover:border-gray-300"
                  }`}
                >
                  <span
                    className={`w-2 h-2 rounded-full ${val ? "bg-green-500" : "bg-red-500"}`}
                  />
                  {val
                    ? t("bookings.available_btn")
                    : t("bookings.occupied_btn")}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-border flex gap-3 bg-secondary/30">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 rounded-xl border-2 border-border text-sm font-semibold text-muted-foreground hover:bg-secondary transition-colors"
          >
            {t("action.cancel")}
          </button>
          <button
            onClick={handleSave}
            className="flex-1 py-2.5 rounded-xl text-white text-sm font-semibold transition-all hover:opacity-90 bg-gradient-to-br from-[#0E2271] to-[#1A3580]"
          >
            {isEdit ? t("bookings.saveChanges") : t("bookings.addSpace")}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Delete Confirm Modal ─────────────────────────────────────────────────────
function DeleteConfirm({
  space,
  onConfirm,
  onClose,
}: {
  space: Space;
  onConfirm: () => void;
  onClose: () => void;
}) {
  const { t } = useLanguage();
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{
        background: "rgba(14,34,113,0.35)",
        backdropFilter: "blur(4px)",
      }}
    >
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden">
        <div className="px-6 py-5 text-center">
          <div className="w-14 h-14 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <Trash2 size={24} className="text-[#CC1F1A]" />
          </div>
          <h3 className="font-bold text-[#0E2271] mb-1">
            {t("bookings.deleteSpace")}
          </h3>
          <p className="text-sm text-muted-foreground mb-1">
            {t("bookings.confirmDeleteText")}
          </p>
          <p className="text-sm font-semibold text-[#CC1F1A] mb-4">
            "{space.name}"
          </p>
          <div className="flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 text-xs text-amber-800 text-left mb-5">
            <AlertTriangle size={13} className="flex-shrink-0 mt-0.5" />
            {t("bookings.deleteSpaceWarning")}
          </div>
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 py-2.5 rounded-xl border-2 border-border text-sm font-semibold text-muted-foreground hover:bg-secondary transition-colors"
            >
              {t("action.cancel")}
            </button>
            <button
              onClick={onConfirm}
              className="flex-1 py-2.5 rounded-xl bg-[#CC1F1A] text-white text-sm font-semibold hover:bg-red-700 transition-colors"
            >
              {t("bookings.yesDelete")}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export function BookingsPage() {
  const { currentUser } = useAuth();
  const { t } = useLanguage();
  const router = useRouter();
  const role = currentUser?.role;

  const [view, setView] = useState<"list" | "calendar" | "spaces">("list");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [copied, setCopied] = useState("");
  const [actionMsg, setActionMsg] = useState("");
  const [assignTarget, setAssignTarget] = useState<string | null>(null);
  const [selectedAssignee, setSelectedAssignee] = useState("");
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const refresh = async () => {
      setLoading(true);
      const token = sessionStorage.getItem("insa_token") ?? undefined;
      try {
        const [liveBookings, liveUsers] = await Promise.all([
          fetchLiveBookings(token),
          fetchLiveUsers(token),
        ]);
        setBookings(liveBookings);
        setUsers(liveUsers);
      } catch (error) {
        console.error("Failed to refresh bookings data:", error);
      } finally {
        setLoading(false);
      }
    };
    void refresh();
  }, []);

  // ─── Spaces state ────────────────────────────────────────────────────────────
  const [spaceList, setSpaceList] = useState<Space[]>(initialSpaces as unknown as Space[]);
  const [spaceModal, setSpaceModal] = useState<"add" | "edit" | null>(null);
  const [editTarget, setEditTarget] = useState<Space | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Space | null>(null);
  const [spaceTypeFilter, setSpaceTypeFilter] = useState<SpaceType | "All">(
    "All",
  );
  const [spaceSearch, setSpaceSearch] = useState("");

  // ─── Bookings ─────────────────────────────────────────────────────────────
  const filtered = bookings.filter((b) => {
    const matchRole = canViewItem(
      role as WorkflowRole | undefined,
      b,
      currentUser?.id,
    );
    const matchSearch =
      !search ||
      b.title.toLowerCase().includes(search.toLowerCase()) ||
      b.id.toLowerCase().includes(search.toLowerCase()) ||
      b.space.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === "All" || b.status === statusFilter;
    return matchRole && matchSearch && matchStatus;
  });

  const copyId = (id: string) => {
    try {
      navigator.clipboard.writeText(id);
    } catch {
      const ta = document.createElement("textarea");
      ta.value = id;
      ta.style.cssText = "position:fixed;opacity:0";
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
    }
    setCopied(id);
    setTimeout(() => setCopied(""), 2000);
  };


  const applyTransition = async (
    bookingId: string,
    currentStatus: WorkflowStatus,
    nextStatus: WorkflowStatus,
    actorRole: WorkflowRole,
    message: string,
    extraUpdates?: Partial<Booking>,
  ) => {
    if (!canTransition(actorRole, currentStatus, nextStatus)) {
      setActionMsg(t("bookings.notAllowed"));
      setTimeout(() => setActionMsg(""), 3000);
      return false;
    }

    const token = sessionStorage.getItem("insa_token") ?? undefined;
    const requestModule = "BOOKING";

    try {
      if (nextStatus === "Assigned to Supervisor" && actorRole === "admin") {
        await adminAssignRequest({
          module: requestModule,
          businessId: bookingId,
          supervisorId: extraUpdates?.supervisorId || "",
          divisionId: "DIV-001", // Fallback
          token,
        });
      } else if (nextStatus === "Assigned to Professional" && actorRole === "supervisor") {
        await supervisorAssignProfessional({
          module: requestModule,

          businessId: bookingId,
          professionalId: extraUpdates?.assignedTo || "",
          token,
        });
      } else if (nextStatus === "Reviewed" && actorRole === "supervisor") {
        await supervisorReviewRequest({ module: requestModule, businessId: bookingId, token });
      } else if (
        (nextStatus === "Approved" || nextStatus === "Rejected" || nextStatus === "Closed") &&
        actorRole === "admin"
      ) {
        const action = nextStatus.toLowerCase() as "approve" | "reject" | "close";
        await adminDecision({ module: requestModule, businessId: bookingId, action, token });
      } else if (
        (nextStatus === "In Progress" || nextStatus === "Completed") &&
        actorRole === "professional"
      ) {
        await professionalUpdateTaskStatus({
          module: requestModule,
          businessId: bookingId,
          status: nextStatus,
          token,
        });
      }

      // Update local state
      setBookings((prev) =>
        prev.map((b) =>
          b.id === bookingId
            ? { ...b, status: nextStatus, ...extraUpdates, updatedAt: new Date().toISOString() }
            : b
        )
      );
      setActionMsg(t(message));
      setTimeout(() => setActionMsg(""), 3000);
      return true;
    } catch (error) {
      console.error("Transition failed:", error);
      setActionMsg(t("requests.submitFailed"));
      setTimeout(() => setActionMsg(""), 3000);
      return false;
    }
  };

  // ─── Space CRUD handlers ──────────────────────────────────────────────────
  const handleSaveSpace = (s: Space) => {
    if (spaceModal === "edit") {
      setSpaceList((list) => list.map((sp) => (sp.id === s.id ? s : sp)));
      setActionMsg(t("bookings.spaceUpdated"));
    } else {
      setSpaceList((list) => [...list, s]);
      setActionMsg(t("bookings.spaceAdded"));
    }

    setSpaceModal(null);
    setEditTarget(null);
    setTimeout(() => setActionMsg(""), 3500);
  };

  const handleDeleteSpace = () => {
    if (!deleteTarget) return;
    setSpaceList((list) => list.filter((s) => s.id !== deleteTarget.id));
    setActionMsg(t("bookings.spaceDeleted"));

    setDeleteTarget(null);
    setTimeout(() => setActionMsg(""), 3500);
  };

  // ─── Filtered spaces ──────────────────────────────────────────────────────
  const filteredSpaces = spaceList.filter((s) => {
    const matchType = spaceTypeFilter === "All" || s.type === spaceTypeFilter;
    const matchSearch =
      !spaceSearch ||
      s.name.toLowerCase().includes(spaceSearch.toLowerCase()) ||
      s.floor.toLowerCase().includes(spaceSearch.toLowerCase());
    return matchType && matchSearch;
  });

  // ─── Calendar ─────────────────────────────────────────────────────────────
  const calendarBookings = bookings.reduce(
    (acc, b) => {
      acc[b.date] = acc[b.date] || [];
      acc[b.date].push(b);
      return acc;
    },
    {} as Record<string, Booking[]>,
  );

  const calendarDays = Array.from(
    { length: 31 },
    (_, i) => `2024-04-${String(i + 1).padStart(2, "0")}`,
  );

  const statuses = ["All", ...WORKFLOW_STATUSES];

  // ─── Stats for spaces header ───────────────────────────────────────────────
  const availableCount = spaceList.filter((s) => s.available).length;
  const occupiedCount = spaceList.filter((s) => !s.available).length;

  return (
    <div className="space-y-5">
      {/* Modals */}
      {(spaceModal === "add" || spaceModal === "edit") && (
        <SpaceModal
          space={spaceModal === "edit" ? editTarget : null}
          onSave={handleSaveSpace}
          onClose={() => {
            setSpaceModal(null);
            setEditTarget(null);
          }}
        />
      )}
      {deleteTarget && (
        <DeleteConfirm
          space={deleteTarget}
          onConfirm={handleDeleteSpace}
          onClose={() => setDeleteTarget(null)}
        />
      )}

      {/* Header */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-green-500" />
            <span className="text-xs font-semibold text-green-700 uppercase tracking-wider">
              {t("bookings.spaceAllocation")}
            </span>
          </div>
          <h1 className="text-[#0E2271]">{t("bookings.spaceAllocation")}</h1>
          <p className="text-muted-foreground text-sm">
            {filtered.length} {t("bookings.bookingsCount")}
          </p>
        </div>
        <div className="flex items-center gap-3">
          {/* View Toggle */}
          <div className="flex bg-secondary rounded-lg p-1">
            {[
              {
                key: "list",
                icon: <List size={14} />,
                label: t("bookings.list"),
              },
              {
                key: "calendar",
                icon: <Calendar size={14} />,
                label: t("bookings.calendar"),
              },
              {
                key: "spaces",
                icon: <LayoutGrid size={14} />,
                label: t("bookings.spaces"),
              },
            ].map((v) => (
              <button
                key={v.key}
                onClick={() => setView(v.key as any)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-medium transition-all ${
                  view === v.key
                    ? "bg-white shadow text-[#1A3580]"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {v.icon} {v.label}
              </button>
            ))}
          </div>

          {/* Add Space button — admin only, in Spaces view */}
          {role === "admin" && view === "spaces" && (
            <button
              onClick={() => setSpaceModal("add")}
              className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-white text-sm font-semibold shadow-sm transition-all hover:opacity-90"
              style={{
                background: "linear-gradient(135deg, #0E2271, #1A3580)",
              }}
            >
              <Plus size={16} /> {t("bookings.addSpace")}
            </button>
          )}

          {/* New Booking — user only */}
          {role === "user" && (
            <button
              onClick={() => router.push("/dashboard/bookings/new")}
              className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-white text-sm font-semibold shadow-sm"
              style={{
                background: "linear-gradient(135deg, #1A4D2E, #16A34A)",
              }}
            >
              <Plus size={16} /> {t("bookings.newBooking")}
            </button>
          )}
        </div>
      </div>

      {/* Action message */}
      {actionMsg && (
        <div className="bg-green-50 border border-green-200 rounded-lg px-4 py-3 text-sm text-green-700 flex items-center gap-2">
          <CheckCircle size={16} /> {actionMsg}
        </div>
      )}

      {/* ── LIST FILTERS ─────────────────────────────────────────────────────── */}
      {view === "list" && (
        <div className="bg-white rounded-xl border border-border p-4 shadow-sm flex gap-3 flex-wrap">
          <div className="relative flex-1 min-w-48">
            <Search
              size={14}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
            />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t("bookings.searchBookings")}
              className="w-full pl-9 pr-4 py-2 rounded-lg border border-border bg-input-background text-sm outline-none focus:border-[#1A3580]"
            />
          </div>
          <div className="flex gap-2 flex-wrap">
            {statuses.map((s) => (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                  statusFilter === s
                    ? "bg-green-600 text-white"
                    : "bg-secondary text-muted-foreground hover:bg-muted"
                }`}
              >
                {s === "All"
                  ? t("status.all")
                  : t(
                      `status.${s.charAt(0).toLowerCase() + s.slice(1).replace(/\s+/g, "")}`,
                    )}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ── LIST VIEW ────────────────────────────────────────────────────────── */}
      {view === "list" && (
        <div className="space-y-3">
          {filtered.length === 0 ? (
            <div className="bg-white rounded-xl border border-border p-16 text-center">
              <Calendar
                size={48}
                className="mx-auto text-muted-foreground/40 mb-3"
              />
              <h3 className="text-[#0E2271]">
                {t("bookings.noBookingsFound")}
              </h3>
              <p className="text-muted-foreground text-sm">
                {t("bookings.noBookingsMatch")}
              </p>
            </div>
          ) : (
            filtered.map((booking) => (
              <div
                key={booking.id}
                className="bg-white rounded-xl border border-border p-5 shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between gap-4 flex-wrap">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-mono text-xs font-bold text-green-700">
                        {booking.id}
                      </span>
                      <button
                        onClick={() => copyId(booking.id)}
                        className="text-muted-foreground hover:text-green-700"
                      >
                        {copied === booking.id ? (
                          <CheckCircle size={12} className="text-green-500" />
                        ) : (
                          <Copy size={12} />
                        )}
                      </button>
                      <StatusBadge status={booking.status} />
                      <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded">
                        {booking.type}
                      </span>
                    </div>
                    <h3 className="font-semibold text-[#0E2271]">
                      {booking.title}
                    </h3>
                    <p className="text-sm text-muted-foreground mt-0.5">
                      {booking.space}
                    </p>
                    <div className="flex items-center gap-4 mt-2 flex-wrap">
                      <span className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Calendar size={12} /> {booking.date}
                      </span>
                      <span className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Clock size={12} /> {booking.startTime} –{" "}
                        {booking.endTime}
                      </span>
                      <span className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Users size={12} /> {booking.attendees}{" "}
                        {t("dashboard.attendees")}
                      </span>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <button
                      onClick={() =>
                        router.push(`/dashboard/bookings/${booking.id}`)
                      }
                      className="flex items-center gap-2 px-4 py-2 rounded-lg bg-green-600 text-white text-xs font-semibold hover:bg-green-700 hover:shadow-md transition-all mt-2"
                    >
                      {t("projects.review") || "Review Booking"}
                    </button>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground mt-2 line-clamp-1">
                  {booking.purpose}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  <span className="font-medium">
                    {t("bookings.requirements")}:
                  </span>{" "}
                  {booking.requirements}
                </p>
              </div>
            ))
          )}
        </div>
      )}

      {/* ── CALENDAR VIEW ────────────────────────────────────────────────────── */}
      {view === "calendar" && (
        <div className="bg-white rounded-xl border border-border shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-border flex items-center justify-between">
            <h3 className="font-semibold text-[#0E2271]">April 2024</h3>
            <div className="flex gap-2 text-sm text-muted-foreground">
              <button className="px-3 py-1 rounded border border-border hover:bg-secondary">
                ← Mar
              </button>
              <button className="px-3 py-1 rounded border border-border hover:bg-secondary">
                May →
              </button>
            </div>
          </div>
          <div className="grid grid-cols-7 border-b border-border">
            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
              <div
                key={d}
                className="text-center text-xs font-semibold text-muted-foreground py-2"
              >
                {d}
              </div>
            ))}
          </div>
          <div className="grid grid-cols-7">
            <div className="border-r border-b border-border p-1 min-h-[80px]" />
            {calendarDays.slice(0, 30).map((date, i) => {
              const dayBookings = calendarBookings[date] || [];
              const isToday = date === "2024-04-18";
              return (
                <div
                  key={date}
                  className={`border-r border-b border-border p-1 min-h-[80px] ${isToday ? "bg-blue-50" : "hover:bg-secondary/30"} transition-colors`}
                >
                  <p
                    className={`text-xs font-semibold mb-1 w-6 h-6 flex items-center justify-center rounded-full ${
                      isToday ? "bg-[#1A3580] text-white" : "text-foreground"
                    }`}
                  >
                    {i + 1}
                  </p>
                  {dayBookings.slice(0, 2).map((b) => (
                    <div
                      key={b.id}
                      className={`text-xs px-1 py-0.5 rounded mb-0.5 truncate ${
                        b.status === "Approved"
                          ? "bg-green-100 text-green-800"
                          : ["Submitted", "Under Review"].includes(b.status)
                            ? "bg-amber-100 text-amber-800"
                            : b.status === "Rejected"
                              ? "bg-red-100 text-red-800"
                              : "bg-blue-100 text-blue-800"
                      }`}
                      title={b.title}
                    >
                      {b.startTime} {b.space.split(" ").slice(0, 2).join(" ")}
                    </div>
                  ))}
                  {dayBookings.length > 2 && (
                    <p className="text-xs text-muted-foreground">
                      +{dayBookings.length - 2} more
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════
          SPACES VIEW
      ══════════════════════════════════════════════════════════════════════ */}
      {view === "spaces" && (
        <div className="space-y-4">
          {/* Stats bar */}
          <div className="grid grid-cols-3 gap-3">
            {[
              {
                label: t("bookings.totalSpaces"),
                value: spaceList.length,
                color: "#1A3580",
                bg: "#EEF2FF",
              },
              {
                label: t("bookings.availableSpacesCount"),
                value: availableCount,
                color: "#16A34A",
                bg: "#F0FDF4",
              },
              {
                label: t("bookings.occupiedSpaces"),
                value: occupiedCount,
                color: "#CC1F1A",
                bg: "#FFF1F1",
              },
            ].map((stat) => (
              <div
                key={stat.label}
                className="bg-white rounded-xl border border-border px-4 py-3 shadow-sm flex items-center gap-3"
              >
                <div
                  className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
                  style={{ background: stat.bg }}
                >
                  <span
                    className="text-lg font-bold"
                    style={{ color: stat.color }}
                  >
                    {stat.value}
                  </span>
                </div>
                <span className="text-xs font-medium text-muted-foreground">
                  {stat.label}
                </span>
              </div>
            ))}
          </div>

          {/* Search & filter bar */}
          <div className="bg-white rounded-xl border border-border p-3 shadow-sm flex gap-3 flex-wrap items-center">
            <div className="relative flex-1 min-w-48">
              <Search
                size={13}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
              />
              <input
                value={spaceSearch}
                onChange={(e) => setSpaceSearch(e.target.value)}
                placeholder={t("bookings.searchSpaces")}
                className="w-full pl-9 pr-4 py-2 rounded-lg border border-border bg-input-background text-sm outline-none focus:border-[#1A3580]"
              />
            </div>
            <div className="flex gap-2 flex-wrap">
              {(["All", ...SPACE_TYPES] as const).map((typeOpt) => (
                <button
                  key={typeOpt}
                  onClick={() => setSpaceTypeFilter(typeOpt as any)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                    spaceTypeFilter === typeOpt
                      ? "bg-[#1A3580] text-white"
                      : "bg-secondary text-muted-foreground hover:bg-muted"
                  }`}
                >
                  {typeOpt === "All" ? t("bookings.allTypes") : typeOpt}
                </button>
              ))}
            </div>
          </div>

          {/* Space Cards Grid */}
          {filteredSpaces.length === 0 ? (
            <div className="bg-white rounded-xl border border-border p-16 text-center">
              <Building2
                size={40}
                className="mx-auto text-muted-foreground/30 mb-3"
              />
              <h3 className="text-[#0E2271]">{t("bookings.noSpacesFound")}</h3>
              <p className="text-sm text-muted-foreground">
                {t("bookings.tryAdjustFilters")}
              </p>
              {role === "admin" && (
                <button
                  onClick={() => setSpaceModal("add")}
                  className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-lg text-white text-sm font-semibold"
                  style={{
                    background: "linear-gradient(135deg, #0E2271, #1A3580)",
                  }}
                >
                  <Plus size={14} /> {t("bookings.addFirstSpace")}
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {filteredSpaces.map((space) => {
                const meta = TYPE_META[space.type];
                return (
                  <div
                    key={space.id}
                    className={`bg-white rounded-xl border-2 shadow-sm p-4 transition-all hover:shadow-md ${
                      space.available ? "border-green-200" : "border-red-200"
                    }`}
                  >
                    {/* Top row: status + type icon */}
                    <div className="flex items-start justify-between mb-3">
                      <span
                        className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                          space.available
                            ? "bg-green-50 text-green-700"
                            : "bg-red-50 text-red-700"
                        }`}
                      >
                        <span
                          className={`inline-block w-1.5 h-1.5 rounded-full mr-1 ${
                            space.available ? "bg-green-500" : "bg-red-500"
                          }`}
                          style={{ verticalAlign: "middle" }}
                        />
                        {space.available
                          ? t("bookings.available_btn")
                          : t("bookings.occupied_btn")}
                      </span>
                      <div className="flex items-center gap-1">
                        <span className="text-base">{meta.icon}</span>
                        <span
                          className="text-xs text-muted-foreground bg-secondary px-1.5 py-0.5 rounded"
                          style={{ color: meta.color, background: meta.bg }}
                        >
                          {space.type}
                        </span>
                      </div>
                    </div>

                    {/* Space name & ID */}
                    <h4 className="font-semibold text-[#0E2271] text-sm leading-snug mb-0.5">
                      {space.name}
                    </h4>
                    <p className="text-xs font-mono text-muted-foreground mb-2">
                      {space.id}
                    </p>

                    {/* Capacity + Floor */}
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Users size={11} /> {space.capacity}{" "}
                        {t("bookings.seats")}
                      </span>
                      <span className="flex items-center gap-1">
                        <MapPin size={11} /> {space.floor}
                      </span>
                    </div>

                    {/* Separator */}
                    <div className="border-t border-border my-3" />

                    {/* Action buttons */}
                    {role === "admin" ? (
                      <div className="flex gap-2">
                        <button
                          onClick={() => {
                            setEditTarget(space);
                            setSpaceModal("edit");
                          }}
                          className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg border-2 border-[#1A3580]/30 text-[#1A3580] text-xs font-semibold hover:bg-[#EEF2FF] hover:border-[#1A3580] transition-all"
                        >
                          <Pencil size={12} /> {t("action.edit")}
                        </button>
                        <button
                          onClick={() => setDeleteTarget(space)}
                          className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg border-2 border-red-200 text-[#CC1F1A] text-xs font-semibold hover:bg-red-50 hover:border-red-400 transition-all"
                        >
                          <Trash2 size={12} /> {t("action.delete")}
                        </button>
                      </div>
                    ) : space.available ? (
                      <button
                        onClick={() => router.push("/dashboard/bookings/new")}
                        className="w-full py-1.5 rounded-lg text-xs font-semibold text-white"
                        style={{ background: "#16A34A" }}
                      >
                        {t("bookings.bookNow")}
                      </button>
                    ) : (
                      <div className="w-full py-1.5 rounded-lg text-xs font-semibold text-center text-muted-foreground bg-gray-100">
                        {t("bookings.currentlyBooked")}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
