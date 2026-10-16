import { useCallback, useEffect, useRef, useState } from "react";
import {
  useForm,
  type DefaultValues,
  type FieldValues,
  type Path,
} from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type { z } from "zod";
import { ApiError } from "@/api/error";
import { applyApiError } from "@/api/form-errors";

/**
 * idle     – nothing sent yet, or the user edited the form after a failure
 * pending  – request in flight
 * failed   – the server rejected it; stays here until the user edits the form
 * done     – succeeded; never re-enabled, the screen is expected to navigate away
 */
type Phase = "idle" | "pending" | "failed" | "done";

interface UseAuthFormOptions<T extends FieldValues> {
  schema: z.ZodType<T, T>;
  defaultValues: DefaultValues<T>;
  /** Fields the server may report errors against; anything else lands on `errors.root.server`. */
  fields: readonly Path<T>[];
  /** Rejects with `ApiError` on failure; it is mapped onto the form. */
  action: (payload: T) => Promise<unknown>;
}

/**
 * Shared behaviour of the login and register forms:
 * - errors (client and server) stay visible until the user edits the form again;
 * - the submit button locks on the first request and only unlocks after a failure
 *   once the form has been edited, so a request can never be sent twice.
 */
export function useAuthForm<T extends FieldValues>({
  schema,
  defaultValues,
  fields,
  action,
}: UseAuthFormOptions<T>) {
  const {
    control,
    handleSubmit,
    setError,
    clearErrors,
    subscribe,
    formState: { errors },
  } = useForm<T>({
    resolver: zodResolver(schema),
    defaultValues,
    // Errors are cleared on edit below, so skip the per-keystroke re-validation.
    reValidateMode: "onSubmit",
  });

  // The ref is the synchronous guard (two taps can land before a re-render);
  // the state only drives the UI.
  const phaseRef = useRef<Phase>("idle");
  const [phase, setPhaseState] = useState<Phase>("idle");
  const setPhase = useCallback((next: Phase) => {
    phaseRef.current = next;
    setPhaseState(next);
  }, []);

  // `values` has to be tracked or RHF leaves `type` out of the change payload;
  // `type === "change"` is a user edit (setValue/reset carry no type).
  useEffect(
    () =>
      subscribe({
        formState: { values: true },
        callback: ({ type }) => {
          if (type !== "change") return;
          if (phaseRef.current === "failed") setPhase("idle");
          clearErrors();
        },
      }),
    [subscribe, clearErrors, setPhase],
  );

  async function onValid(data: T) {
    if (phaseRef.current !== "idle") return;
    setPhase("pending");

    try {
      await action(data);
      setPhase("done");
    } catch (error) {
      if (!(error instanceof ApiError)) {
        setPhase("idle");
        throw error;
      }
      applyApiError(error, setError, fields);
      setPhase("failed");
    }
  }

  const submit = () => handleSubmit(onValid)();

  return {
    control,
    errors,
    submit,
    isPending: phase === "pending",
    isLocked: phase !== "idle",
  };
}
