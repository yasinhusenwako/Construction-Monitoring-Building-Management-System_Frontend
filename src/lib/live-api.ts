import { apiRequest } from "@/lib/api";
import {
  mapStatusFromBackend,
  mapRoleFromBackend,
  BackendRole,
} from "@/lib/mappings";
import type {
  Booking,
  Maintenance,
  Notification,
  Project,
  UserRole,
} from "@/types/models";

type BackendStatus = string;

interface BackendProject {
  id: number;
  projectId: string;
  title: string;
  description?: string;
  classification?: string;
  status: BackendStatus;
  requestedBy: number;
  assignedSupervisorId?: number | null;
  assignedProfessionalId?: number | null;
  location?: string;
  budget?: number;
  startDate?: string;
  endDate?: string;
  createdAt?: string;
  materialCost?: number;
  laborCost?: number;
  totalCost?: number;
  partsUsed?: string;
  department?: string;
  contactPerson?: string;
  phone?: string;
  siteCondition?: string;
  scope?: any;
  divisionId?: number | null;
  createdBy: number;
  linkedProjectId?: string; // For A5/A6 existing project references
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
  layout?: string;     // space name (B2) or preferred location (B1)
  amenities?: string;  // may be structured JSON or plain text
  materialCost?: number;
  laborCost?: number;
  totalCost?: number;
  partsUsed?: string;
}

