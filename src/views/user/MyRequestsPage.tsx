"use client";

import React, { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { useLanguage } from "@/context/LanguageContext";
import {
  fetchLiveBookings,
  fetchLiveMaintenance,
  fetchLiveProjects,
} from "@/lib/live-api";
import {
  Search,
  Filter,
  FolderOpen,
  Calendar,
  Wrench,
  ExternalLink,
  Pencil,
} from "lucide-react";
import { StatusBadge } from "@/components/common/StatusBadge";
import { getUserFacingStatus } from "@/lib/workflow";

export function MyRequestsPage() {
  const router = useRouter();
  const { currentUser } = useAuth();
  const { t } = useLanguage();
  const uid = currentUser?.id;

  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState<
    "all" | "Project" | "Booking" | "Maintenance"
  >("all");
  const [allRequests, setAllRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  React.useEffect(() => {
    const refresh = async () => {
      setLoading(true);
      try {
        const [projects, bookings, maintenance] = await Promise.all([
          fetchLiveProjects(),
          fetchLiveBookings(),
          fetchLiveMaintenance(),
        ]);

        const myProjects = projects
          .filter((p) => p.requestedBy === uid)
          .map((p) => ({
            id: p.id,
            title: p.title,
            type: "Project" as const,
            status: p.status,
            date: p.createdAt,
            path: `/dashboard/projects/${p.id}`,
            editPath: `/dashboard/projects/edit/${p.id}`,
          }));

        const myBookings = bookings
          .filter((b) => b.requestedBy === uid)
          .map((b) => ({
            id: b.id,
            title: b.title || b.space,
            type: "Booking" as const,
            status: b.status,
            date: b.createdAt,
            path: `/dashboard/bookings/${b.id}`,
            editPath: `/dashboard/bookings/edit/${b.id}`,
          }));

        const myMaintenance = maintenance
          .filter((m) => m.requestedBy === uid)
          .map((m) => ({
            id: m.id,
            title: m.title,
            type: "Maintenance" as const,
            status: m.status,
            date: m.createdAt,
            path: `/dashboard/maintenance/${m.id}`,
            editPath: `/dashboard/maintenance/edit/${m.id}`,
            priority: m.priority,
          }));

        const merged = [...myProjects, ...myBookings, ...myMaintenance].sort(
          (a, b) => b.date.localeCompare(a.date),
        );
        setAllRequests(merged);
      } catch (error) {
        console.error("Failed to fetch my requests:", error);
      } finally {
        setLoading(false);
      }
    };
    refresh();
  }, [uid]);

  const filteredRequests = useMemo(() => {
    return allRequests.filter((req) => {
      const matchesSearch =
        req.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        req.title.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesType = filterType === "all" || req.type === filterType;
      return matchesSearch && matchesType;
    });
  }, [allRequests, searchQuery, filterType]);

  const getIcon = (type: string) => {
    switch (type) {
      case "Project":
        return <FolderOpen size={16} className="text-blue-600" />;
      case "Booking":
        return <Calendar size={16} className="text-purple-600" />;
      case "Maintenance":
        return <Wrench size={16} className="text-orange-600" />;
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#0E2271]">
            {t("nav.myRequests")}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {t("requests.myRequestsDesc")}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
              size={16}
            />
            <input
              type="text"
              placeholder="Search by title or ID..."
              className="pl-9 pr-4 py-2 rounded-lg border border-border bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 w-64"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-border shadow-sm overflow-hidden text-sm">
        <div className="p-4 border-b border-border bg-gray-50/50 flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-2 overflow-x-auto">
            {(["all", "Project", "Booking", "Maintenance"] as const).map(
              (type) => (
                <button
                  key={type}
                  onClick={() => setFilterType(type)}
                  className={`px-3 py-1.5 rounded-lg font-medium transition-all whitespace-nowrap ${
                    filterType === type
                      ? "bg-[#0E2271] text-white shadow-sm"
                      : "bg-white text-muted-foreground hover:bg-gray-100 border border-border"
                  }`}
                >
                  {type === "all" ? "All Streams" : type}
                </button>
              ),
            )}
          </div>
          <p className="text-muted-foreground">
            Showing{" "}
            <span className="font-semibold text-foreground">
              {filteredRequests.length}
            </span>{" "}
            requests
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 text-muted-foreground font-medium uppercase text-[10px] tracking-wider">
                <th className="px-6 py-3 border-b border-border">Request ID</th>
                <th className="px-6 py-3 border-b border-border">Type</th>
                <th className="px-6 py-3 border-b border-border">Title</th>
                <th className="px-6 py-3 border-b border-border">
                  Submitted On
                </th>
                <th className="px-6 py-3 border-b border-border">Priority</th>
                <th className="px-6 py-3 border-b border-border">Status</th>
                <th className="px-6 py-3 border-b border-border text-right">
                  Action
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredRequests.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center">
                    <div className="flex flex-col items-center justify-center text-muted-foreground">
                      <Filter size={48} className="mb-3 opacity-20" />
                      <p className="font-medium text-gray-500">
                        No requests found matching your filters.
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredRequests.map((req) => (
                  <tr
                    key={req.id}
                    className="hover:bg-gray-50/80 transition-colors group"
                  >
                    <td className="px-6 py-4">
                      <span className="font-mono text-xs font-semibold text-blue-700 bg-blue-50 px-2 py-1 rounded">
                        {req.id}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        {getIcon(req.type)}
                        <span className="font-medium">{req.type}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 max-w-xs">
                      <p className="font-semibold text-gray-900 truncate">
                        {req.title}
                      </p>
                    </td>
                    <td className="px-6 py-4 text-muted-foreground">
                      {req.date.split("T")[0]}
                    </td>
                    <td className="px-6 py-4">
                      {req.type === "Maintenance" ? (
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                            (req as any).priority === "Critical"
                              ? "bg-red-100 text-red-700"
                              : (req as any).priority === "High"
                                ? "bg-orange-100 text-orange-700"
                                : "bg-blue-100 text-blue-700"
                          }`}
                        >
                          {(req as any).priority}
                        </span>
                      ) : (
                        <span className="text-muted-foreground text-xs">—</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <StatusBadge
                        status={getUserFacingStatus(req.status, "user")}
                      />
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => router.push(req.path)}
                          className="p-2 hover:bg-blue-50 rounded-lg text-blue-600 transition-colors inline-flex items-center gap-1 font-medium"
                        >
                          {t("action.view")} <ExternalLink size={14} />
                        </button>
                        {req.status === "Submitted" && (
                          <button
                            onClick={() => router.push(req.editPath)}
                            className="px-3 py-2 border-2 border-green-600 rounded-lg text-green-600 transition-all hover:bg-green-50 inline-flex items-center gap-1.5 font-semibold text-sm"
                          >
                            <Pencil size={14} /> {t("action.edit")}
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
