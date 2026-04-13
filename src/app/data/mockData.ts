import type { WorkflowStatus } from "../lib/workflow";

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
  divisionId?: string; // For supervisors and professionals
  phone: string;
  avatar: string;
  status: "active" | "inactive" | "locked";
  createdAt: string;
}

export interface Project {
  id: string;
  title: string;
  description: string;
  category: string;
  classification: string;
  status: WorkflowStatus;
  priority: "Low" | "Medium" | "High" | "Critical";
  requestedBy: string;
  assignedTo?: string;
  supervisorId?: string;
  workOrderId?: string;
  location: string;
  budget: number;
  startDate: string;
  endDate: string;
  department?: string;
  contactPerson?: string;
  contactPhone?: string;
  siteCondition?: string;
  scope?: any;
  createdAt: string;
  updatedAt: string;
  documents: string[];
  timeline: TimelineEvent[];
}

export interface Booking {
  id: string;
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
}

export interface Maintenance {
  id: string;
  title: string;
  description: string;
  type:
    | "HVAC"
    | "Electrical"
    | "Plumbing"
    | "Structural"
    | "General"
    | "Urgent Repair";
  subType?: string; // Specific type like "Elevator", "AC", "Generator", "Cleaning", etc.
  status: WorkflowStatus;
  priority: "Low" | "Medium" | "High" | "Critical";
  requestedBy: string;
  assignedTo?: string;
  supervisorId?: string;
  divisionId?: string; // Division assigned by admin
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
  timeline: TimelineEvent[];
}

export interface TimelineEvent {
  id: string;
  action: string;
  actor: string;
  timestamp: string;
  note?: string;
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

// ═══════════════════════════════════════════════════════════════════════════
// DIVISIONS
// ═══════════════════════════════════════════════════════════════════════════
export const divisions: Division[] = [
  {
    id: "DIV-001",
    name: "Electromechanical Maintenance Division",
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
      "elevator",
      "lift",
      "generator",
      "ups",
      "ac",
      "air conditioning",
      "hvac",
      "distiller",
      "power",
      "electromechanical",
    ],
  },
  {
    id: "DIV-002",
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
      "cleaning",
      "clean",
      "restroom",
      "office",
      "corridor",
      "garden",
      "landscaping",
      "plant",
      "compound",
      "furniture",
      "moving",
      "shifting",
    ],
  },
  {
    id: "DIV-003",
    name: "Infrastructure Development & Building Maintenance Division",
    type: "infrastructure-dev",
    description:
      "Handles construction, building maintenance, and infrastructure systems",
    responsibilities: [
      "Building Maintenance Work",
      "Building Construction Work",
      "Water System Installation & Maintenance",
      "Sewerage Installation & Maintenance",
      "Electrical System Installation & Maintenance",
      "Carpentry & Woodwork",
      "Furniture Manufacturing",
    ],
    keywords: [
      "building",
      "construction",
      "water",
      "sewerage",
      "plumbing",
      "electrical",
      "wiring",
      "carpentry",
      "wood",
      "furniture",
      "manufacturing",
      "structural",
      "infrastructure",
    ],
  },
];

// Helper function to auto-suggest division based on request keywords
export function suggestDivision(
  title: string,
  description: string,
  type: string,
): string | null {
  const text = `${title} ${description} ${type}`.toLowerCase();

  for (const division of divisions) {
    for (const keyword of division.keywords) {
      if (text.includes(keyword.toLowerCase())) {
        return division.id;
      }
    }
  }

  return null;
}

// Helper function to get division by ID
export function getDivisionById(id: string): Division | undefined {
  return divisions.find((d) => d.id === id);
}

// Helper function to get supervisors by division
export function getSupervisorsByDivision(divisionId: string): User[] {
  return mockUsers.filter(
    (u) => u.role === "supervisor" && u.divisionId === divisionId,
  );
}

// Helper function to get professionals by division
export function getProfessionalsByDivision(divisionId: string): User[] {
  return mockUsers.filter(
    (u) => u.role === "professional" && u.divisionId === divisionId,
  );
}

