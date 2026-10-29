import { useCallback, useEffect, useMemo, useState } from "react";
import { api, ApiError } from "@services/xove-api-service/xove-api.service";
import { SIGNED_OUT_STATUS } from "@services/xove-api-service/constants/api.constants";
import type { AuthProviderProps, AuthState } from "./types/auth.types";
import { AuthContext } from "./hooks/use-auth.hook";

/** Asks the API who is signed in, once at the start and whenever `refresh` is called. */
export function AuthProvider({ children }: AuthProviderProps) {
  const [state, setState] = useState<AuthState>({ status: "loading" });

  const refresh = useCallback(async () => {
    try {
      const me = await api.me();
      setState({ status: "signedIn", me });
    } catch (error) {
      if (error instanceof ApiError && error.status === SIGNED_OUT_STATUS) {
        setState({ status: "signedOut" });
      } else {
        throw error;
      }
    }
  }, []);

  const signOut = useCallback(async () => {
    try {
      await api.logout();
    } finally {
      setState({ status: "signedOut" });
    }
  }, []);

  // The first answer: any failure counts as signed out, so the home page can offer the sign-in.
  useEffect(() => {
    api.me().then(
      (me) => setState({ status: "signedIn", me }),
      () => setState({ status: "signedOut" }),
    );
  }, []);

  const value = useMemo(() => ({ state, refresh, signOut }), [state, refresh, signOut]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
