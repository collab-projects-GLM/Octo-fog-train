import * as SecureStore from "expo-secure-store";
import { ApiError } from "@/api/error";
import { API_ROUTES } from "@/lib/api-routes";
import { SECURE_KEYS } from "@/lib/secure-store";
import type { ApiResponse } from "@/types/error.type";

// Inlined at build time, so it must be read with this exact static expression.
const BASE_URL = process.env.EXPO_PUBLIC_API_URL;

export type RequestOptions = Omit<
  RequestInit,
  "body" | "method" | "headers"
> & {
  headers?: Record<string, string>;
};

/**
 * Single attempt. Resolves with the envelope's `data`, or throws `ApiError` on `status: "error"`.
 * Paths need the trailing slash Django expects, e.g. `/api/auth/login/`.
 */
async function send<T>(
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
      {
        code: "NETWORK_ERROR",
        message: "Could not reach the server.",
        details: [],
      },
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

// A 401 from these is a real answer (bad credentials, dead refresh token), not an expired access token.
const AUTH_PATHS: readonly string[] = [
  API_ROUTES.POST.LOGIN,
  API_ROUTES.POST.REGISTER,
  API_ROUTES.POST.LOGOUT,
  API_ROUTES.POST.TOKEN_REFRESH,
];

let refreshInFlight: Promise<string> | null = null;

/**
 * Trades the stored refresh token for a new pair, saves both, and resolves with the new access token.
 * Refresh tokens rotate, so a second refresh with the same token would be rejected as blacklisted;
 * concurrent callers therefore share one in-flight request.
 */
function refreshAccessToken(): Promise<string> {
  refreshInFlight ??= (async () => {
    const refresh = await SecureStore.getItemAsync(SECURE_KEYS.REFRESH_TOKEN);
    if (!refresh) throw new Error("No refresh token stored.");

    const tokens = await send<{ access: string; refresh: string }>(
      "POST",
      API_ROUTES.POST.TOKEN_REFRESH,
      { refresh },
    );

    await Promise.all([
      SecureStore.setItemAsync(SECURE_KEYS.ACCESS_TOKEN, tokens.access),
      SecureStore.setItemAsync(SECURE_KEYS.REFRESH_TOKEN, tokens.refresh),
    ]);

    return tokens.access;
  })().finally(() => {
    refreshInFlight = null;
  });

  return refreshInFlight;
}

/** `send`, plus: on a 401, refresh the tokens and retry once with the new access token. */
async function request<T>(
  method: string,
  path: string,
  body?: unknown,
  options: RequestOptions = {},
): Promise<T> {
  try {
    return await send<T>(method, path, body, options);
  } catch (error) {
    if (
      !(error instanceof ApiError) ||
      error.httpStatus !== 401 ||
      AUTH_PATHS.includes(path)
    ) {
      throw error;
    }

    let access: string;
    try {
      access = await refreshAccessToken();
    } catch {
      console.log("Token refresh failed, the user has to sign in again.");
      throw error;
    }

    return send<T>(method, path, body, {
      ...options,
      headers: { ...options.headers, Authorization: `Bearer ${access}` },
    });
  }
}

export const api = {
  get: <T>(path: string, options?: RequestOptions) =>
    request<T>("GET", path, undefined, options),
  post: <T>(path: string, body?: unknown, options?: RequestOptions) =>
    request<T>("POST", path, body, options),
  put: <T>(path: string, body?: unknown, options?: RequestOptions) =>
    request<T>("PUT", path, body, options),
  patch: <T>(path: string, body?: unknown, options?: RequestOptions) =>
    request<T>("PATCH", path, body, options),
  delete: <T = void>(path: string, options?: RequestOptions) =>
    request<T>("DELETE", path, undefined, options),
};
