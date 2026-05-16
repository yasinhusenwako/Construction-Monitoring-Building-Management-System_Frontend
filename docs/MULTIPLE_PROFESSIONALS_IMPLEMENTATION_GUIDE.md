# Multiple Professional Assignment - Implementation Guide

## Status: Backend Complete ✅ | Frontend Partial ⏳ | Testing Pending ⏳

---

## What Has Been Implemented

### ✅ Backend (100% Complete)

#### 1. Database Schema
- Added `assigned_professional_ids` column to all three tables:
  - `maintenance_requests.assigned_professional_ids` (TEXT)
  - `projects.assigned_professional_ids` (TEXT)
  - `bookings.assigned_professional_ids` (TEXT)
- Old `assigned_professional_id` column kept for backward compatibility
- Migration script ready: `Backend/docs/sql/add_multiple_professionals.sql`

#### 2. Entity Models
All three models updated with helper methods:
- `MaintenanceRequest.java`
- `Project.java`
- `Booking.java`

**Helper Methods Added:**
```java
List<String> getAssignedProfessionalIdsList()
void setAssignedProfessionalIdsList(List<String> ids)
void addAssignedProfessional(String id)
void removeAssignedProfessional(String id)
boolean isAssignedToProfessional(String id)
```

#### 3. Service Layer
**WorkflowService.java:**
- `assignProfessional()` - Now adds to list instead of replacing
- `updateTaskStatus()` - Uses `isAssignedToProfessional()` check
- `updateTaskCost()` - Supports multiple professionals
- Notifications sent to ALL assigned professionals

**MaintenanceService.java:**
- `search()` - Professionals see tasks where they're in the list
- `adminAssignProfessional()` - Adds to list instead of replacing

#### 4. Data Format
```
Storage: "professional1@gmail.com,professional2@gmail.com,professional3@gmail.com"
Parsing: Split by comma, trim whitespace
Backward Compatibility: Single ID automatically converted to list
```

### ✅ Frontend Types (100% Complete)

#### 1. TypeScript Interfaces Updated
**models.ts:**
```typescript
interface Maintenance {
  assignedTo?: string; // DEPRECATED
  assignedToProfessionals?: string[]; // NEW
}

interface Project {
  assignedTo?: string; // DEPRECATED
  assignedToProfessionals?: string[]; // NEW
}

interface Booking {
  assignedTo?: string; // DEPRECATED
  assignedToProfessionals?: string[]; // NEW
}
```

#### 2. Backend Type Definitions
**live-api.ts:**
```typescript
interface BackendMaintenance {
  assignedProfessionalId?: string | null; // DEPRECATED
  assignedProfessionalIds?: string | null; // NEW
}
```

#### 3. Data Mapping
**live-api.ts:**
- `fetchLiveMaintenance()` - Parses comma-separated IDs to array
- `fetchLiveProjects()` - Parses comma-separated IDs to array
- `fetchLiveBookings()` - Parses comma-separated IDs to array

---

## What Needs To Be Implemented

### ⏳ Frontend UI Components (0% Complete)

#### 1. Multi-Select Dropdown Component
**Location:** `Frontend/src/components/common/MultiSelectDropdown.tsx` (NEW)

**Features Needed:**
- Select multiple professionals from list
- Display selected professionals as chips/badges
- Remove individual selections
- Filter/search professionals
- Show professional details (name, profession, division)

**Example Usage:**
```tsx
<MultiSelectDropdown
  options={professionals}
  selected={selectedProfessionals}
  onChange={setSelectedProfessionals}
  placeholder="Select professionals..."
  label="Assign Professionals"
/>
```

#### 2. Professional Chips Display
**Location:** `Frontend/src/components/common/ProfessionalChips.tsx` (NEW)

**Features Needed:**
- Display list of assigned professionals as chips
- Show professional avatar/initials
- Show professional name and profession
- Optional remove button (for editing)
- Responsive layout

**Example Usage:**
```tsx
<ProfessionalChips
  professionals={assignedProfessionals}
  onRemove={handleRemove}
  editable={canEdit}
/>
```

