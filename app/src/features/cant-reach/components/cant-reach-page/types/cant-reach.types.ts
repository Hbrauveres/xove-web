import type { AuthState } from "@shared/stores/auth-store";

export interface CantReachProps {
  /** Why it can't tell who's signed in: out of reach (retrying or stopped), or failed. */
  state: Extract<AuthState, { status: "unreachable" | "failed" }>;
  /** Try again: a new round once it stopped, one try after a failure. */
  onRetry: () => void;
}
