import { toast } from "sonner";

type ApiRequestOptions = Omit<RequestInit, "body"> & {
  body?: unknown;
  onError?: (error: Error) => void;
  showErrorToast?: boolean;
  retryCount?: number;
  retryDelayMs?: number;
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
 * Get auth token from httpOnly cookie on server-side.
 * Client-side relies on cookies being sent automatically.
 */
async function getServerAuthToken(): Promise<string | undefined> {
  if (!isServer()) return undefined;

  try {
    const { cookies } = await import("next/headers");
    const cookieStore = cookies();
    // Handle Next.js 15 async cookies() correctly
    const authCookie =
      typeof (cookieStore as any).get === "function"
        ? (cookieStore as any).get("insa_token")
        : (await cookieStore).get("insa_token");
    return authCookie?.value;
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
    ...rest
  } = options;
  const resolvedHeaders = new Headers(headers || {});

  // Server-side: manually attach Authorization header from cookie
  // Client-side: cookie is sent automatically by browser
  if (isServer()) {
    const authToken = await getServerAuthToken();
    if (authToken) {
      resolvedHeaders.set("Authorization", `Bearer ${authToken}`);
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
      console.log(`[API DEBUG] ${rest.method || "GET"} ${url}`, JSON.stringify(body, null, 2));
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
        console.error(`[API ERROR] ${response.status} ${url}`, errorText);
        let message = errorText || `Request failed (${response.status})`;
        // ... (keep rest)
        try {
          const parsed = JSON.parse(errorText);
          if (parsed && typeof parsed === "object" && "message" in parsed) {
            const parsedMessage = (parsed as { message?: string }).message;
            if (parsedMessage) message = parsedMessage;
          }
        } catch { }
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
