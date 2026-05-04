# 🚀 Quick Fix Instructions - Professional Dropdown

## The Issue
Professional dropdown shows: **"No professional users found"**

## The Solution (2 Steps)

### Step 1: Reimport Keycloak Realm
```bash
cd Frontend
docker-compose -f docker-compose.keycloak.yml down
rm -rf keycloak-data
docker-compose -f docker-compose.keycloak.yml up -d
```
⏱️ Wait 30 seconds for Keycloak to start

### Step 2: Test It
1. Open: http://localhost:3000
2. Login: admin@gmail.com / Admin@123
3. Go to: Projects → Click any "Submitted" project
4. Click: "Start Review"
5. Check: "Select Professional" dropdown
6. ✅ Should show: **"Admin Professional"**

## That's It!
The code was already correct. You just needed to reimport the Keycloak realm with the updated user attributes.

---

## User Credentials (After Reimport)

| Email | Password | Role | Division |
|-------|----------|------|----------|
| admin@gmail.com | Admin@123 | Admin | OTHER |
| professional@gmail.com | Professional@123 | Professional | OTHER |
| user@gmail.com | User@123 | User | 0 |
| director1@gmail.com | Supervisor@123 | Supervisor | DIV-001 |
| professional1@gmail.com | Professional@123 | Professional | DIV-001 |
| director2@gmail.com | Supervisor@123 | Supervisor | DIV-002 |
| professional2@gmail.com | Professional@123 | Professional | DIV-002 |
| director3@gmail.com | Supervisor@123 | Supervisor | DIV-003 |
| professional3@gmail.com | Professional@123 | Professional | DIV-003 |

**Note:** All passwords start with capital letter (e.g., Admin@123, not admin@123)

---

## Troubleshooting

### Still seeing "No professional users found"?
1. Clear browser cache or use incognito window
2. Check Keycloak is running: http://localhost:8090
3. Verify user exists in Keycloak:
   - Login to Keycloak admin: admin / admin
   - Select realm: **insa**
   - Go to: Users → View all users
   - Find: professional@gmail.com
   - Check attributes: divisionId should be **OTHER**

### Keycloak won't start?
```bash
# Check if port 8090 is already in use
netstat -ano | findstr :8090

# If in use, kill the process or change port in docker-compose.keycloak.yml
```

### Backend not connecting to Keycloak?
Check `Backend/.env` has:
```
KEYCLOAK_ADMIN_CLIENT_SECRET=6krziITC6UadIt5iTsKVuNZ5I976OwkM
```

---

## Need More Help?
Read the detailed documentation:
- `PROFESSIONAL_DROPDOWN_FIX.md` - Full technical details
- `FIXES_APPLIED.md` - All fixes applied to the system
- `FIX_SUMMARY_SESSION_2.md` - Complete session summary
