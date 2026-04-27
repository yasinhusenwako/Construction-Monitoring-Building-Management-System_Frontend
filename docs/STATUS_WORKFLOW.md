# Status Workflow Management

## Overview
The Status Workflow feature allows administrators to customize the workflow statuses for each request stream (Projects, Space Allocation, Maintenance) in the system.

## Features

### ✅ View Statuses
- See all statuses for each stream in order
- Statuses are numbered sequentially (1, 2, 3...)
- Each stream has its own independent workflow

### ✅ Add New Status
1. Click the "+ Add Status" button at the bottom of any stream
2. Enter the status name
3. Press Enter or click the checkmark to save
4. Press Escape or click X to cancel

### ✅ Edit Status
1. Hover over any status to reveal action buttons
2. Click the Edit icon (pencil)
3. Modify the status name
4. Press Enter or click checkmark to save
5. Press Escape or click X to cancel

### ✅ Delete Status
1. Hover over any status to reveal action buttons
2. Click the Delete icon (trash)
3. Confirm the deletion
4. Status is removed and remaining statuses are reordered

### ✅ Reorder Statuses
1. Use the up/down arrow buttons on the left of each status
2. Click up arrow to move status earlier in workflow
3. Click down arrow to move status later in workflow
4. Order numbers update automatically

### ✅ Save Changes
- Click "Save Changes" button at the bottom of each stream
- Changes are saved to system settings
- Success message appears confirming save

## Streams

### Stream A: Projects
Default workflow for project requests:
1. Submitted
2. Under Review
3. Assigned to Division Director
4. WorkOrder Created
5. Assigned to Professionals
6. In Progress
7. Completed
8. Reviewed
9. Approved
10. Rejected
11. Closed

### Stream B: Space Allocation (Booking)
Default workflow for space allocation requests:
1. Submitted
2. Under Review
3. Assigned to Division Director
4. WorkOrder Created
5. Assigned to Professionals
6. In Progress
7. Completed
8. Reviewed
9. Approved
10. Rejected
11. Closed

### Stream C: Maintenance
Default workflow for maintenance requests:
1. Submitted
2. Under Review
3. Assigned to Supervisor
4. WorkOrder Created
5. Assigned to Professionals
6. In Progress
7. Completed
8. Reviewed
9. Approved
10. Rejected
11. Closed

## Technical Details

### Data Structure
```typescript
type WorkflowStatus = {
  id: string;        // Unique identifier (lowercase with underscores)
  label: string;     // Display name
  order: number;     // Position in workflow (1, 2, 3...)
};

type StatusWorkflows = {
  project: WorkflowStatus[];
  booking: WorkflowStatus[];
  maintenance: WorkflowStatus[];
};
```

### Storage
- Statuses are stored in SystemSettingsContext
- Persisted to localStorage (browser-level)
- Key: `systemSettings.statusWorkflows`

### Context Usage
```typescript
import { useSystemSettings } from '@/context/SystemSettingsContext';

function MyComponent() {
  const { settings } = useSystemSettings();
  
  // Get project statuses
  const projectStatuses = settings.statusWorkflows.project;
  
  // Get maintenance statuses
  const maintenanceStatuses = settings.statusWorkflows.maintenance;
  
  return (
    <select>
      {projectStatuses.map(status => (
        <option key={status.id} value={status.label}>
          {status.label}
        </option>
      ))}
    </select>
  );
}
```

## UI Features

### Dark Mode Support
- All components support light/dark/system themes
- Uses Tailwind dark: variants
- Proper contrast in both modes

### Hover Effects
- Action buttons appear on hover
- Smooth transitions
- Visual feedback for all interactions

### Keyboard Shortcuts
- **Enter** - Save when editing/adding
- **Escape** - Cancel when editing/adding
- Arrow buttons for reordering

### Visual Indicators
- Order numbers (1, 2, 3...)
- Stream badges showing status count
- Color-coded action buttons (edit=blue, delete=red, save=green)
- Disabled state for arrows at boundaries

## Best Practices

### Status Naming
- Use clear, descriptive names
- Keep names concise (2-4 words)
- Use title case (e.g., "In Progress" not "in progress")
- Avoid special characters

### Workflow Design
- Start with "Submitted"
- Include review/approval stages
- End with terminal states (Approved, Rejected, Closed)
- Keep workflows consistent across streams when possible

### Order Management
- Place statuses in logical progression
- Group related statuses together
- Consider user roles at each stage
- Test workflow before deploying

## Limitations

### ⚠️ Current Limitations
1. **localStorage Only** - Settings are per-browser, not synced
2. **No Validation** - System doesn't prevent invalid workflows
3. **No History** - Can't undo changes or see change history
4. **No Permissions** - Any admin can modify workflows

### 🔄 Future Enhancements
1. **Backend API** - Store in database for system-wide settings
2. **Workflow Validation** - Ensure workflows are complete and valid
3. **Change History** - Track who changed what and when
4. **Role Permissions** - Restrict workflow editing to specific roles
5. **Status Dependencies** - Define which statuses can transition to others
6. **Status Colors** - Assign colors to statuses for visual distinction
7. **Status Icons** - Add icons to statuses for better UX
8. **Bulk Operations** - Import/export workflows, copy between streams

## Troubleshooting

### Changes Not Saving
- Check browser console for errors
- Verify localStorage is enabled
- Try clearing browser cache (Ctrl+Shift+R)

### Statuses Not Appearing
- Refresh the page
- Check SystemSettingsContext is properly initialized
- Verify settings are loaded in browser DevTools

### Order Not Updating
- Click Save Changes after reordering
- Refresh page to see persisted order
- Check console for errors

## Related Files
- `Frontend/src/context/SystemSettingsContext.tsx` - Context provider
- `Frontend/src/views/admin/ConfigPage.tsx` - Admin UI
- `Frontend/src/app/providers.tsx` - Context initialization
- `Frontend/docs/SYSTEM_SETTINGS.md` - General settings documentation