// Mock Users
export const mockUsers: User[] = [
  {
    id: "USR-001",
    name: "Abebe Girma",
    email: "admin@insa.gov.et",
    password: "password123",
    role: "admin",
    department: "Infrastructure Management",
    phone: "+251 911 234 567",
    avatar: "AG",
    status: "active",
    createdAt: "2024-01-15",
  },
  {
    id: "USR-002",
    name: "Sara Bekele",
    email: "user@insa.gov.et",
    password: "password123",
    role: "user",
    department: "Network Operations",
    phone: "+251 922 345 678",
    avatar: "SB",
    status: "active",
    createdAt: "2024-02-20",
  },
  {
    id: "USR-003",
    name: "Tekle Haile",
    email: "tech@insa.gov.et",
    password: "password123",
    role: "professional",
    department: "Facilities & Maintenance",
    divisionId: "DIV-001", // Power Supply Division
    phone: "+251 933 456 789",
    avatar: "TH",
    status: "active",
    createdAt: "2024-03-10",
  },
  {
    id: "USR-004",
    name: "Meseret Alemu",
    email: "meseret@insa.gov.et",
    password: "password123",
    role: "user",
    department: "Cyber Security",
    phone: "+251 944 567 890",
    avatar: "MA",
    status: "active",
    createdAt: "2024-03-15",
  },
  {
    id: "USR-005",
    name: "Dawit Tadesse",
    email: "dawit@insa.gov.et",
    password: "password123",
    role: "professional",
    department: "Facilities & Maintenance",
    divisionId: "DIV-003", // Infrastructure Development Division
    phone: "+251 955 678 901",
    avatar: "DT",
    status: "active",
    createdAt: "2024-04-01",
  },
  {
    id: "USR-006",
    name: "Hanna Yohannes",
    email: "hanna@insa.gov.et",
    password: "password123",
    role: "user",
    department: "Digital Services",
    phone: "+251 966 789 012",
    avatar: "HY",
    status: "inactive",
    createdAt: "2024-04-10",
  },
  {
    id: "USR-007",
    name: "Biruk Lemma",
    email: "supervisor@insa.gov.et",
    password: "password123",
    role: "supervisor",
    department: "Division of Infrastructure",
    divisionId: "DIV-001", // Power Supply Division Supervisor
    phone: "+251 977 890 123",
    avatar: "BL",
    status: "active",
    createdAt: "2024-01-20",
  },
  {
    id: "USR-008",
    name: "Tigist Worku",
    email: "tigist@insa.gov.et",
    password: "password123",
    role: "supervisor",
    department: "Division of Facilities",
    divisionId: "DIV-002", // Facility Administration Division Supervisor
    phone: "+251 988 901 234",
    avatar: "TW",
    status: "active",
    createdAt: "2024-02-05",
  },
  {
    id: "USR-009",
    name: "Yonas Kebede",
    email: "yonas@insa.gov.et",
    password: "password123",
    role: "professional",
    department: "Facility Services",
    divisionId: "DIV-002", // Facility Administration Division
    phone: "+251 911 111 222",
    avatar: "YK",
    status: "active",
    createdAt: "2024-03-01",
  },
  {
    id: "USR-010",
    name: "Alemitu Desta",
    email: "alemitu@insa.gov.et",
    password: "password123",
    role: "supervisor",
    department: "Infrastructure Development",
    divisionId: "DIV-003", // Infrastructure Development Division Supervisor
    phone: "+251 922 222 333",
    avatar: "AD",
    status: "active",
    createdAt: "2024-01-25",
  },
  {
    id: "USR-011",
    name: "Solomon Tesfaye",
    email: "solomon@insa.gov.et",
    password: "password123",
    role: "professional",
    department: "Electrical Services",
    divisionId: "DIV-001", // Power Supply Division
    phone: "+251 933 333 444",
    avatar: "ST",
    status: "active",
    createdAt: "2024-03-15",
  },
  {
    id: "USR-012",
    name: "Rahel Assefa",
    email: "rahel@insa.gov.et",
    password: "password123",
    role: "professional",
    department: "Construction Services",
    divisionId: "DIV-003", // Infrastructure Development Division
    phone: "+251 944 444 555",
    avatar: "RA",
    status: "active",
    createdAt: "2024-03-20",
  },
];

