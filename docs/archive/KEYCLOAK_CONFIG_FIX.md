# Keycloak Configuration Fix - Redirect Loop Issue

## Issue
Frontend was experiencing an infinite redirect loop with error:
```
431 (Request Header Fields Too Large)
```

The URL was recursively encoding itself because Keycloak configuration was missing:
- Empty realm name: `/realms//protocol`
- Empty client_id: `client_id=&`
- Recursive redirect_uri encoding

## Root Cause
The `.env.local` file was missing Keycloak environment variables:
- `NEXT_PUBLIC_KEYCLOAK_URL`
- `NEXT_PUBLIC_KEYCLOAK_REALM`
- `NEXT_PUBLIC_KEYCLOAK_CLIENT_ID`

## Solution Applied

### Updated `.env.local`
Added the missing Keycloak configuration:

```env
NEXT_PUBLIC_API_BASE_URL=http://localhost:8081

# Keycloak Configuration
NEXT_PUBLIC_KEYCLOAK_URL=http://localhost:8090
NEXT_PUBLIC_KEYCLOAK_REALM=insa
NEXT_PUBLIC_KEYCLOAK_CLIENT_ID=insa-frontend

# Environment
NODE_ENV=development
```

## Next Steps

**IMPORTANT:** You must restart the frontend for the changes to take effect:

1. Stop the current frontend process (Ctrl+C in the terminal running `npm run dev`)
2. Start it again:
   ```bash
   cd Frontend
   npm run dev
   ```

3. Clear your browser cache or open an incognito window to avoid cached redirect loops

4. Navigate to `http://localhost:3000`

## Verification
After restarting, the login should redirect to:
```
http://localhost:8090/realms/insa/protocol/openid-connect/auth?client_id=insa-frontend&...
```

Notice:
- ✅ Realm name is present: `/realms/insa/`
- ✅ Client ID is present: `client_id=insa-frontend`
- ✅ No recursive encoding

## Date Fixed
May 2, 2026
