# User Profile Loading Fix

## Issue Identified
From the debug page output:
- ✅ Roles ARE detected correctly: `["ADMIN"]`
- ✅ JWT token contains all user information
- ❌ User profile is `null` - Keycloak's `loadUserProfile()` is failing
- ❌ Current User is `null` - Dashboard can't determine what to show

## Root Cause
The `KeycloakAuthContext` calls `keycloak.loadUserProfile()` which is failing silently, causing the user object to remain `null`. However, all the user information is already available in the JWT token payload.

## Solution Applied

### Modified `AuthContextCompat.tsx`

Added fallback to extract user information directly from JWT token:

```typescript
// Extract user info from JWT token if profile loading failed
const getUserInfoFromToken = () => {
  if (!token) return null;
  
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return {
      email: payload.email || payload.preferred_username,
      username: payload.preferred_username,
      firstName: payload.given_name,
      lastName: payload.family_name,
      name: payload.name,
    };
  } catch (error) {
    console.error('Failed to parse JWT token:', error);
    return null;
  }
};

const tokenInfo = getUserInfoFromToken();
const userInfo = user || tokenInfo; // Use token info as fallback
```

Now the system will:
1. Try to use Keycloak user profile if available
2. Fall back to JWT token payload if profile loading fails
3. Always have user information available for the dashboard

## Testing

### Step 1: Refresh the Debug Page

1. Go to: http://localhost:3000/debug-auth
2. You should now see:
   - **User**: Contains user information (not null)
   - **Current User**: Contains mapped user data with role

### Step 2: Test Dashboard

1. Go to: http://localhost:3000/dashboard
2. You should now see:
   - **Admin Dashboard** with master control panel
   - User name displayed in header
   - Role-specific content

### Step 3: Test All Roles

Login with each user and verify dashboard shows correct content:

| Email | Password | Expected Dashboard |
|-------|----------|-------------------|
| admin@insa.gov.et | Admin@123 | Admin Dashboard with full system stats |
| user@insa.gov.et | User@123 | User Dashboard with "My Requests" |
| supervisor@insa.gov.et | Supervisor@123 | Redirects to /dashboard/supervisor/tasks |
| professional@insa.gov.et | Professional@123 | Professional Dashboard with task queue |

## What Was Fixed

### Before:
```typescript
const currentUser: User | null = user ? {
  // Only worked if user profile loaded successfully
  id: user.email || 'keycloak-user',
  name: user.firstName && user.lastName ? `${user.firstName} ${user.lastName}` : user.username || 'User',
  // ...
} : null;
```

### After:
```typescript
const tokenInfo = getUserInfoFromToken(); // Extract from JWT
const userInfo = user || tokenInfo;       // Use fallback

const currentUser: User | null = authenticated && userInfo ? {
  // Works even if profile loading fails
  id: userInfo.email || userInfo.username || roles[0] || 'keycloak-user',
  name: userInfo.name || (userInfo.firstName && userInfo.lastName 
    ? `${userInfo.firstName} ${userInfo.lastName}` 
    : userInfo.username || userInfo.email || 'User'),
  // ...
} : null;
```

## Files Modified

1. `Frontend/src/context/AuthContextCompat.tsx` - Added JWT token fallback for user info

## Why This Works

The JWT token already contains all necessary user information:
- `email`: User's email address
- `preferred_username`: Username (email)
- `given_name`: First name
- `family_name`: Last name
- `name`: Full name
- `realm_access.roles`: User roles

By extracting this information directly from the token, we bypass the need for the separate `loadUserProfile()` call that was failing.

## Next Steps

1. ✅ Refresh the application (Ctrl+F5 or clear cache)
2. ✅ Check debug page - User should no longer be null
3. ✅ Test dashboard - Should show role-specific content
4. ✅ Test all 4 user roles

---

**Date**: May 2, 2026
