/**
 * Utility functions for project classification handling
 */

export interface ClassificationInfo {
  code: string;
  label: string;
  desc: string;
  icon: string;
  color: string;
}

// Classification mappings
export const CLASSIFICATIONS: Record<string, ClassificationInfo> = {
  A1: {
    code: "A1",
    label: "New Building Project",
    desc: "Full design and construction of a new structure from the ground up.",
    icon: "🏗️",
    color: "#0E2271",
  },
  A2: {
    code: "A2",
    label: "Expansion & Renovation",
    desc: "Modifying or adding to existing facilities and structures.",
    icon: "🔨",
    color: "#1A3580",
  },
  A3: {
    code: "A3",
    label: "Interior Design & Partitioning",
    desc: "Internal modifications, space optimization, and office partitioning.",
    icon: "🛋️",
    color: "#7C3AED",
  },
  A4: {
    code: "A4",
    label: "Site Work & Landscaping",
    desc: "External improvements, parking, infrastructure, and green areas.",
    icon: "🌳",
    color: "#16A34A",
  },
  A5: {
    code: "A5",
    label: "BOQ Preparation Only",
    desc: "Detailed quantity surveying and cost estimation for existing designs.",
    icon: "🧮",
    color: "#EA580C",
  },
  A6: {
    code: "A6",
    label: "Construction Supervision Only",
    desc: "Professional oversight of third-party construction works.",
    icon: "👷",
    color: "#CC1F1A",
  },
};

/**
 * Extract classification code from a classification string
 * Handles formats like "A1", "A1 - New Building Project", "New Building Project"
 */
export function extractClassificationCode(classification: string): string {
  if (!classification) return "";
  
  // Check if it starts with a code (A1, A2, etc.)
  const codeMatch = classification.match(/^(A\d+)/i);
  if (codeMatch) {
    return codeMatch[1].toUpperCase();
  }
  
  // Try to find the code by matching the label
  const normalizedInput = classification.toLowerCase().trim();
  for (const [code, info] of Object.entries(CLASSIFICATIONS)) {
    if (info.label.toLowerCase() === normalizedInput) {
      return code;
    }
  }
  
  return "";
}

/**
 * Get the full classification label (without code prefix)
 * Input: "A1 - New Building Project" or "A1" or "New Building Project"
 * Output: "New Building Project"
 */
export function getClassificationLabel(classification: string): string {
  if (!classification) return "General";
  
  // If it already has the format "A1 - Label", extract the label
  const dashMatch = classification.match(/^A\d+\s*-\s*(.+)$/i);
  if (dashMatch) {
    return dashMatch[1].trim();
  }
  
  // If it's just a code, look it up
  const code = extractClassificationCode(classification);
  if (code && CLASSIFICATIONS[code]) {
    return CLASSIFICATIONS[code].label;
  }
  
  // If it's already a label, return as-is
  return classification;
}

/**
 * Get the classification code from a label or code
 * Input: "New Building Project" or "A1" or "A1 - New Building Project"
 * Output: "A1"
 */
export function getClassificationCode(classification: string): string {
  if (!classification) return "";
  
  const code = extractClassificationCode(classification);
  if (code) return code;
  
  // Try to find by label
  const normalizedInput = classification.toLowerCase().trim();
  for (const [code, info] of Object.entries(CLASSIFICATIONS)) {
    if (info.label.toLowerCase() === normalizedInput) {
      return code;
    }
  }
  
  return "";
}

/**
 * Get classification info by code or label
 */
export function getClassificationInfo(classification: string): ClassificationInfo | null {
  if (!classification) return null;
  
  const code = extractClassificationCode(classification);
  if (code && CLASSIFICATIONS[code]) {
    return CLASSIFICATIONS[code];
  }
  
  // Try to find by label
  const normalizedInput = classification.toLowerCase().trim();
  for (const info of Object.values(CLASSIFICATIONS)) {
    if (info.label.toLowerCase() === normalizedInput) {
      return info;
    }
  }
  
  return null;
}

/**
 * Get classification color
 */
export function getClassificationColor(classification: string): string {
  const info = getClassificationInfo(classification);
  return info?.color || "#64748B"; // Default gray
}

/**
 * Format classification for display (label only, no code)
 */
export function formatClassificationForDisplay(classification: string): string {
  return getClassificationLabel(classification);
}

/**
 * Format classification for storage (code - label format)
 */
export function formatClassificationForStorage(classification: string): string {
  const code = getClassificationCode(classification);
  const info = code ? CLASSIFICATIONS[code] : null;
  
  if (info) {
    return `${info.code} - ${info.label}`;
  }
  
  return classification;
}

/**
 * Get short name for A5/A6 classifications
 * A5 → "BOQ"
 * A6 → "Supervision"
 */
export function getClassificationShortName(classification: string): string {
  const code = getClassificationCode(classification);
  
  if (code === "A5") return "BOQ";
  if (code === "A6") return "Supervision";
  
  return getClassificationLabel(classification);
}

/**
 * Format project title for display
 * For A5/A6 with linked projects, shows: "BOQ for PRJ-001" or "Supervision for PRJ-001"
 * For regular projects, returns the title as-is
 */
export function formatProjectTitle(project: {
  title: string;
  classification: string;
  linkedProjectId?: string;
}): string {
  const code = getClassificationCode(project.classification);
  
  // For A5/A6 with linked projects, create a better title
  if ((code === "A5" || code === "A6") && project.linkedProjectId) {
    const shortName = getClassificationShortName(project.classification);
    return `${shortName} for ${project.linkedProjectId}`;
  }
  
  return project.title;
}
