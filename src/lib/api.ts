import { toast } from "sonner";

type ApiRequestOptions = Omit<RequestInit, "body"> & {
  body?: unknown;
  onError?: (error: Error) => void;
  showErrorToast?: boolean;
  retryCount?: number;
  retryDelayMs?: number;
  authToken?: string;
};

const API_BASE_URL = (process.env.NEXT_PUBLIC_API_BASE_URL || "").replace(
  /\/+$/,
  "",
);

function getApiBaseUrl(): string {
  if (API_BASE_URL) return API_BASE_URL;
  // Default to same-origin so the Next API proxy is the single frontend boundary.
  return "";
}

function resolveUrl(url: string): string {
  const baseUrl = getApiBaseUrl();

  // If URL is already absolute, return as-is
  if (/^https?:\/\//i.test(url)) {
    return url;
  }

  // If no base URL configured, return as-is (will use same-origin)
  if (!baseUrl) {
    return url;
  }

  // Prepend base URL for both client and server
  return `${baseUrl}${url.startsWith("/") ? url : `/${url}`}`;
}

/**
 * Check if running on server-side (Next.js server components/API routes)
 */
function isServer(): boolean {
  return typeof window === "undefined";
}

/**
 * Get auth header value from the incoming request on server-side.
 */
async function getServerAuthHeader(): Promise<string | undefined> {
  if (!isServer()) return undefined;

  try {
    const { headers } = await import("next/headers");
    const headerStore = headers();
    const authHeader =
      typeof (headerStore as any).get === "function"
        ? (headerStore as any).get("authorization")
        : (await headerStore).get("authorization");
    return authHeader ?? undefined;
  } catch {
    return undefined;
  }
}

export async function apiRequest<T>(
  url: string,
  options: ApiRequestOptions = {},
): Promise<T> {
  const {
    body,
    headers,
    onError,
    showErrorToast = true,
    retryCount = 0,
    retryDelayMs = 500,
    authToken,
    ...rest
  } = options;
  const resolvedHeaders = new Headers(headers || {});

  if (authToken && !resolvedHeaders.has("Authorization")) {
    const value = authToken.startsWith("Bearer ")
      ? authToken
      : `Bearer ${authToken}`;
    resolvedHeaders.set("Authorization", value);
  }

  // Check for Keycloak token first (client-side only)
  if (!isServer() && typeof window !== "undefined") {
    try {
      const keycloakInstance = (window as any).keycloak;
      if (keycloakInstance && keycloakInstance.authenticated) {
        // Try to refresh token if it's about to expire (within 70 seconds)
        try {
          const refreshed = await keycloakInstance.updateToken(70);
          if (refreshed) {
            console.debug("[API] Token refreshed successfully");
          }
        } catch (refreshError) {
          console.warn(
            "[API] Token refresh failed - token may be expired:",
            refreshError,
          );
          // Token refresh failed - likely expired
          // Don't throw here, let the 401 response trigger re-authentication
        }

        // Use the (potentially refreshed) token
        if (keycloakInstance.token) {
          resolvedHeaders.set(
            "Authorization",
            `Bearer ${keycloakInstance.token}`,
          );
        } else {
          console.warn("[API] No token available after refresh attempt");
        }
      } else if (keycloakInstance && !keycloakInstance.authenticated) {
        console.warn("[API] Keycloak not authenticated - user needs to login");
      }
    } catch (e) {
      // Keycloak not available, fall back to cookie auth
      console.warn("[API] Keycloak not available:", e);
    }
  }

  // Server-side: forward Authorization header from incoming request
  if (isServer() && !resolvedHeaders.has("Authorization")) {
    const authHeader = await getServerAuthHeader();
    if (authHeader) {
      resolvedHeaders.set("Authorization", authHeader);
    }
  }

  // Always include credentials so cookies are sent with cross-origin requests
  const credentials: RequestCredentials = "include";

  const isFormData =
    typeof FormData !== "undefined" && body instanceof FormData;
  if (
    body !== undefined &&
    !isFormData &&
    !resolvedHeaders.has("Content-Type")
  ) {
    resolvedHeaders.set("Content-Type", "application/json");
  }

  let lastError: Error | undefined;
  for (let attempt = 0; attempt <= retryCount; attempt++) {
    try {
      const response = await fetch(resolveUrl(url), {
        ...rest,
        headers: resolvedHeaders,
        credentials,
        body:
          body === undefined || isFormData
            ? (body as BodyInit | null | undefined)
            : JSON.stringify(body),
      });

      if (!response.ok) {
        const errorText = await response.text().catch(() => "");

        // Handle 401 Unauthorized - DON'T redirect, let ProtectedRoute handle it
        if (response.status === 401 && !isServer()) {
          // Just log and throw - ProtectedRoute will handle authentication
          console.debug("[API] 401 Unauthorized - authentication required");
          throw new Error("Authentication required");
        }

        // Only log 403 errors as warnings (they're often expected for role-based access)
        // Also suppress 401 errors for /api/users/me and /api/notifications (expected when using Keycloak)
        if (response.status === 403) {
          console.warn(`[API ACCESS DENIED] ${response.status} ${url}`);
        } else if (
          response.status === 401 &&
          (url.includes("/api/users/me") || url.includes("/api/notifications"))
        ) {
          console.debug(
            `[API AUTH] ${response.status} ${url} (expected with Keycloak)`,
          );
        } else {
          console.error(`[API ERROR] ${response.status} ${url}`, errorText);
        }
        let message = errorText || `Request failed (${response.status})`;
        // ... (keep rest)
        try {
          const parsed = JSON.parse(errorText);
          if (parsed && typeof parsed === "object" && "message" in parsed) {
            const parsedMessage = (parsed as { message?: string }).message;
            if (parsedMessage) message = parsedMessage;
          }
        } catch {}
        throw new Error(message);
      }

      if (response.status === 204) {
        return undefined as T;
      }

      const contentType = response.headers.get("content-type") || "";
      if (contentType.includes("application/json")) {
        return (await response.json()) as T;
      }

      return (await response.text()) as T;
    } catch (error: any) {
      lastError = error instanceof Error ? error : new Error(String(error));
      if (onError) onError(lastError);

      // Global error toast (only on client)
      if (showErrorToast && !isServer()) {
        toast.error("API Error", {
          description: lastError.message,
        });
      }

      // Only retry on network errors or 5xx
      if (
        attempt < retryCount &&
        (lastError.message.includes("NetworkError") ||
          /5\d\d/.test(lastError.message))
      ) {
        await new Promise((res) => setTimeout(res, retryDelayMs));
        continue;
      }
      break;
    }
  }
  throw lastError ?? new Error("Unknown API error");
}
