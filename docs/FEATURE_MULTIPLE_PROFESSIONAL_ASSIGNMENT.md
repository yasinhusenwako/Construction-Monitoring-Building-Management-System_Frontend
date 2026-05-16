# Feature: Multiple Professional Assignment

## Overview
This feature allows assigning **multiple professionals** to a single maintenance request, project, or booking instead of just one professional.

## Use Cases

1. **Large Maintenance Tasks** - Complex repairs requiring multiple specialists (e.g., electrician + plumber)
2. **Team Projects** - Construction projects requiring a team of workers
3. **Shift Coverage** - Multiple professionals covering different shifts for the same task
4. **Skill Diversity** - Tasks requiring different skill sets (e.g., carpenter + painter)

## Implementation

### Backend Changes

#### 1. Database Schema
Added new column `assigned_professional_ids` (TEXT) to store comma-separated professional IDs:
- `maintenance_requests.assigned_professional_ids`
- `projects.assigned_professional_ids`
- `bookings.assigned_professional_ids`

**Migration SQL:**
```sql
ALTER TABLE maintenance_requests ADD COLUMN assigned_professional_ids TEXT;
ALTER TABLE projects ADD COLUMN assigned_professional_ids TEXT;
ALTER TABLE bookings ADD COLUMN assigned_professional_ids TEXT;
```

**Backward Compatibility:**
- Old `assigned_professional_id` column is kept
- Automatically synced with first professional in the list
- Existing single assignments migrated to new format

#### 2. Model Changes
Added helper methods to all entity models:

```java
// Get list of assigned professionals
public List<String> getAssignedProfessionalIdsList()

// Set list of assigned professionals
public void setAssignedProfessionalIdsList(List<String> professionalIds)

// Add a professional to the assignment
public void addAssignedProfessional(String professionalId)

// Remove a professional from the assignment
public void removeAssignedProfessional(String professionalId)

// Check if a professional is assigned
public boolean isAssignedToProfessional(String professionalId)
```

#### 3. Service Layer Changes

**WorkflowService.assignProfessional():**
- Changed from `setAssignedProfessionalId()` to `addAssignedProfessional()`
- Notifies ALL assigned professionals
- Work order stores all professional IDs

**WorkflowService.updateTaskStatus():**
- Uses `isAssignedToProfessional()` to check assignment
- Any assigned professional can update status

**MaintenanceService.search():**
- Professionals see tasks where they are in the assigned list
- Uses stream filter with `isAssignedToProfessional()`

### Frontend Changes (To Be Implemented)

#### 1. UI Components
- **Multi-select dropdown** for professional selection
- **Chips/badges** to display assigned professionals
- **Add/Remove buttons** to manage assignments

#### 2. API Integration
- Update assignment DTOs to accept arrays
- Display multiple professionals in detail views
- Show all assigned professionals in lists

## Usage

### Assigning Multiple Professionals (Supervisor)

**Current Behavior:**
```typescript
// Supervisor assigns ONE professional
await supervisorAssignProfessional({
  requestId: 123,
  professionalId: "professional1@gmail.com",
  instructions: "Fix the AC"
});
```

**New Behavior (To Be Implemented):**
```typescript
// Supervisor assigns MULTIPLE professionals
await supervisorAssignProfessional({
  requestId: 123,
  professionalIds: [
    "professional1@gmail.com",
    "professional2@gmail.com"
  ],
  instructions: "Fix the AC - requires electrician and HVAC specialist"
});
```

### Viewing Assigned Tasks (Professional)

**Current Behavior:**
- Professional sees tasks where `assignedProfessionalId === their ID`

**New Behavior:**
- Professional sees tasks where their ID is in `assignedProfessionalIds` list
- Multiple professionals can work on the same task
- Any assigned professional can update status and costs

## Data Format

### Storage Format
```
assigned_professional_ids: "professional1@gmail.com,professional2@gmail.com,professional3@gmail.com"
```

