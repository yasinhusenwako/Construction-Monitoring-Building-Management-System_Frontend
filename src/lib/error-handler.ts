import { toast } from "sonner";

export class ApiError extends Error {
  constructor(
    message: string,
    public statusCode?: number,
    public code?: string,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export function handleApiError(error: unknown, context?: string): string {
  console.error(`[API Error${context ? ` - ${context}` : ""}]:`, error);

  if (error instanceof ApiError) {
    return error.message;
  }

  if (error instanceof Error) {
    return error.message;
  }

  return "An unexpected error occurred. Please try again.";
}

export function showErrorToast(error: unknown, context?: string) {
  const message = handleApiError(error, context);
  toast.error("Error", { description: message });
}

export function showSuccessToast(message: string, description?: string) {
  toast.success(message, { description });
}

export function isNetworkError(error: unknown): boolean {
  if (error instanceof Error) {
    return (
      error.message.includes("NetworkError") ||
      error.message.includes("Failed to fetch") ||
      error.message.includes("Network request failed")
    );
  }
  return false;
}

export function isAuthError(error: unknown): boolean {
  if (error instanceof ApiError) {
    return error.statusCode === 401 || error.statusCode === 403;
  }
  if (error instanceof Error) {
    return (
      error.message.includes("401") ||
      error.message.includes("403") ||
      error.message.includes("Unauthorized") ||
      error.message.includes("Forbidden")
    );
  }
  return false;
}

export function shouldRetry(error: unknown, attemptNumber: number, maxRetries: number): boolean {
  if (attemptNumber >= maxRetries) return false;
  
  // Don't retry auth errors
  if (isAuthError(error)) return false;
  
  // Retry network errors and 5xx errors
  if (isNetworkError(error)) return true;
  
  if (error instanceof ApiError) {
    return error.statusCode ? error.statusCode >= 500 : false;
  }
  
  return false;
}
