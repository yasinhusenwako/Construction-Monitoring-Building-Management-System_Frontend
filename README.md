# INSA BuildMS — Construction Monitoring & Building Management System

A role-based building management system for the Information Network Security Agency (INSA) of Ethiopia. Built with Next.js 15 (App Router), TypeScript, Tailwind CSS, and shadcn/ui.

## Demo Credentials

| Role                | Email                  | Password    |
| ------------------- | ---------------------- | ----------- |
| Admin               | admin@insa.gov.et      | password123 |
| User                | user@insa.gov.et       | password123 |
| Division Supervisor | supervisor@insa.gov.et | password123 |
| Professional        | tech@insa.gov.et       | password123 |

## Getting Started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## Routes

| Path                          | Description            |
| ----------------------------- | ---------------------- |
| `/login`                      | Login                  |
| `/register`                   | Register               |
| `/forgot-password`            | Password reset         |
| `/dashboard`                  | Dashboard (role-based) |
| `/dashboard/projects`         | Capital projects       |
| `/dashboard/projects/new`     | Submit project         |
| `/dashboard/projects/[id]`    | Project detail         |
| `/dashboard/bookings`         | Space bookings         |
| `/dashboard/bookings/new`     | New booking            |
| `/dashboard/maintenance`      | Maintenance tickets    |
| `/dashboard/maintenance/new`  | New ticket             |
| `/dashboard/maintenance/[id]` | Ticket detail          |
| `/dashboard/notifications`    | Notifications          |
| `/dashboard/reports`          | Reports & analytics    |
| `/admin/users`                | User management        |
| `/admin/config`               | System config          |
| `/admin/requests`             | All user requests      |

## Modules

**Capital Projects** — Submit, review, approve/reject project requests with budget tracking.

**Space Booking** — Book conference rooms, labs, offices. Admin manages spaces.

**Maintenance & Repairs** — Report HVAC, electrical, plumbing issues. Technicians update repair status.

## Stack

- Next.js 15 (App Router)
- TypeScript
- Tailwind CSS 3
- shadcn/ui + Radix UI
- Recharts
- next-themes (dark mode)
- Sonner (toasts)
- Lucide React - Construction Monitoring & Building Management System

A comprehensive, modern, and scalable frontend web application for construction monitoring and building management, built for the Information Network Security Agency (INSA) of Ethiopia.

## 🎨 Design System

**INSA Logo Color Palette:**

- **Deep Navy** `#0E2271` - Primary (from logo shield)
- **Shield Blue** `#1A3580` - Secondary (from shield highlights)
- **Lens Red** `#CC1F1A` - Alerts & Critical (from logo lens)
- **Circuit Gold** `#F5B800` - Accents & Success (from circuit pattern)
- **Purple** `#7C3AED` - Space Bookings

**Dark Mode Support:**

- 🌓 Full dark mode implementation with smooth transitions
- Three theme options: Light, Dark, and System (follows OS preference)
- Optimized INSA color palette for both light and dark themes
- Theme preference persisted to localStorage
- Theme toggle available on login page and in app header

## 🏗️ Three Operational Modules

### 1. Capital Projects & Design/Costing (Stream A)

- Submit, review, and track capital project requests
- Budget allocation and cost tracking
- Status flow: Pending → In Review → Approved/Rejected → In Progress → Completed
- Priority levels: Critical, High, Medium, Low

### 2. Space Allocation & Booking (Stream B)

- Book conference halls, training rooms, labs, and offices
- Real-time space availability
- Admin can Add/Edit/Delete spaces
- Status flow: Pending → Tentative/Confirmed/Rejected → Cancelled

### 3. Urgent Repairs & HVAC Maintenance (Stream C)

- Report and track HVAC, Electrical, Plumbing, Structural repairs
- Assign tasks to technicians
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

### 👷 Division Supervisor (NEW)

- ✅ View assigned requests from Administration
- ✅ Assign tasks to Professionals
- ✅ Monitor execution progress
- ✅ Review completed tasks
- ✅ Submit completion report to Administration
- ❌ Cannot close requests (only Admin can close)

### 🔧 Professionals (Renamed from Technician)

- ✅ View assigned tasks ONLY
- ✅ Update progress status
- ✅ Upload proof (images/files)
- ✅ Mark task as completed
- ❌ No access to admin or user data

## 🚀 Demo Credentials

| Role                    | Email                    | Password      |
| ----------------------- | ------------------------ | ------------- |
| **Administration**      | `admin@insa.gov.et`      | `password123` |
| **User**                | `user@insa.gov.et`       | `password123` |
| **Division Supervisor** | `supervisor@insa.gov.et` | `password123` |
| **Professional**        | `tech@insa.gov.et`       | `password123` |

