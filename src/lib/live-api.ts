import { apiRequest } from "@/lib/api";
import type {
  Booking,
  Maintenance,
  Notification,
  Project,
  UserRole,
} from "@/types/models";

type BackendStatus = string;
type BackendRole = "ADMIN" | "USER" | "SUPERVISOR" | "PROFESSIONAL";

interface BackendProject {
  id: number;
  projectId: string;
  title: string;
  description: string;
  classification: string;
  status: BackendStatus;
  createdBy: number;
  assignedSupervisorId?: number | null;
  location?: string;
  budget?: number;
  startDate?: string;
  endDate?: string;
  createdAt?: string;
}

interface BackendBooking {
  id: number;
  bookingId: string;
  type: string;
  status: BackendStatus;
  requester: number;
  assignedSupervisorId?: number | null;
  dateTime: string;
  capacity?: number;
  layout?: string;
  amenities?: string;
}

interface BackendMaintenance {
  id: number;
  maintenanceId: string;
  category: string;
  description: string;
  status: BackendStatus;
  priority?: string;
  createdBy: number;
  assignedSupervisorId?: number | null;
  assignedProfessionalId?: number | null;
  divisionId?: number | null;
  location?: string;
  createdAt?: string;
}

interface BackendNotification {
  id: number;
  userId: number;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
}

interface BackendOverview {
  totalRequests?: number;
  statusBreakdown?: Record<string, number>;
  divisionRequestVolume?: Record<string, number>;
}

interface BackendMttr {
  mttrHours?: number;
  sampleSize?: number;
}

interface BackendAnalytics {
  requestsByDivision?: Record<string, number>;
  supervisorPerformance?: Record<string, number>;
  professionalWorkload?: Record<string, number>;
  supervisorCount?: number;
  professionalCount?: number;
}

function userId(id?: number | null): string {
  if (!id) return "USR-000";
  return `USR-${String(id).padStart(3, "0")}`;
}

function parseUserId(raw?: string | null): number {
  if (!raw) return 0;
  const matched = raw.match(/(\d+)/);
  return matched ? Number(matched[1]) : 0;
}

const projectDbIdByBusinessId = new Map<string, number>();
const bookingDbIdByBusinessId = new Map<string, number>();
const maintenanceDbIdByBusinessId = new Map<string, number>();

function toIsoDate(raw?: string): string {
  if (!raw) return new Date().toISOString();
  return raw;
}

function normalizeStatus(status: string): string {
  if (!status) return "Submitted";
  const rawStatus = status.trim().toUpperCase().replace(/\s+/g, "_");
  switch (rawStatus) {
    case "SUBMITTED":
      return "Submitted";
    case "UNDER_REVIEW":
      return "Under Review";
    case "ASSIGNED_TO_SUPERVISOR":
      return "Assigned to Supervisor";
    case "WORKORDER_CREATED":
    case "WORK_ORDER_CREATED":
      return "WorkOrder Created";
    case "ASSIGNED_TO_PROFESSIONAL":
    case "ASSIGNED_TO_PROFESSIONALS":
      return "Assigned to Professional";
    case "IN_PROGRESS":
      return "In Progress";
    case "COMPLETED":
      return "Completed";
    case "REVIEWED":
      return "Reviewed";
    case "APPROVED":
      return "Approved";
    case "REJECTED":
      return "Rejected";
    case "CLOSED":
      return "Closed";
    default:
      return status;
  }
}

function parseBookingType(raw: string): Booking["type"] {
  const upper = raw.toUpperCase();
  if (upper === "OFFICE") return "Office";
  if (upper === "LAB") return "Lab";
  if (upper === "TRAINING_ROOM" || upper === "TRAINING ROOM")
    return "Training Room";
  return "Conference Hall";
}

function inferPriority(priority?: string): Maintenance["priority"] {
  if (priority === "Critical") return "Critical";
  if (priority === "High") return "High";
  if (priority === "Low") return "Low";
  return "Medium";
}

function splitLocation(location?: string): {
  floor: string;
  building?: string;
} {
  if (!location) return { floor: "N/A" };
  const parts = location.split("/").map((p) => p.trim());
  return {
    building: parts[0],
    floor: parts[1] || "N/A",
  };
}

export async function fetchLiveProjects(
  token?: string,
  filterProjectId?: string,
): Promise<Project[]> {
  const url = filterProjectId
    ? `/api/projects?projectId=${filterProjectId}`
    : "/api/projects";
  const list = await apiRequest<BackendProject[]>(url, { token });
  return list.map((item) => {
    projectDbIdByBusinessId.set(item.projectId || `PRJ-${item.id}`, item.id);
    return {
      id: item.projectId || `PRJ-${item.id}`,
      title: item.title,
      description: item.description || "",
      category: "Capital Project",
      classification: item.classification || "General",
      status: normalizeStatus(item.status) as Project["status"],
      requestedBy: userId(item.createdBy),
      supervisorId: item.assignedSupervisorId
        ? userId(item.assignedSupervisorId)
        : undefined,
      location: item.location || "N/A",
      budget: Number(item.budget || 0),
      startDate: item.startDate || "",
      endDate: item.endDate || "",
      createdAt: toIsoDate(item.createdAt),
      updatedAt: toIsoDate(item.createdAt),
      documents: [],
      timeline: [],
    };
  });
}

