"use client";

import { useState, useEffect } from "react";
import { User, UserRole } from "@/types/models";
import { fetchLiveUsers } from "@/lib/live-api";
import { StatusBadge, RoleBadge } from "@/components/common/StatusBadge";
import {
  Search,
  Plus,
  Edit,
  Power,
  UserPlus,
  X,
  CheckCircle,
} from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";

export function UsersPage() {
  const { t } = useLanguage();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");
  const [showModal, setShowModal] = useState(false);
  const [editUser, setEditUser] = useState<User | null>(null);
  const [actionMsg, setActionMsg] = useState("");
  const [loadError, setLoadError] = useState("");

  useEffect(() => {
    async function loadUsers() {
      setLoading(true);
      setLoadError("");
      try {
        const token =
          sessionStorage.getItem("insa_token") ||
          localStorage.getItem("insa_token") ||
          undefined;
        const liveUsers = await fetchLiveUsers(token);
        setUsers(liveUsers as User[]);
      } catch (err) {
        console.error("Failed to load users", err);
        setLoadError(err instanceof Error ? err.message : "Failed to load users");
        setUsers([]);
      } finally {
        setLoading(false);
      }
    }
    loadUsers();
  }, []);

  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    department: "",
    role: "user" as UserRole,
    status: "active" as const,
  });

  const filtered = users.filter((u) => {
    const matchSearch =
      !search ||
      u.name.toLowerCase().includes(search.toLowerCase()) ||
      (u.email || "").toLowerCase().includes(search.toLowerCase()) ||
      u.id.toLowerCase().includes(search.toLowerCase());
    const matchRole = roleFilter === "All" || u.role === roleFilter;
    const matchStatus = statusFilter === "All" || u.status === statusFilter;
    return matchSearch && matchRole && matchStatus;
  });

  const openEdit = (user: User) => {
    setEditUser(user);
    setForm({
      name: user.name,
      email: user.email,
      phone: user.phone,
      department: user.department,
      role: user.role as any,
      status: user.status as any,
    });
    setShowModal(true);
  };

  const openCreate = () => {
    setEditUser(null);
    setForm({
      name: "",
      email: "",
      phone: "",
      department: "",
      role: "user",
      status: "active",
    });
    setShowModal(true);
  };

  const handleSave = () => {
    if (editUser) {
      setUsers((prev) =>
        prev.map((u) => (u.id === editUser.id ? { ...u, ...form } : u)),
      );
      setActionMsg(t("users.userUpdated"));
    } else {
      const newUser: User = {
        id: `USR-${String(users.length + 1).padStart(3, "0")}`,
        name: form.name,
        email: form.email,
        phone: form.phone,
        department: form.department,
        role: form.role,
        status: form.status,
        password: "password123",
        avatar: form.name
          .split(" ")
          .map((n) => n[0])
          .join("")
          .toUpperCase()
          .slice(0, 2),
        createdAt: new Date().toISOString().split("T")[0],
      };
      setUsers((prev) => [...prev, newUser]);
      setActionMsg(t("users.userCreated"));
    }
    setShowModal(false);
    setTimeout(() => setActionMsg(""), 3000);
  };

  const toggleStatus = (userId: string) => {
    setUsers((prev) =>
      prev.map((u) => {
        if (u.id !== userId) return u;
        const newStatus = u.status === "active" ? "inactive" : "active";
        return { ...u, status: newStatus };
      }),
    );
    setActionMsg(t("users.userUpdated"));
    setTimeout(() => setActionMsg(""), 3000);
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-[#0E2271]">{t("users.title")}</h1>
          <p className="text-muted-foreground text-sm">
            {filtered.length} {t("users.usersCount")} ·{" "}
            {users.filter((u) => u.status === "active").length}{" "}
            {t("users.active_count")}
          </p>
        </div>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-white text-sm font-semibold shadow-sm bg-gradient-to-br from-[#0E2271] to-[#1A3580]"
        >
          <UserPlus size={16} /> {t("users.addNewUser")}
        </button>
      </div>

      {actionMsg && (
        <div className="bg-green-50 border border-green-200 rounded-lg px-4 py-3 text-sm text-green-700 flex items-center gap-2">
          <CheckCircle size={16} /> {actionMsg}
        </div>
      )}
      {loadError && (
        <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-sm text-red-700">
          {loadError}
        </div>
      )}

      {/* Filters */}
      <div className="bg-white rounded-xl border border-border p-4 shadow-sm flex gap-3 flex-wrap">
        <div className="relative flex-1 min-w-48">
          <Search
            size={14}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
          />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t("users.searchByNameEmailID")}
            className="w-full pl-9 pr-4 py-2 rounded-lg border border-border bg-input-background text-sm outline-none focus:border-[#1A3580]"
          />
        </div>
        <select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
          className="px-3 py-2 rounded-lg border border-border bg-input-background text-sm outline-none cursor-pointer"
        >
          <option value="All">{t("users.allRoles")}</option>
          <option value="admin">{t("role.admin")}</option>
          <option value="supervisor">{t("role.supervisor")}</option>
          <option value="professional">{t("role.professional")}</option>
          <option value="user">{t("role.user")}</option>
        </select>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3 py-2 rounded-lg border border-border bg-input-background text-sm outline-none cursor-pointer"
        >
          <option value="All">{t("users.allStatuses")}</option>
          <option value="active">{t("users.active")}</option>
          <option value="inactive">{t("users.inactive")}</option>
          <option value="locked">{t("users.locked")}</option>
        </select>
      </div>

      {/* Role Stats */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { role: "admin", label: t("role.admin"), color: "#1A3580" },
          { role: "supervisor", label: t("role.supervisor"), color: "#7C3AED" },
          {
            role: "professional",
            label: t("role.professional"),
            color: "#CC1F1A",
          },
          { role: "user", label: t("users.standardUsers"), color: "#F5B800" },
        ].map((r) => (
          <div
            key={r.role}
            className="bg-white rounded-xl border-2 border-border p-4 shadow-sm"
            style={{ borderColor: r.color + "30" }}
          >
            <p className="text-2xl font-bold" style={{ color: r.color }}>
              {users.filter((u) => u.role === r.role).length}
            </p>
            <p className="text-sm text-muted-foreground">{r.label}</p>
          </div>
        ))}
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-xl border border-border shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-secondary/50">
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase">
                  {t("users.user_col")}
                </th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase">
                  {t("users.id_col")}
                </th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase">
                  {t("users.department_col")}
                </th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase">
                  {t("users.role_col")}
                </th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase">
                  {t("users.status_col")}
                </th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase">
                  {t("users.joined_col")}
                </th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase">
                  {t("users.actions_col")}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.map((user) => (
                <tr
                  key={user.id}
                  className="hover:bg-secondary/30 transition-colors"
                >
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-semibold flex-shrink-0 text-white"
                        style={{
                          background:
                            user.role === "admin"
                              ? "#1A3580"
                              : user.role === "supervisor"
                                ? "#7C3AED"
                                : user.role === "professional"
                                  ? "#CC1F1A"
                                  : "#F5B800",
                          color: user.role === "user" ? "#1A1A1A" : "white",
                        }}
                      >
                        {user.avatar}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-foreground">
                          {user.name}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {user.email}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 font-mono text-xs text-[#1A3580] font-semibold">
                    {user.id}
                  </td>
                  <td className="px-4 py-3 text-sm text-muted-foreground">
                    {user.department}
                  </td>
                  <td className="px-4 py-3">
                    <RoleBadge role={user.role} />
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge status={user.status} />
                  </td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">
                    {user.createdAt}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => openEdit(user)}
                        className="flex items-center gap-1 text-xs text-[#1A3580] hover:underline font-medium"
                      >
                        <Edit size={12} /> {t("users.edit_btn")}
                      </button>
                      <button
                        onClick={() => toggleStatus(user.id)}
                        className={`flex items-center gap-1 text-xs font-medium hover:underline ${user.status === "active" ? "text-[#CC1F1A]" : "text-green-600"}`}
                      >
                        <Power size={12} />{" "}
                        {user.status === "active"
                          ? t("users.disable_btn")
                          : t("users.enable_btn")}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="px-4 py-3 border-t border-border bg-secondary/30">
          <p className="text-xs text-muted-foreground">
            {t("users.showing")} {filtered.length} {t("users.of")}{" "}
            {users.length} {t("users.users")}
          </p>
        </div>
      </div>

      {/* Create/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold text-[#0E2271]">
                {editUser ? t("users.editUser") : t("users.createNewUser")}
              </h2>
              <button
                onClick={() => setShowModal(false)}
                className="text-muted-foreground hover:text-foreground"
              >
                <X size={20} />
              </button>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-[#0E2271] mb-1">
                    {t("users.fullName")} *
                  </label>
                  <input
                    value={form.name}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, name: e.target.value }))
                    }
                    placeholder={t("users.fullName")}
                    className="w-full px-3 py-2 rounded-lg border border-border bg-input-background text-sm outline-none focus:border-[#1A3580]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-[#0E2271] mb-1">
                    {t("users.emailAddress")} *
                  </label>
                  <input
                    type="email"
                    value={form.email}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, email: e.target.value }))
                    }
                    placeholder="email@insa.gov.et"
                    className="w-full px-3 py-2 rounded-lg border border-border bg-input-background text-sm outline-none focus:border-[#1A3580]"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-[#0E2271] mb-1">
                    {t("users.phone_label")}
                  </label>
                  <input
                    value={form.phone}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, phone: e.target.value }))
                    }
                    placeholder="+251 9XX XXX XXX"
                    className="w-full px-3 py-2 rounded-lg border border-border bg-input-background text-sm outline-none focus:border-[#1A3580]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-[#0E2271] mb-1">
                    {t("users.department_label")}
                  </label>
                  <input
                    value={form.department}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, department: e.target.value }))
                    }
                    placeholder={t("form.department")}
                    className="w-full px-3 py-2 rounded-lg border border-border bg-input-background text-sm outline-none focus:border-[#1A3580]"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-[#0E2271] mb-1">
                    {t("users.role_label")}
                  </label>
                  <select
                    value={form.role}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, role: e.target.value as any }))
                    }
                    className="w-full px-3 py-2 rounded-lg border border-border bg-input-background text-sm outline-none"
                  >
                    <option value="user">{t("role.user")}</option>
                    <option value="supervisor">{t("role.supervisor")}</option>
                    <option value="professional">
                      {t("role.professional")}
                    </option>
                    <option value="admin">{t("role.admin")}</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-[#0E2271] mb-1">
                    {t("users.status_label")}
                  </label>
                  <select
                    value={form.status}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, status: e.target.value as any }))
                    }
                    className="w-full px-3 py-2 rounded-lg border border-border bg-input-background text-sm outline-none"
                  >
                    <option value="active">{t("users.active")}</option>
                    <option value="inactive">{t("users.inactive")}</option>
                    <option value="locked">{t("users.locked")}</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowModal(false)}
                className="flex-1 py-2.5 rounded-lg border-2 border-border text-muted-foreground text-sm font-semibold hover:bg-secondary"
              >
                {t("action.cancel")}
              </button>
              <button
                onClick={handleSave}
                className="flex-1 py-2.5 rounded-lg text-white text-sm font-semibold"
                style={{
                  background: "linear-gradient(135deg, #0E2271, #1A3580)",
                }}
              >
                {editUser
                  ? t("users.saveChanges_btn")
                  : t("users.createUser_btn")}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
