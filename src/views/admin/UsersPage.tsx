"use client";

import { useState, useEffect } from "react";
import { divisions, User, UserRole } from "@/types/models";
import { StatusBadge, RoleBadge } from "@/components/common/StatusBadge";
import {
  Search,
  Plus,
  Edit,
  Power,
  UserPlus,
  X,
  CheckCircle,
  Trash2,
  Key,
} from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";
import { keycloakUserApi, KeycloakUser } from "@/lib/keycloak-user-api";

const PROFESSIONAL_OTHER_DIVISION_ID = "other"; // Changed to lowercase to match Keycloak attribute

// Map Keycloak roles to frontend roles
const mapKeycloakRoleToFrontend = (roles: string[]): UserRole => {
  if (roles.includes("ADMIN")) return "admin";
  if (roles.includes("SUPERVISOR")) return "supervisor";
  if (roles.includes("PROFESSIONAL")) return "professional";
  return "user";
};

// Map frontend role to Keycloak role
const mapFrontendRoleToKeycloak = (role: UserRole): string => {
  switch (role) {
    case "admin": return "ADMIN";
    case "supervisor": return "SUPERVISOR";
    case "professional": return "PROFESSIONAL";
    case "user": return "USER";
    default: return "USER";
  }
};

// Convert Keycloak user to frontend User format
const convertKeycloakUserToFrontend = (kUser: KeycloakUser): User => {
  const role = mapKeycloakRoleToFrontend(kUser.roles);
  const name = `${kUser.firstName || ''} ${kUser.lastName || ''}`.trim() || kUser.username;
  
  return {
    id: kUser.id,
    name,
    email: kUser.email,
    phone: kUser.phone || "",
    department: kUser.department || "",
    divisionId: kUser.divisionId,
    profession: kUser.profession,
    role,
    status: kUser.status as any,
    password: "", // Not used with Keycloak
    avatar: kUser.avatar,
    createdAt: kUser.createdTimestamp 
      ? new Date(kUser.createdTimestamp).toISOString().split("T")[0]
      : new Date().toISOString().split("T")[0],
  };
};

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
        const keycloakUsers = await keycloakUserApi.getAllUsers();
        const frontendUsers = keycloakUsers.map(convertKeycloakUserToFrontend);
        setUsers(frontendUsers);
      } catch (err) {
        console.error("Failed to load users from Keycloak", err);
        setLoadError(
          err instanceof Error ? err.message : "Failed to load users from Keycloak",
        );
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
    divisionId: "",
    profession: "",
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

  const getDivisionName = (user: User) => {
    // Handle "other" division (case-insensitive)
    if (user.divisionId && user.divisionId.toLowerCase() === "other") {
      return "Other (Project/Booking)";
    }
    // Handle standard divisions (1, 2, 3)
    if (user.divisionId) {
      const division = divisions.find((d) => d.id === user.divisionId);
      if (division) {
        return division.name;
      }
      // If divisionId exists but no matching division found, show the ID
      console.warn(`Division not found for divisionId: ${user.divisionId}`);
      return `Division ${user.divisionId}`;
    }
    // No division assigned
    return "";
  };

  const openEdit = (user: User) => {
    setEditUser(user);
    const knownDivisionId =
      user.divisionId || divisions.find((d) => d.name === user.department)?.id;
    const divisionId =
      knownDivisionId ||
      (user.role === "professional" &&
      user.department === "Other (Project/Booking)"
        ? PROFESSIONAL_OTHER_DIVISION_ID
        : "");
    setForm({
      name: user.name,
      email: user.email,
      phone: user.phone,
      department: user.department,
      divisionId,
      profession: user.role === "professional" ? user.profession || "" : "",
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
      divisionId: "",
      profession: "",
      role: "user",
      status: "active",
    });
    setShowModal(true);
  };

  const handleSave = async () => {
    const selectedDivision = divisions.find((d) => d.id === form.divisionId);
    const needsDivision =
      form.role === "supervisor" || form.role === "professional";
    const needsProfession = form.role === "professional";
    const isOtherDivision =
      form.role === "professional" &&
      form.divisionId === PROFESSIONAL_OTHER_DIVISION_ID;
    const isKnownDivision = !!selectedDivision;
    
    if (needsDivision && !isKnownDivision && !isOtherDivision) {
      alert("Please select a division.");
      return;
    }
    if (needsProfession && !form.profession.trim()) {
      alert("Please enter profession.");
      return;
    }
    
    // Always use the department field as-is (don't override with division name)
    const resolvedDepartment = form.department.trim();
    
    // Only set divisionId for supervisor/professional roles
    const resolvedDivisionId =
      form.role === "supervisor" || form.role === "professional"
        ? form.divisionId
        : undefined;
    
    // Only set profession for professional role
    const resolvedProfession = 
      form.role === "professional" ? form.profession.trim() : undefined;

    const keycloakRole = mapFrontendRoleToKeycloak(form.role);

    if (editUser) {
      try {
        // Split name into first and last name
        const nameParts = form.name.trim().split(" ");
        const firstName = nameParts[0] || "";
        const lastName = nameParts.slice(1).join(" ") || "";

        await keycloakUserApi.updateUser(editUser.id, {
          email: form.email,
          firstName,
          lastName,
          enabled: form.status === "active",
          roles: [keycloakRole],
          phone: form.phone || "",
          department: resolvedDepartment || "",
          divisionId: resolvedDivisionId || "",
          profession: resolvedProfession || "",
        });

        // Reload users
        const keycloakUsers = await keycloakUserApi.getAllUsers();
        const frontendUsers = keycloakUsers.map(convertKeycloakUserToFrontend);
        setUsers(frontendUsers);
        
        setActionMsg(t("users.userUpdated"));
      } catch (err) {
        console.error("Failed to update user", err);
        alert(err instanceof Error ? err.message : "Failed to update user");
        return;
      }
    } else {
      try {
        // Split name into first and last name
        const nameParts = form.name.trim().split(" ");
        const firstName = nameParts[0] || "";
        const lastName = nameParts.slice(1).join(" ") || "";

        // Create username from email (part before @)
        const username = form.email.split("@")[0];

        await keycloakUserApi.createUser({
          username,
          email: form.email,
          firstName,
          lastName,
          password: "password", // Default password
          roles: [keycloakRole],
          phone: form.phone || "",
          department: resolvedDepartment || "",
          divisionId: resolvedDivisionId || "",
          profession: resolvedProfession || "",
        });

        // Reload users
        const keycloakUsers = await keycloakUserApi.getAllUsers();
        const frontendUsers = keycloakUsers.map(convertKeycloakUserToFrontend);
        setUsers(frontendUsers);
        
        setActionMsg(t("users.userCreated"));
      } catch (err) {
        console.error("Failed to create user", err);
        alert(err instanceof Error ? err.message : "Failed to create user");
        return;
      }
    }
    setShowModal(false);
    setTimeout(() => setActionMsg(""), 3000);
  };

  const toggleStatus = async (userId: string) => {
    const user = users.find((u) => u.id === userId);
    if (!user) return;

    const newEnabled = user.status !== "active";
    
    try {
      await keycloakUserApi.toggleUserStatus(userId, newEnabled);
      
      setUsers((prev) =>
        prev.map((u) => {
          if (u.id !== userId) return u;
          const newStatus = newEnabled ? "active" : "inactive";
          return { ...u, status: newStatus as any };
        }),
      );
      setActionMsg(t("users.userUpdated"));
      setTimeout(() => setActionMsg(""), 3000);
    } catch (err) {
      console.error("Failed to toggle user status", err);
      alert(err instanceof Error ? err.message : "Failed to toggle user status");
    }
  };

  const handleDelete = async (userId: string) => {
    if (!confirm(t("users.confirmDelete"))) return;
    try {
      await keycloakUserApi.deleteUser(userId);
      setUsers((prev) => prev.filter((u) => u.id !== userId));
      setActionMsg(t("users.userDeleted"));
      setTimeout(() => setActionMsg(""), 3000);
    } catch (err) {
      console.error("Failed to delete user", err);
      alert(err instanceof Error ? err.message : "Failed to delete user");
    }
  };

  const handleResetPassword = async (userId: string) => {
    const newPassword = prompt("Enter new password for user:");
    if (!newPassword) return;

    if (newPassword.length < 6) {
      alert("Password must be at least 6 characters long");
      return;
    }

    try {
      await keycloakUserApi.resetPassword(userId, newPassword, false);
      setActionMsg("Password reset successfully");
      setTimeout(() => setActionMsg(""), 3000);
    } catch (err) {
      console.error("Failed to reset password", err);
      alert(err instanceof Error ? err.message : "Failed to reset password");
    }
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
          <p className="text-xs text-blue-600 mt-1">
            🔐 Managed via Keycloak Authentication
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
                  Phone
                </th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase">
                  {t("users.department_col")}
                </th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase">
                  Division
                </th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase">
                  Profession
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
                    {user.phone || "-"}
                  </td>
                  <td className="px-4 py-3 text-sm text-muted-foreground">
                    {user.department || "-"}
                  </td>
                  <td className="px-4 py-3 text-sm text-muted-foreground">
                    {getDivisionName(user) || "-"}
                  </td>
                  <td className="px-4 py-3 text-sm text-muted-foreground">
                    {user.role === "professional" ? (user.profession || "Not specified") : "-"}
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
                      <button
                        onClick={() => handleResetPassword(user.id)}
                        className="flex items-center gap-1 text-xs text-orange-600 hover:underline font-medium"
                        title="Reset Password"
                      >
                        <Key size={12} /> Reset
                      </button>
                      <button
                        onClick={() => handleDelete(user.id)}
                        className="flex items-center gap-1 text-xs text-red-600 hover:underline font-medium"
                      >
                        <Trash2 size={12} /> {t("users.delete_btn")}
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
                      setForm((f) => {
                         const nextRole = e.target.value as UserRole;
                         const notSuperOrProf =
                           nextRole !== "supervisor" && nextRole !== "professional";
                         if (notSuperOrProf) {
                           return {
                             ...f,
                             role: nextRole,
                             divisionId: "",
                             profession:
                               nextRole === ("professional" as UserRole)
                                 ? f.profession
                                 : "",
                           };
                        }
                        return { ...f, role: nextRole };
                      })
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
              {form.role === "supervisor" && (
                <div>
                  <label className="block text-xs font-medium text-[#0E2271] mb-1">
                    {t("requests.selectDivision")}
                  </label>
                  <select
                    value={form.divisionId}
                    onChange={(e) => {
                      const selected = divisions.find(
                        (d) => d.id === e.target.value,
                      );
                      setForm((f) => ({
                        ...f,
                        divisionId: e.target.value,
                        department: selected?.name || f.department,
                      }));
                    }}
                    className="w-full px-3 py-2 rounded-lg border border-border bg-input-background text-sm outline-none"
                  >
                    <option value="">{t("requests.selectDivision")}</option>
                    {divisions.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}
              {form.role === "professional" && (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-[#0E2271] mb-1">
                      Profession
                    </label>
                    <input
                      value={form.profession}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, profession: e.target.value }))
                      }
                      placeholder="e.g. Electrician, Plumber, Civil Engineer"
                      className="w-full px-3 py-2 rounded-lg border border-border bg-input-background text-sm outline-none focus:border-[#1A3580]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-[#0E2271] mb-1">
                      {t("requests.selectDivision")}
                    </label>
                    <select
                      value={form.divisionId}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, divisionId: e.target.value }))
                      }
                      className="w-full px-3 py-2 rounded-lg border border-border bg-input-background text-sm outline-none"
                    >
                      <option value="">{t("requests.selectDivision")}</option>
                      {divisions.map((d) => (
                        <option key={d.id} value={d.id}>
                          {d.name}
                        </option>
                      ))}
                      <option value={PROFESSIONAL_OTHER_DIVISION_ID}>
                        Other (Project/Booking)
                      </option>
                    </select>
                  </div>
                </div>
              )}
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