### API Response Format (Proposed)
```json
{
  "id": 123,
  "maintenanceId": "M-2026-001",
  "assignedProfessionals": [
    {
      "id": "professional1@gmail.com",
      "name": "John Doe",
      "profession": "Electrician"
    },
    {
      "id": "professional2@gmail.com",
      "name": "Jane Smith",
      "profession": "Plumber"
    }
  ]
}
```

## Migration Guide

### Step 1: Run SQL Migration
```bash
psql -U postgres -d cmbms -f Backend/docs/sql/add_multiple_professionals.sql
```

### Step 2: Restart Backend
```bash
cd Backend
mvn clean spring-boot:run
```

### Step 3: Verify Migration
```sql
-- Check that new column exists and data is migrated
SELECT 
    maintenance_id,
    assigned_professional_id as old_single,
    assigned_professional_ids as new_multiple
FROM maintenance_requests
WHERE assigned_professional_id IS NOT NULL
LIMIT 10;
```

### Step 4: Test Assignment
1. Login as supervisor
2. Assign a professional to a maintenance task
3. Verify the professional can see the task
4. Assign another professional to the same task
5. Verify both professionals can see and update the task

## Backward Compatibility

✅ **Fully Backward Compatible**
- Old `assigned_professional_id` column is kept
- Automatically synced with first professional in list
- Existing code using single assignment still works
- Gradual migration path - no breaking changes

## Benefits

1. **Flexibility** - Assign teams to complex tasks
2. **Collaboration** - Multiple professionals can work together
3. **Efficiency** - Parallel work on large tasks
4. **Skill Matching** - Assign professionals with complementary skills
5. **Coverage** - Multiple professionals for shift coverage

## Limitations

1. **No Role Differentiation** - All assigned professionals have equal access
2. **No Task Splitting** - Cannot assign specific subtasks to specific professionals
3. **Shared Status** - All professionals see the same status (no individual progress tracking)
4. **Shared Costs** - Cost tracking is shared, not per-professional

## Future Enhancements

1. **Task Splitting** - Assign specific subtasks to specific professionals
2. **Individual Progress** - Track each professional's progress separately
3. **Role Assignment** - Assign roles (lead, assistant, etc.)
4. **Workload Balancing** - Auto-suggest professionals based on current workload
5. **Team Templates** - Save common professional combinations as templates

## Testing Checklist

- [ ] Run SQL migration successfully
- [ ] Restart backend without errors
- [ ] Supervisor can assign multiple professionals
- [ ] All assigned professionals see the task
- [ ] Any assigned professional can update status
- [ ] Any assigned professional can update costs
- [ ] Notifications sent to all assigned professionals
- [ ] Work order shows all assigned professionals
- [ ] Timeline shows all professional actions
- [ ] Existing single assignments still work

## Files Modified

### Backend
- `Backend/src/main/java/com/org/cmbms/maintenance/model/MaintenanceRequest.java`
- `Backend/src/main/java/com/org/cmbms/project/model/Project.java`
- `Backend/src/main/java/com/org/cmbms/space/model/Booking.java`
- `Backend/src/main/java/com/org/cmbms/maintenance/service/WorkflowService.java`
- `Backend/src/main/java/com/org/cmbms/maintenance/service/MaintenanceService.java`
- `Backend/docs/sql/add_multiple_professionals.sql` (NEW)

### Frontend (To Be Implemented)
- `Frontend/src/types/models.ts` - Update types
- `Frontend/src/lib/live-api.ts` - Update API calls
- `Frontend/src/views/supervisor/*` - Update assignment UI
- `Frontend/src/views/maintenance/*` - Update display UI

## Status

**Backend:** ✅ IMPLEMENTED  
**Database:** ✅ MIGRATION READY  
**Frontend:** ⏳ PENDING IMPLEMENTATION  
**Testing:** ⏳ PENDING  
**Documentation:** ✅ COMPLETE

---

**Date:** May 16, 2026  
**Version:** 1.1.0  
**Feature Status:** Backend Complete, Frontend Pending

