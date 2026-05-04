# Keycloak Authentication Guide - CSBMS

## Overview

Keycloak is an open-source Identity and Access Management (IAM) solution that provides Single Sign-On (SSO), user authentication, and authorization for the CSBMS system.

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         User Browser                             │
└─────────────────────────────────────────────────────────────────┘
                            ↓ ↑
                    1. Login Request
                    6. JWT Token
                            ↓ ↑
┌─────────────────────────────────────────────────────────────────┐
│                    Frontend (Next.js)                            │
│                    Port: 3000                                    │
│  - Keycloak JS Client                                           │
│  - Token Storage                                                │
│  - Auto Token Refresh                                           │
└─────────────────────────────────────────────────────────────────┘
                            ↓ ↑
                    2. Redirect to Keycloak
                    5. Redirect with Code
                            ↓ ↑
┌─────────────────────────────────────────────────────────────────┐
│                    Keycloak Server                               │
│                    Port: 8090                                    │
│  - User Authentication                                          │
│  - Token Generation (JWT)                                       │
│  - Token Validation                                             │
│  - User Management                                              │
└─────────────────────────────────────────────────────────────────┘
                            ↓ ↑
                    3. Verify Credentials
                            ↓ ↑
┌─────────────────────────────────────────────────────────────────┐
│                    User Database                                 │
│  - Keycloak Internal DB                                         │
│  - User Credentials                                             │
│  - Roles & Permissions                                          │
└─────────────────────────────────────────────────────────────────┘

                    7. API Request + JWT Token
                            ↓ ↑
┌─────────────────────────────────────────────────────────────────┐
│                    Backend (Spring Boot)                         │
│                    Port: 8081                                    │
│  - Token Validation                                             │
│  - Role-Based Access Control                                    │
│  - API Endpoints                                                │
└─────────────────────────────────────────────────────────────────┘
```

## Authentication Flow (Step by Step)

### 1. User Visits Application

```
User → http://localhost:3000/dashboard
```

**What Happens:**
- Frontend loads
- `ProtectedRoute` component checks authentication
- Keycloak JS client checks for existing token
- If no token found → Redirect to Keycloak login

### 2. Redirect to Keycloak Login

```
Frontend → http://localhost:8090/realms/insa/protocol/openid-connect/auth
```

**URL Parameters:**
```
?client_id=insa-frontend
&redirect_uri=http://localhost:3000
&response_type=code
&scope=openid profile email
```

**What Happens:**
- User sees Keycloak login page
- User enters credentials (email/password)
- Keycloak validates credentials

### 3. Keycloak Validates Credentials

**What Happens:**
- Keycloak checks username/password against database
- If valid → Generate authorization code
- If invalid → Show error message

### 4. Authorization Code Generated

```
Keycloak generates: code=abc123xyz...
```

### 5. Redirect Back to Frontend

```
Keycloak → http://localhost:3000?code=abc123xyz...
```

**What Happens:**
- Frontend receives authorization code
- Keycloak JS client exchanges code for tokens

### 6. Token Exchange

**Frontend sends to Keycloak:**
```http
POST /realms/insa/protocol/openid-connect/token
Content-Type: application/x-www-form-urlencoded

grant_type=authorization_code
&code=abc123xyz...
&client_id=insa-frontend
&redirect_uri=http://localhost:3000
```

**Keycloak responds with:**
```json
{
  "access_token": "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "expires_in": 300,
  "refresh_expires_in": 1800,
  "token_type": "Bearer"
}
```

### 7. Token Storage

**Frontend stores:**
- `access_token` - Used for API calls (expires in 5 minutes)
- `refresh_token` - Used to get new access token (expires in 30 minutes)

**Storage Location:**
- In memory (Keycloak JS client)
- NOT in localStorage (security best practice)

### 8. API Calls with Token

**Frontend makes API call:**
```http
GET /api/projects
Authorization: Bearer eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Backend validates token:**
1. Extracts token from Authorization header
2. Verifies signature using Keycloak public key
3. Checks expiration
4. Extracts user info and roles
5. Processes request if valid

## JWT Token Structure

### Access Token (Decoded)

```json
{
  "header": {
    "alg": "RS256",
    "typ": "JWT",
    "kid": "key-id-123"
  },
  "payload": {
    "exp": 1735824000,           // Expiration time
    "iat": 1735823700,           // Issued at
    "jti": "unique-token-id",    // Token ID
    "iss": "http://localhost:8090/realms/insa",  // Issuer
    "sub": "user-uuid",          // Subject (user ID)
    "typ": "Bearer",
    "azp": "insa-frontend",      // Authorized party
    "session_state": "session-id",
    "realm_access": {
      "roles": ["ADMIN", "USER"]  // User roles
    },
    "email": "admin@insa.gov.et",
    "name": "Admin User",
    "preferred_username": "admin",
    "given_name": "Admin",
    "family_name": "User"
  },
  "signature": "..."
}
```

