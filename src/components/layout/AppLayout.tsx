"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { useAuth } from "@/context/AuthContext";
import { useLanguage } from "@/context/LanguageContext";
import type { Notification } from "@/types/models";
import {
  fetchLiveMaintenance,
  fetchLiveNotifications,
  fetchLiveProjects,
  markNotificationAsRead,
} from "@/lib/live-api";
import { ProtectedRoute } from "../auth/ProtectedRoute";
import { ThemeToggle } from "../common/ThemeToggle";
import { LanguageToggle } from "../common/LanguageToggle";
import {
  LayoutDashboard,
  FolderOpen,
  Calendar,
  Wrench,
  Bell,
  BarChart3,
  Users,
  Settings,
  LogOut,
  Menu,
  X,
  ChevronRight,
  Search,
  Building2,
  ClipboardList,
  ChevronDown,
  List,
  Activity,
} from "lucide-react";
import logoImg from "@/assets/f90b53223fdaa6590fb74226dca7ff83be56c9f0.png";

interface NavItem {
  label: string;
  path: string;
  icon: React.ReactNode;
  roles: string[];
  badge?: number;
  children?: NavItem[];
}

export function AppLayout({ children }: { children: React.ReactNode }) {
  const PROJECT_BADGE_SEEN_KEY = "insa_admin_seen_projects_actionable";
  const MAINTENANCE_BADGE_SEEN_KEY =
    "insa_admin_seen_maintenance_actionable";
  const { currentUser, logout } = useAuth();
  const { t } = useLanguage();
  const router = useRouter();
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [projectActionableCount, setProjectActionableCount] = useState(0);
  const [maintenanceActionableCount, setMaintenanceActionableCount] =
    useState(0);
  const [projectSeenCount, setProjectSeenCount] = useState(0);
  const [maintenanceSeenCount, setMaintenanceSeenCount] = useState(0);
  const notifRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);

  const userNotifs = notifications.filter((n) => n.userId === currentUser?.id);
  const unreadCount = userNotifs.filter((n) => !n.read).length;

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node))
        setNotifOpen(false);
      if (profileRef.current && !profileRef.current.contains(e.target as Node))
        setProfileOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    // Token is automatically sent via httpOnly cookie
    fetchLiveNotifications()
      .then(setNotifications)
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (currentUser?.role !== "admin") {
      setProjectActionableCount(0);
      setMaintenanceActionableCount(0);
      setProjectSeenCount(0);
      setMaintenanceSeenCount(0);
      return;
    }

    const storedProjectSeen = Number(
      localStorage.getItem(PROJECT_BADGE_SEEN_KEY) || "0",
    );
    const storedMaintenanceSeen = Number(
      localStorage.getItem(MAINTENANCE_BADGE_SEEN_KEY) || "0",
    );
    setProjectSeenCount(Number.isFinite(storedProjectSeen) ? storedProjectSeen : 0);
    setMaintenanceSeenCount(
      Number.isFinite(storedMaintenanceSeen) ? storedMaintenanceSeen : 0,
    );

    Promise.all([fetchLiveProjects(), fetchLiveMaintenance()])
      .then(([projects, maintenance]) => {
        const adminActionableStatuses = new Set([
          "Submitted",
          "Under Review",
          "Completed",
          "Reviewed",
        ]);

        const pendingProjects = projects.filter((p) =>
          adminActionableStatuses.has(p.status),
        ).length;
        const pendingMaintenance = maintenance.filter((m) =>
          adminActionableStatuses.has(m.status),
        ).length;

        setProjectActionableCount(pendingProjects);
        setMaintenanceActionableCount(pendingMaintenance);
      })
      .catch(() => {
        setProjectActionableCount(0);
        setMaintenanceActionableCount(0);
      });
  }, [currentUser?.role]);

  useEffect(() => {
    if (currentUser?.role !== "admin") return;

    if (pathname?.startsWith("/dashboard/projects")) {
      localStorage.setItem(
        PROJECT_BADGE_SEEN_KEY,
        String(projectActionableCount),
      );
      setProjectSeenCount(projectActionableCount);
    }

    if (pathname?.startsWith("/dashboard/maintenance")) {
      localStorage.setItem(
        MAINTENANCE_BADGE_SEEN_KEY,
        String(maintenanceActionableCount),
      );
      setMaintenanceSeenCount(maintenanceActionableCount);
    }
  }, [
    currentUser?.role,
    pathname,
    projectActionableCount,
    maintenanceActionableCount,
  ]);

  const projectBadge =
    currentUser?.role === "admin"
      ? Math.max(projectActionableCount - projectSeenCount, 0) || undefined
      : undefined;
  const maintenanceBadge =
    currentUser?.role === "admin"
      ? Math.max(maintenanceActionableCount - maintenanceSeenCount, 0) ||
        undefined
      : undefined;

  const handleLogout = () => {
    logout();
    router.push("/login");
  };

  const handleNotificationClick = async (notification: Notification) => {
    // Mark as read if not already read
    if (!notification.read) {
      try {
        await markNotificationAsRead(notification.id);
        // Remove from local state immediately
        setNotifications((prev) =>
          prev.filter((n) => n.id !== notification.id)
        );
      } catch (error) {
        console.error("Failed to mark notification as read:", error);
      }
    }
    
    // Close dropdown
    setNotifOpen(false);
    
    // Navigate to the link if available
    if (notification.link) {
      router.push(notification.link);
    }
  };

  const navItems: NavItem[] = [
    {
      label: t("nav.dashboard"),
      path: "/dashboard",
      icon: <LayoutDashboard size={18} />,
      roles: ["admin", "user", "supervisor", "professional"],
    },
    {
      label: t("nav.allRequests"),
      path: "/admin/requests",
      icon: <List size={18} />,
      roles: ["admin"],
    },
    {
      label: t("nav.myRequests"),
      path: "/dashboard/my-requests",
      icon: <List size={18} />,
      roles: ["user"],
    },
    {
      label:
        currentUser?.role === "admin"
          ? t("nav.projectManagement")
          : t("nav.projects"),
      path: "/dashboard/projects",
      icon: <FolderOpen size={18} />,
      roles: ["admin", "user"],
      badge: currentUser?.role === "admin" ? projectBadge : undefined,
    },
    {
      label:
        currentUser?.role === "admin"
          ? t("nav.spaceBooking")
          : currentUser?.role === "user"
            ? t("nav.bookSpace")
            : t("nav.bookings"),
      path: "/dashboard/bookings",
      icon: <Calendar size={18} />,
      roles: ["admin", "user"],
    },
    {
      label:
        currentUser?.role === "professional"
          ? t("nav.myTasks")
          : t("nav.maintenance"),
      path: "/dashboard/maintenance",
      icon: <Wrench size={18} />,
      roles: ["admin", "user", "professional"],
      badge: currentUser?.role === "admin" ? maintenanceBadge : undefined,
    },
    {
      label: t("nav.progressUpdates"),
      path: "/dashboard/updates",
      icon: <Activity size={18} />,
      roles: ["professional"],
    },
    {
      label: t("nav.taskManagement"),
      path: "/dashboard/supervisor",
      icon: <ClipboardList size={18} />,
      roles: ["supervisor"],
    },
    {
      label: t("nav.teamOverview"),
      path: "/dashboard/team",
      icon: <Users size={18} />,
      roles: ["supervisor"],
    },
    {
      label: t("nav.notifications"),
      path: "/dashboard/notifications",
      icon: <Bell size={18} />,
      roles: ["admin", "user", "supervisor", "professional"],
      badge: unreadCount || undefined,
    },
    {
      label:
        currentUser?.role === "admin"
          ? t("nav.usersManagement")
          : t("nav.users"),
      path: "/admin/users",
      icon: <Users size={18} />,
      roles: ["admin"],
    },
    {
      label: t("nav.divisions"),
      path: "/admin/divisions",
      icon: <Building2 size={18} />,
      roles: ["admin"],
    },
    {
      label:
        currentUser?.role === "admin"
          ? t("nav.reportsAnalytics")
          : t("nav.reports"),
      path: "/dashboard/reports",
      icon: <BarChart3 size={18} />,
      roles: ["admin"],
    },
    {
      label:
        currentUser?.role === "admin"
          ? t("nav.systemSettings")
          : t("nav.config"),
      path: "/admin/config",
      icon: <Settings size={18} />,
      roles: ["admin"],
    },
  ];

  const filtered = navItems.filter((n) =>
    n.roles.includes(currentUser?.role || ""),
  );

  const isActive = (path: string) => pathname?.startsWith(path) || false;

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="flex items-center gap-3 px-4 py-4 border-b border-white/10 dark:border-white/20">
        <Image
          src={logoImg}
          alt="INSA Logo"
          width={40}
          height={40}
          className="object-contain rounded bg-white/10 dark:bg-white/20 p-0.5"
        />
        <div
          className={`transition-all duration-200 ${sidebarOpen ? "opacity-100 w-auto" : "opacity-0 w-0 overflow-hidden"}`}
        >
          <p className="text-white text-sm font-semibold leading-tight">INSA</p>
          <p className="text-blue-200 dark:text-blue-300 text-xs leading-tight">
            BuildMS
          </p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-2 py-3 space-y-1 overflow-y-auto">
        {filtered.map((item) => (
          <Link
            key={item.path}
            href={item.path}
            onClick={() => setMobileSidebarOpen(false)}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-150 group relative ${
              isActive(item.path)
                ? "bg-white/15 dark:bg-white/20 text-white"
                : "text-blue-100 dark:text-blue-200 hover:bg-white/10 dark:hover:bg-white/15 hover:text-white"
            }`}
          >
            {isActive(item.path) && (
              <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-6 bg-[#F5B800] dark:bg-[#FCD34D] rounded-r" />
            )}
            <span
              className={`flex-shrink-0 ${isActive(item.path) ? "text-[#F5B800] dark:text-[#FCD34D]" : "text-blue-300 dark:text-blue-400 group-hover:text-white"}`}
            >
              {item.icon}
            </span>
            {sidebarOpen && (
              <span className="text-sm font-medium truncate flex-1">
                {item.label}
              </span>
            )}
            {sidebarOpen && item.badge && item.badge > 0 && (
              <span className="bg-[#CC1F1A] dark:bg-[#EF4444] text-white text-xs rounded-full w-5 h-5 flex items-center justify-center flex-shrink-0">
                {item.badge}
              </span>
            )}
            {!sidebarOpen && item.badge && item.badge > 0 && (
              <span className="absolute top-1 right-1 bg-[#CC1F1A] dark:bg-[#EF4444] text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">
                {item.badge}
              </span>
            )}
          </Link>
        ))}
      </nav>

      {/* Collapse button (desktop) */}
      <div className="hidden lg:block px-3 pb-3">
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="w-full flex items-center justify-center gap-2 py-2 rounded-lg text-blue-200 dark:text-blue-300 hover:bg-white/10 dark:hover:bg-white/15 hover:text-white transition-colors text-sm"
          title={sidebarOpen ? "Collapse Sidebar" : "Expand Sidebar"}
        >
          {sidebarOpen ? (
            <>
              <ChevronRight size={16} className="rotate-180" /> Collapse
            </>
          ) : (
            <ChevronRight size={16} />
          )}
        </button>
      </div>

      {/* Logout button */}
      <div className="px-3 pb-4 border-t border-white/10 dark:border-white/20 pt-3">
        <button
          onClick={handleLogout}
          className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-red-300 dark:text-red-400 hover:bg-red-500/20 dark:hover:bg-red-500/30 hover:text-red-200 transition-all duration-150 group ${!sidebarOpen ? "justify-center" : ""}`}
          title="Sign Out"
        >
          <LogOut size={18} className="flex-shrink-0" />
          {sidebarOpen && <span className="text-sm font-medium">Sign Out</span>}
        </button>
      </div>
    </div>
  );

  return (
    <ProtectedRoute>
      <div className="flex h-screen bg-background overflow-hidden">
        {/* Desktop Sidebar */}
        <aside
          className={`hidden lg:flex flex-col bg-sidebar transition-all duration-300 flex-shrink-0 ${sidebarOpen ? "w-60" : "w-16"}`}
        >
          <SidebarContent />
        </aside>

        {/* Mobile Sidebar Overlay */}
        {mobileSidebarOpen && (
          <div className="lg:hidden fixed inset-0 z-50 flex">
            <div
              className="fixed inset-0 bg-black/50"
              onClick={() => setMobileSidebarOpen(false)}
            />
            <aside className="relative w-64 bg-sidebar flex flex-col">
              <button
                onClick={() => setMobileSidebarOpen(false)}
                className="absolute top-3 right-3 text-white/70 hover:text-white"
                title="Close Menu"
              >
                <X size={20} />
              </button>
              <SidebarContent />
            </aside>
          </div>
        )}

        {/* Main Content */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Header */}
          <header className="bg-card dark:bg-card border-b border-border px-4 py-3 flex items-center gap-4 flex-shrink-0">
            <button
              className="lg:hidden text-primary dark:text-primary hover:bg-secondary rounded-lg p-1.5 transition-colors"
              onClick={() => setMobileSidebarOpen(true)}
              title="Open Menu"
            >
              <Menu size={20} />
            </button>

            {/* Page title / breadcrumb area */}
            <div className="flex items-center gap-2 flex-1">
              <Building2 size={18} className="text-primary dark:text-primary" />
              <span className="text-primary dark:text-primary font-semibold text-sm hidden sm:block">
                Construction Monitoring & BMS
              </span>
            </div>

            {/* Search */}
            <div className="hidden md:flex items-center gap-2 bg-secondary dark:bg-secondary rounded-lg px-3 py-1.5 w-56">
              <Search size={14} className="text-muted-foreground" />
              <input
                type="text"
                placeholder="Search requests, IDs..."
                className="bg-transparent text-sm outline-none flex-1 text-foreground placeholder:text-muted-foreground"
              />
            </div>

            {/* Notifications */}
            <div className="relative" ref={notifRef}>
              <button
                onClick={() => setNotifOpen(!notifOpen)}
                className="relative p-2 rounded-lg hover:bg-secondary dark:hover:bg-secondary text-primary dark:text-primary transition-colors"
                title="Notifications"
              >
                <Bell size={18} />
                {unreadCount > 0 && (
                  <span className="absolute top-1 right-1 bg-[#CC1F1A] dark:bg-[#EF4444] text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">
                    {unreadCount}
                  </span>
                )}
              </button>

              {notifOpen && (
                <div className="absolute right-0 top-full mt-2 w-80 bg-card dark:bg-card rounded-xl shadow-xl border border-border dark:border-border z-50">
                  <div className="px-4 py-3 border-b border-border dark:border-border flex items-center justify-between">
                    <h3 className="font-semibold text-sm text-foreground">
                      Notifications
                    </h3>
                    {unreadCount > 0 && (
                      <span className="text-xs text-[#CC1F1A] dark:text-[#EF4444]">
                        {unreadCount} unread
                      </span>
                    )}
                  </div>
                  <div className="max-h-72 overflow-y-auto">
                    {userNotifs.length === 0 ? (
                      <p className="text-center text-muted-foreground text-sm py-6">
                        No notifications
                      </p>
                    ) : (
                      userNotifs.slice(0, 5).map((n) => (
                        <div
                          key={n.id}
                          onClick={() => handleNotificationClick(n)}
                          className={`px-4 py-3 border-b border-border/50 hover:bg-secondary/50 dark:hover:bg-secondary/50 cursor-pointer ${!n.read ? "bg-blue-50/50 dark:bg-blue-900/20" : ""}`}
                        >
                          <div className="flex items-start gap-2">
                            <span
                              className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${
                                n.type === "success"
                                  ? "bg-green-500"
                                  : n.type === "error"
                                    ? "bg-red-500"
                                    : n.type === "warning"
                                      ? "bg-yellow-500"
                                      : "bg-blue-500"
                              }`}
                            />
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-foreground">
                                {n.title}
                              </p>
                              <p className="text-xs text-muted-foreground line-clamp-2">
                                {n.message}
                              </p>
                              <p className="text-xs text-muted-foreground mt-1">
                                {n.createdAt}
                              </p>
                            </div>
                            {!n.read && (
                              <span className="w-2 h-2 bg-primary dark:bg-primary rounded-full flex-shrink-0 mt-1" />
                            )}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                  <div className="px-4 py-2 border-t border-border dark:border-border">
                    <Link
                      href="/dashboard/notifications"
                      onClick={() => setNotifOpen(false)}
                      className="text-xs text-primary dark:text-primary hover:underline"
                    >
                      View all notifications →
                    </Link>
                  </div>
                </div>
              )}
            </div>

            {/* Theme Toggle */}
            <ThemeToggle />

            {/* Language Toggle */}
            <LanguageToggle />

            {/* Profile */}
            <div className="relative" ref={profileRef}>
              <button
                onClick={() => setProfileOpen(!profileOpen)}
                className="flex items-center gap-2 hover:bg-secondary dark:hover:bg-secondary rounded-lg px-2 py-1.5 transition-colors"
                title="User Profile"
              >
                <div className="w-8 h-8 rounded-full bg-primary dark:bg-primary text-primary-foreground dark:text-primary-foreground text-sm font-semibold flex items-center justify-center">
                  {currentUser?.avatar}
                </div>
                <div className="hidden sm:block text-left">
                  <p className="text-sm font-medium text-foreground leading-tight">
                    {currentUser?.name?.split(" ")[0]}
                  </p>
                  <p className="text-xs text-muted-foreground capitalize leading-tight">
                    {currentUser?.role}
                  </p>
                </div>
                <ChevronDown
                  size={14}
                  className="text-muted-foreground hidden sm:block"
                />
              </button>

              {profileOpen && (
                <div className="absolute right-0 top-full mt-2 w-52 bg-card dark:bg-card rounded-xl shadow-xl border border-border dark:border-border z-50">
                  <div className="px-4 py-3 border-b border-border dark:border-border">
                    <p className="font-medium text-sm text-foreground">
                      {currentUser?.name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {currentUser?.email}
                    </p>
                  </div>
                  <div className="py-1">
                    <Link
                      href="/dashboard"
                      onClick={() => setProfileOpen(false)}
                      className="flex items-center gap-2 px-4 py-2 text-sm text-foreground hover:bg-secondary dark:hover:bg-secondary"
                    >
                      <LayoutDashboard size={14} /> Dashboard
                    </Link>
                  </div>
                  <div className="border-t border-border dark:border-border py-1">
                    <button
                      onClick={handleLogout}
                      className="flex items-center gap-2 px-4 py-2 text-sm text-[#CC1F1A] dark:text-[#EF4444] hover:bg-red-50 dark:hover:bg-red-500/10 w-full text-left"
                      title="Sign Out"
                    >
                      <LogOut size={14} /> Sign Out
                    </button>
                  </div>
                </div>
              )}
            </div>
          </header>

          {/* Page Content */}
          <main className="flex-1 overflow-y-auto p-4 md:p-6">{children}</main>
        </div>
      </div>
    </ProtectedRoute>
  );
}
