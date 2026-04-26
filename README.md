# INSA BuildMS — Construction Supervision & Building Management System

A comprehensive, modern, and scalable building management system for the Information Network Security Agency (INSA) of Ethiopia. Built with Next.js 15 (App Router), TypeScript, Tailwind CSS, and shadcn/ui.

## 🎨 Design System

**INSA Logo Color Palette:**

- **Deep Navy** `#0E2271` - Primary (from logo shield)
- **Shield Blue** `#1A3580` - Secondary (from shield highlights)
- **Lens Red** `#CC1F1A` - Alerts & Critical (from logo lens)
- **Circuit Gold** `#F5B800` - Accents & Success (from circuit pattern)
- **Purple** `#7C3AED` - Division Supervisor & Space Bookings

**Dark Mode Support:**

- 🌓 Full dark mode implementation with smooth transitions
- Three theme options: Light, Dark, and System (follows OS preference)
- Optimized INSA color palette for both light and dark themes
- Theme preference persisted to localStorage
- Theme toggle available on login page and in app header

## 🏗️ Three Operational Modules

### 1. Capital Projects & Design/Costing

- Submit, review, and track capital project requests
- Budget allocation and cost tracking
- Status flow: Pending → In Review → Approved/Rejected → In Progress → Completed
- Priority levels: Critical, High, Medium, Low

### 2. Space Allocation & Booking

- Book conference halls, training rooms, labs, and offices
- Real-time space availability
- Admin can Add/Edit/Delete spaces
- Status flow: Pending → Tentative/Confirmed/Rejected → Cancelled

### 3. Urgent Repairs & HVAC Maintenance

- Report and track HVAC, Electrical, Plumbing, Structural repairs
- Division-based assignment to Supervisors and Professionals
- Status flow: New → Assigned → Under Repair → Repaired → Closed
- SLA compliance tracking

## 👥 Role-Based Access Control (RBAC)

### 🛡️ Administration (Controller)

- ✅ View ALL requests across all modules
- ✅ Review & verify submissions
- ✅ Classify requests (Project / Booking / Maintenance)
- ✅ Assign to Division Supervisor
- ✅ Set priority levels
- ✅ Approve / Reject completion
- ✅ Close requests
- ✅ User management (create, edit, deactivate users)
- ✅ System configuration (SLA rules, priorities, workflows)
- ✅ Advanced analytics & reporting
- ❌ **CANNOT** submit new project/booking/maintenance requests

### 👤 User (Requester)

- ✅ Submit capital project requests
- ✅ Book spaces (offices, conference halls, labs)
- ✅ Report maintenance issues
- ✅ Track own submissions & bookings
- ✅ View completion status
- ❌ Cannot approve/reject or manage other users
- ❌ Cannot interact with Supervisor or Professionals directly

### 👷 Division Supervisor

- ✅ View assigned requests from Administration (division-specific)
- ✅ Assign tasks to Professionals within their division
- ✅ Monitor execution progress
- ✅ Review completed tasks
- ✅ Submit completion report to Administration
- ❌ Cannot close requests (only Admin can close)
- ❌ Cannot access other divisions' tasks

### 🔧 Professionals

- ✅ View assigned tasks ONLY
- ✅ Update progress status
- ✅ Upload proof (images/files)
- ✅ Mark task as completed
- ❌ No access to admin or user data
- ❌ Can only work on tasks from their assigned division

## 🏛️ Division Structure

### 1️⃣ Power Supply Division (DIV-001)

Handles: Elevator Maintenance, Generators, UPS, Air Conditioning, Lifts, Water Distillers

### 2️⃣ Facility Administration Division (DIV-002)

Handles: Cleaning Services, Gardening & Landscaping, Compound Maintenance, Furniture & Asset Movement

### 3️⃣ Infrastructure Development & Building Maintenance Division (DIV-003)

Handles: Building Construction, Water & Sewerage, Electrical Systems, Carpentry & Woodwork, Furniture Manufacturing

## 🚀 Demo Credentials

