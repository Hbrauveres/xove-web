import { createContext, useContext } from "react";
import type { AuthContextValue } from "./types/auth.types";

/** Filled by `AuthProvider`. */
export const AuthContext = createContext<AuthContextValue | null>(null);

/** Who is signed in, and the actions on it. Only inside `AuthProvider`. */
export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used inside <AuthProvider>");
  return context;
}
