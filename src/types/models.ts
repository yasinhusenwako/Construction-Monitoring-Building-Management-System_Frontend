import type { WorkflowStatus } from '@/lib/workflow';

export type UserRole = "admin" | "user" | "supervisor" | "professional";
export type DivisionType =
  | "power-supply"
  | "facility-admin"
  | "infrastructure-dev";

export interface Division {
  id: string;
  name: string;
  type: DivisionType;
  description: string;
  responsibilities: string[];
  keywords: string[];
}

export interface User {
  id: string;
  name: string;
  email: string;
  password: string;
  role: UserRole;
  department: string;
  divisionId?: string;
  profession?: string;
  phone: string;
  avatar: string;
  status: string;
  createdAt: string;
}

export interface TimelineEvent {
  id: string;
  action: string;
  actor: string;
  timestamp: string;
  note?: string;
}

export interface Project {
  id: string;
  dbId?: number;
  title: string;
  description: string;
  category: string;
  classification: string;
  status: WorkflowStatus;
  requestedBy: string;
  assignedTo?: string;
  supervisorId?: string;
  workOrderId?: string;
  location: string;
  block?: string;
  floor?: string;
  budget: number;
  startDate: string;
  endDate: string;
  department?: string;
  contactPerson?: string;
  contactPhone?: string;
  siteCondition?: string;
  requestMode?: string;
  linkedProjectId?: string;
  scope?: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
  divisionId?: string;
  assignedSupervisorId?: string;
  assignedProfessionalId?: string;
  documents: string[];
  timeline: TimelineEvent[];
  materialCost?: number;
  laborCost?: number;
  totalCost?: number;
  partsUsed?: string;
  rejectionReason?: string;
}

export interface Booking {
  id: string;
  dbId?: number;
  title: string;
  space: string;
  type: "Office" | "Conference Hall" | "Training Room" | "Lab";
  status: WorkflowStatus;
  requestedBy: string;
  supervisorId?: string;
  assignedTo?: string;
  workOrderId?: string;
  date: string;
  startTime: string;
  endTime: string;
  attendees: number;
  purpose: string;
  requirements: string;
  createdAt: string;
  updatedAt: string;
  // Extended intake-form fields (populated from structured amenities JSON)
  department?: string;       // B1: requesting department
  contactPerson?: string;    // B1: contact name
  contactPhone?: string;     // B1: contact phone
  officeType?: string;       // B1: office type preference
  notes?: string;            // B1: additional notes
  seniorStaff?: string;      // B1: senior staff count
  supportStaff?: string;     // B1: support staff count
  roomLayout?: string;       // B2: room arrangement (U-shape/Theater etc.)
  materialCost?: number;
  laborCost?: number;
  totalCost?: number;
  rejectionReason?: string;
  partsUsed?: string;
  timeline: TimelineEvent[];
}

export interface Maintenance {
  id: string;
  dbId?: number;
  title: string;
  description: string;
  type:
    | "HVAC"
    | "Electrical"
    | "Plumbing"
    | "Structural"
    | "General"
    | "Urgent Repair";
  subType?: string;
  status: WorkflowStatus;
  priority: "Low" | "Medium" | "High" | "Critical";
  requestedBy: string;
  assignedTo?: string;
  supervisorId?: string;
  divisionId?: string;
  workOrderId?: string;
  location: string;
  building?: string;
  floor: string;
  roomArea?: string;
  createdAt: string;
  updatedAt: string;
  resolvedAt?: string;
  notes: string;
  attachments: string[];
  files?: Array<{
    id: string;
    name: string;
    url?: string;
    size?: number;
    type?: string;
    uploadedAt?: string;
  }>;
  timeline: TimelineEvent[];
  materialCost?: number;
  laborCost?: number;
  totalCost?: number;
  partsUsed?: string;
  rejectionReason?: string;
  createdBy?: string;
}

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: "info" | "success" | "warning" | "error";
  read: boolean;
  userId: string;
  link: string;
  createdAt: string;
}

export type SpaceType = "Office" | "Conference Hall" | "Training Room" | "Lab";

export interface Space {
  id: string;
  name: string;
  type: SpaceType;
  capacity: number;
  floor: string;
  building: string;
  available: boolean;
}

// Static divisions data (not from backend — these are config/reference data)
export const divisions: Division[] = [
  {
    id: "1",
    name: "Power Supply Division",
    type: "power-supply",
    description: "Handles elevator, generators, UPS, AC, and water distillers",
    responsibilities: [
      "Elevator (Lift) Maintenance",
      "Generator Preventive Maintenance",
      "UPS Preventive Maintenance",
      "Air Conditioning (AC) Maintenance",
      "Lift Preventive Maintenance",
      "Water Distiller Maintenance",
    ],
    keywords: [
      "elevator", "lift", "generator", "ups", "ac",
      "air conditioning", "hvac", "distiller", "power",
    ],
  },
  {
    id: "2",
    name: "Facility Administration Division",
    type: "facility-admin",
    description: "Manages cleaning, landscaping, and furniture movement",
    responsibilities: [
      "Office Cleaning",
      "Restroom Cleaning",
      "Corridor Cleaning",
      "Indoor Area Cleaning",
      "Indoor Plant Maintenance",
      "Outdoor Gardening & Landscaping",
      "Compound Cleaning & Maintenance",
      "Furniture & Asset Movement",
      "Equipment Shifting",
    ],
    keywords: [
      "cleaning", "clean", "restroom", "office", "corridor",
      "garden", "landscaping", "plant", "compound", "furniture",
      "moving", "shifting",
    ],
  },
  {
    id: "3",
    name: "Infrastructure Development & Building Maintenance Division",
    type: "infrastructure-dev",
    description: "Handles construction, building maintenance, and infrastructure systems",
    responsibilities: [
      "Building Maintenance Work",
      "Building Construction Work",
      "Water System Installation & Maintenance",
      "Sewerage Installation & Maintenance",
      "Electrical System Installation & Maintenance",
      "Plumbing Works",
      "Road & Pavement Maintenance",
      "Structural Repairs",
    ],
    keywords: [
      "building", "construction", "infrastructure", "water", "sewerage",
      "electrical", "plumbing", "road", "structural", "civil",
    ],
  },
];
