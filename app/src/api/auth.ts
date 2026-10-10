import type { LoginValues } from "@/schemas/login";
import type { RegisterValues } from "@/schemas/register";

import { request } from "./client";
import type { Tokens } from "./tokens";

export type User = {
  id: number;
  username: string;
  email: string;
  avatar: string;
};

export type Session = { user: User; tokens: Tokens };

export const login = (values: LoginValues) =>
  request<Session>("/api/auth/login/", { method: "POST", body: values });

export const register = ({ username, email, password }: RegisterValues) =>
  request<Session>("/api/auth/register/", {
    method: "POST",
    body: { username, email, password },
  });

export const fetchMe = () => request<User>("/api/auth/me/", { auth: true });

/** Blacklists the refresh token server-side so it can't be used again. */
export const logout = (refresh: string) =>
  request<unknown>("/api/auth/logout/", {
    method: "POST",
    body: { refresh },
  });
