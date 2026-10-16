/** One itemized problem. `field` is a dotted path (`items.1.qty`), or null for non-field errors. */
export type ApiErrorDetail = {
  field: string | null;
  message: string;
  code: string;
};

export type ApiErrorBody = {
  /** Stable, UPPER_SNAKE_CASE. Branch on this, not on `message`. */
  code: string;
  message: string;
  /** Always a list; empty when there is nothing to itemize. */
  details: ApiErrorDetail[];
};

export type ApiErrorResponse = {
  status: "error";
  error: ApiErrorBody;
};

export type ApiSuccessResponse<T> = {
  status: "ok";
  data: T;
};

export type ApiResponse<T> = ApiSuccessResponse<T> | ApiErrorResponse;
