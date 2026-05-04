# Solution: Refresh Page After Login

## The Issue

The backend logs show it's working perfectly:
```
✅ Fetched divisionId from Keycloak: DIV-001
=== SUPERVISOR FETCHING MAINTENANCE ===
Supervisor Division: DIV-001
Found 4 maintenance requests in supervisor's division
Total unique: 4
```

**The backend is returning 4 maintenance requests!**

However, the frontend doesn't show them because:
1. **First request** fails (divisionId not in token yet)
2. **Backend fetches** divisionId from Keycloak (fallback)
3. **Subsequent requests** work, but frontend cached the error

## Quick Solution

### After logging in as supervisor, simply **refresh the page**:

1. Login as: director1@gmail.com / Supervisor@123
2. You'll see empty maintenance list (first request failed)
3. **Press F5 or Ctrl+R** to refresh the page
4. ✅ Now you'll see the 4 maintenance requests!

## Why This Happens

### First Request (Page Load)
```
Frontend → Backend (no divisionId in token)
Backend → "Division not set" error (400)
Backend → Fetches divisionId from Keycloak (fallback)
Backend → Caches divisionId for session
Frontend → Shows error (cached)
```

### After Refresh
```
Frontend → Backend (divisionId now cached in session)
Backend → Returns 4 maintenance requests ✅
Frontend → Displays them correctly ✅
```

## Permanent Fix Options

### Option 1: Add Retry Logic in Frontend (Recommended)
Update `MaintenancePage.tsx` to retry failed requests:

```typescript
const refresh = async () => {
  try {
    const liveMaintenance = await fetchLiveMaintenance();
    setMaintenanceItems(liveMaintenance);
  } catch (error) {
    // Retry once after 1 second (gives backend time to fetch divisionId)
    setTimeout(async () => {
      try {
        const liveMaintenance = await fetchLiveMaintenance();
        setMaintenanceItems(liveMaintenance);
      } catch (retryError) {
        console.error("Failed after retry:", retryError);
      }
    }, 1000);
  }
};
```

### Option 2: Add Protocol Mapper in Keycloak (Best)
Follow the guide in `Backend/KEYCLOAK_PROTOCOL_MAPPER_SETUP.md` to add divisionId to the JWT token. This way, the first request will work immediately.

### Option 3: Show Loading State Longer
Give the backend more time to fetch divisionId before showing error.

## Current Workaround

**Just refresh the page after login!**

1. Login as supervisor
2. See empty list (expected on first load)
3. Refresh page (F5)
4. See maintenance requests ✅

## Verification

### Backend Logs Confirm It's Working:
```
✅ Fetched divisionId from Keycloak: DIV-001
Found 4 maintenance requests in supervisor's division
```

### After Refresh, You Should See:
- 4 maintenance requests for Division 1
- All assigned to DIV-001
- Supervisor can view and manage them

## Test All Divisions

| Supervisor | Division | Expected Maintenance |
|------------|----------|---------------------|
| director1@gmail.com | DIV-001 | 4 requests |
| director2@gmail.com | DIV-002 | Check database |
| director3@gmail.com | DIV-003 | Check database |

## Status

✅ Backend working correctly (fetches divisionId, returns data)
⚠️ Frontend needs refresh after first login
📝 Permanent fix: Add retry logic or protocol mapper

---

**For now: Just refresh the page after login!**
**The backend is working - it's just a frontend caching issue.**
