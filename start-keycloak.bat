@echo off
echo Starting Keycloak for CSBMS...
echo.

REM Set environment variables
set KEYCLOAK_DB_PASSWORD=keycloak_db_password
set KEYCLOAK_ADMIN_USERNAME=admin
set KEYCLOAK_ADMIN_PASSWORD=admin

echo Environment variables set:
echo - KEYCLOAK_DB_PASSWORD: %KEYCLOAK_DB_PASSWORD%
echo - KEYCLOAK_ADMIN_USERNAME: %KEYCLOAK_ADMIN_USERNAME%
echo - KEYCLOAK_ADMIN_PASSWORD: %KEYCLOAK_ADMIN_PASSWORD%
echo.

echo Starting Docker containers...
docker-compose -f docker-compose.keycloak.yml up -d

echo.
echo Waiting for Keycloak to start (this may take 30-60 seconds)...
timeout /t 10 /nobreak >nul

echo.
echo Checking container status...
docker ps | findstr keycloak

echo.
echo ========================================
echo Keycloak should be starting up now!
echo ========================================
echo.
echo To check logs: docker logs -f insa-keycloak
echo To access Keycloak: http://localhost:8090
echo Admin credentials: admin / admin
echo.
echo After Keycloak starts, import the realm:
echo 1. Go to http://localhost:8090
echo 2. Login with admin/admin
echo 3. Create Realm and import: keycloak-insa-realm-template.json
echo.
pause