### Key Fields

- **exp** - Token expiration (Unix timestamp)
- **sub** - User unique identifier
- **realm_access.roles** - User roles (ADMIN, USER, PROFESSIONAL, SUPERVISOR)
- **email** - User email address
- **name** - User full name

## Token Lifecycle

### Token Expiration

```
Access Token:  5 minutes  (300 seconds)
Refresh Token: 30 minutes (1800 seconds)
```

### Automatic Token Refresh

**Frontend (api.ts):**
```typescript
// Before each API call
if (keycloak.authenticated) {
  // Try to refresh if token expires in < 70 seconds
  await keycloak.updateToken(70);
  
  // Use refreshed token
  headers.set("Authorization", `Bearer ${keycloak.token}`);
}
```

**What Happens:**
1. Check if token expires soon (< 70 seconds)
2. If yes, use refresh token to get new access token
3. If refresh token also expired → Redirect to login
4. If refresh successful → Use new access token

### Token Refresh Flow

```
Frontend → POST /realms/insa/protocol/openid-connect/token
{
  grant_type: "refresh_token",
  refresh_token: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  client_id: "insa-frontend"
}

Keycloak → Response
{
  access_token: "new_token...",
  refresh_token: "new_refresh_token...",
  expires_in: 300
}
```

## Backend Token Validation

### Spring Security Configuration

**File:** `Backend/src/main/java/com/org/cmbms/config/SecurityConfigKeycloak.java`

```java
@Configuration
@EnableWebSecurity
public class SecurityConfigKeycloak {
    
    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) {
        http
            .oauth2ResourceServer(oauth2 -> oauth2
                .jwt(jwt -> jwt
                    .jwtAuthenticationConverter(jwtAuthenticationConverter())
                )
            )
            .authorizeHttpRequests(auth -> auth
                .requestMatchers("/api/admin/**").hasRole("ADMIN")
                .requestMatchers("/api/supervisor/**").hasRole("SUPERVISOR")
                .requestMatchers("/api/professional/**").hasRole("PROFESSIONAL")
                .anyRequest().authenticated()
            );
        return http.build();
    }
}
```

### Token Validation Steps

1. **Extract Token** from Authorization header
2. **Verify Signature** using Keycloak public key
3. **Check Expiration** (exp claim)
4. **Verify Issuer** (iss claim matches Keycloak URL)
5. **Extract User Info** (sub, email, roles)
6. **Check Permissions** (role-based access control)

## Role-Based Access Control (RBAC)

### Roles in Keycloak

```
Realm: insa
├── Roles
│   ├── ADMIN       - Full system access
│   ├── SUPERVISOR  - Division management
│   ├── PROFESSIONAL - Task execution
│   └── USER        - Submit requests
```

### Role Assignment

**In Keycloak Admin Console:**
1. Go to Users → Select User
2. Go to Role Mapping tab
3. Assign roles from Available Roles
4. Roles appear in JWT token

### Frontend Role Check

```typescript
// Check if user has role
const { hasRole } = useKeycloakAuth();

if (hasRole('ADMIN')) {
  // Show admin features
}
```

### Backend Role Check

```java
// Method-level security
@PreAuthorize("hasRole('ADMIN')")
public void adminOnlyMethod() {
    // Only admins can call this
}

// In code
if (currentUser.getRole() == Role.ADMIN) {
    // Admin logic
}
```

## Security Features

### 1. Token-Based Authentication
- No session storage on server
- Stateless authentication
- Scalable architecture

### 2. Short-Lived Tokens
- Access token: 5 minutes
- Reduces risk if token is stolen
- Automatic refresh for better UX

### 3. Secure Token Storage
- Tokens stored in memory only
- Not in localStorage or cookies
- Cleared on browser close

### 4. HTTPS in Production
- All communication encrypted
- Prevents token interception
- Man-in-the-middle protection

### 5. CORS Protection
- Backend validates origin
- Only allowed domains can access API
- Prevents unauthorized access

### 6. CSRF Protection
- Spring Security CSRF tokens
- Protects against cross-site attacks

## Configuration Files

### Frontend Configuration

**File:** `Frontend/src/lib/keycloak.ts`
```typescript
import Keycloak from 'keycloak-js';

const keycloakConfig = {
  url: 'http://localhost:8090',
  realm: 'insa',
  clientId: 'insa-frontend',
};

const keycloak = new Keycloak(keycloakConfig);
export default keycloak;
```

