import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { CHECK_TIMEOUT_MS } from "../constants/auth-check.constants";
import type { AuthState } from "../types/auth.types";
import { nextStep } from "../utils/next-step.util";
import { retryStep } from "../utils/retry-step.util";
import { whoWithin } from "../utils/who-within.util";

/**
 * Asks the API who's signed in when the page opens. Out of reach, it tries again on its own after each
 * of the waits, then stops; nothing a person does makes it try sooner. On a failure it waits for a
 * press, and ignores presses while that try runs and for a moment after it fails again. `retry` is
 * that press: a new round once it stopped, one try on a failure, nothing otherwise. `settle` sets the
 * state from elsewhere (an answer on refresh, signing out), ending any wait first.
 */
export function useWhoCheck() {
  const [state, setState] = useState<AuthState>({ status: "loading" });
  // This mount's run (aborted when the page goes, its checks with it), its one wait in progress (the
  // next try, or the moment after a failed press), and whether a try runs.
  const run = useRef<AbortController | null>(null);
  const wait = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const trying = useRef(false);

  const stopWaiting = useCallback(() => {
    clearTimeout(wait.current);
    wait.current = undefined;
  }, []);

  // `tries`: the retries this round has used; `pressed`: a person asked for this one.
  const attempt = useCallback(function ask(tries: number, pressed = false) {
    const mine = run.current;
    if (!mine) return;
    trying.current = true;
    const settled = () => {
      trying.current = false;
      return !mine.signal.aborted;
    };
    whoWithin(CHECK_TIMEOUT_MS, mine.signal).then(
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
    const mine = new AbortController();
    run.current = mine;
    attempt(0);
    return () => {
      mine.abort();
      run.current = null;
      trying.current = false;
      stopWaiting();
    };
  }, [attempt, stopWaiting]);

  const retry = useCallback(() => {
    const step = trying.current || wait.current !== undefined ? null : retryStep(state, Date.now());
    if (!step) return;
    setState(step.state);
    attempt(0, step.pressed);
  }, [state, attempt]);

  const settle = useCallback(
    (next: AuthState) => {
      stopWaiting();
      setState(next);
    },
    [stopWaiting],
  );

  return useMemo(() => ({ state, settle, retry }), [state, settle, retry]);
}
