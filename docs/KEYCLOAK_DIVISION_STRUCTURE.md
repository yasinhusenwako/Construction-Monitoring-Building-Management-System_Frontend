# Keycloak Division Structure & Workflow

## Overview
The INSA CSBMS system has a hierarchical structure with divisions and role-based workflows for different types of requests.

## Division Structure

### Division 0 - Administration
- **Purpose:** Central administration and project/booking management
- **Users:**
  - System Administrator (ADMIN role)
  - Admin Professionals (PROFESSIONAL role) - Handle projects and space bookings
  - General Users (USER role)

### Division 1, 2, 3 - Operational Divisions
- **Purpose:** Handle maintenance requests assigned to their division
- **Users per Division:**
  - Division Director (SUPERVISOR role)
  - Division Professionals (PROFESSIONAL role) - Handle maintenance tasks

## User Roles

### ADMIN (System Administrator)
- **Division:** 0 (Administration)
- **Responsibilities:**
  - Manage all users
  - Assign projects and bookings to admin professionals
  - Assign maintenance requests to appropriate divisions
  - View all system data
  - Configure system settings

### USER (Regular User)
- **Division:** Any (typically 0)
- **Responsibilities:**
  - Submit project requests
  - Submit space booking requests
  - Submit maintenance requests
  - View own requests and their status

### SUPERVISOR (Division Director)
- **Division:** 1, 2, or 3
- **Responsibilities:**
  - Review maintenance requests assigned to their division
  - Assign maintenance tasks to professionals in their division
  - Monitor division performance
  - Approve completed work from their professionals

### PROFESSIONAL
- **Two Types:**
  1. **Admin Professionals (Division 0):**
     - Handle project requests
     - Handle space booking requests
     - Report completion to admin
  
  2. **Division Professionals (Division 1, 2, 3):**
     - Handle maintenance requests assigned to their division
     - Report completion to their division supervisor

## Workflows

### Project & Space Booking Workflow
```
USER → ADMIN → PROFESSIONAL (Division 0) → ADMIN → USER
```

**Steps:**
1. User submits project/booking request
2. Admin reviews and assigns to admin professional (Division 0)
3. Admin professional completes the task
4. Admin reviews completion and closes request
5. User is notified of completion

### Maintenance Workflow
```
USER → ADMIN → DIVISION SUPERVISOR → DIVISION PROFESSIONAL → DIVISION SUPERVISOR → ADMIN → USER
```

**Steps:**
1. User submits maintenance request
2. Admin reviews and assigns to appropriate division (1, 2, or 3)
3. Division supervisor reviews and assigns to professional in their division
4. Division professional completes the maintenance task
5. Division supervisor reviews and approves completion
6. Admin reviews final approval and closes request
7. User is notified of completion

## Sample Users in Template

### Administration (Division 0)
| Username | Role | Password | Purpose |
|----------|------|----------|---------|
| admin@insa.gov.et | ADMIN | Admin@123 | System administrator |
| admin.professional@insa.gov.et | PROFESSIONAL | Professional@123 | Handles projects & bookings |
| user@insa.gov.et | USER | User@123 | Regular user for testing |

### Division 1
| Username | Role | Password | Purpose |
|----------|------|----------|---------|
| division1.supervisor@insa.gov.et | SUPERVISOR | Supervisor@123 | Division 1 director |
| division1.professional@insa.gov.et | PROFESSIONAL | Professional@123 | Division 1 maintenance tech |

### Division 2
| Username | Role | Password | Purpose |
|----------|------|----------|---------|
| division2.supervisor@insa.gov.et | SUPERVISOR | Supervisor@123 | Division 2 director |
| division2.professional@insa.gov.et | PROFESSIONAL | Professional@123 | Division 2 maintenance tech |

### Division 3
| Username | Role | Password | Purpose |
|----------|------|----------|---------|
| division3.supervisor@insa.gov.et | SUPERVISOR | Supervisor@123 | Division 3 director |
| division3.professional@insa.gov.et | PROFESSIONAL | Professional@123 | Division 3 maintenance tech |

## User Attributes

Each user has the following attributes:

### divisionId
- **Type:** String
- **Values:**
  - `"0"` - Administration
  - `"1"` - Division 1
  - `"2"` - Division 2
  - `"3"` - Division 3
- **Purpose:** Determines which division the user belongs to

### department
- **Type:** String
- **Examples:**
  - "Administration"
  - "Division 1"
  - "Division 2"
  - "Division 3"
- **Purpose:** Human-readable department name

