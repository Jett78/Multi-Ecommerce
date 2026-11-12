import { ApiError } from "@/types/base-entity";

interface RequestOptions extends RequestInit {
  isAuthenticated?: boolean;
  timeout?: number;
}

export async function apiClient<T>(
  url: string,
  options: RequestOptions = {}
): Promise<T> {
  const { isAuthenticated, timeout = 30000, ...fetchOptions } = options;

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  };

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  let response: Response;

  try {
    const fetchConfig: RequestInit = {
      ...fetchOptions,
      headers,
      credentials: "include",
      signal: controller.signal,
    };

    // Only set cache: "no-store" if no Next.js-specific options are present
    // (to avoid conflicts with next: { tags } or next: { revalidate })
    const hasNextOptions = fetchOptions.next !== undefined;
    if (!hasNextOptions) {
      fetchConfig.cache = "no-store";
    }

    response = await fetch(url, fetchConfig);
  } catch (networkError) {
    clearTimeout(timeoutId);
    if (networkError instanceof DOMException && networkError.name === "AbortError") {
      const error: ApiError = {
        success: false,
        statusCode: 408,
        message: "Request timeout. Please try again.",
        errors: undefined,
      };
      throw error;
    }
    const error: ApiError = {
      success: false,
      statusCode: 0,
      message:
        "Could not connect to the server. Please check your internet connection and try again.",
      errors: undefined,
    };
    throw error;
  } finally {
    clearTimeout(timeoutId);
  }

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    const error: ApiError = {
      success: false,
      statusCode: response.status,
      message: errorData.message || `Request failed with status ${response.status}`,
      errors: errorData.errors,
    };
    throw error;
  }

  try {
    return await response.json();
  } catch (parseError) {
    const error: ApiError = {
      success: false,
      statusCode: 500,
      message: "Invalid response from server",
      errors: undefined,
    };
    throw error;
  }
}
