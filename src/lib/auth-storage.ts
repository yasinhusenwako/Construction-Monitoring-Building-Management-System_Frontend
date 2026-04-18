const AUTH_TOKEN_KEY = "insa_token";
const AUTH_USER_KEY = "insa_user";

function isBrowser(): boolean {
  return typeof window !== "undefined";
}

function readLegacyCookieToken(): string | undefined {
  if (!isBrowser()) return undefined;
  const match = document.cookie.match(/(?:^|; )insa_token=([^;]*)/);
  return match ? decodeURIComponent(match[1]) : undefined;
}

function clearLegacyCookieToken(): void {
  if (!isBrowser()) return;
  document.cookie =
    "insa_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax";
}

export function getStoredAuthToken(): string | undefined {
  if (!isBrowser()) return undefined;
  return sessionStorage.getItem(AUTH_TOKEN_KEY) ?? undefined;
}

export function getStoredAuthUser<T>(): T | undefined {
  if (!isBrowser()) return undefined;
  const raw = sessionStorage.getItem(AUTH_USER_KEY);
  if (!raw) return undefined;
  try {
    return JSON.parse(raw) as T;
  } catch {
    clearStoredAuthSession();
    return undefined;
  }
}

export function persistAuthSession(user: unknown, token: string): void {
  if (!isBrowser()) return;
  sessionStorage.setItem(AUTH_USER_KEY, JSON.stringify(user));
  sessionStorage.setItem(AUTH_TOKEN_KEY, token);
  localStorage.removeItem(AUTH_TOKEN_KEY);
  clearLegacyCookieToken();
}

export function updateStoredAuthUser(user: unknown): void {
  if (!isBrowser()) return;
  sessionStorage.setItem(AUTH_USER_KEY, JSON.stringify(user));
}

export function clearStoredAuthSession(): void {
  if (!isBrowser()) return;
  sessionStorage.removeItem(AUTH_USER_KEY);
  sessionStorage.removeItem(AUTH_TOKEN_KEY);
  localStorage.removeItem(AUTH_TOKEN_KEY);
  clearLegacyCookieToken();
}

export function migrateLegacyAuthSession(): {
  token?: string;
  user?: string;
} {
  if (!isBrowser()) return {};

  const sessionToken = sessionStorage.getItem(AUTH_TOKEN_KEY) ?? undefined;
  const sessionUser = sessionStorage.getItem(AUTH_USER_KEY) ?? undefined;
  const legacyToken =
    localStorage.getItem(AUTH_TOKEN_KEY) ?? readLegacyCookieToken();

  if (!sessionToken && legacyToken) {
    sessionStorage.setItem(AUTH_TOKEN_KEY, legacyToken);
  }

  localStorage.removeItem(AUTH_TOKEN_KEY);
  clearLegacyCookieToken();

  return {
    token: sessionStorage.getItem(AUTH_TOKEN_KEY) ?? undefined,
    user: sessionUser,
  };
}

export { AUTH_TOKEN_KEY, AUTH_USER_KEY };
