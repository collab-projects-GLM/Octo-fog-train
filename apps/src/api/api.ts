import { ApiError } from "@/api/error";
import type { ApiResponse } from "@/types/error.type";

// Inlined at build time, so it must be read with this exact static expression.
const BASE_URL = process.env.EXPO_PUBLIC_API_URL;

export type RequestOptions = Omit<RequestInit, "body" | "method" | "headers"> & {
  headers?: Record<string, string>;
};

/**
 * Resolves with the envelope's `data`, or throws `ApiError` on `status: "error"`.
 * Paths need the trailing slash Django expects, e.g. `/api/auth/login/`.
 */
async function request<T>(
  method: string,
  path: string,
  body?: unknown,
  { headers, ...init }: RequestOptions = {},
): Promise<T> {
  if (!BASE_URL) {
    throw new Error("EXPO_PUBLIC_API_URL is not set.");
  }

  let response: Response;
  try {
    response = await fetch(`${BASE_URL}${path}`, {
      ...init,
      method,
      headers: {
        Accept: "application/json",
        ...(body !== undefined && { "Content-Type": "application/json" }),
        ...headers,
      },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  } catch (error) {
    // A cancelled request is not a failure; let the caller see the abort as-is.
    if (init.signal?.aborted) throw error;

    throw new ApiError(
      { code: "NETWORK_ERROR", message: "Could not reach the server.", details: [] },
      0,
    );
  }

  if (response.status === 204) return undefined as T;

  const payload: ApiResponse<T> = await response.json();

  if (payload.status === "error") {
    throw new ApiError(payload.error, response.status);
  }

  return payload.data;
}

export const api = {
  get: <T>(path: string, options?: RequestOptions) => request<T>("GET", path, undefined, options),
  post: <T>(path: string, body?: unknown, options?: RequestOptions) =>
    request<T>("POST", path, body, options),
  put: <T>(path: string, body?: unknown, options?: RequestOptions) =>
    request<T>("PUT", path, body, options),
  patch: <T>(path: string, body?: unknown, options?: RequestOptions) =>
    request<T>("PATCH", path, body, options),
  delete: <T = void>(path: string, options?: RequestOptions) =>
    request<T>("DELETE", path, undefined, options),
};
