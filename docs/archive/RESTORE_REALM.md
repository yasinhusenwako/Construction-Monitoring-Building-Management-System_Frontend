# Restore INSA Realm in Keycloak

## What Happened
When we ran `docker-compose down -v`, it removed all Docker volumes including your existing Keycloak database with the INSA realm configuration. We need to re-import it.

## Steps to Restore

### Step 1: Access Keycloak Admin Console

1. Open browser: http://localhost:8090
2. Click **"Administration Console"**
3. Login with:
   - Username: `admin`
   - Password: `admin`

### Step 2: Import INSA Realm

1. Click the dropdown at **top-left** (currently shows "master")
2. Click **"Create Realm"**
3. Click **"Browse"** button
4. Navigate to and select: `Frontend/keycloak-insa-realm-template.json`
5. Click **"Create"**

### Step 3: Verify Import

1. The dropdown should now show **"insa"** realm
2. Click on "insa" to switch to that realm
3. Go to **"Users"** in the left menu
4. You should see 4 users:
   - admin@insa.gov.et
   - user@insa.gov.et
   - supervisor@insa.gov.et
   - professional@insa.gov.et

### Step 4: Test Login

1. Open a new **Incognito/Private window**
2. Go to: http://localhost:3000
3. You should be redirected to Keycloak login
4. Login with:
   - Email: `admin@insa.gov.et`
   - Password: `Admin@123` ⚠️ (Note: Capital A)

## Correct User Credentials

⚠️ **Important**: The passwords in the template are different from what was mentioned earlier!

| Email | Password | Role |
|-------|----------|------|
| admin@insa.gov.et | **Admin@123** | ADMIN |
| user@insa.gov.et | **User@123** | USER |
| supervisor@insa.gov.et | **Supervisor@123** | SUPERVISOR |
| professional@insa.gov.et | **Professional@123** | PROFESSIONAL |

**Note**: All passwords start with capital letters!

## If You Had Custom Users

If you had created additional users in your previous INSA realm, you'll need to recreate them:

1. Switch to "insa" realm
2. Go to **"Users"** → **"Add user"**
3. Fill in the details
4. Click **"Create"**
5. Go to **"Credentials"** tab
6. Set password and uncheck "Temporary"
7. Go to **"Role mapping"** tab
8. Assign appropriate role (ADMIN, USER, SUPERVISOR, or PROFESSIONAL)

## Alternative: Use Your Previous Backup

If you have a backup of your previous realm configuration:
1. Go to Keycloak Admin Console
2. Switch to "master" realm
3. Click **"Create Realm"**
4. Import your backup JSON file instead

## Troubleshooting

### Can't Login to Keycloak Admin Console
- Make sure you're using: `admin` / `admin`
- These are the Keycloak master realm admin credentials
- Not the INSA realm credentials

### Realm Import Fails
- Make sure the file path is correct
- The file should be: `Frontend/keycloak-insa-realm-template.json`
- Check Docker logs: `docker logs insa-keycloak`

### Login to Application Fails
- Make sure you imported the realm
- Make sure you're using the correct password (capital letters!)
- Clear browser cache or use Incognito window
- Check that you're in the "insa" realm, not "master"

## Next Steps

After importing the realm:
1. ✅ Test login with admin@insa.gov.et / Admin@123
2. ✅ Verify you can access the dashboard
3. ✅ Test other user roles if needed
4. ✅ Recreate any custom users you had before

---

**Date**: May 2, 2026
