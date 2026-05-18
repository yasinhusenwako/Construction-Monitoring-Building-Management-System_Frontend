// Multi-Professional Project Assignment API Client
import { apiRequest } from './api';

export interface ProjectAssignment {
  id: number;
  projectId: number;
  professionalId: string;
  instructions: string;
  createdAt: string;
  createdBy: string;
  status: string;
}

export interface BookingAssignment {
  id: number;
  bookingId: number;
  professionalId: string;
  instructions: string;
  createdAt: string;
  createdBy: string;
  status: string;
}

export interface ProfessionalReport {
  id: number;
  assignmentId: number;
  reportText: string;
  createdAt: string;
  createdBy: string;
  viewed: boolean;
}

// ===== ADMIN ENDPOINTS =====

/**
 * Assign a professional to a project with specific instructions
 */
export async function assignProfessionalToProject(
  projectId: number,
  professionalId: string,
  instructions: string
): Promise<ProjectAssignment> {
  return apiRequest(`/api/admin/projects/${projectId}/assign-professional`, {
    method: 'POST',
    body: {
      professionalId,
      instructions,
    },
  });
}

/**
 * Get all assignments for a specific project
 */
export async function getProjectAssignments(
  projectId: number
): Promise<ProjectAssignment[]> {
  return apiRequest(`/api/admin/projects/${projectId}/assignments`, {
    method: 'GET',
  });
}

/**
 * Get all reports for a specific project (all professionals)
 */
export async function getProjectReports(
  projectId: number
): Promise<ProfessionalReport[]> {
  return apiRequest(`/api/admin/projects/${projectId}/reports`, {
    method: 'GET',
  });
}

/**
 * Get all reports submitted by a specific professional
 */
export async function getProfessionalReports(
  professionalId: string
): Promise<ProfessionalReport[]> {
  return apiRequest(
    `/api/admin/projects/professional/${professionalId}/reports`,
    {
      method: 'GET',
    }
  );
}

/**
 * Get all reports for a specific assignment
 */
export async function getAssignmentReports(
  assignmentId: number
): Promise<ProfessionalReport[]> {
  return apiRequest(
    `/api/admin/projects/assignments/${assignmentId}/reports`,
    {
      method: 'GET',
    }
  );
}

/**
 * Mark all reports for an assignment as read
 */
export async function markReportsAsRead(
  assignmentId: number
): Promise<{ message: string }> {
  return apiRequest(
    `/api/admin/projects/assignments/${assignmentId}/read`,
    {
      method: 'PATCH',
    }
  );
}

/**
 * Deactivate an assignment
 */
export async function deactivateAssignment(
  assignmentId: number
): Promise<{ message: string }> {
  return apiRequest(
    `/api/admin/projects/assignments/${assignmentId}`,
    {
      method: 'DELETE',
    }
  );
}

// ===== PROFESSIONAL ENDPOINTS =====

/**
 * Get all assigned projects for current professional
 */
export async function getMyAssignments(): Promise<ProjectAssignment[]> {
  return apiRequest('/api/professional/projects/my-assignments', {
    method: 'GET',
  });
}

/**
 * Get specific assignment details
 */
export async function getAssignmentDetails(
  assignmentId: number
): Promise<ProjectAssignment> {
  return apiRequest(
    `/api/professional/projects/assignments/${assignmentId}`,
    {
      method: 'GET',
    }
  );
}

/**
 * Submit a daily/periodic report
 */
export async function submitProfessionalReport(
  assignmentId: number,
  reportText: string
): Promise<ProfessionalReport> {
  return apiRequest(
    `/api/professional/projects/assignments/${assignmentId}/report`,
    {
      method: 'POST',
      body: {
        assignmentId,
        reportText,
      },
    }
  );
}

/**
 * Get all reports for a specific assignment (professional can only see own)
 */
export async function getMyAssignmentReports(
  assignmentId: number
): Promise<ProfessionalReport[]> {
  return apiRequest(
    `/api/professional/projects/assignments/${assignmentId}/my-reports`,
    {
      method: 'GET',
    }
  );
}

/**
 * Mark an assignment as started (by professional)
 */
export async function startAssignment(
  assignmentId: number
): Promise<void> {
  await apiRequest(
    `/api/professional/projects/assignments/${assignmentId}/start`,
    {
      method: 'PATCH',
    }
  );
}

/**
 * Mark an assignment as completed (by professional)
 */
export async function completeAssignment(
  assignmentId: number
): Promise<void> {
  await apiRequest(
    `/api/professional/projects/assignments/${assignmentId}/complete`,
    {
      method: 'PATCH',
    }
  );
}

/**
 * Request clarification for a completed assignment (by admin)
 */