## 🛠️ Technology Stack

- **Frontend Framework:** React 18 with TypeScript
- **Routing:** React Router v7 (Data Mode)
- **Styling:** Tailwind CSS v4 with custom INSA theme
- **UI Components:** shadcn/ui + Radix UI primitives
- **State Management:** Context API (AuthContext, ThemeContext) + Session Storage
- **Theme Management:** next-themes for dark mode support
- **Charts & Analytics:** Recharts
- **Icons:** Lucide React
- **Notifications:** Sonner
- **Form Handling:** React Hook Form
- **Date Picker:** Custom DatePicker component with INSA styling

## 📁 Project Structure

```
/src
  /app
    /components
      /auth             # ProtectedRoute wrapper
      /common           # StatusBadge, PriorityBadge, DatePicker, ThemeToggle
      /layout           # AppLayout (sidebar, header, navigation)
      /ui               # shadcn/ui components (button, card, dialog, etc.)
    /context            # AuthContext (authentication), ThemeContext (dark mode)
    /data               # mockData.ts (users, projects, bookings, maintenance)
    /pages
      /admin            # UsersPage, ConfigPage, AllRequestsPage
      /auth             # LoginPage, RegisterPage, ForgotPasswordPage
      /bookings         # BookingsPage, NewBookingPage
      /dashboard        # DashboardPage, AdminDashboard
      /maintenance      # MaintenancePage, MaintenanceDetailPage, NewMaintenancePage
      /notifications    # NotificationsPage
      /projects         # ProjectsPage, ProjectDetailPage, NewProjectPage
      /reports          # ReportsPage (analytics & KPIs)
    routes.tsx          # React Router configuration
    App.tsx             # Main app entry point
  /styles
    fonts.css           # Font imports
    tailwind.css        # Tailwind directives
    theme.css           # INSA color tokens & CSS variables (light + dark)
    index.css           # Main stylesheet import
```

## ✨ Key Features

### Security & Authentication

- Session-based authentication with role enforcement
- Protected routes with automatic login redirect
- RBAC enforcement at the route and component level

### User Experience

- Real-time notification system with unread count badges
- Comprehensive role-tailored dashboards
- Admin Master Control Layer with system-wide KPIs
- Responsive design (mobile, tablet, desktop)
- Collapsible sidebar navigation
- Search functionality across modules
- **Dark mode support** with light, dark, and system theme options
- Smooth theme transitions with INSA-optimized color palettes

### Admin Features

- **All User Requests Page:** Centralized view of every request across all three modules
- **User Management:** Create, edit, and deactivate users
- **System Configuration:** Manage SLA rules, priorities, and workflows
- **Advanced Analytics:** Charts, trends, and KPI tracking
- **Space Management:** Add/Edit/Delete spaces in Booking module

### Data Management

- Mock data system (easily replaceable with real API/Supabase)
- Clipboard copy with fallback (`textarea execCommand`) for `NotAllowedError` fix
- Custom DatePicker with INSA color styling
- Timeline tracking for projects and maintenance tickets

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
New → Assigned → Under Repair → Repaired → Closed
```

## 📊 Analytics & Reporting

The Admin Reports page includes:

- Request volume trends across all modules
- Project status distribution (pie chart)
- Maintenance type breakdown
- SLA compliance metrics
- Technician workload & performance
- Cost tracking (planned vs actual)
- Space utilization rates
- Mean Time To Repair (MTTR) tracking

## 🎯 System Highlights

1. **No "Stream" terminology:** All references to "Stream A/B/C" have been removed from user-facing pages
2. **INSA Branding:** Login page features the INSA logo with "INSA BuildMS" title
3. **Admin Restrictions:** Admins can manage and oversee but cannot submit new requests
4. **Clipboard Fallback:** All `navigator.clipboard.writeText()` calls use `try/catch` + `textarea execCommand('copy')` fallback
5. **Custom Components:** StatusBadge, PriorityBadge, RoleBadge, DatePicker all styled with INSA colors
6. **Dark Mode:** Full dark mode implementation with system preference detection and smooth transitions

## 🚦 Getting Started

The project is production-ready and runs with:

- Modern browsers (Chrome, Firefox, Safari, Edge)
- No backend required (uses session storage)
- Mock data pre-populated for demonstration

## 📝 Notes

- All data is stored in session storage (clears on browser close)
- Mock data is located in `/src/app/data/mockData.ts`
- To integrate with a real backend, replace mock data imports with API calls
- For Supabase integration, use the authentication context pattern already established

---

**Built with ❤️ for INSA Ethiopia**
