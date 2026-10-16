import type { ApiErrorBody, ApiErrorDetail } from "@/types/error.type";

/** Thrown by the API client for every failure: server errors, network loss and malformed responses. */
export class ApiError extends Error {
  readonly code: string;
  readonly details: ApiErrorDetail[];
  /** HTTP status, or 0 when the request never reached the server. */
  readonly httpStatus: number;

  constructor({ code, message, details }: ApiErrorBody, httpStatus: number) {
    super(message);
    this.name = "ApiError";
    this.code = code;
    this.details = details;
    this.httpStatus = httpStatus;
  }
}
