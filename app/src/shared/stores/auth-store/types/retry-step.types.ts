import type { AuthState } from "./auth.types";

/** What a press of Try again does: the state to show, and whether the try it starts was pressed. */
export interface RetryStep {
  state: AuthState;
  pressed: boolean;
}
