import { useCallback, useEffect, useMemo, useState } from "react";
import { api } from "@services/xove-api-service";
import type { AuthProviderProps, AuthState } from "./types/auth.types";
import { AuthContext } from "./hooks/use-auth.hook";
import { checkOutcome } from "./utils/check-outcome.util";

/** Asks the API who is signed in, once at the start and whenever `refresh` is called. */
export function AuthProvider({ children }: AuthProviderProps) {
  const [state, setState] = useState<AuthState>({ status: "loading" });

  const refresh = useCallback(async () => {
    try {
      const me = await api.me();
      setState({ status: "signedIn", me });
    } catch (error) {
      // Only "nobody is signed in" signs out; any other failure leaves who's signed in as it was.
      if (checkOutcome(error) === "signedOut") setState({ status: "signedOut" });
      else throw error;
    }
  }, []);

  const signOut = useCallback(async () => {
    try {
      await api.logout();
    } finally {
      setState({ status: "signedOut" });
    }
  }, []);

  // The first answer: only "nobody is signed in" offers the sign-in; out of reach or failed says so.
  useEffect(() => {
    api.me().then(
      (me) => setState({ status: "signedIn", me }),
      (error: unknown) => {
        const outcome = checkOutcome(error);
        if (outcome === "signedOut") setState({ status: "signedOut" });
        else if (outcome === "unreachable") setState({ status: "unreachable", nextTryAt: null });
        else setState({ status: "failed", busy: false });
      },
    );
  }, []);

  const value = useMemo(() => ({ state, refresh, signOut }), [state, refresh, signOut]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
