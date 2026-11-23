import { useCallback, useEffect, useRef, useState } from "react";
import { CHECK_TIMEOUT_MS } from "../constants/auth-check.constants";
import type { AuthState } from "../types/auth.types";
import { nextStep } from "../utils/next-step.util";
import { whoWithin } from "../utils/who-within.util";

/**
 * Asks the API who's signed in when the page opens. Out of reach, it tries again on its own after each
 * of the waits, then stops; nothing a person does makes it try sooner. On a failure it waits for a
 * press, and ignores presses while that try runs and for a moment after it fails again. `retry` is
 * that press: a new round once it stopped, one try on a failure, nothing otherwise.
 */
export function useWhoCheck() {
  const [state, setState] = useState<AuthState>({ status: "loading" });
  // The one wait in progress (the next try, or the moment after a failed press), whether a try runs,
  // and whether the page has gone.
  const wait = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const trying = useRef(false);
  const gone = useRef(false);

  // `tries`: the retries this round has used; `pressed`: a person asked for this one.
  const attempt = useCallback(function ask(tries: number, pressed = false) {
    trying.current = true;
    const settled = () => {
      trying.current = false;
      return !gone.current;
    };
    whoWithin(CHECK_TIMEOUT_MS).then(
      (me) => settled() && setState({ status: "signedIn", me }),
      (error: unknown) => {
        if (!settled()) return;
        const step = nextStep(error, tries, pressed, Date.now());
        setState(step.state);
        if (!step.wait) return;
        const then =
          step.wait.then === "tryAgain" ? () => ask(tries + 1) : () => setState({ status: "failed", busy: false });
        wait.current = setTimeout(() => {
          wait.current = undefined;
          then();
        }, step.wait.ms);
      },
    );
  }, []);

  useEffect(() => {
    gone.current = false;
    attempt(0);
    return () => {
      gone.current = true;
      clearTimeout(wait.current);
    };
  }, [attempt]);

  const retry = useCallback(() => {
    if (trying.current || wait.current !== undefined) return;
    if (state.status === "unreachable" && state.nextTryAt === null) {
      setState({ status: "unreachable", nextTryAt: Date.now() });
      attempt(0);
    } else if (state.status === "failed" && !state.busy) {
      setState({ status: "failed", busy: true });
      attempt(0, true);
    }
  }, [state, attempt]);

  return { state, setState, retry };
}