### profession (for PROFESSIONAL role only)
- **Type:** String
- **Examples:**
  - "Project Manager" (for admin professionals)
  - "Maintenance Technician" (for division professionals)
  - "Electrician"
  - "Plumber"
  - "HVAC Technician"
- **Purpose:** Specifies the professional's area of expertise

## Assignment Logic

### Projects & Bookings
- Admin assigns to professionals with `divisionId = "0"`
- Only admin professionals can be assigned projects and bookings

### Maintenance Requests
- Admin assigns to a division (1, 2, or 3) based on:
  - Type of maintenance required
  - Division workload
  - Professional expertise
- Division supervisor assigns to professionals with matching `divisionId`
- Only division professionals can be assigned maintenance tasks

## Database Considerations

### Division Table
Should have at least these divisions:
```sql
INSERT INTO divisions (id, name, description) VALUES
(0, 'Administration', 'Central administration and project management'),
(1, 'Division 1', 'Operational division 1'),
(2, 'Division 2', 'Operational division 2'),
(3, 'Division 3', 'Operational division 3');
```

### User Assignment
When creating/updating users in the backend:
- Extract `divisionId` from Keycloak user attributes
- Store in user table for efficient querying
- Use for filtering professionals when assigning tasks

### Task Assignment
When assigning tasks:
- **Projects/Bookings:** Filter professionals by `divisionId = 0` AND `role = PROFESSIONAL`
- **Maintenance:** 
  - Admin selects division (1, 2, or 3)
  - Supervisor filters professionals by their `divisionId` AND `role = PROFESSIONAL`

## Frontend Considerations

### Dashboard Routing
- **ADMIN:** `/dashboard/admin` - Can see all divisions and tasks
- **USER:** `/dashboard/user` - Can see own requests
- **SUPERVISOR:** `/dashboard/supervisor` - Can see tasks for their division only
- **PROFESSIONAL:** `/dashboard/professional` - Can see tasks assigned to them

### Task Assignment UI
- **Admin assigning projects/bookings:**
  - Show dropdown of professionals with `divisionId = 0`
  
- **Admin assigning maintenance:**
  - First select division (1, 2, or 3)
  - System assigns to division supervisor
  
- **Supervisor assigning maintenance:**
  - Show dropdown of professionals with matching `divisionId`

### Filtering & Permissions
- Supervisors should only see data for their division
- Professionals should only see tasks assigned to them
- Admin can see everything
- Users can only see their own requests

## Importing the Updated Template

### Steps to Import
1. **Backup current realm** (if you have existing data):
   ```bash
   # Export current realm from Keycloak Admin Console
   # Realms → INSA → Export
   ```

2. **Delete existing realm** (if starting fresh):
   ```bash
   # Keycloak Admin Console → Realms → INSA → Delete
   ```

3. **Import new template:**
   ```bash
   # Keycloak Admin Console → Add Realm → Select file
   # Choose: keycloak-insa-realm-template.json
   ```

4. **Update client secrets:**
   - Go to Clients → insa-backend → Credentials
   - Regenerate or set secret to: `6krziITC6UadIt5iTsKVuNZ5I976OwkM`
   - Update `Backend/.env` with the secret

5. **Assign service account roles:**
   - Go to Clients → insa-backend → Service Account Roles
   - Assign from `realm-management`:
     - view-realm
     - view-users
     - query-users
     - query-groups
     - manage-users

## Testing the Structure

### Test Project/Booking Workflow
1. Login as `user@insa.gov.et` → Submit project request
2. Login as `admin@insa.gov.et` → Assign to `admin.professional@insa.gov.et`
3. Login as `admin.professional@insa.gov.et` → Complete task
4. Login as `admin@insa.gov.et` → Approve and close
5. Login as `user@insa.gov.et` → Verify completion

### Test Maintenance Workflow
1. Login as `user@insa.gov.et` → Submit maintenance request
2. Login as `admin@insa.gov.et` → Assign to Division 1
3. Login as `division1.supervisor@insa.gov.et` → Assign to `division1.professional@insa.gov.et`
4. Login as `division1.professional@insa.gov.et` → Complete task
5. Login as `division1.supervisor@insa.gov.et` → Approve completion
6. Login as `admin@insa.gov.et` → Final approval and close
7. Login as `user@insa.gov.et` → Verify completion

## Notes
- All passwords follow the pattern: `Role@123` (with capital first letter)
- Division 0 is reserved for administration
- Divisions 1-3 are for operational maintenance
- You can add more divisions by following the same pattern
- Each division should have at least one supervisor and one professional
- Professionals can have different professions/specializations

## Date
May 2, 2026
