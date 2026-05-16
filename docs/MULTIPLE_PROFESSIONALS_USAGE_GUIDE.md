# Multiple Professional Assignment - Usage Guide

## Components Created

### 1. MultiSelectDropdown
**Location:** `Frontend/src/components/common/MultiSelectDropdown.tsx`

A reusable multi-select dropdown with search functionality.

**Features:**
- ✅ Multiple selection with checkboxes
- ✅ Search/filter options
- ✅ Selected items displayed as chips
- ✅ Remove individual selections
- ✅ Clear all button
- ✅ Keyboard accessible
- ✅ Click outside to close

**Usage:**
```tsx
import { MultiSelectDropdown } from "@/components/common/MultiSelectDropdown";

const [selected, setSelected] = useState<string[]>([]);

<MultiSelectDropdown
  label="Select Professionals"
  options={[
    { id: "1", name: "John Doe", subtitle: "Electrician", avatar: "JD" },
    { id: "2", name: "Jane Smith", subtitle: "Plumber", avatar: "JS" },
  ]}
  selected={selected}
  onChange={setSelected}
  placeholder="Select professionals..."
  searchable
/>
```

### 2. ProfessionalChips
**Location:** `Frontend/src/components/common/ProfessionalChips.tsx`

Display assigned professionals as chips/badges.

**Features:**
- ✅ Display multiple professionals
- ✅ Show avatar, name, profession
- ✅ Removable chips (editable mode)
- ✅ Tooltip with full details
- ✅ Responsive sizing (sm, md, lg)
- ✅ Max display with "+X more" badge
- ✅ Compact version for lists

**Usage:**
```tsx
import { ProfessionalChips, ProfessionalChipsCompact } from "@/components/common/ProfessionalChips";

// Full version
<ProfessionalChips
  professionals={[
    { id: "1", name: "John Doe", profession: "Electrician", divisionId: "DIV-001" },
    { id: "2", name: "Jane Smith", profession: "Plumber", divisionId: "DIV-001" },
  ]}
  onRemove={(id) => console.log("Remove", id)}
  editable
  size="md"
  maxDisplay={3}
/>

// Compact version for lists
<ProfessionalChipsCompact
  professionals={professionals}
  maxDisplay={2}
/>
```

### 3. AssignProfessionalsDialog
**Location:** `Frontend/src/components/maintenance/AssignProfessionalsDialog.tsx`

Complete dialog for assigning multiple professionals.

**Features:**
- ✅ Multi-select dropdown integrated
- ✅ Professional chips preview
- ✅ Instructions textarea
- ✅ Division filtering
- ✅ Error handling
- ✅ Loading states
- ✅ Form validation

**Usage:**
```tsx
import { AssignProfessionalsDialog } from "@/components/maintenance/AssignProfessionalsDialog";

const [isOpen, setIsOpen] = useState(false);

<AssignProfessionalsDialog
  isOpen={isOpen}
  onClose={() => setIsOpen(false)}
  onAssign={async (professionalIds, instructions) => {
    await assignProfessionals(professionalIds, instructions);
  }}
  currentlyAssigned={maintenance.assignedToProfessionals}
  divisionId={userDivisionId}
  title="Assign Professionals to Maintenance Task"
  requireInstructions
/>
```

### 4. Custom Hooks
**Location:** `Frontend/src/hooks/use-professionals.ts`

Hooks for fetching and formatting professional data.

**Hooks:**
- `useProfessionals(divisionId?)` - Get professionals list
- `useProfessionalsAsOptions(divisionId?)` - Get as MultiSelectOptions
- `useProfessionalsById(ids[])` - Get professionals by IDs

**Usage:**
```tsx
import { useProfessionals, useProfessionalsAsOptions, useProfessionalsById } from "@/hooks/use-professionals";

// Get all professionals in a division
const { professionals, isLoading } = useProfessionals("DIV-001");

// Get as dropdown options
const { options } = useProfessionalsAsOptions("DIV-001");

// Get specific professionals by IDs
const { professionals } = useProfessionalsById(["id1", "id2"]);
```

---

## Integration Examples

### Example 1: Supervisor Dashboard - Assign Professionals