// Mock Projects (Stream A)
export const mockProjects: Project[] = [
  {
    id: "PRJ-2024-001",
    title: "Headquarters Data Center Expansion",
    description:
      "Expansion of the main data center facility to accommodate new server infrastructure and improve redundancy.",
    category: "Capital Project",
    classification: "A1 - Capital Works",
    status: "In Progress",
    priority: "Critical",
    requestedBy: "USR-002",
    assignedTo: "USR-001",
    supervisorId: "USR-007",
    location: "HQ Building, Block A",
    budget: 12500000,
    startDate: "2024-03-01",
    endDate: "2024-12-31",
    createdAt: "2024-02-15",
    updatedAt: "2024-03-20",
    documents: ["data_center_blueprint.pdf", "cost_estimate.xlsx"],
    timeline: [
      {
        id: "T1",
        action: "Submitted",
        actor: "Sara Bekele",
        timestamp: "2024-02-15 09:00",
        note: "Initial project request submitted",
      },
      {
        id: "T2",
        action: "Under Review",
        actor: "Abebe Girma",
        timestamp: "2024-02-18 11:00",
        note: "Under technical review",
      },
      {
        id: "T3",
        action: "Approved",
        actor: "Abebe Girma",
        timestamp: "2024-02-25 14:00",
        note: "Approved with budget allocation",
      },
      {
        id: "T4",
        action: "In Progress",
        actor: "Abebe Girma",
        timestamp: "2024-03-01 08:00",
        note: "Construction commenced",
      },
    ],
  },
  {
    id: "PRJ-2024-002",
    title: "Network Operations Center Renovation",
    description:
      "Complete renovation of the NOC facility including new monitoring systems and ergonomic workstations.",
    category: "Design & Costing",
    classification: "A2 - Renovation",
    status: "Approved",
    priority: "High",
    requestedBy: "USR-004",
    assignedTo: "USR-001",
    location: "HQ Building, Block C, Floor 3",
    budget: 3200000,
    startDate: "2024-05-01",
    endDate: "2024-08-31",
    createdAt: "2024-03-10",
    updatedAt: "2024-04-05",
    documents: ["noc_design.pdf"],
    timeline: [
      {
        id: "T1",
        action: "Submitted",
        actor: "Meseret Alemu",
        timestamp: "2024-03-10 10:00",
      },
      {
        id: "T2",
        action: "Under Review",
        actor: "Abebe Girma",
        timestamp: "2024-03-15 09:00",
      },
      {
        id: "T3",
        action: "Approved",
        actor: "Abebe Girma",
        timestamp: "2024-04-05 16:00",
        note: "Approved. Start May 2024.",
      },
    ],
  },
  {
    id: "PRJ-2024-003",
    title: "Addis Ababa Regional Office Construction",
    description:
      "Construction of a new regional office in the Bole sub-city to expand INSA service coverage.",
    category: "Capital Project",
    classification: "A1 - Capital Works",
    status: "Submitted",
    priority: "High",
    requestedBy: "USR-002",
    location: "Bole Sub-City, Addis Ababa",
    budget: 45000000,
    startDate: "2024-09-01",
    endDate: "2026-06-30",
    createdAt: "2024-04-01",
    updatedAt: "2024-04-01",
    documents: ["site_survey.pdf", "preliminary_design.pdf"],
    timeline: [
      {
        id: "T1",
        action: "Submitted",
        actor: "Sara Bekele",
        timestamp: "2024-04-01 09:30",
        note: "New regional office request",
      },
    ],
  },
  {
    id: "PRJ-2024-004",
    title: "Solar Power Installation - Main Campus",
    description:
      "Installation of 500kW solar power system to reduce energy costs and ensure business continuity.",
    category: "Infrastructure",
    classification: "A3 - Infrastructure",
    status: "Under Review",
    priority: "Medium",
    requestedBy: "USR-004",
    location: "Main Campus Rooftop",
    budget: 8750000,
    startDate: "2024-07-01",
    endDate: "2024-11-30",
    createdAt: "2024-03-25",
    updatedAt: "2024-04-10",
    documents: ["solar_feasibility.pdf"],
    timeline: [
      {
        id: "T1",
        action: "Submitted",
        actor: "Meseret Alemu",
        timestamp: "2024-03-25 11:00",
      },
      {
        id: "T2",
        action: "Under Review",
        actor: "Abebe Girma",
        timestamp: "2024-04-10 10:00",
        note: "Technical evaluation in progress",
      },
    ],
  },
  {
    id: "PRJ-2024-005",
    title: "CCTV Surveillance System Upgrade",
    description:
      "Replacement of outdated analog CCTV with AI-enabled IP camera system across all facilities.",
    category: "Security",
    classification: "A4 - Security Works",
    status: "Completed",
    priority: "Critical",
    requestedBy: "USR-002",
    assignedTo: "USR-001",
    location: "All Buildings",
    budget: 5600000,
    startDate: "2024-01-15",
    endDate: "2024-03-15",
    createdAt: "2024-01-01",
    updatedAt: "2024-03-18",
    documents: ["cctv_specs.pdf", "completion_report.pdf"],
    timeline: [
      {
        id: "T1",
        action: "Submitted",
        actor: "Sara Bekele",
        timestamp: "2024-01-01 08:00",
      },
      {
        id: "T2",
        action: "Approved",
        actor: "Abebe Girma",
        timestamp: "2024-01-08 10:00",
      },
      {
        id: "T3",
        action: "In Progress",
        actor: "Abebe Girma",
        timestamp: "2024-01-15 08:00",
      },
      {
        id: "T4",
        action: "Completed",
        actor: "Abebe Girma",
        timestamp: "2024-03-18 17:00",
        note: "All 247 cameras installed and commissioned",
      },
    ],
  },
  {
    id: "PRJ-2024-006",
    title: "Staff Cafeteria Renovation",
    description:
      "Renovation and modernization of the staff cafeteria to improve working environment.",
    category: "Renovation",
    classification: "A2 - Renovation",
    status: "Rejected",
    priority: "Low",
    requestedBy: "USR-004",
    location: "Main Building, Ground Floor",
    budget: 1200000,
    startDate: "2024-06-01",
    endDate: "2024-08-31",
    createdAt: "2024-03-20",
    updatedAt: "2024-04-02",
    documents: [],
    timeline: [
      {
        id: "T1",
        action: "Submitted",
        actor: "Meseret Alemu",
        timestamp: "2024-03-20 14:00",
      },
      {
        id: "T2",
        action: "Rejected",
        actor: "Abebe Girma",
        timestamp: "2024-04-02 09:00",
        note: "Budget constraints - deferred to next fiscal year",
      },
    ],
  },
];

