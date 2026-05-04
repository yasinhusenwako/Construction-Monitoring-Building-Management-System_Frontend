# Assignment Modal Integration Example

## Component Created

✅ **`Frontend/src/components/assignment/AssignmentModal.tsx`**

A reusable modal component for assigning requests to professionals or divisions.

---

## How to Integrate into Your Pages

### 1. Import the Component

```typescript
import { AssignmentModal } from "@/components/assignment/AssignmentModal";
```

### 2. Add State Management

```typescript
const [showAssignmentModal, setShowAssignmentModal] = useState(false);
const [assignmentType, setAssignmentType] = useState<"professional" | "division">("professional");
```

### 3. Add the Modal to Your JSX

```typescript
<AssignmentModal
  isOpen={showAssignmentModal}
  onClose={() => setShowAssignmentModal(false)}
  onSuccess={() => {
    // Refresh data after successful assignment
    refresh();
  }}
  requestId={projectItem.id}
  requestTitle={projectItem.title}
  module="PROJECT" // or "BOOKING" or "MAINTENANCE"
  assignmentType={assignmentType}
/>
```

### 4. Add Assign Button

```typescript
<button
  onClick={() => {
    setAssignmentType("professional");
    setShowAssignmentModal(true);
  }}
  className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-br from-[#5B21B6] to-[#7C3AED] text-white text-sm font-semibold hover:shadow-lg transition-all"
>
  <UserPlus size={16} />
  Assign to Professional
</button>
```

---

## Complete Integration Examples

### Example 1: Project Detail Page

```typescript
"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { AssignmentModal } from "@/components/assignment/AssignmentModal";
import { fetchLiveProjects } from "@/lib/live-api";
import { UserPlus } from "lucide-react";

export function ProjectDetailPage() {
  const params = useParams();
  const id = params.id as string;
  
  const [project, setProject] = useState<any>(null);
  const [showAssignmentModal, setShowAssignmentModal] = useState(false);
  
  const refresh = async () => {
    const projects = await fetchLiveProjects(id);
    const found = projects.find(p => p.id === id);
    setProject(found);
  };
  
  useEffect(() => {
    refresh();
  }, [id]);
  
  if (!project) return <div>Loading...</div>;
  
  return (
    <div>
      <h1>{project.title}</h1>
      
      {/* Show assign button if admin and not yet assigned */}
      {currentUser?.role === "admin" && !project.assignedTo && (
        <button
          onClick={() => setShowAssignmentModal(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-br from-[#5B21B6] to-[#7C3AED] text-white text-sm font-semibold"
        >
          <UserPlus size={16} />
          Assign to Professional
        </button>
      )}
      
      {/* Assignment Modal */}
      <AssignmentModal
        isOpen={showAssignmentModal}
        onClose={() => setShowAssignmentModal(false)}
        onSuccess={refresh}
        requestId={project.id}
        requestTitle={project.title}
        module="PROJECT"
        assignmentType="professional"
      />
    </div>
  );
}
```

---

### Example 2: Maintenance Detail Page (Admin assigns to Division)

```typescript
"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { AssignmentModal } from "@/components/assignment/AssignmentModal";
import { fetchLiveMaintenance } from "@/lib/live-api";
import { Building2 } from "lucide-react";

export function MaintenanceDetailPage() {
  const params = useParams();
  const id = params.id as string;
  
  const [maintenance, setMaintenance] = useState<any>(null);
  const [showAssignmentModal, setShowAssignmentModal] = useState(false);
  
  const refresh = async () => {
    const maintenanceList = await fetchLiveMaintenance(id);
    const found = maintenanceList.find(m => m.id === id);
    setMaintenance(found);
  };
  
  useEffect(() => {
    refresh();
  }, [id]);
  
  if (!maintenance) return <div>Loading...</div>;
  
  return (
    <div>
      <h1>{maintenance.title}</h1>
      
      {/* Admin assigns to division */}
      {currentUser?.role === "admin" && !maintenance.divisionId && (
        <button
          onClick={() => setShowAssignmentModal(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-br from-[#5B21B6] to-[#7C3AED] text-white text-sm font-semibold"
        >
          <Building2 size={16} />
          Assign to Division
        </button>
      )}
      
      {/* Assignment Modal */}
      <AssignmentModal
        isOpen={showAssignmentModal}
        onClose={() => setShowAssignmentModal(false)}
        onSuccess={refresh}
        requestId={maintenance.id}
        requestTitle={maintenance.title}
        module="MAINTENANCE"
        assignmentType="division"
      />
    </div>
  );
}
```

---

