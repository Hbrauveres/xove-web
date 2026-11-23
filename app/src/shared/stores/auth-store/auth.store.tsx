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
  const { state, settle, retry } = useWhoCheck();

  const refresh = useCallback(async () => {
    try {
      const me = await api.me();
      settle({ status: "signedIn", me });
    } catch (error) {
      // Only "nobody is signed in" signs out; any other failure leaves who's signed in as it was.
      if (checkOutcome(error) === "signedOut") settle({ status: "signedOut" });
      else throw error;
    }
  }, [settle]);

  const signOut = useCallback(async () => {
    try {
      await api.logout();
    } finally {
      settle({ status: "signedOut" });
    }
  }, [settle]);

  const value = useMemo(() => ({ state, refresh, signOut, retry }), [state, refresh, signOut, retry]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
