// API Configuration
export const API_CONFIG = {
  RETRY_COUNT: 2,
  RETRY_DELAY_MS: 500,
  REQUEST_TIMEOUT_MS: 30000,
} as const;

// Pagination
export const PAGINATION = {
  DEFAULT_PAGE_SIZE: 10,
  PAGE_SIZE_OPTIONS: [10, 25, 50, 100],
} as const;

// Status Colors
export const STATUS_COLORS = {
  Submitted: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
  "Under Review":
    "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300",
  "Assigned to Supervisor":
    "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300",
  "Assigned to Professionals":
    "bg-cyan-100 text-cyan-800 dark:bg-cyan-900/30 dark:text-cyan-300",
  "In Progress":
    "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300",
  Completed:
    "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300",
  Reviewed: "bg-teal-100 text-teal-800 dark:bg-teal-900/30 dark:text-teal-300",
  Approved:
    "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300",
  Rejected: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300",
  Closed: "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300",
  "In Process":
    "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
} as const;

// Priority Colors
export const PRIORITY_COLORS = {
  Low: "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300",
  Medium: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
  High: "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300",
  Critical: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300",
} as const;

// Role Colors
export const ROLE_COLORS = {
  admin:
    "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300",
  user: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
  supervisor:
    "bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-300",
  professional:
    "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300",
} as const;

// Local Storage Keys
export const STORAGE_KEYS = {
  THEME: "insa_theme",
  LANGUAGE: "insa_language",
  SIDEBAR_STATE: "insa_sidebar_open",
  PROJECT_BADGE_SEEN: "insa_admin_seen_projects_actionable",
  MAINTENANCE_BADGE_SEEN: "insa_admin_seen_maintenance_actionable",
} as const;

// Date Formats
export const DATE_FORMATS = {
  DISPLAY: "MMM dd, yyyy",
  INPUT: "yyyy-MM-dd",
  DATETIME: "MMM dd, yyyy HH:mm",
  TIME: "HH:mm",
} as const;

// File Upload
export const FILE_UPLOAD = {
  MAX_SIZE_MB: 10,
  ALLOWED_TYPES: [
    "image/jpeg",
    "image/png",
    "image/gif",
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  ],
  ALLOWED_EXTENSIONS: [
    ".jpg",
    ".jpeg",
    ".png",
    ".gif",
    ".pdf",
    ".doc",
    ".docx",
  ],
} as const;

// Validation
export const VALIDATION = {
  MIN_PASSWORD_LENGTH: 8,
  MAX_PASSWORD_LENGTH: 128,
  MIN_NAME_LENGTH: 2,
  MAX_NAME_LENGTH: 100,
  MAX_DESCRIPTION_LENGTH: 2000,
  MAX_TITLE_LENGTH: 200,
  PHONE_REGEX: /^(\+251|0)?[79]\d{8}$/,
  EMAIL_REGEX: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
} as const;

// INSA Brand Colors
export const INSA_COLORS = {
  DEEP_NAVY: "#0E2271",
  SHIELD_BLUE: "#1A3580",
  LENS_RED: "#CC1F1A",
  CIRCUIT_GOLD: "#F5B800",
  PURPLE: "#7C3AED",
} as const;

// Request ID Prefixes
export const ID_PREFIXES = {
  PROJECT: "PRJ",
  BOOKING: "BKG",
  MAINTENANCE: "MNT",
  USER: "USR",
  DIVISION: "DIV",
  NOTIFICATION: "NOTIF",
} as const;

// Error Messages
export const ERROR_MESSAGES = {
  NETWORK_ERROR: "Network error. Please check your connection and try again.",
  AUTH_ERROR: "Authentication failed. Please log in again.",
  PERMISSION_ERROR: "You don't have permission to perform this action.",
  NOT_FOUND: "The requested resource was not found.",
  SERVER_ERROR: "Server error. Please try again later.",
  VALIDATION_ERROR: "Please check your input and try again.",
  UNKNOWN_ERROR: "An unexpected error occurred. Please try again.",
} as const;

// Success Messages
export const SUCCESS_MESSAGES = {
  LOGIN: "Successfully logged in",
  LOGOUT: "Successfully logged out",
  REGISTER: "Account created successfully",
  UPDATE: "Updated successfully",
  DELETE: "Deleted successfully",
  CREATE: "Created successfully",
  SUBMIT: "Submitted successfully",
  APPROVE: "Approved successfully",
  REJECT: "Rejected successfully",
  ASSIGN: "Assigned successfully",
} as const;
