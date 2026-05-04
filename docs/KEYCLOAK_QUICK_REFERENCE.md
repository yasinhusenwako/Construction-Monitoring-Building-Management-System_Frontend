# 🚀 Keycloak Quick Reference Card

**Status**: ✅ Fully Operational  
**Last Updated**: April 29, 2026

---

## 🎯 Quick Start (3 Steps)

### 1. Start Keycloak

```bash
cd Frontend
docker-compose -f docker-compose.keycloak.yml up -d
```

### 2. Start Backend

```bash
cd Backend
mvn spring-boot:run "-Dspring-boot.run.profiles=keycloak"
```

### 3. Start Frontend

```bash
cd Frontend
npm run dev
```

**Test**: http://localhost:3000/keycloak-test

---

## 📋 Service URLs

| Service            | URL                                 |
| ------------------ | ----------------------------------- |
| **Frontend**       | http://localhost:3000               |
| **Backend**        | http://localhost:8081               |
| **Keycloak**       | http://localhost:8090               |
| **Keycloak Admin** | http://localhost:8090/admin         |
| **Test Page**      | http://localhost:3000/keycloak-test |

---

## 👥 Test Users

| Email               | Password | Role         |
| ------------------- | -------- | ------------ |
| admin@gmail.com     | password | ADMIN        |
| director1@gmail.com | password | SUPERVISOR   |
| prof1@gmail.com     | password | PROFESSIONAL |
| user1@gmail.com     | password | USER         |

---

## 🔐 Client Credentials

### Backend (insa-backend)

- **Client ID**: `insa-backend`
- **Client Secret**: set via `KEYCLOAK_CLIENT_SECRET`

### Frontend (insa-frontend)

- **Client ID**: `insa-frontend`
- **Type**: Public (no secret)

---

## 🔧 Common Commands

### Check Services

```bash
# Check Keycloak
curl http://localhost:8090

# Check Backend
curl http://localhost:8081/actuator/health

# Check Frontend
curl http://localhost:3000

# Check Docker
docker ps | grep keycloak
```

### Stop Services

```bash
# Stop Keycloak
cd Frontend
docker-compose -f docker-compose.keycloak.yml down

# Stop Backend
# Press Ctrl+C in backend terminal

# Stop Frontend
# Press Ctrl+C in frontend terminal
```

### Restart Services

```bash
# Restart Keycloak
cd Frontend
docker-compose -f docker-compose.keycloak.yml restart

# Restart Backend
# Press Ctrl+C, then run again:
mvn spring-boot:run "-Dspring-boot.run.profiles=keycloak"

# Restart Frontend
# Press Ctrl+C, then run again:
npm run dev
```

### View Logs

```bash
# Keycloak logs
docker logs -f insa-keycloak

# Backend logs
# Visible in terminal where backend is running

# Frontend logs
# Visible in terminal where frontend is running
```

---

## 🐛 Quick Troubleshooting

### Issue: Connection Refused

**Solution**: Check service is running, verify port numbers

### Issue: 401 Unauthorized

**Solution**: Login again, token may have expired

### Issue: Keycloak not starting

**Solution**: Check Docker is running, check port 8090 is free

### Issue: Backend not starting

**Solution**: Check port 8081 is free, verify Keycloak is running

### Issue: Frontend errors

**Solution**: Restart frontend after environment variable changes

---

## 📚 Documentation

### Quick Guides

- `KEYCLOAK_FINAL_STATUS.md` - Complete status report
- `Frontend/KEYCLOAK_QUICK_START.md` - 5-minute quick start
- `Frontend/KEYCLOAK_README.md` - Overview

### Detailed Guides

- `Frontend/KEYCLOAK_SETUP_GUIDE.md` - Detailed setup
- `Backend/KEYCLOAK_PHASE2_COMPLETE.md` - Backend details
- `Frontend/KEYCLOAK_PHASE3_COMPLETE.md` - Frontend details

### Troubleshooting

- `Frontend/KEYCLOAK_TROUBLESHOOTING.md` - Common issues
- `Frontend/KEYCLOAK_PORT_FIX.md` - Port configuration

### Progress

- `Frontend/KEYCLOAK_INTEGRATION_PROGRESS.md` - Progress tracker
- `Frontend/KEYCLOAK_INTEGRATION_COMPLETE.md` - Completion report

---

## 💡 Quick Tips

### For Developers

- Use `useKeycloakAuth()` hook for authentication
- Use `<ProtectedRoute>` for protected pages
- Use `<RoleGuard>` for role-based UI
- Use `keycloak-api.ts` for API calls

### For Testing

- Test page: http://localhost:3000/keycloak-test
- Login with any test user
- Check browser console for debug info

### For Admins

- Admin console: http://localhost:8090/admin
- Login: set via `KEYCLOAK_ADMIN_USERNAME` and `KEYCLOAK_ADMIN_PASSWORD`
- Realm: insa

---

## 🎯 Next Steps

### Immediate

1. ✅ Test the integration
2. ⏳ Update existing pages with ProtectedRoute
3. ⏳ Replace old auth with Keycloak auth

### Short-term

1. ⏳ Migrate API calls to keycloak-api.ts
2. ⏳ Customize UI components
3. ⏳ Add role badges

### Long-term

1. ⏳ User migration (optional)
2. ⏳ Production deployment
3. ⏳ SSO expansion

---

## ✅ Status Check

Run this to verify everything is working:

```bash
# All should return success
curl http://localhost:8090 && echo "✅ Keycloak OK"
curl http://localhost:8081/actuator/health && echo "✅ Backend OK"
curl http://localhost:3000 && echo "✅ Frontend OK"
```

---

**Need Help?** Check `KEYCLOAK_FINAL_STATUS.md` for complete documentation.
