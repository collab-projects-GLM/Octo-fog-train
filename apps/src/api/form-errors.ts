import type { FieldValues, Path, UseFormSetError } from "react-hook-form";
import type { ApiError } from "@/api/error";

/**
 * Maps an `ApiError` onto a react-hook-form instance.
 * `details[].field` that names a form field lands on that field; everything else
 * (non-field errors, fields the form does not have, errors with no details)
 * lands on `errors.root.server`.
 */
export function applyApiError<T extends FieldValues>(
  error: ApiError,
  setError: UseFormSetError<T>,
  fields: readonly Path<T>[],
) {
  const unmapped: string[] = [];

  for (const { field, message } of error.details) {
    if (field && fields.includes(field as Path<T>)) {
      setError(field as Path<T>, { type: "server", message });
    } else {
      unmapped.push(message);
    }
  }

  if (error.details.length === 0 || unmapped.length > 0) {
    setError("root.server", {
      type: error.code,
      message: unmapped.length > 0 ? unmapped.join("\n") : error.message,
    });
  }
}
