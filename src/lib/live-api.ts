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
  assignedProfessionalId?: number | null;
  location?: string;
  block?: string;
  floor?: string;
  budget?: number;
  startDate?: string;
  endDate?: string;
  createdAt?: string;
  department?: string;
  contactPerson?: string;
  phone?: string;
  siteCondition?: string;
  materialCost?: number;
  laborCost?: number;
  totalCost?: number;
  partsUsed?: string;
  requestMode?: string;
  linkedProjectId?: string;
  scope?: unknown;
  divisionId?: number | null;
}

interface BackendBooking {
  id: number;
  bookingId: string;
  type: string;
  status: BackendStatus;
  requester: number;
  assignedSupervisorId?: number | null;
  assignedProfessionalId?: number | null;
  dateTime: string;
  capacity?: number;
  layout?: string;
  amenities?: string;
  materialCost?: number;
  laborCost?: number;
  totalCost?: number;
  partsUsed?: string;
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
  materialCost?: number;
  laborCost?: number;
  totalCost?: number;
  partsUsed?: string;
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

type RequestModule = "PROJECT" | "BOOKING" | "MAINTENANCE";

function requestCache(module: RequestModule): Map<string, number> {
  if (module === "PROJECT") return projectDbIdByBusinessId;
  if (module === "BOOKING") return bookingDbIdByBusinessId;
  return maintenanceDbIdByBusinessId;
}

function cacheRequestDbId(
  module: RequestModule,
  businessId: string,
  dbId: number,
): void {
  if (!businessId || !dbId) return;
  requestCache(module).set(businessId, dbId);
}

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
      return "Assigned to Professionals";
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

function parseProjectScope(scope: unknown): Record<string, unknown> | undefined {
  if (!scope) return undefined;
  if (typeof scope === "object" && !Array.isArray(scope)) {
    return scope as Record<string, unknown>;
  }
  if (typeof scope === "string") {
    try {
      const parsed = JSON.parse(scope);
      if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
        return parsed as Record<string, unknown>;
      }
    } catch {
      return undefined;
    }
  }
  return undefined;
}

export async function fetchLiveProjects(
  filterProjectId?: string,
): Promise<Project[]> {
  const url = filterProjectId
    ? `/api/projects?projectId=${filterProjectId}`
    : "/api/projects";
  const list = await apiRequest<BackendProject[]>(url);
  return list.map((item) => {
    const businessId = item.projectId || `PRJ-${item.id}`;
    cacheRequestDbId("PROJECT", businessId, item.id);
    return {
      id: businessId,
      dbId: item.id,
      title: item.title,
      description: item.description || "",
      category: "Capital Project",
      classification: item.classification || "General",
      status: normalizeStatus(item.status) as Project["status"],
      requestedBy: userId(item.createdBy),
      supervisorId: item.assignedSupervisorId
        ? userId(item.assignedSupervisorId)
        : undefined,
      assignedTo: item.assignedProfessionalId
        ? userId(item.assignedProfessionalId)
        : undefined,
      location: item.location || "N/A",
      block: item.block,
      floor: item.floor,
      budget: Number(item.budget || 0),
      startDate: item.startDate || "",
      endDate: item.endDate || "",
      department: item.department,
      contactPerson: item.contactPerson,
      contactPhone: item.phone,
      siteCondition: item.siteCondition,
      requestMode: item.requestMode,
      linkedProjectId: item.linkedProjectId,
      createdAt: toIsoDate(item.createdAt),
      updatedAt: toIsoDate(item.createdAt),
      divisionId:
        item.divisionId == null
          ? undefined
          : `DIV-${String(item.divisionId).padStart(3, "0")}`,
      documents: [],
      timeline: [],
      materialCost: item.materialCost,
      laborCost: item.laborCost,
      totalCost: item.totalCost,
      partsUsed: item.partsUsed,
      rejectionReason: item.rejectionReason,
      scope: parseProjectScope(item.scope),
    };
  });
}