```tsx
"use client";

import { useState } from "react";
import { AssignProfessionalsDialog } from "@/components/maintenance/AssignProfessionalsDialog";
import { ProfessionalChips } from "@/components/common/ProfessionalChips";
import { useProfessionalsById } from "@/hooks/use-professionals";
import { executeWorkflowAction } from "@/lib/workflow-actions";

export function SupervisorMaintenanceCard({ maintenance, userDivisionId }) {
  const [showAssignDialog, setShowAssignDialog] = useState(false);
  const { professionals } = useProfessionalsById(maintenance.assignedToProfessionals || []);

  const handleAssign = async (professionalIds: string[], instructions: string) => {
    const result = await executeWorkflowAction({
      module: "MAINTENANCE",
      businessId: maintenance.id,
      requestId: maintenance.dbId,
      currentStatus: maintenance.status,
      nextStatus: "Assigned to Professionals",
      actorRole: "supervisor",
      extraUpdates: {
        assignedToProfessionals: professionalIds,
        notes: instructions,
      },
    });

    if (!result.ok) {
      throw new Error(result.message);
    }
  };

  return (
    <div className="border rounded-lg p-4">
      <h3>{maintenance.title}</h3>
      
      {/* Display assigned professionals */}
      <div className="mt-4">
        <label className="text-sm font-medium">Assigned Professionals:</label>
        {professionals.length > 0 ? (
          <ProfessionalChips
            professionals={professionals}
            size="sm"
            maxDisplay={3}
          />
        ) : (
          <p className="text-sm text-muted-foreground">Not assigned</p>
        )}
      </div>

      {/* Assign button */}
      <button
        onClick={() => setShowAssignDialog(true)}
        className="mt-4 px-4 py-2 bg-primary text-primary-foreground rounded-md"
      >
        {professionals.length > 0 ? "Reassign" : "Assign"} Professionals
      </button>

      {/* Assignment dialog */}
      <AssignProfessionalsDialog
        isOpen={showAssignDialog}
        onClose={() => setShowAssignDialog(false)}
        onAssign={handleAssign}
        currentlyAssigned={maintenance.assignedToProfessionals}
        divisionId={userDivisionId}
      />
    </div>
  );
}
```

### Example 2: Maintenance List - Display Multiple Professionals

```tsx
import { ProfessionalChipsCompact } from "@/components/common/ProfessionalChips";
import { useProfessionalsById } from "@/hooks/use-professionals";

export function MaintenanceListItem({ maintenance }) {
  const { professionals } = useProfessionalsById(maintenance.assignedToProfessionals || []);

  return (
    <div className="border rounded-lg p-4">
      <div className="flex justify-between items-start">
        <div>
          <h3 className="font-semibold">{maintenance.title}</h3>
          <p className="text-sm text-muted-foreground">{maintenance.description}</p>
        </div>
        <span className="text-xs px-2 py-1 rounded bg-primary/10 text-primary">
          {maintenance.status}
        </span>
      </div>

      <div className="mt-3 flex items-center gap-2">
        <span className="text-xs text-muted-foreground">Assigned to:</span>
        <ProfessionalChipsCompact professionals={professionals} maxDisplay={2} />
      </div>
    </div>
  );
}
```

### Example 3: Admin Dashboard - Assign Multiple Professionals

```tsx
"use client";

import { useState } from "react";
import { MultiSelectDropdown } from "@/components/common/MultiSelectDropdown";
import { useProfessionalsAsOptions } from "@/hooks/use-professionals";
import { executeWorkflowAction } from "@/lib/workflow-actions";

export function AdminAssignProfessionals({ project }) {
  const [selectedProfessionals, setSelectedProfessionals] = useState<string[]>([]);
  const { options, isLoading } = useProfessionalsAsOptions(); // All professionals for admin

  const handleAssign = async () => {
    const result = await executeWorkflowAction({
      module: "PROJECT",
      businessId: project.id,
      requestId: project.dbId,
      currentStatus: project.status,
      nextStatus: "Assigned to Professionals",
      actorRole: "admin",
      extraUpdates: {
        assignedToProfessionals: selectedProfessionals,
      },
    });

    if (result.ok) {
      alert("Professionals assigned successfully!");
    } else {
      alert(`Error: ${result.message}`);
    }
  };

  return (
    <div className="space-y-4">
      <MultiSelectDropdown
        label="Assign Professionals to Project"
        options={options}
        selected={selectedProfessionals}
        onChange={setSelectedProfessionals}
        placeholder={isLoading ? "Loading..." : "Select professionals..."}
        disabled={isLoading}
      />

      <button
        onClick={handleAssign}
        disabled={selectedProfessionals.length === 0}
        className="px-4 py-2 bg-primary text-primary-foreground rounded-md disabled:opacity-50"
      >
        Assign {selectedProfessionals.length > 0 && `(${selectedProfessionals.length})`}
      </button>
    </div>
  );
}
```

### Example 4: Detail Page - Show and Manage Professionals

