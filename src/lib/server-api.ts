import { mockMaintenance, mockProjects, mockBookings } from '@/data/mockData';

// Mimic a database query wrapper with an artificial delay.
// Later, replace this with Prisma, Drizzle, or a direct Fetch call.
export async function getMaintenanceRecords() {
  // Artificial network delay
  await new Promise((resolve) => setTimeout(resolve, 300));

  // Later: return prisma.maintenance.findMany();
  return mockMaintenance;
}

export async function getProjectRecords() {
  await new Promise((resolve) => setTimeout(resolve, 300));
  return mockProjects;
}

export async function getBookingRecords() {
  await new Promise((resolve) => setTimeout(resolve, 300));
  return mockBookings;
}
