import React from "react";
import {
  ArrowUpRight,
  ChevronRight,
  ArrowRight,
  CheckCircle2,
} from "lucide-react";
import { StatusBadge } from "../common/StatusBadge";
import { useLanguage } from '@/context/LanguageContext';

export function KpiCard({
  icon,
  label,
  value,
  sub,
  color,
  trend,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  sub?: string;
  color: string;
  trend?: { val: string; up: boolean };
  onClick?: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="glass-premium rounded-2xl p-5 border border-border shadow-sm hover-lift transition-all text-left w-full group relative overflow-hidden"
    >
      <div
        className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity rounded-2xl"
        style={{
          background: `linear-gradient(135deg, ${color}08, ${color}04)`,
        }}
      />
      <div className="relative">
        <div className="flex items-start justify-between mb-3">
          <div
            className="p-2.5 rounded-xl"
            style={{ background: color + "15" }}
          >
            <span style={{ color }}>{icon}</span>
          </div>
          {trend && (
            <div
              className={`flex items-center gap-0.5 text-xs font-semibold px-2 py-0.5 rounded-full ${
                trend.up
                  ? "bg-green-50 text-green-700"
                  : "bg-red-50 text-red-700"
              }`}
            >
              <ArrowUpRight size={10} className={trend.up ? "" : "rotate-90"} />
              {trend.val}
            </div>
          )}
        </div>
        <p className="text-2xl font-bold" style={{ color }}>
          {value}
        </p>
        <p className="text-sm font-medium text-foreground mt-0.5">{label}</p>
        {sub && <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>}
      </div>
    </button>
  );
}

export function SectionHeader({
  title,
  sub,
  icon,
  action,
  onAction,
}: {
  title: string;
  sub?: string;
  icon: React.ReactNode;
  action?: string;
  onAction?: () => void;
}) {
  return (
    <div className="flex items-center justify-between mb-4">
      <div className="flex items-center gap-2.5">
        <div className="w-8 h-8 rounded-lg bg-[#0E2271]/10 flex items-center justify-center text-[#0E2271]">
          {icon}
        </div>
        <div>
          <h2 className="text-[#0E2271] text-base">{title}</h2>
          {sub && <p className="text-xs text-muted-foreground">{sub}</p>}
        </div>
      </div>
      {action && (
        <button
          onClick={onAction}
          className="text-xs text-[#1A3580] hover:underline flex items-center gap-1 font-medium"
        >
          {action} <ChevronRight size={12} />
        </button>
      )}
    </div>
  );
}

export function AlertRow({
  icon,
  text,
  sub,
  color,
  cta,
  onCta,
}: {
  icon: React.ReactNode;
  text: string;
  sub: string;
  color: string;
  cta: string;
  onCta: () => void;
}) {
  return (
    <div
      className="flex items-center gap-3 p-3 rounded-xl border transition-colors hover:bg-secondary/30"
      style={{ borderColor: color + "30", background: color + "06" }}
    >
      <div
        className="p-2 rounded-lg flex-shrink-0"
        style={{ background: color + "18" }}
      >
        <span style={{ color }}>{icon}</span>
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-foreground">{text}</p>
        <p className="text-xs text-muted-foreground truncate">{sub}</p>
      </div>
      <button
        onClick={onCta}
        className="flex-shrink-0 text-xs font-semibold px-3 py-1.5 rounded-lg text-white transition-all hover:opacity-90"
        style={{ background: color }}
      >
        {cta}
      </button>
    </div>
  );
}

export function ModulePanel({
  title,
  stream,
  color,
  icon,
  stats,
  items,
  onView,
}: {
  title: string;
  stream: string;
  color: string;
  icon: React.ReactNode;
  stats: { label: string; value: number | string; highlight?: boolean }[];
  items: {
    id: string;
    title: string;
    status: string;
    priority?: string;
    badge?: string;
  }[];
  onView: () => void;
}) {
  const { t } = useLanguage();
  return (
    <div className="bg-white rounded-2xl border border-border shadow-premium overflow-hidden">
      <div
        className="px-5 py-3.5 flex items-center justify-between border-b border-border"
        style={{
          background: `linear-gradient(135deg, ${color}12, ${color}06)`,
        }}
      >
        <div className="flex items-center gap-2.5">
          <div
            className="w-7 h-7 rounded-lg flex items-center justify-center text-white flex-shrink-0"
            style={{ background: color }}
          >
            {icon}
          </div>
          <div>
            <p
              className="text-xs font-bold uppercase tracking-wider"
              style={{ color }}
            >
              {stream}
            </p>
            <p className="text-sm font-semibold text-[#0E2271]">{title}</p>
          </div>
        </div>
        <button
          onClick={onView}
          className="flex items-center gap-1 text-xs font-medium px-2.5 py-1.5 rounded-lg text-white transition-all hover:opacity-90"
          style={{ background: color }}
        >
          {t("dashboard.manage")} <ArrowRight size={11} />
        </button>
      </div>

      <div className="grid grid-cols-3 divide-x divide-border border-b border-border">
        {stats.map((s, i) => (
          <div
            key={i}
            className={`px-3 py-2.5 text-center ${s.highlight ? "bg-amber-50" : ""}`}
          >
            <p
              className={`text-lg font-bold ${s.highlight ? "text-amber-600" : "text-[#0E2271]"}`}
            >
              {s.value}
            </p>
            <p className="text-xs text-muted-foreground leading-tight">
              {s.label}
            </p>
          </div>
        ))}
      </div>

      <div className="divide-y divide-border">
        {items.slice(0, 3).map((item) => (
          <div
            key={item.id}
            className="px-4 py-2.5 flex items-center gap-2.5 hover:bg-secondary/30 transition-colors"
          >
            <div className="flex-1 min-w-0">
              <p className="text-xs font-mono text-muted-foreground">
                {item.id}
              </p>
              <p className="text-sm font-medium text-foreground truncate">
                {item.title}
              </p>
            </div>
            <div className="flex items-center gap-1.5 flex-shrink-0">
              {item.badge && (
                <span
                  className="text-xs px-2 py-0.5 rounded-full font-medium"
                  style={{ background: color + "18", color }}
                >
                  {item.badge}
                </span>
              )}
              <StatusBadge status={item.status} />
            </div>
          </div>
        ))}
        {items.length === 0 && (
          <div className="px-4 py-6 text-center">
            <CheckCircle2 size={20} className="mx-auto text-green-500 mb-1" />
            <p className="text-xs text-muted-foreground">
              {t("dashboard.allClear")}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
