import type { ApiError } from "@/api/error";
import { UseMutationOptions } from "@tanstack/react-query";
import { z } from "zod";

export const RegisterSchema = z.object({
  username: z.string().min(1, "Username is required"),
  // Trim before the format check: mobile keyboards often append a space.
  email: z.string().trim().pipe(z.email("Enter a valid email address")),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

export type RegisterPayload = z.infer<typeof RegisterSchema>;

export const RegisterDefaults = {
  username: "",
  email: "",
  password: "",
} satisfies RegisterPayload;

export interface RegisterProp {
  /** Rejects with `ApiError` on failure; the shell maps it onto the form. */
  registerAction: (payload: RegisterPayload) => Promise<unknown>;
  defaultParams: RegisterPayload;
}

/** The server never echoes the password back. */
export interface RegisterResponse {
  username: string;
  email: string;
}

export type RegisterOptions = UseMutationOptions<RegisterResponse, ApiError, RegisterPayload>;