export async function fetchLiveBookings(
  filterBookingId?: string,
): Promise<Booking[]> {
  const url = filterBookingId
    ? `/api/bookings?bookingId=${filterBookingId}`
    : "/api/bookings";
  const list = await apiRequest<BackendBooking[]>(url);
  return list.map((item) => {
    const businessId = item.bookingId || `BKG-${item.id}`;
    cacheRequestDbId("BOOKING", businessId, item.id);
    const dt = item.dateTime ? new Date(item.dateTime) : new Date();
    return {
      id: businessId,
      dbId: item.id,
      title: item.layout || "Booking",
      space: item.layout || "N/A",
      type: parseBookingType(item.type),
      status: normalizeStatus(item.status) as Booking["status"],
      requestedBy: userId(item.requester),
      supervisorId: item.assignedSupervisorId
        ? userId(item.assignedSupervisorId)
        : undefined,
      assignedTo: item.assignedProfessionalId
        ? userId(item.assignedProfessionalId)
        : undefined,
      date: dt.toISOString().slice(0, 10),
      startTime: dt.toISOString().slice(11, 16),
      endTime: dt.toISOString().slice(11, 16),
      attendees: Number(item.capacity || 0),
      purpose: item.layout || "N/A",
      requirements: item.amenities || "",
      createdAt: toIsoDate(item.dateTime),
      updatedAt: toIsoDate(item.dateTime),
      materialCost: item.materialCost,
      laborCost: item.laborCost,
      totalCost: item.totalCost,
      partsUsed: item.partsUsed,
      rejectionReason: item.rejectionReason,
    };
  });
}

export async function fetchLiveMaintenance(
  filterMaintenanceId?: string,
): Promise<Maintenance[]> {
  const url = filterMaintenanceId
    ? `/api/maintenance?maintenanceId=${filterMaintenanceId}`
    : "/api/maintenance";
  const list = await apiRequest<BackendMaintenance[]>(url);
  return list.map((item) => {
    const businessId = item.maintenanceId || `MNT-${item.id}`;
    cacheRequestDbId("MAINTENANCE", businessId, item.id);
    const loc = splitLocation(item.location);
    return {
      id: businessId,
      dbId: item.id,
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
      materialCost: item.materialCost,
      laborCost: item.laborCost,
      totalCost: item.totalCost,
      partsUsed: item.partsUsed,
      rejectionReason: item.rejectionReason,
      createdBy: userId(item.createdBy),
    };
  });
}

export async function fetchLiveNotifications(): Promise<Notification[]> {
  const list = await apiRequest<BackendNotification[]>(
    "/api/notifications",
    {},
  );
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

export async function markNotificationAsRead(notificationId: string): Promise<void> {
  const dbId = parseInt(notificationId.replace("NOTIF-", ""));
  await apiRequest(`/api/notifications/${dbId}/read`, {
    method: "PATCH",
  });
}

export async function markAllNotificationsAsRead(): Promise<void> {
  await apiRequest("/api/notifications/read-all", {
    method: "PATCH",
  });
}

export async function fetchLiveUsers(): Promise<
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
    profession?: string;
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
      profession?: string | null;
      createdAt?: string;
    }>
  >("/api/users");
  return list.map((item) => {
    const rawName = item.name || "Unknown User";
    const initials = rawName
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
    const frontendRole: UserRole =
      item.role === "ADMIN"
        ? "admin"
        : item.role === "SUPERVISOR"
          ? "supervisor"
          : item.role === "PROFESSIONAL"
            ? "professional"
            : "user";
    return {
      id: userId(item.id),
      name: rawName,
      email: item.email || "",
      role: frontendRole,
      status: item.status || "active",
      avatar: initials,
      department: item.department || "",
      phone: item.phone || "",
      password: "",
      createdAt: item.createdAt || new Date().toISOString().slice(0, 10),
      divisionId:
        item.divisionId == null
          ? frontendRole === "professional"
            ? "OTHER"
            : undefined
          : `DIV-${String(item.divisionId).padStart(3, "0")}`,
      profession: item.profession || undefined,
    };
  });
}

export async function deleteUser(userId: string): Promise<void> {
  const dbId = parseUserId(userId);
  await apiRequest(`/api/users/${dbId}`, {
    method: "DELETE",
  });
}