#### 3. Update Assignment Dialogs

**Files to Modify:**
- `Frontend/src/views/supervisor/SupervisorDashboard.tsx`
- `Frontend/src/views/supervisor/TaskManagementPage.tsx`
- `Frontend/src/views/maintenance/MaintenanceDetailPage.tsx`
- `Frontend/src/views/admin/AdminDashboard.tsx`

**Changes Needed:**
- Replace single-select dropdown with multi-select
- Update state management to handle arrays
- Update API calls to send arrays
- Display multiple professionals in cards/lists

#### 4. Update Display Components

**Files to Modify:**
- `Frontend/src/views/maintenance/MaintenancePage.tsx`
- `Frontend/src/views/projects/ProjectsPage.tsx`
- `Frontend/src/views/bookings/BookingsPage.tsx`

**Changes Needed:**
- Display multiple professionals in list view
- Show professional count badge
- Tooltip with all professional names
- Update detail views to show all professionals

### ⏳ API Integration Updates (0% Complete)

#### 1. Update Assignment DTOs

**Current:**
```typescript
{
  requestId: 123,
  professionalId: "professional1@gmail.com",
  instructions: "Fix the AC"
}
```

**New (Backward Compatible):**
```typescript
{
  requestId: 123,
  professionalId: "professional1@gmail.com", // Still works for single
  professionalIds: ["professional1@gmail.com", "professional2@gmail.com"], // NEW
  instructions: "Fix the AC"
}
```

#### 2. Update API Functions

**Files to Modify:**
- `Frontend/src/lib/live-api.ts`
- `Frontend/src/lib/workflow-actions.ts`

**Functions to Update:**
- `supervisorAssignProfessional()` - Accept array
- `adminAssignProfessional()` - Accept array
- Backend DTOs already support this via `addAssignedProfessional()`

---

## Migration Steps

### Step 1: Database Migration (REQUIRED)

```bash
# Connect to PostgreSQL
psql -U postgres -d cmbms

# Run migration script
\i Backend/docs/sql/add_multiple_professionals.sql

# Verify migration
SELECT 
    maintenance_id,
    assigned_professional_id as old_single,
    assigned_professional_ids as new_multiple
FROM maintenance_requests
WHERE assigned_professional_id IS NOT NULL
LIMIT 5;
```

**Expected Output:**
```
 maintenance_id | old_single              | new_multiple
----------------+-------------------------+-------------------------
 M-2026-001     | professional1@gmail.com | professional1@gmail.com
 M-2026-002     | professional2@gmail.com | professional2@gmail.com
```

### Step 2: Backend Restart (REQUIRED)

```bash
cd Backend
mvn clean spring-boot:run
```

**Verify:**
- No compilation errors
- Server starts successfully
- Check logs for "Started CmbmsApplication"

### Step 3: Test Backend API (REQUIRED)

**Test 1: Assign Single Professional (Backward Compatibility)**
```bash
# Login as supervisor
# Assign one professional to a maintenance task
# Verify professional can see the task
```

**Test 2: Assign Multiple Professionals (New Feature)**
```bash
# Use Postman or curl to test API directly
POST /api/supervisor/assign-professional
{
  "requestId": 123,
  "assignedProfessionalId": "professional1@gmail.com",
  "instructions": "Fix AC"
}

# Then assign another
POST /api/supervisor/assign-professional
{
  "requestId": 123,
  "assignedProfessionalId": "professional2@gmail.com",
  "instructions": "Additional help"
}

# Verify both professionals see the task
GET /api/maintenance (as professional1)
GET /api/maintenance (as professional2)
```

### Step 4: Frontend UI Implementation (TODO)

**Priority 1: Multi-Select Component**
1. Create `MultiSelectDropdown.tsx`
2. Add to Storybook for testing
3. Test with sample data

**Priority 2: Update Assignment Dialogs**
1. Update SupervisorDashboard assignment dialog
2. Update MaintenanceDetailPage assignment section
3. Test assignment flow

