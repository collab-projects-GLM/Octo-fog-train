import { useMutation } from "@tanstack/react-query";

import { login } from "@/api/auth";
import { useAuth } from "@/feature/auth/AuthProvider";

export function useLogin() {
  const { signIn } = useAuth();

  return useMutation({ mutationFn: login, onSuccess: signIn });
}
