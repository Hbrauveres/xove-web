import type { ReactNode } from "react";
import type { Me } from "@services/xove-api-service";

/**
 * Who is signed in, as far as this page knows; or why it can't tell: the API out of reach (retrying,
 * with when the next try is due, or null once it gave up), or an answer it can't use (`busy` while a
 * pressed try runs and for a moment after it fails).
 */
export type AuthState =
  | { status: "loading" }
  | { status: "signedOut" }
  | { status: "signedIn"; me: Me }
  | { status: "unreachable"; nextTryAt: number | null }
  | { status: "failed"; busy: boolean };

/** What a failed check means. */
export type CheckOutcome = "signedOut" | "unreachable" | "failed";

export type AuthContextValue = {
  state: AuthState;
  /** Asks the API again who is signed in (after requesting access, being approved...). */
  refresh: () => Promise<void>;
  signOut: () => Promise<void>;
};

export type AuthProviderProps = { children: ReactNode };