**Priority 3: Update Display Components**
1. Update list views to show multiple professionals
2. Update detail views
3. Add professional chips component

**Priority 4: API Integration**
1. Update workflow-actions to handle arrays
2. Update live-api functions
3. Test end-to-end flow

### Step 5: Testing (TODO)

**Backend Tests:**
- [ ] Single professional assignment still works
- [ ] Multiple professionals can be assigned
- [ ] All assigned professionals see the task
- [ ] Any assigned professional can update status
- [ ] Any assigned professional can update costs
- [ ] Notifications sent to all professionals
- [ ] Work order shows all professionals

**Frontend Tests:**
- [ ] Multi-select dropdown works
- [ ] Professional chips display correctly
- [ ] Assignment dialog saves multiple professionals
- [ ] List view shows multiple professionals
- [ ] Detail view shows all professionals
- [ ] Removing a professional works
- [ ] Adding a professional works

**Integration Tests:**
- [ ] Supervisor assigns multiple professionals
- [ ] All professionals receive notifications
- [ ] All professionals see task in their list
- [ ] Professional 1 starts task
- [ ] Professional 2 updates costs
- [ ] Professional 1 completes task
- [ ] Supervisor reviews completion
- [ ] Admin approves and closes

---

## UI Mockups

### Assignment Dialog (Multi-Select)

```
┌─────────────────────────────────────────────────┐
│ Assign Professionals                            │
├─────────────────────────────────────────────────┤
│                                                 │
│ Select Professionals:                           │
│ ┌─────────────────────────────────────────────┐ │
│ │ 🔍 Search professionals...                  │ │
│ └─────────────────────────────────────────────┘ │
│                                                 │
│ ☑ John Doe (Electrician)                       │
│ ☑ Jane Smith (Plumber)                         │
│ ☐ Bob Johnson (HVAC Technician)                │
│ ☐ Alice Brown (Carpenter)                      │
│                                                 │
│ Selected (2):                                   │
│ ┌──────────────┐ ┌──────────────┐              │
│ │ JD Electrician│ │ JS Plumber   │              │
│ │ John Doe   ✕ │ │ Jane Smith ✕ │              │
│ └──────────────┘ └──────────────┘              │
│                                                 │
│ Instructions:                                   │
│ ┌─────────────────────────────────────────────┐ │
│ │ Fix the AC unit in Room 301. Requires      │ │
│ │ both electrical and plumbing work.         │ │
│ └─────────────────────────────────────────────┘ │
│                                                 │
│           [Cancel]  [Assign Professionals]      │
└─────────────────────────────────────────────────┘
```

### List View (Multiple Professionals)

```
┌─────────────────────────────────────────────────────────────┐
│ M-2026-001 │ Fix AC Unit │ In Progress │ High │ DIV-001    │
│                                                             │
│ Assigned to: 👤 John Doe, 👤 Jane Smith (+1 more)          │
│ Location: Building A, Floor 3, Room 301                    │
└─────────────────────────────────────────────────────────────┘
```

### Detail View (Professional Chips)

```
┌─────────────────────────────────────────────────┐
│ Maintenance Details                             │
├─────────────────────────────────────────────────┤
│                                                 │
│ Assigned Professionals:                         │
│                                                 │
│ ┌──────────────┐ ┌──────────────┐ ┌──────────┐ │
│ │ JD           │ │ JS           │ │ BJ       │ │
│ │ John Doe     │ │ Jane Smith   │ │ Bob J.   │ │
│ │ Electrician  │ │ Plumber      │ │ HVAC     │ │
│ │ DIV-001      │ │ DIV-001      │ │ DIV-001  │ │
│ └──────────────┘ └──────────────┘ └──────────┘ │
│                                                 │
└─────────────────────────────────────────────────┘
```

---

## Backward Compatibility

✅ **Fully Backward Compatible**

1. **Old `assignedProfessionalId` column kept**
   - Automatically synced with first professional in list
   - Existing queries still work

2. **Single professional assignment still works**
   - Assigning one professional works exactly as before
   - Automatically converted to list format internally

