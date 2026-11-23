import { useCallback, useMemo } from "react";
import { api } from "@services/xove-api-service";
import type { AuthProviderProps } from "./types/auth.types";
import { AuthContext } from "./hooks/use-auth.hook";
import { useWhoCheck } from "./hooks/use-who-check.hook";
import { checkOutcome } from "./utils/check-outcome.util";

/**
 * Asks the API who is signed in when the page opens (trying again while it can't be reached) and
 * whenever `refresh` is called.
 */
export function AuthProvider({ children }: AuthProviderProps) {
  const { state, setState, retry } = useWhoCheck();

  const refresh = useCallback(async () => {
    try {
      const me = await api.me();
      setState({ status: "signedIn", me });
    } catch (error) {
      // Only "nobody is signed in" signs out; any other failure leaves who's signed in as it was.
      if (checkOutcome(error) === "signedOut") setState({ status: "signedOut" });
      else throw error;
    }
  }, [setState]);

  const signOut = useCallback(async () => {
    try {
      await api.logout();
    } finally {
      setState({ status: "signedOut" });
    }
  }, [setState]);

  const value = useMemo(() => ({ state, refresh, signOut, retry }), [state, refresh, signOut, retry]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