export async function fetchLiveBookings(
  token?: string,
  filterBookingId?: string,
): Promise<Booking[]> {
  const url = filterBookingId
    ? `/api/bookings?bookingId=${filterBookingId}`
    : "/api/bookings";
  const list = await apiRequest<BackendBooking[]>(url, { token });
  return list.map((item) => {
    bookingDbIdByBusinessId.set(item.bookingId || `BKG-${item.id}`, item.id);
    const dt = item.dateTime ? new Date(item.dateTime) : new Date();
    return {
      id: item.bookingId || `BKG-${item.id}`,
      title: item.layout || "Booking",
      space: item.layout || "N/A",
      type: parseBookingType(item.type),
      status: normalizeStatus(item.status) as Booking["status"],
      requestedBy: userId(item.requester),
      supervisorId: item.assignedSupervisorId
        ? userId(item.assignedSupervisorId)
        : undefined,
      date: dt.toISOString().slice(0, 10),
      startTime: dt.toISOString().slice(11, 16),
      endTime: dt.toISOString().slice(11, 16),
      attendees: Number(item.capacity || 0),
      purpose: item.layout || "N/A",
      requirements: item.amenities || "",
      createdAt: toIsoDate(item.dateTime),
      updatedAt: toIsoDate(item.dateTime),
    };
  });
}

export async function fetchLiveMaintenance(
  token?: string,
  filterMaintenanceId?: string,
): Promise<Maintenance[]> {
  const url = filterMaintenanceId
    ? `/api/maintenance?maintenanceId=${filterMaintenanceId}`
    : "/api/maintenance";
  const list = await apiRequest<BackendMaintenance[]>(url, {
    token,
  });
  return list.map((item) => {
    maintenanceDbIdByBusinessId.set(
      item.maintenanceId || `MNT-${item.id}`,
      item.id,
    );
    const loc = splitLocation(item.location);
    return {
      id: item.maintenanceId || `MNT-${item.id}`,
      title: item.category || "Maintenance Request",
      description: item.description || "",
      type: (item.category as Maintenance["type"]) || "General",
      subType: item.category,
      status: normalizeStatus(item.status) as Maintenance["status"],
      priority: inferPriority(item.priority),
      requestedBy: userId(item.createdBy),
      assignedTo: item.assignedProfessionalId
        ? userId(item.assignedProfessionalId)
        : undefined,
      supervisorId: item.assignedSupervisorId
        ? userId(item.assignedSupervisorId)
        : undefined,
      divisionId: item.divisionId
        ? `DIV-${String(item.divisionId).padStart(3, "0")}`
        : undefined,
      location: item.location || "N/A",
      building: loc.building,
      floor: loc.floor,
      createdAt: toIsoDate(item.createdAt),
      updatedAt: toIsoDate(item.createdAt),
      notes: "",
      attachments: [],
      timeline: [],
    };
  });
}

export async function fetchLiveNotifications(
  token?: string,
): Promise<Notification[]> {
  const list = await apiRequest<BackendNotification[]>("/api/notifications", {
    token,
  });
  return list.map((item) => ({
    id: `NOTIF-${item.id}`,
    title: item.title,
    message: item.message,
    type: "info",
    read: item.isRead,
    userId: userId(item.userId),
    link: "/dashboard/notifications",
    createdAt: item.createdAt,
  }));
}

export async function fetchLiveUsers(token?: string): Promise<
  Array<{
    id: string;
    name: string;
    email: string;
    role: UserRole;
    status: string;
    avatar: string;
    department: string;
    phone: string;
    password: string;
    createdAt: string;
    divisionId?: string;
  }>
> {
  const list = await apiRequest<
    Array<{
      id: number;
      name: string;
      email?: string;
      role: BackendRole;
      status?: string;
      department?: string;
      phone?: string;
      divisionId?: number | null;
      createdAt?: string;
    }>
  >("/api/users", { token });
  return list.map((item) => {
    const rawName = item.name || "Unknown User";
    const initials = rawName
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
    return {
      id: userId(item.id),
      name: rawName,
      email: item.email || "",
      role:
        item.role === "ADMIN"
          ? "admin"
          : item.role === "SUPERVISOR"
            ? "supervisor"
            : item.role === "PROFESSIONAL"
              ? "professional"
              : "user",
      status: item.status || "active",
      avatar: initials,
      department: item.department || "",
      phone: item.phone || "",
      password: "",
      createdAt: item.createdAt || new Date().toISOString().slice(0, 10),
      divisionId:
        item.divisionId == null
          ? undefined
          : `DIV-${String(item.divisionId).padStart(3, "0")}`,
    };
  });
}