// Mock Bookings (Stream B)
export const mockBookings: Booking[] = [
  {
    id: "BKG-2024-001",
    title: "Quarterly Security Review Meeting",
    space: "Executive Conference Hall A",
    type: "Conference Hall",
    status: "Approved",
    requestedBy: "USR-002",
    date: "2024-04-25",
    startTime: "09:00",
    endTime: "13:00",
    attendees: 45,
    purpose:
      "Quarterly security threat assessment and strategic planning session",
    requirements: "Projector, Video conferencing, Whiteboard, Refreshments",
    createdAt: "2024-04-10",
    updatedAt: "2024-04-12",
  },
  {
    id: "BKG-2024-002",
    title: "Network Operations Training",
    space: "Training Room B",
    type: "Training Room",
    status: "Under Review",
    requestedBy: "USR-004",
    date: "2024-04-28",
    startTime: "08:00",
    endTime: "17:00",
    attendees: 20,
    purpose: "New staff onboarding - Network Operations fundamentals",
    requirements: "Projector, Laptops x20, Whiteboard",
    createdAt: "2024-04-11",
    updatedAt: "2024-04-13",
  },
  {
    id: "BKG-2024-003",
    title: "Board Meeting - Budget Approval",
    space: "Executive Conference Hall A",
    type: "Conference Hall",
    status: "Submitted",
    requestedBy: "USR-002",
    date: "2024-05-02",
    startTime: "10:00",
    endTime: "15:00",
    attendees: 12,
    purpose: "FY2025 budget review and approval",
    requirements: "Projector, High-speed internet, Recording equipment",
    createdAt: "2024-04-15",
    updatedAt: "2024-04-15",
  },
  {
    id: "BKG-2024-004",
    title: "Cyber Security Workshop",
    space: "Computer Lab 1",
    type: "Lab",
    status: "Approved",
    requestedBy: "USR-004",
    date: "2024-04-30",
    startTime: "08:30",
    endTime: "16:30",
    attendees: 30,
    purpose: "Ethical hacking and penetration testing hands-on workshop",
    requirements: "Computers x30, High-speed internet, Specialized software",
    createdAt: "2024-04-08",
    updatedAt: "2024-04-10",
  },
  {
    id: "BKG-2024-005",
    title: "All-Staff Annual Meeting",
    space: "Main Auditorium",
    type: "Conference Hall",
    status: "Approved",
    requestedBy: "USR-002",
    date: "2024-05-10",
    startTime: "09:00",
    endTime: "17:00",
    attendees: 250,
    purpose: "Annual performance review and strategic direction presentation",
    requirements: "PA System, Large screens, Stage setup, Catering",
    createdAt: "2024-04-01",
    updatedAt: "2024-04-05",
  },
  {
    id: "BKG-2024-006",
    title: "HR Department Meeting",
    space: "Meeting Room 205",
    type: "Office",
    status: "Rejected",
    requestedBy: "USR-004",
    date: "2024-04-20",
    startTime: "14:00",
    endTime: "16:00",
    attendees: 8,
    purpose: "Monthly HR policy review",
    requirements: "Projector",
    createdAt: "2024-04-14",
    updatedAt: "2024-04-15",
  },
];

