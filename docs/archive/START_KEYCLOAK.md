# Starting Keycloak for CSBMS

## Prerequisites
- Docker Desktop installed and running
- Ports 8090 and 5433 available

## Quick Start

### Option 1: Using Docker Compose (Recommended)

1. **Navigate to Frontend directory:**
   ```bash
   cd Frontend
   ```

2. **Start Keycloak:**
   ```bash
   docker-compose -f docker-compose.keycloak.yml --env-file .env.keycloak up -d
   ```

3. **Check if Keycloak is running:**
   ```bash
   docker ps
   ```
   You should see `insa-keycloak` and `insa-keycloak-db` containers running.

4. **Wait for Keycloak to fully start** (about 30-60 seconds)
   ```bash
   docker logs -f insa-keycloak
   ```
   Wait until you see: "Keycloak ... started"

5. **Access Keycloak Admin Console:**
   - URL: http://localhost:8090
   - Username: `admin`
   - Password: `admin`

### Option 2: Using the Batch Script (Windows)

If there's a batch script available:
```bash
cd Backend
START_BACKEND_KEYCLOAK.bat
```

## Verify Keycloak is Running

1. **Check the port:**
   ```bash
   netstat -ano | findstr :8090
   ```
   Should show a process listening on port 8090.

2. **Access the URL:**
   Open browser: http://localhost:8090
   You should see the Keycloak welcome page.

## Import INSA Realm

After Keycloak starts, you need to import the INSA realm configuration:

1. **Login to Keycloak Admin Console:**
   - URL: http://localhost:8090
   - Username: `admin`
   - Password: `admin`

2. **Import Realm:**
   - Click on the dropdown at top-left (currently shows "master")
   - Click "Create Realm"
   - Click "Browse" and select: `Frontend/keycloak-insa-realm-template.json`
   - Click "Create"

3. **Verify Realm:**
   - You should now see "insa" in the realm dropdown
   - The realm should have:
     - Client: `insa-frontend`
     - Users: admin@insa.gov.et, user1@gmail.com, professional@insa.gov.et, supervisor@insa.gov.et
     - Roles: ADMIN, USER, PROFESSIONAL, SUPERVISOR

## Test Users

After importing the realm, you can login with:

| Email | Password | Role |
|-------|----------|------|
| admin@insa.gov.et | admin123 | ADMIN |
| user1@gmail.com | user123 | USER |
| professional@insa.gov.et | prof123 | PROFESSIONAL |
| supervisor@insa.gov.et | super123 | SUPERVISOR |

## Troubleshooting

### Port 8090 Already in Use
```bash
# Find the process using port 8090
netstat -ano | findstr :8090

# Kill the process (replace PID with actual process ID)
taskkill /PID <PID> /F
```

### Keycloak Container Won't Start
```bash
# Check logs
docker logs insa-keycloak

# Restart containers
docker-compose -f docker-compose.keycloak.yml --env-file .env.keycloak down
docker-compose -f docker-compose.keycloak.yml --env-file .env.keycloak up -d
```

### Database Connection Issues
```bash
# Check if PostgreSQL container is running
docker ps | findstr keycloak-db

# Check database logs
docker logs insa-keycloak-db
```

### Reset Everything
```bash
# Stop and remove containers, volumes, and networks
docker-compose -f docker-compose.keycloak.yml --env-file .env.keycloak down -v

# Start fresh
docker-compose -f docker-compose.keycloak.yml --env-file .env.keycloak up -d
```

## Stopping Keycloak

```bash
cd Frontend
docker-compose -f docker-compose.keycloak.yml down
```

To also remove the database volume:
```bash
docker-compose -f docker-compose.keycloak.yml down -v
```

## Environment Variables

The `.env.keycloak` file contains:
- `KEYCLOAK_DB_PASSWORD`: Password for Keycloak's PostgreSQL database
- `KEYCLOAK_ADMIN_USERNAME`: Keycloak admin username (default: admin)
- `KEYCLOAK_ADMIN_PASSWORD`: Keycloak admin password (default: admin)

**Note:** Change these passwords in production!

## Next Steps

After Keycloak is running:
1. ✅ Backend should be running on port 8081
2. ✅ Frontend should be running on port 3000
3. ✅ Keycloak should be running on port 8090
4. Navigate to http://localhost:3000
5. You should be redirected to Keycloak login
6. Login with one of the test users
7. You should land on the CSBMS dashboard

## Architecture

```
Frontend (Port 3000)
    ↓
Keycloak (Port 8090) ← Authentication
    ↓
Backend (Port 8081)
    ↓
PostgreSQL (Port 5432) ← Application Database

Keycloak also uses:
PostgreSQL (Port 5433) ← Keycloak Database
```