export async function fetchLiveReports(token?: string): Promise<{
  overview: BackendOverview;
  mttr: BackendMttr;
  analytics: BackendAnalytics;
}> {
  const [overview, mttr, analytics] = await Promise.all([
    apiRequest<BackendOverview>("/api/reports/overview", { token }),
    apiRequest<BackendMttr>("/api/reports/mttr", { token }),
    apiRequest<BackendAnalytics>("/api/reports/analytics", { token }),
  ]);
  return { overview, mttr, analytics };
}

function resolveRequestDbId(
  module: "PROJECT" | "BOOKING" | "MAINTENANCE",
  businessId: string,
): number {
  if (module === "PROJECT") {
    return projectDbIdByBusinessId.get(businessId) || 0;
  }
  if (module === "BOOKING") {
    return bookingDbIdByBusinessId.get(businessId) || 0;
  }
  return maintenanceDbIdByBusinessId.get(businessId) || 0;
}

export async function adminAssignRequest(params: {
  module: "PROJECT" | "BOOKING" | "MAINTENANCE";
  businessId: string;
  divisionId: string;
  supervisorId: string;
  priority?: string;
  token?: string;
}): Promise<void> {
  const requestId = resolveRequestDbId(params.module, params.businessId);
  if (!requestId)
    throw new Error(`Unable to resolve request id for ${params.businessId}`);
  const divisionId = parseUserId(params.divisionId);
  const supervisorId = parseUserId(params.supervisorId);
  if (!divisionId || !supervisorId)
    throw new Error("Invalid division/supervisor selection");

  await apiRequest("/api/admin/assign", {
    method: "PATCH",
    token: params.token,
    body: {
      requestId,
      requestType: params.module,
      divisionId,
      supervisorId,
      priority: params.priority || "Medium",
    },
  });
}

export async function adminDecision(params: {
  module: "PROJECT" | "BOOKING" | "MAINTENANCE";
  businessId: string;
  action: "approve" | "reject" | "close";
  token?: string;
}): Promise<void> {
  const requestId = resolveRequestDbId(params.module, params.businessId);
  if (!requestId)
    throw new Error(`Unable to resolve request id for ${params.businessId}`);

  if (params.module === "MAINTENANCE") {
    await apiRequest(`/api/admin/${params.action}`, {
      method: "PATCH",
      token: params.token,
      body: { requestId },
    });
    return;
  }

  const base = params.module === "PROJECT" ? "/api/projects" : "/api/bookings";
  await apiRequest(`${base}/${requestId}/${params.action}`, {
    method: "PATCH",
    token: params.token,
  });
}

export async function supervisorReviewRequest(params: {
  module: "PROJECT" | "BOOKING" | "MAINTENANCE";
  businessId: string;
  token?: string;
}): Promise<void> {
  const requestId = resolveRequestDbId(params.module, params.businessId);
  if (!requestId)
    throw new Error(`Unable to resolve request id for ${params.businessId}`);

  if (params.module === "MAINTENANCE") {
    await apiRequest("/api/supervisor/review", {
      method: "POST",
      token: params.token,
      body: { requestId },
    });
    return;
  }

  const base = params.module === "PROJECT" ? "/api/projects" : "/api/bookings";
  await apiRequest(`${base}/${requestId}/review`, {
    method: "POST",
    token: params.token,
  });
}

export async function supervisorAssignProfessional(params: {
  module: "PROJECT" | "BOOKING" | "MAINTENANCE";
  businessId: string;
  professionalId: string;
  instructions?: string;
  token?: string;
}): Promise<void> {
  const requestId = resolveRequestDbId(params.module, params.businessId);
  const assignedProfessionalId = parseUserId(params.professionalId);
  if (!requestId) {
    throw new Error(`Unable to resolve request id for ${params.businessId}`);
  }
  if (!assignedProfessionalId)
    throw new Error("Invalid professional selection");

  // Keep pointing to maintenance API if the others don't exist yet,
  // or point to generic if backend supports it. For now, assume uniform or identical.
  const endpoint = "/api/supervisor/assign-professional";
  if (params.module !== "MAINTENANCE") {
    // If backend requires specialized routes we could add them here, but let's try generic
    // or keep it pointing to the single endpoint if it handles all via requestType
  }

  await apiRequest(endpoint, {
    method: "POST",
    token: params.token,
    body: {
      requestId,
      requestType: params.module, // added requestType for potential backend dispatcher
      assignedProfessionalId,
      instructions: params.instructions || "",
    },
  });
}

export async function professionalUpdateTaskStatus(params: {
  module: "PROJECT" | "BOOKING" | "MAINTENANCE";
  businessId: string;
  status: "In Progress" | "Completed";
  token?: string;
}): Promise<void> {
  const requestId = resolveRequestDbId(params.module, params.businessId);
  if (!requestId) {
    throw new Error(`Unable to resolve request id for ${params.businessId}`);
  }

  let endpoint = `/api/professional/tasks/${requestId}/status`;
  if (params.module === "PROJECT")
    endpoint = `/api/projects/${requestId}/status`;
  if (params.module === "BOOKING")
    endpoint = `/api/bookings/${requestId}/status`;

  await apiRequest(endpoint, {
    method: "PATCH",
    token: params.token,
    body: { status: params.status },
  });
}