export async function updateLiveUser(params: {
  userId: string;
  name: string;
  email: string;
  role: UserRole;
  phone: string;
  department: string;
  profession?: string;
  divisionId?: string;
}): Promise<{
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
  profession?: string;
}> {
  const dbId = parseUserId(params.userId);
  if (!dbId) throw new Error("Invalid user id");

  const backendRole: BackendRole =
    params.role === "admin"
      ? "ADMIN"
      : params.role === "supervisor"
        ? "SUPERVISOR"
        : params.role === "professional"
          ? "PROFESSIONAL"
          : "USER";

  const parsedDivisionId =
    !params.divisionId || params.divisionId === "OTHER"
      ? null
      : parseUserId(params.divisionId);

  const item = await apiRequest<{
    id: number;
    name: string;
    email?: string;
    role: BackendRole;
    department?: string;
    phone?: string;
    divisionId?: number | null;
    profession?: string | null;
    createdAt?: string;
  }>(`/api/users/${dbId}`, {
    method: "PATCH",
    body: {
      name: params.name,
      email: params.email,
      role: backendRole,
      phone: params.phone,
      department: params.department,
      profession: params.profession,
      divisionId: parsedDivisionId,
    },
  });

  const initials = (item.name || "Unknown User")
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return {
    id: userId(item.id),
    name: item.name || "Unknown User",
    email: item.email || "",
    role:
      item.role === "ADMIN"
        ? "admin"
        : item.role === "SUPERVISOR"
          ? "supervisor"
          : item.role === "PROFESSIONAL"
            ? "professional"
            : "user",
    status: "active",
    avatar: initials,
    department: item.department || "",
    phone: item.phone || "",
    password: "",
    createdAt: item.createdAt || new Date().toISOString().slice(0, 10),
    divisionId:
      item.divisionId == null
        ? params.role === "professional"
          ? "OTHER"
          : undefined
        : `DIV-${String(item.divisionId).padStart(3, "0")}`,
    profession: item.profession || undefined,
  };
}

export async function fetchLiveReports(): Promise<{
  overview: BackendOverview;
  mttr: BackendMttr;
  analytics: BackendAnalytics;
}> {
  const [overview, mttr, analytics] = await Promise.all([
    apiRequest<BackendOverview>("/api/reports/overview"),
    apiRequest<BackendMttr>("/api/reports/mttr"),
    apiRequest<BackendAnalytics>("/api/reports/analytics"),
  ]);
  return { overview, mttr, analytics };
}

async function fetchRequestDbId(
  module: RequestModule,
  businessId: string,
): Promise<number> {
  if (module === "PROJECT") {
    const list = await apiRequest<BackendProject[]>(
      `/api/projects?projectId=${encodeURIComponent(businessId)}`,
      {},
    );
    const match = list.find(
      (item) => (item.projectId || `PRJ-${item.id}`) === businessId,
    );
    if (match) {
      cacheRequestDbId("PROJECT", businessId, match.id);
      return match.id;
    }
    return 0;
  }

  if (module === "BOOKING") {
    const list = await apiRequest<BackendBooking[]>(
      `/api/bookings?bookingId=${encodeURIComponent(businessId)}`,
      {},
    );
    const match = list.find(
      (item) => (item.bookingId || `BKG-${item.id}`) === businessId,
    );
    if (match) {
      cacheRequestDbId("BOOKING", businessId, match.id);
      return match.id;
    }
    return 0;
  }

  const list = await apiRequest<BackendMaintenance[]>(
    `/api/maintenance?maintenanceId=${encodeURIComponent(businessId)}`,
    {},
  );
  const match = list.find(
    (item) => (item.maintenanceId || `MNT-${item.id}`) === businessId,
  );
  if (match) {
    cacheRequestDbId("MAINTENANCE", businessId, match.id);
    return match.id;
  }
  return 0;
}

async function resolveRequestDbId(
  module: RequestModule,
  businessId: string,
  requestId?: number,
): Promise<number> {
  if (requestId) {
    cacheRequestDbId(module, businessId, requestId);
    return requestId;
  }

  const cachedId = requestCache(module).get(businessId);
  if (cachedId) return cachedId;

  return fetchRequestDbId(module, businessId);
}

export async function adminAssignRequest(params: {
  module: RequestModule;
  businessId: string;
  requestId?: number;
  divisionId?: string;
  supervisorId?: string;
  priority?: string;
}): Promise<void> {
  const requestId = await resolveRequestDbId(
    params.module,
    params.businessId,
    params.requestId,
  );
  if (!requestId)
    throw new Error(`Unable to resolve request id for ${params.businessId}`);
  const divisionId = params.divisionId ? parseUserId(params.divisionId) : 0;
  const supervisorId = params.supervisorId
    ? parseUserId(params.supervisorId)
    : undefined;
  if (params.module === "MAINTENANCE" && !divisionId) {
    throw new Error("Invalid division selection");
  }
  if (params.supervisorId && !supervisorId)
    throw new Error("Invalid supervisor selection");

  await apiRequest("/api/admin/assign", {
    method: "PATCH",
    body: {
      requestId,
      requestType: params.module,
      ...(divisionId ? { divisionId } : {}),
      ...(supervisorId ? { supervisorId } : {}),
      priority: params.priority || "Medium",
    },
  });
}

