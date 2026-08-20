import { ApiError } from "@/types/base-entity";

interface RequestOptions extends RequestInit {
  isAuthenticated?: boolean;
}

export async function apiClient<T>(
  url: string,
  options: RequestOptions = {}
): Promise<T> {
  const { isAuthenticated, ...fetchOptions } = options;

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  };

  let response: Response;

  try {
    response = await fetch(url, {
      ...fetchOptions,
      headers,
      credentials: "include",
    });
  } catch (networkError) {
    const error: ApiError = {
      success: false,
      statusCode: 0,
      message:
        "Could not connect to the server. Please check your internet connection and try again.",
      errors: undefined,
    };
    throw error;
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

  return response.json();
}
