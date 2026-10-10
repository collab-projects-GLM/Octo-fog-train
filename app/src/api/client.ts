import {
  clearTokens,
  getAccessToken,
  getRefreshToken,
  notifySessionExpired,
  saveTokens,
} from "./tokens";

const API_URL = process.env.EXPO_PUBLIC_API_URL ?? "http://localhost:8000";

/**
 * A failed API call. `fieldErrors` holds the first message per field for DRF
 * validation errors (`{ email: ["..."] }`), so forms can attach them to inputs.
 * `status` is 0 when the server couldn't be reached at all.
 */
export class ApiError extends Error {
  readonly status: number;
  readonly fieldErrors: Record<string, string>;

  constructor(
    status: number,
    message: string,
    fieldErrors: Record<string, string> = {},
  ) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.fieldErrors = fieldErrors;
  }
}

function toApiError(status: number, body: unknown): ApiError {
  const fieldErrors: Record<string, string> = {};
  let detail: string | undefined;

  if (body && typeof body === "object") {
    for (const [key, value] of Object.entries(body)) {
      const first = Array.isArray(value) ? value[0] : value;
      if (typeof first !== "string") continue;

      if (key === "detail" || key === "non_field_errors") detail ??= first;
      else fieldErrors[key] = first;
    }
  }

  const message =
    detail ?? Object.values(fieldErrors)[0] ?? `Request failed (${status})`;

  return new ApiError(status, message, fieldErrors);
}

type RequestOptions = {
  method?: "GET" | "POST";
  body?: unknown;
  /** Send the access token, refreshing it first if needed. */
  auth?: boolean;
};

async function send(
  path: string,
  { method = "GET", body }: RequestOptions,
  token: string | null,
): Promise<Response> {
  try {
    return await fetch(`${API_URL}${path}`, {
      method,
      headers: {
        Accept: "application/json",
        ...(body === undefined ? {} : { "Content-Type": "application/json" }),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  } catch {
    throw new ApiError(
      0,
      __DEV__
        ? `Can't reach the API at ${API_URL}. On a phone, set EXPO_PUBLIC_API_URL to an address the phone can reach.`
        : "Can't reach the server. Check your connection.",
    );
  }
}

async function parse<T>(response: Response): Promise<T> {
  const body: unknown = await response.json().catch(() => null);

  if (!response.ok) throw toApiError(response.status, body);

  return body as T;
}

let refreshing: Promise<string | null> | null = null;

/**
 * Exchanges the stored refresh token for a new access token. Refresh tokens
 * rotate and the old one is blacklisted, so concurrent callers must share one
 * request or the loser would be rejected and sign the user out.
 */
export function refreshAccessToken(): Promise<string | null> {
  refreshing ??= doRefresh().finally(() => {
    refreshing = null;
  });
  return refreshing;
}

async function doRefresh(): Promise<string | null> {
  const refresh = await getRefreshToken();
  if (!refresh) return null;

  const response = await send(
    "/api/auth/refresh/",
    { method: "POST", body: { refresh } },
    null,
  );

  if (response.status === 401) {
    await clearTokens();
    notifySessionExpired();
    return null;
  }

  const data = await parse<{ access: string; refresh?: string }>(response);
  await saveTokens({ access: data.access, refresh: data.refresh ?? refresh });

  return data.access;
}

export async function request<T>(
  path: string,
  options: RequestOptions = {},
): Promise<T> {
  if (!options.auth) return parse<T>(await send(path, options, null));

  const token = getAccessToken() ?? (await refreshAccessToken());
  if (!token) throw new ApiError(401, "You're not signed in.");

  const response = await send(path, options, token);
  if (response.status !== 401) return parse<T>(response);

  // The access token expired mid-session: refresh once and retry.
  const fresh = await refreshAccessToken();
  if (!fresh) throw new ApiError(401, "Your session has expired.");

  return parse<T>(await send(path, options, fresh));
}
