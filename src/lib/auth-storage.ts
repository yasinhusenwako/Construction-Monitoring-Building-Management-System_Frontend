const AUTH_USER_KEY = "insa_user";

function isBrowser(): boolean {
  return typeof window !== "undefined";
}

/**
 * Clear the httpOnly auth cookie by calling the logout API endpoint.
 * This is the only way to clear an httpOnly cookie from client-side.
 */
async function clearAuthCookie(): Promise<void> {
  if (!isBrowser()) return;
  try {
    await fetch("/api/auth/logout", { method: "POST", credentials: "include" });
  } catch {
    // Ignore errors - cookie may already be expired
  }
}

export function getStoredAuthUser<T>(): T | undefined {
  if (!isBrowser()) return undefined;
  const raw = sessionStorage.getItem(AUTH_USER_KEY);
  if (!raw) return undefined;
  try {
    return JSON.parse(raw) as T;
  } catch {
    clearStoredAuthUser();
    return undefined;
  }
}

/**
 * Persist user data to sessionStorage (non-sensitive).
 * The JWT token is stored in an httpOnly cookie by the backend.
 */
export function persistAuthSession(user: unknown): void {
  if (!isBrowser()) return;
  sessionStorage.setItem(AUTH_USER_KEY, JSON.stringify(user));
}

export function updateStoredAuthUser(user: unknown): void {
  if (!isBrowser()) return;
  sessionStorage.setItem(AUTH_USER_KEY, JSON.stringify(user));
}

export function clearStoredAuthSession(): void {
  if (!isBrowser()) return;
  sessionStorage.removeItem(AUTH_USER_KEY);
  void clearAuthCookie();
}

export function clearStoredAuthUser(): void {
  if (!isBrowser()) return;
  sessionStorage.removeItem(AUTH_USER_KEY);
}

/**
 * Migrate from legacy sessionStorage token storage to cookie-based auth.
 * This runs once on app mount to clear old tokens.
 */
export function migrateLegacyAuthSession(): { user?: string } {
  if (!isBrowser()) return {};

  const sessionUser = sessionStorage.getItem(AUTH_USER_KEY) ?? undefined;

  // Clear any legacy token storage (token now in httpOnly cookie only)
  sessionStorage.removeItem("insa_token");
  localStorage.removeItem("insa_token");

  return { user: sessionUser };
}

export { AUTH_USER_KEY };
