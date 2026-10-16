import type { ApiError } from "@/api/error";
import { UseMutationOptions } from "@tanstack/react-query";
import { z } from "zod";

export const LoginSchema = z.object({
  username: z.string().min(1, "Username is required"),
  password: z.string().min(1, "Password is required"),
});

export type LoginPayload = z.infer<typeof LoginSchema>;

export const LoginDefaults = {
  username: "",
  password: "",
} satisfies LoginPayload;

export interface LoginProp {
  /** Rejects with `ApiError` on failure; the shell maps it onto the form. */
  loginAction: (payload: LoginPayload) => Promise<unknown>;
  defaultParams: LoginPayload;
}

export interface LoginResponse {
  access: string;
  refresh: string;
}

export type LoginOptions = UseMutationOptions<LoginResponse, ApiError, LoginPayload>;