| Role                    | Email                    | Password      |
| ----------------------- | ------------------------ | ------------- |
| **Administration**      | `admin@insa.gov.et`      | `password123` |
| **User**                | `user@insa.gov.et`       | `password123` |
| **Division Supervisor** | `supervisor@insa.gov.et` | `password123` |
| **Professional**        | `tech@insa.gov.et`       | `password123` |

## 🛠️ Technology Stack

- **Frontend Framework:** Next.js 15 (App Router) with TypeScript
- **Backend:** Spring Boot (Java) at `http://127.0.0.1:8080/api`
- **Styling:** Tailwind CSS with custom INSA theme
- **UI Components:** shadcn/ui + Radix UI primitives
- **State Management:** Context API (AuthContext, ThemeContext, LanguageContext)
- **Theme Management:** next-themes for dark mode support
- **Charts & Analytics:** Recharts
- **Icons:** Lucide React
- **Notifications:** Sonner
- **Form Handling:** React Hook Form
- **Date Picker:** react-day-picker with INSA styling
- **Authentication:** JWT-based with Spring Boot backend

## 📁 Project Structure

```
/src
  /app                  # Next.js App Router pages
    /admin              # Admin pages (users, config, requests, divisions)
    /api                # API proxy routes to Spring Boot backend
    /dashboard          # Dashboard pages (role-based)
    /login              # Login page
    /register           # Register page
    /forgot-password    # Password reset page
  /components
    /auth               # ProtectedRoute wrapper
    /common             # StatusBadge, DatePicker, ThemeToggle, LanguageToggle
    /dashboard          # DashboardWidgets
    /layout             # AppLayout (sidebar, header, navigation)
    /ui                 # shadcn/ui components (button, card, dialog, etc.)
  /context              # AuthContext, ThemeContext, LanguageContext
  /lib                  # API client, auth storage, workflow logic
  /locales              # i18n translations (en.json, am.json)
  /styles               # CSS files (fonts, theme, index)
  /types                # TypeScript type definitions
  /views                # Page components organized by feature
    /admin              # Admin view components
    /auth               # Auth view components
    /bookings           # Booking view components
    /dashboard          # Dashboard view components
    /maintenance        # Maintenance view components
    /notifications      # Notification view components
    /professional       # Professional view components
    /projects           # Project view components
    /reports            # Report view components
    /supervisor         # Supervisor view components
    /user               # User view components
```

## ✨ Key Features

### Security & Authentication

- JWT-based authentication with Spring Boot backend
- Protected routes with automatic login redirect
- RBAC enforcement at the route and component level
- Automatic token refresh and management

### User Experience

- Real-time notification system with unread count badges
- Comprehensive role-tailored dashboards
- Admin Master Control Layer with system-wide KPIs
- Responsive design (mobile, tablet, desktop)
- Collapsible sidebar navigation
- Search functionality across modules
- **Dark mode support** with light, dark, and system theme options
- **Bilingual support** (English and Amharic)
- Smooth theme transitions with INSA-optimized color palettes

### Admin Features

- **All User Requests Page:** Centralized view of every request across all three modules
- **User Management:** Create, edit, and deactivate users
- **Division Management:** Manage divisions and assign supervisors/professionals
- **System Configuration:** Manage SLA rules, priorities, and workflows
- **Advanced Analytics:** Charts, trends, and KPI tracking
- **Space Management:** Add/Edit/Delete spaces in Booking module

### Division-Based Workflow

- Automatic division suggestion based on request keywords
- Supervisors only see tasks from their assigned division
- Professionals can only be assigned within their division
- Strict hierarchical workflow: User → Admin → Supervisor → Professionals → Supervisor → Admin → User

## 🔄 Status Flows

### Projects

```
Pending → In Review → Approved/Rejected → In Progress → Completed
```

### Bookings

```
Pending → Tentative/Confirmed/Rejected → Cancelled
```

### Maintenance

```
New → Assigned (to Division) → Assigned (to Professional) → Under Repair → Repaired → Closed
```