// Mock Maintenance (Stream C)
export const mockMaintenance: Maintenance[] = [
  {
    id: "MNT-2024-001",
    title: "AC System Failure - Server Room B",
    description:
      "Complete AC failure in Server Room B causing temperature spikes. Critical to server operations.",
    type: "HVAC",
    subType: "Air Conditioning",
    status: "In Progress",
    priority: "Critical",
    requestedBy: "USR-002",
    assignedTo: "USR-003",
    supervisorId: "USR-007",
    divisionId: "DIV-001", // Power Supply Division
    location: "HQ Building, Block A",
    floor: "Basement",
    createdAt: "2024-04-18 08:30",
    updatedAt: "2024-04-18 10:00",
    notes: "Temperature exceeded 35°C. Emergency shutdown initiated.",
    attachments: ["ac_photo1.jpg"],
    timeline: [
      {
        id: "T1",
        action: "Submitted",
        actor: "Sara Bekele",
        timestamp: "2024-04-18 08:30",
        note: "Critical AC failure reported",
      },
      {
        id: "T2",
        action: "Under Review",
        actor: "Abebe Girma",
        timestamp: "2024-04-18 09:00",
        note: "Admin reviewing - URGENT",
      },
      {
        id: "T3",
        action: "Assigned to Supervisor",
        actor: "Abebe Girma",
        timestamp: "2024-04-18 09:30",
        note: "Assigned to Power Supply Division - Biruk Lemma (Supervisor)",
      },
      {
        id: "T4",
        action: "Assigned to Professional",
        actor: "Biruk Lemma",
        timestamp: "2024-04-18 09:45",
        note: "Assigned to Tekle Haile",
      },
      {
        id: "T5",
        action: "In Progress",
        actor: "Tekle Haile",
        timestamp: "2024-04-18 10:00",
        note: "On-site assessment complete. Parts ordered.",
      },
    ],
  },
  {
    id: "MNT-2024-002",
    title: "Electrical Short Circuit - Office 3B",
    description:
      "Electrical short circuit causing frequent power outages in Office 3B affecting 15 workstations.",
    type: "Electrical",
    subType: "Electrical Wiring",
    status: "Assigned to Professional",
    priority: "High",
    requestedBy: "USR-004",
    assignedTo: "USR-012",
    supervisorId: "USR-010",
    divisionId: "DIV-003", // Infrastructure Development Division
    location: "HQ Building, Block C",
    floor: "Floor 3",
    createdAt: "2024-04-17 14:00",
    updatedAt: "2024-04-17 16:00",
    notes: "Temporary power strips in use. Safety concern.",
    attachments: [],
    timeline: [
      {
        id: "T1",
        action: "Submitted",
        actor: "Meseret Alemu",
        timestamp: "2024-04-17 14:00",
      },
      {
        id: "T2",
        action: "Under Review",
        actor: "Abebe Girma",
        timestamp: "2024-04-17 15:00",
      },
      {
        id: "T3",
        action: "Assigned to Supervisor",
        actor: "Abebe Girma",
        timestamp: "2024-04-17 15:30",
        note: "Assigned to Infrastructure Division - Alemitu Desta",
      },
      {
        id: "T4",
        action: "Assigned to Professional",
        actor: "Alemitu Desta",
        timestamp: "2024-04-17 16:00",
        note: "Assigned to Rahel Assefa",
      },
    ],
  },
  {
    id: "MNT-2024-003",
    title: "Water Leak - Rooftop Level",
    description:
      "Water infiltration from rooftop after heavy rainfall affecting IT equipment storage area.",
    type: "Plumbing",
    subType: "Water System",
    status: "Reviewed",
    priority: "High",
    requestedBy: "USR-002",
    assignedTo: "USR-012",
    supervisorId: "USR-010",
    divisionId: "DIV-003", // Infrastructure Development Division
    location: "HQ Building",
    floor: "Rooftop",
    createdAt: "2024-04-10 07:00",
    updatedAt: "2024-04-15 14:00",
    resolvedAt: "2024-04-15",
    notes: "Waterproofing membrane replaced. Test completed.",
    attachments: ["leak_photo.jpg", "repair_proof.jpg"],
    timeline: [
      {
        id: "T1",
        action: "Submitted",
        actor: "Sara Bekele",
        timestamp: "2024-04-10 07:00",
      },
      {
        id: "T2",
        action: "Under Review",
        actor: "Abebe Girma",
        timestamp: "2024-04-10 08:00",
      },
      {
        id: "T3",
        action: "Assigned to Supervisor",
        actor: "Abebe Girma",
        timestamp: "2024-04-10 09:00",
        note: "Assigned to Infrastructure Division",
      },
      {
        id: "T4",
        action: "Assigned to Professional",
        actor: "Alemitu Desta",
        timestamp: "2024-04-10 10:00",
      },
      {
        id: "T5",
        action: "In Progress",
        actor: "Rahel Assefa",
        timestamp: "2024-04-11 08:00",
      },
      {
        id: "T6",
        action: "Completed",
        actor: "Rahel Assefa",
        timestamp: "2024-04-15 14:00",
        note: "Repair completed. Proof uploaded.",
      },
      {
        id: "T7",
        action: "Reviewed",
        actor: "Alemitu Desta",
        timestamp: "2024-04-15 16:00",
        note: "Supervisor verified completion. Submitted to Admin.",
      },
    ],
  },
  {
    id: "MNT-2024-004",
    title: "Elevator Malfunction - Tower A",
    description:
      "Elevator A1 stuck between floors 2 and 3. Maintenance required urgently.",
    type: "Structural",
    subType: "Elevator",
    status: "Closed",
    priority: "Critical",
    requestedBy: "USR-004",
    assignedTo: "USR-011",
    supervisorId: "USR-007",
    divisionId: "DIV-001", // Power Supply Division
    location: "Tower A",
    floor: "All Floors",
    createdAt: "2024-04-05 13:00",
    updatedAt: "2024-04-06 17:00",
    resolvedAt: "2024-04-06",
    notes: "External elevator company contracted. Issue resolved.",
    attachments: ["elevator_report.pdf"],
    timeline: [
      {
        id: "T1",
        action: "Submitted",
        actor: "Meseret Alemu",
        timestamp: "2024-04-05 13:00",
      },
      {
        id: "T2",
        action: "Under Review",
        actor: "Abebe Girma",
        timestamp: "2024-04-05 13:15",
      },
      {
        id: "T3",
        action: "Assigned to Supervisor",
        actor: "Abebe Girma",
        timestamp: "2024-04-05 13:20",
        note: "Assigned to Power Supply Division",
      },
      {
        id: "T4",
        action: "Assigned to Professional",
        actor: "Biruk Lemma",
        timestamp: "2024-04-05 13:30",
      },
      {
        id: "T5",
        action: "In Progress",
        actor: "Solomon Tesfaye",
        timestamp: "2024-04-05 14:00",
      },
      {
        id: "T6",
        action: "Completed",
        actor: "Solomon Tesfaye",
        timestamp: "2024-04-06 16:00",
      },
      {
        id: "T7",
        action: "Reviewed",
        actor: "Biruk Lemma",
        timestamp: "2024-04-06 16:30",
      },
      {
        id: "T8",
        action: "Approved",
        actor: "Abebe Girma",
        timestamp: "2024-04-06 17:00",
        note: "Issue verified resolved.",
      },
      {
        id: "T9",
        action: "Closed",
        actor: "Abebe Girma",
        timestamp: "2024-04-06 17:00",
        note: "Ticket closed.",
      },
    ],
  },
  {
    id: "MNT-2024-005",
    title: "AC Preventive Maintenance - Floor 2",
    description:
      "Routine preventive maintenance and filter replacement for all AC units on Floor 2.",
    type: "General",
    subType: "Preventive Maintenance",
    status: "Submitted",
    priority: "Low",
    requestedBy: "USR-002",
    location: "Main Building",
    floor: "Floor 2",
    createdAt: "2024-04-19 09:00",
    updatedAt: "2024-04-19 09:00",
    notes: "Scheduled preventive maintenance - service interval exceeded.",
    attachments: [],
    timeline: [
      {
        id: "T1",
        action: "Submitted",
        actor: "Sara Bekele",
        timestamp: "2024-04-19 09:00",
        note: "Routine preventive maintenance request",
      },
    ],
  },
  {
    id: "MNT-2024-006",
    title: "Office Partition Divider Installation - Block B",
    description:
      "Installation and reconfiguration of office dividers in the open-plan area of Block B ground floor.",
    type: "Urgent Repair",
    subType: "Furniture Movement",
    status: "Assigned to Supervisor",
    priority: "Medium",
    requestedBy: "USR-004",
    supervisorId: "USR-008",
    divisionId: "DIV-002", // Facility Administration Division
    location: "HQ Building, Block B",
    floor: "Ground Floor",
    createdAt: "2024-04-16 10:00",
    updatedAt: "2024-04-17 08:00",
    notes: "",
    attachments: [],
    timeline: [
      {
        id: "T1",
        action: "Submitted",
        actor: "Meseret Alemu",
        timestamp: "2024-04-16 10:00",
      },
      {
        id: "T2",
        action: "Under Review",
        actor: "Abebe Girma",
        timestamp: "2024-04-16 14:00",
      },
      {
        id: "T3",
        action: "Assigned to Supervisor",
        actor: "Abebe Girma",
        timestamp: "2024-04-17 08:00",
        note: "Assigned to Facility Administration Division - Tigist Worku",
      },
    ],
  },
];

