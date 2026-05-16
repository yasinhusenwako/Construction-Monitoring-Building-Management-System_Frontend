"use client";

import { X, User } from "lucide-react";

export interface Professional {
  id: string;
  name: string;
  profession?: string;
  divisionId?: string;
  avatar?: string;
  email?: string;
}

interface ProfessionalChipsProps {
  professionals: Professional[];
  onRemove?: (id: string) => void;
  editable?: boolean;
  size?: "sm" | "md" | "lg";
  maxDisplay?: number;
  showTooltip?: boolean;
}

export function ProfessionalChips({
  professionals,
  onRemove,
  editable = false,
  size = "md",
  maxDisplay,
  showTooltip = true,
}: ProfessionalChipsProps) {
  if (!professionals || professionals.length === 0) {
    return (
      <div className="text-sm text-muted-foreground italic">
        No professionals assigned
      </div>
    );
  }

  const displayProfessionals = maxDisplay
    ? professionals.slice(0, maxDisplay)
    : professionals;
  const remainingCount = maxDisplay
    ? Math.max(0, professionals.length - maxDisplay)
    : 0;

  const sizeClasses = {
    sm: "text-xs px-2 py-1",
    md: "text-sm px-3 py-1.5",
    lg: "text-base px-4 py-2",
  };

  const avatarSizes = {
    sm: "w-5 h-5 text-[10px]",
    md: "w-6 h-6 text-xs",
    lg: "w-8 h-8 text-sm",
  };

  return (
    <div className="flex flex-wrap gap-2 items-center">
      {displayProfessionals.map((professional) => (
        <div
          key={professional.id}
          className={`inline-flex items-center gap-2 bg-primary/10 text-primary rounded-lg ${sizeClasses[size]} font-medium group relative`}
          title={
            showTooltip
              ? `${professional.name}${professional.profession ? ` - ${professional.profession}` : ""}${professional.divisionId ? ` (${professional.divisionId})` : ""}`
              : undefined
          }
        >
          {/* Avatar */}
          <div
            className={`${avatarSizes[size]} rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold flex-shrink-0`}
          >
            {professional.avatar || professional.name.charAt(0).toUpperCase()}
          </div>

          {/* Name and Details */}
          <div className="flex flex-col min-w-0">
            <span className="font-semibold truncate">{professional.name}</span>
            {professional.profession && size !== "sm" && (
              <span className="text-xs text-primary/70 truncate">
                {professional.profession}
              </span>
            )}
          </div>

          {/* Remove Button */}
          {editable && onRemove && (
            <button
              type="button"
              onClick={() => onRemove(professional.id)}
              className="hover:bg-primary/20 rounded-sm p-1 ml-1 flex-shrink-0 transition-colors"
              aria-label={`Remove ${professional.name}`}
            >
              <X className={size === "sm" ? "w-3 h-3" : "w-4 h-4"} />
            </button>
          )}

          {/* Tooltip on hover (optional enhanced version) */}
          {showTooltip && (
            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 bg-popover text-popover-foreground text-xs rounded-md shadow-lg border border-border opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-10">
              <div className="font-semibold">{professional.name}</div>
              {professional.email && (
                <div className="text-muted-foreground">{professional.email}</div>
              )}
              {professional.profession && (
                <div className="text-muted-foreground">
                  {professional.profession}
                </div>
              )}
              {professional.divisionId && (
                <div className="text-muted-foreground">
                  Division: {professional.divisionId}
                </div>
              )}
              <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1 border-4 border-transparent border-t-popover"></div>
            </div>
          )}
        </div>
      ))}

      {/* Remaining Count Badge */}
      {remainingCount > 0 && (
        <div
          className={`inline-flex items-center gap-1 bg-muted text-muted-foreground rounded-lg ${sizeClasses[size]} font-medium`}
          title={`${remainingCount} more professional${remainingCount > 1 ? "s" : ""}`}
        >
          <User className={size === "sm" ? "w-3 h-3" : "w-4 h-4"} />
          <span>+{remainingCount}</span>
        </div>
      )}
    </div>
  );
}

// Compact version for list views
export function ProfessionalChipsCompact({
  professionals,
  maxDisplay = 2,
}: {
  professionals: Professional[];
  maxDisplay?: number;
}) {
  if (!professionals || professionals.length === 0) {
    return <span className="text-xs text-muted-foreground">Unassigned</span>;
  }

  const displayProfessionals = professionals.slice(0, maxDisplay);
  const remainingCount = Math.max(0, professionals.length - maxDisplay);

  return (
    <div className="flex items-center gap-1 flex-wrap">
      {displayProfessionals.map((prof, index) => (
        <span key={prof.id} className="inline-flex items-center">
          <span className="text-xs font-medium text-foreground">
            {prof.name}
          </span>
          {index < displayProfessionals.length - 1 && (
            <span className="text-xs text-muted-foreground mx-1">,</span>
          )}
        </span>
      ))}
      {remainingCount > 0 && (
        <span className="text-xs text-muted-foreground">
          (+{remainingCount} more)
        </span>
      )}
    </div>
  );
}