### Example 3: Supervisor Dashboard (Assign to Professional in Division)

```typescript
"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { AssignmentModal } from "@/components/assignment/AssignmentModal";
import { fetchLiveMaintenance } from "@/lib/live-api";
import { UserPlus } from "lucide-react";

export function SupervisorDashboard() {
  const { currentUser } = useAuth();
  const [maintenanceTasks, setMaintenanceTasks] = useState<any[]>([]);
  const [selectedTask, setSelectedTask] = useState<any>(null);
  const [showAssignmentModal, setShowAssignmentModal] = useState(false);
  
  const refresh = async () => {
    const allMaintenance = await fetchLiveMaintenance();
    // Filter tasks for supervisor's division
    const divisionTasks = allMaintenance.filter(
      m => m.divisionId === currentUser?.divisionId && !m.assignedTo
    );
    setMaintenanceTasks(divisionTasks);
  };
  
  useEffect(() => {
    refresh();
  }, []);
  
  return (
    <div>
      <h1>Division Tasks</h1>
      
      {maintenanceTasks.map(task => (
        <div key={task.id} className="border p-4 rounded-lg">
          <h3>{task.title}</h3>
          <button
            onClick={() => {
              setSelectedTask(task);
              setShowAssignmentModal(true);
            }}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-purple-600 text-white text-sm"
          >
            <UserPlus size={14} />
            Assign
          </button>
        </div>
      ))}
      
      {/* Assignment Modal */}
      {selectedTask && (
        <AssignmentModal
          isOpen={showAssignmentModal}
          onClose={() => {
            setShowAssignmentModal(false);
            setSelectedTask(null);
          }}
          onSuccess={() => {
            refresh();
            setSelectedTask(null);
          }}
          requestId={selectedTask.id}
          requestTitle={selectedTask.title}
          module="MAINTENANCE"
          assignmentType="professional"
          currentDivisionId={currentUser?.divisionId}
        />
      )}
    </div>
  );
}
```

---

## Props Reference

### AssignmentModal Props

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `isOpen` | `boolean` | ✅ | Controls modal visibility |
| `onClose` | `() => void` | ✅ | Called when modal is closed |
| `onSuccess` | `() => void` | ✅ | Called after successful assignment |
| `requestId` | `string` | ✅ | Business ID of the request (e.g., "PRJ-2026-123") |
| `requestTitle` | `string` | ✅ | Title to display in modal header |
| `module` | `"PROJECT" \| "BOOKING" \| "MAINTENANCE"` | ✅ | Type of request |
| `assignmentType` | `"professional" \| "division"` | ✅ | What to assign to |
| `currentDivisionId` | `string` | ❌ | For supervisors: their division ID |

---

## Assignment Type Usage

### `assignmentType="professional"`

**Use when:**
- Admin assigning projects to admin professionals (divisionId=0)
- Admin assigning bookings to admin professionals (divisionId=0)
- Supervisor assigning maintenance to division professionals

**Fetches:**
- Admin professionals if no `currentDivisionId` provided
- Division professionals if `currentDivisionId` provided

---

### `assignmentType="division"`

**Use when:**
- Admin assigning maintenance to a division

**Fetches:**
- All divisions (excluding division 0)

---

## Styling

The modal uses your existing design system:
- Purple gradient header (`from-[#5B21B6] to-[#7C3AED]`)
- Rounded corners and shadows
- Responsive design
- Loading states
- Error handling

---

## Error Handling

The modal automatically handles:
- ✅ Loading states
- ✅ Empty lists (no professionals/divisions)
- ✅ API errors with user-friendly messages
- ✅ Validation (must select before assigning)

---

## Next Steps

1. **Add to Project Detail Page:**
   - Import `AssignmentModal`
   - Add state for modal visibility
   - Add "Assign" button for admins
   - Show modal when button clicked

2. **Add to Booking Detail Page:**
   - Same as project detail page
   - Use `module="BOOKING"`

3. **Add to Maintenance Detail Page:**
   - For admin: Use `assignmentType="division"`
   - For supervisor: Use `assignmentType="professional"` with `currentDivisionId`

4. **Add to Dashboard Pages:**
   - Show assign buttons in task lists
   - Open modal for selected task

---

## Testing Checklist

- [ ] Admin can assign project to admin professional
- [ ] Admin can assign booking to admin professional
- [ ] Admin can assign maintenance to division
- [ ] Supervisor can assign maintenance to division professional
- [ ] Modal shows correct professionals/divisions
- [ ] Assignment succeeds and refreshes data
- [ ] Error messages display correctly
- [ ] Loading states work properly

---

## Date
May 2, 2026