## 📊 Analytics & Reporting

The Admin Reports page includes:

- Request volume trends across all modules
- Project status distribution (pie chart)
- Maintenance type breakdown
- SLA compliance metrics
- Professional workload & performance
- Cost tracking (planned vs actual)
- Space utilization rates
- Mean Time To Repair (MTTR) tracking
- Division performance metrics

## 🚦 Getting Started

### Prerequisites

- Node.js 18+ and npm
- Spring Boot backend running at `http://127.0.0.1:8080/api`

### Installation

1. Clone the repository
2. Install dependencies:

```bash
npm install
```

3. Create `.env.local`:

```bash
NEXT_PUBLIC_API_BASE_URL=http://127.0.0.1:8080
```

4. Run the development server:

```bash
npm run dev
```

5. Open [http://localhost:3000](http://localhost:3000)

### Build for Production

```bash
npm run build
npm start
```

## 📝 Backend Integration

The frontend is fully integrated with a Spring Boot backend:

- **API Client:** `src/lib/api.ts` - JWT authentication, token management, retry logic
- **Live API:** `src/lib/live-api.ts` - All CRUD operations for Projects, Bookings, Maintenance
- **Type Conversions:** Automatic conversion between Spring Boot and Frontend types
- **Status Normalization:** UPPERCASE_SNAKE_CASE → Title Case
- **ID Mapping:** Business IDs (PRJ-001) ↔ Database IDs (numbers)
- **File Upload:** `POST /api/files/upload` - Multipart file upload for attachments (requires backend implementation)

### File Upload Feature

The frontend includes a complete file upload system:

- **Component:** `FileUpload` - Drag & drop file upload with previews
- **Viewer:** `FileViewer` - Display and download attachments
- **API Route:** `/api/files/upload` - Proxies to backend at `http://127.0.0.1:8080/api/files/upload`
- **Supported Files:** Images, PDFs, Word, Excel documents (max 10MB per file)
- **Features:** Image previews, file size validation, drag & drop, multiple file support

**Backend Requirements:**
The backend should implement `POST /api/files/upload` endpoint that:
- Accepts `multipart/form-data` with `files[]` array
- Accepts `entityType` (e.g., "maintenance", "project", "booking")
- Accepts `entityId` (the business ID like "MNT-1234")
- Returns uploaded file metadata (URLs, IDs, etc.)
- Stores files and associates them with the entity

Currently, file names are stored in the `attachments` array even if upload fails, allowing the system to work without file storage.

See `BACKEND_INTEGRATION_STATUS.md` for complete integration details.

## 📚 Documentation

- `BACKEND_INTEGRATION_STATUS.md` - Complete backend integration documentation
- `IMPLEMENTATION_CHECKLIST.md` - Implementation checklist and priority matrix
- `SYSTEM_ANALYSIS_AND_RECOMMENDATIONS.md` - System analysis and recommendations
- `CONTRIBUTING.md` - Guidelines for contributing to the project

## 🔧 Recent Improvements

### File Upload System (April 2026)
- ✅ Complete end-to-end file upload implementation
- ✅ FileUpload component with drag & drop
- ✅ FileViewer component with preview and download
- ✅ Backend upload endpoint with validation
- ✅ Integration with Maintenance and Projects modules
- ✅ Secure file storage with UUID naming
- ✅ Comprehensive documentation

### Performance Enhancements
- ✅ Optimized React Query configuration with smart caching
- ✅ Added query key factory for better cache management
- ✅ Implemented custom hooks for data fetching with mutations
- ✅ Added performance monitoring utilities

### Developer Experience
- ✅ Error boundary for graceful error handling
- ✅ Loading states components (skeletons, loaders)
- ✅ Centralized constants file
- ✅ Enhanced error handling utilities
- ✅ React Query DevTools in development mode

### Code Quality
- ✅ TypeScript strict mode enabled
- ✅ Consistent error handling patterns
- ✅ Reusable custom hooks
- ✅ Better separation of concerns

---

**Built with ❤️ for INSA Ethiopia**
