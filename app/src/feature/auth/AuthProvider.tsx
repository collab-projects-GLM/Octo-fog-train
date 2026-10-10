import { useQueryClient } from "@tanstack/react-query";
import {
  createContext,
  use,
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import { fetchMe, logout, type Session, type User } from "@/api/auth";
import {
  clearTokens,
  getRefreshToken,
  onSessionExpired,
  saveTokens,
} from "@/api/tokens";

type AuthState =
  | { status: "loading"; user: null }
  | { status: "unauthenticated"; user: null }
  | { status: "authenticated"; user: User };

type AuthContextValue = AuthState & {
  signIn: (session: Session) => Promise<void>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function useAuth(): AuthContextValue {
  const value = use(AuthContext);
  if (!value) throw new Error("useAuth must be used inside <AuthProvider>");
  return value;
}

/**
 * Owns the signed-in user. On launch it restores the session from the stored
 * refresh token; `status` stays "loading" until that settles so the router
 * doesn't flash the login screen at someone who is already signed in.
 */
export function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  const [state, setState] = useState<AuthState>({
    status: "loading",
    user: null,
  });

  useEffect(() => {
    let cancelled = false;

    const restore = async () => {
      // No stored token means nobody was signed in; skip the network.
      if (!(await getRefreshToken())) return null;

      try {
        return await fetchMe();
      } catch {
        // Rejected tokens were already cleared by the client. A network error
        // leaves them in place so the next launch can try again.
        return null;
      }
    };

    restore().then((user) => {
      if (cancelled) return;
      setState(
        user
          ? { status: "authenticated", user }
          : { status: "unauthenticated", user: null },
      );
    });

    return () => {
      cancelled = true;
    };
  }, []);

  // The refresh token was rejected mid-session (expired, or signed out elsewhere).
  useEffect(
    () =>
      onSessionExpired(() => {
        queryClient.clear();
        setState({ status: "unauthenticated", user: null });
      }),
    [queryClient],
  );

  const signIn = useCallback(async (session: Session) => {
    await saveTokens(session.tokens);
    setState({ status: "authenticated", user: session.user });
  }, []);

  const signOut = useCallback(async () => {
    const refresh = await getRefreshToken();

    await clearTokens();
    queryClient.clear();
    setState({ status: "unauthenticated", user: null });

    // Best effort: the user is already signed out locally, so a failure here
    // only means the token stays valid on the server until it expires.
    if (refresh) await logout(refresh).catch(() => {});
  }, [queryClient]);

  const value = useMemo(
    () => ({ ...state, signIn, signOut }),
    [state, signIn, signOut],
  );

  return <AuthContext value={value}>{children}</AuthContext>;
}
