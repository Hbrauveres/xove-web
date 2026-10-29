import type { Me } from "@core/api/types/api.types";

/** Who is signed in, as far as this page knows. */
export type AuthState = { status: "loading" } | { status: "signedOut" } | { status: "signedIn"; me: Me };

export type AuthContextValue = {
  state: AuthState;
  /** Asks the API again who is signed in (after requesting access, being approved...). */
  refresh: () => Promise<void>;
  signOut: () => Promise<void>;
};
