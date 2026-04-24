import type { Space } from "@/types/models";

const SPACES_STORAGE_KEY = "insa_spaces";

// Default spaces
const defaultSpaces: Space[] = [
  {
    id: "SP-001",
    name: "A2-Block Hall",
    capacity: 110,
    type: "Conference Hall",
    floor: "First Floor",
    building: "Block A2",
    available: true,
  },
  {
    id: "SP-002",
    name: "F-Block Hall",
    capacity: 800,
    type: "Conference Hall",
    floor: "First Floor",
    building: "F Block",
    available: true,
  },
];

/**
 * Get all spaces from localStorage
 */
export function getSpaces(): Space[] {
  if (typeof window === "undefined") return defaultSpaces;

  try {
    const stored = localStorage.getItem(SPACES_STORAGE_KEY);
    if (!stored) {
      // Initialize with default spaces
      localStorage.setItem(SPACES_STORAGE_KEY, JSON.stringify(defaultSpaces));
      return defaultSpaces;
    }
    const parsed = JSON.parse(stored) as Space[];
    // Filter out "hhhh" which is test data
    return parsed.filter(s => s.name !== "hhhh" && s.name !== "hhh");
  } catch (error) {
    console.error("Failed to load spaces from storage:", error);
    return defaultSpaces.filter(s => s.name !== "hhhh" && s.name !== "hhh");
  }
}

/**
 * Save spaces to localStorage
 */
export function saveSpaces(spaces: Space[]): void {
  if (typeof window === "undefined") return;

  try {
    localStorage.setItem(SPACES_STORAGE_KEY, JSON.stringify(spaces));
    // Dispatch custom event to notify other components
    window.dispatchEvent(new CustomEvent("spacesUpdated", { detail: spaces }));
  } catch (error) {
    console.error("Failed to save spaces to storage:", error);
  }
}

/**
 * Add a new space
 */
export function addSpace(space: Space): Space[] {
  const spaces = getSpaces();
  const newSpaces = [...spaces, space];
  saveSpaces(newSpaces);
  return newSpaces;
}

/**
 * Update an existing space
 */
export function updateSpace(spaceId: string, updates: Partial<Space>): Space[] {
  const spaces = getSpaces();
  const newSpaces = spaces.map((s) =>
    s.id === spaceId ? { ...s, ...updates } : s
  );
  saveSpaces(newSpaces);
  return newSpaces;
}

/**
 * Delete a space
 */
export function deleteSpace(spaceId: string): Space[] {
  const spaces = getSpaces();
  const newSpaces = spaces.filter((s) => s.id !== spaceId);
  saveSpaces(newSpaces);
  return newSpaces;
}

/**
 * Get a single space by ID
 */
export function getSpaceById(spaceId: string): Space | undefined {
  const spaces = getSpaces();
  return spaces.find((s) => s.id === spaceId);
}

/**
 * Reset spaces to default
 */
export function resetSpaces(): Space[] {
  saveSpaces(defaultSpaces);
  return defaultSpaces;
}
