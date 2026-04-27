# System Settings Enhancement Plan

## Overview
Enhance the System Settings page (`/admin/config`) to make all features fully functional with backend integration.

## Current Features (Already Implemented)

### 1. ✅ Status Workflow Management
- **Location**: Status Management tab
- **Features**:
  - View status workflows for Projects, Bookings, Maintenance
  - 11 statuses per workflow
  - Visual status progression
  - Add new status capability (UI only)
- **Status**: UI Complete, needs backend integration

### 2. ✅ Service Levels (SLA) / Priority Levels
- **Location**: Priority Levels tab
- **Features**:
  - 4 priority levels: Critical, High, Medium, Low
  - SLA targets: 2h, 8h, 24h, 72h
  - Color coding for each priority
  - Editable SLA times and colors
- **Status**: UI Complete, needs backend integration

### 3. ✅ Notification Rules
- **Location**: Notification Templates tab
- **Features**:
  - 6 notification templates
  - Multi-channel support (Email, SMS, In-App)
  - Enable/disable toggles
  - Trigger-based notifications
- **Status**: UI Complete, needs backend integration

### 4. ✅ General Settings
- **Location**: System Settings tab
- **Features**:
  - System name configuration
  - Admin email
  - Max file size (MB)
  - Session timeout (hours)
  - Feature toggles (5 features)
- **Status**: UI Complete, needs backend integration

## Enhancement Tasks

### Phase 1: Backend API Integration

#### A. Status Workflow API
```typescript
// GET /api/admin/config/workflows
// POST /api/admin/config/workflows
// PATCH /api/admin/config/workflows/:id
// DELETE /api/admin/config/workflows/:id
```

#### B. SLA/Priority API
```typescript
// GET /api/admin/config/priorities
// PATCH /api/admin/config/priorities/:id
```

#### C. Notification Rules API
```typescript
// GET /api/admin/config/notifications
// POST /api/admin/config/notifications
// PATCH /api/admin/config/notifications/:id
// DELETE /api/admin/config/notifications/:id
```

#### D. General Settings API
```typescript
// GET /api/admin/config/settings
// PATCH /api/admin/config/settings
```

### Phase 2: Frontend Enhancements

#### A. Status Workflow
- [ ] Add drag-and-drop reordering
- [ ] Add status creation modal
- [ ] Add status editing
- [ ] Add status deletion with confirmation
- [ ] Add status color customization
- [ ] Add status description field
- [ ] Save to backend

#### B. SLA/Priority Levels
- [ ] Real-time SLA tracking
- [ ] SLA breach notifications
- [ ] SLA reports and analytics
- [ ] Custom SLA rules per division
- [ ] Escalation rules
- [ ] Save to backend

#### C. Notification Rules
- [ ] Template editor with variables
- [ ] Preview notification
- [ ] Test send functionality
- [ ] Conditional rules (if/then)
- [ ] User role targeting
- [ ] Schedule notifications
- [ ] Save to backend

#### D. General Settings
- [ ] File type restrictions
- [ ] Backup/restore settings
- [ ] Audit log settings
- [ ] Security settings
- [ ] Integration settings
- [ ] Save to backend

### Phase 3: Advanced Features

#### A. Workflow Automation
- [ ] Auto-assignment rules
- [ ] Auto-escalation rules
- [ ] Auto-closure rules
- [ ] Conditional workflows

#### B. SLA Dashboard
- [ ] SLA compliance metrics
- [ ] Breach alerts
- [ ] Performance trends
- [ ] Team SLA performance

#### C. Notification Center
- [ ] Notification history
- [ ] Delivery status tracking
- [ ] Failed notification retry
- [ ] Notification analytics

#### D. System Health
- [ ] System status dashboard
- [ ] Performance metrics
- [ ] Error logs
- [ ] Usage statistics

## Implementation Priority

### High Priority (Immediate)
1. ✅ Status Workflow - Already functional in UI
2. ✅ SLA/Priority Levels - Already functional in UI
3. ✅ Notification Rules - Already functional in UI
4. ✅ General Settings - Already functional in UI

### Medium Priority (Next Sprint)
1. Backend API integration for all features
2. Data persistence
3. Real-time updates

### Low Priority (Future)
1. Advanced automation
2. Analytics and reporting
3. Integration with external systems

## Current Status

### ✅ Completed
- [x] Status Workflow UI
- [x] Priority Levels UI
- [x] Notification Templates UI
- [x] General Settings UI
- [x] Feature Toggles UI
- [x] Tab navigation
- [x] Save confirmation messages
- [x] Responsive design

### 🔄 In Progress
- [ ] Backend API development
- [ ] Data persistence
- [ ] Real-time updates

### ⏳ Pending
- [ ] Advanced features
- [ ] Analytics
- [ ] Automation rules

## Usage Guide

### Accessing System Settings
1. Login as Admin
2. Navigate to **Admin** → **System Settings**
3. Use tabs to switch between features

### Status Workflow
1. Click **Status Management** tab
2. View workflows for Projects, Bookings, Maintenance
3. Click **Add Status** to create new status
4. Click **Save Changes** to persist

### Priority Levels (SLA)
1. Click **Priority Levels** tab
2. Edit SLA targets (hours)
3. Change priority colors
4. Click **Save Priority Settings**

### Notification Rules
1. Click **Notification Templates** tab
2. Toggle templates on/off
3. Click **Edit** to modify template
4. Click **Save All Templates**

### General Settings
1. Click **System Settings** tab
2. Update general settings (left panel)
3. Toggle features on/off (right panel)
4. Click **Save** buttons

## Technical Details

### State Management
```typescript
const [systemSettings, setSystemSettings] = useState({
  siteName: "INSA BuildMS",
  adminEmail: "admin@insa.gov.et",
  maxFileSize: "10",
  sessionTimeout: "8",
  enableNotifications: true,
  enableEmailAlerts: true,
  enableSMSAlerts: false,
  autoAssign: false,
  requireBudget: true,
});
```

### Feature Toggles
- `enableNotifications` - In-app notification bell
- `enableEmailAlerts` - Email notifications on status changes
- `enableSMSAlerts` - SMS for critical updates
- `autoAssign` - Auto-assign to available technicians
- `requireBudget` - Require budget for project approval

### Notification Channels
- **Email** - Send via SMTP
- **SMS** - Send via SMS gateway
- **In-App** - Show in notification bell

### SLA Targets
- **Critical**: 2 hours
- **High**: 8 hours
- **Medium**: 24 hours
- **Low**: 72 hours

## Benefits

### For Administrators
✅ Full control over system behavior  
✅ Customize workflows per module  
✅ Configure SLA targets  
✅ Manage notification rules  
✅ Toggle features on/off  

### For Users
✅ Consistent status progression  
✅ Timely notifications  
✅ Clear priority levels  
✅ Predictable system behavior  

### For Organization
✅ Compliance with SLA commitments  
✅ Improved response times  
✅ Better communication  
✅ Audit trail of changes  

## Next Steps

1. **Review current implementation** - All UI features are complete
2. **Test functionality** - Verify all toggles and settings work
3. **Backend integration** - Connect to API endpoints
4. **Data persistence** - Save settings to database
5. **Real-time updates** - Broadcast changes to all users

---

**Status**: ✅ **All UI Features Complete and Functional**  
**Date**: April 26, 2026  
**Ready for**: Backend Integration
