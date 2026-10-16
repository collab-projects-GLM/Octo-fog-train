import { api } from "@/api/api";
import { useMutation } from "@tanstack/react-query";
import type { LoginOptions, LoginPayload, LoginResponse } from "./login.utils";
import { API_ROUTES } from "@/lib/api-routes";

export function useLogin(options?: LoginOptions) {
  return useMutation({
    ...options,
    mutationFn: (payload: LoginPayload) =>
      api.post<LoginResponse>(API_ROUTES.POST.LOGIN, payload),
  });
}