interface BackendMaintenance {
  id: number;
  maintenanceId: string;
  title?: string;      // user-typed request title
  category: string;    // category (e.g. "Electrical Issue")
  description: string;
  status: BackendStatus;
  priority?: string;
  createdBy: number;
  assignedSupervisorId?: number | null;
  assignedProfessionalId?: number | null;
  divisionId?: number | null;
  location?: string;
  building?: string;   // location compound part
  floor?: string;      // floor selection
  roomArea?: string;   // room/area description
  block?: string;      // block selection
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
  filterProjectId?: string,
): Promise<Project[]> {
  const url = filterProjectId
    ? `/api/projects?projectId=${filterProjectId}`
    : "/api/projects";
  const list = await apiRequest<BackendProject[]>(url);
  
  // Fetch timeline for each project
  const projectsWithTimeline = await Promise.all(
    list.map(async (item) => {
      const businessId = item.projectId || `PRJ-${item.id}`;
      cacheRequestDbId("PROJECT", businessId, item.id);
      
      // Extract linkedProjectId from scope if it exists
      let linkedProjectId = item.linkedProjectId;
      if (!linkedProjectId && item.scope) {
        const scope = typeof item.scope === 'string' ? 
          (() => { try { return JSON.parse(item.scope); } catch { return {}; } })() : 
          item.scope;
        linkedProjectId = scope.linkedProjectId;
      }
      
      // Fetch timeline from history endpoint
      let timeline: any[] = [];
      try {
        const history = await apiRequest<any[]>(`/api/history/PROJECT/${item.id}`);
        timeline = history.map((h) => ({
          id: `EV-${h.id}`,
          action: h.action || h.status || "Status Updated",
          actor: h.actorName || "System",
          timestamp: h.createdAt,
          note: h.note || "",
        }));
      } catch (error) {
        console.error(`Failed to fetch timeline for ${businessId}:`, error);
      }
      
      return {
        id: businessId,
        dbId: item.id,
        title: item.title,
        description: item.description || "",
        category: "Capital Project",
        classification: item.classification || "General",
        status: mapStatusFromBackend(item.status) as Project["status"],
        requestedBy: userId(item.createdBy),
        supervisorId: item.assignedSupervisorId
          ? userId(item.assignedSupervisorId)
          : undefined,
        assignedTo: item.assignedProfessionalId
          ? userId(item.assignedProfessionalId)
          : undefined,
        location: item.location || "N/A",
        budget: Number(item.budget || 0),
        startDate: item.startDate || "",
        endDate: item.endDate || "",
        createdAt: toIsoDate(item.createdAt),
        updatedAt: toIsoDate(item.createdAt),
        documents: [],
        timeline,
        materialCost: item.materialCost,
        laborCost: item.laborCost,
        totalCost: item.totalCost,
        partsUsed: item.partsUsed,
        department: item.department,
        contactPerson: item.contactPerson,
        contactPhone: item.phone,
        siteCondition: item.siteCondition,
        linkedProjectId,
        scope: (function() {
          if (typeof item.scope === 'string') {
            try { return JSON.parse(item.scope); } catch (e) { return item.scope; }
          }
          return item.scope;
        })(),
        divisionId: item.divisionId ? `DIV-${String(item.divisionId).padStart(3, "0")}` : undefined,
      };
    })
  );
  
  return projectsWithTimeline;
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

    // Parse structured amenities JSON (stored by NewBookingPage for full field recovery)
    let parsed: Record<string, any> = {};
    const rawAmenities = item.amenities || "";
    try {
      if (rawAmenities.trim().startsWith("{")) {
        parsed = JSON.parse(rawAmenities);
      }
    } catch { /* not JSON — legacy plain-text, keep as-is */ }

    const bookingSubType: string = parsed._bookingType || "";
    const isOffice = item.type?.toUpperCase() === "OFFICE";

    // Derive title
    let title = item.layout || "Booking";
    if (bookingSubType === "B1") {
      title = `Office Allocation - ${parsed.department || ""}`.trim().replace(/- $/, "");
    } else if (bookingSubType === "B2") {
      title = parsed.title || item.layout || "Hall Booking";
    }

    // Derive space (physical room/location)
    const space = item.layout || "N/A";

    // Derive purpose
    let purpose = "N/A";
    if (bookingSubType === "B1") {
      purpose = parsed.reason || "Office Allocation";
    } else if (bookingSubType === "B2") {
      purpose = parsed.purpose || item.layout || "N/A";
    } else {
      purpose = isOffice ? "Office Allocation" : (item.layout || "N/A");
    }

    // Derive requirements (plain text for display)
    let requirements = rawAmenities;
    if (bookingSubType === "B1") {
      requirements = parsed.specialReqs || "";
    } else if (bookingSubType === "B2") {
      const ams = parsed.amenities;
      requirements = Array.isArray(ams) ? ams.join(", ") : (typeof ams === "string" ? ams : rawAmenities);
    }

    // End time (B2 stores it in parsed JSON; B1 defaults to same)
    const startTime = dt.toISOString().slice(11, 16);
    const endTime = parsed.endTime || startTime;

    return {
      id: businessId,
      dbId: item.id,
      title,
      space,
      type: parseBookingType(item.type),
      status: mapStatusFromBackend(item.status) as Booking["status"],
      requestedBy: userId(item.requester),
      supervisorId: item.assignedSupervisorId
        ? userId(item.assignedSupervisorId)
        : undefined,
      assignedTo: item.assignedProfessionalId
        ? userId(item.assignedProfessionalId)
        : undefined,
      date: dt.toISOString().slice(0, 10),
      startTime,
      endTime,
      attendees: Number(item.capacity || 0),
      purpose,
      requirements,
      // Extended B1 fields
      department: parsed.department,
      contactPerson: parsed.contactName,
      contactPhone: parsed.contactPhone,
      officeType: parsed.officeType,
      notes: parsed.notes,
      seniorStaff: parsed.seniorStaff,
      supportStaff: parsed.supportStaff,
      // Extended B2 fields
      roomLayout: parsed.roomLayout,
      createdAt: toIsoDate(item.dateTime),
      updatedAt: toIsoDate(item.dateTime),
      materialCost: item.materialCost,
      laborCost: item.laborCost,
      totalCost: item.totalCost,
      partsUsed: item.partsUsed,
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
  
  // Fetch timeline for each maintenance request
  const maintenanceWithTimeline = await Promise.all(
    list.map(async (item) => {
      const businessId = item.maintenanceId || `MNT-${item.id}`;
      cacheRequestDbId("MAINTENANCE", businessId, item.id);
      const loc = splitLocation(item.location);
      const building = item.building || loc.building;
      const floor    = item.floor    || loc.floor;
      const roomArea = item.roomArea;
      
      // Fetch timeline from history endpoint
      let timeline: any[] = [];
      try {
        const history = await apiRequest<any[]>(`/api/history/MAINTENANCE/${item.id}`);
        timeline = history.map((h) => ({
          id: `EV-${h.id}`,
          action: h.action || h.status || "Status Updated",
          actor: h.actorName || "System",
          timestamp: h.createdAt,
          note: h.note || "",
        }));
      } catch (error) {
        console.error(`Failed to fetch timeline for ${businessId}:`, error);
      }
      
      return {
        id: businessId,
        dbId: item.id,
        title: item.title || item.category || "Maintenance Request",
        description: item.description || "",
        type: (item.category as Maintenance["type"]) || "General",
        subType: item.category,
        status: mapStatusFromBackend(item.status) as Maintenance["status"],
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
        building,
        floor,
        roomArea,
        createdAt: toIsoDate(item.createdAt),
        updatedAt: toIsoDate(item.createdAt),
        notes: "",
        attachments: [],
        timeline,
        materialCost: item.materialCost,
        laborCost: item.laborCost,
        totalCost: item.totalCost,
        partsUsed: item.partsUsed,
      };
    })
  );
  
  return maintenanceWithTimeline;
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
       createdBy: number;
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
    const frontendRole = mapRoleFromBackend(item.role);
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

export async function updateProject(projectId: string, updates: any): Promise<void> {
  const dbId = await resolveRequestDbId("PROJECT", projectId);
  if (!dbId) throw new Error("Could not resolve project ID");
  
  await apiRequest(`/api/projects/${dbId}`, {
    method: "PATCH",
    body: {
      projectId: updates.id,
      title: updates.title,
      description: updates.description,
      classification: updates.classification,
      location: updates.location,
      budget: updates.budget,
      startDate: updates.startDate,
      endDate: updates.endDate,
      department: updates.department,
      contactPerson: updates.contactPerson,
      phone: updates.contactPhone || updates.phone,
      siteCondition: updates.siteCondition,
      scope: updates.scope,
      priority: updates.priority || "Medium",
      status: updates.status || "Submitted",
      divisionId: updates.divisionId ? (typeof updates.divisionId === 'string' ? Number(updates.divisionId.split("-")[1]) : updates.divisionId) : undefined,
    },
  });
}

export async function updateBooking(bookingId: string, updates: Partial<Booking>): Promise<void> {
  const dbId = await resolveRequestDbId("BOOKING", bookingId);
  if (!dbId) throw new Error("Could not resolve booking ID");
  
  await apiRequest(`/api/bookings/${dbId}`, {
    method: "PATCH",
    body: {
      type: updates.type?.toUpperCase(),
      dateTime: updates.date && updates.startTime ? `${updates.date}T${updates.startTime}:00` : undefined,
      capacity: updates.attendees,
      layout: updates.space,
      amenities: updates.requirements,
    },
  });
}

export async function updateMaintenance(maintenanceId: string, updates: Partial<Maintenance>): Promise<void> {
  const dbId = await resolveRequestDbId("MAINTENANCE", maintenanceId);
  if (!dbId) throw new Error("Could not resolve maintenance ID");
  
  await apiRequest(`/api/maintenance/${dbId}`, {
    method: "PATCH",
    body: {
      category: (updates as any).category || updates.type,
      description: updates.description,
      priority: updates.priority,
      location: updates.location,
    },
  });
}

// ─── Preventive Maintenance Schedules ───────────────────────────────────────

export interface PreventiveSchedule {
  id: number;
  scheduleId: string;
  system: string;
  frequency: string;
  lastDone: string;
  nextDue: string;
  status: string;
  assignee: string;
  assignedProfessionalId: number;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export async function fetchPreventiveSchedules(): Promise<PreventiveSchedule[]> {
  return apiRequest<PreventiveSchedule[]>("/api/preventive-schedules");
}

export async function createPreventiveSchedule(data: {
  system: string;
  frequency: string;
  lastDone: string;
  nextDue: string;
  assignedProfessionalId: number;
  notes?: string;
}): Promise<PreventiveSchedule> {
  return apiRequest<PreventiveSchedule>("/api/preventive-schedules", {
    method: "POST",
    body: data,
  });
}

export async function updatePreventiveSchedule(
  id: number,
  data: Partial<{
    system: string;
    frequency: string;
    lastDone: string;
    nextDue: string;
    assignedProfessionalId: number;
    notes: string;
  }>
): Promise<PreventiveSchedule> {
  return apiRequest<PreventiveSchedule>(`/api/preventive-schedules/${id}`, {
    method: "PATCH",
    body: data,
  });
}

export async function deletePreventiveSchedule(id: number): Promise<void> {
  await apiRequest(`/api/preventive-schedules/${id}`, {
    method: "DELETE",
  });
}

export async function markScheduleCompleted(id: number): Promise<PreventiveSchedule> {
  return apiRequest<PreventiveSchedule>(`/api/preventive-schedules/${id}/complete`, {
    method: "POST",
  });
}
