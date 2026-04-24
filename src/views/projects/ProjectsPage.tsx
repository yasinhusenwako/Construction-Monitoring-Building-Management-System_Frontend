"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from '@/context/AuthContext';
import { useLanguage } from '@/context/LanguageContext';
import type { Project } from '@/types/models';
import {
  canViewItem,
  getUserFacingStatus,
  WORKFLOW_STATUSES,
  WorkflowRole,
} from '@/lib/workflow';
import { fetchLiveProjects } from "@/lib/live-api";
import { StatusBadge } from '@/components/common/StatusBadge';
import {
  Plus,
  Search,
  Filter,
  Copy,
  ExternalLink,
  FolderOpen,
  SlidersHorizontal,
} from "lucide-react";

export function ProjectsPage() {
  const { currentUser } = useAuth();
  const router = useRouter();
  const { t } = useLanguage();
  const role = currentUser?.role;

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [copied, setCopied] = useState("");
  const [projects, setProjects] = useState<Project[]>([]);

  useEffect(() => {
    const refresh = async () => {
      const token = sessionStorage.getItem("insa_token") ?? undefined;
      try {
        const live = await fetchLiveProjects(token);
        setProjects(live);
      } catch {
        // backend unreachable
      }
    };
    void refresh();
  }, []);

  const statuses = ["All", ...WORKFLOW_STATUSES];

  const filtered = projects.filter((p) => {
    const matchesRole = canViewItem(
      role as WorkflowRole | undefined,
      p,
      currentUser?.id,
    );
    const matchesSearch =
      !search ||
      p.title.toLowerCase().includes(search.toLowerCase()) ||
      p.id.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === "All" || p.status === statusFilter;
    return matchesRole && matchesSearch && matchesStatus;
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

  const getStreamBadge = (classification: string) => {
    const label = classification.replace(/^A\d+\s*-\s*/, "");
    const color = classification.startsWith("A1")
      ? "#1A3580"
      : classification.startsWith("A2")
        ? "#7C3AED"
        : "#EA580C";
    return (
      <span
        className="px-2 py-0.5 rounded text-xs font-medium"
        style={{ background: color + "15", color }}
      >
        {label}
      </span>
    );
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-[#1A3580]" />
            <span className="text-xs font-semibold text-[#1A3580] uppercase tracking-wider">
              {t("projects.streamA")}
            </span>
          </div>
          <h1 className="text-[#0E2271]">{t("projects.title")}</h1>
          <p className="text-muted-foreground text-sm">
            {filtered.length} {t("projects.projectsFound")}
          </p>
        </div>
        {role === "user" && (
          <button
            onClick={() => router.push("/dashboard/projects/new")}
            className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-white text-sm font-semibold shadow-sm hover:shadow-md transition-all bg-gradient-to-br from-[#0E2271] to-[#1A3580]"
          >
            <Plus size={16} /> {t("projects.newProjectRequest")}
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-border p-4 shadow-sm">
        <div className="flex flex-wrap gap-3">
          <div className="relative flex-1 min-w-48">
            <Search
              size={14}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
            />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t("projects.searchByTitleOrID")}
              className="w-full pl-9 pr-4 py-2 rounded-lg border border-border bg-input-background text-sm outline-none focus:border-[#1A3580] transition-colors"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 rounded-lg border border-border bg-input-background text-sm outline-none focus:border-[#1A3580] cursor-pointer"
          >
            {statuses.map((s) => (
              <option key={s} value={s}>
                {s === "All"
                  ? t("status.all")
                  : t(
                      `status.${s.charAt(0).toLowerCase() + s.slice(1).replace(/\s+/g, "")}`,
                    )}
              </option>
            ))}
          </select>
        </div>

        {/* Status quick filters */}
        <div className="flex gap-2 mt-3 flex-wrap">
          {statuses.map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${
                statusFilter === s
                  ? "bg-[#1A3580] text-white"
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

      {/* Projects Table */}
      {filtered.length === 0 ? (
        <div className="bg-white rounded-xl border border-border p-16 text-center">
          <FolderOpen
            size={48}
            className="mx-auto text-muted-foreground/40 mb-3"
          />
          <h3 className="text-[#0E2271]">{t("projects.noProjectsFound")}</h3>
          <p className="text-muted-foreground text-sm mt-1">
            {t("projects.tryAdjusting")}
          </p>
          {role === "user" && (
            <button
              onClick={() => router.push("/dashboard/projects/new")}
              className="mt-4 px-4 py-2 rounded-lg text-white text-sm font-semibold bg-[#1A3580]"
            >
              {t("projects.submitFirstRequest")}
            </button>
          )}
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-border shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border bg-secondary/50">
                  <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    {t("projects.projectID")}
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    {t("form.title")}
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    {t("projects.classification")}
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    {t("form.status")}
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    {t("projects.budgetETB")}
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    {t("projects.updated")}
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    {t("projects.actions")}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filtered.map((project) => (
                  <tr
                    key={project.id}
                    className="hover:bg-secondary/30 transition-colors"
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono text-xs font-semibold text-[#1A3580]">
                          {project.id}
                        </span>
                        <button
                          onClick={() => copyId(project.id)}
                          className="text-muted-foreground hover:text-[#1A3580] transition-colors"
                          title={t("common.copyToClipboard")}
                        >
                          {copied === project.id ? (
                            <span className="text-green-500 text-xs">✓</span>
                          ) : (
                            <Copy size={11} />
                          )}
                        </button>
                      </div>
                    </td>
                    <td className="px-4 py-3 max-w-xs">
                      <p className="text-sm font-medium text-foreground truncate">
                        {project.title}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {project.location}
                      </p>
                    </td>
                    <td className="px-4 py-3">
                      {getStreamBadge(project.classification)}
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge
                        status={getUserFacingStatus(
                          project.status,
                          role as WorkflowRole,
                        )}
                      />
                    </td>
                    <td className="px-4 py-3 text-sm text-muted-foreground">
                      {project.budget.toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">
                      {project.updatedAt}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() =>
                            router.push(`/dashboard/projects/${project.id}`)
                          }
                          className="flex items-center gap-1 text-xs text-[#1A3580] hover:underline font-medium"
                        >
                          <ExternalLink size={12} /> {t("action.view")}
                        </button>
                        {role === "user" && project.status === "Submitted" && project.requestedBy === currentUser?.id && (
                          <button
                            onClick={() =>
                              router.push(`/dashboard/projects/edit/${project.id}`)
                            }
                            className="flex items-center gap-1 text-xs text-green-600 hover:underline font-medium ml-2"
                          >
                            <SlidersHorizontal size={12} /> {t("action.edit")}
                          </button>
                        )}
                        {role === "admin" && project.status === "Submitted" && (
                          <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-medium">
                            {t("projects.review")}
                          </span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="px-4 py-3 border-t border-border bg-secondary/30 flex items-center justify-between">
            <p className="text-xs text-muted-foreground">
              {t("common.showing")} {filtered.length} {t("common.of")}{" "}
              {projects.length} {t("nav.projects").toLowerCase()}
            </p>
            <div className="flex items-center gap-1">
              <button className="px-3 py-1 rounded border border-border text-xs hover:bg-secondary">
                {t("common.previous")}
              </button>
              <button className="px-3 py-1 rounded bg-[#1A3580] text-white text-xs">
                1
              </button>
              <button className="px-3 py-1 rounded border border-border text-xs hover:bg-secondary">
                {t("common.next")}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
