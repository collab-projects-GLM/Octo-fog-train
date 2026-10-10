import { useMutation } from "@tanstack/react-query";

import { register } from "@/api/auth";
import { useAuth } from "@/feature/auth/AuthProvider";

export function useRegister() {
  const { signIn } = useAuth();

  return useMutation({ mutationFn: register, onSuccess: signIn });
}