**File:** `Frontend/.env.local`
```env
NEXT_PUBLIC_KEYCLOAK_URL=http://localhost:8090
NEXT_PUBLIC_KEYCLOAK_REALM=insa
NEXT_PUBLIC_KEYCLOAK_CLIENT_ID=insa-frontend
```

### Backend Configuration

**File:** `Backend/src/main/resources/application.properties`
```properties
# Keycloak OAuth2 Resource Server
spring.security.oauth2.resourceserver.jwt.issuer-uri=http://localhost:8090/realms/insa
spring.security.oauth2.resourceserver.jwt.jwk-set-uri=http://localhost:8090/realms/insa/protocol/openid-connect/certs
```

### Keycloak Realm Configuration

**File:** `Frontend/keycloak-insa-realm-template.json`
- Contains realm settings
- Client configurations
- Role definitions
- User templates

## Common Scenarios

### Scenario 1: First-Time Login

```
1. User visits http://localhost:3000
2. No token found
3. Redirect to Keycloak login
4. User enters credentials
5. Keycloak validates
6. Redirect back with code
7. Exchange code for tokens
8. Store tokens in memory
9. User sees dashboard
```

### Scenario 2: Token Refresh

```
1. User makes API call
2. Token expires in 60 seconds
3. Frontend calls keycloak.updateToken(70)
4. Keycloak returns new access token
5. API call proceeds with new token
6. User doesn't notice anything
```

### Scenario 3: Token Expired

```
1. User idle for 30+ minutes
2. Both tokens expired
3. User tries to make API call
4. Token refresh fails
5. Frontend detects unauthenticated state
6. ProtectedRoute redirects to login
7. User logs in again
```

### Scenario 4: Logout

```
1. User clicks logout
2. Frontend calls keycloak.logout()
3. Tokens cleared from memory
4. Redirect to Keycloak logout endpoint
5. Keycloak clears session
6. Redirect to login page
```

## Troubleshooting

### Issue: "401 Unauthorized"

**Causes:**
- Token expired
- Token invalid
- Token not sent in request

**Solution:**
1. Check if Keycloak is running
2. Clear browser cache
3. Login again
4. Check token in DevTools → Application → Cookies

### Issue: "Token refresh failed"

**Causes:**
- Refresh token expired
- Keycloak server down
- Network issues

**Solution:**
1. Verify Keycloak is running: http://localhost:8090
2. Check browser console for errors
3. Login again

### Issue: "CORS error"

**Causes:**
- Backend not allowing frontend origin
- Keycloak not configured for frontend URL

**Solution:**
1. Check CORS configuration in backend
2. Verify Keycloak client settings
3. Check Valid Redirect URIs in Keycloak

## Best Practices

### 1. Never Store Tokens in localStorage
```typescript
// ❌ BAD
localStorage.setItem('token', token);

// ✅ GOOD
// Let Keycloak JS client handle storage
keycloak.init({ onLoad: 'check-sso' });
```

### 2. Always Use HTTPS in Production
```typescript
// Production
url: 'https://keycloak.yourdomain.com'

// Development only
url: 'http://localhost:8090'
```

### 3. Implement Token Refresh
```typescript
// Before API calls
await keycloak.updateToken(70);
```

### 4. Handle Token Expiry Gracefully
```typescript
try {
  await apiCall();
} catch (error) {
  if (error.message.includes('Authentication required')) {
    // Let ProtectedRoute handle re-authentication
  }
}
```

### 5. Use Role-Based Access Control
```typescript
// Frontend
if (hasRole('ADMIN')) {
  // Show admin features
}

// Backend
@PreAuthorize("hasRole('ADMIN')")
```

## Testing Authentication

### Test User Login
1. Navigate to http://localhost:3000
2. Should redirect to Keycloak
3. Login with test credentials
4. Should redirect back to dashboard
5. Check browser DevTools → Network → See Authorization headers

### Test Token Refresh
1. Login to application
2. Wait 4 minutes (token expires in 5)
3. Make an API call
4. Check Network tab → Should see token refresh call
5. API call should succeed with new token

### Test Token Expiry
1. Login to application
2. Wait 35 minutes (both tokens expire)
3. Try to navigate or make API call
4. Should redirect to login page

## Summary

Keycloak authentication in CSBMS:

1. ✅ **Secure** - JWT tokens, short-lived, HTTPS
2. ✅ **Scalable** - Stateless, no server sessions
3. ✅ **User-Friendly** - Automatic token refresh, SSO
4. ✅ **Flexible** - Role-based access control
5. ✅ **Standard** - OAuth2/OpenID Connect protocols

---

**For more information:**
- Keycloak Documentation: https://www.keycloak.org/documentation
- OAuth2 Specification: https://oauth.net/2/
- JWT Specification: https://jwt.io/

**Last Updated:** 2026-05-02
