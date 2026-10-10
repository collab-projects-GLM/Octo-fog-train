import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "@/client/query-client";
import { AuthProvider } from "@/feature/auth/AuthProvider";
import type { ReactNode } from "react";

/**
 * @argument children - Subtree that gets access to the shared query client and the signed-in user
 * @returns QueryClientProvider bound to the module-level queryClient, with AuthProvider inside it
 */
export default function Providers({ children }: { children: ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>{children}</AuthProvider>
    </QueryClientProvider>
  );
}
