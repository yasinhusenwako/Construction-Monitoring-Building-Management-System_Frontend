import { getStoredAuthToken } from "@/lib/auth-storage";

type ApiRequestOptions = Omit<RequestInit, "body"> & {
  body?: unknown;
  token?: string;
  onError?: (error: Error) => void;
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
  if (/^https?:\/\//i.test(url) || !baseUrl) {
    return url;
  }
  return `${baseUrl}${url.startsWith("/") ? url : `/${url}`}`;
}

export async function apiRequest<T>(
  url: string,
  options: ApiRequestOptions = {},
): Promise<T> {
  const {
    body,
    token,
    headers,
    onError,
    retryCount = 0,
    retryDelayMs = 500,
    ...rest
  } = options;
  const resolvedHeaders = new Headers(headers || {});

  let authToken = token;

  // Auto-resolve token if not explicitly provided
  if (!authToken) {
    if (typeof window === "undefined") {
      // Server-side: Dynamically import next/headers to avoid breaking client compiler
      try {
        const { cookies } = await import("next/headers");
        const cookieStore = cookies();
        // Handle Next.js 15 async cookies() correctly
        const authCookie =
          typeof (cookieStore as any).get === "function"
            ? (cookieStore as any).get("insa_token")
            : (await cookieStore).get("insa_token");
        authToken = authCookie?.value;
      } catch (e) {
        // Ignore headers import errors
      }
    } else {
      authToken = getStoredAuthToken();
    }
  }

  if (authToken) {
    resolvedHeaders.set("Authorization", `Bearer ${authToken}`);
  }

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
        body:
          body === undefined || isFormData
            ? (body as BodyInit | null | undefined)
            : JSON.stringify(body),
      });

      if (!response.ok) {
        const errorText = await response.text().catch(() => "");
        let message = errorText || `Request failed (${response.status})`;

        try {
          const parsed = JSON.parse(errorText);
          if (parsed && typeof parsed === "object" && "message" in parsed) {
            const parsedMessage = (parsed as { message?: string }).message;
            if (parsedMessage) message = parsedMessage;
          }
        } catch {
          // keep text message
        }

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