// Mock Notifications
export const mockNotifications: Notification[] = [
  {
    id: "NOTIF-001",
    title: "Project Approved",
    message:
      'Your project "NOC Renovation" (PRJ-2024-002) has been approved by Admin.',
    type: "success",
    read: false,
    userId: "USR-004",
    link: "/projects/PRJ-2024-002",
    createdAt: "2024-04-05 16:00",
  },
  {
    id: "NOTIF-002",
    title: "New Maintenance Request",
    message:
      "Critical HVAC failure reported (MNT-2024-001). Assigned to Tekle Haile.",
    type: "error",
    read: false,
    userId: "USR-001",
    link: "/maintenance/MNT-2024-001",
    createdAt: "2024-04-18 09:00",
  },
  {
    id: "NOTIF-003",
    title: "Booking Approved",
    message:
      'Your booking for "Executive Conference Hall A" on Apr 25 has been approved.',
    type: "success",
    read: true,
    userId: "USR-002",
    link: "/bookings/BKG-2024-001",
    createdAt: "2024-04-12 10:00",
  },
  {
    id: "NOTIF-004",
    title: "Task Assigned",
    message:
      'New task assigned: "HVAC System Failure - Server Room B" (MNT-2024-001). Please respond urgently.',
    type: "warning",
    read: false,
    userId: "USR-003",
    link: "/maintenance/MNT-2024-001",
    createdAt: "2024-04-18 09:00",
  },
  {
    id: "NOTIF-005",
    title: "Maintenance Completed",
    message:
      "Maintenance ticket MNT-2024-003 has been marked as Completed. Please review.",
    type: "info",
    read: false,
    userId: "USR-001",
    link: "/maintenance/MNT-2024-003",
    createdAt: "2024-04-15 14:00",
  },
  {
    id: "NOTIF-006",
    title: "Project Rejected",
    message:
      'Your project request "Staff Cafeteria Renovation" has been rejected. Reason: Budget constraints.',
    type: "error",
    read: true,
    userId: "USR-004",
    link: "/projects/PRJ-2024-006",
    createdAt: "2024-04-02 09:00",
  },
  {
    id: "NOTIF-007",
    title: "Booking Under Review",
    message: "New booking request from Sara Bekele for May 2 is under review.",
    type: "info",
    read: true,
    userId: "USR-001",
    link: "/bookings/BKG-2024-003",
    createdAt: "2024-04-15 11:00",
  },
  {
    id: "NOTIF-008",
    title: "New Project Submitted",
    message:
      'New project request submitted: "Addis Ababa Regional Office" (PRJ-2024-003) requires your review.',
    type: "info",
    read: false,
    userId: "USR-001",
    link: "/projects/PRJ-2024-003",
    createdAt: "2024-04-01 09:30",
  },
];

