import { api } from "@/api/api";
import { useMutation } from "@tanstack/react-query";
import type {
  RegisterOptions,
  RegisterPayload,
  RegisterResponse,
} from "./register.utils";
import { API_ROUTES } from "@/lib/api-routes";

export function useRegister(options?: RegisterOptions) {
  return useMutation({
    ...options,
    mutationFn: (payload: RegisterPayload) =>
      api.post<RegisterResponse>(API_ROUTES.POST.REGISTER, payload),
  });
}