export async function adminDecision(params: {
  module: RequestModule;
  businessId: string;
  requestId?: number;
  action: "approve" | "reject" | "close";
}): Promise<void> {
  const requestId = await resolveRequestDbId(
    params.module,
    params.businessId,
    params.requestId,
  );
  if (!requestId)
    throw new Error(`Unable to resolve request id for ${params.businessId}`);

  if (params.module === "MAINTENANCE") {
    await apiRequest(`/api/admin/${params.action}`, {
      method: "PATCH",
      body: { requestId },
    });
    return;
  }

  const base = params.module === "PROJECT" ? "/api/projects" : "/api/bookings";
  await apiRequest(`${base}/${requestId}/${params.action}`, {
    method: "PATCH",
  });
}

export async function adminStartReview(params: {
  module: RequestModule;
  businessId: string;
  requestId?: number;
}): Promise<void> {
  const requestId = await resolveRequestDbId(
    params.module,
    params.businessId,
    params.requestId,
  );
  console.log("DEBUG adminStartReview:", {
    module: params.module,
    businessId: params.businessId,
    requestId,
    resolvedRequestId: requestId,
  });
  if (!requestId)
    throw new Error(`Unable to resolve request id for ${params.businessId}`);

  try {
    console.log("Calling /api/admin/review with:", {
      requestId,
      requestType: params.module,
    });
    await apiRequest("/api/admin/review", {
      method: "PATCH",
      body: {
        requestId,
        requestType: params.module,
      },
    });
    console.log("adminStartReview SUCCESS");
  } catch (error) {
    console.error("adminStartReview FAILED:", error);
    const message = error instanceof Error ? error.message : String(error);
    if (params.module === "MAINTENANCE" || !/\b(404|405)\b/.test(message)) {
      throw error;
    }

    const base =
      params.module === "PROJECT" ? "/api/projects" : "/api/bookings";
    await apiRequest(`${base}/${requestId}/review`, {
      method: "PATCH",
    });
  }
}

export async function supervisorReviewRequest(params: {
  module: RequestModule;
  businessId: string;
  requestId?: number;
}): Promise<void> {
  const requestId = await resolveRequestDbId(
    params.module,
    params.businessId,
    params.requestId,
  );
  if (!requestId)
    throw new Error(`Unable to resolve request id for ${params.businessId}`);

  if (params.module === "MAINTENANCE") {
    await apiRequest("/api/supervisor/review", {
      method: "POST",
      body: { requestId },
    });
    return;
  }

  const base = params.module === "PROJECT" ? "/api/projects" : "/api/bookings";
  await apiRequest(`${base}/${requestId}/review`, {
    method: "POST",
  });
}

export async function adminAssignProfessional(params: {
  module: RequestModule;
  businessId: string;
  requestId?: number;
  professionalId: string;
  instructions?: string;
}): Promise<void> {
  const requestId = await resolveRequestDbId(
    params.module,
    params.businessId,
    params.requestId,
  );
  const assignedProfessionalId = parseUserId(params.professionalId);
  if (!requestId) {
    throw new Error(`Unable to resolve request id for ${params.businessId}`);
  }
  if (!assignedProfessionalId)
    throw new Error("Invalid professional selection");

  // Admins need to assign to professional using a special admin endpoint or standard access endpoint
  const endpoint = "/api/admin/assign-professional";

  await apiRequest(endpoint, {
    method: "PATCH",
    body: {
      requestId,
      requestType: params.module,
      assignedProfessionalId,
      instructions: params.instructions || "",
    },
  });
}

export async function supervisorAssignProfessional(params: {
  module: RequestModule;
  businessId: string;
  requestId?: number;
  professionalId: string;
  instructions?: string;
}): Promise<void> {
  const requestId = await resolveRequestDbId(
    params.module,
    params.businessId,
    params.requestId,
  );
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
    body: {
      requestId,
      requestType: params.module, // added requestType for potential backend dispatcher
      assignedProfessionalId,
      instructions: params.instructions || "",
    },
  });
}

export async function professionalUpdateTaskStatus(params: {
  module: RequestModule;
  businessId: string;
  requestId?: number;
  status: "In Progress" | "Completed";
}): Promise<void> {
  const requestId = await resolveRequestDbId(
    params.module,
    params.businessId,
    params.requestId,
  );
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
    body: { status: params.status },
  });
}
