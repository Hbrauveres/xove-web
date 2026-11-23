import type { AuthState } from "./auth.types";

/** After a failed check: the state to show, and what to wait for before what. */
export interface NextStep {
  state: AuthState;
  wait?: { ms: number; then: "tryAgain" | "endCooldown" } | undefined;
}
