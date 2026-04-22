"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useLanguage } from "@/context/LanguageContext";
import { fetchLiveNotifications, markNotificationAsRead, markAllNotificationsAsRead } from "@/lib/live-api";
import type { Notification } from "@/types/models";
import {
  Bell,
  CheckCheck,
  Info,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Clock,
} from "lucide-react";

type NotificationTypeConfig = Record<
  Notification["type"],
  {
    icon: typeof CheckCircle;
    color: string;
    bg: string;
    border: string;
  }
>;

const typeConfig: NotificationTypeConfig = {
  success: {
    icon: CheckCircle,
    color: "text-green-600",
    bg: "bg-green-50",
    border: "border-green-200",
  },
  error: {
    icon: XCircle,
    color: "text-red-600",
    bg: "bg-red-50",
    border: "border-red-200",
  },
  warning: {
    icon: AlertTriangle,
    color: "text-amber-600",
    bg: "bg-amber-50",
    border: "border-amber-200",
  },
  info: {
    icon: Info,
    color: "text-blue-600",
    bg: "bg-blue-50",
    border: "border-blue-200",
  },
};

export function NotificationsPage() {
  const { currentUser } = useAuth();
  const { t } = useLanguage();
  const [filter, setFilter] = useState<"all" | "unread" | "read">("all");
  const [notifications, setNotifications] = useState<Notification[]>([]);

  useEffect(() => {
    const refresh = async () => {
      try {
        // Token is automatically sent via httpOnly cookie
        const live = await fetchLiveNotifications();
        setNotifications(live);
      } catch (error) {
        console.error("Failed to fetch live notifications:", error);
      }
    };
    refresh();
  }, []);

  const unreadCount = notifications.filter(
    (n) => n.userId === currentUser?.id && !n.read,
  ).length;
  const userNotifs = notifications.filter((n) => n.userId === currentUser?.id);
  const filtered = userNotifs.filter((n) => {
    if (filter === "unread") return !n.read;
    if (filter === "read") return n.read;
    return true;
  });

  const markRead = async (id: string) => {
    try {
      await markNotificationAsRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, read: true } : n)),
      );
    } catch (error) {
      console.error("Failed to mark notification as read:", error);
    }
  };

  const markAllRead = async () => {
    try {
      await markAllNotificationsAsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    } catch (error) {
      console.error("Failed to mark all notifications as read:", error);
    }
  };

  return (
    <div className="space-y-5 max-w-3xl">
      {/* Header */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <div className="flex items-center gap-2">
            <Bell size={20} className="text-[#1A3580]" />
            <h1 className="text-[#0E2271]">{t("notifications.title")}</h1>
          </div>
          <p className="text-muted-foreground text-sm mt-0.5">
            {unreadCount > 0
              ? `${unreadCount} ${t("notifications.unread")} notification${unreadCount > 1 ? "s" : ""}`
              : t("notifications.allCaughtUp")}
          </p>
        </div>
        {unreadCount > 0 && (
          <button
            onClick={markAllRead}
            className="flex items-center gap-2 px-4 py-2 rounded-lg border border-[#1A3580] text-[#1A3580] text-sm font-medium hover:bg-secondary transition-colors"
          >
            <CheckCheck size={14} /> {t("notifications.markAllRead")}
          </button>
        )}
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-1 bg-secondary rounded-xl p-1 w-fit">
        {(["all", "unread", "read"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all capitalize ${
              filter === f
                ? "bg-white shadow text-[#1A3580]"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {f === "all"
              ? t("notifications.allFilter")
              : f === "unread"
                ? t("notifications.unreadFilter")
                : t("notifications.readFilter")}
            {f === "unread" && unreadCount > 0 && (
              <span className="ml-1 bg-[#CC1F1A] text-white text-xs rounded-full px-1.5 py-0.5">
                {unreadCount}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Notifications List */}
      {filtered.length === 0 ? (
        <div className="bg-white rounded-xl border border-border p-16 text-center">
          <Bell size={48} className="mx-auto text-muted-foreground/30 mb-3" />
          <h3 className="text-[#0E2271]">
            {filter === "unread"
              ? t("notifications.noUnreadFound")
              : t("notifications.noNotificationsFound")}
          </h3>
          <p className="text-muted-foreground text-sm mt-1">
            {t("notifications.youreAllCaughtUp")}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((notif) => {
            const cfg = typeConfig[notif.type] || typeConfig.info;
            const Icon = cfg.icon;
            return (
              <div
                key={notif.id}
                className={`bg-white rounded-xl border shadow-sm p-5 transition-all ${
                  !notif.read
                    ? "border-l-4 border-l-[#1A3580] border-border"
                    : "border-border opacity-80"
                }`}
              >
                <div className="flex items-start gap-4">
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${cfg.bg} border ${cfg.border}`}
                  >
                    <Icon size={18} className={cfg.color} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="font-semibold text-foreground text-sm">
                          {notif.title}
                        </p>
                        <p className="text-sm text-muted-foreground mt-0.5 leading-relaxed">
                          {notif.message}
                        </p>
                      </div>
                      {!notif.read && (
                        <div className="flex-shrink-0 flex items-center gap-2">
                          <span className="w-2.5 h-2.5 bg-[#1A3580] rounded-full" />
                          <button
                            onClick={() => markRead(notif.id)}
                            className="text-xs text-[#1A3580] hover:underline whitespace-nowrap"
                          >
                            {t("notifications.markRead")}
                          </button>
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-3 mt-2">
                      <span className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Clock size={11} /> {notif.createdAt}
                      </span>
                      <span
                        className={`text-xs px-2 py-0.5 rounded-full font-medium ${cfg.bg} ${cfg.color}`}
                      >
                        {notif.type.charAt(0).toUpperCase() +
                          notif.type.slice(1)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Stats Bar */}
      <div className="bg-white rounded-xl border border-border p-4 shadow-sm">
        <div className="grid grid-cols-3 gap-4 text-center">
          {[
            {
              label: t("notifications.total"),
              value: userNotifs.length,
              color: "#1A3580",
            },
            {
              label: t("notifications.unread"),
              value: userNotifs.filter((n) => !n.read).length,
              color: "#CC1F1A",
            },
            {
              label: t("notifications.read"),
              value: userNotifs.filter((n) => n.read).length,
              color: "#16A34A",
            },
          ].map((s) => (
            <div key={s.label}>
              <p className="text-xl font-bold" style={{ color: s.color }}>
                {s.value}
              </p>
              <p className="text-xs text-muted-foreground">{s.label}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
