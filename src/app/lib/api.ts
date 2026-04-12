type ApiRequestOptions = Omit<RequestInit, "body"> & {
  body?: unknown;
  token?: string;
};

export async function apiRequest<T>(
  url: string,
  options: ApiRequestOptions = {},
): Promise<T> {
  const { body, token, headers, ...rest } = options;
  const resolvedHeaders = new Headers(headers || {});

  if (token) {
    resolvedHeaders.set("Authorization", `Bearer ${token}`);
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

  const response = await fetch(url, {
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
}
