# System Settings Implementation

## Overview
System settings are now managed through a React Context that persists settings to localStorage and makes them available throughout the application.

## How It Works

### 1. SystemSettingsContext
Located at `src/context/SystemSettingsContext.tsx`

Provides:
- `settings` - Current system settings object
- `updateSettings(partial)` - Update one or more settings
- `refreshSettings()` - Reload settings from localStorage

### 2. Available Settings

```typescript
{
  siteName: string;           // System branding name
  adminEmail: string;         // Admin contact email
  maxFileSize: number;        // Max file upload size in MB
  sessionTimeout: number;     // Session timeout in hours
  enableNotifications: boolean;  // In-app notifications
  enableEmailAlerts: boolean;    // Email notifications
  enableSMSAlerts: boolean;      // SMS notifications (critical)
  autoAssign: boolean;           // Auto-assign technicians
  requireBudget: boolean;        // Require budget for projects
  statusWorkflows: {             // Workflow statuses for each stream
    project: WorkflowStatus[];
    booking: WorkflowStatus[];
    maintenance: WorkflowStatus[];
  };
}

type WorkflowStatus = {
  id: string;        // Unique identifier
  label: string;     // Display name
  order: number;     // Position in workflow
};
```

### 3. Usage in Components

```typescript
import { useSystemSettings } from '@/context/SystemSettingsContext';

function MyComponent() {
  const { settings, updateSettings } = useSystemSettings();
  
  // Read settings
  const maxSize = settings.maxFileSize;
  
  // Update settings
  updateSettings({ maxFileSize: 20 });
  
  return <div>{settings.siteName}</div>;
}
```

### 4. Admin Configuration Page
Located at `src/views/admin/ConfigPage.tsx`

Features:
- **General Settings** - Site name, email, file size, session timeout
- **Feature Toggles** - Enable/disable system features
- **Status Workflow** - ✅ Manage workflow statuses (add, edit, delete, reorder)
- **Priority Levels** - Configure priority levels and SLAs (not yet implemented)
- **Notification Templates** - Manage notification templates (not yet implemented)

## Current Limitations

### ⚠️ localStorage Only
Settings are currently stored in browser localStorage. This means:
- Settings are per-browser/device
- Not synced across users or devices
- Lost if browser data is cleared

### 🔄 Backend API Needed
To make settings truly system-wide, we need to:

1. **Create Backend Entity**
```java
@Entity
@Table(name = "system_settings")
public class SystemSetting {
    @Id
    private String key;
    private String value;
    private String type; // string, number, boolean
}
```

2. **Create Backend Controller**
```java
@RestController
@RequestMapping("/api/system/settings")
public class SystemSettingsController {
    @GetMapping
    public Map<String, Object> getSettings() { }
    
    @PutMapping
    public void updateSettings(@RequestBody Map<String, Object> settings) { }
}
```

3. **Update Frontend Context**
```typescript
// Fetch from API instead of localStorage
const response = await apiRequest('/api/system/settings');
setSettings(response);

// Save to API instead of localStorage
await apiRequest('/api/system/settings', {
  method: 'PUT',
  body: newSettings
});
```

## Examples of Settings Usage

### File Upload Size Limit
```typescript
const { settings } = useSystemSettings();

if (file.size > settings.maxFileSize * 1024 * 1024) {
  alert(`File too large. Max size: ${settings.maxFileSize}MB`);
}
```

### Conditional Features
```typescript
const { settings } = useSystemSettings();

{settings.enableNotifications && (
  <NotificationBell />
)}

{settings.requireBudget && (
  <BudgetField required />
)}
```

### Session Timeout
```typescript
const { settings } = useSystemSettings();

const sessionDuration = settings.sessionTimeout * 60 * 60 * 1000; // Convert to ms
setTimeout(logout, sessionDuration);
```

## Future Enhancements

1. **Backend Persistence** - Store in database
2. **Role-based Settings** - Different settings per role
3. **Setting History** - Track changes and who made them
4. **Setting Validation** - Validate settings before saving
5. **Setting Categories** - Group related settings
6. **Import/Export** - Backup and restore settings
7. **Default Reset** - Reset to factory defaults

## Testing

1. Go to `/admin/config`
2. Click "General Settings" tab
3. Change "System Branding Name" to "Test System"
4. Click "Update Site Parameters"
5. Refresh the page
6. Verify the setting persisted

## Related Documentation
- [Status Workflow Management](./STATUS_WORKFLOW.md) - Detailed guide for managing workflow statuses

## Notes

- Settings are loaded on app startup via SystemSettingsProvider
- Settings update immediately when changed (no page refresh needed)
- Toggle switches update settings instantly
- Text fields update on save button click
- All settings are type-safe via TypeScript