```tsx
"use client";

import { useState } from "react";
import { ProfessionalChips } from "@/components/common/ProfessionalChips";
import { AssignProfessionalsDialog } from "@/components/maintenance/AssignProfessionalsDialog";
import { useProfessionalsById } from "@/hooks/use-professionals";

export function MaintenanceDetailProfessionals({ maintenance, canEdit, onUpdate }) {
  const [showDialog, setShowDialog] = useState(false);
  const { professionals, isLoading } = useProfessionalsById(
    maintenance.assignedToProfessionals || []
  );

  const handleRemoveProfessional = async (professionalId: string) => {
    if (!confirm("Remove this professional from the task?")) return;

    const updatedIds = (maintenance.assignedToProfessionals || []).filter(
      (id) => id !== professionalId
    );

    await onUpdate({ assignedToProfessionals: updatedIds });
  };

  const handleAssign = async (professionalIds: string[], instructions: string) => {
    await onUpdate({
      assignedToProfessionals: professionalIds,
      instructions,
    });
  };

  return (
    <div className="border rounded-lg p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">Assigned Professionals</h3>
        {canEdit && (
          <button
            onClick={() => setShowDialog(true)}
            className="text-sm text-primary hover:underline"
          >
            {professionals.length > 0 ? "Manage" : "Assign"}
          </button>
        )}
      </div>

      {isLoading ? (
        <p className="text-sm text-muted-foreground">Loading...</p>
      ) : professionals.length > 0 ? (
        <ProfessionalChips
          professionals={professionals}
          onRemove={canEdit ? handleRemoveProfessional : undefined}
          editable={canEdit}
          size="lg"
        />
      ) : (
        <p className="text-sm text-muted-foreground italic">
          No professionals assigned yet
        </p>
      )}

      {canEdit && (
        <AssignProfessionalsDialog
          isOpen={showDialog}
          onClose={() => setShowDialog(false)}
          onAssign={handleAssign}
          currentlyAssigned={maintenance.assignedToProfessionals}
          divisionId={maintenance.divisionId}
        />
      )}
    </div>
  );
}
```

---

## Styling & Theming

All components use Tailwind CSS with CSS variables for theming. They automatically adapt to your theme:

- `bg-primary` / `text-primary` - Primary color
- `bg-background` / `text-foreground` - Background/text
- `bg-muted` / `text-muted-foreground` - Muted colors
- `border-input` - Input borders
- `ring-ring` - Focus rings

---

## Accessibility

All components are built with accessibility in mind:

- ✅ Keyboard navigation
- ✅ ARIA labels
- ✅ Focus management
- ✅ Screen reader support
- ✅ Semantic HTML

---

## Testing

### Unit Tests (Example)
```tsx
import { render, screen, fireEvent } from "@testing-library/react";
import { MultiSelectDropdown } from "@/components/common/MultiSelectDropdown";

test("allows selecting multiple options", () => {
  const onChange = jest.fn();
  const options = [
    { id: "1", name: "John" },
    { id: "2", name: "Jane" },
  ];

  render(
    <MultiSelectDropdown
      options={options}
      selected={[]}
      onChange={onChange}
    />
  );

  // Click dropdown
  fireEvent.click(screen.getByText("Select items..."));

  // Select first option
  fireEvent.click(screen.getByText("John"));
  expect(onChange).toHaveBeenCalledWith(["1"]);

  // Select second option
  fireEvent.click(screen.getByText("Jane"));
  expect(onChange).toHaveBeenCalledWith(["1", "2"]);
});
```

---

## Performance Considerations

1. **Memoization:** All hooks use `useMemo` to prevent unnecessary re-renders
2. **Lazy Loading:** Options are only loaded when needed
3. **Virtual Scrolling:** For large lists (>100 items), consider adding virtual scrolling
4. **Debounced Search:** Search is instant but can be debounced for large datasets

---

## Migration from Single to Multiple

### Before (Single Professional)
```tsx
<select value={assignedTo} onChange={(e) => setAssignedTo(e.target.value)}>
  {professionals.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
</select>
```

### After (Multiple Professionals)
```tsx
<MultiSelectDropdown
  options={professionals.map(p => ({ id: p.id, name: p.name }))}
  selected={assignedToProfessionals}
  onChange={setAssignedToProfessionals}
/>
```

### Backward Compatibility
```tsx
// Support both single and multiple
const professionalIds = assignedToProfessionals || (assignedTo ? [assignedTo] : []);
```

---

## Common Issues & Solutions

### Issue: Dropdown doesn't close
**Solution:** Ensure `dropdownRef` is properly attached and click-outside handler is working.

### Issue: Selected professionals not showing
**Solution:** Check that `useProfessionalsById` is receiving valid IDs and users are loaded.

### Issue: Can't select professionals from other divisions
**Solution:** Remove or adjust `divisionId` filter in `useProfessionalsAsOptions`.

### Issue: Assignment fails silently
**Solution:** Check browser console for errors and ensure backend is running.

---

## Next Steps

1. ✅ Components created
2. ✅ Hooks created
3. ⏳ Integrate into existing pages
4. ⏳ Test end-to-end flow
5. ⏳ Add unit tests
6. ⏳ Update documentation

---

**Status:** Components Ready ✅ | Integration Pending ⏳  
**Date:** May 16, 2026  
**Version:** 1.1.0