export const spaces = [
  {
    id: "SP-001",
    name: "Executive Conference Hall A",
    capacity: 60,
    floor: "Floor 1",
    type: "Conference Hall",
    available: true,
  },
  {
    id: "SP-002",
    name: "Main Auditorium",
    capacity: 300,
    floor: "Ground Floor",
    type: "Conference Hall",
    available: true,
  },
  {
    id: "SP-003",
    name: "Training Room B",
    capacity: 25,
    floor: "Floor 2",
    type: "Training Room",
    available: false,
  },
  {
    id: "SP-004",
    name: "Computer Lab 1",
    capacity: 35,
    floor: "Floor 2",
    type: "Lab",
    available: true,
  },
  {
    id: "SP-005",
    name: "Meeting Room 205",
    capacity: 10,
    floor: "Floor 2",
    type: "Office",
    available: true,
  },
  {
    id: "SP-006",
    name: "Board Room",
    capacity: 15,
    floor: "Floor 5",
    type: "Conference Hall",
    available: false,
  },
  {
    id: "SP-007",
    name: "Computer Lab 2",
    capacity: 30,
    floor: "Floor 3",
    type: "Lab",
    available: true,
  },
  {
    id: "SP-008",
    name: "Meeting Room 310",
    capacity: 8,
    floor: "Floor 3",
    type: "Office",
    available: true,
  },
];

