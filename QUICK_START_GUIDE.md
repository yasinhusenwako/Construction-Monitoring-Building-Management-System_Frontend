# CSBMS Quick Start Guide

## 🚀 Getting Started in 5 Minutes

### 1. Start Services
```bash
# Terminal 1 - Keycloak
cd Frontend
docker-compose -f docker-compose.keycloak.yml up

# Terminal 2 - Backend
cd Backend
./mvnw spring-boot:run

# Terminal 3 - Frontend
cd Frontend
npm run dev
```

### 2. Access System
- **Frontend:** http://localhost:3000
- **Backend:** http://localhost:8081
- **Keycloak:** http://localhost:8090

### 3. Login Credentials
```
Admin:        admin@gmail.com / Admin@123
User:         user@gmail.com / User@123
Supervisor 1: director1@gmail.com / Supervisor@123
Professional: professional1@gmail.com / Professional@123
```

---

## 📋 Common Tasks

### Create Maintenance Request (as User)
1. Login as user@gmail.com
2. Click "Maintenance" → "New Request"
3. Fill form and submit
4. View in "My Requests"

### Assign to Division (as Admin)
1. Login as admin@gmail.com
2. Go to "All Requests" → "Maintenance"
3. Click request → "Assign to Division"
4. Select Division 1 (DIV-001)
5. Click "Assign"

### Create Work Order (as Supervisor)
1. Login as director1@gmail.com
2. Go to "Task Management"
3. Click request → "Create Work Order"
4. Assign to professional1@gmail.com

### Complete Work (as Professional)
1. Login as professional1@gmail.com
2. Go to "My Tasks"
3. Click "Start Work" → "Complete Work"

---

## 🔧 Troubleshooting

### Issue: Can't login
**Solution:** Check Keycloak is running on port 8090

### Issue: No tasks showing
**Solution:** Hard refresh browser (Ctrl+Shift+R)

### Issue: Division not set
**Solution:** Verify user has divisionId in Keycloak

### Issue: Wrong professionals showing
**Solution:** Check user's divisionId matches professional's divisionId

---

## 📚 Key Documentation

- **Complete Fixes:** `Frontend/FIXES_APPLIED.md`
- **Project Summary:** `PROJECT_FINALIZATION_SUMMARY.md`
- **Division Setup:** `Frontend/KEYCLOAK_DIVISION_STRUCTURE.md`
- **API Integration:** `Frontend/FRONTEND_API_INTEGRATION.md`

---

## 🎯 Division Structure Quick Reference

| Division | ID | Supervisor | Professional | Handles |
|----------|-----|------------|--------------|---------|
| Admin | OTHER | N/A | professional@gmail.com | Projects & Bookings |
| Division 1 | DIV-001 | director1@gmail.com | professional1@gmail.com | Maintenance |
| Division 2 | DIV-002 | director2@gmail.com | professional2@gmail.com | Maintenance |
| Division 3 | DIV-003 | director3@gmail.com | professional3@gmail.com | Maintenance |

---

## ✅ System Status

**All Systems:** ✅ Operational
**Authentication:** ✅ Keycloak Integrated
**Division Isolation:** ✅ Enforced
**Workflows:** ✅ Validated
**Security:** ✅ Implemented

**Version:** 1.0.0
**Status:** Production Ready
