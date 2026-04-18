"use client";

import { AlertTriangle, Loader2, RefreshCw } from "lucide-react";

type AsyncStateProps = {
  title: string;
  message?: string;
  actionLabel?: string;
  onAction?: () => void;
  state?: "loading" | "error" | "empty";
};

export function AsyncState({
  title,
  message,
  actionLabel,
  onAction,
  state = "empty",
}: AsyncStateProps) {
  const isLoading = state === "loading";
  const Icon = isLoading ? Loader2 : AlertTriangle;

  return (
    <div className="bg-white rounded-xl border border-border shadow-sm px-6 py-10 text-center">
      <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-secondary text-[#1A3580]">
        <Icon size={22} className={isLoading ? "animate-spin" : ""} />
      </div>
      <h2 className="text-lg font-semibold text-[#0E2271]">{title}</h2>
      {message && <p className="mt-2 text-sm text-muted-foreground">{message}</p>}
      {actionLabel && onAction && (
        <button
          onClick={onAction}
          className="mt-5 inline-flex items-center gap-2 rounded-lg bg-[#1A3580] px-4 py-2 text-sm font-semibold text-white hover:bg-[#0E2271]"
        >
          {!isLoading && <RefreshCw size={15} />}
          {actionLabel}
        </button>
      )}
    </div>
  );
}