export const analyticsData = {
  requestVolume: [
    { month: "Jan", projects: 4, bookings: 12, maintenance: 8 },
    { month: "Feb", projects: 6, bookings: 18, maintenance: 10 },
    { month: "Mar", projects: 8, bookings: 22, maintenance: 15 },
    { month: "Apr", projects: 5, bookings: 15, maintenance: 12 },
    { month: "May", projects: 9, bookings: 25, maintenance: 7 },
    { month: "Jun", projects: 7, bookings: 20, maintenance: 9 },
  ],
  statusDistribution: [
    { name: "Completed", value: 35, color: "#16A34A" },
    { name: "In Progress", value: 28, color: "#2563EB" },
    { name: "Submitted", value: 20, color: "#F59E0B" },
    { name: "Rejected", value: 10, color: "#CC1F1A" },
    { name: "Under Review", value: 7, color: "#7C3AED" },
  ],
  mttr: [
    { month: "Jan", hours: 18 },
    { month: "Feb", hours: 14 },
    { month: "Mar", hours: 22 },
    { month: "Apr", hours: 10 },
    { month: "May", hours: 12 },
    { month: "Jun", hours: 8 },
  ],
  spaceUtilization: [
    { space: "Conf Hall A", utilization: 85 },
    { space: "Auditorium", utilization: 45 },
    { space: "Training B", utilization: 92 },
    { space: "Lab 1", utilization: 78 },
    { space: "Meeting 205", utilization: 60 },
    { space: "Board Room", utilization: 35 },
  ],
  costTracking: [
    { month: "Jan", planned: 2000000, actual: 1850000 },
    { month: "Feb", planned: 3500000, actual: 3200000 },
    { month: "Mar", planned: 4200000, actual: 4500000 },
    { month: "Apr", planned: 3800000, actual: 3750000 },
    { month: "May", planned: 5000000, actual: 4800000 },
    { month: "Jun", planned: 4500000, actual: 4200000 },
  ],
};