export async function requestClarification(
  assignmentId: number
): Promise<void> {
  await apiRequest(
    `/api/admin/projects/assignments/${assignmentId}/clarify`,
    {
      method: 'PATCH',
    }
  );
}

/**
 * Approve an assignment (by admin)
 */
export async function approveAssignment(
  assignmentId: number
): Promise<void> {
  await apiRequest(
    `/api/admin/projects/assignments/${assignmentId}/approve`,
    {
      method: 'PATCH',
    }
  );
}

/**
 * Reject an assignment (by admin)
 */
export async function rejectAssignment(
  assignmentId: number
): Promise<void> {
  await apiRequest(
    `/api/admin/projects/assignments/${assignmentId}/reject`,
    {
      method: 'PATCH',
    }
  );
}

// ===== BOOKING ENDPOINTS (MULTI-PROFESSIONAL) =====

/**
 * Assign a professional to a booking with specific instructions
 */
export async function assignProfessionalToBooking(
  bookingId: number,
  professionalId: string,
  instructions: string
): Promise<BookingAssignment> {
  return apiRequest(`/api/admin/bookings/${bookingId}/assign-professional`, {
    method: 'POST',
    body: {
      professionalId,
      instructions,
    },
  });
}

/**
 * Get all assignments for a specific booking
 */
export async function getBookingAssignments(
  bookingId: number
): Promise<BookingAssignment[]> {
  return apiRequest(`/api/admin/bookings/${bookingId}/assignments`, {
    method: 'GET',
  });
}

/**
 * Get all reports for a specific booking (all professionals)
 */
export async function getBookingReports(
  bookingId: number
): Promise<ProfessionalReport[]> {
  return apiRequest(`/api/admin/bookings/${bookingId}/reports`, {
    method: 'GET',
  });
}

/**
 * Get all reports submitted by a specific professional for bookings
 */
export async function getBookingProfessionalReports(
  professionalId: string
): Promise<ProfessionalReport[]> {
  return apiRequest(
    `/api/admin/bookings/professional/${professionalId}/reports`,
    {
      method: 'GET',
    }
  );
}

/**
 * Get all reports for a specific booking assignment
 */
export async function getBookingAssignmentReports(
  assignmentId: number
): Promise<ProfessionalReport[]> {
  return apiRequest(
    `/api/admin/bookings/assignments/${assignmentId}/reports`,
    {
      method: 'GET',
    }
  );
}

/**
 * Mark all reports for a booking assignment as read
 */
export async function markBookingReportsAsRead(
  assignmentId: number
): Promise<{ message: string }> {
  return apiRequest(
    `/api/admin/bookings/assignments/${assignmentId}/read`,
    {
      method: 'PATCH',
    }
  );
}

/**
 * Deactivate a booking assignment
 */
export async function deactivateBookingAssignment(
  assignmentId: number
): Promise<{ message: string }> {
  return apiRequest(
    `/api/admin/bookings/assignments/${assignmentId}`,
    {
      method: 'DELETE',
    }
  );
}

// ===== BOOKING PROFESSIONAL ENDPOINTS =====

/**
 * Get all my booking assignments (professional)
 */
export async function getMyBookingAssignments(): Promise<BookingAssignment[]> {
  return apiRequest(`/api/professional/bookings/my-assignments`, {
    method: 'GET',
  });
}

/**
 * Get booking assignment details (professional)
 */
export async function getBookingAssignmentDetails(
  assignmentId: number
): Promise<BookingAssignment> {
  return apiRequest(`/api/professional/bookings/assignments/${assignmentId}`, {
    method: 'GET',
  });
}

/**
 * Submit a report for a booking assignment (professional)
 */
export async function submitBookingReport(
  assignmentId: number,
  reportText: string
): Promise<ProfessionalReport> {
  return apiRequest(
    `/api/professional/bookings/assignments/${assignmentId}/report`,
    {
      method: 'POST',
      body: {
        assignmentId,
        reportText,
      },
    }
  );
}

/**
 * Get all reports for a specific booking assignment (professional can only see own)
 */
export async function getMyBookingAssignmentReports(
  assignmentId: number
): Promise<ProfessionalReport[]> {
  return apiRequest(
    `/api/professional/bookings/assignments/${assignmentId}/my-reports`,
    {
      method: 'GET',
    }
  );
}

/**
 * Mark a booking assignment as started (by professional)
 */
export async function startBookingAssignment(
  assignmentId: number
): Promise<void> {
  await apiRequest(
    `/api/professional/bookings/assignments/${assignmentId}/start`,
    {
      method: 'PATCH',
    }
  );
}

/**
 * Mark a booking assignment as completed (by professional)
 */
export async function completeBookingAssignment(
  assignmentId: number
): Promise<void> {
  await apiRequest(
    `/api/professional/bookings/assignments/${assignmentId}/complete`,
    {
      method: 'PATCH',
    }
  );
}