3. **Frontend graceful fallback**
   - If `assignedToProfessionals` is undefined, falls back to `assignedTo`
   - Existing UI components continue to work

4. **API backward compatible**
   - Sending single `professionalId` still works
   - Backend automatically converts to list

---

## Benefits of Multiple Professional Assignment

1. **Team Collaboration** - Multiple professionals work together on complex tasks
2. **Skill Diversity** - Assign professionals with complementary skills
3. **Workload Distribution** - Distribute large tasks across team
4. **Shift Coverage** - Multiple professionals cover different shifts
5. **Training** - Senior professional + junior professional pairing
6. **Efficiency** - Parallel work on different aspects of same task

---

## Limitations & Future Enhancements

### Current Limitations
1. No role differentiation (all professionals have equal access)
2. No task splitting (can't assign specific subtasks)
3. Shared status (no individual progress tracking)
4. Shared cost tracking (not per-professional)

### Future Enhancements
1. **Task Splitting** - Assign specific subtasks to specific professionals
2. **Role Assignment** - Lead, assistant, observer roles
3. **Individual Progress** - Track each professional's progress separately
4. **Workload Balancing** - Auto-suggest based on current workload
5. **Team Templates** - Save common professional combinations
6. **Skill Matching** - Auto-suggest based on required skills
7. **Availability Check** - Check professional availability before assignment
8. **Conflict Detection** - Detect scheduling conflicts

---

## Files Modified

### Backend ✅
- `Backend/src/main/java/com/org/cmbms/maintenance/model/MaintenanceRequest.java`
- `Backend/src/main/java/com/org/cmbms/project/model/Project.java`
- `Backend/src/main/java/com/org/cmbms/space/model/Booking.java`
- `Backend/src/main/java/com/org/cmbms/maintenance/service/WorkflowService.java`
- `Backend/src/main/java/com/org/cmbms/maintenance/service/MaintenanceService.java`
- `Backend/docs/sql/add_multiple_professionals.sql` (NEW)

### Frontend ✅ (Types Only)
- `Frontend/src/types/models.ts`
- `Frontend/src/lib/live-api.ts`

### Frontend ⏳ (UI Pending)
- `Frontend/src/components/common/MultiSelectDropdown.tsx` (TODO)
- `Frontend/src/components/common/ProfessionalChips.tsx` (TODO)
- `Frontend/src/views/supervisor/SupervisorDashboard.tsx` (TODO)
- `Frontend/src/views/supervisor/TaskManagementPage.tsx` (TODO)
- `Frontend/src/views/maintenance/MaintenanceDetailPage.tsx` (TODO)
- `Frontend/src/views/admin/AdminDashboard.tsx` (TODO)
- `Frontend/src/lib/workflow-actions.ts` (TODO)

---

## Next Steps

### Immediate (Required)
1. ✅ Run database migration
2. ✅ Restart backend
3. ⏳ Test backend API manually
4. ⏳ Verify backward compatibility

### Short Term (UI Implementation)
1. ⏳ Create MultiSelectDropdown component
2. ⏳ Create ProfessionalChips component
3. ⏳ Update assignment dialogs
4. ⏳ Update display components
5. ⏳ Test end-to-end flow

### Long Term (Enhancements)
1. ⏳ Add task splitting
2. ⏳ Add role assignment
3. ⏳ Add individual progress tracking
4. ⏳ Add workload balancing
5. ⏳ Add team templates

---

## Support & Documentation

- **Feature Documentation:** `Frontend/docs/FEATURE_MULTIPLE_PROFESSIONAL_ASSIGNMENT.md`
- **Implementation Guide:** This file
- **SQL Migration:** `Backend/docs/sql/add_multiple_professionals.sql`
- **API Documentation:** See backend README

---

**Status:** Backend Complete ✅ | Frontend Partial ⏳ | Testing Pending ⏳  
**Date:** May 16, 2026  
**Version:** 1.1.0  
**Priority:** Medium  
**Complexity:** Medium  
**Estimated Completion:** 2-3 days for full UI implementation

