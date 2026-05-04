# CSBMS Project - Current Status

## ✅ System Overview
The Campus Building Management System (CSBMS) is fully operational with Keycloak authentication.

## 🔐 Authentication
- **System**: Keycloak 26.0.7
- **URL**: http://localhost:8080
- **Realm**: csbms
- **Users**: Managed via Keycloak Admin Console

## 👥 User Roles
1. **Admin** - Full system access
2. **Supervisor** - Division-specific management
3. **Professional** - Task execution
4. **User** - Request submission

## 📋 Request Types
1. **Projects** (A1-A5 classifications)
2. **Bookings** (B1: Office Allocation, B2: Hall/Lab Booking)
3. **Maintenance** (3 divisions)

## 🏢 Divisions
- **DIV-001**: Electromechanical Maintenance (Power Supply)
- **DIV-002**: Facility Administration
- **DIV-003**: Infrastructure Development & Building Maintenance

## 🚀 Quick Start

### Start Backend
```bash
cd Backend
START_BACKEND_KEYCLOAK.bat
```

### Start Frontend
```bash
cd Frontend
npm run dev
```

### Access Application
- **Frontend**: http://localhost:3000
- **Keycloak**: http://localhost:8080

## 📚 Documentation
- **Keycloak Setup**: `KEYCLOAK_QUICK_START.md`
- **Keycloak Reference**: `KEYCLOAK_QUICK_REFERENCE.md`

## ✅ Completed Features
- ✅ Keycloak authentication integration
- ✅ User management (CRUD)
- ✅ Division-based access control
- ✅ Professional assignment workflows
- ✅ Cost tracking for tasks
- ✅ File upload/download
- ✅ Timeline tracking
- ✅ Status workflows
- ✅ Notifications (database users)

## 🔧 Known Limitations
- Notifications work for database users only (Keycloak users pending migration)
- Division IDs must be in format: DIV-001, DIV-002, DIV-003

## ⚠️ Configuration Required

### Supervisor Division ID Setup
If supervisor dashboard shows no data:
1. **Issue**: Supervisor's divisionId in Keycloak may be set to "1" instead of "DIV-001"
2. **Solution**: Update in Keycloak Admin Console → Users → [Supervisor] → Attributes
3. **Change**: divisionId from "1" to "DIV-001" (or DIV-002, DIV-003 as appropriate)
4. **Important**: User must log out and log back in after the change
5. **Detailed Guide**: See `docs/FIX_SUPERVISOR_DIVISION.md`

## 📝 Important Notes
1. Always use `DIV-001`, `DIV-002`, `DIV-003` format for divisions
2. Professional IDs are emails (e.g., professional@gmail.com)
3. Supervisor must have correct divisionId in Keycloak attributes
4. Backend must be running before starting frontend

## 🆘 Troubleshooting
See `KEYCLOAK_QUICK_START.md` for common issues and solutions.

---

**Last Updated**: May 1, 2026  
**Version**: 1.0  
**Status**: Production Ready ✅
