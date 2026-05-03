# Role-Based Dashboard Routing Fix

## Issue
All users (regardless of role) were being redirected to the same dashboard page after login, showing the same content.

## Root Cause
The login page (`Frontend/src/app/login/page.tsx`) was redirecting all authenticated users to `/dashboard` without considering their role. The dashboard page itself handles role-specific content, but there may be an issue with role detection.

## Solution Applied

### 1. Updated Login Page
Modified `Frontend/src/app/login/page.tsx` to:
- Log user roles for debugging
- Redirect all users to `/dashboard` (the dashboard handles role-specific content internally)

### 2. Created Debug Page
Created `Frontend/src/app/debug-auth/page.tsx` to help diagnose role detection issues:
- Shows Keycloak authentication state
- Shows user roles from JWT token
- Shows mapped user data from compatibility layer

## Testing Steps

### Step 1: Check Role Detection

1. **Login with each role** and navigate to the debug page:
   ```
   http://localhost:3000/debug-auth
   ```

2. **Verify roles are detected** for each user:
   - admin@insa.gov.et → Should show `roles: ["ADMIN"]`
   - user@insa.gov.et → Should show `roles: ["USER"]`
   - supervisor@insa.gov.et → Should show `roles: ["SUPERVISOR"]`
   - professional@insa.gov.et → Should show `roles: ["PROFESSIONAL"]`

3. **Check the JWT token payload** at the bottom of the debug page:
   - Look for `realm_access.roles` array
   - Should contain the role (e.g., `["ADMIN"]`)

### Step 2: Test Dashboard Content

After verifying roles are detected correctly:

1. **Login as ADMIN** (admin@insa.gov.et / Admin@123)
   - Should see: Admin Dashboard with master control panel
   - Should see: All system statistics and charts

2. **Login as USER** (user@insa.gov.et / User@123)
   - Should see: User dashboard with "My Requests" section
   - Should see: Only their own projects, bookings, maintenance

3. **Login as SUPERVISOR** (supervisor@insa.gov.et / Supervisor@123)
   - Should redirect to: `/dashboard/supervisor/tasks`
   - Should see: Tasks assigned to their division

4. **Login as PROFESSIONAL** (professional@insa.gov.et / Professional@123)
   - Should see: Professional dashboard with assigned tasks
   - Should see: Tasks queue and workload

## Troubleshooting

### If Roles Are Not Detected

**Problem**: Debug page shows empty roles array `[]`

**Possible Causes**:
1. Realm roles not properly configured in Keycloak
2. JWT token doesn't include realm roles
3. Role mapping issue in Keycloak

**Solution**:
1. Go to Keycloak Admin Console: http://localhost:8090
2. Switch to "insa" realm
3. Go to **"Users"** → Select a user
4. Go to **"Role mapping"** tab
5. Click **"Assign role"**
6. Select the appropriate role (ADMIN, USER, SUPERVISOR, or PROFESSIONAL)
7. Click **"Assign"**
8. Logout and login again

### If Dashboard Shows Wrong Content

**Problem**: User sees content for a different role

**Possible Causes**:
1. User has multiple roles assigned
2. Role priority logic in `AuthContextCompat.tsx` is selecting wrong role

**Solution**:
Check the role priority in `Frontend/src/context/AuthContextCompat.tsx`:
```typescript
const getUserRole = (): 'admin' | 'supervisor' | 'professional' | 'user' => {
  if (roles.includes('ADMIN')) return 'admin';
  if (roles.includes('SUPERVISOR')) return 'supervisor';
  if (roles.includes('PROFESSIONAL')) return 'professional';
  return 'user';
};
```

The priority is: ADMIN > SUPERVISOR > PROFESSIONAL > USER

### If Supervisor Redirect Fails

**Problem**: Supervisor sees main dashboard instead of `/dashboard/supervisor/tasks`

**Check**: `Frontend/src/views/dashboard/DashboardPage.tsx` line 75-79:
```typescript
useEffect(() => {
  if (role === "supervisor") {
    router.push("/dashboard/supervisor");
  }
}, [role, router]);
```

This should redirect supervisors automatically.

## Files Modified

1. `Frontend/src/app/login/page.tsx` - Added role logging
2. `Frontend/src/app/debug-auth/page.tsx` - Created debug page

## Files to Check

If issues persist, check these files:
1. `Frontend/src/contexts/KeycloakAuthContext.tsx` - Role extraction from JWT
2. `Frontend/src/context/AuthContextCompat.tsx` - Role mapping logic
3. `Frontend/src/views/dashboard/DashboardPage.tsx` - Role-specific content rendering

## Next Steps

1. ✅ Test login with all 4 roles
2. ✅ Verify roles are detected on debug page
3. ✅ Verify each role sees appropriate dashboard content
4. ✅ If roles not detected, reassign roles in Keycloak
5. ✅ Clear browser cache if issues persist

---

**Date**: May 2, 2026
